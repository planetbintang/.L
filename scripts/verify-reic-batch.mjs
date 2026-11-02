#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const root = path.resolve(opt('dir', 'osmediavm/recordin/generated'));
const expected = Number(opt('expected', '151000'));
const start = Number(opt('start', '0'));
const end = start + expected;
const ids = new Set();
let files = 0;
let invalid = 0;
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) await walk(full);
    else if (item.isFile() && item.name.endsWith('.reic')) {
      files++;
      const body = await readFile(full, 'utf8');
      const match = body.match(/^id: REIC-(\d{7})$/m);
      if (!match || !body.includes('--- REIC COMPONENT ---') || !body.includes('data-reic-schema')) {
        invalid++;
        continue;
      }
      const id = Number(match[1]);
      if (id < start || id >= end || ids.has(id)) invalid++;
      ids.add(id);
    }
  }
}
await walk(root);
const missing = expected - ids.size;
const report = { directory: root, expected, files, uniqueIds: ids.size, missing, invalid, range: [start, end - 1], passed: files === expected && ids.size === expected && missing === 0 && invalid === 0 };
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);
