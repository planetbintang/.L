/* Planetbintang System Library v2 — generated layouts and repository-driven navigation.
   Virtual catalogue entries are explicitly labelled; actual files come from the repository index. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const root = $('#system-library');
  if (!root) return;

  const kinds = [
    ['Dashboard','Ringkasan metrik, status, dan aktivitas','dashboard','Metrik · status · ringkasan'],
    ['Statistik','Kartu angka, tren, distribusi, dan perbandingan','chart','Angka · tren · grafik'],
    ['Daftar data','Daftar item dengan pencarian, filter, dan urutan','list','Cari · filter · urutkan'],
    ['Tabel data','Data terstruktur dengan kolom dan navigasi halaman','table','Baris · kolom · halaman'],
    ['Repositori','Nama repo, branch, visibilitas dan tautan sumber','repo','Git · branch · source'],
    ['File browser','Jelajah folder dan file yang ada di File Manager','file','Folder · file · jalur'],
    ['Panel detail','Metadata, identitas item dan tindakan terkait','detail','Metadata · aksi'],
    ['Form input','Form dengan validasi, status, dan umpan balik','form','Input · validasi'],
    ['Sinkronisasi','Status snapshot, indeks dan asal data','sync','Snapshot · indeks'],
    ['Timeline','Aktivitas kronologis dan riwayat perubahan','timeline','Waktu · aktivitas'],
    ['Menu kategori','Navigasi kategori dan hierarki menu','menu','Kategori · hierarki'],
    ['Pencarian global','Pencarian katalog, ID, kategori, dan jalur','search','Query · indeks'],
    ['Status sistem','Kesehatan modul dan status koneksi','status','Status · modul'],
    ['Panel media','Pratinjau aset dan metadata berkas media','media','Gambar · video · dokumen'],
    ['Pengaturan','Preferensi tampilan dan perilaku UI','settings','Tema · preferensi'],
    ['Workspace','Proyek, tugas dan artefak kerja lokal','workspace','Proyek · tugas'],
    ['Log aktivitas','Jejak aksi, hasil, dan timestamp','logs','Audit · riwayat'],
    ['Panel akses','Sumber, kebijakan, dan metadata akses','access','Izin · sumber'],
    ['Integrasi','Konektor dan status sistem eksternal','integration','API · konektor'],
    ['Dokumentasi','Panduan, kontrak data dan referensi fungsi','docs','Panduan · schema'],
    ['Papan Kanban','Kolom pekerjaan dan status alur kerja','kanban','To-do · progres'],
    ['Editor kode','Cuplikan kode dan metadata berkas sumber','editor','HTML · CSS · JS'],
    ['Preview layout','Pratinjau pola komponen responsif','preview','UI · breakpoints'],
    ['Pusat notifikasi','Pemberitahuan dan keadaan sistem','notice','Info · peringatan'],
    ['Peta hubungan','Relasi modul, path, dan repository','graph','Relasi · dependensi'],
    ['Arsip','Metadata berkas arsip dan tindakan ekspor','archive','Ekspor · backup'],
    ['Antrian kerja','Pekerjaan terjadwal, menunggu, dan selesai','queue','Job · antrian'],
    ['Keamanan','Pemeriksaan status dan checklist kebijakan','security','Policy · pemeriksaan'],
    ['Form konfigurasi','Konfigurasi layanan dengan validasi field','config','Config · schema'],
    ['Perbandingan','Bandingkan dua snapshot atau metadata','compare','Diff · perubahan']
  ];
  const layoutCount = 600;
  const layouts = Array.from({length: layoutCount}, (_, i) => {
    const kind = kinds[i % kinds.length];
    const variant = Math.floor(i / kinds.length) + 1;
    const code = String(i + 1).padStart(4, '0');
    return {
      id: 'LAY-' + code,
      name: kind[0] + ' · Varian ' + String(variant).padStart(2, '0'),
      description: kind[1],
      category: kind[0],
      kind: kind[2],
      details: kind[3],
      source: 'layout-library',
      path: 'system_ext/layouts/' + kind[2] + '/variant-' + String(variant).padStart(3, '0') + '.json',
      real: false
    };
  });

  const readRepos = () => {
    const snap = window.PBSystemSnapshot?.data;
    return Array.isArray(snap?.repositories) ? snap.repositories : [];
  };
  const readFiles = () => {
    const candidates = [
      window.PB_REPOSITORY_INDEX?.files,
      window.PBFileManager?.getIndex?.()?.files
    ];
    return candidates.find(Array.isArray) || [];
  };
  const fallbackFileEntries = () => {
    // Root manifest is a real, published Git-tree snapshot. Directory contents
    // are lazy-loaded by File Manager, so the catalog also indexes root filenames.
    const rootEntries = [
      '.github', 'assets', 'aireber', 'airz', 'data', 'datadokumen', 'datapro',
      'documentation', 'dokumen', 'scripts', 'index.html', 'README.md',
      'app.js', 'dashboard.js', 'dashboard.css', 'file-manager.js',
      'workspace.js', 'workspace.css', 'system-navigation.js',
      'system-library.js', 'system-library-v2.js', 'navigation-fix.js',
      'navigation-fix.css', 'system-tools.js', 'local-file-store.js',
      'platform-view.js', 'enterprise-map.js', 'air-cloud-console.js',
      'snaps-bridge.js', 'aireber-bridge.js', 'data/repositories.json',
      'data/enterprise-menus-index.js', 'data/air-cloud-menus-index.js',
      'data/trees/3cf0c9cf3dddc379/index.json'
    ];
    return rootEntries.map((path, index) => ({
      id: 'FILE-' + String(index + 1).padStart(5, '0'),
      name: path.split('/').pop(),
      description: path + ' · indeks path terbit; isi file tidak disalin ke katalog',
      category: 'File Manager',
      details: 'Path dari snapshot Git-tree .L. Buka untuk melihat metadata dan konten yang diizinkan File Manager.',
      source: 'repository-tree-index',
      path: '#fileManager/' + encodePath(path),
      repoPath: path,
      real: true
    }));
  };
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const repoEntries = () => readRepos().map((repo, index) => {
    const fullName = String(repo.fullName || repo.name || 'repository');
    return {
      id: 'REPO-' + String(index + 1).padStart(5, '0'),
      name: fullName,
      description: [repo.description, repo.language, repo.branch ? 'branch ' + repo.branch : ''].filter(Boolean).join(' · ') || 'Metadata repository dari snapshot',
      category: 'Repositori',
      details: 'Repository metadata · branch · visibility · sumber snapshot. Pilih untuk membuka folder root repository di File Manager.',
      source: 'repository-index',
      path: '#fileManager/' + encodePath(fullName.replace(/^.*\\//, '')),
      repoFullName: fullName,
      repoPath: '',
      real: true
    };
  });
  const actualFileEntries = () => readFiles().map((f, index) => {
    const path = String(f.path || f.name || '');
    return {
      id: 'FILE-' + String(index + 1).padStart(5, '0'),
      name: path.split('/').pop() || path || 'File tanpa nama',
      description: path,
      category: 'File Manager',
      details: [f.type || 'Item indeks', f.sizeKnown ? (Number(f.size || 0).toLocaleString('id-ID') + ' byte') : 'ukuran belum diketahui', f.sha ? 'Git object tersedia' : 'SHA tidak tersedia'].join(' · '),
      source: 'repository-index',
      path: '#fileManager/' + encodePath(path),
      repoPath: path,
      real: true
    };
  });
  function encodePath(path) {
    return String(path).split('/').map(encodeURIComponent).join('/');
  }
  function decodeRoutePath(path) {
    return String(path || '').split('/').map(part => {
      try { return decodeURIComponent(part); } catch { return part; }
    }).join('/');
  }

  const navEntries = [...document.querySelectorAll('.main-nav a, .nav-dropdown-menu a, .nav-dropdown-menu button')]
    .map((el, index) => ({
      id: 'NAV-' + String(index + 1).padStart(5, '0'),
      name: el.querySelector('b')?.textContent?.trim() || el.textContent.trim(),
      description: el.querySelector('small')?.textContent?.trim() || 'Navigasi platform',
      category: 'Navigasi',
      details: 'Sumber HTML utama · ' + (el.dataset.systemRoute || 'tautan'),
      source: 'navigation-dom',
      path: el.getAttribute('href') || '#overview',
      route: el.dataset.systemRoute || '',
      real: true
    }));
  const systemCategories = ['Repository','File Manager','Workspace','Platform','Air Cloud','SNAPS','Media','Dokumentasi','Sistem','Integrasi','Administrasi','Observability'];
  const systemMenus = Array.from({length: 2400}, (_, i) => {
    const category = systemCategories[i % systemCategories.length];
    const family = kinds[Math.floor(i / systemCategories.length) % kinds.length];
    const code = String(i + 1).padStart(5, '0');
    const path = ['data','proc','sys','media','acct','pro','config','cache','system_ext','workspace'][i % 10];
    return {
      id: 'SYS-' + code,
      name: category + ' · ' + family[0] + ' · ' + String(i + 1).padStart(4, '0'),
      description: family[1] + '. Entri katalog virtual, tidak menjalankan kode secara otomatis.',
      category: 'Menu sistem',
      details: 'Katalog virtual · kelompok ' + category + ' · fungsi terkait ' + family[2],
      source: 'virtual-catalog',
      path: '#fileManager/' + path,
      real: false
    };
  });
  const layoutEntries = layouts.map(x => ({...x, details:x.details + ' · komponen pola; perlu binding data sebelum dipakai produksi'}));
  let query = '', category = 'Semua', page = 0, pageSize = 24, selected = null;
  const baseCategories = ['Semua','Blok layout','Navigasi','Menu sistem','Repositori','File Manager'];
  const categoryNames = [...new Set([...baseCategories, ...kinds.map(x=>x[0])])];

  root.innerHTML = `
    <div class="library-head">
      <div class="library-title-copy">
        <p class="eyebrow">SYSTEM CATALOG · REPOSITORY / FILE MANAGER</p>
        <h2>Library Blok Layout & Menu</h2>
        <p class="library-intro">Katalog terpusat untuk pola UI, menu, repository, serta jalur file. Item nyata berasal dari metadata snapshot/indeks; entri virtual ditandai sebagai pola katalog, bukan fitur backend siap pakai.</p>
      </div>
      <div class="library-stats">
        <div class="library-stat"><strong id="libraryTotal">—</strong><small>Item katalog</small></div>
        <div class="library-stat"><strong id="libraryCount">—</strong><small>Hasil filter</small></div>
        <div class="library-stat"><strong id="libraryFiles">—</strong><small>File indeks</small></div>
        <div class="library-stat"><strong id="libraryRepos">—</strong><small>Repositori</small></div>
      </div>
    </div>
    <div class="library-tools">
      <label class="library-search"><span aria-hidden="true">⌕</span><input id="librarySearch" type="search" placeholder="Cari ID, menu, fungsi, repo, atau path…" aria-label="Cari katalog" /></label>
      <select id="libraryCategory" aria-label="Filter kategori"></select>
      <select id="libraryPageSize" aria-label="Jumlah item per halaman"><option value="24">24 item / halaman</option><option value="48">48 item / halaman</option><option value="96">96 item / halaman</option></select>
      <button id="libraryRefresh" type="button">Sinkronkan katalog ↻</button>
    </div>
    <div class="library-summary" id="librarySummary" role="status" aria-live="polite"></div>
    <div class="library-body">
      <div class="library-grid" id="libraryGrid"></div>
      <aside class="library-inspector" id="libraryInspector" aria-live="polite"><p class="eyebrow">ITEM DETAIL</p><h3>Pilih item katalog</h3><p>Detail fungsi, ID, jenis sumber, dan jalur terkait akan tampil di sini.</p></aside>
    </div>
    <div class="library-foot"><button id="libraryPrev" type="button">← Sebelumnya</button><span id="libraryPage" aria-live="polite"></span><button id="libraryNext" type="button">Berikutnya →</button></div>
  `;

  const $search = $('#librarySearch', root), $category = $('#libraryCategory', root);
  $category.innerHTML = categoryNames.map(c => '<option value="' + safe(c) + '">' + safe(c) + '</option>').join('');

  function getEntries() {
    const files = actualFileEntries();
    return [...navEntries, ...layoutEntries, ...systemMenus, ...repoEntries(), ...(files.length ? files : fallbackFileEntries())];
  }
  function entryType(x) {
    if (x.source === 'layout-library') return 'Blok layout';
    if (x.source === 'virtual-catalog') return 'Menu sistem';
    if (x.category === 'Repositori') return 'Repositori';
    if (x.category === 'File Manager') return 'File Manager';
    return 'Navigasi';
  }
  function visibleEntries() {
    const q = query.toLocaleLowerCase();
    return getEntries().filter(x => {
      const type = entryType(x);
      const catMatch = category === 'Semua' || category === type || category === x.category;
      return catMatch && (!q || [x.id,x.name,x.description,x.category,x.details,x.path,x.source].join(' ').toLocaleLowerCase().includes(q));
    });
  }
  function renderInspector(item) {
    const box = $('#libraryInspector', root);
    if (!item) { box.innerHTML = '<p class="eyebrow">ITEM DETAIL</p><h3>Pilih item katalog</h3><p>Detail fungsi, ID, jenis sumber, dan jalur terkait akan tampil di sini.</p>'; return; }
    box.innerHTML = '<p class="eyebrow">DETAIL / ' + safe(item.id) + '</p><h3>' + safe(item.name) + '</h3>' +
      '<p>' + safe(item.description) + '</p><dl class="library-detail-list">' +
      '<div><dt>Kategori</dt><dd>' + safe(item.category) + '</dd></div>' +
      '<div><dt>Fungsi</dt><dd>' + safe(item.details || item.description) + '</dd></div>' +
      '<div><dt>Sumber</dt><dd>' + safe(item.source) + (item.real ? ' · nyata/indeks' : ' · katalog virtual') + '</dd></div>' +
      '<div><dt>Jalur</dt><dd><code>' + safe(item.path) + '</code></dd></div></dl>' +
      '<button type="button" id="libraryOpenSelected">Buka jalur terkait ↗</button>' +
      '<button type="button" id="libraryCopySelected">Salin path</button>';
    $('#libraryOpenSelected', box).addEventListener('click', () => openItem(item));
    $('#libraryCopySelected', box).addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(item.path); toast('Path disalin', item.path); }
      catch { const t=document.createElement('textarea'); t.value=item.path; box.append(t); t.select(); document.execCommand('copy'); t.remove(); }
    });
  }
  function openItem(item) {
    if (item.repoFullName) {
      const name = item.repoFullName.split('/').pop();
      location.hash = 'fileManager/' + encodePath(name);
      window.PBFileManager?.setPath?.(name);
    } else if (item.repoPath) {
      location.hash = 'fileManager/' + encodePath(item.repoPath);
      window.PBFileManager?.setPath?.(item.repoPath);
    } else if (item.route && window.PBSystemNavigation?.navigate) {
      window.PBSystemNavigation.navigate(item.route);
    } else {
      const path = String(item.path || '#overview');
      if (path.startsWith('#fileManager/')) {
        const folder = decodeRoutePath(path.slice('#fileManager/'.length));
        window.PBSystemNavigation?.navigate?.('file-manager');
        location.hash = 'fileManager/' + encodePath(folder);
        window.PBFileManager?.setPath?.(folder);
      } else {
        location.hash = path.replace(/^#/, '');
      }
    }
    const alert = $('#librarySummary', root);
    alert.textContent = 'Dipilih ' + item.id + ' · ' + item.path + ' · ' + (item.real ? 'sumber indeks nyata' : 'katalog virtual');
  }
  function render() {
    const all = visibleEntries();
    const maxPage = Math.max(0, Math.ceil(all.length / pageSize) - 1);
    page = Math.min(page, maxPage);
    const slice = all.slice(page * pageSize, (page + 1) * pageSize);
    $('#libraryTotal', root).textContent = getEntries().length.toLocaleString('id-ID');
    $('#libraryCount', root).textContent = all.length.toLocaleString('id-ID');
    $('#libraryFiles', root).textContent = actualFileEntries().length.toLocaleString('id-ID');
    $('#libraryRepos', root).textContent = repoEntries().length.toLocaleString('id-ID');
    $('#librarySummary', root).textContent = 'Menampilkan ' + slice.length.toLocaleString('id-ID') + ' dari ' + all.length.toLocaleString('id-ID') + ' item · 600 blok UI · 2.400 menu virtual + rute & indeks repositori.';
    $('#libraryGrid', root).innerHTML = slice.map(item => '<article class="library-card' + (selected?.id === item.id ? ' is-selected' : '') + '">' +
      '<small>' + safe(item.id) + ' · ' + safe(item.category) + '</small><strong>' + safe(item.name) + '</strong>' +
      '<p>' + safe(item.description) + '</p><small class="library-source">' + safe(item.source) + (item.real ? ' · indeks nyata' : ' · pola katalog') + '</small>' +
      '<div class="library-card-actions"><button type="button" data-detail-id="' + safe(item.id) + '">Detail</button><button type="button" data-open-id="' + safe(item.id) + '">Telusuri ↗</button></div></article>').join('') ||
      '<div class="library-empty">Tidak ada item yang cocok. Ubah kata pencarian atau kategori.</div>';
    $('#libraryPage', root).textContent = 'Halaman ' + (page + 1) + ' dari ' + (maxPage + 1);
    $('#libraryPrev', root).disabled = page === 0;
    $('#libraryNext', root).disabled = page >= maxPage;
  }
  $('#libraryGrid', root).addEventListener('click', event => {
    const detailButton = event.target.closest('[data-detail-id]');
    const openButton = event.target.closest('[data-open-id]');
    if (!detailButton && !openButton) return;
    const id = (detailButton || openButton).dataset.detailId || (detailButton || openButton).dataset.openId;
    const item = getEntries().find(x => x.id === id);
    if (!item) return;
    selected = item;
    if (detailButton) renderInspector(item); else openItem(item);
    render();
  });
  $search.addEventListener('input', e => { query=e.target.value; page=0; selected=null; renderInspector(null); render(); });
  $category.addEventListener('change', e => { category=e.target.value; page=0; render(); });
  $('#libraryPageSize', root).addEventListener('change', e => { pageSize=Number(e.target.value); page=0; render(); });
  $('#libraryPrev', root).addEventListener('click', () => { page=Math.max(0,page-1); render(); });
  $('#libraryNext', root).addEventListener('click', () => { page++; render(); });
  $('#libraryRefresh', root).addEventListener('click', () => { selected=null; renderInspector(null); render(); });
  window.addEventListener('planetbintang:snapshot-state', () => render());
  window.addEventListener('planetbintang:repository-index-ready', () => render());
  window.addEventListener('planetbintang:file-index-ready', () => render());
  render();
})();