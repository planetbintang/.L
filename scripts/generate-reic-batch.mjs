#!/usr/bin/env node
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const TARGET = 1500000;
const argv = process.argv.slice(2);
function option(name, fallback) {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : fallback;
}
const start = Number(option('start', '0'));
const count = Number(option('count', '51000'));
const out = path.resolve(option('out', 'osmediavm/recordin/generated'));
if (!Number.isSafeInteger(start) || !Number.isSafeInteger(count) || start < 0 || count < 1 || start + count > TARGET) {
  throw new Error('Rentang harus berada dalam indeks 0 sampai 1499999.');
}
const groups = ['antarmuka','data','runtime','keamanan','media','integrasi','penyimpanan','diagnostik','navigasi','komponen'];
const actions = ['kelola','baca','tulis','validasi','indeks','hubungkan','pantau','pulihkan','render','konfigurasi'];
const pad = n => String(n).padStart(7, '0');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
await mkdir(out, { recursive: true });
const files = [];
let created = 0;
let skipped = 0;
for (let id = start; id < start + count; id++) {
  const group = groups[Math.floor(id / 100) % groups.length];
  const action = actions[Math.floor(id / 10) % actions.length];
  const title = group + '-' + action + '-' + pad(id);
  const file = path.join(out, pad(id) + '-' + slug(title) + '.reic');
  const schema = { id: 'REIC-' + pad(id), title, category: group, operation: action, version: '1.0.0', status: 'specification', inputs: [{ name: 'payload', type: 'object', required: false }], outputs: [{ name: 'result', type: 'object' }], permissions: [] };
  const source = [
    '--- REIC COMPONENT ---',
    'id: REIC-' + pad(id),
    'title: ' + title,
    'category: ' + group,
    'operation: ' + action,
    'version: 1.0.0',
    'runtime: planetbintang-reic',
    '--- END REIC HEADER ---',
    '<section class="reic-module" data-reic-id="REIC-' + pad(id) + '">',
    '  <header><small>REIC-' + pad(id) + '</small><h2>' + title + '</h2></header>',
    '  <p>Definisi modul ' + group + ' untuk operasi ' + action + '.</p>',
    '  <output aria-live="polite">Menunggu integrasi runtime.</output>',
    '</section>',
    '<script type="application/json" data-reic-schema>' + JSON.stringify(schema) + '</script>',
    ''
  ].join('\n');
  try {
    await access(file);
    skipped++;
  } catch {
    await writeFile(file, source, { encoding: 'utf8', flag: 'wx' });
    created++;
    files.push({ id: schema.id, file: path.relative(process.cwd(), file).split(path.sep).join('/'), title });
  }
}
const indexPath = path.join(out, 'batch-' + pad(start) + '-' + pad(start + count - 1) + '.json');
await writeFile(indexPath, JSON.stringify({ target: TARGET, start, requested: count, created, skipped, files }, null, 2), { encoding: 'utf8', flag: 'wx' });
console.log(JSON.stringify({ target: TARGET, start, requested: count, created, skipped, index: indexPath }, null, 2));
