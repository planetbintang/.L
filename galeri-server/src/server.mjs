import http from 'node:http';
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, unlink, open } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import pg from 'pg';

const scrypt = promisify(scryptCallback);
const { Pool } = pg;
for (const key of ['DATABASE_URL', 'GALERI_STORAGE_DIR']) if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined });
const PORT = Number(process.env.PORT || 8787), HOST = process.env.HOST || '127.0.0.1';
const STORAGE = path.resolve(process.env.GALERI_STORAGE_DIR), MAX_UPLOAD = Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024);
const SESSION_HOURS = Number(process.env.SESSION_TTL_HOURS || 168), COOKIE_SECURE = process.env.COOKIE_SECURE !== 'false';
const origins = new Set((process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean));
const hash = value => createHash('sha256').update(value).digest('hex');
const json = (res, status, body, headers = {}) => { res.writeHead(status, { 'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers }); res.end(JSON.stringify(body)); };
const cookie = token => `galeri_session=${token}; Path=/; HttpOnly; SameSite=None; Max-Age=${SESSION_HOURS*3600}${COOKIE_SECURE?'; Secure; Partitioned':''}`;
const clearCookie = 'galeri_session=; Path=/; HttpOnly; SameSite=None; Max-Age=0' + (COOKIE_SECURE?'; Secure; Partitioned':'');
function getToken(req){const part=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('galeri_session='));return part?decodeURIComponent(part.slice(15)):null}
async function readJson(req,limit=65536){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw Object.assign(new Error('Payload terlalu besar'),{status:413});chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw Object.assign(new Error('JSON tidak valid'),{status:400})}}
async function currentUser(req){const token=getToken(req);if(!token)return null;const q=await pool.query(`SELECT u.id,u.email,u.status,u.role,p.display_name FROM galeri.sessions s JOIN galeri.users u ON u.id=s.user_id LEFT JOIN galeri.profiles p ON p.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()`,[hash(token)]);if(!q.rowCount||q.rows[0].status!=='active')return null;await pool.query('UPDATE galeri.sessions SET last_seen_at=now() WHERE token_hash=$1',[hash(token)]);return q.rows[0]}
async function audit(userId,event,details={}){await pool.query('INSERT INTO galeri.audit_events(user_id,event_type,details) VALUES($1,$2,$3)',[userId,event,details])}
function isAdmin(u){return u?.role==='admin'} function isEditor(u){return u?.role==='editor'} function canManage(u){return isAdmin(u)||isEditor(u)}
function originAllowed(req){const origin=req.headers.origin;return !origin||origins.has(origin)}
function safeMime(value){return /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime))$/.test(String(value||''))}
function storagePath(key){const target=path.resolve(STORAGE,key);if(!target.startsWith(STORAGE+path.sep))throw Object.assign(new Error('Storage key tidak valid'),{status:400});return target}
async function validMediaSignature(target,mime){const h=await open(target,'r');try{const b=Buffer.alloc(16);await h.read(b,0,b.length,0);if(mime==='image/jpeg')return b[0]===0xff&&b[1]===0xd8&&b[2]===0xff;if(mime==='image/png')return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));if(mime==='image/gif')return b.toString('ascii',0,3)==='GIF';if(mime==='image/webp')return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';if(mime==='video/webm')return b.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));if(mime==='video/mp4'||mime==='video/quicktime')return b.toString('ascii',4,8)==='ftyp';return false}finally{await h.close()}}
async function streamUpload(req,res,{id,userId,kind}) {
 const table=kind==='media'?'galeri.media':'galeri.files';
 const q=kind==='media'
  ? await pool.query('SELECT id,storage_key,size_bytes,mime_type FROM galeri.media WHERE id=$1 AND owner_id=$2',[id,userId])
  : await pool.query('SELECT id,storage_key,size_bytes,mime_type FROM galeri.files WHERE id=$1 AND user_id=$2',[id,userId]);
 if(!q.rowCount)return json(res,404,{error:'Berkas tidak ditemukan'});
 const file=q.rows[0],expected=Number(file.size_bytes),declared=Number(req.headers['content-length']||0);
 if(!Number.isSafeInteger(expected)||expected<1||expected>MAX_UPLOAD||declared!==expected)return json(res,400,{error:'Ukuran upload tidak sesuai metadata'});
 const target=storagePath(file.storage_key);await mkdir(path.dirname(target),{recursive:true});
 let opened=false;const out=createWriteStream(target,{flags:'wx'});out.once('open',()=>opened=true);
 try{await pipeline(req,out)}catch(error){if(opened)await unlink(target).catch(()=>{});throw error}
 const info=await stat(target);if(info.size!==expected){await unlink(target);return json(res,400,{error:'Ukuran file hasil upload tidak cocok'})}
 if(kind==='media'){
  if(!await validMediaSignature(target,file.mime_type)){await unlink(target);return json(res,415,{error:'Isi berkas tidak sesuai MIME image/video yang diizinkan'})}
  const client=await pool.connect();try{await client.query('BEGIN');const quota=await client.query('SELECT quota_bytes,used_bytes FROM galeri.storage_quotas WHERE user_id=$1 FOR UPDATE',[userId]);if(!quota.rowCount||BigInt(quota.rows[0].used_bytes)+BigInt(expected)>BigInt(quota.rows[0].quota_bytes)){await client.query('ROLLBACK');await unlink(target);return json(res,413,{error:'Kuota penyimpanan tidak mencukupi'})}await client.query('UPDATE galeri.storage_quotas SET used_bytes=used_bytes+$2,updated_at=now() WHERE user_id=$1',[userId,expected]);await client.query('UPDATE galeri.media SET uploaded_at=now() WHERE id=$1',[id]);await client.query('COMMIT')}catch(e){await client.query('ROLLBACK');await unlink(target).catch(()=>{});throw e}finally{client.release()}
 }else await pool.query('UPDATE galeri.storage_quotas SET used_bytes=used_bytes+$2,updated_at=now() WHERE user_id=$1',[userId,expected]);
 await audit(userId,kind==='media'?'media.uploaded':'file.uploaded',{fileId:id,bytes:expected});
 return json(res,201,{ok:true,fileId:id,bytes:expected});
}
async function sendStored(res,file,{inline=false,cache='private, no-store'}={}) {
 const target=storagePath(file.storage_key);const info=await stat(target);
 res.writeHead(200,{'content-type':file.mime_type,'content-length':String(info.size),'content-disposition':inline?'inline':`attachment; filename*=UTF-8''${encodeURIComponent(file.original_name||file.title||'media')}`,'x-content-type-options':'nosniff','cache-control':cache,'cross-origin-resource-policy':'cross-origin'});
 createReadStream(target).pipe(res);
}
const server=http.createServer(async(req,res)=>{
 try{
  if(!originAllowed(req))return json(res,403,{error:'Origin tidak diizinkan'});
  if(req.headers.origin)res.setHeader('access-control-allow-origin',req.headers.origin);
  res.setHeader('access-control-allow-credentials','true');res.setHeader('vary','Origin');
  res.setHeader('access-control-allow-headers','content-type');res.setHeader('access-control-allow-methods','GET,POST,PUT,DELETE,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end()}
  const url=new URL(req.url,'http://localhost'),p=url.pathname;
  if(req.method==='GET'&&p==='/api/v1/health')return json(res,200,{service:'GALERI',status:'ok',version:'1.1.0',timestamp:new Date().toISOString()});

  // Public API: published records only. Draft, review, archived and incomplete uploads never leave this query.
  if(req.method==='GET'&&p==='/api/v1/public/media'){
   const limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit')||60)));
   const q=await pool.query(`SELECT id,title,description,media_type AS type,placement,mime_type,size_bytes,published_at FROM galeri.media WHERE status='published' AND uploaded_at IS NOT NULL ORDER BY CASE WHEN placement IN ('hero','featured') THEN 0 ELSE 1 END,published_at DESC LIMIT $1`,[limit]);
   return json(res,200,{items:q.rows.map(x=>({...x,public_url:`/api/v1/public/media/${x.id}/content`,thumbnail_url:`/api/v1/public/media/${x.id}/content`}))});
  }
  const publicContent=p.match(/^\/api\/v1\/public\/media\/([0-9a-f-]{36})\/content$/i);
  if(req.method==='GET'&&publicContent){
   const q=await pool.query(`SELECT storage_key,title,mime_type,size_bytes FROM galeri.media WHERE id=$1 AND status='published' AND uploaded_at IS NOT NULL`,[publicContent[1]]);
   if(!q.rowCount)return json(res,404,{error:'Media publik tidak ditemukan'});
   return await sendStored(res,q.rows[0],{inline:true,cache:'public, max-age=300, stale-while-revalidate=600'});
  }

  if(req.method==='POST'&&p==='/api/v1/register'){
   const body=await readJson(req),email=String(body.email||'').trim().toLowerCase(),password=String(body.password||''),displayName=String(body.displayName||'').trim().slice(0,80);
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12||password.length>256)return json(res,400,{error:'Email tidak valid atau kata sandi kurang dari 12 karakter'});
   const salt=randomBytes(16).toString('hex'),derived=await scrypt(password,salt,64),passwordHash=`scrypt:${salt}:${Buffer.from(derived).toString('hex')}`;
   const client=await pool.connect();try{await client.query('BEGIN');const created=await client.query('INSERT INTO galeri.users(email,password_hash) VALUES($1,$2) RETURNING id,email',[email,passwordHash]);const u=created.rows[0];await client.query('INSERT INTO galeri.profiles(user_id,display_name) VALUES($1,$2)',[u.id,displayName]);await client.query('INSERT INTO galeri.storage_quotas(user_id) VALUES($1)',[u.id]);await client.query('COMMIT');await audit(u.id,'account.registered');return json(res,201,{id:u.id,email:u.email,message:'Akun GALERI berhasil dibuat. Silakan login.'})}catch(e){await client.query('ROLLBACK');if(e.code==='23505')return json(res,409,{error:'Email sudah terdaftar'});throw e}finally{client.release()}
  }
  if(req.method==='POST'&&p==='/api/v1/login'){
   const body=await readJson(req),email=String(body.email||'').trim().toLowerCase(),q=await pool.query('SELECT id,email,password_hash,status FROM galeri.users WHERE email=$1',[email]);
   if(!q.rowCount||q.rows[0].status!=='active')return json(res,401,{error:'Email atau kata sandi salah'});
   const u=q.rows[0],[scheme,salt,stored]=u.password_hash.split(':');if(scheme!=='scrypt')return json(res,500,{error:'Format kredensial tidak didukung'});
   const derived=Buffer.from(await scrypt(String(body.password||''),salt,64)),expected=Buffer.from(stored,'hex');
   if(derived.length!==expected.length||!timingSafeEqual(derived,expected))return json(res,401,{error:'Email atau kata sandi salah'});
   const token=randomBytes(32).toString('base64url');await pool.query("INSERT INTO galeri.sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+($3 * interval '1 hour'))",[u.id,hash(token),SESSION_HOURS]);await audit(u.id,'account.login');
   return json(res,200,{id:u.id,email:u.email},{'set-cookie':cookie(token)});
  }
  if(req.method==='POST'&&p==='/api/v1/logout'){const token=getToken(req);if(token)await pool.query('DELETE FROM galeri.sessions WHERE token_hash=$1',[hash(token)]);return json(res,200,{ok:true},{'set-cookie':clearCookie})}

  const user=await currentUser(req);if(!user)return json(res,401,{error:'Silakan login terlebih dahulu'});
  if(req.method==='GET'&&p==='/api/v1/me'){
   const q=await pool.query('SELECT u.id,u.email,u.role,p.display_name,p.timezone,p.preferences,q.quota_bytes,q.used_bytes FROM galeri.users u JOIN galeri.profiles p ON p.user_id=u.id JOIN galeri.storage_quotas q ON q.user_id=u.id WHERE u.id=$1',[user.id]);return json(res,200,q.rows[0]);
  }
  if(req.method==='GET'&&p==='/api/v1/admin/session'){
   if(!canManage(user))return json(res,403,{error:'Akun ini tidak memiliki hak Admin atau Editor'});
   return json(res,200,{user:{id:user.id,email:user.email,display_name:user.display_name,role:user.role,roles:[user.role],is_admin:isAdmin(user)},permissions:{create:true,submit_review:true,publish:isAdmin(user),archive:isAdmin(user),feature:isAdmin(user)}});
  }
  if(p.startsWith('/api/v1/admin/')){
   if(!canManage(user))return json(res,403,{error:'Akses Admin/Editor diperlukan'});
   if(req.method==='GET'&&p==='/api/v1/admin/media'){
    const q=await pool.query(`SELECT m.id,m.title,m.description,m.media_type AS type,m.placement,m.status,m.mime_type,m.size_bytes,m.created_at,m.updated_at,m.published_at,m.uploaded_at,u.email AS owner_email,pr.display_name AS owner_name FROM galeri.media m JOIN galeri.users u ON u.id=m.owner_id LEFT JOIN galeri.profiles pr ON pr.user_id=u.id ORDER BY m.updated_at DESC LIMIT 500`);
    const quota=await pool.query("SELECT COALESCE(SUM(used_bytes),0)::text AS used FROM galeri.storage_quotas");return json(res,200,{items:q.rows,storage_used_label:(Number(quota.rows[0].used)/1073741824).toFixed(2)+' GB'});
   }
   if(req.method==='POST'&&p==='/api/v1/admin/media'){
    const b=await readJson(req),title=String(b.title||'').trim().slice(0,120),description=String(b.description||'').trim().slice(0,1000),type=String(b.type||'image'),placement=String(b.placement||'gallery'),status=String(b.status||'draft'),fileName=path.basename(String(b.fileName||'')).slice(0,240),size=Number(b.sizeBytes),mime=String(b.mimeType||'');
    if(!title||!description||!fileName||!Number.isSafeInteger(size)||size<1||size>MAX_UPLOAD||!safeMime(mime)||!['image','video','film','animation','documentary','sport','music','technology','nature','science','other'].includes(type)||!['gallery','featured','hero'].includes(placement)||status!=='draft')return json(res,400,{error:'Metadata konten tidak valid'});
    const id=randomUUID(),key=`media/${user.id}/${id}`;const q=await pool.query('INSERT INTO galeri.media(id,owner_id,title,description,media_type,placement,status,original_name,storage_key,mime_type,size_bytes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,status',[id,user.id,title,description,type,placement,status,fileName,key,mime,size]);await audit(user.id,'media.created',{mediaId:id,status});return json(res,201,{item:q.rows[0],uploadUrl:`/api/v1/admin/media/${id}/content`});
   }
   const upload=p.match(/^\/api\/v1\/admin\/media\/([0-9a-f-]{36})\/content$/i);
   if(upload&&req.method==='PUT')return await streamUpload(req,res,{id:upload[1],userId:user.id,kind:'media'});
   const act=p.match(/^\/api\/v1\/admin\/media\/([0-9a-f-]{36})\/(publish|unpublish|review|archive|feature)$/i);
   if(act&&req.method==='POST'){
    const [,id,action]=act;if(action!=='review'&&!isAdmin(user))return json(res,403,{error:'Hanya Admin yang dapat publish, menarik publikasi, mengarsipkan, atau mengatur sorotan'});
    const body=action==='feature'?await readJson(req):{};
    const q=await pool.query('SELECT id,status,uploaded_at FROM galeri.media WHERE id=$1',[id]);if(!q.rowCount)return json(res,404,{error:'Konten tidak ditemukan'});const item=q.rows[0];
    if(action==='review'){if(!['draft'].includes(item.status))return json(res,409,{error:'Hanya draf yang dapat dikirim ke review'});await pool.query("UPDATE galeri.media SET status='review',updated_at=now() WHERE id=$1",[id])}
    if(action==='publish'){if(item.status!=='review'||!item.uploaded_at)return json(res,409,{error:'Konten harus berstatus review dan unggahan harus lengkap sebelum publish'});await pool.query("UPDATE galeri.media SET status='published',published_at=now(),updated_at=now() WHERE id=$1",[id])}
    if(action==='unpublish')await pool.query("UPDATE galeri.media SET status='draft',published_at=NULL,updated_at=now() WHERE id=$1",[id]);
    if(action==='archive')await pool.query("UPDATE galeri.media SET status='archived',published_at=NULL,updated_at=now() WHERE id=$1",[id]);
    if(action==='feature'){if(item.status!=='published')return json(res,409,{error:'Hanya konten published yang dapat dijadikan sorotan'});const placement=body.placement==='hero'?'hero':'featured';await pool.query('UPDATE galeri.media SET placement=$2,updated_at=now() WHERE id=$1',[id,placement])}
    await audit(user.id,'media.'+action,{mediaId:id});return json(res,200,{ok:true,status:action==='publish'?'published':action==='review'?'review':action==='archive'?'archived':action==='unpublish'?'draft':'featured'});
   }
   if(req.method==='GET'&&p==='/api/v1/admin/activity'){const q=await pool.query('SELECT a.event_type AS action,a.details,a.created_at,u.email AS actor FROM galeri.audit_events a LEFT JOIN galeri.users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 100');return json(res,200,{items:q.rows})}
   return json(res,404,{error:'Endpoint admin tidak ditemukan'});
  }
  if(req.method==='PUT'&&p==='/api/v1/profile'){const b=await readJson(req),name=String(b.displayName||'').trim().slice(0,80),timezone=String(b.timezone||'Asia/Jakarta').slice(0,64);const q=await pool.query('UPDATE galeri.profiles SET display_name=$2,timezone=$3,updated_at=now() WHERE user_id=$1 RETURNING user_id,display_name,timezone',[user.id,name,timezone]);await audit(user.id,'profile.updated');return json(res,200,q.rows[0])}
  if(req.method==='GET'&&p==='/api/v1/files'){const q=await pool.query('SELECT id,folder_id,original_name,mime_type,size_bytes,created_at FROM galeri.files WHERE user_id=$1 ORDER BY created_at DESC LIMIT 500',[user.id]);return json(res,200,{files:q.rows})}
  if(req.method==='POST'&&p==='/api/v1/files'){
   const b=await readJson(req),name=path.basename(String(b.name||'')).slice(0,240),size=Number(b.sizeBytes);if(!name||!Number.isSafeInteger(size)||size<0||size>MAX_UPLOAD)return json(res,400,{error:'Metadata file tidak valid'});
   if(b.folderId){const f=await pool.query('SELECT 1 FROM galeri.folders WHERE id=$1 AND user_id=$2',[b.folderId,user.id]);if(!f.rowCount)return json(res,400,{error:'Folder tidak ditemukan pada akun ini'})}
   const q=await pool.query('SELECT quota_bytes,used_bytes FROM galeri.storage_quotas WHERE user_id=$1',[user.id]);if(!q.rowCount||BigInt(q.rows[0].used_bytes)+BigInt(size)>BigInt(q.rows[0].quota_bytes))return json(res,413,{error:'Kuota penyimpanan tidak mencukupi'});
   const id=randomUUID(),key=`${user.id}/${id}`;const created=await pool.query('INSERT INTO galeri.files(id,user_id,folder_id,original_name,storage_key,mime_type,size_bytes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,original_name,size_bytes',[id,user.id,b.folderId||null,name,key,String(b.mimeType||'application/octet-stream').slice(0,120),size]);return json(res,201,{file:created.rows[0],uploadUrl:`/api/v1/files/${id}/content`});
  }
  const fileMatch=p.match(/^\/api\/v1\/files\/([0-9a-f-]{36})\/content$/i);
  if(fileMatch&&req.method==='PUT')return await streamUpload(req,res,{id:fileMatch[1],userId:user.id,kind:'file'});
  if(fileMatch&&req.method==='GET'){const q=await pool.query('SELECT storage_key,original_name,mime_type,size_bytes FROM galeri.files WHERE id=$1 AND user_id=$2',[fileMatch[1],user.id]);if(!q.rowCount)return json(res,404,{error:'File tidak ditemukan'});return await sendStored(res,q.rows[0])}
  return json(res,404,{error:'Endpoint tidak ditemukan'});
 }catch(error){console.error('[GALERI]',error);if(!res.headersSent)json(res,error.status||500,{error:error.status?error.message:'Terjadi kesalahan server'});else res.destroy(error)}
});
await mkdir(STORAGE,{recursive:true});await pool.query('SELECT 1');server.listen(PORT,HOST,()=>console.log(`GALERI API listening on http://${HOST}:${PORT}`));
process.on('SIGTERM',()=>server.close(()=>pool.end()));process.on('SIGINT',()=>server.close(()=>pool.end()));
