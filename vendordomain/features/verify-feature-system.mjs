#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const featureRoot = path.dirname(fileURLToPath(import.meta.url));
const vendorRoot = path.resolve(featureRoot, '..');
const requireHtml = process.argv.includes('--require-html');
const errors = [];

function readJson(file, label) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${label}: JSON tidak dapat dibaca (${error.message})`);
    return null;
  }
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function resolveBundleFile(bundleRoot, relativePath, label) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    errors.push(`${label}: path tidak tersedia`);
    return null;
  }
  const resolved = path.resolve(bundleRoot, relativePath);
  if (!isInside(bundleRoot, resolved)) {
    errors.push(`${label}: path keluar dari direktori bundle`);
    return null;
  }
  if (!existsSync(resolved)) errors.push(`${label}: berkas tidak ditemukan (${relativePath})`);
  return resolved;
}

function normalizedHtmlPath(detailPath, featureId) {
  if (typeof detailPath !== 'string' || !detailPath.trim()) {
    errors.push(`Fitur ${featureId}: detailPath kosong`);
    return null;
  }
  let target = detailPath.trim();
  if (target.startsWith('/') || target.includes('\\') || target.includes('?') || target.includes('#')) {
    errors.push(`Fitur ${featureId}: detailPath bukan path relatif yang valid`);
    return null;
  }
  if (target.endsWith('/')) target += 'index.html';
  else if (/\.reic$/i.test(target)) target = target.replace(/\.reic$/i, '.html');
  if (!/\.html$/i.test(target)) {
    errors.push(`Fitur ${featureId}: detailPath tidak menunjuk ke HTML (${detailPath})`);
    return null;
  }

  const resolved = path.resolve(featureRoot, target);
  if (!isInside(vendorRoot, resolved)) {
    errors.push(`Fitur ${featureId}: detailPath keluar dari folder vendordomain`);
    return null;
  }
  return { target, resolved };
}

const registryFile = path.join(featureRoot, 'index.json');
const registry = readJson(registryFile, 'Registry fitur');
const features = Array.isArray(registry?.features) ? registry.features : [];
if (features.length !== 500) errors.push(`Registry harus memuat 500 fitur; ditemukan ${features.length}`);

const ids = new Set();
const codes = new Set();
for (const feature of features) {
  const id = Number(feature.id);
  const code = String(feature.code || '');
  if (!Number.isInteger(id) || id < 1 || id > 500 || ids.has(id)) {
    errors.push(`ID fitur tidak valid atau duplikat: ${feature.id}`);
  }
  if (!/^\d{3}$/.test(code) || codes.has(code) || code !== String(id).padStart(3, '0')) {
    errors.push(`Kode fitur tidak valid atau duplikat untuk ID ${feature.id}: ${code}`);
  }
  ids.add(id);
  codes.add(code);

  const route = normalizedHtmlPath(feature.detailPath, id);
  if (route) {
    const sourceFile = route.resolved.replace(/\.html$/i, '.reic');
    if (!existsSync(sourceFile)) errors.push(`Fitur ${code}: sumber REIC tidak ditemukan (${path.relative(vendorRoot, sourceFile)})`);
    if (requireHtml && !existsSync(route.resolved)) errors.push(`Fitur ${code}: hasil HTML build tidak ditemukan (${path.relative(vendorRoot, route.resolved)})`);
  }

  const bundleRoot = path.resolve(vendorRoot, 'layers', `feature-${code}`);
  const manifestFile = path.join(bundleRoot, 'manifest.json');
  const manifest = readJson(manifestFile, `Manifest ${code}`);
  if (!manifest) continue;
  if (manifest.featureId !== id || manifest.featureCode !== code) {
    errors.push(`Manifest ${code}: identitas tidak cocok dengan registry`);
  }
  if (!Number.isInteger(manifest.layerCount) || manifest.layerCount < 1) {
    errors.push(`Manifest ${code}: layerCount tidak valid`);
  }
  const controllerFile = resolveBundleFile(bundleRoot, manifest.controller, `Controller ${code}`);
  const serviceFile = resolveBundleFile(bundleRoot, manifest.service, `Service ${code}`);
  if (manifest.entry !== manifest.controller) errors.push(`Manifest ${code}: entry dan controller tidak cocok`);

  const runtimeFile = typeof manifest.sharedRuntime === 'string'
    ? path.resolve(bundleRoot, manifest.sharedRuntime)
    : '';
  const expectedRuntime = path.join(vendorRoot, 'layer-system', 'runtime.js');
  if (!runtimeFile || !isInside(vendorRoot, runtimeFile) || runtimeFile !== expectedRuntime || !existsSync(runtimeFile)) {
    errors.push(`Manifest ${code}: sharedRuntime tidak mengarah ke runtime bersama yang valid`);
  }

  if (serviceFile && existsSync(serviceFile)) {
    const service = readJson(serviceFile, `Service ${code}`);
    if (service) {
      if (service.feature?.id !== id || service.feature?.code !== code) {
        errors.push(`Service ${code}: identitas tidak cocok dengan registry`);
      }
      if (!Array.isArray(service.layers) || service.layers.length !== manifest.layerCount) {
        errors.push(`Service ${code}: jumlah layer tidak cocok dengan manifest`);
      }
    }
  }
  if (controllerFile && !existsSync(controllerFile)) errors.push(`Controller ${code}: entry tidak ditemukan`);
}

for (const file of [path.join(featureRoot, 'feature-runtime.js'), path.join(vendorRoot, 'cloud', 'cloud.js')]) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    errors.push(`Sintaks JavaScript gagal (${path.relative(vendorRoot, file)}): ${(result.stderr || result.stdout || 'unknown error').trim()}`);
  }
}

const portalFile = path.join(vendorRoot, 'index.html');
try {
  const portalHtml = readFileSync(portalFile, 'utf8');
  const inlineScripts = [...portalHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .filter((source) => source.trim());
  if (!inlineScripts.length) errors.push('Portal utama: JavaScript inline tidak ditemukan');
  inlineScripts.forEach((source, index) => {
    try {
      new vm.Script(source, { filename: `vendordomain/index.html:inline-${index + 1}` });
    } catch (error) {
      errors.push(`Sintaks JavaScript inline portal gagal: ${error.message}`);
    }
  });
} catch (error) {
  errors.push(`Portal utama tidak dapat dibaca: ${error.message}`);
}

if (errors.length) {
  console.error(`VendorDomain feature validation gagal (${errors.length} masalah):`);
  for (const error of errors.slice(0, 100)) console.error(` - ${error}`);
  if (errors.length > 100) console.error(` - ... ${errors.length - 100} masalah lainnya`);
  process.exitCode = 1;
} else {
  const mode = requireHtml ? 'sumber, bundle, runtime, portal, dan 500 hasil HTML build' : 'sumber, bundle, runtime, dan portal (mode checkout sumber)';
  console.log(`VendorDomain feature validation lulus: 500 fitur; ${mode}.`);
}
