import http from 'node:http';
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import pg from 'pg';

const scrypt = promisify(scryptCallback);
const { Pool } = pg;
const required = ['DATABASE_URL', 'GALERI_STORAGE_DIR'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined });
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const STORAGE = path.resolve(process.env.GALERI_STORAGE_DIR);
const MAX_UPLOAD = Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024);
const SESSION_HOURS = Number(process.env.SESSION_TTL_HOURS || 168);
const COOKIE_SECURE = process.env.COOKIE_SECURE !== 'false';
const origins = new Set((process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean));

const hash = value => createHash('sha256').update(value).digest('hex');
const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(JSON.stringify(body));
};
const cookie = token => `galeri_session=${token}; Path=/; HttpOnly; SameSite=None; Max-Age=${SESSION_HOURS * 3600}${COOKIE_SECURE ? '; Secure' : ''}`;
const clearCookie = 'galeri_session=; Path=/; HttpOnly; SameSite=None; Max-Age=0' + (COOKIE_SECURE ? '; Secure' : '');
function getToken(req) {
  const raw = req.headers.cookie || '';
  const match = raw.split(';').map(x => x.trim()).find(x => x.startsWith('galeri_session='));
  return match ? decodeURIComponent(match.slice('galeri_session='.length)) : null;
}
async function readJson(req, limit = 64 * 1024) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > limit) throw Object.assign(new Error('Payload terlalu besar'), { status: 413 }); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(new Error('JSON tidak valid'), { status: 400 }); }
}
async function currentUser(req) {
  const token = getToken(req); if (!token) return null;
  const result = await pool.query(`SELECT u.id,u.email,u.status,p.display_name FROM galeri.sessions s JOIN galeri.users u ON u.id=s.user_id LEFT JOIN galeri.profiles p ON p.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()`, [hash(token)]);
  if (!result.rowCount || result.rows[0].status !== 'active') return null;
  await pool.query('UPDATE galeri.sessions SET last_seen_at=now() WHERE token_hash=$1', [hash(token)]);
  return result.rows[0];
}
async function audit(userId, type, details = {}) {
  await pool.query('INSERT INTO galeri.audit_events(user_id,event_type,details) VALUES($1,$2,$3)', [userId, type, details]);
}
function originAllowed(req) {
  const origin = req.headers.origin;
  return !origin || origins.size === 0 || origins.has(origin);
}
const server = http.createServer(async (req, res) => {
  try {
    if (!originAllowed(req)) return json(res, 403, { error: 'Origin tidak diizinkan' });
    if (req.headers.origin) res.setHeader('access-control-allow-origin', req.headers.origin);
    res.setHeader('access-control-allow-credentials', 'true');
    res.setHeader('vary', 'Origin');
    res.setHeader('access-control-allow-headers', 'content-type');
    res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/v1/health') return json(res, 200, { service: 'GALERI', status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });

    if (req.method === 'POST' && url.pathname === '/api/v1/register') {
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const displayName = String(body.displayName || '').trim().slice(0, 80);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 256) return json(res, 400, { error: 'Email tidak valid atau kata sandi kurang dari 12 karakter' });
      const salt = randomBytes(16).toString('hex');
      const derived = await scrypt(password, salt, 64);
      const passwordHash = `scrypt:${salt}:${Buffer.from(derived).toString('hex')}`;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const created = await client.query('INSERT INTO galeri.users(email,password_hash) VALUES($1,$2) RETURNING id,email', [email, passwordHash]);
        const user = created.rows[0];
        await client.query('INSERT INTO galeri.profiles(user_id,display_name) VALUES($1,$2)', [user.id, displayName]);
        await client.query('INSERT INTO galeri.storage_quotas(user_id) VALUES($1)', [user.id]);
        await client.query('COMMIT');
        await audit(user.id, 'account.registered');
        return json(res, 201, { id: user.id, email: user.email, message: 'Akun GALERI berhasil dibuat. Silakan login.' });
      } catch (error) { await client.query('ROLLBACK'); if (error.code === '23505') return json(res, 409, { error: 'Email sudah terdaftar' }); throw error; }
      finally { client.release(); }
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/login') {
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      const result = await pool.query('SELECT id,email,password_hash,status FROM galeri.users WHERE email=$1', [email]);
      if (!result.rowCount || result.rows[0].status !== 'active') return json(res, 401, { error: 'Email atau kata sandi salah' });
      const user = result.rows[0]; const [scheme, salt, stored] = user.password_hash.split(':');
      if (scheme !== 'scrypt') return json(res, 500, { error: 'Format kredensial tidak didukung' });
      const derived = Buffer.from(await scrypt(String(body.password || ''), salt, 64));
      const expected = Buffer.from(stored, 'hex');
      if (derived.length !== expected.length || !timingSafeEqual(derived, expected)) return json(res, 401, { error: 'Email atau kata sandi salah' });
      const token = randomBytes(32).toString('base64url');
      await pool.query('INSERT INTO galeri.sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+($3 * interval \'1 hour\'))', [user.id, hash(token), SESSION_HOURS]);
      await audit(user.id, 'account.login');
      return json(res, 200, { id: user.id, email: user.email }, { 'set-cookie': cookie(token) });
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/logout') {
      const token = getToken(req); if (token) await pool.query('DELETE FROM galeri.sessions WHERE token_hash=$1', [hash(token)]);
      return json(res, 200, { ok: true }, { 'set-cookie': clearCookie });
    }

    const user = await currentUser(req);
    if (!user) return json(res, 401, { error: 'Silakan login terlebih dahulu' });
    if (req.method === 'GET' && url.pathname === '/api/v1/me') {
      const result = await pool.query('SELECT u.id,u.email,p.display_name,p.timezone,p.preferences,q.quota_bytes,q.used_bytes FROM galeri.users u JOIN galeri.profiles p ON p.user_id=u.id JOIN galeri.storage_quotas q ON q.user_id=u.id WHERE u.id=$1', [user.id]);
      return json(res, 200, result.rows[0]);
    }
    if (req.method === 'PUT' && url.pathname === '/api/v1/profile') {
      const body = await readJson(req);
      const name = String(body.displayName || '').trim().slice(0, 80);
      const timezone = String(body.timezone || 'Asia/Jakarta').slice(0, 64);
      const result = await pool.query('UPDATE galeri.profiles SET display_name=$2,timezone=$3,updated_at=now() WHERE user_id=$1 RETURNING user_id,display_name,timezone', [user.id, name, timezone]);
      await audit(user.id, 'profile.updated');
      return json(res, 200, result.rows[0]);
    }
    if (req.method === 'GET' && url.pathname === '/api/v1/files') {
      const result = await pool.query('SELECT id,folder_id,original_name,mime_type,size_bytes,created_at FROM galeri.files WHERE user_id=$1 ORDER BY created_at DESC LIMIT 500', [user.id]);
      return json(res, 200, { files: result.rows });
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/files') {
      const body = await readJson(req);
      const name = path.basename(String(body.name || '')).slice(0, 240);
      const size = Number(body.sizeBytes);
      if (!name || !Number.isSafeInteger(size) || size < 0 || size > MAX_UPLOAD) return json(res, 400, { error: 'Metadata file tidak valid' });
      const quota = await pool.query('SELECT quota_bytes,used_bytes FROM galeri.storage_quotas WHERE user_id=$1', [user.id]);
      if (!quota.rowCount || BigInt(quota.rows[0].used_bytes) + BigInt(size) > BigInt(quota.rows[0].quota_bytes)) return json(res, 413, { error: 'Kuota penyimpanan tidak mencukupi' });
      const id = randomUUID(); const key = `${user.id}/${id}`;
      const created = await pool.query('INSERT INTO galeri.files(id,user_id,folder_id,original_name,storage_key,mime_type,size_bytes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,original_name,size_bytes', [id, user.id, body.folderId || null, name, key, String(body.mimeType || 'application/octet-stream').slice(0,120), size]);
      return json(res, 201, { file: created.rows[0], uploadUrl: `/api/v1/files/${id}/content` });
    }
    const contentMatch = url.pathname.match(/^\/api\/v1\/files\/([0-9a-f-]{36})\/content$/i);
    if (contentMatch && req.method === 'PUT') {
      const found = await pool.query('SELECT id,storage_key,size_bytes FROM galeri.files WHERE id=$1 AND user_id=$2', [contentMatch[1], user.id]);
      if (!found.rowCount) return json(res, 404, { error: 'File tidak ditemukan' });
      const file = found.rows[0]; const expected = Number(file.size_bytes);
      const declared = Number(req.headers['content-length'] || 0);
      if (declared !== expected || expected > MAX_UPLOAD) return json(res, 400, { error: 'Ukuran upload tidak sesuai metadata' });
      const target = path.resolve(STORAGE, file.storage_key);
      if (!target.startsWith(STORAGE + path.sep)) return json(res, 400, { error: 'Storage key tidak valid' });
      await mkdir(path.dirname(target), { recursive: true });
      try {
        await pipeline(req, createWriteStream(target, { flags: 'wx' }));
      } catch (error) { await unlink(target).catch(() => {}); throw error; }
      const info = await stat(target);
      if (info.size !== expected) { await unlink(target); return json(res, 400, { error: 'Ukuran file hasil upload tidak cocok' }); }
      await pool.query('UPDATE galeri.storage_quotas SET used_bytes=used_bytes+$2,updated_at=now() WHERE user_id=$1', [user.id, expected]);
      await audit(user.id, 'file.uploaded', { fileId: file.id, bytes: expected });
      return json(res, 201, { ok: true, fileId: file.id, bytes: expected });
    }
    if (contentMatch && req.method === 'GET') {
      const found = await pool.query('SELECT storage_key,original_name,mime_type,size_bytes FROM galeri.files WHERE id=$1 AND user_id=$2', [contentMatch[1], user.id]);
      if (!found.rowCount) return json(res, 404, { error: 'File tidak ditemukan' });
      const file = found.rows[0]; const target = path.resolve(STORAGE, file.storage_key);
      res.writeHead(200, { 'content-type': file.mime_type, 'content-length': String(file.size_bytes), 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`, 'x-content-type-options': 'nosniff', 'cache-control': 'private, no-store' });
      return createReadStream(target).pipe(res);
    }
    return json(res, 404, { error: 'Endpoint tidak ditemukan' });
  } catch (error) {
    console.error('[GALERI]', error);
    if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : 'Terjadi kesalahan server' });
    else res.destroy(error);
  }
});

await mkdir(STORAGE, { recursive: true });
await pool.query('SELECT 1');
server.listen(PORT, HOST, () => console.log(`GALERI API listening on http://${HOST}:${PORT}`));
process.on('SIGTERM', () => server.close(() => pool.end()));
process.on('SIGINT', () => server.close(() => pool.end()));
