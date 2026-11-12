import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';

const files = ['../../galeri/index.html', '../../galeri/admin.html'];
for (const relative of files) {
  const html = await readFile(new URL(relative, import.meta.url), 'utf8');
  const blocks = [...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)].map(match => match[1]).filter(code => code.trim());
  if (!blocks.length) throw new Error('No inline scripts found in ' + relative);
  blocks.forEach((code, index) => new Script(code, { filename: relative + ' inline script ' + (index + 1) }));
  console.log(relative + ': JavaScript syntax OK (' + blocks.length + ' blocks)');
}
const publicHtml = await readFile(new URL('../../galeri/index.html', import.meta.url), 'utf8');
const adminHtml = await readFile(new URL('../../galeri/admin.html', import.meta.url), 'utf8');
for (const required of ['/api/v1/public/media?limit=100', 'data-server-media', 'loadPublishedMedia']) if (!publicHtml.includes(required)) throw new Error('Public gallery contract missing: ' + required);
for (const required of ['/api/v1/admin/session', '/api/v1/admin/media', 'review', 'publish']) if (!adminHtml.includes(required)) throw new Error('Admin dashboard contract missing: ' + required);
console.log('GALERI public-feed and admin-publishing contracts OK');
