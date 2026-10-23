(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const fmt = new Intl.NumberFormat('id-ID');
  const state = { data: null, repo: '', path: '', query: '', manifest: null, entries: [], pageIndex: 0, pageCount: 0, loading: false, selected: null, requestId: 0 };

  // Root virtual sistem pada repository `.L` (sub URL planetbintang.github.io/.L/):
  // folder /data /proc /sys /media /acct /pro /config /cache — masing-masing adalah
  // sub-URL File Manager (`#fileManager/<folder>`), berisi sub-folder khas sistem,
  // file dengan nama/ekstensi/fungsi serta isi kode contoh, dan tampilan+pengaturan
  // terpusat per folder.
  const VIRTUAL_REPO = 'planetbintang/.SYSTEM';
  const L_REPO = 'planetbintang/.L';
  const VIRTUAL_INDEX_URL = 'data/trees/0000000000000000/index.json';
  const VIRTUAL_SHORTCUTS = ['data', 'proc', 'sys', 'media', 'acct', 'pro', 'config', 'cache'];
  const EXT_FUNCTION = {
    APK: 'Paket aplikasi Android (Java/Kotlin terdex)', SO: 'Pustaka bersama native ELF (C/C++)', JAR: 'Pustaka/framework Java',
    XML: 'Konfigurasi/manifest berbasis teks', RC: 'Skrip init service (Android init language)', PROP: 'Pasangan kunci=nilai properti',
    TXT: 'Teks biasa (log/laporan)', DB: 'Database SQLite', CONF: 'File konfigurasi teks', BIN: 'Data biner mentah',
    IMG: 'Image partisi/filesystem', ODEX: 'Hasil AOT dex teroptimasi', VDEX: 'Verifikasi dex compact', MP4: 'Video (H.264/HEVC)',
    MKV: 'Kontainer video Matroska', JPG: 'Foto terkompresi', PNG: 'Gambar lossless', WEBP: 'Gambar web modern', MP3: 'Audio terkompresi',
    FLAC: 'Audio lossless', OGG: 'Audio Vorbis (nada dering/notifikasi)', PDF: 'Dokumen portabel', DOCX: 'Dokumen Word Office Open XML',
    KO: 'Modul kernel loadable', LIST: 'Daftar teks baris-per-item', ZIP: 'Arsip terkompresi', DAT: 'Data terstruktur biner/teks',
    LOG: 'Log teks historis', UEVENT: 'Event uevent perangkat', PROC: 'Daftar PID cgroup (teks)', SIZE: 'Ukuran sektor perangkat (teks)',
  };
  function isVirtualRepo() { return state.repo === VIRTUAL_REPO || (state.repo === L_REPO && state.manifest?.virtual === true); }
  // Repo `.L` selalu memakai indeks pohon nyata (folder & file repositori),
  // termasuk saat dibuka dari File Manager di menu utama.
  function isLRepo() { return state.repo === L_REPO; }
  function syncUrlPath() {
    if (!isVirtualRepo()) return;
    const target = `#fileManager${state.path ? `/${state.path}` : ''}`;
    if (window.location.hash !== target) window.history.replaceState({ systemRoute: 'file-manager' }, '', target);
  }
  function extensionFunction(path) {
    const e = ext(path);
    if (e && EXT_FUNCTION[e]) return EXT_FUNCTION[e];
    const dot = String(path).lastIndexOf('.');
    return dot > 0 ? `File berekstensi .${path.slice(dot + 1)}` : 'File sistem tanpa ekstensi (node/procs/teks)';
  }

  function el(tag, value, className) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (value !== undefined && value !== null) item.textContent = String(value);
    return item;
  }
  function repoNow() { return state.data?.repositories?.find((item) => item.fullName === state.repo) || null; }
  function basename(path) { return String(path || '').split('/').pop() || '/'; }
  function normalizePath(value) {
    const parts = String(value || '').replaceAll('\\', '/').split('/').filter(Boolean);
    return parts.some((part) => part === '.' || part === '..') ? null : parts.join('/');
  }
  function humanSize(value) {
    const size = Number(value) || 0;
    if (size < 1024) return `${fmt.format(size)} B`;
    if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 ** 2).toFixed(2)} MB`;
  }
  function sizeText(item) { return item?.sizeKnown === false ? 'tidak tersedia' : humanSize(item?.size); }
  function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
  }
  async function verifyHash(payload) {
    if (!payload?.dataSha256 || !window.crypto?.subtle) return;
    const body = { ...payload }; const expected = body.dataSha256; delete body.dataSha256;
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(body)));
    const actual = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    if (actual !== expected) throw new Error('SHA-256 shard tidak cocok');
  }
  async function parseResponse(response) {
    const bytes = await response.arrayBuffer();
    let stream = new Blob([bytes]).stream();
    const header = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 2));
    if (header[0] === 0x1f && header[1] === 0x8b) {
      if (!('DecompressionStream' in window)) throw new Error('Browser ini belum mendukung dekompresi gzip');
      stream = stream.pipeThrough(new DecompressionStream('gzip'));
    }
    const payload = JSON.parse(await new Response(stream).text());
    await verifyHash(payload);
    return payload;
  }
  function fmtDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date) + ' UTC';
  }
  function ext(path) {
    const name = basename(path); const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(dot + 1).toUpperCase().slice(0, 4) : '';
  }
  function kind(entry) { return entry.type === 'directory' ? 'DIR' : entry.type === 'submodule' ? 'SUB' : ext(entry.path) || 'FILE'; }
  function treeStateLabel(tree) { return tree?.state === 'complete' ? 'LENGKAP' : tree?.state === 'partial' ? 'PARSIAL' : tree?.state === 'empty' ? 'KOSONG' : 'TIDAK TERSEDIA'; }
  function currentDirectory() { return state.manifest?.directories?.[state.path] || { entryCount: 0, pages: [] }; }
  function isDirectory(path) { return Boolean(state.manifest?.directories && Object.hasOwn(state.manifest.directories, path)); }

  // ---- Pengaturan & tampilan terpusat per folder (localStorage) ----
  const SETTINGS_STORE = 'planetbintang.fm.virtual-settings.v1';
  function readAllSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_STORE) || '{}') || {}; } catch { return {}; }
  }
  function readFolderSettings(path) {
    const all = readAllSettings();
    return { sort: 'dir-first', folderIcon: true, dense: false, ...(all[path] || {}) };
  }
  function saveFolderSettings(path, patch) {
    try {
      const all = readAllSettings();
      all[path] = { ...readFolderSettings(path), ...patch };
      localStorage.setItem(SETTINGS_STORE, JSON.stringify(all));
    } catch { /* penyimpanan penuh/diblokir — pengaturan tetap di memori */ }
    renderTiles();
  }
  function sortItems(items) {
    const settings = isVirtualRepo() ? readFolderSettings(state.path) : null;
    if (settings) {
      const list = [...items];
      if (settings.sort === 'size') {
        return list.sort((a, b) => Number(b.type === 'directory') - Number(a.type === 'directory')
          || (Number(b.size || 0) - Number(a.size || 0)) || basename(a.path).localeCompare(basename(b.path), 'id'));
      }
      if (settings.sort === 'name') {
        return list.sort((a, b) => basename(a.path).localeCompare(basename(b.path), 'id', { sensitivity: 'base' }));
      }
    }
    return [...items].sort((a, b) => Number(b.type === 'directory') - Number(a.type === 'directory') || basename(a.path).localeCompare(basename(b.path), 'id', { sensitivity: 'base' }));
  }

  function addInfo(parent, label, value, mono = false) {
    const row = el('div', undefined, 'fm-info-row');
    row.append(el('span', label, 'fm-info-label'), el('span', value || '—', mono ? 'fm-info-value mono' : 'fm-info-value'));
    parent.append(row);
  }
  function githubPathUrl(repo, entry) {
    if (!repo?.url || !repo.branch) return '';
    const type = entry.type === 'directory' ? 'tree' : 'blob';
    const branch = repo.branch.split('/').map(encodeURIComponent).join('/');
    const path = entry.path.split('/').map(encodeURIComponent).join('/');
    return `${repo.url}/${type}/${branch}/${path}`;
  }

  function renderAssessment(repo) {
    if (isVirtualRepo()) {
      const manifest = state.manifest || {};
      const directory = currentDirectory();
      $('#fileTreeStatus').textContent = `SUB URL /.L · ROOT SISTEM · ${fmt.format(manifest.fileCount || 0)} file · ${fmt.format(manifest.directoryCount || 0)} folder · ${humanSize(manifest.totalBytes || 0)} metadata`;
      $('#fileIntegrityStatus').textContent = 'Struktur virtual: LENGKAP · shard SHA-256 terverifikasi · bukan pohon Git';
      $('#fileActivityStatus').textContent = 'Manajemen terpusat: /data /proc /sys /media /acct /pro /config /cache';
      if (state.selected) return;
      $('#fileSelectionTitle').textContent = 'Pusat Manajemen Folder Sistem (.L)';
      const panel = $('#fileSelectionData'); panel.replaceChildren();
      addInfo(panel, 'Jenis sistem', 'Sub URL repository `.L` — root virtual File Manager');
      addInfo(panel, 'Basis sub URL', 'planetbintang.github.io/.L/ → path `/`');
      addInfo(panel, 'Folder tingkat root', VIRTUAL_SHORTCUTS.map((name) => `/${name}`).join(' · '));
      addInfo(panel, 'Total entri terkelola', `${fmt.format(manifest.entryCount || 0)} path`);
      addInfo(panel, 'Folder terkelola', fmt.format(Object.keys(manifest.directories || {}).length - 1));
      addInfo(panel, 'Isi path aktif', `${fmt.format(directory.entryCount || 0)} item${state.path ? ` · /${state.path}` : ' · /'}`);
      addInfo(panel, 'URL aktif saat ini', `${window.location.origin}${window.location.pathname}#fileManager${state.path ? `/${state.path}` : ''}`, true);
      const block = el('div', undefined, 'fm-candidate-list');
      block.append(el('span', 'Fungsi tiap folder root (klik judul untuk membuka)', 'fm-info-label'));
      const list = el('ul');
      const roots = Array.isArray(manifest.roots) && manifest.roots.length
        ? manifest.roots
        : VIRTUAL_SHORTCUTS.map((name) => ({ path: name, title: `/${name}`, desc: 'Folder virtual root — manajemen terpusat struktur sistem', items: 0 }));
      roots.forEach((root) => {
        const li = el('li');
        const link = el('button', `${root.title} (${fmt.format(root.items || 0)} item)`, 'fm-root-link');
        link.type = 'button';
        link.addEventListener('click', () => goTo(root.path));
        li.append(link, el('span', ` ${root.desc || ''}`));
        list.append(li);
      });
      block.append(list);
      panel.append(block, el('p', 'Setiap folder memakai ikon folder File Manager yang sama untuk semua jenis nama folder. Isi file berupa kode contoh sesuai nama/fungsi folder; blob repo nyata tidak dipublikasikan.', 'fm-inspector-disclaimer'));
      $('#fileOpenGitHub').hidden = true;
      return;
    }
    const tree = repo?.tree || {}; const assessment = repo?.staticAssessment || {};
    const label = treeStateLabel(tree);
    $('#fileTreeStatus').textContent = `${label} · ${fmt.format(tree.fileCount || 0)} file · ${fmt.format(tree.directoryCount || 0)} folder · ${humanSize(tree.totalBytes || 0)} tercatat${tree.sizeUnknownCount ? ` · ${fmt.format(tree.sizeUnknownCount)} size N/A` : ''}`;
    $('#fileIntegrityStatus').textContent = `Integritas struktur: ${assessment.integrityCoverage || 'tree-unavailable'} · Git tree ${tree.treeSha ? tree.treeSha.slice(0, 12) : '—'}${tree.redactedCount ? ` · ${fmt.format(tree.redactedCount)} path disaring` : ''}`;
    $('#fileActivityStatus').textContent = `Aktivitas: ${repo?.branch || '—'} · commit ${fmtDate(repo?.lastCommitAt)}`;
    if (state.selected) return;
    $('#fileSelectionTitle').textContent = repo?.fullName || 'Pilih repository';
    const panel = $('#fileSelectionData'); panel.replaceChildren();
    addInfo(panel, 'Jenis sistem', repo?.appType || '—');
    addInfo(panel, 'Pohon Git', `${label} · ${fmt.format(tree.entryCount || 0)} path`);
    addInfo(panel, 'Git tree SHA', tree.treeSha ? tree.treeSha.slice(0, 12) : '—', true);
    addInfo(panel, 'File executable bit', fmt.format(assessment.executableFileCount || 0));
    addInfo(panel, 'Eksekusi kode', 'TIDAK DIJALANKAN');
    const candidates = Array.isArray(assessment.runnableCandidates) ? assessment.runnableCandidates : [];
    const block = el('div', undefined, 'fm-candidate-list');
    block.append(el('span', 'Kandidat entry point / manifest', 'fm-info-label'));
    if (candidates.length) {
      const list = el('ul');
      candidates.slice(0, 8).forEach((item) => list.append(el('li', `${item.path} · ${item.label}`)));
      block.append(list);
    } else block.append(el('p', 'Belum terdeteksi dari nama file.'));
    panel.append(block, el('p', 'Metadata struktur saja; bukan audit keamanan atau bukti kode aman dijalankan.', 'fm-inspector-disclaimer'));
    $('#fileOpenGitHub').hidden = true;
  }

  function renderSelection(entry) {
    const repo = repoNow(); state.selected = entry?.path || null;
    $('#fileSelectionTitle').textContent = entry ? basename(entry.path) : repo?.fullName || 'Pilih file atau folder';
    const panel = $('#fileSelectionData'); panel.replaceChildren();
    if (!entry) { renderAssessment(repo); return; }
    addInfo(panel, 'Path', `/${entry.path}`, true);
    addInfo(panel, 'Jenis', entry.type === 'directory' ? 'Folder' : entry.type === 'submodule' ? 'Git submodule' : 'File');
    if (isVirtualRepo()) {
      addInfo(panel, 'Fungsi', entry.function || (entry.type === 'directory' ? 'Folder manajemen terpusat sistem' : extensionFunction(entry.path)));
      addInfo(panel, 'Ekstensi', entry.type === 'directory' ? '— (folder)' : ext(entry.path) || 'tanpa ekstensi');
      if (entry.type === 'directory') {
        const sub = state.manifest?.directories?.[entry.path];
        addInfo(panel, 'Isi folder', sub ? `${fmt.format(sub.entryCount)} item · manajemen terpusat aktif` : 'belum termuat');
        addInfo(panel, 'Sub URL folder', entry.subUrl || `#fileManager/${entry.path}`, true);
      } else {
        addInfo(panel, 'Ukuran metadata', sizeText(entry));
      }
      addInfo(panel, 'Mode', entry.mode || '—', true);
      addInfo(panel, 'Root virtual', `/${String(entry.path).split('/')[0]}`);
      // Pengaturan & tampilan terpusat per folder: preferensi lokal tersimpan di localStorage.
      if (entry.type === 'directory') {
        const settings = readFolderSettings(entry.path);
        const heading = el('div', undefined, 'fm-candidate-list');
        heading.append(el('span', 'PENGATURAN TERPUSAT FOLDER', 'fm-info-label'));
        const controls = el('div', undefined, 'fm-folder-settings');
        const sortLabel = el('label', undefined, 'fm-setting-row');
        const sortSelect = document.createElement('select');
        [['name', 'Urut: nama'], ['dir-first', 'Urut: folder dulu'], ['size', 'Urut: ukuran']]
          .forEach(([value, text]) => sortSelect.add(new Option(text, value)));
        sortSelect.value = settings.sort;
        sortSelect.addEventListener('change', () => saveFolderSettings(entry.path, { sort: sortSelect.value }));
        sortLabel.append(el('span', 'Urutan tampilan'), sortSelect);
        const iconRow = el('label', undefined, 'fm-setting-row');
        const iconToggle = document.createElement('input');
        iconToggle.type = 'checkbox'; iconToggle.checked = settings.folderIcon !== false;
        iconToggle.addEventListener('change', () => saveFolderSettings(entry.path, { folderIcon: iconToggle.checked }));
        iconRow.append(el('span', 'Ikon folder File Manager'), iconToggle);
        const denseRow = el('label', undefined, 'fm-setting-row');
        const denseToggle = document.createElement('input');
        denseToggle.type = 'checkbox'; denseToggle.checked = Boolean(settings.dense);
        denseToggle.addEventListener('change', () => { saveFolderSettings(entry.path, { dense: denseToggle.checked }); renderTiles(); });
        denseRow.append(el('span', 'Tampilan padat'), denseToggle);
        const openButton = el('button', 'Buka sebagai sub URL ↗', 'text-button fm-suburl-open');
        openButton.type = 'button';
        openButton.addEventListener('click', () => goTo(entry.path));
        controls.append(sortLabel, iconRow, denseRow, openButton);
        heading.append(controls);
        panel.append(heading);
      } else if (entry.codeContent) {
        const block = el('div', undefined, 'fm-candidate-list');
        block.append(el('span', 'ISI KODE CONTOH (sesuai nama/fungsi file)', 'fm-info-label'));
        const pre = el('pre', entry.codeContent, 'fm-code-preview');
        const copy = el('button', 'Salin isi kode', 'text-button');
        copy.type = 'button';
        copy.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(entry.codeContent); copy.textContent = 'Tersalin ✓'; }
          catch { copy.textContent = 'Gagal menyalin'; }
          setTimeout(() => { copy.textContent = 'Salin isi kode'; }, 1600);
        });
        block.append(pre, copy);
        panel.append(block);
      }
      panel.append(el('p', 'Struktur virtual repository `.L`: folder = sub URL dengan pengaturan terpusat; file memiliki nama, ekstensi, fungsi, dan isi kode contoh.', 'fm-inspector-disclaimer'));
      $('#fileOpenGitHub').hidden = true;
      $('#fileOpenEditorButton').hidden = true;
      syncUrlPath();
      return;
    }
    if (entry.type !== 'directory') addInfo(panel, 'Ukuran metadata Git', sizeText(entry));
    addInfo(panel, 'Mode Git', entry.mode || '—', true);
    addInfo(panel, 'Git object SHA', entry.sha || '—', true);
    panel.append(el('p', 'Hash adalah identitas objek Git dari metadata tree; isi file tidak diunduh.', 'fm-inspector-disclaimer'));
    const link = $('#fileOpenGitHub'); const url = githubPathUrl(repo, entry);
    link.hidden = !url; if (url) link.href = url;
    const editorButton = $('#fileOpenEditorButton');
    editorButton.hidden = entry.type !== 'file';
    if (entry.type === 'file') document.dispatchEvent(new CustomEvent('planetbintang:file-selected', { detail: {
      fullName: repo?.fullName || '', visibility: repo?.visibility || '', branch: repo?.branch || '', path: entry.path,
      sha: entry.sha || '', url, size: entry.size, sizeKnown: entry.sizeKnown !== false,
    } }));
  }

  function renderBreadcrumbs() {
    const container = $('#fileBreadcrumbs'); container.replaceChildren();
    const root = el('button', '/', 'fm-crumb'); root.type = 'button'; root.addEventListener('click', () => goTo(''));
    container.append(root);
    if (state.path) {
      let prefix = '';
      for (const part of state.path.split('/')) {
        prefix = prefix ? `${prefix}/${part}` : part;
        container.append(el('span', '/', 'fm-crumb-separator'));
        const crumb = el('button', part, 'fm-crumb'); crumb.type = 'button';
        const target = prefix; crumb.addEventListener('click', () => goTo(target)); container.append(crumb);
      }
    }
    $('#filePathInput').value = `/${state.path}`;
    $('#fileUpButton').disabled = !state.path;
  }

  function renderShortcuts(items) {
    const list = $('#fileFolderShortcuts'); list.replaceChildren();
    let folders = items.filter((item) => item.type === 'directory').slice(0, 80);
    if (isVirtualRepo() && !state.path) {
      const byName = new Map(folders.map((item) => [basename(item.path), item]));
      const ordered = VIRTUAL_SHORTCUTS.map((name) => byName.get(name)).filter(Boolean);
      folders = [...ordered, ...folders.filter((item) => !VIRTUAL_SHORTCUTS.includes(basename(item.path)))];
    }
    if (!folders.length) { list.append(el('p', 'Tidak ada subfolder pada path ini.', 'fm-shortcuts-empty')); return; }
    folders.forEach((item) => {
      const button = el('button', undefined, 'fm-shortcut'); button.type = 'button'; button.title = `Buka /${item.path}`;
      if (item.type === 'directory') {
        const img = document.createElement('img'); img.src = './file-manager-icon.png'; img.alt = ''; img.className = 'fm-shortcut-icon';
        button.append(img, el('span', basename(item.path)));
      } else button.textContent = basename(item.path);
      button.addEventListener('click', () => goTo(item.path)); list.append(button);
    });
  }

  function renderTiles() {
    const pane = $('#fileTiles'); pane.replaceChildren();
    const viewSettings = isVirtualRepo() ? readFolderSettings(state.path) : { dense: false, folderIcon: true };
    pane.classList.toggle('is-dense', Boolean(viewSettings.dense));
    const query = state.query.toLocaleLowerCase('id');
    const items = sortItems(state.entries.filter((item) => !query || item.path.toLocaleLowerCase('id').includes(query)));
    renderShortcuts(state.entries);
    $('#fileEmpty').hidden = items.length > 0;
    $('#fileEmpty').textContent = state.query ? 'Tidak ada kecocokan pada halaman folder yang sudah dimuat.' : 'Folder ini kosong atau semua nama sensitif disaring.';
    for (const item of items) {
      const tile = el('button', undefined, `file-tile${state.selected === item.path ? ' is-selected' : ''}${item.type === 'directory' ? ' is-directory' : ''}${viewSettings.dense ? ' is-dense' : ''}`);
      tile.type = 'button'; tile.setAttribute('role', 'listitem'); tile.title = `/${item.path}${item.type === 'directory' ? '/' : ''}`;
      tile.setAttribute('aria-label', `${item.type === 'directory' ? 'Folder' : 'File'} ${item.path}`);
      const icon = el('span', undefined, 'file-tile-icon');
      if (item.type === 'directory') {
        if (viewSettings.folderIcon !== false) { const img = document.createElement('img'); img.src = './file-manager-icon.png'; img.alt = ''; icon.append(img); }
        else icon.append(el('span', 'DIR', 'file-type-mark'));
      }
      else icon.append(el('span', kind(item), 'file-type-mark'));
      tile.append(icon, el('span', basename(item.path), 'file-tile-name'), el('span', item.type === 'directory' ? 'FOLDER' : `${kind(item)} · ${sizeText(item)}`, 'file-tile-meta'));
      tile.addEventListener('click', () => {
        if (item.type === 'directory') goTo(item.path);
        else { state.selected = item.path; renderTiles(); renderSelection(item); }
      });
      pane.append(tile);
    }
    const more = $('#fileLoadMoreButton');
    const hasMore = state.pageIndex < state.pageCount;
    more.hidden = !hasMore;
    more.disabled = state.loading;
    more.textContent = state.loading ? 'Memuat…' : `Muat halaman berikutnya (${fmt.format(state.entries.length)} / ${fmt.format(currentDirectory().entryCount || 0)})`;
  }

  async function loadNextPage() {
    if (state.loading || state.pageIndex >= state.pageCount) return;
    const requestId = state.requestId;
    const requestedRepo = state.repo;
    const requestedPath = state.path;
    const directory = currentDirectory(); const page = directory.pages?.[state.pageIndex];
    if (!page?.url || !/^(?:data\/trees\/[a-f0-9]{16}\/pages\/|[a-f0-9]{16}\/pages\/)[a-f0-9]{32}\.json\.gz$/.test(page.url)) return;
    state.loading = true; renderTiles();
    try {
      const response = await fetch(`./${page.url}?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await parseResponse(response);
      if (requestId !== state.requestId || requestedRepo !== state.repo || requestedPath !== state.path) return;
      if (payload.repository !== state.repo || payload.path !== state.path || !Array.isArray(payload.entries)) throw new Error('Shard pohon tidak sesuai manifest');
      state.entries.push(...payload.entries);
      state.pageIndex += 1;
      if (state.selected && !state.entries.some((item) => item.path === state.selected)) state.selected = null;
    } catch (error) {
      if (requestId === state.requestId) $('#fileTreeStatus').textContent = `Shard gagal dimuat: ${error.message}`;
    } finally {
      if (requestId === state.requestId) {
        state.loading = false; renderTiles();
        $('#fileSearchInput').placeholder = `Cari di ${fmt.format(state.entries.length)} item termuat`;
      }
    }
  }

  async function loadDirectory(path) {
    if (!isDirectory(path)) { $('#fileTreeStatus').textContent = `Path tidak ditemukan: /${path}`; return; }
    state.requestId += 1; state.loading = false;
    state.path = path; state.query = ''; state.selected = null; state.entries = []; state.pageIndex = 0;
    const directory = currentDirectory(); state.pageCount = directory.pages?.length || 0;
    $('#fileSearchInput').value = '';
    renderBreadcrumbs(); renderAssessment(repoNow()); renderTiles(); syncUrlPath();
    if (state.pageCount) await loadNextPage();
    else renderTiles();
  }

  function goTo(path) {
    const normalized = normalizePath(path);
    if (normalized === null) { $('#fileTreeStatus').textContent = 'Path relatif `.` atau `..` tidak diizinkan.'; return; }
    void loadDirectory(normalized);
  }

  async function loadManifest(targetPath = '') {
    state.requestId += 1; const requestId = state.requestId; const requestedRepo = state.repo; state.loading = false;
    const repo = repoNow(); state.manifest = null; state.entries = []; state.pageIndex = 0; state.pageCount = 0; state.path = ''; state.selected = null;
    renderBreadcrumbs(); renderAssessment(repo); renderTiles();
    let source = String(repo?.tree?.indexUrl || '');
    // `.L` memakai indeks pohon nyata (folder & file repositori), bukan shard virtual.
    if (!source && repo?.fullName === L_REPO) source = 'data/trees/3cf0c9cf3dddc379/index.json';
    if (!/^data\/trees\/[a-f0-9]{16}\/index\.json$/.test(source)) {
      $('#fileTreeStatus').textContent = 'Indeks pohon belum tersedia pada snapshot.';
      return;
    }
    try {
      const response = await fetch(`./${source}?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await parseResponse(response);
      if (requestId !== state.requestId || requestedRepo !== state.repo) return;
      if (manifest.repository !== state.repo && !(state.repo === L_REPO && manifest.repository === L_REPO)) throw new Error('Manifest tidak valid');
      state.manifest = manifest;
      const normalized = normalizePath(targetPath);
      await loadDirectory(normalized && isDirectory(normalized) ? normalized : '');
    } catch (error) {
      if (requestId === state.requestId) $('#fileTreeStatus').textContent = `Manifest pohon gagal dimuat: ${error.message}`;
    }
  }

  let handlersBound = false;
  function virtualRepoEntry() {
    return {
      name: '.L', fullName: L_REPO, url: 'https://github.com/planetbintang/.L', branch: 'io', visibility: 'public',
      appType: 'Repositori .L — folder & file pohon nyata di File Manager menu utama', lastCommitAt: null,
      tree: { state: 'complete', indexUrl: 'data/trees/3cf0c9cf3dddc379/index.json', entryCount: 0, fileCount: 0, directoryCount: 0, totalBytes: 0 },
      staticAssessment: {},
    };
  }

  async function init(data, preserveLocation = true) {
    const previousRepo = state.repo; const previousPath = state.path;
    const list = [...(data.repositories || [])];
    const virtualEntry = virtualRepoEntry();
    const existingIndex = list.findIndex((repo) => repo.fullName === L_REPO);
    if (existingIndex >= 0) {
      // Pertahankan indeks pohon nyata repo `.L` dari snapshot; isi hanya metadata cadangan.
      list[existingIndex] = { ...virtualEntry, ...list[existingIndex], tree: list[existingIndex].tree || virtualEntry.tree };
    } else list.unshift(virtualEntry);
    state.data = { ...data, repositories: list };
    const select = $('#fileRepoSelect'); select.replaceChildren();
    list.forEach((repo) => select.add(new Option(repo.fullName === L_REPO ? `${repo.fullName} — ROOT .L (folder & file repositori)` : repo.fullName || repo.name, repo.fullName || repo.name)));
    const preferred = list.find((repo) => repo.fullName === previousRepo) || list.find((repo) => repo.fullName === L_REPO) || list[0];
    state.repo = preferred?.fullName || '';
    if (state.repo) select.value = state.repo;
    if (!handlersBound) {
      select.addEventListener('change', () => { state.repo = select.value; state.query = ''; $('#fileSearchInput').value = ''; void loadManifest(); });
      $('#fileRootButton').addEventListener('click', () => goTo(''));
      $('#fileUpButton').addEventListener('click', () => goTo(state.path.split('/').slice(0, -1).join('/')));
      $('#filePathForm').addEventListener('submit', (event) => { event.preventDefault(); goTo($('#filePathInput').value); });
      $('#fileSearchInput').addEventListener('input', (event) => { state.query = event.target.value.trim(); renderTiles(); });
      $('#fileLoadMoreButton').addEventListener('click', () => void loadNextPage());
      handlersBound = true;
    }
    await loadManifest(preserveLocation && state.repo === previousRepo ? previousPath : '');
  }

  async function loadTreeIndex() {
    try {
      const response = await fetch(`./data/repositories.json?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await parseResponse(response);
      if (!Array.isArray(data.repositories)) throw new Error('Snapshot tidak valid');
      await init(data, false);
    } catch (error) {
      $('#fileTreeStatus').textContent = `Gagal memuat pohon: ${error.message}`;
      $('#fileEmpty').hidden = false; $('#fileEmpty').textContent = 'File Manager tidak dapat membaca snapshot saat ini.';
    }
  }

  window.PBFileManager = { applySnapshot: (data) => init(data, true) };
  if (window.PBSystemSnapshot?.subscribe) window.PBSystemSnapshot.subscribe('file-manager', (data) => init(data, true));
  else loadTreeIndex();
})();
