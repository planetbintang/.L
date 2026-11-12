import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('Hosting API contract uses tenant-scoped PostgreSQL and File Manager records', async () => {
  const api = await readFile(path.join(root, 'api/hosting/[...route].mjs'), 'utf8');
  const migration = await readFile(path.join(root, 'migrations/003_hosting_workspace.sql'), 'utf8');
  assert.match(api, /DATABASE_URL/);
  assert.match(api, /scrypt/);
  assert.match(api, /auth_sessions/);
  assert.match(api, /tenant_id=\$1/);
  assert.match(api, /file_manager_entries/);
  assert.match(api, /hosting_services/);
  assert.match(api, /HOSTING_ALLOWED_ORIGINS/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS hosting_services/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS file_manager_entries/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS hosting_audit_events/);
});
