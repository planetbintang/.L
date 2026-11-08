#!/usr/bin/env node
/**
 * VMDESKTOPREIC local OpenCode Shell Agent
 * Fixed-purpose local bridge. It does not accept arbitrary shell commands.
 * Run on the Linux/macOS machine where OpenCode should be installed:
 *   node opencode-shell-agent.mjs
 */
import http from 'node:http';
import { spawn } from 'node:child_process';

const HOST = '127.0.0.1';
const PORT = 43821;
const ALLOWED_ORIGINS = new Set(['https://planetbintang.github.io']);
const MAX_OUTPUT = 128 * 1024;
let installing = false;

function reply(res, status, payload, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...(origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Private-Network': 'true',
      'Vary': 'Origin'
    } : {})
  });
  res.end(JSON.stringify(payload));
}
function run(command, args, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    let output = '';
    const append = chunk => { output = (output + chunk.toString()).slice(-MAX_OUTPUT); };
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    const timer = setTimeout(() => child.kill('SIGTERM'), timeout);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve(output.trim());
      else reject(new Error((output.trim() || 'Process exited with code ' + code) + ' (exit ' + code + ')'));
    });
  });
}
async function version() {
  try { return await run('opencode', ['--version'], 10000); }
  catch { return ''; }
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const host = req.headers.host || '';
  if (!['127.0.0.1:' + PORT, 'localhost:' + PORT].includes(host)) {
    return reply(res, 403, { ok: false, error: 'Host header tidak diizinkan.' });
  }
  if (req.method === 'OPTIONS') {
    if (!ALLOWED_ORIGINS.has(origin)) return reply(res, 403, { ok: false, error: 'Origin tidak diizinkan.' });
    return reply(res, 204, {}, origin);
  }
  if (!ALLOWED_ORIGINS.has(origin)) return reply(res, 403, { ok: false, error: 'Buka VMDESKTOPREIC dari https://planetbintang.github.io/.L/.' });
  const url = new URL(req.url || '/', 'http://' + host);
  if (req.method === 'GET' && url.pathname === '/health') {
    const installed = await version();
    return reply(res, 200, { ok: true, service: 'VMDESKTOPREIC OpenCode Shell Agent', opencode: !!installed, version: installed }, origin);
  }
  if (req.method === 'POST' && url.pathname === '/install/opencode') {
    if (installing) return reply(res, 409, { ok: false, error: 'Instalasi OpenCode sedang berjalan.' }, origin);
    installing = true;
    try {
      const output = await run('bash', ['-lc', 'set -o pipefail; curl -fsSL https://opencode.ai/v2/install | bash'], 5 * 60 * 1000);
      const installedVersion = await version();
      if (!installedVersion) throw new Error('Installer selesai tetapi opencode --version belum berhasil.');
      return reply(res, 200, { ok: true, output, version: installedVersion }, origin);
    } catch (error) {
      return reply(res, 500, { ok: false, error: String(error.message || error) }, origin);
    } finally { installing = false; }
  }
  return reply(res, 404, { ok: false, error: 'Endpoint tidak ditemukan.' }, origin);
});

server.listen(PORT, HOST, () => {
  console.log('VMDESKTOPREIC OpenCode Shell Agent aktif di http://' + HOST + ':' + PORT);
  console.log('Buka VMDESKTOPREIC dan pilih ikon OpenCode. Tekan Ctrl+C untuk berhenti.');
});
