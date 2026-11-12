import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { Pool } from 'pg';

const scryptAsync = promisify(crypto.scrypt);
const MAX_BODY = 1024 * 1024;
const SERVICE_TYPES = new Set(['website','domain','dns','ssl','database','email','storage','application','hosting','backup']);
const SERVICE_STATES = new Set(['planned','provisioning','active','suspended','failed','deleted']);
let pool;

function database() {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error('DATABASE_URL belum dikonfigurasi.'), { status: 503 });
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000 });
  return pool;
}
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const now = () => new Date().toISOString();
const safeUser = (u) => ({ id: u.id, email: u.email, displayName: u.display_name, status: u.status, profile: u.profile || {}, createdAt: u.created_at });
function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store, max-age=0');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('content-security-policy', "default-src 'none'; frame-ancestors 'none'");
  res.end(JSON.stringify(data));
}
function cors(req, res) {
  const origin = req.headers.origin;
  const allowed = (process.env.HOSTING_ALLOWED_ORIGINS || 'https://planetbintang.github.io').split(',').map(x => x.trim()).filter(Boolean);
  if (origin && !allowed.includes(origin)) return false;
  if (origin) res.setHeader('access-control-allow-origin', origin);
  res.setHeader('vary', 'Origin');
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'Authorization,Content-Type,X-Request-ID');
  res.setHeader('access-control-max-age', '600');
  return true;
}
async function readBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('Ukuran permintaan melebihi 1 MB.'), { status: 413 });
    chunks.push(chunk);
  }
  try { return size ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}; }
  catch { throw Object.assign(new Error('JSON permintaan tidak valid.'), { status: 400 }); }
}
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, 64);
  return 'scrypt$' + salt + '$' + Buffer.from(hash).toString('hex');
}
async function verifyPassword(password, encoded) {
  try {
    const [scheme, salt, hex] = String(encoded || '').split('$');
    if (scheme !== 'scrypt' || !salt || !hex) return false;
    const expected = Buffer.from(hex, 'hex');
    const actual = Buffer.from(await scryptAsync(password, salt, expected.length));
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch { return false; }
}
function slugify(value) {
  return String(value || 'workspace').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'workspace';
}
function safePath(value) {
  const p = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!p || p.length > 500 || p.split('/').some(part => !part || part === '.' || part === '..') || /[\u0000-\u001f]/.test(p)) {
    throw Object.assign(new Error('Path File Manager tidak valid.'), { status: 400 });
  }
  return p;
}
async function audit(client, auth, action, resourceType, resourceId, metadata = {}) {
  await client.query('INSERT INTO hosting_audit_events (tenant_id,actor_id,action,resource_type,resource_id,metadata) VALUES ($1,$2,$3,$4,$5,$6::jsonb)', [auth.tenant_id, auth.user_id, action, resourceType, resourceId || null, JSON.stringify(metadata)]);
}
async function writeFileRecord(client, auth, filePath, name, content, contentType = 'application/reic+json') {
  const size = Buffer.byteLength(content, 'utf8');
  await client.query(
    'INSERT INTO file_manager_entries (tenant_id,created_by,path,name,entry_kind,content_type,content,byte_size,updated_at) VALUES ($1,$2,$3,$4,\\'file\\',$5,$6,$7,now()) ON CONFLICT (tenant_id,path) DO UPDATE SET name=EXCLUDED.name,content_type=EXCLUDED.content_type,content=EXCLUDED.content,byte_size=EXCLUDED.byte_size,updated_at=now()',
    [auth.tenant_id, auth.user_id, filePath, name, contentType, content, size]
  );
}
async function authenticate(req, client) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\\s+/i, '').trim();
  if (token.length < 40) return null;
  const result = await client.query(
    'SELECT s.id AS session_id,s.expires_at,u.id AS user_id,u.email,u.display_name,u.status,u.profile,u.created_at,t.id AS tenant_id,t.name AS tenant_name,t.slug,m.role FROM auth_sessions s JOIN users u ON u.id=s.user_id JOIN tenant_memberships m ON m.user_id=u.id JOIN tenants t ON t.id=m.tenant_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status=\\'active\\' ORDER BY m.created_at ASC LIMIT 1',
    [sha256(token)]
  );
  return result.rows[0] || null;
}
function requireRole(auth, roles = ['owner','admin','operator']) {
  if (!roles.includes(auth.role)) throw Object.assign(new Error('Akses ditolak untuk peran workspace ini.'), { status: 403 });
}
async function createSession(client, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 86400000);
  await client.query('INSERT INTO auth_sessions (user_id,token_hash,expires_at) VALUES ($1,$2,$3)', [userId, sha256(token), expiresAt]);
  return { token, expiresAt: expiresAt.toISOString() };
}
async function transaction(db, callback) {
  const client = await db.connect();
  try { await client.query('BEGIN'); const result = await callback(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export default async function handler(req, res) {
  const requestId = String(req.headers['x-request-id'] || crypto.randomUUID()).slice(0, 100);
  res.setHeader('x-request-id', requestId);
  if (!cors(req, res)) return json(res, 403, { error: 'Origin tidak diizinkan.', requestId });
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  let client;
  try {
    const url = new URL(req.url, 'https://hosting-api.invalid');
    const route = url.pathname.replace(/^\\/api\\/hosting\\/?/, '').replace(/\\/+$/, '');
    if (route === 'health' && req.method === 'GET') {
      if (!process.env.DATABASE_URL) return json(res, 503, { ok: false, service: 'PlanetBintang Hosting API', database: 'not_configured' });
      await database().query('SELECT 1');
      return json(res, 200, { ok: true, service: 'PlanetBintang Hosting API', database: 'connected', time: now() });
    }
    const db = database();
    client = await db.connect();

    if (route === 'auth/register' && req.method === 'POST') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const displayName = String(body.displayName || body.name || '').trim();
      const password = String(body.password || '');
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254) return json(res, 400, { error: 'Alamat email tidak valid.' });
      if (displayName.length < 2 || displayName.length > 100) return json(res, 400, { error: 'Nama harus berisi 2–100 karakter.' });
      if (password.length < 12 || password.length > 128) return json(res, 400, { error: 'Kata sandi harus berisi 12–128 karakter.' });
      if ((await client.query('SELECT id FROM users WHERE email=$1', [email])).rowCount) return json(res, 409, { error: 'Email sudah terdaftar. Silakan login.' });
      const result = await transaction(db, async (tx) => {
        const workspaceName = String(body.workspaceName || (displayName + ' Workspace')).trim().slice(0, 160);
        const user = (await tx.query('INSERT INTO users (email,display_name,status,password_hash,profile) VALUES ($1,$2,\\'active\\',$3,$4::jsonb) RETURNING *', [email, displayName, await hashPassword(password), JSON.stringify({ company: '', phone: '', timezone: 'Asia/Jakarta' })])).rows[0];
        let slug = slugify(workspaceName);
        if ((await tx.query('SELECT 1 FROM tenants WHERE slug=$1', [slug])).rowCount) slug += '-' + crypto.randomBytes(3).toString('hex');
        const tenant = (await tx.query('INSERT INTO tenants (name,slug) VALUES ($1,$2) RETURNING *', [workspaceName, slug])).rows[0];
        await tx.query('INSERT INTO tenant_memberships (tenant_id,user_id,role) VALUES ($1,$2,\\'owner\\')', [tenant.id, user.id]);
        const session = await createSession(tx, user.id);
        const auth = { tenant_id: tenant.id, user_id: user.id };
        await writeFileRecord(tx, auth, 'hosting/accounts/profiles/' + user.id + '.reic', user.id + '.reic', JSON.stringify({ schema: 'PB.HOSTING.PROFILE/2', userId: user.id, displayName, company: '', phone: '', timezone: 'Asia/Jakarta', updatedAt: now() }, null, 2));
        await audit(tx, auth, 'account.register', 'tenant', tenant.id, { email });
        return { user, tenant, session };
      });
      return json(res, 201, { token: result.session.token, expiresAt: result.session.expiresAt, user: safeUser(result.user), tenant: result.tenant, role: 'owner' });
    }

    if (route === 'auth/login' && req.method === 'POST') {
      const body = await readBody(req), email = String(body.email || '').trim().toLowerCase(), password = String(body.password || '');
      const found = await client.query('SELECT * FROM users WHERE email=$1 AND status=$2 LIMIT 1', [email, 'active']);
      const user = found.rows[0];
      if (!user || !(await verifyPassword(password, user.password_hash))) return json(res, 401, { error: 'Email atau kata sandi tidak sesuai.' });
      const memberships = await client.query('SELECT t.*,m.role FROM tenant_memberships m JOIN tenants t ON t.id=m.tenant_id WHERE m.user_id=$1 ORDER BY m.created_at ASC LIMIT 1', [user.id]);
      if (!memberships.rowCount) return json(res, 403, { error: 'Workspace akun tidak tersedia.' });
      const session = await createSession(client, user.id);
      return json(res, 200, { token: session.token, expiresAt: session.expiresAt, user: safeUser(user), tenant: memberships.rows[0], role: memberships.rows[0].role });
    }

    const auth = await authenticate(req, client);
    if (!auth) return json(res, 401, { error: 'Sesi tidak aktif. Silakan login kembali.', requestId });
    if (route === 'auth/me' && req.method === 'GET') return json(res, 200, { user: safeUser(auth), tenant: { id: auth.tenant_id, name: auth.tenant_name, slug: auth.slug }, role: auth.role, expiresAt: auth.expires_at });
    if (route === 'auth/logout' && req.method === 'POST') {
      await client.query('UPDATE auth_sessions SET revoked_at=now() WHERE id=$1', [auth.session_id]);
      await audit(client, auth, 'account.logout', 'session', auth.session_id);
      return json(res, 200, { loggedOut: true });
    }
    if (route === 'account/overview' && req.method === 'GET') {
      const [services, files, activity] = await Promise.all([
        client.query('SELECT count(*)::int AS total,count(*) FILTER (WHERE status=\\'active\\')::int AS active FROM hosting_services WHERE tenant_id=$1 AND status<>\\'deleted\\'', [auth.tenant_id]),
        client.query('SELECT count(*)::int AS total,coalesce(sum(byte_size),0)::bigint AS bytes FROM file_manager_entries WHERE tenant_id=$1', [auth.tenant_id]),
        client.query('SELECT action,resource_type,resource_id,metadata,created_at FROM hosting_audit_events WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 8', [auth.tenant_id])
      ]);
      return json(res, 200, { tenant: { id: auth.tenant_id, name: auth.tenant_name, slug: auth.slug }, role: auth.role, counts: { services: services.rows[0].total, activeServices: services.rows[0].active, files: files.rows[0].total, bytes: Number(files.rows[0].bytes) }, recentActivity: activity.rows });
    }
    if (route === 'account/profile' && req.method === 'GET') return json(res, 200, { user: safeUser(auth), tenant: { id: auth.tenant_id, name: auth.tenant_name, slug: auth.slug }, role: auth.role });
    if (route === 'account/profile' && req.method === 'PUT') {
      requireRole(auth);
      const body = await readBody(req), displayName = body.displayName === undefined ? auth.display_name : String(body.displayName).trim();
      if (displayName.length < 2 || displayName.length > 100) return json(res, 400, { error: 'Nama profil harus berisi 2–100 karakter.' });
      const profile = { ...(auth.profile || {}) };
      for (const key of ['company','phone','timezone']) if (body[key] !== undefined) profile[key] = String(body[key]).trim().slice(0, 160);
      const updated = (await client.query('UPDATE users SET display_name=$1,profile=$2::jsonb,updated_at=now() WHERE id=$3 RETURNING *', [displayName, JSON.stringify(profile), auth.user_id])).rows[0];
      await writeFileRecord(client, auth, 'hosting/accounts/profiles/' + auth.user_id + '.reic', auth.user_id + '.reic', JSON.stringify({ schema: 'PB.HOSTING.PROFILE/2', userId: auth.user_id, displayName, ...profile, updatedAt: now() }, null, 2));
      await audit(client, auth, 'profile.update', 'user', auth.user_id, { fields: Object.keys(body) });
      return json(res, 200, { user: safeUser(updated) });
    }
    if (route === 'account/password' && req.method === 'POST') {
      const body = await readBody(req), found = await client.query('SELECT password_hash FROM users WHERE id=$1', [auth.user_id]);
      if (!found.rows[0] || !(await verifyPassword(String(body.currentPassword || ''), found.rows[0].password_hash))) return json(res, 401, { error: 'Kata sandi saat ini tidak sesuai.' });
      const next = String(body.newPassword || '');
      if (next.length < 12 || next.length > 128) return json(res, 400, { error: 'Kata sandi baru harus berisi 12–128 karakter.' });
      await client.query('UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2', [await hashPassword(next), auth.user_id]);
      await client.query('UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND id<>$2 AND revoked_at IS NULL', [auth.user_id, auth.session_id]);
      await audit(client, auth, 'password.change', 'user', auth.user_id);
      return json(res, 200, { updated: true });
    }
    if (route === 'services' && req.method === 'GET') {
      const rows = await client.query('SELECT id,service_type AS type,name,status,notes,configuration,created_at,updated_at FROM hosting_services WHERE tenant_id=$1 AND status<>\\'deleted\\' ORDER BY created_at DESC', [auth.tenant_id]);
      return json(res, 200, { services: rows.rows });
    }
    if (route === 'services' && req.method === 'POST') {
      requireRole(auth);
      const body = await readBody(req), type = String(body.type || '').toLowerCase(), name = String(body.name || '').trim();
      if (!SERVICE_TYPES.has(type)) return json(res, 400, { error: 'Jenis resource hosting tidak dikenal.' });
      if (name.length < 1 || name.length > 180) return json(res, 400, { error: 'Nama layanan harus berisi 1–180 karakter.' });
      const notes = String(body.notes || '').slice(0, 2000), configuration = body.configuration && typeof body.configuration === 'object' ? body.configuration : {};
      const row = (await client.query('INSERT INTO hosting_services (tenant_id,created_by,service_type,name,status,notes,configuration) VALUES ($1,$2,$3,$4,\\'planned\\',$5,$6::jsonb) RETURNING id,service_type AS type,name,status,notes,configuration,created_at,updated_at', [auth.tenant_id, auth.user_id, type, name, notes, JSON.stringify(configuration)])).rows[0];
      const filePath = 'hosting/accounts/services/' + auth.tenant_id + '/' + row.id + '.reic';
      await writeFileRecord(client, auth, filePath, row.id + '.reic', JSON.stringify({ schema: 'PB.HOSTING.SERVICE/2', ...row, tenantId: auth.tenant_id }, null, 2));
      await audit(client, auth, 'service.create', 'hosting_service', row.id, { type, name });
      return json(res, 201, { service: row });
    }
    const serviceMatch = route.match(/^services\\/([a-f0-9-]{36})$/i);
    if (serviceMatch && req.method === 'PUT') {
      requireRole(auth);
      const body = await readBody(req), existing = await client.query('SELECT id,service_type AS type,name,status,notes,configuration,created_at,updated_at FROM hosting_services WHERE id=$1 AND tenant_id=$2 AND status<>\\'deleted\\'', [serviceMatch[1], auth.tenant_id]);
      if (!existing.rowCount) return json(res, 404, { error: 'Resource hosting tidak ditemukan.' });
      const old = existing.rows[0], name = body.name === undefined ? old.name : String(body.name).trim(), status = body.status === undefined ? old.status : String(body.status);
      if (name.length < 1 || name.length > 180 || !SERVICE_STATES.has(status)) return json(res, 400, { error: 'Nama atau status resource tidak valid.' });
      const notes = body.notes === undefined ? old.notes : String(body.notes).slice(0, 2000);
      const config = body.configuration === undefined ? old.configuration : body.configuration;
      const row = (await client.query('UPDATE hosting_services SET name=$1,status=$2,notes=$3,configuration=$4::jsonb,updated_at=now() WHERE id=$5 AND tenant_id=$6 RETURNING id,service_type AS type,name,status,notes,configuration,created_at,updated_at', [name,status,notes,JSON.stringify(config),old.id,auth.tenant_id])).rows[0];
      const filePath = 'hosting/accounts/services/' + auth.tenant_id + '/' + row.id + '.reic';
      await writeFileRecord(client, auth, filePath, row.id + '.reic', JSON.stringify({ schema: 'PB.HOSTING.SERVICE/2', ...row, tenantId: auth.tenant_id }, null, 2));
      await audit(client, auth, 'service.update', 'hosting_service', row.id, { status });
      return json(res, 200, { service: row });
    }
    if (serviceMatch && req.method === 'DELETE') {
      requireRole(auth);
      const found = await client.query('UPDATE hosting_services SET status=\\'deleted\\',updated_at=now() WHERE id=$1 AND tenant_id=$2 AND status<>\\'deleted\\' RETURNING id,service_type AS type,name,status,notes,configuration,created_at,updated_at', [serviceMatch[1], auth.tenant_id]);
      if (!found.rowCount) return json(res, 404, { error: 'Resource hosting tidak ditemukan.' });
      const row = found.rows[0], filePath = 'hosting/accounts/services/' + auth.tenant_id + '/' + row.id + '.reic';
      await writeFileRecord(client, auth, filePath, row.id + '.reic', JSON.stringify({ schema: 'PB.HOSTING.SERVICE/2', ...row, tenantId: auth.tenant_id }, null, 2));
      await audit(client, auth, 'service.delete', 'hosting_service', row.id);
      return json(res, 200, { deleted: true });
    }
    if (route === 'files' && req.method === 'GET') {
      const prefix = url.searchParams.get('prefix') || 'hosting/accounts/';
      if (!prefix.startsWith('hosting/accounts/')) return json(res, 400, { error: 'Prefix File Manager harus berada di hosting/accounts/.' });
      const rows = await client.query('SELECT id,path,name,entry_kind AS type,content_type,byte_size AS size,updated_at FROM file_manager_entries WHERE tenant_id=$1 AND path LIKE $2 ORDER BY path LIMIT 500', [auth.tenant_id, prefix.replace(/[\\\\%_]/g, '\\\\$&') + '%']);
      return json(res, 200, { files: rows.rows });
    }
    const fileMatch = route.match(/^files\\/([a-f0-9-]{36})$/i);
    if (fileMatch && req.method === 'GET') {
      const found = await client.query('SELECT id,path,name,entry_kind AS type,content_type,content,byte_size AS size,metadata,updated_at FROM file_manager_entries WHERE id=$1 AND tenant_id=$2', [fileMatch[1], auth.tenant_id]);
      if (!found.rowCount) return json(res, 404, { error: 'File tidak ditemukan.' });
      return json(res, 200, { file: found.rows[0] });
    }
    if (route === 'files' && req.method === 'POST') {
      requireRole(auth);
      const body = await readBody(req), name = String(body.name || '').trim(), content = String(body.content || '');
      const filePath = safePath(body.path);
      if (!filePath.startsWith('hosting/accounts/')) return json(res, 400, { error: 'File hanya boleh dibuat di ruang akun hosting.' });
      if (!name || name.length > 180 || Buffer.byteLength(content,'utf8') > 512 * 1024) return json(res, 400, { error: 'Nama file atau ukuran konten tidak valid (maksimum 512 KB).' });
      const row = (await client.query('INSERT INTO file_manager_entries (tenant_id,created_by,path,name,entry_kind,content_type,content,byte_size,metadata) VALUES ($1,$2,$3,$4,\\'file\\',$5,$6,$7,$8::jsonb) RETURNING id,path,name,entry_kind AS type,content_type,byte_size AS size,updated_at', [auth.tenant_id,auth.user_id,filePath,name,String(body.contentType||'application/reic+json'),content,Buffer.byteLength(content,'utf8'),JSON.stringify(body.metadata||{})])).rows[0];
      await audit(client,auth,'file.create','file_manager_entry',row.id,{path:filePath});
      return json(res,201,{file:row});
    }
    if (fileMatch && req.method === 'PUT') {
      requireRole(auth);
      const body = await readBody(req), content = String(body.content || '');
      if (Buffer.byteLength(content,'utf8') > 512*1024) return json(res,413,{error:'Konten file melebihi 512 KB.'});
      const row = (await client.query('UPDATE file_manager_entries SET content=$1,byte_size=$2,updated_at=now() WHERE id=$3 AND tenant_id=$4 RETURNING id,path,name,entry_kind AS type,content_type,byte_size AS size,updated_at',[content,Buffer.byteLength(content,'utf8'),fileMatch[1],auth.tenant_id])).rows[0];
      if (!row) return json(res,404,{error:'File tidak ditemukan.'});
      await audit(client,auth,'file.update','file_manager_entry',row.id,{path:row.path});
      return json(res,200,{file:row});
    }
    if (fileMatch && req.method === 'DELETE') {
      requireRole(auth);
      const row = (await client.query('DELETE FROM file_manager_entries WHERE id=$1 AND tenant_id=$2 RETURNING id,path',[fileMatch[1],auth.tenant_id])).rows[0];
      if (!row) return json(res,404,{error:'File tidak ditemukan.'});
      await audit(client,auth,'file.delete','file_manager_entry',row.id,{path:row.path});
      return json(res,200,{deleted:true});
    }
    if (route === 'activity' && req.method === 'GET') {
      const rows = await client.query('SELECT id,action,resource_type,resource_id,metadata,created_at FROM hosting_audit_events WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100',[auth.tenant_id]);
      return json(res,200,{activity:rows.rows});
    }
    return json(res,404,{error:'Endpoint Hosting API tidak ditemukan.',requestId});
  } catch (error) {
    const status = error.status || (error.code === '42P01' ? 503 : 500);
    if (status >= 500) console.error('Hosting API request failed', requestId, error.message);
    return json(res,status,{error:status===503?'Database belum siap atau migrasi REIC belum diterapkan.':status>=500?'Kesalahan internal server.':error.message,requestId});
  } finally {
    if (client) client.release();
  }
}