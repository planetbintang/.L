import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../../galeri/index.html', import.meta.url), 'utf8');

test('GALERI frontend contains account, login, registration, and remote storage controls', () => {
  for (const id of ['accountPanel', 'galeriApiBase', 'galeriAuthForm', 'galeriRegister', 'galeriLogout', 'galeriRemoteFiles', 'refreshGaleriFiles']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing frontend control: ' + id);
  }
});

test('GALERI frontend calls the authenticated API and uploads bytes to server storage', () => {
  for (const route of ['/api/v1/health', '/api/v1/me', '/api/v1/files', "'/api/v1/'+mode"]) {
    assert.ok(html.includes(route), 'missing API integration: ' + route);
  }
  assert.match(html, /submitGaleriAuth\('login'\)/);
  assert.match(html, /submitGaleriAuth\('register'\)/);
  assert.match(html, /credentials:\s*'include'/);
  assert.match(html, /method:'PUT',[\s\S]{0,100}body:file/);
  assert.match(html, /loadRemoteFiles/);
});
