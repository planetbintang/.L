#!/usr/bin/env node
/**
 * Apply the PlanetBintang RILE master theme to every tracked HTML/CSS file
 * in this repository. Idempotent: files already linked/imported are skipped.
 * Run from repository root with: node scripts/apply-rile-theme.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';

const THEME_URL = 'https://planetbintang.github.io/.L/rile-global-theme.css';
const MARKER = 'planetbintang-rile-global-theme';
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0').filter(Boolean);
let html = 0, css = 0, skipped = 0;

for (const file of files) {
  const ext = extname(file).toLowerCase();
  if (!['.html', '.htm', '.css'].includes(ext)) continue;
  if (file.includes('/node_modules/') || file.includes('/vendor/')) { skipped++; continue; }
  let source;
  try { source = readFileSync(file, 'utf8'); } catch { skipped++; continue; }
  if (source.includes(MARKER) || source.includes(THEME_URL)) { skipped++; continue; }

  let next = source;
  if (ext === '.css') {
    const importLine = '/* ' + MARKER + ' */\n@import url("' + THEME_URL + '");\n';
    const charset = next.match(/^\uFEFF?\s*@charset\s+[^;]+;\s*/i);
    if (charset) next = charset[0] + importLine + next.slice(charset[0].length);
    else next = importLine + next;
    css++;
  } else {
    const link = '<link rel="stylesheet" href="' + THEME_URL + '" data-theme="' + MARKER + '">';
    if (/<\/head\s*>/i.test(next)) next = next.replace(/<\/head\s*>/i, link + '\n</head>');
    else if (/<html[\s>]/i.test(next)) next = next.replace(/<body[\s>]/i, link + '\n$&');
    else { skipped++; continue; }
    html++;
  }
  if (next !== source) writeFileSync(file, next, 'utf8');
}
console.log(JSON.stringify({ html_updated: html, css_updated: css, skipped }, null, 2));
