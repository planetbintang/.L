import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const input = process.env.GITHUB_EVENT_PATH
  ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')).inputs || {}
  : {};
const featureId = String(input.feature_id || '').trim();
const summary = String(input.change_summary || '').trim();
const filesRaw = String(input.files_json || '[]').trim();
const runId = String(process.env.GITHUB_RUN_ID || 'local');
const runNumber = String(process.env.GITHUB_RUN_NUMBER || '0');
const actor = String(process.env.GITHUB_ACTOR || 'unknown');
const branch = String(process.env.GITHUB_REF_NAME || 'io');

if (!summary) throw new Error('change_summary wajib diisi.');
if (summary.length > 2000) throw new Error('change_summary maksimal 2.000 karakter.');

let requestedFiles;
try { requestedFiles = JSON.parse(filesRaw || '[]'); }
catch { throw new Error('files_json harus berupa JSON array yang valid.'); }
if (!Array.isArray(requestedFiles)) throw new Error('files_json harus berupa JSON array.');
if (requestedFiles.length > 20) throw new Error('Maksimal 20 file baru per tugas.');

const catalogPath = path.join(root, 'data/git-feature-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const feature = featureId ? catalog.features.find(item => item.id === featureId) : null;
if (featureId && !feature) throw new Error(`ID fitur tidak ditemukan: ${featureId}`);

const reserved = [
  /^\.git(?:\/|$)/i,
  /^\.github\/workflows(?:\/|$)/i,
  /^automation\/records(?:\/|$)/i,
  /^automation\/requests(?:\/|$)/i,
  /^\.env(?:\.|$)/i,
  /(^|\/)(secrets?|credentials?)(\/|\.|$)/i,
  /(^|\/)(node_modules|vendor|\.next|dist)(\/|$)/i
];
const seen = new Set();
let totalBytes = 0;
const created = [];

for (const item of requestedFiles) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Setiap item file harus berupa objek.');
  const relative = String(item.path || '').replaceAll('\\', '/');
  const content = item.content;
  if (!relative || relative.startsWith('/') || /^[A-Za-z]:/.test(relative) || relative.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Path tidak aman: ${relative}`);
  }
  if (reserved.some(pattern => pattern.test(relative))) throw new Error(`Path dilindungi: ${relative}`);
  if (seen.has(relative)) throw new Error(`Path duplikat: ${relative}`);
  seen.add(relative);
  if (typeof content !== 'string') throw new Error(`Konten harus string: ${relative}`);
  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > 65536) throw new Error(`Ukuran file melebihi 64 KiB: ${relative}`);
  totalBytes += bytes;
  if (totalBytes > 262144) throw new Error('Total konten melebihi 256 KiB per tugas.');
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/.test(content)) {
    throw new Error(`Konten tampak mengandung kredensial: ${relative}`);
  }
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(root + path.sep)) throw new Error(`Path keluar dari repositori: ${relative}`);
  if (fs.existsSync(absolute)) throw new Error(`File sudah ada; workflow ini hanya membuat file baru: ${relative}`);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, { encoding: 'utf8', flag: 'wx' });
  created.push({ path: relative, bytes });
}

const stamp = new Date().toISOString();
const requestId = `PB-${runId}-${runNumber}`;
const requestDir = path.join(root, 'automation/requests');
const recordDir = path.join(root, 'automation/records');
fs.mkdirSync(requestDir, { recursive: true });
fs.mkdirSync(recordDir, { recursive: true });

const request = {
  schemaVersion: 1, requestId, createdAt: stamp, actor, branch,
  status: 'prepared-for-review',
  feature: feature ? { id: feature.id, title: feature.title, module: feature.module, action: feature.action } : null,
  changeSummary: summary,
  implementationPrompt: [
    'Implementasikan tugas PlanetBintang berikut pada repository ini.',
    feature ? `Fitur: ${feature.title} (${feature.id}) — modul ${feature.module}.` : 'Tugas umum tanpa ID katalog.',
    `Instruksi: ${summary}`,
    'Pertahankan kontrak REKONSTRUKSI-SISTEM.md, audit sebelum mengubah, tambahkan tes, dan catat bukti hasil.',
    'Jangan menganggap katalog atau file scaffold sebagai fitur selesai; verifikasi implementasi aktual.'
  ].join('\\n'),
  filesCreated: created
};
const requestPath = `automation/requests/${requestId}.json`;
fs.writeFileSync(path.join(root, requestPath), JSON.stringify(request, null, 2) + '\\n', { flag: 'wx' });

const record = {
  schemaVersion: 1, eventId: requestId, timestamp: stamp, actor, branch,
  event: 'automation.request.prepared',
  requestPath, featureId: feature?.id || null,
  summary, filesCreated: created,
  commit: null,
  status: 'prepared-for-review'
};
const logPath = path.join(recordDir, 'changes.jsonl');
fs.appendFileSync(logPath, JSON.stringify(record) + '\\n');

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  fs.appendFileSync(summaryPath, [
    '## PlanetBintang Automation',
    '',
    `- Request: ${requestId}`,
    `- Feature: ${feature ? feature.id + ' — ' + feature.title : 'General task'}`,
    `- New files: ${created.length}`,
    `- Request record: ${requestPath}`,
    `- Change log: automation/records/changes.jsonl`,
    '',
    ...created.map(file => `- ${file.path} (${file.bytes} bytes)`)
  ].join('\\n') + '\\n');
}
console.log(JSON.stringify({ requestId, requestPath, created, status: record.status }, null, 2));
