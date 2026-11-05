const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

function assertFeatureContext({ feature, manifest, service }, definition) {
  const id = Number(feature?.id);
  const code = String(id).padStart(3, '0');
  if (!Number.isInteger(id) || !feature?.slug || feature.code !== code) {
    throw new Error('Metadata menu tidak lengkap atau tidak valid.');
  }
  if (definition?.featureCode !== code || definition?.title !== feature.name) {
    throw new Error(`Controller ${code} tidak sesuai dengan nama menu pada registry.`);
  }
  if (definition?.module !== feature.module || definition?.category !== feature.category) {
    throw new Error(`Controller ${code} tidak sesuai dengan modul/kategori menu.`);
  }
  if (manifest?.featureId !== id || manifest?.featureCode !== code) {
    throw new Error(`Manifest ${code} tidak cocok dengan controller menu.`);
  }
  const serviceFeature = service?.feature || {};
  for (const field of ['id', 'code', 'slug', 'name', 'module', 'category']) {
    if (serviceFeature[field] !== feature[field]) {
      throw new Error(`Kontrak layanan ${code} tidak cocok pada field ${field}.`);
    }
  }
  return { id, code };
}

function readConfiguration(key, defaults) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return { ...defaults };
    if (saved.featureId !== defaults.featureId || saved.featureCode !== defaults.featureCode) {
      return { ...defaults };
    }
    return { ...defaults, ...saved };
  } catch {
    return { ...defaults };
  }
}

function parseConfiguration(text, defaults) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Konfigurasi harus berupa objek JSON.');
  }
  if (parsed.featureId !== undefined && Number(parsed.featureId) !== defaults.featureId) {
    throw new Error('featureId tidak boleh diubah untuk bundle ini.');
  }
  if (parsed.featureCode !== undefined && String(parsed.featureCode) !== defaults.featureCode) {
    throw new Error('featureCode tidak boleh diubah untuk bundle ini.');
  }
  return { ...defaults, ...parsed };
}

export function createFeaturePanel(context, definition) {
  const { app, feature, manifest, service } = context;
  const { id, code } = assertFeatureContext(context, definition);
  const pageFile = `vendordomain/pages/${code}-${feature.slug}.reic`;
  const bundleDirectory = `vendordomain/layers/feature-${code}`;
  const storageKey = `vd-layer-config-${code}`;
  const defaults = {
    featureId: id,
    featureCode: code,
    name: feature.name,
    module: feature.module,
    enabled: true,
    environment: 'development',
    settings: {},
  };
  const config = readConfiguration(storageKey, defaults);
  const layers = Array.isArray(service.layers) ? service.layers : [];

  if (!document.querySelector('link[data-vd-layer-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./engine.css', import.meta.url).href;
    link.dataset.vdLayerCss = '1';
    document.head.appendChild(link);
  }

  const panel = document.createElement('section');
  panel.className = 'vd-layer-engine';
  panel.innerHTML = `
    <header>
      <div>
        <small>SNAPS / PLANETBINTANG · LAYERED SERVICE ENGINE</small>
        <h2>${esc(definition.title || feature.name)}</h2>
        <p>${esc(definition.description || feature.description || 'Runtime modular VendorDomain.')}</p>
        <div class="vd-layer-files">
          <span>Menu source <code>${esc(pageFile)}</code></span>
          <span>Controller <code>${esc(`${bundleDirectory}/controller.js`)}</code></span>
          <span>Service <code>${esc(`${bundleDirectory}/service.reic`)}</code></span>
        </div>
      </div>
      <b>REIC ${esc(code)}</b>
    </header>
    <div class="vd-layer-cards">
      ${layers.map((layer, index) => `
        <article>
          <i>${String(index + 1).padStart(2, '0')}</i>
          <b>${esc(layer.name)}</b>
          <span>${esc(layer.role)}</span>
        </article>
      `).join('')}
    </div>
    <div class="vd-layer-work">
      <section>
        <h3>Konfigurasi modul</h3>
        <label for="vd-layer-env-${code}">Lingkungan</label>
        <select data-layer-env id="vd-layer-env-${code}">
          <option value="development">Development</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
        <label for="vd-layer-json-${code}">Konfigurasi JSON</label>
        <textarea data-layer-json id="vd-layer-json-${code}" spellcheck="false"></textarea>
        <div class="vd-layer-actions">
          <button type="button" data-layer-validate>VALIDASI</button>
          <button type="button" data-layer-save>SIMPAN LOKAL</button>
          <button type="button" data-layer-export>EKSPOR JSON</button>
        </div>
        <p data-layer-status role="status">Runtime aktif · penyimpanan lokal browser.</p>
      </section>
      <aside>
        <h3>Kontrak layanan</h3>
        <p><b>${esc(service.serviceId)}</b></p>
        <p>${esc(service.description)}</p>
        <p>Status: <b>${esc(service.executionMode)}</b></p>
        <p>Backend: ${esc(service.backend || 'Belum dikonfigurasi')}</p>
        <p>Manifest: ${esc(manifest.version)}</p>
        <p>Operasi live: <b>tidak dijalankan oleh layer browser</b></p>
      </aside>
    </div>
  `;

  const environment = panel.querySelector('[data-layer-env]');
  const jsonInput = panel.querySelector('[data-layer-json]');
  const status = panel.querySelector('[data-layer-status]');
  environment.value = ['development', 'staging', 'production'].includes(config.environment)
    ? config.environment
    : 'development';
  jsonInput.value = JSON.stringify(config, null, 2);

  panel.querySelector('[data-layer-validate]').addEventListener('click', () => {
    try {
      parseConfiguration(jsonInput.value, defaults);
      status.textContent = 'Konfigurasi valid. Tidak ada operasi registrar, DNS, pembayaran, atau cloud yang dijalankan.';
    } catch (error) {
      status.textContent = `Konfigurasi tidak valid: ${error.message}`;
    }
  });

  panel.querySelector('[data-layer-save]').addEventListener('click', () => {
    try {
      const next = parseConfiguration(jsonInput.value, defaults);
      next.environment = environment.value;
      localStorage.setItem(storageKey, JSON.stringify(next));
      status.textContent = `Konfigurasi ${code} (${feature.name}) tersimpan lokal pada perangkat ini.`;
    } catch (error) {
      status.textContent = `Simpan dibatalkan: ${error.message}`;
    }
  });

  panel.querySelector('[data-layer-export]').addEventListener('click', () => {
    try {
      const payload = {
        feature: {
          id,
          code,
          slug: feature.slug,
          name: feature.name,
          module: feature.module,
          category: feature.category,
        },
        files: {
          pageSource: pageFile,
          controller: `${bundleDirectory}/controller.js`,
          service: `${bundleDirectory}/service.reic`,
        },
        manifest,
        service,
        configuration: {
          ...parseConfiguration(jsonInput.value, defaults),
          environment: environment.value,
        },
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `vendordomain-feature-${code}-${feature.slug}-layers.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      status.textContent = `Konfigurasi ${code} diekspor dengan metadata nama menu dan file sumber.`;
    } catch (error) {
      status.textContent = `Ekspor dibatalkan: ${error.message}`;
    }
  });

  app.appendChild(panel);
  return { mounted: true, featureId: id, featureCode: code, layerCount: layers.length, pageFile };
}
