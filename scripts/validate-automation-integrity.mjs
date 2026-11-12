import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requestsDir = path.join(root, 'automation/requests');
const logPath = path.join(root, 'automation/records/changes.jsonl');
const failures = [];
const report = (ok, message) => console.log(`${ok ? 'PASS' : 'FAIL'}: ${message}`);

const requestFiles = fs.existsSync(requestsDir)
  ? fs.readdirSync(requestsDir).filter(name => name.endsWith('.json')).sort()
  : [];
const hasLog = fs.existsSync(logPath);

if (requestFiles.length === 0 && !hasLog) {
  report(true, 'Belum ada request/audit record; pemeriksaan struktur kode tetap berjalan.');
  process.exit(0);
}
if (requestFiles.length > 0 && !hasLog) failures.push('Request ditemukan tetapi changes.jsonl tidak ada.');
if (requestFiles.length === 0 && hasLog && fs.readFileSync(logPath, 'utf8').trim()) {
  failures.push('Audit log berisi event tetapi folder request kosong.');
}

const requests = new Map();
for (const name of requestFiles) {
  const fullPath = path.join(requestsDir, name);
  try {
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    if (!/^PB-[A-Za-z0-9-]+$/.test(data.requestId || '')) throw new Error('requestId tidak valid');
    if (name !== `${data.requestId}.json`) throw new Error('Nama file tidak cocok dengan requestId');
    if (requests.has(data.requestId)) throw new Error('requestId duplikat');
    if (data.schemaVersion !== 1) throw new Error('schemaVersion tidak didukung');
    if (!data.createdAt || Number.isNaN(Date.parse(data.createdAt))) throw new Error('createdAt tidak valid');
    if (!data.actor || !data.branch || !data.changeSummary) throw new Error('actor, branch, dan changeSummary wajib ada');
    if (!['prepared-for-review', 'in-progress', 'verified', 'rejected'].includes(data.status)) {
      throw new Error(`status tidak dikenal: ${data.status}`);
    }
    if (!Array.isArray(data.filesCreated)) throw new Error('filesCreated harus berupa array');
    const paths = new Set();
    for (const file of data.filesCreated) {
      if (!file || typeof file.path !== 'string' || !file.path || path.posix.isAbsolute(file.path)
          || file.path.split('/').some(part => !part || part === '.' || part === '..')) {
        throw new Error('path file tidak aman');
      }
      if (paths.has(file.path)) throw new Error(`path duplikat: ${file.path}`);
      paths.add(file.path);
      if (!Number.isInteger(file.bytes) || file.bytes < 0) throw new Error(`ukuran byte tidak valid: ${file.path}`);
    }
    requests.set(data.requestId, data);
    report(true, `Request ${data.requestId} valid`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
  }
}

if (hasLog) {
  const raw = fs.readFileSync(logPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const eventIds = new Set();
  let validLines = 0;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.schemaVersion !== 1) throw new Error('schemaVersion tidak didukung');
      if (!event.eventId || eventIds.has(event.eventId)) throw new Error('eventId kosong atau duplikat');
      if (!event.timestamp || Number.isNaN(Date.parse(event.timestamp))) throw new Error('timestamp tidak valid');

      // Keep the original append-only history readable: catalog queue records
      // predate request records and intentionally have no requestPath.
      if (event.event === 'git.catalog.queued') {
        if (!event.catalogPath || !event.catalogPath.startsWith('data/')) throw new Error('catalogPath tidak valid');
        if (!Number.isInteger(event.selectedCount) || event.selectedCount < 0) throw new Error('selectedCount tidak valid');
        if (!Number.isInteger(event.batchCount) || event.batchCount < 0) throw new Error('batchCount tidak valid');
        if (event.status !== 'queued-for-implementation') throw new Error('status katalog tidak valid');
        eventIds.add(event.eventId);
        validLines++;
        continue;
      }

      if (event.event !== 'automation.request.prepared') throw new Error('jenis event tidak dikenal');
      if (!event.requestPath || !event.requestPath.startsWith('automation/requests/')) throw new Error('requestPath tidak valid');
      if (!requests.has(event.eventId)) throw new Error(`request tidak ditemukan untuk ${event.eventId}`);
      const request = requests.get(event.eventId);
      if (request.requestId !== event.eventId) throw new Error('requestId dan eventId tidak cocok');
      eventIds.add(event.eventId);
      validLines++;
    } catch (error) {
      failures.push(`changes.jsonl baris ${index + 1}: ${error.message}`);
    }
  }
  report(failures.length === 0, `${validLines} audit event diperiksa`);
  for (const id of requests.keys()) {
    if (!eventIds.has(id)) failures.push(`Request ${id} tidak memiliki event audit`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`::error::${failure}`);
  console.error(`Integritas gagal: ${failures.length} masalah.`);
  process.exit(1);
}
report(true, 'Seluruh request dan jejak audit konsisten.');
