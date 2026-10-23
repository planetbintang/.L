(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const fmt = new Intl.NumberFormat('id-ID');
  const state = { data: null, repo: '', path: '', query: '', manifest: null, entries: [], pageIndex: 0, pageCount: 0, loading: false, selected: null, requestId: 0 };

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
  function sortItems(items) {
    return [...items].sort((a, b) => Number(b.type === 'directory') - Number(a.type === 'directory') || basename(a.path).localeCompare(basename(b.path), 'id', { sensitivity: 'base' }));
  }
  function currentDirectory() { return state.manifest?.directories?.[state.path] || { entryCount: 0, pages: [] }; }
  function isDirectory(path) { return Boolean(state.manifest?.directories && Object.hasOwn(state.manifest.directories, path)); }

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
    $('#fileSelectionTitle').textContent = entry ? basename(entry.path) : repo?.fullName || 'Pilih repository';
    const panel = $('#fileSelectionData'); panel.replaceChildren();
    if (!entry) { renderAssessment(repo); return; }
    addInfo(panel, 'Path', `/${entry.path}`, true);
    addInfo(panel, 'Jenis', entry.type === 'directory' ? 'Folder' : entry.type === 'submodule' ? 'Git submodule' : 'File');
    if (entry.type !== 'directory') addInfo(panel, 'Ukuran metadata Git', sizeText(entry));
    addInfo(panel, 'Mode Git', entry.mode || '—', true);
    addInfo(panel, 'Git object SHA', entry.sha || '—', true);
    panel.append(el('p', 'Hash adalah identitas objek Git dari metadata tree; isi file tidak diunduh.', 'fm-inspector-disclaimer'));
    const link = $('#fileOpenGitHub'); const url = githubPathUrl(repo, entry);
    link.hidden = !url; if (url) link.href = url;
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
    const folders = items.filter((item) => item.type === 'directory').slice(0, 80);
    if (!folders.length) { list.append(el('p', 'Tidak ada subfolder pada path ini.', 'fm-shortcuts-empty')); return; }
    folders.forEach((item) => {
      const button = el('button', basename(item.path), 'fm-shortcut'); button.type = 'button'; button.title = `Buka /${item.path}`;
      button.addEventListener('click', () => goTo(item.path)); list.append(button);
    });
  }

  function renderTiles() {
    const pane = $('#fileTiles'); pane.replaceChildren();
    const query = state.query.toLocaleLowerCase('id');
    const items = sortItems(state.entries.filter((item) => !query || item.path.toLocaleLowerCase('id').includes(query)));
    renderShortcuts(state.entries);
    $('#fileEmpty').hidden = items.length > 0;
    $('#fileEmpty').textContent = state.query ? 'Tidak ada kecocokan pada halaman folder yang sudah dimuat.' : 'Folder ini kosong atau semua nama sensitif disaring.';
    for (const item of items) {
      const tile = el('button', undefined, `file-tile${state.selected === item.path ? ' is-selected' : ''}${item.type === 'directory' ? ' is-directory' : ''}`);
      tile.type = 'button'; tile.setAttribute('role', 'listitem'); tile.title = `/${item.path}${item.type === 'directory' ? '/' : ''}`;
      tile.setAttribute('aria-label', `${item.type === 'directory' ? 'Folder' : 'File'} ${item.path}`);
      const icon = el('span', undefined, 'file-tile-icon');
      if (item.type === 'directory') { const img = document.createElement('img'); img.src = './file-manager-icon.png'; img.alt = ''; icon.append(img); }
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
    if (!page?.url || !/^data\/trees\/[a-f0-9]{16}\/pages\/[a-f0-9]{32}\.json\.gz$/.test(page.url)) return;
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
    renderBreadcrumbs(); renderAssessment(repoNow()); renderTiles();
    if (state.pageCount) await loadNextPage();
    else renderTiles();
  }

  function goTo(path) {
    const normalized = normalizePath(path);
    if (normalized === null) { $('#fileTreeStatus').textContent = 'Path relatif `.` atau `..` tidak diizinkan.'; return; }
    void loadDirectory(normalized);
  }

  async function loadManifest() {
    state.requestId += 1; state.loading = false;
    const repo = repoNow(); state.manifest = null; state.entries = []; state.pageIndex = 0; state.pageCount = 0; state.path = ''; state.selected = null;
    renderBreadcrumbs(); renderAssessment(repo); renderTiles();
    const source = String(repo?.tree?.indexUrl || '');
    if (!/^data\/trees\/[a-f0-9]{16}\/index\.json$/.test(source)) {
      $('#fileTreeStatus').textContent = 'Indeks pohon belum tersedia pada snapshot.';
      return;
    }
    try {
      const response = await fetch(`./${source}?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await parseResponse(response);
      if (manifest.repository !== state.repo || !manifest.directories || !Object.hasOwn(manifest.directories, '')) throw new Error('Manifest tidak valid');
      state.manifest = manifest;
      await loadDirectory('');
    } catch (error) {
      $('#fileTreeStatus').textContent = `Manifest pohon gagal dimuat: ${error.message}`;
    }
  }

  async function init(data) {
    state.data = data;
    const select = $('#fileRepoSelect'); select.replaceChildren();
    (data.repositories || []).forEach((repo) => select.add(new Option(repo.fullName || repo.name, repo.fullName || repo.name)));
    const preferred = data.repositories?.find((repo) => repo.fullName === 'planetbintang/.L') || data.repositories?.[0];
    state.repo = preferred?.fullName || '';
    if (state.repo) select.value = state.repo;
    select.addEventListener('change', () => { state.repo = select.value; state.query = ''; $('#fileSearchInput').value = ''; void loadManifest(); });
    $('#fileRootButton').addEventListener('click', () => goTo(''));
    $('#fileUpButton').addEventListener('click', () => goTo(state.path.split('/').slice(0, -1).join('/')));
    $('#filePathForm').addEventListener('submit', (event) => { event.preventDefault(); goTo($('#filePathInput').value); });
    $('#fileSearchInput').addEventListener('input', (event) => { state.query = event.target.value.trim(); renderTiles(); });
    $('#fileLoadMoreButton').addEventListener('click', () => void loadNextPage());
    await loadManifest();
  }

  async function loadTreeIndex() {
    try {
      const response = await fetch(`./data/repositories.json?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await parseResponse(response);
      if (!Array.isArray(data.repositories)) throw new Error('Snapshot tidak valid');
      await init(data);
    } catch (error) {
      $('#fileTreeStatus').textContent = `Gagal memuat pohon: ${error.message}`;
      $('#fileEmpty').hidden = false; $('#fileEmpty').textContent = 'File Manager tidak dapat membaca snapshot saat ini.';
    }
  }

  loadTreeIndex();
})();
