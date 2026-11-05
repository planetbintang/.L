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

function decodeHtml(value) {
  return String(value).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function tagTexts(source, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  return [...source.matchAll(pattern)].map((match) => decodeHtml(match[1].replace(/<[^>]*>/g, '').trim()));
}

function pageIdentityMatches(source, feature) {
  const name = String(feature.name || '');
  const matchesName = (value) => value === name || value.startsWith(`${name} ·`);
  if (tagTexts(source, 'h1').some(matchesName) || tagTexts(source, 'title').some(matchesName)) return true;
  if (tagTexts(source, 'h2').some(matchesName)) return true;

  for (const attribute of ['data-feature-name', 'data-dns-module']) {
    const pattern = new RegExp(`${attribute}="([^"]*)"`, 'gi');
    for (const match of source.matchAll(pattern)) {
      const value = decodeHtml(match[1]);
      if (attribute === 'data-feature-name' && value === name) return true;
      if (attribute === 'data-dns-module') {
        try {
          const metadata = JSON.parse(value);
          if (metadata.id === feature.id && metadata.name === name && metadata.slug === feature.slug) return true;
        } catch {
          // Invalid embedded metadata is not an identity match.
        }
      }
    }
  }
  return false;
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

  const slug = String(feature.slug || '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push(`Fitur ${code}: slug tidak aman atau tidak valid (${slug})`);
  } else {
    const pageSource = path.join(vendorRoot, 'pages', `${code}-${slug}.reic`);
    if (!existsSync(pageSource)) {
      errors.push(`Fitur ${code}: file sumber menu tidak cocok dengan slug (${path.relative(vendorRoot, pageSource)})`);
    } else {
      const pageMarkup = readFileSync(pageSource, 'utf8');
      if (!pageIdentityMatches(pageMarkup, feature)) {
        errors.push(`Fitur ${code}: nama menu tidak ditemukan pada judul atau metadata file ${path.relative(vendorRoot, pageSource)}`);
      }
      if (requireHtml) {
        const pageHtml = pageSource.replace(/\.reic$/i, '.html');
        if (!existsSync(pageHtml)) {
          errors.push(`Fitur ${code}: hasil HTML menu tidak ditemukan (${path.relative(vendorRoot, pageHtml)})`);
        } else if (!pageIdentityMatches(readFileSync(pageHtml, 'utf8'), feature)) {
          errors.push(`Fitur ${code}: nama menu tidak cocok pada hasil HTML ${path.relative(vendorRoot, pageHtml)}`);
        }
      }
    }
  }

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

  if (controllerFile && existsSync(controllerFile)) {
    const controllerSource = readFileSync(controllerFile, 'utf8');
    for (const [field, value] of Object.entries({
      name: feature.name,
      module: feature.module,
      category: feature.category,
      code,
    })) {
      if (!controllerSource.includes(JSON.stringify(String(value)))) {
        errors.push(`Controller ${code}: ${field} tidak cocok dengan nama menu/registry`);
      }
    }
  }

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
      for (const field of ['id', 'code', 'slug', 'name', 'module', 'category']) {
        if (service.feature?.[field] !== feature[field]) {
          errors.push(`Service ${code}: feature.${field} tidak cocok dengan registry`);
        }
      }
      if (!Array.isArray(service.layers) || service.layers.length !== manifest.layerCount) {
        errors.push(`Service ${code}: jumlah layer tidak cocok dengan manifest`);
      }
    }
  }
  if (controllerFile && !existsSync(controllerFile)) errors.push(`Controller ${code}: entry tidak ditemukan`);
}

for (const file of [
  path.join(featureRoot, 'feature-runtime.js'),
  path.join(vendorRoot, 'cloud', 'cloud.js'),
  path.join(vendorRoot, 'layer-system', 'runtime.js'),
  path.join(vendorRoot, 'layer-system', 'engine.js'),
]) {
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
