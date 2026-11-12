import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';

const html = await readFile(new URL('../../galeri/index.html', import.meta.url), 'utf8');
const blocks = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(code => code.trim());
if (!blocks.length) throw new Error('No inline scripts found in galeri/index.html');
blocks.forEach((code, index) => new Script(code, { filename: 'galeri/index.html inline script ' + (index + 1) }));
console.log('GALERI frontend inline JavaScript syntax OK (' + blocks.length + ' blocks)');
