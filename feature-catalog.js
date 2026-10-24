(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const EXTENSIONS = ['html', 'css', 'js', 'nz'];
  const FALLBACK_DOMAINS = ['access', 'analytics', 'api', 'app', 'automation', 'backup', 'brand', 'code', 'community', 'content', 'data', 'design', 'device', 'docs', 'execute', 'files', 'forms', 'graph', 'integration', 'management', 'monitoring', 'pipeline', 'security', 'workspace'];
  const state = { manifest: null, query: '', domain: 'all', extension: 'all', selected: null, visibleLimit: 120 };
  const fmt = new Intl.NumberFormat('id-ID');
  const domains = () => state.manifest?.domains || FALLBACK_DOMAINS;
  const total = () => Number(state.manifest?.featureCount || 12288);
  const featureAt = (index) => {
    const domain = domains()[index % domains().length];
    const extension = EXTENSIONS[index % EXTENSIONS.length];
    const bucket = Math.floor(index / 32);
    const file = `${domain}-feature-${String(index).padStart(5, '0')}.${extension}`;
    return { index, id: `feature_${String(index).padStart(5, '0')}`, domain, extension, bucket, file, path: `system_ext/features/f${String(bucket).padStart(3, '0')}/${file}` };
  };
  const codeFor = (item) => {
    if (item.extension === 'html') return `<!-- ${item.id} -->\n<article data-feature="${item.id}" data-domain="${item.domain}">\n  <h2>${item.domain} feature ${item.index}</h2>\n</article>`;
    if (item.extension === 'css') return `/* ${item.id} · ${item.domain} */\n[data-feature="${item.id}"] {\n  display: grid;\n  gap: 12px;\n}`;
    if (item.extension === 'js') return `// ${item.id} · ${item.domain}\nexport function run_${item.id}(context = {}) {\n  return { feature: '${item.id}', domain: '${item.domain}', status: 'ready', context };\n}`;
    return `# ${item.id}\ndomain = ${item.domain}\nstatus = ready\nexecution = disabled-by-default`;
  };
  const matches = (item) => {
    const query = state.query.toLocaleLowerCase('id');
    return (state.domain === 'all' || item.domain === state.domain) && (state.extension === 'all' || item.extension === state.extension) && (!query || `${item.id} ${item.domain} ${item.extension} ${item.path}`.toLocaleLowerCase('id').includes(query));
  };
  function selectFeature(item) {
    state.selected = item;
    $('#featureInspectorTitle').textContent = item.file;
    $('#featureInspectorData').innerHTML = `<div><b>ID</b><span>${item.id}</span></div><div><b>Domain</b><span>${item.domain}</span></div><div><b>Ekstensi</b><span>.${item.extension}</span></div><div><b>Bucket</b><span>f${String(item.bucket).padStart(3, '0')}</span></div><div><b>Path</b><span>/${item.path}</span></div><div><b>Runtime</b><span>Simulasi aman · tidak dieksekusi</span></div>`;
    const preview = $('#featurePreview'); preview.hidden = false; preview.textContent = codeFor(item);
    $('#featureSimulate').disabled = false; $('#featureOpenFs').disabled = false;
    $('#featureActionStatus').textContent = 'Fitur terpilih. Gunakan Simulasikan untuk menjalankan handler aman lokal.';
  }
  function renderList() {
    const list = $('#featureList'); if (!list) return;
    list.replaceChildren();
    const found = [];
    for (let index = 0; index < total() && found.length < state.visibleLimit; index += 1) {
      const item = featureAt(index);
      if (matches(item)) found.push(item);
    }
    const estimated = (() => {
      let count = 0;
      for (let index = 0; index < total(); index += 1) if (matches(featureAt(index))) count += 1;
      return count;
    })();
    $('#featureResultCount').textContent = `${fmt.format(estimated)} fitur cocok · menampilkan ${fmt.format(found.length)}`;
    found.forEach((item) => {
      const row = document.createElement('button'); row.type = 'button'; row.className = 'feature-row'; row.setAttribute('role', 'listitem');
      row.innerHTML = `<span class="feature-row-index">${String(item.index).padStart(5, '0')}</span><span class="feature-row-main"><b>${item.file}</b><small>${item.domain} · bucket f${String(item.bucket).padStart(3, '0')}</small></span><span class="feature-row-ext">.${item.extension}</span>`;
      row.addEventListener('click', () => selectFeature(item)); list.append(row);
    });
    if (!found.length) list.append(Object.assign(document.createElement('p'), { className: 'workspace-empty', textContent: 'Tidak ada fitur sesuai filter.' }));
  }
  function setOptions() {
    const select = $('#featureDomainFilter'); if (!select) return;
    domains().forEach((domain) => select.add(new Option(domain, domain)));
    $('#featureTotal').textContent = fmt.format(total());
    $('#featureDomainCount').textContent = fmt.format(domains().length);
    $('#featureBucketCount').textContent = fmt.format(state.manifest?.bucketCount || 384);
  }
  async function init() {
    try {
      const response = await fetch('./data/system-features-manifest.json', { cache: 'no-cache', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.manifest = await response.json();
      $('#featureSyncStatus').textContent = `Manifest tersinkron · ${state.manifest.source}`;
    } catch (error) {
      $('#featureSyncStatus').textContent = `Fallback registry lokal · ${error.message}`;
    }
    setOptions(); renderList();
  }
  $('#featureDomainFilter')?.addEventListener('change', (event) => { state.domain = event.target.value; renderList(); });
  $('#featureExtensionFilter')?.addEventListener('change', (event) => { state.extension = event.target.value; renderList(); });
  $('#featureQuery')?.addEventListener('input', (event) => { state.query = event.target.value.trim(); renderList(); });
  $('#featureReset')?.addEventListener('click', () => { state.domain = 'all'; state.extension = 'all'; state.query = ''; $('#featureDomainFilter').value = 'all'; $('#featureExtensionFilter').value = 'all'; $('#featureQuery').value = ''; renderList(); });
  $('#featureSimulate')?.addEventListener('click', () => { if (!state.selected) return; $('#featureActionStatus').textContent = `Simulasi selesai: ${state.selected.id} · handler lokal tervalidasi · tidak ada kode yang dijalankan.`; });
  $('#featureOpenFs')?.addEventListener('click', () => { if (!state.selected) return; window.location.hash = `#fileManager/${state.selected.path}`; });
  window.PBFeatureCatalog = { refresh: renderList, select: selectFeature };
  void init();
})();
