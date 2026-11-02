#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const root = path.resolve(opt('dir', 'osmediavm/recordin/generated'));
const expected = Number(opt('expected', '1500000'));
const start = Number(opt('start', '0'));
const end = start + expected;
const reportPath = path.resolve(opt('report', 'osmediavm/recordin/verification-report.json'));
if (!Number.isSafeInteger(expected) || expected < 1 || !Number.isSafeInteger(start) || start < 0) {
  throw new Error('Parameter --start dan --expected harus berupa bilangan bulat valid.');
}
const ids = new Set();
let files = 0;
let invalid = 0;
let duplicateIds = 0;
let malformedSchemas = 0;
let filenameMismatches = 0;
const errors = [];
function fail(file, reason) {
  invalid++;
  if (errors.length < 100) errors.push({ file: path.relative(root, file).split(path.sep).join('/'), reason });
}
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!item.isFile() || !item.name.endsWith('.reic')) continue;
    files++;
    let body;
    try {
      body = await readFile(full, 'utf8');
    } catch (error) {
      fail(full, 'gagal membaca file: ' + error.message);
      continue;
    }
    const idMatch = body.match(new RegExp('^id: REIC-([0-9]{7})$', 'm'));
    const schemaOpen = '<script type="application/json" data-reic-schema>';
    const schemaStart = body.indexOf(schemaOpen);
    const schemaEnd = schemaStart >= 0 ? body.indexOf('</script>', schemaStart + schemaOpen.length) : -1;
    const schemaText = schemaStart >= 0 && schemaEnd >= 0
      ? body.slice(schemaStart + schemaOpen.length, schemaEnd) : null;
    if (!idMatch || !body.startsWith('--- REIC COMPONENT ---') ||
        !body.includes('--- END REIC HEADER ---') ||
        !body.includes('<section class="reic-module"') ||
        schemaText === null || !body.includes('runtime: planetbintang-reic')) {
      fail(full, 'header atau struktur komponen REIC tidak lengkap');
      continue;
    }
    const id = Number(idMatch[1]);
    if (id < start || id >= end) {
      fail(full, 'ID berada di luar rentang yang diharapkan');
      continue;
    }
    if (ids.has(id)) {
      duplicateIds++;
      fail(full, 'ID duplikat: REIC-' + idMatch[1]);
      continue;
    }
    ids.add(id);
    if (!item.name.startsWith(idMatch[1] + '-')) {
      filenameMismatches++;
      fail(full, 'nama file tidak sesuai dengan ID di dalam file');
    }
    try {
      const schema = JSON.parse(schemaText);
      if (schema.id !== 'REIC-' + idMatch[1] ||
          typeof schema.title !== 'string' ||
          typeof schema.category !== 'string' ||
          typeof schema.operation !== 'string' ||
          schema.version !== '1.0.0' ||
          !Array.isArray(schema.inputs) ||
          !Array.isArray(schema.outputs)) {
        malformedSchemas++;
        fail(full, 'skema JSON tidak sesuai atau tidak lengkap');
      }
    } catch {
      malformedSchemas++;
      fail(full, 'skema JSON tidak valid');
    }
  }
}
await walk(root);
const missing = expected - ids.size;
const report = {
  directory: root,
  expected,
  physicalReicFiles: files,
  uniqueIds: ids.size,
  missingIds: missing,
  duplicateIds,
  malformedSchemas,
  filenameMismatches,
  invalidFiles: invalid,
  expectedRange: { first: start, last: end - 1 },
  sampleErrors: errors,
  passed: files === expected && ids.size === expected && missing === 0 &&
    duplicateIds === 0 && malformedSchemas === 0 && filenameMismatches === 0 && invalid === 0,
  verifiedAt: new Date().toISOString()
};
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);
