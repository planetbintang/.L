import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

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
let db={records:[],audit:[]};
if(ADMIN_TOKEN && ADMIN_TOKEN.length<32)throw new Error('ADMIN_TOKEN harus minimal 32 karakter.');
if(!ADMIN_TOKEN)console.warn('ADMIN_TOKEN belum diatur; endpoint /api/* akan menolak seluruh permintaan.');
await mkdir(DATA_DIR,{recursive:true});
try{db=JSON.parse(await readFile(DATA_FILE,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
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
