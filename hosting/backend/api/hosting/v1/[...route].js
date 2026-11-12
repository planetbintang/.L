import { Pool } from "pg";
import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCb);
let pool;
function db(){if(!process.env.DATABASE_URL)throw Object.assign(new Error("DATABASE_NOT_CONFIGURED"),{status:503});return pool??=(new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true},max:5,idleTimeoutMillis:10000,connectionTimeoutMillis:5000}));}
const hash=t=>createHash("sha256").update(t).digest("hex");
const json=(res,status,data)=>res.status(status).setHeader("Content-Type","application/json; charset=utf-8").json(data);
const cookieName="pb_hosting_session";
function setCookie(res,token,maxAge){res.setHeader("Set-Cookie",cookieName+"="+token+"; Path=/api/hosting/v1; HttpOnly; Secure; SameSite=None; Max-Age="+maxAge);}
function clearCookie(res){res.setHeader("Set-Cookie",cookieName+"=; Path=/api/hosting/v1; HttpOnly; Secure; SameSite=Lax; Max-Age=0");}
function cookies(req){return Object.fromEntries((req.headers.cookie||"").split(";").map(v=>v.trim().split(/=(.*)/s).slice(0,2)).filter(x=>x.length===2));}
function originAllowed(req){const origin=req.headers.origin;if(!origin)return true;const allowed=(process.env.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);return allowed.includes(origin);}
async function session(req){const auth=req.headers.authorization||"";const token=(auth.toLowerCase().startsWith("bearer ")?auth.slice(7).trim():"")||cookies(req)[cookieName];if(!token)return null;const q=await db().query("select s.id,s.tenant_id,s.user_id,u.email,u.display_name from hosting_sessions s join hosting_users u on u.id=s.user_id where s.token_hash=$1 and s.revoked_at is null and s.expires_at>now() and u.status='active'",[hash(token)]);return q.rows[0]||null;}
async function audit(s,action,resource,metadata={}){await db().query("insert into hosting_activity(tenant_id,actor_user_id,action,resource,metadata) values($1,$2,$3,$4,$5)",[s.tenant_id,s.user_id,action,resource,metadata]);}
async function passwordHash(password){const salt=randomBytes(16);const derived=await scrypt(password,salt,64);return "scrypt$"+salt.toString("hex")+"$"+Buffer.from(derived).toString("hex");}
async function verifyPassword(password,stored){const [kind,saltHex,keyHex]=String(stored||"").split("$");if(kind!=="scrypt"||!saltHex||!keyHex)return false;const actual=Buffer.from(await scrypt(password,Buffer.from(saltHex,"hex"),64));const expected=Buffer.from(keyHex,"hex");return actual.length===expected.length&&timingSafeEqual(actual,expected);}
function validEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&email.length<=254;}
export default async function handler(req,res){
  res.setHeader("Vary","Origin");const origin=req.headers.origin;const allowed=(process.env.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);if(origin&&allowed.includes(origin)){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Access-Control-Allow-Credentials","true");res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");}if(!originAllowed(req))return json(res,403,{error:"ORIGIN_FORBIDDEN"});if(req.method==="OPTIONS")return res.status(204).end();
  const route="/" + String(Array.isArray(req.query.route)?req.query.route.join("/"):req.query.route||"").replace(/^\/+|\/+$/g,"");const method=req.method||"GET";
  try{
    if(route==="/health"&&method==="GET"){try{await db().query("select 1");return json(res,200,{ok:true,service:"hosting-reic-api",database:"connected"});}catch(e){return json(res,503,{ok:false,service:"hosting-reic-api",database:"unavailable",error:e.message==="DATABASE_NOT_CONFIGURED"?"DATABASE_NOT_CONFIGURED":"DATABASE_CONNECTION_FAILED"});}}
    if(route==="/auth/register"&&method==="POST"){
      const {name,email,password,workspaceName}=req.body||{};const normalized=String(email||"").trim().toLowerCase();
      if(!String(name||"").trim()||String(name).length>120||!validEmail(normalized)||typeof password!=="string"||password.length<10||password.length>128)return json(res,400,{message:"Nama, email valid, dan kata sandi 10–128 karakter wajib diisi."});
      const client=await db().connect();try{await client.query("begin");const exists=await client.query("select 1 from hosting_users where email=$1 limit 1",[normalized]);if(exists.rowCount){await client.query("rollback");return json(res,409,{message:"Email sudah terdaftar."});}
      const tenant=(await client.query("insert into hosting_tenants(name,status) values($1,'active') returning id",[String(workspaceName||name).trim()])).rows[0];
      const user=(await client.query("insert into hosting_users(tenant_id,email,display_name,password_hash,status,email_verified_at) values($1,$2,$3,$4,'active',now()) returning id",[tenant.id,normalized,String(name).trim(),await passwordHash(password)])).rows[0];
      const role=(await client.query("insert into hosting_roles(tenant_id,name,permissions) values($1,'owner',$2::jsonb) returning id",[tenant.id,JSON.stringify(["hosting:*","files:*","domains:*","billing:read","members:manage"])] )).rows[0];
      await client.query("insert into hosting_memberships(tenant_id,user_id,role_id,status) values($1,$2,$3,'active')",[tenant.id,user.id,role.id]);
      await client.query("insert into hosting_activity(tenant_id,actor_user_id,action,resource,metadata) values($1,$2,'account.register','account',$3)",[tenant.id,user.id,{source:"hosting-register"}]);await client.query("commit");return json(res,201,{message:"Akun Hosting berhasil dibuat. Silakan login.",accountId:user.id});
      }catch(e){await client.query("rollback");throw e;}finally{client.release();}
    }
    if(route==="/auth/login"&&method==="POST"){
      const {email,password}=req.body||{};const normalized=String(email||"").trim().toLowerCase();if(!validEmail(normalized)||typeof password!=="string")return json(res,400,{message:"Email atau kata sandi tidak valid."});
      const q=await db().query("select id,tenant_id,email,display_name,password_hash from hosting_users where email=$1 and status='active' order by created_at asc limit 1",[normalized]);const user=q.rows[0];if(!user||!(await verifyPassword(password,user.password_hash)))return json(res,401,{message:"Email atau kata sandi salah."});
      const token=randomBytes(32).toString("base64url");const expires=new Date(Date.now()+7*86400000);await db().query("insert into hosting_sessions(tenant_id,user_id,token_hash,expires_at) values($1,$2,$3,$4)",[user.tenant_id,user.id,hash(token),expires]);setCookie(res,token,604800);await db().query("insert into hosting_activity(tenant_id,actor_user_id,action,resource,metadata) values($1,$2,'auth.login','account','{}')",[user.tenant_id,user.id]);return json(res,200,{message:"Login berhasil.",accessToken:token,profile:{id:user.id,email:user.email,name:user.display_name},expiresAt:expires.toISOString()});
    }
    if(route==="/auth/logout"&&method==="POST"){const s=await session(req);if(s)await db().query("update hosting_sessions set revoked_at=now() where id=$1",[s.id]);clearCookie(res);return json(res,200,{message:"Sesi telah diakhiri."});}
    const s=await session(req);if(!s)return json(res,401,{message:"Login diperlukan."});
    if(route==="/auth/me"&&method==="GET"){
      const q=await db().query("select id,email,display_name,status,created_at from hosting_users where id=$1 and tenant_id=$2",[s.user_id,s.tenant_id]);
      const t=await db().query("select id,name,status,created_at from hosting_tenants where id=$1",[s.tenant_id]);
      const m=await db().query("select r.name,r.permissions from hosting_memberships m join hosting_roles r on r.id=m.role_id where m.user_id=$1 and m.tenant_id=$2 and m.status='active'",[s.user_id,s.tenant_id]);
      return json(res,200,{user:q.rows[0]?{id:q.rows[0].id,email:q.rows[0].email,displayName:q.rows[0].display_name,status:q.rows[0].status,created_at:q.rows[0].created_at}:null,tenant:t.rows[0]||null,role:m.rows[0]?.name||"viewer"});
    }
    if(route==="/account/overview"&&method==="GET"){
      const [svc,files,activity]=await Promise.all([
        db().query("select count(*)::int as total from hosting_services where tenant_id=$1",[s.tenant_id]),
        db().query("select count(*)::int as total,coalesce(sum(size_bytes),0)::bigint as bytes from hosting_file_objects where tenant_id=$1",[s.tenant_id]),
        db().query("select action,resource,created_at from hosting_activity where tenant_id=$1 order by created_at desc limit 20",[s.tenant_id])
      ]);
      return json(res,200,{counts:{services:svc.rows[0].total,files:files.rows[0].total,bytes:Number(files.rows[0].bytes)},recentActivity:activity.rows});
    }
    if(route==="/account/profile"&&method==="GET"){
      const q=await db().query("select id,email,display_name,status,created_at,profile from hosting_users where id=$1 and tenant_id=$2",[s.user_id,s.tenant_id]);
      const t=await db().query("select id,name,status from hosting_tenants where id=$1",[s.tenant_id]);
      const m=await db().query("select r.name from hosting_memberships m join hosting_roles r on r.id=m.role_id where m.user_id=$1 and m.tenant_id=$2 and m.status='active'",[s.user_id,s.tenant_id]);
      const u=q.rows[0];return json(res,200,{user:u?{id:u.id,email:u.email,displayName:u.display_name,status:u.status,created_at:u.created_at,profile:u.profile||{}}:null,tenant:t.rows[0]||null,role:m.rows[0]?.name||"viewer"});
    }
    if(route==="/account/profile"&&method==="PUT"){
      const b=req.body||{};const displayName=String(b.displayName||"").trim();
      if(!displayName||displayName.length>120)return json(res,400,{message:"Nama tampilan wajib diisi (maksimal 120 karakter)."});
      const profile={company:String(b.company||"").slice(0,160),phone:String(b.phone||"").slice(0,40),timezone:["Asia/Jakarta","Asia/Makassar","Asia/Jayapura","UTC"].includes(b.timezone)?b.timezone:"Asia/Jakarta"};
      const q=await db().query("update hosting_users set display_name=$1,profile=$2::jsonb where id=$3 and tenant_id=$4 returning id,email,display_name,profile",[displayName,JSON.stringify(profile),s.user_id,s.tenant_id]);
      await audit(s,"account.profile.update","account",{fields:["displayName","company","phone","timezone"]});
      const u=q.rows[0];return json(res,200,{user:{id:u.id,email:u.email,displayName:u.display_name,profile:u.profile}});
    }
    if(route==="/services"&&method==="GET"){
      const q=await db().query("select id,service_type as type,name,status,resource_quota,created_at from hosting_services where tenant_id=$1 order by created_at desc",[s.tenant_id]);
      return json(res,200,{services:q.rows});
    }
    if(route==="/profile"&&method==="GET"){const q=await db().query("select id,email,display_name,status,created_at from hosting_users where id=$1 and tenant_id=$2",[s.user_id,s.tenant_id]);return json(res,200,{profile:q.rows[0]});}
    if(route==="/services/summary"&&method==="GET"){const q=await db().query("select count(*)::int as total,count(*) filter(where status='active')::int as active from hosting_services where tenant_id=$1",[s.tenant_id]);return json(res,200,{summary:q.rows[0].active+" layanan aktif dari "+q.rows[0].total+" layanan",...q.rows[0]});}
    if(route==="/activity"&&method==="POST"){const b=req.body||{};await audit(s,String(b.action||"unknown").slice(0,100),String(b.resource||"unknown").slice(0,160),b.metadata&&typeof b.metadata==="object"?b.metadata:{});return json(res,201,{ok:true});}
    if(route==="/files"&&method==="GET"){const q=await db().query("select id,parent_id,name,object_key,mime_type,size_bytes,checksum_sha256,metadata,created_at from hosting_file_objects where tenant_id=$1 order by name asc limit 500",[s.tenant_id]);return json(res,200,{items:q.rows.map(x=>({...x,type:x.mime_type==="inode/directory"?"directory":"file"}))});}
    if(route==="/files"&&method==="POST"){const {name,parentId=null,type="file",mimeType=null,sizeBytes=0,objectKey}=req.body||{};if(!name||typeof name!=="string"||name.length>255||!objectKey||typeof objectKey!=="string"||!objectKey.startsWith(s.tenant_id+"/")||!Number.isSafeInteger(sizeBytes)||sizeBytes<0)return json(res,400,{message:"Metadata file tidak valid."});if(parentId){const p=await db().query("select id from hosting_file_objects where id=$1 and tenant_id=$2",[parentId,s.tenant_id]);if(!p.rowCount)return json(res,404,{message:"Folder induk tidak ditemukan."});}const q=await db().query("insert into hosting_file_objects(tenant_id,owner_user_id,parent_id,name,object_key,mime_type,size_bytes) values($1,$2,$3,$4,$5,$6,$7) returning id,name,parent_id,mime_type,size_bytes,created_at",[s.tenant_id,s.user_id,parentId,name,objectKey,type==="directory"?"inode/directory":mimeType,sizeBytes]);await audit(s,"file.create",q.rows[0].id);return json(res,201,{file:q.rows[0]});}
    if(route==="/domains"&&method==="GET"){const q=await db().query("select id,domain_name,status,metadata from hosting_domains where tenant_id=$1 order by domain_name",[s.tenant_id]);return json(res,200,{items:q.rows});}
    return json(res,404,{message:"Endpoint tidak ditemukan."});
  }catch(e){console.error("HOSTING_API_ERROR",e);return json(res,e.status||500,{message:e.status===503?"Backend database belum dikonfigurasi.": "Terjadi kesalahan pada backend Hosting."});}
}