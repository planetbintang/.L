import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
const scryptAsync=promisify(crypto.scrypt);
import { cancelSale, confirmSale, createSale, findSale, fulfillSale, recordSalePayment, summarizeSales } from './sales-ledger.mjs';

const PORT=Number(process.env.PORT||8787);
const HOST=process.env.HOST||'0.0.0.0';
const DATA_DIR=path.resolve(process.env.DATA_DIR||'./data');
const DATA_FILE=path.join(DATA_DIR,'vendordomain.json');
const ADMIN_TOKEN=process.env.ADMIN_TOKEN||'';
const ALLOWED_ORIGIN=process.env.ALLOWED_ORIGIN||'';
const CF_TOKEN=process.env.CLOUDFLARE_API_TOKEN||'';
const CF_ZONE=process.env.CLOUDFLARE_ZONE_ID||'';
const MAX_BODY=1024*1024;
const RATE_WINDOW_MS=60_000;
const RATE_LIMIT_MAX=Math.max(10,Number(process.env.RATE_LIMIT_MAX||120));
const rateBuckets=new Map();
const authRateBuckets=new Map();
let db={records:[],audit:[],sales:[],users:[],tenants:[],memberships:[],sessions:[],accountDomains:[],accountFiles:[],accountAudit:[]};
if(ADMIN_TOKEN && ADMIN_TOKEN.length<32)throw new Error('ADMIN_TOKEN harus minimal 32 karakter.');
if(!ADMIN_TOKEN)console.warn('ADMIN_TOKEN belum diatur; endpoint /api/* akan menolak seluruh permintaan.');
await mkdir(DATA_DIR,{recursive:true});
try{const loaded=JSON.parse(await readFile(DATA_FILE,'utf8'));if(!loaded||typeof loaded!=='object'||Array.isArray(loaded))throw new Error('Format file database VendorDomain tidak valid.');db={...db,...loaded};for(const key of Object.keys(db))if(!Array.isArray(db[key]))db[key]=[];}catch(e){if(e.code!=='ENOENT')throw e;}
const iso=()=>new Date().toISOString();
let persistQueue=Promise.resolve();
function persist(){
 const snapshot=JSON.stringify(db,null,2);
 const write=persistQueue.catch(()=>{}).then(async()=>{const tmp=DATA_FILE+'.'+crypto.randomUUID()+'.tmp';await writeFile(tmp,snapshot,{mode:0o600});await rename(tmp,DATA_FILE);});
 persistQueue=write;
 return write;
}
function send(res,status,payload){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'",'permissions-policy':'camera=(), microphone=(), geolocation=()'});res.end(JSON.stringify(payload));}
function cors(req,res){
 const origin=req.headers.origin;
 if(origin&&ALLOWED_ORIGIN&&origin!==ALLOWED_ORIGIN)return false;
 if(origin&&ALLOWED_ORIGIN===origin)res.setHeader('access-control-allow-origin',origin);
 res.setHeader('vary','Origin');res.setHeader('access-control-allow-methods','GET,POST,PUT,DELETE,OPTIONS');res.setHeader('access-control-allow-headers','Authorization,Content-Type,X-Request-ID');res.setHeader('access-control-max-age','600');
 return true;
}
function authRateLimited(req){const key=req.socket.remoteAddress||'unknown',now=Date.now();let b=authRateBuckets.get(key);if(!b||now-b.start>=15*60_000){b={start:now,count:0};authRateBuckets.set(key,b);}b.count++;if(authRateBuckets.size>5000)for(const [k,v] of authRateBuckets)if(now-v.start>=15*60_000)authRateBuckets.delete(k);return b.count>15;}
function rateLimited(req){
 const key=req.socket.remoteAddress||'unknown',now=Date.now();
 let bucket=rateBuckets.get(key);
 if(!bucket||now-bucket.start>=RATE_WINDOW_MS){bucket={start:now,count:0};rateBuckets.set(key,bucket);}
 bucket.count++;
 if(rateBuckets.size>5000)for(const [k,v] of rateBuckets)if(now-v.start>=RATE_WINDOW_MS)rateBuckets.delete(k);
 return bucket.count>RATE_LIMIT_MAX;
}
async function body(req){
 const chunks=[];let size=0;
 for await(const c of req){size+=c.length;if(size>MAX_BODY)throw Object.assign(new Error('Request body terlalu besar'),{status:413});chunks.push(c);}
 try{return size?JSON.parse(Buffer.concat(chunks).toString('utf8')):{};}catch{throw Object.assign(new Error('JSON tidak valid'),{status:400});}
}
function authorized(req){const supplied=Buffer.from(String(req.headers.authorization||'').replace(/^Bearer\s+/i,''));const expected=Buffer.from(ADMIN_TOKEN);return Boolean(ADMIN_TOKEN)&&supplied.length===expected.length&&crypto.timingSafeEqual(supplied,expected);}

const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const safeUser=user=>({id:user.id,email:user.email,displayName:user.displayName,status:user.status,profile:user.profile||{},createdAt:user.createdAt});
async function hashPassword(password){const salt=crypto.randomBytes(16).toString('hex');const key=await scryptAsync(password,salt,64);return ['scrypt',salt,Buffer.from(key).toString('hex')].join('$');}
async function verifyPassword(password,stored){try{const [scheme,salt,hex]=String(stored||'').split('$');if(scheme!=='scrypt'||!salt||!hex)return false;const expected=Buffer.from(hex,'hex'),actual=Buffer.from(await scryptAsync(password,salt,expected.length));return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);}catch{return false;}}
function sessionFor(req){const token=String(req.headers.authorization||'').replace(/^Bearer /i,'').trim();if(!token||token.length<40)return null;const session=db.sessions.find(x=>x.tokenHash===sha256(token));if(!session)return null;if(Date.parse(session.expiresAt)<=Date.now()){db.sessions=db.sessions.filter(x=>x.id!==session.id);return null;}const user=db.users.find(x=>x.id===session.userId&&x.status==='active');if(!user)return null;const membership=db.memberships.find(x=>x.userId===user.id),tenant=membership&&db.tenants.find(x=>x.id===membership.tenantId);if(!tenant)return null;return {token,session,user,tenant,membership};}
async function createSession(user){const token=crypto.randomBytes(32).toString('hex'),createdAt=iso(),expiresAt=new Date(Date.now()+30*86400000).toISOString();db.sessions=db.sessions.filter(x=>Date.parse(x.expiresAt)>Date.now());db.sessions.push({id:crypto.randomUUID(),userId:user.id,tokenHash:sha256(token),createdAt,expiresAt});await persist();return {token,expiresAt};}
async function accountAudit(auth,action,resourceType,resourceId,metadata={}){db.accountAudit.unshift({id:crypto.randomUUID(),tenantId:auth.tenant.id,actorId:auth.user.id,action,resourceType,resourceId:resourceId||null,metadata,createdAt:iso()});db.accountAudit=db.accountAudit.slice(0,2000);await persist();}
function tenantRole(auth){return auth.membership?.role||'viewer';}
function accountSlug(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'workspace';}
async function audit(action,detail){db.audit.unshift({id:crypto.randomUUID(),at:iso(),action,detail});db.audit=db.audit.slice(0,1000);await persist();}
function validateDomain(v){const s=String(v||'').trim().toLowerCase();if(s.length>253||s.length<3||!s.includes('.'))return {valid:false,normalized:s,reason:'Domain harus berupa nama lengkap dengan titik.'};const labels=s.split('.');const ok=labels.every(x=>x.length>=1&&x.length<=63&&/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x));return {valid:ok,normalized:s,reason:ok?'Format nama domain valid.':'Label domain tidak memenuhi format DNS.'};}
async function cf(pathname,method='GET',payload){if(!CF_TOKEN||!CF_ZONE)throw Object.assign(new Error('Integrasi Cloudflare belum dikonfigurasi; set CLOUDFLARE_API_TOKEN dan CLOUDFLARE_ZONE_ID di lingkungan server.'),{status:503});const r=await fetch('https://api.cloudflare.com/client/v4'+pathname,{method,headers:{authorization:'Bearer '+CF_TOKEN,'content-type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})});const j=await r.json();if(!r.ok||!j.success)throw Object.assign(new Error(j.errors?.map(x=>x.message).join('; ')||'Cloudflare API gagal'),{status:r.status>=400&&r.status<600?r.status:502});return j.result;}
const server=http.createServer(async(req,res)=>{
 const requestId=String(req.headers['x-request-id']||crypto.randomUUID()).slice(0,100);
 res.setHeader('x-request-id',requestId);
 if(!cors(req,res))return send(res,403,{error:'Origin tidak diizinkan',requestId});
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 try{const u=new URL(req.url,'http://localhost');const p=u.pathname;
 if(p.startsWith('/api/')&&rateLimited(req))return send(res,429,{error:'Batas permintaan terlampaui. Coba kembali setelah satu menit.',requestId});
if(req.method==='GET'&&p==='/health')return send(res,200,{ok:true,service:'VendorDomain API',version:'1.0.0',storage:'persistent-file',cloudflareConfigured:Boolean(CF_TOKEN&&CF_ZONE),time:iso()});
if(req.method==='POST'&&p==='/api/domain/validate'){const b=await body(req);return send(res,200,validateDomain(b.domain));}

if((req.method==='POST'&&(p==='/api/auth/register'||p==='/api/auth/login'))&&authRateLimited(req))return send(res,429,{error:'Terlalu banyak percobaan autentikasi. Coba kembali setelah 15 menit.',requestId});
if(req.method==='POST'&&p==='/api/auth/register'){
 const b=await body(req),email=String(b.email||'').trim().toLowerCase(),displayName=String(b.displayName||'').trim(),password=String(b.password||'');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return send(res,400,{error:'Alamat email tidak valid.'});
 if(displayName.length<2||displayName.length>100)return send(res,400,{error:'Nama profil harus berisi 2–100 karakter.'});
 if(password.length<12||password.length>128)return send(res,400,{error:'Kata sandi harus berisi 12–128 karakter.'});
 if(db.users.some(x=>x.email===email))return send(res,409,{error:'Email sudah terdaftar. Silakan login.'});
 const now=iso(),user={id:crypto.randomUUID(),email,displayName,status:'active',passwordHash:await hashPassword(password),profile:{company:'',phone:'',timezone:'Asia/Jakarta'},createdAt:now,updatedAt:now};
 const tenant={id:crypto.randomUUID(),name:String(b.workspaceName||displayName+' Workspace').trim().slice(0,160),slug:accountSlug(b.workspaceName||displayName),createdAt:now};
 if(db.tenants.some(x=>x.slug===tenant.slug))tenant.slug=tenant.slug+'-'+crypto.randomBytes(3).toString('hex');
 db.users.push(user);db.tenants.push(tenant);db.memberships.push({tenantId:tenant.id,userId:user.id,role:'owner',createdAt:now});
 const issued=await createSession(user),auth={user,tenant,membership:db.memberships.at(-1)};
 await accountAudit(auth,'account.register','tenant',tenant.id,{email});
 return send(res,201,{token:issued.token,expiresAt:issued.expiresAt,user:safeUser(user),tenant,role:'owner'});
}
if(req.method==='POST'&&p==='/api/auth/login'){
 const b=await body(req),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||''),user=db.users.find(x=>x.email===email);
 if(!user||user.status!=='active'||!(await verifyPassword(password,user.passwordHash)))return send(res,401,{error:'Email atau kata sandi tidak sesuai.'});
 const issued=await createSession(user),membership=db.memberships.find(x=>x.userId===user.id),tenant=membership&&db.tenants.find(x=>x.id===membership.tenantId);
 return send(res,200,{token:issued.token,expiresAt:issued.expiresAt,user:safeUser(user),tenant,role:membership?.role||'viewer'});
}
const accountRoute=p.startsWith('/api/account/')||p==='/api/auth/me'||p==='/api/auth/logout';
if(accountRoute){
 const auth=sessionFor(req);
 if(!auth)return send(res,401,{error:'Sesi akun tidak aktif. Silakan login kembali.',requestId});
 if(req.method==='GET'&&p==='/api/auth/me')return send(res,200,{user:safeUser(auth.user),tenant:auth.tenant,role:tenantRole(auth),expiresAt:auth.session.expiresAt});
 if(req.method==='POST'&&p==='/api/auth/logout'){db.sessions=db.sessions.filter(x=>x.id!==auth.session.id);await accountAudit(auth,'account.logout','session',auth.session.id);return send(res,200,{loggedOut:true});}
 if(req.method==='GET'&&p==='/api/account/overview'){
  const domains=db.accountDomains.filter(x=>x.tenantId===auth.tenant.id),files=db.accountFiles.filter(x=>x.tenantId===auth.tenant.id),members=db.memberships.filter(x=>x.tenantId===auth.tenant.id);
  return send(res,200,{tenant:auth.tenant,role:tenantRole(auth),counts:{domains:domains.length,activeDomains:domains.filter(x=>x.status==='active').length,files:files.length,members:members.length,sessions:db.sessions.filter(x=>x.userId===auth.user.id&&Date.parse(x.expiresAt)>Date.now()).length},recentActivity:db.accountAudit.filter(x=>x.tenantId===auth.tenant.id).slice(0,8)});
 }
 if(req.method==='GET'&&p==='/api/account/profile')return send(res,200,{user:safeUser(auth.user),tenant:auth.tenant,role:tenantRole(auth)});
 if(req.method==='PUT'&&p==='/api/account/profile'){
  const b=await body(req),name=b.displayName===undefined?auth.user.displayName:String(b.displayName).trim(),profile={...(auth.user.profile||{})};
  if(name.length<2||name.length>100)return send(res,400,{error:'Nama profil harus berisi 2–100 karakter.'});
  for(const key of ['company','phone','timezone'])if(b[key]!==undefined)profile[key]=String(b[key]).trim().slice(0,160);
  auth.user.displayName=name;auth.user.profile=profile;auth.user.updatedAt=iso();await accountAudit(auth,'profile.update','user',auth.user.id,{fields:Object.keys(b)});
  return send(res,200,{user:safeUser(auth.user)});
 }
 if(req.method==='POST'&&p==='/api/account/password'){
  const b=await body(req);if(!(await verifyPassword(String(b.currentPassword||''),auth.user.passwordHash)))return send(res,401,{error:'Kata sandi saat ini tidak sesuai.'});
  const next=String(b.newPassword||'');if(next.length<12||next.length>128)return send(res,400,{error:'Kata sandi baru harus berisi 12–128 karakter.'});
  auth.user.passwordHash=await hashPassword(next);auth.user.updatedAt=iso();db.sessions=db.sessions.filter(x=>x.userId!==auth.user.id||x.id===auth.session.id);await accountAudit(auth,'password.change','user',auth.user.id);return send(res,200,{updated:true});
 }
 if(p==='/api/account/domains'&&req.method==='GET')return send(res,200,{domains:db.accountDomains.filter(x=>x.tenantId===auth.tenant.id)});
 if(p==='/api/account/domains'&&req.method==='POST'){
  const b=await body(req),v=validateDomain(b.domain);if(!v.valid)return send(res,400,{error:v.reason});
  if(db.accountDomains.some(x=>x.tenantId===auth.tenant.id&&x.fqdn===v.normalized))return send(res,409,{error:'Domain sudah ada pada workspace ini.'});
  const domain={id:crypto.randomUUID(),tenantId:auth.tenant.id,fqdn:v.normalized,status:'draft',purpose:String(b.purpose||'website').slice(0,40),createdAt:iso(),createdBy:auth.user.id};db.accountDomains.unshift(domain);await accountAudit(auth,'domain.add','domain',domain.id,{fqdn:domain.fqdn});return send(res,201,{domain});
 }
 if(p==='/api/account/files'&&req.method==='GET')return send(res,200,{files:db.accountFiles.filter(x=>x.tenantId===auth.tenant.id)});
 if(p==='/api/account/files'&&req.method==='POST'){
  const b=await body(req),name=String(b.name||'').trim().replace(/[\\/\\\\]/g,'-');if(!name||name.length>180)return send(res,400,{error:'Nama berkas harus berisi 1–180 karakter.'});
  const size=Number(b.size||0);if(!Number.isSafeInteger(size)||size<0||size>50*1024*1024)return send(res,400,{error:'Ukuran metadata berkas harus 0–50 MB.'});
  const file={id:crypto.randomUUID(),tenantId:auth.tenant.id,name,type:String(b.type||'document').slice(0,50),size,folder:String(b.folder||'Dokumen Akun').replace(/[\\/\\\\]/g,' ').slice(0,80),managerPath:'/File Manager/VendorDomain/'+auth.tenant.id+'/'+name,storageMode:'metadata-reference',createdAt:iso(),createdBy:auth.user.id};
  db.accountFiles.unshift(file);await accountAudit(auth,'file.register','file',file.id,{name:file.name,type:file.type});return send(res,201,{file});
 }
 if(p==='/api/account/members'&&req.method==='GET'){
  const members=db.memberships.filter(x=>x.tenantId===auth.tenant.id).map(m=>{const u=db.users.find(x=>x.id===m.userId);return u?{id:u.id,email:u.email,displayName:u.displayName,status:u.status,role:m.role,joinedAt:m.createdAt}:null}).filter(Boolean);
  return send(res,200,{members,canManage:['owner','admin'].includes(tenantRole(auth))});
 }
 const roleRoute=p.match(/^\/api\/account\/members\/([a-f0-9-]{36})\/role$/i);
 if(roleRoute&&req.method==='PUT'){
  const currentRole=tenantRole(auth);if(!['owner','admin'].includes(currentRole))return send(res,403,{error:'Hak akses manajemen anggota diperlukan.'});
  const b=await body(req),target=db.memberships.find(x=>x.tenantId===auth.tenant.id&&x.userId===roleRoute[1]);if(!target)return send(res,404,{error:'Anggota tidak ditemukan.'});
  const next=String(b.role||'');if(!['admin','operator','viewer'].includes(next))return send(res,400,{error:'Peran tidak valid.'});
  if(target.role==='owner'||(target.userId===auth.user.id&&currentRole==='owner'))return send(res,403,{error:'Pemilik workspace tidak dapat mengubah peran dirinya sendiri atau pemilik lain.'});
  if(currentRole==='admin'&&next==='admin')return send(res,403,{error:'Admin tidak dapat memberikan peran admin.'});
  target.role=next;await accountAudit(auth,'member.role.update','membership',target.userId,{role:next});return send(res,200,{updated:true,role:next});
 }
 return send(res,404,{error:'Endpoint akun tidak ditemukan.'});
}
if(p.startsWith('/api/')&&!authorized(req))return send(res,401,{error:'Unauthorized. Sesi server yang valid diperlukan.',requestId});
if(req.method==='GET'&&p==='/api/sales/summary')return send(res,200,summarizeSales(db.sales));
if(req.method==='GET'&&p==='/api/sales')return send(res,200,{sales:db.sales});
if(req.method==='POST'&&p==='/api/sales'){
 const sale=createSale(db.sales,await body(req));
 await audit('sale.create',{saleId:sale.id,total:sale.total,currency:sale.currency});
 return send(res,201,{sale});
}
const saleRoute=p.match(/^\/api\/sales\/([a-f0-9-]{36})(?:\/(confirm|fulfill|payments|cancel))?$/i);
if(saleRoute){
 const id=saleRoute[1],action=saleRoute[2]||'';
 if(req.method==='GET'&&!action)return send(res,200,{sale:findSale(db.sales,id)});
 if(req.method==='POST'&&action==='confirm'){
  const sale=confirmSale(db.sales,id);
  await audit('sale.confirm',{saleId:sale.id,total:sale.total});
  return send(res,200,{sale});
 }
 if(req.method==='POST'&&action==='fulfill'){
  const sale=fulfillSale(db.sales,id);
  await audit('sale.fulfill',{saleId:sale.id,total:sale.total});
  return send(res,200,{sale});
 }
 if(req.method==='POST'&&action==='payments'){
  const {sale,payment}=recordSalePayment(db.sales,id,await body(req));
  await audit('sale.payment.record',{saleId:sale.id,paymentId:payment.id,amount:payment.amount});
  return send(res,201,{sale,payment});
 }
 if(req.method==='POST'&&action==='cancel'){
  const sale=cancelSale(db.sales,id);
  await audit('sale.cancel',{saleId:sale.id});
  return send(res,200,{sale});
 }
}
if(req.method==='GET'&&p==='/api/records')return send(res,200,{records:db.records});
if(req.method==='POST'&&p==='/api/records'){const b=await body(req);if(!String(b.title||'').trim())return send(res,400,{error:'title wajib diisi'});const r={id:crypto.randomUUID(),title:String(b.title).slice(0,200),type:String(b.type||'note').slice(0,60),data:b.data??{},createdAt:iso(),updatedAt:iso()};db.records.unshift(r);await audit('record.create',{id:r.id,type:r.type});await persist();return send(res,201,{record:r});}
const rec=p.match(/^\/api\/records\/([a-f0-9-]+)$/i);
if(rec&&req.method==='PUT'){const b=await body(req),r=db.records.find(x=>x.id===rec[1]);if(!r)return send(res,404,{error:'Record tidak ditemukan'});if(b.title!==undefined)r.title=String(b.title).slice(0,200);if(b.type!==undefined)r.type=String(b.type).slice(0,60);if(b.data!==undefined)r.data=b.data;r.updatedAt=iso();await audit('record.update',{id:r.id});await persist();return send(res,200,{record:r});}
if(rec&&req.method==='DELETE'){const i=db.records.findIndex(x=>x.id===rec[1]);if(i<0)return send(res,404,{error:'Record tidak ditemukan'});db.records.splice(i,1);await audit('record.delete',{id:rec[1]});await persist();return send(res,200,{deleted:true,id:rec[1]});}
if(req.method==='GET'&&p==='/api/audit')return send(res,200,{events:db.audit});
if(req.method==='GET'&&p==='/api/dns/records'){const q=new URLSearchParams({per_page:'100'});if(u.searchParams.has('name'))q.set('name',u.searchParams.get('name'));const records=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records?'+q);return send(res,200,{records});}
if(req.method==='POST'&&p==='/api/dns/records'){const b=await body(req);if(!['A','AAAA','CNAME','TXT','MX','NS','SRV','CAA'].includes(String(b.type||'').toUpperCase()))return send(res,400,{error:'Tipe DNS tidak didukung'});if(!b.name||!b.content)return send(res,400,{error:'name dan content wajib diisi'});const result=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records','POST',{type:String(b.type).toUpperCase(),name:String(b.name),content:String(b.content),ttl:Number(b.ttl||1),...(b.priority!==undefined?{priority:Number(b.priority)}:{}),...(b.proxied!==undefined?{proxied:Boolean(b.proxied)}:{})});await audit('dns.create',{id:result.id,type:result.type,name:result.name});return send(res,201,{record:result});}
const dns=p.match(/^\/api\/dns\/records\/([a-f0-9]+)$/i);
if(dns&&req.method==='DELETE'){const result=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records/'+encodeURIComponent(dns[1]),'DELETE');await audit('dns.delete',{id:dns[1]});return send(res,200,{deleted:true,result});}
return send(res,404,{error:'Endpoint tidak ditemukan'});
}catch(e){const status=e.status||500;if(status>=500)console.error('Request '+requestId+' gagal:',e.message);return send(res,status,{error:status>=500?'Kesalahan internal server':(e.message||'Permintaan gagal'),requestId});}});
server.listen(PORT,HOST,()=>console.log('VendorDomain API listening on '+HOST+':'+PORT));
+salt+'action,detail){db.audit.unshift({id:crypto.randomUUID(),at:iso(),action,detail});db.audit=db.audit.slice(0,1000);await persist();}
function validateDomain(v){const s=String(v||'').trim().toLowerCase();if(s.length>253||s.length<3||!s.includes('.'))return {valid:false,normalized:s,reason:'Domain harus berupa nama lengkap dengan titik.'};const labels=s.split('.');const ok=labels.every(x=>x.length>=1&&x.length<=63&&/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x));return {valid:ok,normalized:s,reason:ok?'Format nama domain valid.':'Label domain tidak memenuhi format DNS.'};}
async function cf(pathname,method='GET',payload){if(!CF_TOKEN||!CF_ZONE)throw Object.assign(new Error('Integrasi Cloudflare belum dikonfigurasi; set CLOUDFLARE_API_TOKEN dan CLOUDFLARE_ZONE_ID di lingkungan server.'),{status:503});const r=await fetch('https://api.cloudflare.com/client/v4'+pathname,{method,headers:{authorization:'Bearer '+CF_TOKEN,'content-type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})});const j=await r.json();if(!r.ok||!j.success)throw Object.assign(new Error(j.errors?.map(x=>x.message).join('; ')||'Cloudflare API gagal'),{status:r.status>=400&&r.status<600?r.status:502});return j.result;}
const server=http.createServer(async(req,res)=>{
 const requestId=String(req.headers['x-request-id']||crypto.randomUUID()).slice(0,100);
 res.setHeader('x-request-id',requestId);
 if(!cors(req,res))return send(res,403,{error:'Origin tidak diizinkan',requestId});
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 try{const u=new URL(req.url,'http://localhost');const p=u.pathname;
 if(p.startsWith('/api/')&&rateLimited(req))return send(res,429,{error:'Batas permintaan terlampaui. Coba kembali setelah satu menit.',requestId});
if(req.method==='GET'&&p==='/health')return send(res,200,{ok:true,service:'VendorDomain API',version:'1.0.0',storage:'persistent-file',cloudflareConfigured:Boolean(CF_TOKEN&&CF_ZONE),time:iso()});
if(req.method==='POST'&&p==='/api/domain/validate'){const b=await body(req);return send(res,200,validateDomain(b.domain));}
if(p.startsWith('/api/')&&!authorized(req))return send(res,401,{error:'Unauthorized. Sesi server yang valid diperlukan.',requestId});
if(req.method==='GET'&&p==='/api/sales/summary')return send(res,200,summarizeSales(db.sales));
if(req.method==='GET'&&p==='/api/sales')return send(res,200,{sales:db.sales});
if(req.method==='POST'&&p==='/api/sales'){
 const sale=createSale(db.sales,await body(req));
 await audit('sale.create',{saleId:sale.id,total:sale.total,currency:sale.currency});
 return send(res,201,{sale});
}
const saleRoute=p.match(/^\/api\/sales\/([a-f0-9-]{36})(?:\/(confirm|fulfill|payments|cancel))?$/i);
if(saleRoute){
 const id=saleRoute[1],action=saleRoute[2]||'';
 if(req.method==='GET'&&!action)return send(res,200,{sale:findSale(db.sales,id)});
 if(req.method==='POST'&&action==='confirm'){
  const sale=confirmSale(db.sales,id);
  await audit('sale.confirm',{saleId:sale.id,total:sale.total});
  return send(res,200,{sale});
 }
 if(req.method==='POST'&&action==='fulfill'){
  const sale=fulfillSale(db.sales,id);
  await audit('sale.fulfill',{saleId:sale.id,total:sale.total});
  return send(res,200,{sale});
 }
 if(req.method==='POST'&&action==='payments'){
  const {sale,payment}=recordSalePayment(db.sales,id,await body(req));
  await audit('sale.payment.record',{saleId:sale.id,paymentId:payment.id,amount:payment.amount});
  return send(res,201,{sale,payment});
 }
 if(req.method==='POST'&&action==='cancel'){
  const sale=cancelSale(db.sales,id);
  await audit('sale.cancel',{saleId:sale.id});
  return send(res,200,{sale});
 }
}
if(req.method==='GET'&&p==='/api/records')return send(res,200,{records:db.records});
if(req.method==='POST'&&p==='/api/records'){const b=await body(req);if(!String(b.title||'').trim())return send(res,400,{error:'title wajib diisi'});const r={id:crypto.randomUUID(),title:String(b.title).slice(0,200),type:String(b.type||'note').slice(0,60),data:b.data??{},createdAt:iso(),updatedAt:iso()};db.records.unshift(r);await audit('record.create',{id:r.id,type:r.type});await persist();return send(res,201,{record:r});}
const rec=p.match(/^\/api\/records\/([a-f0-9-]+)$/i);
if(rec&&req.method==='PUT'){const b=await body(req),r=db.records.find(x=>x.id===rec[1]);if(!r)return send(res,404,{error:'Record tidak ditemukan'});if(b.title!==undefined)r.title=String(b.title).slice(0,200);if(b.type!==undefined)r.type=String(b.type).slice(0,60);if(b.data!==undefined)r.data=b.data;r.updatedAt=iso();await audit('record.update',{id:r.id});await persist();return send(res,200,{record:r});}
if(rec&&req.method==='DELETE'){const i=db.records.findIndex(x=>x.id===rec[1]);if(i<0)return send(res,404,{error:'Record tidak ditemukan'});db.records.splice(i,1);await audit('record.delete',{id:rec[1]});await persist();return send(res,200,{deleted:true,id:rec[1]});}
if(req.method==='GET'&&p==='/api/audit')return send(res,200,{events:db.audit});
if(req.method==='GET'&&p==='/api/dns/records'){const q=new URLSearchParams({per_page:'100'});if(u.searchParams.has('name'))q.set('name',u.searchParams.get('name'));const records=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records?'+q);return send(res,200,{records});}
if(req.method==='POST'&&p==='/api/dns/records'){const b=await body(req);if(!['A','AAAA','CNAME','TXT','MX','NS','SRV','CAA'].includes(String(b.type||'').toUpperCase()))return send(res,400,{error:'Tipe DNS tidak didukung'});if(!b.name||!b.content)return send(res,400,{error:'name dan content wajib diisi'});const result=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records','POST',{type:String(b.type).toUpperCase(),name:String(b.name),content:String(b.content),ttl:Number(b.ttl||1),...(b.priority!==undefined?{priority:Number(b.priority)}:{}),...(b.proxied!==undefined?{proxied:Boolean(b.proxied)}:{})});await audit('dns.create',{id:result.id,type:result.type,name:result.name});return send(res,201,{record:result});}
const dns=p.match(/^\/api\/dns\/records\/([a-f0-9]+)$/i);
if(dns&&req.method==='DELETE'){const result=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records/'+encodeURIComponent(dns[1]),'DELETE');await audit('dns.delete',{id:dns[1]});return send(res,200,{deleted:true,result});}
return send(res,404,{error:'Endpoint tidak ditemukan'});
}catch(e){const status=e.status||500;if(status>=500)console.error('Request '+requestId+' gagal:',e.message);return send(res,status,{error:status>=500?'Kesalahan internal server':(e.message||'Permintaan gagal'),requestId});}});
server.listen(PORT,HOST,()=>console.log('VendorDomain API listening on '+HOST+':'+PORT));
+Buffer.from(key).toString('hex');}
async function verifyPassword(password,stored){try{const [scheme,salt,hex]=String(stored||'').split('action,detail){db.audit.unshift({id:crypto.randomUUID(),at:iso(),action,detail});db.audit=db.audit.slice(0,1000);await persist();}
function validateDomain(v){const s=String(v||'').trim().toLowerCase();if(s.length>253||s.length<3||!s.includes('.'))return {valid:false,normalized:s,reason:'Domain harus berupa nama lengkap dengan titik.'};const labels=s.split('.');const ok=labels.every(x=>x.length>=1&&x.length<=63&&/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x));return {valid:ok,normalized:s,reason:ok?'Format nama domain valid.':'Label domain tidak memenuhi format DNS.'};}
async function cf(pathname,method='GET',payload){if(!CF_TOKEN||!CF_ZONE)throw Object.assign(new Error('Integrasi Cloudflare belum dikonfigurasi; set CLOUDFLARE_API_TOKEN dan CLOUDFLARE_ZONE_ID di lingkungan server.'),{status:503});const r=await fetch('https://api.cloudflare.com/client/v4'+pathname,{method,headers:{authorization:'Bearer '+CF_TOKEN,'content-type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})});const j=await r.json();if(!r.ok||!j.success)throw Object.assign(new Error(j.errors?.map(x=>x.message).join('; ')||'Cloudflare API gagal'),{status:r.status>=400&&r.status<600?r.status:502});return j.result;}
const server=http.createServer(async(req,res)=>{
 const requestId=String(req.headers['x-request-id']||crypto.randomUUID()).slice(0,100);
 res.setHeader('x-request-id',requestId);
 if(!cors(req,res))return send(res,403,{error:'Origin tidak diizinkan',requestId});
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 try{const u=new URL(req.url,'http://localhost');const p=u.pathname;
 if(p.startsWith('/api/')&&rateLimited(req))return send(res,429,{error:'Batas permintaan terlampaui. Coba kembali setelah satu menit.',requestId});
if(req.method==='GET'&&p==='/health')return send(res,200,{ok:true,service:'VendorDomain API',version:'1.0.0',storage:'persistent-file',cloudflareConfigured:Boolean(CF_TOKEN&&CF_ZONE),time:iso()});
if(req.method==='POST'&&p==='/api/domain/validate'){const b=await body(req);return send(res,200,validateDomain(b.domain));}
if(p.startsWith('/api/')&&!authorized(req))return send(res,401,{error:'Unauthorized. Sesi server yang valid diperlukan.',requestId});
if(req.method==='GET'&&p==='/api/sales/summary')return send(res,200,summarizeSales(db.sales));
if(req.method==='GET'&&p==='/api/sales')return send(res,200,{sales:db.sales});
if(req.method==='POST'&&p==='/api/sales'){
 const sale=createSale(db.sales,await body(req));
 await audit('sale.create',{saleId:sale.id,total:sale.total,currency:sale.currency});
 return send(res,201,{sale});
}
const saleRoute=p.match(/^\/api\/sales\/([a-f0-9-]{36})(?:\/(confirm|fulfill|payments|cancel))?$/i);
if(saleRoute){
 const id=saleRoute[1],action=saleRoute[2]||'';
 if(req.method==='GET'&&!action)return send(res,200,{sale:findSale(db.sales,id)});
 if(req.method==='POST'&&action==='confirm'){
  const sale=confirmSale(db.sales,id);
  await audit('sale.confirm',{saleId:sale.id,total:sale.total});
  return send(res,200,{sale});
 }
 if(req.method==='POST'&&action==='fulfill'){
  const sale=fulfillSale(db.sales,id);
  await audit('sale.fulfill',{saleId:sale.id,total:sale.total});
  return send(res,200,{sale});
 }
 if(req.method==='POST'&&action==='payments'){
  const {sale,payment}=recordSalePayment(db.sales,id,await body(req));
  await audit('sale.payment.record',{saleId:sale.id,paymentId:payment.id,amount:payment.amount});
  return send(res,201,{sale,payment});
 }
 if(req.method==='POST'&&action==='cancel'){
  const sale=cancelSale(db.sales,id);
  await audit('sale.cancel',{saleId:sale.id});
  return send(res,200,{sale});
 }
}
if(req.method==='GET'&&p==='/api/records')return send(res,200,{records:db.records});
if(req.method==='POST'&&p==='/api/records'){const b=await body(req);if(!String(b.title||'').trim())return send(res,400,{error:'title wajib diisi'});const r={id:crypto.randomUUID(),title:String(b.title).slice(0,200),type:String(b.type||'note').slice(0,60),data:b.data??{},createdAt:iso(),updatedAt:iso()};db.records.unshift(r);await audit('record.create',{id:r.id,type:r.type});await persist();return send(res,201,{record:r});}
const rec=p.match(/^\/api\/records\/([a-f0-9-]+)$/i);
if(rec&&req.method==='PUT'){const b=await body(req),r=db.records.find(x=>x.id===rec[1]);if(!r)return send(res,404,{error:'Record tidak ditemukan'});if(b.title!==undefined)r.title=String(b.title).slice(0,200);if(b.type!==undefined)r.type=String(b.type).slice(0,60);if(b.data!==undefined)r.data=b.data;r.updatedAt=iso();await audit('record.update',{id:r.id});await persist();return send(res,200,{record:r});}
if(rec&&req.method==='DELETE'){const i=db.records.findIndex(x=>x.id===rec[1]);if(i<0)return send(res,404,{error:'Record tidak ditemukan'});db.records.splice(i,1);await audit('record.delete',{id:rec[1]});await persist();return send(res,200,{deleted:true,id:rec[1]});}
if(req.method==='GET'&&p==='/api/audit')return send(res,200,{events:db.audit});
if(req.method==='GET'&&p==='/api/dns/records'){const q=new URLSearchParams({per_page:'100'});if(u.searchParams.has('name'))q.set('name',u.searchParams.get('name'));const records=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records?'+q);return send(res,200,{records});}
if(req.method==='POST'&&p==='/api/dns/records'){const b=await body(req);if(!['A','AAAA','CNAME','TXT','MX','NS','SRV','CAA'].includes(String(b.type||'').toUpperCase()))return send(res,400,{error:'Tipe DNS tidak didukung'});if(!b.name||!b.content)return send(res,400,{error:'name dan content wajib diisi'});const result=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records','POST',{type:String(b.type).toUpperCase(),name:String(b.name),content:String(b.content),ttl:Number(b.ttl||1),...(b.priority!==undefined?{priority:Number(b.priority)}:{}),...(b.proxied!==undefined?{proxied:Boolean(b.proxied)}:{})});await audit('dns.create',{id:result.id,type:result.type,name:result.name});return send(res,201,{record:result});}
const dns=p.match(/^\/api\/dns\/records\/([a-f0-9]+)$/i);
if(dns&&req.method==='DELETE'){const result=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records/'+encodeURIComponent(dns[1]),'DELETE');await audit('dns.delete',{id:dns[1]});return send(res,200,{deleted:true,result});}
return send(res,404,{error:'Endpoint tidak ditemukan'});
}catch(e){const status=e.status||500;if(status>=500)console.error('Request '+requestId+' gagal:',e.message);return send(res,status,{error:status>=500?'Kesalahan internal server':(e.message||'Permintaan gagal'),requestId});}});
server.listen(PORT,HOST,()=>console.log('VendorDomain API listening on '+HOST+':'+PORT));
);if(scheme!=='scrypt'||!salt||!hex)return false;const expected=Buffer.from(hex,'hex'),actual=Buffer.from(await scryptAsync(password,salt,expected.length));return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);}catch{return false;}}
function sessionFor(req){const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();if(!token||token.length<40)return null;const session=db.sessions.find(x=>x.tokenHash===sha256(token));if(!session)return null;if(Date.parse(session.expiresAt)<=Date.now()){db.sessions=db.sessions.filter(x=>x.id!==session.id);return null;}const user=db.users.find(x=>x.id===session.userId&&x.status==='active');if(!user)return null;const membership=db.memberships.find(x=>x.userId===user.id),tenant=membership&&db.tenants.find(x=>x.id===membership.tenantId);if(!tenant)return null;return {token,session,user,tenant,membership};}
async function createSession(user){const token=crypto.randomBytes(32).toString('hex'),createdAt=iso(),expiresAt=new Date(Date.now()+30*86400000).toISOString();db.sessions=db.sessions.filter(x=>Date.parse(x.expiresAt)>Date.now());db.sessions.push({id:crypto.randomUUID(),userId:user.id,tokenHash:sha256(token),createdAt,expiresAt});await persist();return {token,expiresAt};}
async function accountAudit(auth,action,resourceType,resourceId,metadata={}){db.accountAudit.unshift({id:crypto.randomUUID(),tenantId:auth.tenant.id,actorId:auth.user.id,action,resourceType,resourceId:resourceId||null,metadata,createdAt:iso()});db.accountAudit=db.accountAudit.slice(0,2000);await persist();}
function tenantRole(auth){return auth.membership?.role||'viewer';}
function accountSlug(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'workspace';}

async function audit(action,detail){db.audit.unshift({id:crypto.randomUUID(),at:iso(),action,detail});db.audit=db.audit.slice(0,1000);await persist();}
function validateDomain(v){const s=String(v||'').trim().toLowerCase();if(s.length>253||s.length<3||!s.includes('.'))return {valid:false,normalized:s,reason:'Domain harus berupa nama lengkap dengan titik.'};const labels=s.split('.');const ok=labels.every(x=>x.length>=1&&x.length<=63&&/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x));return {valid:ok,normalized:s,reason:ok?'Format nama domain valid.':'Label domain tidak memenuhi format DNS.'};}
async function cf(pathname,method='GET',payload){if(!CF_TOKEN||!CF_ZONE)throw Object.assign(new Error('Integrasi Cloudflare belum dikonfigurasi; set CLOUDFLARE_API_TOKEN dan CLOUDFLARE_ZONE_ID di lingkungan server.'),{status:503});const r=await fetch('https://api.cloudflare.com/client/v4'+pathname,{method,headers:{authorization:'Bearer '+CF_TOKEN,'content-type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})});const j=await r.json();if(!r.ok||!j.success)throw Object.assign(new Error(j.errors?.map(x=>x.message).join('; ')||'Cloudflare API gagal'),{status:r.status>=400&&r.status<600?r.status:502});return j.result;}
const server=http.createServer(async(req,res)=>{
 const requestId=String(req.headers['x-request-id']||crypto.randomUUID()).slice(0,100);
 res.setHeader('x-request-id',requestId);
 if(!cors(req,res))return send(res,403,{error:'Origin tidak diizinkan',requestId});
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 try{const u=new URL(req.url,'http://localhost');const p=u.pathname;
 if(p.startsWith('/api/')&&rateLimited(req))return send(res,429,{error:'Batas permintaan terlampaui. Coba kembali setelah satu menit.',requestId});
if(req.method==='GET'&&p==='/health')return send(res,200,{ok:true,service:'VendorDomain API',version:'1.0.0',storage:'persistent-file',cloudflareConfigured:Boolean(CF_TOKEN&&CF_ZONE),time:iso()});
if(req.method==='POST'&&p==='/api/domain/validate'){const b=await body(req);return send(res,200,validateDomain(b.domain));}
if(p.startsWith('/api/')&&!authorized(req))return send(res,401,{error:'Unauthorized. Sesi server yang valid diperlukan.',requestId});
if(req.method==='GET'&&p==='/api/sales/summary')return send(res,200,summarizeSales(db.sales));
if(req.method==='GET'&&p==='/api/sales')return send(res,200,{sales:db.sales});
if(req.method==='POST'&&p==='/api/sales'){
 const sale=createSale(db.sales,await body(req));
 await audit('sale.create',{saleId:sale.id,total:sale.total,currency:sale.currency});
 return send(res,201,{sale});
}
const saleRoute=p.match(/^\/api\/sales\/([a-f0-9-]{36})(?:\/(confirm|fulfill|payments|cancel))?$/i);
if(saleRoute){
 const id=saleRoute[1],action=saleRoute[2]||'';
 if(req.method==='GET'&&!action)return send(res,200,{sale:findSale(db.sales,id)});
 if(req.method==='POST'&&action==='confirm'){
  const sale=confirmSale(db.sales,id);
  await audit('sale.confirm',{saleId:sale.id,total:sale.total});
  return send(res,200,{sale});
 }
 if(req.method==='POST'&&action==='fulfill'){
  const sale=fulfillSale(db.sales,id);
  await audit('sale.fulfill',{saleId:sale.id,total:sale.total});
  return send(res,200,{sale});
 }
 if(req.method==='POST'&&action==='payments'){
  const {sale,payment}=recordSalePayment(db.sales,id,await body(req));
  await audit('sale.payment.record',{saleId:sale.id,paymentId:payment.id,amount:payment.amount});
  return send(res,201,{sale,payment});
 }
 if(req.method==='POST'&&action==='cancel'){
  const sale=cancelSale(db.sales,id);
  await audit('sale.cancel',{saleId:sale.id});
  return send(res,200,{sale});
 }
}
if(req.method==='GET'&&p==='/api/records')return send(res,200,{records:db.records});
if(req.method==='POST'&&p==='/api/records'){const b=await body(req);if(!String(b.title||'').trim())return send(res,400,{error:'title wajib diisi'});const r={id:crypto.randomUUID(),title:String(b.title).slice(0,200),type:String(b.type||'note').slice(0,60),data:b.data??{},createdAt:iso(),updatedAt:iso()};db.records.unshift(r);await audit('record.create',{id:r.id,type:r.type});await persist();return send(res,201,{record:r});}
const rec=p.match(/^\/api\/records\/([a-f0-9-]+)$/i);
if(rec&&req.method==='PUT'){const b=await body(req),r=db.records.find(x=>x.id===rec[1]);if(!r)return send(res,404,{error:'Record tidak ditemukan'});if(b.title!==undefined)r.title=String(b.title).slice(0,200);if(b.type!==undefined)r.type=String(b.type).slice(0,60);if(b.data!==undefined)r.data=b.data;r.updatedAt=iso();await audit('record.update',{id:r.id});await persist();return send(res,200,{record:r});}
if(rec&&req.method==='DELETE'){const i=db.records.findIndex(x=>x.id===rec[1]);if(i<0)return send(res,404,{error:'Record tidak ditemukan'});db.records.splice(i,1);await audit('record.delete',{id:rec[1]});await persist();return send(res,200,{deleted:true,id:rec[1]});}
if(req.method==='GET'&&p==='/api/audit')return send(res,200,{events:db.audit});
if(req.method==='GET'&&p==='/api/dns/records'){const q=new URLSearchParams({per_page:'100'});if(u.searchParams.has('name'))q.set('name',u.searchParams.get('name'));const records=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records?'+q);return send(res,200,{records});}
if(req.method==='POST'&&p==='/api/dns/records'){const b=await body(req);if(!['A','AAAA','CNAME','TXT','MX','NS','SRV','CAA'].includes(String(b.type||'').toUpperCase()))return send(res,400,{error:'Tipe DNS tidak didukung'});if(!b.name||!b.content)return send(res,400,{error:'name dan content wajib diisi'});const result=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records','POST',{type:String(b.type).toUpperCase(),name:String(b.name),content:String(b.content),ttl:Number(b.ttl||1),...(b.priority!==undefined?{priority:Number(b.priority)}:{}),...(b.proxied!==undefined?{proxied:Boolean(b.proxied)}:{})});await audit('dns.create',{id:result.id,type:result.type,name:result.name});return send(res,201,{record:result});}
const dns=p.match(/^\/api\/dns\/records\/([a-f0-9]+)$/i);
if(dns&&req.method==='DELETE'){const result=await cf('/zones/'+encodeURIComponent(CF_ZONE)+'/dns_records/'+encodeURIComponent(dns[1]),'DELETE');await audit('dns.delete',{id:dns[1]});return send(res,200,{deleted:true,result});}
return send(res,404,{error:'Endpoint tidak ditemukan'});
}catch(e){const status=e.status||500;if(status>=500)console.error('Request '+requestId+' gagal:',e.message);return send(res,status,{error:status>=500?'Kesalahan internal server':(e.message||'Permintaan gagal'),requestId});}});
server.listen(PORT,HOST,()=>console.log('VendorDomain API listening on '+HOST+':'+PORT));
