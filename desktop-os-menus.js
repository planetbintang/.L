(() => {
  'use strict';
  const TOTAL = 15000, PAGE_SIZE = 50, STORE_KEY = 'pb.desktop-os-menu-state.v1';
  const categories = [
    ['Sistem & perangkat','Pengaturan sistem','Perangkat, proses, sumber daya, dan informasi perangkat'],
    ['File & penyimpanan','Manajer berkas','Berkas, folder, pencarian, metadata, dan penyimpanan lokal'],
    ['Jaringan & internet','Koneksi jaringan','Jaringan, koneksi, DNS, host, dan status konektivitas'],
    ['Aplikasi & utilitas','Pusat aplikasi','Aplikasi, utilitas, pembuka, dan preferensi'],
    ['Keamanan & akses','Pusat keamanan','Privasi, izin, sesi, dan pemeriksaan keamanan lokal'],
    ['Pengembangan','Ruang kerja kode','Repositori, editor lokal, proyek, build, dan dokumentasi'],
    ['Data & analitik','Pusat data','Dataset, tabel, laporan, grafik, dan ekspor'],
    ['Media & kreativitas','Pusat media','Gambar, audio, video, koleksi, dan pratinjau'],
    ['Produktivitas','Ruang kerja produktivitas','Catatan, tugas, kalender, papan kerja, dan aktivitas'],
    ['Administrasi','Pusat administrasi','Log, konfigurasi, pemantauan, kebijakan, dan audit'],
    ['Aksesibilitas','Pusat aksesibilitas','Tampilan, navigasi, input, pembaca, dan preferensi akses'],
    ['Bantuan & pemulihan','Bantuan sistem','Panduan, diagnostik, pemulihan, dan informasi sistem']
  ];
  const nouns = ['Ringkasan','Pengelola','Penampil','Pencarian','Konfigurasi','Riwayat','Monitor','Diagnostik','Impor','Ekspor','Pustaka','Pusat kontrol','Pemeriksa','Penyusun','Sinkronisasi','Jadwal','Pemberitahuan','Pintasan','Preferensi','Laporan','Indeks','Antrean','Status','Koleksi','Arsip','Pemulihan','Validasi','Integrasi','Panel','Konsol'];
  const actions = ['buka','lihat','cari','atur','pantau','periksa','kelola','susun','impor','ekspor'];
  const modes = ['siap','lokal','pratinjau','perlu koneksi','baca saja'];
  const saved = readState();
  function readState() {
    try { const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; }
    catch (_) { return {}; }
  }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); setSaveStatus('Tersimpan otomatis di perangkat ini'); }
    catch (_) { setSaveStatus('Penyimpanan browser penuh atau tidak tersedia'); }
  }
  function setSaveStatus(message) { const el = document.getElementById('pbOsSaveStatus'); if (el) el.textContent = message; }
  function esc(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  const categorySlugs = ['sistem-perangkat','file-penyimpanan','jaringan-internet','aplikasi-utilitas','keamanan-akses','pengembangan','data-analitik','media-kreativitas','produktivitas','administrasi','aksesibilitas','bantuan-pemulihan'];
  const parentRoutes = ['#overview','#fileManager','#hosts','#workspace/projects','#workspace/account','#workspace/code','#workspace/analytics','#workspace/features','#workspace/projects','#workspace/help','#workspace/account','#workspace/help'];
  function menuAt(index) {
    const safeIndex = Math.max(0, Math.min(TOTAL - 1, Number(index) || 0));
    const categoryIndex = safeIndex % categories.length;
    const category = categories[categoryIndex];
    const noun = nouns[Math.floor(safeIndex / categories.length) % nouns.length];
    const variant = Math.floor(safeIndex / (categories.length * nouns.length));
    const title = noun + ' ' + category[0] + (variant ? ' ' + String(variant + 1).padStart(3, '0') : '');
    const number = String(safeIndex + 1).padStart(5, '0');
    const filePath = './system-menus/' + categorySlugs[categoryIndex] + '/menu-' + number + '/index.html';
    return {
      id: 'pbos-' + number, index: safeIndex + 1,
      category: category[0], categorySlug: categorySlugs[categoryIndex], display: title,
      systemFunction: category[1] + ': ' + noun.toLowerCase(),
      integration: safeIndex % 4 === 0 ? 'Registry sistem + tautan sumber' : safeIndex % 4 === 1 ? 'File Manager + data lokal' : safeIndex % 4 === 2 ? 'Navigasi situs + modul terkait' : 'Workspace + aktivitas lokal',
      data: category[2], autoSave: true, activityMode: modes[safeIndex % modes.length],
      route: safeIndex === 0 ? '#overview' : safeIndex === 1 ? '#fileManager' : safeIndex === 2 ? '#cari' : '',
      parentRoute: parentRoutes[categoryIndex], filePath,
      folderPath: filePath.replace(/index\\.html$/, ''), fileCount: 1,
      filesystemState: 'file statis terdaftar'
    };
  }
  function allMatches(query, category) {
    const q = query.trim().toLocaleLowerCase('id');
    const result = [];
    for (let i = 0; i < TOTAL; i++) {
      const item = menuAt(i);
      if (category && item.category !== category) continue;
      if (q && ![item.id, item.display, item.category, item.systemFunction, item.integration, item.data].some(v => v.toLocaleLowerCase('id').includes(q))) continue;
      result.push(item);
    }
    return result;
  }
  function activity(item, action) {
    saved.activity = Array.isArray(saved.activity) ? saved.activity : [];
    saved.activity.unshift({ id:item.id, display:item.display, action, at:new Date().toISOString() });
    saved.activity = saved.activity.slice(0, 100);
    saved.lastMenu = item.id;
    persist();
  }
  function render() {
    const root = document.getElementById('pbDesktopOS');
    if (!root) return;
    root.innerHTML = `
      <section class="pb-os-launcher" aria-label="Katalog menu desktop OS">
        <header class="pb-os-header"><div><span class="pb-os-eyebrow">PLANETBINTANG · WEBSITE MODE</span><h2>Desktop OS Menu Center</h2><p>15.000 menu sistem dengan registri, integrasi, data, penyimpanan otomatis, dan mode aktivitas.</p></div><button type="button" id="pbOsClose" class="pb-os-quiet">Tutup</button></header>
        <div class="pb-os-stats"><span><b>15.000</b> menu terdaftar</span><span><b id="pbOsShown">50</b> hasil ditampilkan</span><span id="pbOsSaveStatus">Penyimpanan lokal siap</span></div>
        <div class="pb-os-controls"><label class="pb-os-search">Cari menu<input id="pbOsSearch" type="search" placeholder="Nama, fungsi, integrasi, data…" autocomplete="off"></label><label>Kategori<select id="pbOsCategory"><option value="">Semua kategori</option>${categories.map(c=>`<option>${esc(c[0])}</option>`).join('')}</select></label><label>Urutan<select id="pbOsSort"><option value="default">Urutan registri</option><option value="name">Nama A–Z</option><option value="saved">Menu tersimpan dahulu</option></select></label></div>
        <div class="pb-os-layout"><nav class="pb-os-list" id="pbOsList" aria-label="Daftar menu"></nav><aside class="pb-os-detail" id="pbOsDetail" aria-live="polite"><p>Pilih menu untuk melihat tampilan, fungsi sistem, integrasi, data, simpan otomatis, dan mode aktivitas.</p></aside></div>
        <footer class="pb-os-footer"><button type="button" id="pbOsPrev">Sebelumnya</button><span id="pbOsPage">Halaman 1</span><button type="button" id="pbOsNext">Berikutnya</button><button type="button" id="pbOsActivity">Aktivitas tersimpan</button><button type="button" id="pbOsExport">Ekspor data menu</button></footer>
        <p class="pb-os-note">Menu katalog dibuat dari template terstruktur agar 15.000 entri dapat dicari tanpa memasukkan 15.000 elemen sekaligus ke halaman. Fungsi yang memerlukan server, perangkat OS, DNS, atau layanan eksternal ditampilkan sebagai modul/tautan; situs statis tidak menjalankan proses sistem operasi.</p>
      </section>`;
    let page = 0, results = [], current = null;
    const list = root.querySelector('#pbOsList'), detail = root.querySelector('#pbOsDetail');
    const search = root.querySelector('#pbOsSearch'), category = root.querySelector('#pbOsCategory'), sort = root.querySelector('#pbOsSort');
    function showDetail(item) {
      current = item; activity(item, 'dibuka');
      const isFavorite = (saved.favorites || []).includes(item.id);
      const isPinned = (saved.pinned || []).includes(item.id);
      detail.innerHTML = `<div class="pb-os-detail-top"><span>${esc(item.id)}</span><span>${esc(item.category)}</span></div><h3>${esc(item.display)}</h3><dl><dt>Tampilan</dt><dd>Panel situs responsif / website mode</dd><dt>Fungsi sistem</dt><dd>${esc(item.systemFunction)}</dd><dt>Integrasi menu</dt><dd>${esc(item.integration)}</dd><dt>Data</dt><dd>${esc(item.data)}</dd><dt>Menu induk</dt><dd><a href="${esc(item.parentRoute)}">Buka sistem menu induk</a></dd><dt>Filesystem situs</dt><dd><code>${esc(item.folderPath)}</code> · ${item.fileCount} file</dd><dt>Data otomatis tersimpan</dt><dd><b>${item.autoSave ? 'Aktif — localStorage browser' : 'Nonaktif'}</b></dd><dt>Mode aktivitas</dt><dd>${esc(item.activityMode)}</dd></dl><div class="pb-os-detail-actions"><button type="button" id="pbOsOpen">${'Buka file menu'}</button><button type="button" id="pbOsFavorite">${isFavorite ? '★ Favorit' : '☆ Jadikan favorit'}</button><button type="button" id="pbOsPin">${isPinned ? 'Lepas pin' : 'Sematkan menu'}</button></div><p class="pb-os-small">Status integrasi menunjukkan rute atau subsistem yang terkait, bukan jaminan bahwa layanan server eksternal sedang aktif.</p>`;
      detail.querySelector('#pbOsOpen').addEventListener('click', () => {
        activity(item, 'file menu dibuka');
        location.href = item.filePath;
      });
      detail.querySelector('#pbOsFavorite').addEventListener('click', () => {
        saved.favorites = Array.isArray(saved.favorites) ? saved.favorites : [];
        saved.favorites = isFavorite ? saved.favorites.filter(id => id !== item.id) : [...new Set([...saved.favorites,item.id])];
        persist(); showDetailWithoutActivity(item); renderList();
      });
      detail.querySelector('#pbOsPin').addEventListener('click', () => {
        saved.pinned = Array.isArray(saved.pinned) ? saved.pinned : [];
        saved.pinned = isPinned ? saved.pinned.filter(id => id !== item.id) : [...new Set([...saved.pinned,item.id])];
        persist(); showDetailWithoutActivity(item); renderList();
      });
    }
    function showDetailWithoutActivity(item) {
      const previous = saved.activity; showDetailMarkupOnly(item); saved.activity = previous;
    }
    function showDetailMarkupOnly(item) {
      current = item;
      const favorite = (saved.favorites || []).includes(item.id), pinned = (saved.pinned || []).includes(item.id);
      detail.innerHTML = `<div class="pb-os-detail-top"><span>${esc(item.id)}</span><span>${esc(item.category)}</span></div><h3>${esc(item.display)}</h3><dl><dt>Tampilan</dt><dd>Panel situs responsif / website mode</dd><dt>Fungsi sistem</dt><dd>${esc(item.systemFunction)}</dd><dt>Integrasi menu</dt><dd>${esc(item.integration)}</dd><dt>Data</dt><dd>${esc(item.data)}</dd><dt>Menu induk</dt><dd><a href="${esc(item.parentRoute)}">Buka sistem menu induk</a></dd><dt>Filesystem situs</dt><dd><code>${esc(item.folderPath)}</code> · ${item.fileCount} file</dd><dt>Data otomatis tersimpan</dt><dd>Aktif — localStorage browser</dd><dt>Mode aktivitas</dt><dd>${esc(item.activityMode)}</dd></dl><div class="pb-os-detail-actions"><button type="button" id="pbOsOpen">Buka tampilan menu</button><button type="button" id="pbOsFavorite">${favorite ? '★ Favorit' : '☆ Jadikan favorit'}</button><button type="button" id="pbOsPin">${pinned ? 'Lepas pin' : 'Sematkan menu'}</button></div><p class="pb-os-small">Status integrasi menunjukkan rute atau subsistem yang terkait, bukan jaminan bahwa layanan server eksternal sedang aktif.</p>`;
      detail.querySelector('#pbOsOpen').addEventListener('click', () => { activity(item,'tampilan dibuka'); detail.querySelector('.pb-os-small').textContent = 'Panel menu aktif.'; });
      detail.querySelector('#pbOsFavorite').addEventListener('click', () => { saved.favorites = Array.isArray(saved.favorites)?saved.favorites:[]; saved.favorites = favorite ? saved.favorites.filter(id=>id!==item.id) : [...new Set([...saved.favorites,item.id])]; persist(); showDetailWithoutActivity(item); renderList(); });
      detail.querySelector('#pbOsPin').addEventListener('click', () => { saved.pinned = Array.isArray(saved.pinned)?saved.pinned:[]; saved.pinned = pinned ? saved.pinned.filter(id=>id!==item.id) : [...new Set([...saved.pinned,item.id])]; persist(); showDetailWithoutActivity(item); renderList(); });
    }
    function renderList() {
      results = allMatches(search.value, category.value);
      if (sort.value === 'name') results.sort((a,b)=>a.display.localeCompare(b.display,'id'));
      if (sort.value === 'saved') results.sort((a,b)=>Number((saved.favorites||[]).includes(b.id))-Number((saved.favorites||[]).includes(a.id)));
      const maxPage = Math.max(0, Math.ceil(results.length/PAGE_SIZE)-1); page = Math.min(page,maxPage);
      const chunk = results.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
      root.querySelector('#pbOsShown').textContent = chunk.length + ' / ' + results.length;
      root.querySelector('#pbOsPage').textContent = 'Halaman ' + (page+1) + ' dari ' + Math.max(1,maxPage+1);
      root.querySelector('#pbOsPrev').disabled = page===0; root.querySelector('#pbOsNext').disabled = page>=maxPage;
      list.innerHTML = chunk.length ? chunk.map(item=>`<button type="button" class="pb-os-item ${item.id===current?.id?'is-active':''}" data-os-id="${item.id}"><span class="pb-os-item-id">${item.id}</span><b>${esc(item.display)}</b><small>${esc(item.category)} · ${(saved.favorites||[]).includes(item.id)?'★ favorit':'menu sistem'}</small></button>`).join('') : '<p>Tidak ada menu yang cocok.</p>';
      list.querySelectorAll('[data-os-id]').forEach(button=>button.addEventListener('click',()=>{ const item=menuAt(Number(button.dataset.osId.slice(5))-1); showDetail(item); renderList(); }));
    }
    search.addEventListener('input',()=>{page=0;renderList();});
    category.addEventListener('change',()=>{page=0;renderList();});
    sort.addEventListener('change',()=>{page=0;renderList();});
    root.querySelector('#pbOsPrev').addEventListener('click',()=>{page=Math.max(0,page-1);renderList();});
    root.querySelector('#pbOsNext').addEventListener('click',()=>{page++;renderList();});
    root.querySelector('#pbOsClose').addEventListener('click',()=>{root.hidden=true;});
    root.querySelector('#pbOsActivity').addEventListener('click',()=>{
      const entries=Array.isArray(saved.activity)?saved.activity:[];
      detail.innerHTML='<h3>Aktivitas tersimpan</h3>'+(entries.length?'<ol class="pb-os-activity">'+entries.map(entry=>'<li><b>'+esc(entry.display)+'</b><span>'+esc(entry.action)+' · '+esc(new Date(entry.at).toLocaleString())+'</span></li>').join('')+'</ol>':'<p>Belum ada aktivitas menu.</p>');
    });
    root.querySelector('#pbOsExport').addEventListener('click',()=>{
      const payload={schemaVersion:1,totalMenus:TOTAL,generatedAt:new Date().toISOString(),favorites:saved.favorites||[],pinned:saved.pinned||[],activity:saved.activity||[],menuTemplate:'12 kategori x 30 jenis x 42 varian + katalog berurutan'};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='planetbintang-desktop-os-menu-data.json';a.click();URL.revokeObjectURL(url);setSaveStatus('Data menu diekspor');
    });
    renderList();
  }
  function mount() {
    if (document.getElementById('pbDesktopOS')) return;
    const root=document.createElement('div');root.id='pbDesktopOS';root.hidden=true;
    const launcher=document.createElement('button');launcher.type='button';launcher.id='pbOsLauncher';launcher.className='pb-os-launcher-button';launcher.textContent='☷ Menu OS · 15.000';launcher.setAttribute('aria-controls','pbDesktopOS');launcher.setAttribute('aria-expanded','false');
    launcher.addEventListener('click',()=>{root.hidden=!root.hidden;launcher.setAttribute('aria-expanded',String(!root.hidden));if(!root.dataset.ready){render();root.dataset.ready='true';}if(!root.hidden)root.querySelector('#pbOsSearch')?.focus();});
    document.body.append(launcher,root);
    document.addEventListener('click',event=>{const trigger=event.target.closest('[data-open-desktop-os]');if(!trigger)return;event.preventDefault();if(root.hidden){root.hidden=false;launcher.setAttribute('aria-expanded','true');if(!root.dataset.ready){render();root.dataset.ready='true';}}root.querySelector('#pbOsSearch')?.focus();});
    window.addEventListener('hashchange',()=>{if(!root.hidden&&location.hash) {root.hidden=true;launcher.setAttribute('aria-expanded','false');}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.PBDesktopOSMenus=Object.freeze({total:TOTAL,get:menuAt,search:(query='',category='')=>allMatches(query,category).slice(0,200),listCategory:(category)=>allMatches('',category),categorySlugs:Object.freeze(categorySlugs.slice()),categories:Object.freeze(categories.map((c,i)=>({name:c[0],slug:categorySlugs[i],parentRoute:parentRoutes[i]})),open:()=>{const b=document.getElementById('pbOsLauncher');if(b)b.click();},version:2});
})();