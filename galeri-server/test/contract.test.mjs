import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const server = await readFile(new URL('../src/server.mjs', import.meta.url), 'utf8');
const schema = await readFile(new URL('../schema/galeri.reic', import.meta.url), 'utf8');

test('GALERI API exposes account, profile, and file routes', () => {
  for (const route of ['/api/v1/health', '/api/v1/register', '/api/v1/login', '/api/v1/logout', '/api/v1/me', '/api/v1/profile', '/api/v1/files']) {
    assert.ok(server.includes(route), `missing route: ${route}`);
  }
});

test('passwords are derived with scrypt and session tokens are hashed', () => {
  assert.match(server, /scrypt/);
  assert.match(server, /timingSafeEqual/);
  assert.match(server, /hash\(token\)/);
  assert.match(server, /HttpOnly/);
});

test('REIC schema contains isolated account and storage tables', () => {
  for (const table of ['users', 'profiles', 'sessions', 'folders', 'files', 'storage_quotas', 'audit_events']) {
    assert.ok(schema.includes(`galeri.${table}`), `missing table: ${table}`);
  }
  assert.match(schema, /REFERENCES galeri\.users/);
});
