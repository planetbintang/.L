(() => {
  'use strict';
  // ==========================================================================
  // AIR CLOUD — konsol cloud lengkap ala IBM Cloud untuk Planetbintang.
  //   * Sidebar hierarkis: 26 menu utama · 312 submenu · 4.056 sub-sub menu
  //     (registry inlined oleh scripts/build_air_cloud_registry.py).
  //   * Ratusan halaman berbeda per menu/submenu (blok hero/metrics/tabel/docs).
  //   * Penyimpanan langsung ke filemanajer folder airz/ (PBLocalFiles) dan
  //     browser mengindeks pohon nyata airz/airsistem sebagai repo .AIRZ.
  //   * Katalog fitur nyata airz/ (window.PB_AIRZ_FEATURES — dibangun oleh
  //     scripts/build_airz_features.py): domain, puluhan ribu berkas sistem,
  //     bin, dokumen, dan API di bawah setiap menu/submenu/sub-sub menu.
  // ==========================================================================
  const $ = (selector, root = document) => root.querySelector(selector);
  const REGISTRY = window.PB_AIR_CLOUD_REGISTRY || { menus: [], subs: [], leafs: [] };
  const AIRZ = window.PB_AIRZ_FEATURES || null;
  const MENUS = REGISTRY.menus || [];
  const SUBS = REGISTRY.subs || [];
  const LEAFS = REGISTRY.leafs || [];
  const BY_ID = new Map([...MENUS, ...SUBS, ...LEAFS].map((row) => [row.id, row]));
  const CHILDREN = new Map();
  for (const row of [...SUBS, ...LEAFS]) {
    if (!CHILDREN.has(row.parent_id)) CHILDREN.set(row.parent_id, []);
    CHILDREN.get(row.parent_id).push(row);
  }
  // Indeks cepat fitur airz/ per group_slug menu Air Cloud
  const AIRZ_BY_SLUG = new Map();
  if (AIRZ) {
    for (const item of AIRZ.items || []) {
      const slug = item.menu_slug || '';
      if (!slug) continue;
      if (!AIRZ_BY_SLUG.has(slug)) AIRZ_BY_SLUG.set(slug, []);
      AIRZ_BY_SLUG.get(slug).push(item);
    }
  }
  function slugOfRow(row) {
    return String(row.group_slug || BY_ID.get(row.parent_id)?.group_slug || '').toLowerCase();
  }
  function airzCountFor(slug) { return ((AIRZ && AIRZ_BY_SLUG.get(slug)) || []).length; }
  const fmt = new Intl.NumberFormat('id-ID');
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  const state = {
    openMenus: new Set(MENUS.slice(0, 3).map((m) => m.id)),
    openSubs: new Set(),
    selectedId: MENUS[0]?.id || '',
    query: '',
    storageReady: false,
    storageInfo: null,
    pageMode: 'registry',
    airzLimit: {},           // slug → jumlah baris fitur airz/ yang ditampilkan
    airzQuery: '',           // filter teks pada katalog fitur airz/
    airzModal: null,         // { title, body } untuk modal pratinjau fitur
  };

  const AIRZ_PAGE_STEP = 48;

  const STORAGE_PREFIX = 'aircloud/pages';
  const FILE_MANAGER_PATH = 'airz/airsistem/console/menus';

  // --------------------------------------------------------------------------
  // Blok konten halaman — tiap jenis menu menghasilkan halaman yang berbeda
  // --------------------------------------------------------------------------
  const REGIONS = ['id-jkt-1', 'id-sby-1', 'sg-sin-2', 'jp-tyo-3', 'us-east-5', 'eu-de-2', 'au-syd-1', 'br-gru-1', 'in-che-1', 'kr-seo-1'];

  function hashOf(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  }

  function heroBlock(row) {
    const icon = row.icon || (BY_ID.get(row.parent_id)?.icon) || '☁️';
    return `<section class="ac-hero" style="--ac-accent:${esc(row.accent || '#1d5bea')}">
      <div class="ac-hero-kicker">${esc(row.menu_code)} · LEVEL ${row.level} · AIR CLOUD</div>
      <h3>${icon} ${esc(row.menu_name)}</h3>
      <p>${esc(row.desc)}</p>
      <div class="ac-hero-meta"><span>Rute halaman <code>${esc(row.route_path)}</code></span><span>Jejak <em>${esc(row.path_label)}</em></span></div>
    </section>`;
  }

  function metricsBlock(row) {
    const kids = CHILDREN.get(row.id) || [];
    const seed = hashOf(row.id);
    const uptime = (99 + (seed % 90) / 100).toFixed(2);
    const items = [
      ['Anak Navigasi', fmt.format(kids.length)],
      ['Region Aktif', String(REGIONS.length)],
      ['Uptime 30 Hari', `${uptime}%`],
      ['Status Layanan', kids.length ? 'OPERASIONAL' : 'SIAP PROVISIONING'],
    ];
    return `<section class="ac-metrics">${items.map(([label, value]) => `<article><small>${esc(label)}</small><b>${esc(value)}</b></article>`).join('')}</section>`;
  }

  function childrenBlock(row) {
    const kids = CHILDREN.get(row.id) || [];
    if (!kids.length) return '';
    return `<section class="ac-card"><div class="ac-card-head"><h4>Struktur Navigasi</h4><small>${fmt.format(kids.length)} entri anak · klik untuk membuka halaman</small></div>
      <div class="ac-child-grid">${kids.map((child) => `<button type="button" class="ac-child-tile" data-aircloud-menu="${esc(child.id)}">
        <b>${esc(child.menu_name)}</b><small>${esc(child.menu_code)} · L${child.level}</small><span>${esc(child.desc)}</span></button>`).join('')}</div></section>`;
  }

  function tableBlock(row) {
    const seed = hashOf(row.id);
    const statuses = ['Aktif', 'Aktif', 'Menjaga', 'Provisioning', 'Draf'];
    const rows = Array.from({ length: 8 }, (_, i) => {
      const idx = (seed + i * 7) % 997;
      return `<tr><td><code>${esc(row.id.toLowerCase())}-${String(idx).padStart(3, '0')}</code></td>
        <td>${esc(REGIONS[(seed + i) % REGIONS.length])}</td>
        <td><span class="ac-status ac-status-${i % 5 === 2 ? 'warn' : i % 5 === 3 ? 'busy' : 'ok'}">${esc(statuses[(seed + i) % statuses.length])}</span></td>
        <td>${esc(['env:dev', 'env:stg', 'env:prd'][i % 3])} · team:platform</td>
        <td>${esc(`2026-10-${String(((seed + i) % 25) + 1).padStart(2, '0')}`)}</td></tr>`;
    }).join('');
    return `<section class="ac-card"><div class="ac-card-head"><h4>Instance Layanan</h4><small>Data simulasi deterministik per menu — konsisten di setiap muat halaman</small></div>
      <div class="ac-table-wrap"><table class="ac-table"><thead><tr><th>ID Resource</th><th>Wilayah</th><th>Status</th><th>Tag Biaya</th><th>Pembaruan</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function docsBlock(row) {
    return `<section class="ac-card ac-docs"><div class="ac-card-head"><h4>Instruksi Sistem & Penyimpanan</h4><small>Kontrak halaman sesuai skema air_cloud_menu_descriptions</small></div>
      <p>${esc(row.instruction || `Modul '${row.menu_name}' termasuk registry Air Cloud ${fmt.format(REGISTRY.total || 0)} menu.`)}</p>
      <ul class="ac-bullets">
        <li>Halaman ini tersimpan langsung di filemanajer pada <code>airz/${STORAGE_PREFIX}/${esc(row.fileName || row.id + '.json')}</code>.</li>
        <li>Pohon sistem fisik berada di <code>airz/airsistem/console/menus/${esc(row.group_slug || '')}</code> — dapat dibuka dari File Manager.</li>
        <li>Sinkronisasi memakai IndexedDB <code>planetbintang-local-files</code> yang juga dibaca repositori <code>.AIRZ</code>.</li>
      </ul>
      <div class="ac-actions">
        <button class="workspace-primary" type="button" data-ac-save="${esc(row.id)}">Simpan halaman ke airz/</button>
        <button class="workspace-secondary" type="button" data-ac-download="${esc(row.id)}">Unduh JSON</button>
        <button class="workspace-secondary" type="button" data-ac-openfs="${esc(row.id)}">Buka di File Manager</button>
      </div>
      <p class="ac-action-note" id="acActionNote" aria-live="polite"></p></section>`;
  }

  // --------------------------------------------------------------------------
  // FITUR NYATA airz/ — katalog window.PB_AIRZ_FEATURES per menu Air Cloud
  // --------------------------------------------------------------------------
  function airzItemsFor(row) {
    if (!AIRZ) return [];
    const slug = slugOfRow(row);
    let pool = AIRZ_BY_SLUG.get(slug) || [];
    if (!pool.length && row.level === 1) pool = [];
    const needle = state.airzQuery.trim().toLowerCase();
    if (needle) pool = pool.filter((item) => `${item.name} ${item.path} ${item.function}`.toLowerCase().includes(needle));
    return pool;
  }

  function airzDomainBlock(row) {
    if (!AIRZ) return '';
    const slug = slugOfRow(row);
    const domains = (AIRZ.domains || []).filter((d) => d.menu_slug === slug);
    if (!domains.length && !(AIRZ_BY_SLUG.get(slug) || []).length) return '';
    const totalFiles = domains.reduce((sum, d) => sum + d.files, 0);
    const totalFolders = domains.reduce((sum, d) => sum + d.folders, 0);
    const tiles = domains.map((d) => `<button type="button" class="ac-airz-domain" data-aircloud-menu="${esc(row.id)}" title="Domain folder airz/airsistem/${esc(d.title)}">
        <b>${esc(d.title)}</b><small>${fmt.format(d.files)} berkas · ${fmt.format(d.folders)} folder</small></button>`).join('');
    return `<section class="ac-card ac-airz-domains"><div class="ac-card-head">
      <h4>🗂️ Fitur Sistem airz/ — Domain Layanan</h4>
      <small>${fmt.format(totalFiles)} berkas sistem · ${fmt.format(totalFolders)} folder nyata di bawah menu ini (pohon airz/airsistem)</small></div>
      <div class="ac-child-grid">${tiles}</div></section>`;
  }

  function airzCatalogBlock(row) {
    if (!AIRZ) return '';
    const items = airzItemsFor(row);
    if (!items.length) return '';
    const slug = slugOfRow(row);
    const limit = Math.min(state.airzLimit[slug] || AIRZ_PAGE_STEP, items.length);
    const docsForSlug = Object.keys(AIRZ.docs || {}).filter((key) => key.includes(slug.split('-')[0])).slice(0, 6);
    const rows = items.slice(0, limit).map((item) => {
      const seed = hashOf(item.id);
      const status = ['ok', 'ok', 'busy', 'warn', 'ok'][seed % 5];
      const label = ['AKTIF', 'AKTIF', 'SIAGA', 'Sinkron', 'AKTIF'][seed % 5];
      return `<tr>
        <td><code>${esc(item.name)}</code></td>
        <td class="ac-airz-path" title="${esc(item.path)}">${esc(item.path.replace('airz/airsistem/', ''))}</td>
        <td><span class="ac-status ac-status-${status}">${esc(label)}</span></td>
        <td>${esc(item.size ? `${fmt.format(item.size)} B` : '—')}</td>
        <td class="ac-airz-actions">
          <button type="button" class="ac-mini-btn" data-airz-view="${esc(item.id)}" title="Pratinjau isi berkas">👁 Lihat</button>
          <button type="button" class="ac-mini-btn" data-airz-save="${esc(item.id)}" title="Salin berkas ke penyimpanan browser (airz/)">💾 Simpan</button>
          <button type="button" class="ac-mini-btn" data-airz-fm="${esc(item.path)}" title="Buka path di File Manager">📁 FM</button>
        </td></tr>`;
    }).join('');
    const more = limit < items.length
      ? `<button type="button" class="workspace-secondary ac-airz-more" data-airz-more="${esc(slug)}">Muat ${fmt.format(Math.min(AIRZ_PAGE_STEP, items.length - limit))} fitur berikutnya (${fmt.format(items.length - limit)} tersisa)</button>`
      : `<p class="ac-airz-end">✓ Seluruh ${fmt.format(items.length)} fitur airz/ pada domain menu ini ditampilkan.</p>`;
    const docLinks = docsForSlug.length
      ? `<div class="ac-airz-docs">${docsForSlug.map((key) => `<button type="button" class="ac-pill" data-airz-doc="${esc(key)}">📄 ${esc(key)}</button>`).join('')}</div>`
      : '';
    return `<section class="ac-card ac-airz-catalog"><div class="ac-card-head">
        <h4>⚙️ Katalog Fitur airz/ — ${fmt.format(items.length)} Komponen Sistem</h4>
        <small>Sumber: jendela nyata folder <code>airz/airsistem</code> (repo .AIRZ) · filter aktif: ${esc(state.airzQuery || '—')}
          <input id="airzFilterInput" class="ac-airz-filter" type="search" placeholder="Filter fitur airz/ pada halaman ini…" value="${esc(state.airzQuery)}" aria-label="Filter katalog fitur airz" /></small></div>
      ${docLinks}
      <div class="ac-table-wrap"><table class="ac-table ac-airz-table"><thead><tr>
        <th>KOMPONEN</th><th>PATH SISTEM</th><th>STATUS</th><th>UKURAN</th><th>FUNGSI TOMBOL</th></tr></thead>
        <tbody>${rows}</tbody></table></div>${more}</section>`;
  }

  function airzToolbarBlock(row) {
    if (!AIRZ) return '';
    const slug = slugOfRow(row);
    const items = AIRZ_BY_SLUG.get(slug) || [];
    const bins = (AIRZ.bins || []).slice(0, 12);
    const endpoints = ((AIRZ.api && AIRZ.api.endpoints) || []).slice(0, 10);
    const stats = AIRZ.totals || {};
    return `<section class="ac-card ac-airz-tools"><div class="ac-card-head">
      <h4>🚀 Pusat Kendali Sistem airz/</h4>
      <small>${fmt.format(stats.files || 0)} berkas · ${fmt.format(stats.folders || 0)} folder · ${fmt.format(stats.domains || 0)} domain · ${fmt.format(stats.apiEndpoints || 0)} endpoint API — seluruhnya dari pohon airz/ nyata</small></div>
      <div class="ac-actions ac-airz-toolbar">
        <button class="workspace-primary" type="button" data-airz-export="${esc(slug)}">Ekspor ${fmt.format(items.length)} fitur domain ini (JSON)</button>
        <button class="workspace-secondary" type="button" data-airz-export-all="1">Ekspor SELURUH ${fmt.format(stats.files || 0)} fitur airz/</button>
        <button class="workspace-secondary" type="button" data-airz-sync-tree="1">Sinkron Pohon Sistem → airz/cloudsistem/tree.json</button>
        <button class="workspace-secondary" type="button" data-airz-open-root="1">Buka root /airz di File Manager</button>
      </div>
      <div class="ac-airz-bins">${bins.map((bin) => `<button type="button" class="ac-bin-chip" data-airz-bin="${esc(bin.name)}" title="${esc(bin.function)}">▸ ${esc(bin.name)}</button>`).join('')}</div>
      ${endpoints.length ? `<div class="ac-table-wrap"><table class="ac-table"><thead><tr><th>METODE</th><th>ENDPOINT AIR CLOUD API</th><th>RUJUKAN</th></tr></thead><tbody>${endpoints.map((e) => `<tr><td><span class="ac-status ac-status-busy">${esc(e.method)}</span></td><td><code>${esc(e.path)}</code></td><td>${esc(e.summary || '')}</td></tr>`).join('')}</tbody></table></div>` : ''}
      </section>`;
  }

  function airzModalBlock() {
    const modal = state.airzModal;
    if (!modal) return '';
    return `<div class="ac-modal-backdrop" role="dialog" aria-modal="true" aria-label="${esc(modal.title)}">
      <div class="ac-modal">
        <header><h4>${esc(modal.title)}</h4><button type="button" class="ac-mini-btn" data-airz-modal-close="1">✕ Tutup</button></header>
        <pre class="ac-modal-body">${esc(modal.body)}</pre>
        <footer class="ac-actions">
          <button type="button" class="workspace-secondary" data-airz-modal-copy="1">Salin ke clipboard</button>
          <button type="button" class="workspace-secondary" data-airz-modal-download="1">Unduh berkas</button>
        </footer>
      </div></div>`;
  }

  function pageHtml(row) {
    return heroBlock(row) + metricsBlock(row) + childrenBlock(row)
      + airzDomainBlock(row) + airzCatalogBlock(row) + tableBlock(row) + airzToolbarBlock(row) + docsBlock(row) + airzModalBlock();
  }

  // --------------------------------------------------------------------------
  // Sidebar
  // --------------------------------------------------------------------------
  function matchesQuery(row, needle) {
    return `${row.id} ${row.menu_code} ${row.path_label} ${row.desc}`.toLowerCase().includes(needle);
  }

  function renderSidebar() {
    const nav = $('#airCloudSidebarNav');
    if (!nav) return;
    const needle = state.query.trim().toLowerCase();
    const frag = document.createDocumentFragment();
    for (const menu of MENUS) {
      const subs = CHILDREN.get(menu.id) || [];
      const menuHit = !needle || matchesQuery(menu, needle);
      const visibleSubs = subs.filter((sub) => {
        if (!needle) return true;
        if (matchesQuery(sub, needle)) return true;
        return (CHILDREN.get(sub.id) || []).some((leaf) => matchesQuery(leaf, needle));
      });
      if (needle && !menuHit && !visibleSubs.length) continue;
      const group = document.createElement('div');
      group.className = 'ac-nav-group';
      const isOpen = state.openMenus.has(menu.id) || Boolean(needle);
      const leafTotal = subs.reduce((sum, s) => sum + (CHILDREN.get(s.id) || []).length, 0);
      group.innerHTML = `<button type="button" class="ac-nav-main ${state.selectedId === menu.id ? 'active' : ''}" data-aircloud-menu="${esc(menu.id)}" data-ac-toggle="${esc(menu.id)}">
          <span class="ac-nav-icon">${menu.icon || '☁️'}</span><span class="ac-nav-label">${esc(menu.menu_name)}</span>
          <span class="ac-nav-count" title="${fmt.format(airzCountFor(menu.group_slug))} fitur sistem airz/ · ${fmt.format(subs.length + leafTotal)} submenu">${fmt.format(subs.length + leafTotal)}<i>+${fmt.format(airzCountFor(menu.group_slug))}</i></span></button>`;
      const subWrap = document.createElement('div');
      subWrap.className = `ac-nav-subs${isOpen ? ' open' : ''}`;
      for (const sub of visibleSubs) {
        const leafs = (CHILDREN.get(sub.id) || []);
        const subOpen = state.openSubs.has(sub.id) || Boolean(needle);
        const item = document.createElement('div');
        item.className = 'ac-nav-subwrap';
        item.innerHTML = `<div class="ac-nav-row"><button type="button" class="ac-nav-sub ${state.selectedId === sub.id ? 'active' : ''}" data-aircloud-menu="${esc(sub.id)}">${esc(sub.menu_name)}</button>
          ${leafs.length ? `<button type="button" class="ac-nav-expander${subOpen ? ' open' : ''}" data-ac-expand="${esc(sub.id)}" aria-label="Buka sub submenu ${esc(sub.menu_name)}">›</button>` : ''}</div>`;
        if (leafs.length) {
          const leafWrap = document.createElement('div');
          leafWrap.className = `ac-nav-leafs${subOpen ? ' open' : ''}`;
          leafWrap.innerHTML = leafs
            .filter((leaf) => !needle || matchesQuery(leaf, needle))
            .map((leaf) => `<button type="button" class="ac-nav-leaf ${state.selectedId === leaf.id ? 'active' : ''}" data-aircloud-menu="${esc(leaf.id)}">${esc(leaf.menu_name)}</button>`)
            .join('');
          item.append(leafWrap);
        }
        subWrap.append(item);
      }
      group.append(subWrap);
      frag.append(group);
    }
    nav.replaceChildren(frag);
    const status = $('#airCloudSidebarStatus');
    if (status) status.textContent = needle
      ? `Filter "${state.query}" · ${fmt.format(nav.querySelectorAll('[data-aircloud-menu]').length)} menu cocok`
      : `${fmt.format(MENUS.length)} menu utama · ${fmt.format(SUBS.length)} submenu · ${fmt.format(LEAFS.length)} sub-sub menu` +
        (AIRZ ? ` · ${fmt.format((AIRZ.totals && AIRZ.totals.files) || 0)} fitur airz/ siap` : '');
  }

  // --------------------------------------------------------------------------
  // Breadcrumb & halaman
  // --------------------------------------------------------------------------
  function ancestors(row) {
    const chain = [];
    let current = row;
    while (current) {
      chain.unshift(current);
      current = current.parent_id ? BY_ID.get(current.parent_id) : null;
    }
    return chain;
  }

  function renderPage() {
    const host = $('#airCloudPage');
    if (!host) return;
    const row = BY_ID.get(state.selectedId) || MENUS[0];
    if (!row) { host.innerHTML = '<div class="ac-empty">Registry Air Cloud belum termuat.</div>'; return; }
    const chain = ancestors(row);
    const crumbs = `<nav class="ac-crumbs" aria-label="Breadcrumb Air Cloud">${chain.map((item, i) =>
      `<button type="button" data-aircloud-menu="${esc(item.id)}"${i === chain.length - 1 ? ' class="current"' : ''}>${esc(item.menu_name)}</button>`.concat(i < chain.length - 1 ? '<i>/</i>' : '')).join('')}</nav>`;
    host.innerHTML = crumbs + `<article class="ac-page" id="acPageArticle">${pageHtml(row)}</article>`;
    const title = $('#airCloudPageTitle');
    if (title) title.textContent = row.path_label;
    document.dispatchEvent(new CustomEvent('planetbintang:aircloud-page', { detail: { id: row.id, row } }));
  }

  // --------------------------------------------------------------------------
  // Penyimpanan langsung → filemanajer folder airz/
  // --------------------------------------------------------------------------
  function pagePayload(row) {
    return {
      schemaVersion: 1,
      generatedBy: 'air-cloud-console.js',
      savedAt: new Date().toISOString(),
      menu: { id: row.id, code: row.menu_code, level: row.level, name: row.menu_name, path: row.path_label, route: row.route_path, slug: row.group_slug },
      description: { short: row.desc, instruction: row.instruction },
      blocks: { children: (CHILDREN.get(row.id) || []).map((c) => c.id), regions: REGIONS },
      storagePath: `${STORAGE_PREFIX}/${row.fileName || `${row.id}.json`}`,
      systemMirror: `${FILE_MANAGER_PATH}/${row.group_slug || ''}`,
    };
  }

  async function saveRowToAirz(row, silent = false) {
    const note = $('#acActionNote');
    if (!window.PBLocalFiles?.saveFile) {
      if (note) note.textContent = 'Penyimpanan lokal (IndexedDB) tidak tersedia di browser ini.';
      return false;
    }
    const payload = pagePayload(row);
    const fileName = row.fileName || `${row.id}.json`;
    try {
      await window.PBLocalFiles.mkdir('airz');
      await window.PBLocalFiles.mkdir(STORAGE_PREFIX);
      await window.PBLocalFiles.saveFile(`${STORAGE_PREFIX}/${fileName}`, JSON.stringify(payload, null, 1), 'application/json;charset=utf-8');
      state.storageReady = true;
      updateStorageBadge();
      if (note) note.textContent = `Halaman tersimpan → airz/${STORAGE_PREFIX}/${fileName} (tersedia di File Manager).`;
      if (!silent) window.PBLocalFiles.recordActivity?.('aircloud-save', `airz/${STORAGE_PREFIX}/${fileName}`, { menu: row.id });
      document.dispatchEvent(new CustomEvent('planetbintang:workspace-files-changed'));
      return true;
    } catch (error) {
      if (note) note.textContent = `Gagal menyimpan: ${error.message}`;
      return false;
    }
  }

  async function downloadRow(row) {
    const note = $('#acActionNote');
    if (!window.PBLocalFiles?.downloadFile) { if (note) note.textContent = 'Unduhan tidak tersedia.'; return; }
    const fileName = row.fileName || `${row.id}.json`;
    try {
      const found = await window.PBLocalFiles.readFile(`${STORAGE_PREFIX}/${fileName}`);
      if (!found) await saveRowToAirz(row, true);
      await window.PBLocalFiles.downloadFile(`${STORAGE_PREFIX}/${fileName}`);
      if (note) note.textContent = `Mengunduh airz/${STORAGE_PREFIX}/${fileName}`;
    } catch (error) { if (note) note.textContent = `Unduhan gagal: ${error.message}`; }
  }

  async function ensureStorageMirror() {
    if (!window.PBLocalFiles?.saveFile) return;
    try {
      const stats = await window.PBLocalFiles.stats();
      const existing = (stats?.records || []).find((rec) => rec.path === 'airz/README.md' || rec.path === 'airz');
      if (existing) { state.storageReady = true; state.storageInfo = stats; updateStorageBadge(); return; }
      await window.PBLocalFiles.mkdir('airz');
      await window.PBLocalFiles.saveFile('airz/README.md',
        '# Root airz/ — Penyimpanan Langsung Sistem Air Cloud\n\nFolder ini menampung seluruh halaman & konfigurasi sistem Air Cloud yang dibuat langsung dari konsol browser (mirror repo planetbintang/.AIRZ → #fileManager/airz).\n\n- airsistem/ : sistem folder & file inti (ratusan folder, ribuan file) — disinkronkan oleh pipeline build.\n- cloudsistem/ : snapshot runtime konsol (halaman yang disimpan dari browser).\n- pages/       : cadangan manual melalui Manage Files.\n',
        'text/markdown;charset=utf-8');
      await window.PBLocalFiles.mkdir('airz/cloudsistem');
      await window.PBLocalFiles.mkdir(STORAGE_PREFIX);
      await window.PBLocalFiles.saveFile(`${STORAGE_PREFIX}/index.json`, JSON.stringify({
        schemaVersion: 1, createdAt: new Date().toISOString(),
        totals: { main: MENUS.length, sub: SUBS.length, leaf: LEAFS.length, all: REGISTRY.total || 0 },
        storageRoot: 'airz/', systemMirror: '/airz/airsistem (repo .AIRZ)',
      }, null, 1), 'application/json;charset=utf-8');
      state.storageReady = true;
      updateStorageBadge();
    } catch { /* penyimpanan opsional — badge tetap LOCAL */ }
  }

  function updateStorageBadge() {
    const badge = $('#airCloudStorageBadge');
    if (!badge) return;
    badge.textContent = state.storageReady ? 'PENYIMPANAN AKTIF · airz/' : 'PENYIMPANAN LOKAL · SIAP';
    badge.dataset.ready = String(state.storageReady);
  }

  // --------------------------------------------------------------------------
  // Statistik dashboard ringkas
  // --------------------------------------------------------------------------
  function renderStats() {
    const host = $('#airCloudStats');
    if (!host) return;
    const airzTotals = (AIRZ && AIRZ.totals) || {};
    const cards = [
      ['Menu Utama', MENUS.length, 'layanan cloud inti'],
      ['Submenu', SUBS.length, 'halaman fungsional'],
      ['Sub Sub Menu', LEAFS.length, 'halaman operasional'],
      ['Folder Sistem', fmt.format(REGISTRY.folders || airzTotals.folders || 0), 'di airz/airsistem'],
      ['File Sistem', fmt.format(REGISTRY.files || airzTotals.files || 0), 'konfigurasi & log'],
      ['Fitur airz/', fmt.format(airzTotals.files || 0), `${fmt.format(airzTotals.domains || 0)} domain · ${fmt.format(airzTotals.docs || 0)} dokumen · ${fmt.format(airzTotals.apiEndpoints || 0)} API`],
      ['Halaman Registry', fmt.format(REGISTRY.pages || 338), 'JSON per menu (data/air-cloud-menus)'],
    ];
    host.innerHTML = cards.map(([label, value, foot]) => `<article class="ac-stat"><small>${esc(String(label).toUpperCase())}</small><b>${esc(String(value))}</b><span>${esc(foot)}</span></article>`).join('');
  }

  // --------------------------------------------------------------------------
  // Interaksi
  // --------------------------------------------------------------------------
  function selectMenu(id) {
    const row = BY_ID.get(id);
    if (!row) return;
    state.selectedId = id;
    state.airzQuery = '';
    state.airzModal = null;
    for (const item of ancestors(row)) {
      if (item.level === 1) state.openMenus.add(item.id);
      if (item.level === 2) state.openSubs.add(item.id);
    }
    renderSidebar();
    renderPage();
    $('#airCloudContent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --------------------------------------------------------------------------
  // Aksi katalog fitur airz/ (tombol fungsional per berkas & toolbar sistem)
  // --------------------------------------------------------------------------
  const AIRZ_INDEX = new Map(((AIRZ && AIRZ.items) || []).map((item) => [item.id, item]));

  function airzNote(text) {
    const note = $('#acActionNote');
    if (note) note.textContent = text;
  }

  function openAirzModal(title, body) {
    state.airzModal = { title, body: String(body ?? '').slice(0, 24000) };
    renderPage();
  }

  function closeAirzModal() {
    state.airzModal = null;
    renderPage();
  }

  async function saveAirzItemToStorage(item) {
    if (!window.PBLocalFiles?.saveFile) { airzNote('Penyimpanan lokal tidak tersedia di browser ini.'); return false; }
    const rel = String(item.path).replace(/^airz\//, '');
    const snippet = (AIRZ.snippets && AIRZ.snippets[rel.replace(/^airsistem\//, 'airsistem/').split('/').slice(1).join('/')]) || '';
    try {
      await window.PBLocalFiles.mkdir('airz');
      await window.PBLocalFiles.mkdir('airz/cloudsistem');
      const payload = JSON.stringify({
        schemaVersion: 1, savedAt: new Date().toISOString(), source: item.path,
        component: item.name, domain: item.domain, size: item.size,
        function: item.function, preview: snippet,
      }, null, 1);
      await window.PBLocalFiles.saveFile(`airz/cloudsistem/${item.name}.snapshot.json`, payload, 'application/json;charset=utf-8');
      document.dispatchEvent(new CustomEvent('planetbintang:workspace-files-changed'));
      return true;
    } catch (error) { airzNote(`Gagal menyimpan fitur: ${error.message}`); return false; }
  }

  function downloadText(name, text, mime = 'application/json;charset=utf-8') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name;
    document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function exportAirzDomain(slug) {
    const items = AIRZ_BY_SLUG.get(slug) || [];
    downloadText(`airz-fitur-${slug || 'semua'}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), slug, count: items.length, items }, null, 1));
    airzNote(`Mengekspor ${fmt.format(items.length)} fitur airz/ domain "${slug}" sebagai unduhan JSON.`);
  }

  async function syncAirzTree() {
    const stats = AIRZ.totals || {};
    const summary = {
      syncedAt: new Date().toISOString(), source: 'airz/airsistem (pohon nyata repo .AIRZ)',
      totals: stats, domains: AIRZ.domains, bins: AIRZ.bins, api: AIRZ.api ? { title: AIRZ.api.title, endpointCount: AIRZ.api.endpointCount } : null,
      sample: (AIRZ.items || []).slice(0, 500),
    };
    if (window.PBLocalFiles?.saveFile) {
      try {
        await window.PBLocalFiles.mkdir('airz');
        await window.PBLocalFiles.mkdir('airz/cloudsistem');
        await window.PBLocalFiles.saveFile('airz/cloudsistem/tree.json', JSON.stringify(summary), 'application/json;charset=utf-8');
        updateStorageBadge();
        airzNote(`Pohon sistem airz/ disinkron → airz/cloudsistem/tree.json (${fmt.format(stats.files)} berkas · ${fmt.format(stats.folders)} folder).`);
        return;
      } catch (error) { airzNote(`Sinkronisasi gagal: ${error.message}`); return; }
    }
    downloadText('airz-cloudsistem-tree.json', JSON.stringify(summary, null, 1));
    airzNote('IndexedDB tidak tersedia — pohon sistem diunduh sebagai cadangan.');
  }

  function bindEvents() {
    const shell = $('#airCloudShell');
    if (!shell || shell.dataset.bound === '1') return;
    shell.dataset.bound = '1';
    shell.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-ac-toggle]');
      if (toggle) {
        const id = toggle.getAttribute('data-ac-toggle');
        if (state.openMenus.has(id)) state.openMenus.delete(id); else state.openMenus.add(id);
        renderSidebar();
        if (!event.target.closest('.ac-nav-label') && !event.target.closest('.ac-nav-main.active')) return;
      }
      const expander = event.target.closest('[data-ac-expand]');
      if (expander) {
        const id = expander.getAttribute('data-ac-expand');
        if (state.openSubs.has(id)) state.openSubs.delete(id); else state.openSubs.add(id);
        renderSidebar();
        return;
      }
      const link = event.target.closest('[data-aircloud-menu]');
      if (link) { selectMenu(link.getAttribute('data-aircloud-menu')); return; }
      const save = event.target.closest('[data-ac-save]');
      if (save) { void saveRowToAirz(BY_ID.get(save.getAttribute('data-ac-save'))); return; }
      const dl = event.target.closest('[data-ac-download]');
      if (dl) { void downloadRow(BY_ID.get(dl.getAttribute('data-ac-download'))); return; }
      const fs = event.target.closest('[data-ac-openfs]');
      if (fs) {
        const row = BY_ID.get(fs.getAttribute('data-ac-openfs'));
        const path = row?.group_slug ? `${FILE_MANAGER_PATH}/${row.group_slug}` : FILE_MANAGER_PATH;
        window.PBFileManager?.applySnapshot?.(window.PBSystemSnapshot?.data);
        window.PBSystemNavigation?.navigate('file-manager');
        window.setTimeout(() => window.PBFileManager?.setPath?.(path), 120);
        return;
      }
      const syncAll = event.target.closest('#airCloudSyncAll');
      if (syncAll) {
        const note = $('#acActionNote');
        let done = 0;
        void (async () => {
          for (const menu of MENUS) { if (await saveRowToAirz(menu, true)) done += 1; }
          if (note) note.textContent = `${done}/${MENUS.length} halaman menu utama disalin ke airz/${STORAGE_PREFIX}/`;
          updateStorageBadge();
        })();
        return;
      }
      // ---- Katalog fitur airz/ ----
      const airzView = event.target.closest('[data-airz-view]');
      if (airzView) {
        const item = AIRZ_INDEX.get(airzView.getAttribute('data-airz-view'));
        if (item) {
          const rel = String(item.path).replace('airz/airsistem/', '');
          const snippet = (AIRZ.snippets && AIRZ.snippets[rel]) || '';
          openAirzModal(`${item.name} — ${item.path}`,
            `${item.function}\nDomain: ${item.domain} · Ukuran: ${fmt.format(item.size || 0)} byte\n` +
            (snippet ? `\n----- PRATINJAU ISI -----\n${snippet}` : '\n(Berkas terlalu besar untuk pratinjau inline — gunakan tombol Unduh/Simpan atau buka via File Manager.)'));
        }
        return;
      }
      const airzSave = event.target.closest('[data-airz-save]');
      if (airzSave) {
        const item = AIRZ_INDEX.get(airzSave.getAttribute('data-airz-save'));
        if (item) void saveAirzItemToStorage(item).then((ok) => { if (ok) airzNote(`Fitur "${item.name}" disimpan ke airz/cloudsistem/ (IndexedDB).`); });
        return;
      }
      const airzFm = event.target.closest('[data-airz-fm]');
      if (airzFm) {
        const path = airzFm.getAttribute('data-airz-fm') || 'airz';
        window.PBFileManager?.applySnapshot?.(window.PBSystemSnapshot?.data);
        window.PBSystemNavigation?.navigate('file-manager');
        window.setTimeout(() => window.PBFileManager?.setPath?.(path.replace(/^airz\//, '')), 120);
        return;
      }
      const airzMore = event.target.closest('[data-airz-more]');
      if (airzMore) {
        const slug = airzMore.getAttribute('data-airz-more');
        state.airzLimit[slug] = (state.airzLimit[slug] || AIRZ_PAGE_STEP) + AIRZ_PAGE_STEP;
        renderPage();
        return;
      }
      const airzDoc = event.target.closest('[data-airz-doc]');
      if (airzDoc) {
        const key = airzDoc.getAttribute('data-airz-doc');
        openAirzModal(`Dokumentasi sistem — airz/airsistem/docs/${key}.md`, (AIRZ.docs && AIRZ.docs[key]) || 'Dokumen tidak tersedia.');
        return;
      }
      const airzBin = event.target.closest('[data-airz-bin]');
      if (airzBin) {
        const name = airzBin.getAttribute('data-airz-bin');
        const bin = (AIRZ.bins || []).find((b) => b.name === name);
        openAirzModal(`Perintah sistem — ${name}`, `${bin ? bin.function : ''}\n\n----- SKRIPT -----\n${bin ? bin.snippet : ''}\n\nContoh pemakaian:\n  airzctl status --all\n  ${name} --help`);
        return;
      }
      const airzExport = event.target.closest('[data-airz-export]');
      if (airzExport) { exportAirzDomain(airzExport.getAttribute('data-airz-export')); return; }
      const airzExportAll = event.target.closest('[data-airz-export-all]');
      if (airzExportAll) {
        downloadText('airz-fitur-semua.json', JSON.stringify({ exportedAt: new Date().toISOString(), totals: AIRZ.totals, domains: AIRZ.domains, items: AIRZ.items }, null, 1));
        airzNote(`Mengekspor SELURUH ${fmt.format((AIRZ.items || []).length)} fitur airz/ sebagai satu berkas JSON.`);
        return;
      }
      const airzSyncTree = event.target.closest('[data-airz-sync-tree]');
      if (airzSyncTree) { void syncAirzTree(); return; }
      const airzOpenRoot = event.target.closest('[data-airz-open-root]');
      if (airzOpenRoot) {
        window.PBFileManager?.applySnapshot?.(window.PBSystemSnapshot?.data);
        window.PBSystemNavigation?.navigate('file-manager');
        window.setTimeout(() => window.PBFileManager?.setPath?.(''), 120);
        return;
      }
      if (event.target.closest('[data-airz-modal-close]')) { closeAirzModal(); return; }
      const modalCopy = event.target.closest('[data-airz-modal-copy]');
      if (modalCopy && state.airzModal) {
        void navigator.clipboard?.writeText(state.airzModal.body).then(
          () => airzNote('Isi pratinjau disalin ke clipboard.'),
          () => airzNote('Clipboard ditolak browser — gunakan tombol Unduh.'),
        );
        return;
      }
      const modalDownload = event.target.closest('[data-airz-modal-download]');
      if (modalDownload && state.airzModal) {
        downloadText(`${String(state.airzModal.title).replace(/[^\w.-]+/g, '_').slice(0, 48)}.txt`, state.airzModal.body, 'text/plain;charset=utf-8');
        return;
      }
    });
    const search = $('#airCloudSearch');
    if (search) search.addEventListener('input', (event) => { state.query = event.target.value || ''; renderSidebar(); });
    const content = $('#airCloudContent');
    if (content && content.dataset.airzBound !== '1') {
      content.dataset.airzBound = '1';
      content.addEventListener('input', (event) => {
        if (event.target && event.target.id === 'airzFilterInput') {
          state.airzQuery = event.target.value || '';
          renderPage();
          const input = $('#airzFilterInput');
          if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
        }
      });
    }
  }

  function render() {
    const page = $('#airCloudPage');
    if (!page) return;
    bindEvents();
    renderStats();
    renderSidebar();
    renderPage();
    updateStorageBadge();
    void ensureStorageMirror();
  }

  // Pilih menu utama berdasarkan slug sub URL (#aircloud/<slug>).
  function selectSlug(slug) {
    const wanted = String(slug || '').toLowerCase();
    if (!wanted) return false;
    const row = MENUS.find((menu) => String(menu.group_slug || '').toLowerCase() === wanted)
      || [...BY_ID.values()].find((item) => String(item.group_slug || '').toLowerCase() === wanted);
    if (!row || row.id === state.selectedId) return Boolean(row);
    selectMenu(row.id);
    return true;
  }

  document.addEventListener('planetbintang:route-change', (event) => {
    if (event.detail?.group === 'aircloud') render();
  });

  window.PBAirCloud = {
    render,
    select: selectMenu,
    selectSlug,
    registry: REGISTRY,
    airzFeatures: AIRZ,
    saveCurrent: () => saveRowToAirz(BY_ID.get(state.selectedId)),
  };

  if (document.readyState !== 'loading') {
    if (document.body?.dataset.systemRoute === 'aircloud' || document.body?.dataset.systemRoute === 'aircloud-storage') render();
  }
})();
