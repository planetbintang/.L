(() => {
  'use strict';
  // ==========================================================================
  // AIR CLOUD — konsol cloud lengkap ala IBM Cloud untuk Planetbintang.
  //   * Sidebar hierarkis: 26 menu utama · 312 submenu · 4.056 sub-sub menu
  //     (registry inlined oleh scripts/build_air_cloud_registry.py).
  //   * Ratusan halaman berbeda per menu/submenu (blok hero/metrics/tabel/docs).
  //   * Penyimpanan langsung ke filemanajer folder airz/ (PBLocalFiles) dan
  //     browser mengindeks pohon nyata airz/airsistem sebagai repo .AIRZ.
  // ==========================================================================
  const $ = (selector, root = document) => root.querySelector(selector);
  const REGISTRY = window.PB_AIR_CLOUD_REGISTRY || { menus: [], subs: [], leafs: [] };
  const MENUS = REGISTRY.menus || [];
  const SUBS = REGISTRY.subs || [];
  const LEAFS = REGISTRY.leafs || [];
  const BY_ID = new Map([...MENUS, ...SUBS, ...LEAFS].map((row) => [row.id, row]));
  const CHILDREN = new Map();
  for (const row of [...SUBS, ...LEAFS]) {
    if (!CHILDREN.has(row.parent_id)) CHILDREN.set(row.parent_id, []);
    CHILDREN.get(row.parent_id).push(row);
  }
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
  };

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

  function pageHtml(row) {
    return heroBlock(row) + metricsBlock(row) + childrenBlock(row) + tableBlock(row) + docsBlock(row);
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
          <span class="ac-nav-count">${fmt.format(subs.length + leafTotal)}</span></button>`;
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
      : `${fmt.format(MENUS.length)} menu utama · ${fmt.format(SUBS.length)} submenu · ${fmt.format(LEAFS.length)} sub-sub menu`;
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
    const cards = [
      ['Menu Utama', MENUS.length, 'layanan cloud inti'],
      ['Submenu', SUBS.length, 'halaman fungsional'],
      ['Sub Sub Menu', LEAFS.length, 'halaman operasional'],
      ['Folder Sistem', fmt.format(REGISTRY.folders || 0), 'di airz/airsistem'],
      ['File Sistem', fmt.format(REGISTRY.files || 0), 'konfigurasi & log'],
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
    for (const item of ancestors(row)) {
      if (item.level === 1) state.openMenus.add(item.id);
      if (item.level === 2) state.openSubs.add(item.id);
    }
    renderSidebar();
    renderPage();
    $('#airCloudContent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      }
    });
    const search = $('#airCloudSearch');
    if (search) search.addEventListener('input', (event) => { state.query = event.target.value || ''; renderSidebar(); });
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
    saveCurrent: () => saveRowToAirz(BY_ID.get(state.selectedId)),
  };

  if (document.readyState !== 'loading') {
    if (document.body?.dataset.systemRoute === 'aircloud' || document.body?.dataset.systemRoute === 'aircloud-storage') render();
  }
})();
