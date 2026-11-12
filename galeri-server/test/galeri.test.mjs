import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const server = await readFile(new URL('../src/server.mjs', import.meta.url), 'utf8');
const schema = await readFile(new URL('../schema/galeri.reic', import.meta.url), 'utf8');
const roleScript = await readFile(new URL('../scripts/set-role.mjs', import.meta.url), 'utf8');

test('new registrations cannot self-assign privileged roles', () => {
  assert.match(server, /INSERT INTO galeri\.users\(email,password_hash\)/);
  assert.match(schema, /role TEXT NOT NULL DEFAULT 'member'/);
  assert.match(roleScript, /UPDATE galeri\.users SET role=\$2/);
});

test('admin routes enforce server-side Admin or Editor authorization', () => {
  assert.match(server, /if\(!canManage\(user\)\)return json\(res,403/);
  assert.match(server, /if\(action!=='review'&&!isAdmin\(user\)\)/);
});

test('publication requires review state and a completed upload', () => {
  assert.match(server, /item\.status!=='review'\|\|!item\.uploaded_at/);
  assert.match(schema, /status TEXT NOT NULL DEFAULT 'draft'.*'review'.*'published'.*'archived'/);
});

test('public feed and public file route expose only published complete media', () => {
  assert.match(server, /WHERE status='published' AND uploaded_at IS NOT NULL/);
  assert.match(server, /WHERE id=\$1 AND status='published' AND uploaded_at IS NOT NULL/);
});

test('media files are stored outside the public static repository and MIME-sniffed', () => {
  assert.match(server, /validMediaSignature\(target,file\.mime_type\)/);
  assert.match(server, /GALERI_STORAGE_DIR/);
});
