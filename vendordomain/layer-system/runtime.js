function assertIdentity(feature, manifest, service) {
  const id = Number(feature?.id);
  const code = String(id).padStart(3, '0');
  if (!Number.isInteger(id) || id < 1 || id > 500 || feature?.code !== code) {
    throw new Error('Identitas fitur pada registry tidak valid.');
  }
  if (manifest?.featureId !== id || manifest?.featureCode !== code) {
    throw new Error(`Manifest tidak cocok dengan fitur ${code}.`);
  }
  if (manifest?.entry !== manifest?.controller) {
    throw new Error(`Entry controller manifest ${code} tidak konsisten.`);
  }
  if (!service) return;
  if (service?.serviceId !== `vendordomain.feature.${code}`) {
    throw new Error(`Service ID tidak cocok dengan fitur ${code}.`);
  }

  const expected = {
    id,
    code,
    slug: feature.slug,
    name: feature.name,
    module: feature.module,
    category: feature.category,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (service?.feature?.[field] !== value) {
      throw new Error(`Kontrak fitur ${code} tidak cocok pada field ${field}.`);
    }
  }
}

function resolveBundleAsset(relativePath, manifestUrl, bundleBase, label) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    throw new Error(`${label} tidak didefinisikan pada manifest.`);
  }
  const assetUrl = new URL(relativePath, manifestUrl);
  if (assetUrl.origin !== bundleBase.origin || !assetUrl.pathname.startsWith(bundleBase.pathname)) {
    throw new Error(`${label} berada di luar bundle fitur yang diizinkan.`);
  }
  return assetUrl;
}

export async function mountFeatureLayer(app, feature) {
  const code = String(Number(feature?.id)).padStart(3, '0');
  const manifestUrl = new URL(`../../../layers/feature-${code}/manifest.json`, location.href);
  const bundleBase = new URL('./', manifestUrl);

  const manifestResponse = await fetch(manifestUrl, { cache: 'no-store' });
  if (!manifestResponse.ok) throw new Error(`Manifest lapisan ${code} tidak ditemukan.`);
  const manifest = await manifestResponse.json();
  assertIdentity(feature, manifest, null);

  const serviceUrl = resolveBundleAsset(manifest.service, manifestUrl, bundleBase, 'Service contract');
  const serviceResponse = await fetch(serviceUrl, { cache: 'no-store' });
  if (!serviceResponse.ok) throw new Error(`Kontrak layanan ${code} tidak ditemukan.`);
  const service = await serviceResponse.json();
  assertIdentity(feature, manifest, service);

  const controllerUrl = resolveBundleAsset(manifest.controller, manifestUrl, bundleBase, 'Controller');
  const controllerModule = await import(controllerUrl.href);
  if (typeof controllerModule.default !== 'function') {
    throw new Error(`Controller ${code} tidak memiliki entrypoint default.`);
  }
  return controllerModule.default({ app, feature, manifest, service });
}
