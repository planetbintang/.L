import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd());
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const fail = (message) => { console.error('CIP CHECK FAILED:', message); process.exitCode = 1; };
const registry = await readJson('vendordomain/cip/registry.reic');
const architecture = await readJson('vendordomain/cip-system.reic');
const admin = await readJson('vendordomain/cip-admin.reic');

if (registry.product !== 'CIP') fail('Registry product must be CIP.');
if (registry.sourceOfTruth !== 'vendordomain/cip-system.reic') fail('Registry source-of-truth path mismatch.');
if (registry.moduleCapacity?.logical !== architecture.scale?.logicalModuleCapacity) fail('Logical module capacity differs from architecture.');
if (registry.domains.length !== architecture.moduleDomains.length) fail('Registry domain count differs from architecture.');
if (registry.moduleCapacity?.physicalModulesCreated !== registry.domains.length) fail('Physical module count must match registered domain manifests.');

const adminIds = new Set(admin.sections.map(section => section[0]));
for (const domain of registry.domains) {
  const manifest = await readJson(domain.path);
  if (manifest.id !== domain.id) fail(`Domain ID mismatch: ${domain.id}`);
  if (manifest.title !== domain.title) fail(`Domain title mismatch: ${domain.id}`);
  if (manifest.modules.length !== domain.modules.length) fail(`Module list mismatch: ${domain.id}`);
  const dir = path.dirname(path.join(root, domain.path));
  const files = await readdir(dir);
  if (!files.includes('index.reic')) fail(`Missing module manifest: ${domain.path}`);
}
for (const [id, , , endpoint] of admin.sections) {
  if (!endpoint.startsWith('/admin/cip/')) fail(`Invalid CIP API path for section ${id}`);
}
if (!adminIds.has('dashboard')) fail('Dashboard section is required.');
console.log(`CIP integrity OK: ${registry.domains.length} domains; ${registry.moduleCapacity.logical} logical slots; registry and API routes aligned.`);
