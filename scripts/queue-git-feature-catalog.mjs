import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const catalogPath = path.join(root, 'data/git-feature-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const eventPath = process.env.GITHUB_EVENT_PATH;
const inputs = eventPath ? (JSON.parse(fs.readFileSync(eventPath, 'utf8')).inputs || {}) : {};
const runId = String(process.env.GITHUB_RUN_ID || 'local');
const runNumber = String(process.env.GITHUB_RUN_NUMBER || '0');
const actor = String(process.env.GITHUB_ACTOR || 'local');
const branch = String(process.env.GITHUB_REF_NAME || 'io');
const moduleFilter = String(inputs.module_id || '').trim().toUpperCase();
const batchSize = Math.max(1, Math.min(50, Number.parseInt(inputs.batch_size || '50', 10) || 50));
const startIndex = Math.max(1, Number.parseInt(inputs.start_index || '1', 10) || 1);
const endIndex = Math.min(catalog.count, Number.parseInt(inputs.end_index || String(catalog.count), 10) || catalog.count);

if (!Array.isArray(catalog.features) || catalog.features.length !== 1500 || catalog.count !== 1500) {
  throw new Error('Katalog harus berisi tepat 1.500 fitur sebelum antrean dibuat.');
}
if (startIndex > endIndex) throw new Error('Rentang indeks tidak valid.');
const selected = catalog.features.filter(f =>
  f.index >= startIndex && f.index <= endIndex &&
  (!moduleFilter || f.id.startsWith('F-' + moduleFilter + '-'))
);
if (!selected.length) throw new Error('Tidak ada fitur yang cocok dengan filter/rentang.');
const ids = new Set();
for (const feature of selected) {
  if (!feature.id || !feature.title || !feature.module || !Number.isInteger(feature.index)) {
    throw new Error('Ada entri katalog yang tidak lengkap.');
  }
  if (ids.has(feature.id)) throw new Error('ID fitur duplikat: ' + feature.id);
  ids.add(feature.id);
}
const runKey = `PB-GIT-${runId}-${runNumber}`;
const outDir = path.join(root, 'automation/git-catalog/runs', runKey);
fs.mkdirSync(outDir, { recursive: true });
const groups = new Map();
for (const feature of selected) {
  const key = feature.id.split('-')[1];
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(feature);
}
const batches = [];
let batchNo = 0;
for (const [moduleId, features] of groups) {
  for (let offset = 0; offset < features.length; offset += batchSize) {
    batchNo += 1;
    const items = features.slice(offset, offset + batchSize).map(feature => ({
      id: feature.id,
      index: feature.index,
      module: feature.module,
      title: feature.title,
      action: feature.action,
      catalogStatus: feature.status,
      executionStatus: 'queued',
      implementationPrompt: [
        'Implementasikan fitur ini secara nyata pada repository planetbintang/.L, branch io.',
        `Fitur: ${feature.title} (${feature.id}); modul: ${feature.module}; indeks: ${feature.index}.`,
        'Audit kode dan kontrak sistem yang sudah ada sebelum mengubah file.',
        'Hubungkan UI ke operasi backend yang benar-benar tersedia; jangan membuat tombol palsu atau data simulasi sebagai hasil produksi.',
        'Tambahkan tes otomatis, validasi input, otorisasi, penanganan error, dan catatan audit sesuai kebutuhan fitur.',
        'Jangan menimpa data pengguna, rahasia, workflow, atau file yang tidak terkait.',
        'Ubah executionStatus menjadi implemented hanya setelah kode, tes, dan bukti verifikasi berhasil.'
      ].join(' ')
    }));
    const file = `batch-${String(batchNo).padStart(3, '0')}-${moduleId}.json`;
    const payload = {
      schemaVersion: 1, queueId: runKey, batchId: `${runKey}-B${String(batchNo).padStart(3, '0')}`,
      moduleId, moduleName: items[0].module, createdAt: new Date().toISOString(),
      status: 'queued-for-implementation', featureCount: items.length, features: items
    };
    fs.writeFileSync(path.join(outDir, file), JSON.stringify(payload, null, 2) + '\n', { flag: 'wx' });
    batches.push({ file: `automation/git-catalog/runs/${runKey}/${file}`, moduleId, count: items.length });
  }
}
const manifest = {
  schemaVersion: 1, queueId: runKey, repository: 'planetbintang/.L', branch,
  createdAt: new Date().toISOString(), createdBy: actor,
  catalogPath: 'data/git-feature-catalog.json', catalogCount: catalog.count,
  selectedCount: selected.length, batchSize, startIndex, endIndex,
  moduleFilter: moduleFilter || null,
  status: 'queued-for-implementation',
  note: 'Antrean dan prompt telah disiapkan. Ini bukan bukti bahwa kode fitur sudah diimplementasikan. Diperlukan executor AI/engineer yang terautentikasi untuk mengerjakan batch, menjalankan tes, dan mengubah status setelah verifikasi.',
  batches
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
const recordDir = path.join(root, 'automation/records');
fs.mkdirSync(recordDir, { recursive: true });
fs.appendFileSync(path.join(recordDir, 'changes.jsonl'), JSON.stringify({
  schemaVersion: 1, eventId: runKey, timestamp: new Date().toISOString(), actor, branch,
  event: 'git.catalog.queued', catalogPath: 'data/git-feature-catalog.json',
  selectedCount: selected.length, batchCount: batches.length, moduleFilter: moduleFilter || null,
  startIndex, endIndex, status: 'queued-for-implementation'
}) + '\n');
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) fs.appendFileSync(summaryPath, [
  '## Antrean CATALOG 1500 FITUR GIT', '',
  `- Queue: ${runKey}`, `- Fitur masuk antrean: ${selected.length}`,
  `- Batch: ${batches.length}`, `- Ukuran batch: ${batchSize}`,
  `- Status: queued-for-implementation`, '',
  '> Antrean bukan implementasi selesai. Executor implementasi dan verifikasi masih diperlukan.', '',
  ...batches.map(b => `- ${b.file} — ${b.count} fitur`)
].join('\n') + '\n');
console.log(JSON.stringify({ queueId: runKey, selectedCount: selected.length, batchCount: batches.length, status: manifest.status }, null, 2));
