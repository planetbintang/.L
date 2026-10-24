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
  // Folder tingkat root yang dikelola pada ROOT .L — termasuk folder sistem
  // virtual (/proc /sys /media /acct /pro /config /cache /system_ext) yang
  // selalu ditampilkan di samping folder nyata repositori (.github data scripts).
  const VIRTUAL_SHORTCUTS = ['data', 'proc', 'sys', 'media', 'acct', 'pro', 'config', 'cache', 'system_ext', 'workspace'];
  const VIRTUAL_ROOT_META = {
    proc: { desc: 'Virtual filesystem proses (pid, stat, cmdline)', items: 3 },
    sys: { desc: 'Sysfs perangkat & kernel (class, bus, devices)', items: 3 },
    media: { desc: 'Mount point penyimpanan eksternal', items: 2 },
    acct: { desc: 'Cgroup accounting proses Android', items: 2 },
    pro: { desc: 'Folder konfigurasi profil sistem', items: 2 },
    config: { desc: 'Konfigurasi terpusat sistem & layanan', items: 2 },
    cache: { desc: 'Cache aplikasi & sistem (writable)', items: 2 },
    system_ext: { desc: 'Partisi system_ext (produk & ODM)', items: 2 },
    workspace: { desc: 'Penyimpanan workspace lokal dari menu Manage', items: 0 },
  };
  function isVirtualRootName(name) { return VIRTUAL_SHORTCUTS.includes(name) && name !== 'data'; }
  function virtualRootEntry(name) {
    const meta = VIRTUAL_ROOT_META[name] || { desc: 'Folder virtual root — manajemen terpusat struktur sistem', items: 0 };
    return {
      path: name, type: 'directory', mode: '040755', sha: '', size: 0, sizeKnown: true,
      title: `/${name}`, desc: meta.desc, items: meta.items,
      function: `Folder virtual root /${name} — sub URL File Manager dengan pengaturan terpusat`,
      subUrl: `#fileManager/${name}`, virtualRoot: true,
    };
  }
  function localWorkspaceEntries() {
    let items = [];
    try { items = JSON.parse(localStorage.getItem('planetbintang.file-manager.workspace.v1') || '[]'); } catch { items = []; }
    return Array.isArray(items) ? items.filter((item) => item?.name).map((item) => ({
      path: `workspace/${String(item.name).replaceAll('/', '-')}`, type: 'file', mode: '0100644',
      size: String(item.content || '').length, sizeKnown: true, function: 'File workspace lokal — dapat dibaca, ditulis, diedit, dan dihapus melalui Manage / Files',
      localWorkspace: true, codeContent: String(item.content || ''),
    })) : [];
  }
  function virtualChildren(path) {
    const children = {
      proc: [
        { path: 'proc/self', type: 'directory', mode: '041777', function: 'Symlink proses saat ini' },
        { path: 'proc/stat', type: 'file', mode: '0100444', size: 0, sizeKnown: false, codeContent: 'cpu  864210 21930 152110 5210480 30210 4180 2990 0 0 0\ncpu0 108210 2710 19010 651310 3790 520 370 0 0 0\nintr 184122330 42 0 0 ...\nctxt 92114832\nbtime 1761200000\nprocesses 31245\nprocs_running 3\nprocs_blocked 0' },
        { path: 'proc/version', type: 'file', mode: '0100444', size: 84, sizeKnown: true, codeContent: 'Linux version 5.15.149-android13-8-00001 (build@android-build) #1 SMP PREEMPT' },
      ],
      sys: [
        { path: 'sys/class', type: 'directory', mode: '040755', function: 'Kelas perangkat (net, power_supply, usb)' },
        { path: 'sys/bus', type: 'directory', mode: '040755', function: 'Bus perangkat (platform, i2c, usb)' },
        { path: 'sys/kernel', type: 'directory', mode: '040755', function: 'Parameter kernel (mm, sched)' },
      ],
      media: [
        { path: 'media/emulated', type: 'directory', mode: '040770', function: 'Storage emulated pengguna (0..N)' },
        { path: 'media/asec', type: 'directory', mode: '040770', function: 'Container aplikasi terenkripsi' },
      ],
      acct: [
        { path: 'acct/current', type: 'file', mode: '0100644', size: 28, sizeKnown: true, codeContent: '/uid_10123/pid_4567/apps' },
        { path: 'acct/debug', type: 'file', mode: '0100644', size: 0, sizeKnown: false, codeContent: '# cgroup accounting debug (tidak tersedia saat runtime)' },
      ],
      pro: [
        { path: 'pro/profiles', type: 'directory', mode: '040755', function: 'Profil perangkat & kebijakan' },
        { path: 'pro/pro.conf', type: 'file', mode: '0100644', size: 96, sizeKnown: true, codeContent: '[profile]\ndefault = base\nfallback = safe\nmode = managed' },
      ],
      config: [
        { path: 'config/services', type: 'directory', mode: '040755', function: 'Konfigurasi layanan sistem' },
        { path: 'config/system.conf', type: 'file', mode: '0100644', size: 120, sizeKnown: true, codeContent: 'manager centralized=true\nroot=/\nauto-mount=proc,sys\nlog-level=info' },
      ],
      cache: [
        { path: 'cache/recovery', type: 'directory', mode: '040770', function: 'Antrean perintah recovery (update_engine)' },
        { path: 'cache/global.config', type: 'file', mode: '0100644', size: 64, sizeKnown: true, codeContent: 'wipe_on_boot=false\nverbose_log=false' },
      ],
      system_ext: [
        { path: 'system_ext/etc', type: 'directory', mode: '040755', function: 'Konfigurasi partisi system_ext' },
        { path: 'system_ext/compatibility_matrix.xml', type: 'file', mode: '0100644', size: 210, sizeKnown: true, codeContent: '<compatibility-matrix version="202404" type="framework">\n  <hal format="aidl" optional="false"><name>gatekeeper</name><version>1</version></hal>\n</compatibility-matrix>' },
      ],
    };
    if (path === 'workspace') return localWorkspaceEntries();
    return children[path] || [];
  }
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
  // Root .L = gabungan pohon nyata repositori + folder sistem virtual tingkat root.
  function lRootVirtualNames() {
    const existing = new Set(Object.keys(state.manifest?.directories || {}));
    return VIRTUAL_SHORTCUTS.filter((name) => !existing.has(name));
  }
  function isLVirtualPath(path) {
    if (!isLRepo()) return false;
    const top = String(path || '').split('/')[0];
    return Boolean(top) && isVirtualRootName(top);
  }
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
  function isDirectory(path) {
    if (Boolean(state.manifest?.directories && Object.hasOwn(state.manifest.directories, path))) return true;
    // Folder sistem virtual tingkat root .L juga dianggap direktori valid.
    return isLVirtualPath(path);
  }

  function lVirtualEntriesFor(prefix) {
    const top = String(prefix || '').split('/')[0];
    if (!top) return VIRTUAL_SHORTCUTS.filter((name) => isVirtualRootName(name)).map(virtualRootEntry);
    if (!isVirtualRootName(top)) return [];
    if (!prefix || prefix === top) return [];
    return virtualChildren(top).filter((item) => item.path.startsWith(`${prefix}/`) && !item.path.slice(prefix.length + 1).includes('/'));
  }

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
      $('#fileActivityStatus').textContent = 'Manajemen terpusat: /data /proc /sys /media /acct /pro /config /cache /system_ext';
      if (state.selected) return;
      $('#fileSelectionTitle').textContent = 'Pusat Manajemen Folder Sistem (.L)';
      const panel = $('#fileSelectionData'); panel.replaceChildren();
      addInfo(panel, 'Jenis sistem', 'Sub URL repository `.L` — root virtual File Manager');
      addInfo(panel, 'Basis sub URL', 'planetbintang.github.io/.L/ → path `/`');
      addInfo(panel, 'Folder tingkat root', VIRTUAL_SHORTCUTS.map((name) => `/${name}`).join(' · '));
      const managedDirs = new Set(Object.keys(manifest.directories || {}));
      lRootVirtualNames().forEach((name) => managedDirs.add(name));
      addInfo(panel, 'Total entri terkelola', `${fmt.format((manifest.entryCount || 0) + virtualChildren('__root__').length)} path`);
      addInfo(panel, 'Folder terkelola', fmt.format(Math.max(0, managedDirs.size - 1)));
      addInfo(panel, 'Isi path aktif', `${fmt.format((directory.entryCount || 0) + (state.path ? 0 : lRootVirtualNames().length))} item${state.path ? ` · /${state.path}` : ' · /'}`);
      addInfo(panel, 'URL aktif saat ini', `${window.location.origin}${window.location.pathname}#fileManager${state.path ? `/${state.path}` : ''}`, true);
      const block = el('div', undefined, 'fm-candidate-list');
      block.append(el('span', 'Fungsi tiap folder root (klik judul untuk membuka)', 'fm-info-label'));
      const list = el('ul');
      // Folder root = daftar shortcut sistem (VIRTUAL_SHORTCUTS) + folder nyata repositori.
      const realDirNames = Object.keys(manifest.directories || {}).filter((name) => name && !name.includes('/'));
      const rootOrder = [...new Set([...VIRTUAL_SHORTCUTS, ...realDirNames])];
      const roots = rootOrder.map((name) => {
        if (isVirtualRootName(name)) return virtualRootEntry(name);
        const fromManifest = Array.isArray(manifest.roots) ? manifest.roots.find((item) => basename(item.path) === name) : null;
        if (fromManifest) return fromManifest;
        const dir = manifest.directories?.[name];
        return { path: name, title: `/${name}`, desc: 'Folder nyata repositori .L — pohon Git terverifikasi', items: dir?.entryCount || 0 };
      });
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
    // Folder sistem virtual pada ROOT .L (di luar pohon Git nyata): tampilkan
    // inspector gaya manajemen terpusat — fungsi, sub URL, & pengaturan folder.
    if (isLRepo() && isLVirtualPath(entry.path)) {
      const vEntry = entry.virtualRoot ? entry : (() => {
        const top = String(entry.path).split('/')[0];
        const child = virtualChildren(top).find((item) => item.path === entry.path);
        return child || { ...entry, function: `Item dalam folder virtual /${top}` };
      })();
      const merged = { ...vEntry, path: entry.path, type: entry.type || vEntry.type };
      addInfo(panel, 'Fungsi', merged.function || extensionFunction(merged.path));
      addInfo(panel, 'Ekstensi', merged.type === 'directory' ? '— (folder)' : ext(merged.path) || 'tanpa ekstensi');
      if (merged.type === 'directory') {
        const kids = virtualChildren(merged.path);
        addInfo(panel, 'Isi folder', `${fmt.format(kids.length)} item · manajemen terpusat aktif`);
        addInfo(panel, 'Sub URL folder', merged.subUrl || `#fileManager/${merged.path}`, true);
      } else {
        addInfo(panel, 'Ukuran metadata', sizeText(merged));
      }
      addInfo(panel, 'Mode', merged.mode || '—', true);
      addInfo(panel, 'Root virtual', `/${String(merged.path).split('/')[0]}`);
      if (merged.type === 'directory') {
        const heading = el('div', undefined, 'fm-candidate-list');
        heading.append(el('span', 'PENGATURAN TERPUSAT FOLDER', 'fm-info-label'));
        const controls = el('div', undefined, 'fm-folder-settings');
        const openButton = el('button', 'Buka sebagai sub URL ↗', 'text-button fm-suburl-open');
        openButton.type = 'button';
        openButton.addEventListener('click', () => goTo(merged.path));
        controls.append(openButton);
        heading.append(controls);
        panel.append(heading);
      } else if (merged.codeContent) {
        const block = el('div', undefined, 'fm-candidate-list');
        block.append(el('span', 'ISI KODE CONTOH (sesuai nama/fungsi file)', 'fm-info-label'));
        block.append(el('pre', merged.codeContent, 'fm-code-preview'));
        panel.append(block);
      }
      panel.append(el('p', 'Folder sistem virtual tingkat root `.L`: bukan bagian pohon Git repositori; ditampilkan terpusat di File Manager menu utama.', 'fm-inspector-disclaimer'));
      $('#fileOpenGitHub').hidden = true;
      $('#fileOpenEditorButton').hidden = true;
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
        const img = document.createElement('img'); img.src = './folder-3d-icon.jpg'; img.alt = ''; img.className = 'fm-shortcut-icon';
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
    // Root .L: sisipkan folder sistem virtual di samping entri pohon nyata.
    const lRootVirtual = (isLRepo() && !state.path) ? lVirtualEntriesFor('') : [];
    const allItems = [...state.entries, ...lRootVirtual];
    const items = sortItems(allItems.filter((item) => !query || item.path.toLocaleLowerCase('id').includes(query)));
    renderShortcuts(allItems);
    $('#fileEmpty').hidden = items.length > 0;
    $('#fileEmpty').textContent = state.query ? 'Tidak ada kecocokan pada halaman folder yang sudah dimuat.' : 'Folder ini kosong atau semua nama sensitif disaring.';
    for (const item of items) {
      const tile = el('button', undefined, `file-tile${state.selected === item.path ? ' is-selected' : ''}${item.type === 'directory' ? ' is-directory' : ''}${viewSettings.dense ? ' is-dense' : ''}`);
      tile.type = 'button'; tile.setAttribute('role', 'listitem'); tile.title = `/${item.path}${item.type === 'directory' ? '/' : ''}`;
      tile.setAttribute('aria-label', `${item.type === 'directory' ? 'Folder' : 'File'} ${item.path}`);
      const icon = el('span', undefined, 'file-tile-icon');
      if (item.type === 'directory') {
        if (viewSettings.folderIcon !== false) { const img = document.createElement('img'); img.src = './folder-3d-icon.jpg'; img.alt = ''; icon.append(img); }
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
    if (isLRepo() && isLVirtualPath(path)) {
      // Folder sistem virtual: isi statis dari definisi root .L.
      state.requestId += 1; state.loading = false;
      state.path = path; state.query = ''; state.selected = null;
      const top = String(path).split('/')[0];
      state.entries = path === top ? virtualChildren(top) : lVirtualEntriesFor(path);
      state.pageIndex = 0; state.pageCount = 0;
      $('#fileSearchInput').value = '';
      renderBreadcrumbs(); renderAssessment(repoNow()); renderTiles();
      return;
    }
    if (!isDirectory(path)) { $('#fileTreeStatus').textContent = `Path tidak ditemukan: /${path}`; return; }
    state.requestId += 1; state.loading = false;
    state.path = path; state.query = ''; state.selected = null; state.entries = []; state.pageIndex = 0;
    const directory = currentDirectory(); state.pageCount = directory.pages?.length || 0;
    $('#fileSearchInput').value = '';
    renderBreadcrumbs(); renderAssessment(repoNow()); renderTiles(); syncUrlPath();
    // Saat File Manager pertama dibuka, root `.L` harus menampilkan seluruh
    // folder dan file langsung di `/`, bukan berhenti pada halaman shard pertama.
    // Folder di bawah root tetap lazy-load agar repositori besar tetap ringan.
    if (state.pageCount) {
      const eagerRoot = isLRepo() && !path;
      do {
        const pageBefore = state.pageIndex;
        await loadNextPage();
        if (state.pageIndex === pageBefore) break;
      } while (eagerRoot && state.pageIndex < state.pageCount && !state.loading);
    }
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
    // File Manager menampilkan seluruh repositori pada snapshot; `.L` tetap menjadi root default.
    const repositories = list.filter((repo) => repo && repo.fullName);
    state.data = { ...data, repositories };
    const select = $('#fileRepoSelect'); select.replaceChildren();
    repositories.forEach((repo) => select.add(new Option(repo.fullName === L_REPO ? '.L · root system' : repo.fullName, repo.fullName)));
    const preferredRepo = repositories.some((repo) => repo.fullName === previousRepo) ? previousRepo : L_REPO;
    state.repo = repositories.find((repo) => repo.fullName === preferredRepo)?.fullName || repositories[0]?.fullName || '';
    select.value = state.repo;
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

  window.PBFileManager = { applySnapshot: (data) => init(data, true), refreshWorkspace: () => {
    if (isLRepo() && (state.path === '' || state.path === 'workspace')) void loadDirectory(state.path);
  } };
  window.addEventListener('planetbintang:workspace-files-changed', () => window.PBFileManager?.refreshWorkspace());
  if (window.PBSystemSnapshot?.subscribe) window.PBSystemSnapshot.subscribe('file-manager', (data) => init(data, true));
  else loadTreeIndex();
})();
