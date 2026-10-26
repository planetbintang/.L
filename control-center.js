(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pages = {
    'repository-hub': {title:'Repository Hub', eyebrow:'CODE / REPOSITORY INTELLIGENCE', description:'Pusat lintas repositori yang menyatukan katalog, status snapshot, pintasan file, dan tautan sumber GitHub.', cards:[
      ['Katalog repositori','Buka daftar repo yang telah dipublikasikan pada snapshot.', '#repositories','Lihat repositori'],
      ['File Manager','Telusuri struktur folder, metadata, SHA, dan path snapshot.', '#fileManager','Buka File Manager'],
      ['Enterprise registry','Jelajahi katalog menu dan domain sistem yang sudah ada.', '#enterprise/map','Buka registry'],
      ['GitHub source','Buka repository sumber di GitHub untuk commit dan review resmi.', 'https://github.com/planetbintang/.L','Buka GitHub']
    ]},
    'media-center': {title:'Media & Document Center', eyebrow:'MEDIA / DOCUMENT WORKSPACE', description:'Pilih media besar secara lokal untuk memeriksa metadata dan mengelola daftar kerja. File tidak otomatis diunggah atau dikirim ke server.', cards:[
      ['Pilih berkas lokal','Pilih gambar, video, film, PDF, atau dokumen untuk melihat nama, tipe, dan ukuran.', '#media-picker','Pilih berkas'],
      ['Telusuri filesystem','Gunakan File Manager untuk menelusuri file yang tersedia dalam indeks snapshot.', '#fileManager/media','Buka File Manager'],
      ['Format yang didukung','Gambar, audio/video, PDF, teks, dan dokumen umum; preview mengikuti dukungan browser.', '#media-formats','Lihat format'],
      ['Penyimpanan lokal','Daftar berkas sesi hanya tersimpan di halaman ini dan tidak mengubah repositori.', '#media-local','Tentang privasi']
    ]},
    'system-integration': {title:'System Integration', eyebrow:'CONNECTORS / INTEGRATION MAP', description:'Peta integrasi untuk sumber kode, snapshot, workspace, File Manager, Air Cloud, dan Enterprise registry. Konektor eksternal ditampilkan sebagai pintasan sampai API terautentikasi disediakan.', cards:[
      ['GitHub repository','Repositori, branch, file, dan pull request dikelola melalui GitHub.', 'https://github.com/planetbintang/.L','Buka GitHub'],
      ['Snapshot Hub','Lihat status data yang telah dipublikasikan; refresh tidak memicu workflow server.', '#hub','Buka Snapshot Hub'],
      ['Air Cloud','Buka konsol layanan dan registry menu hierarkis.', '#aircloud','Buka Air Cloud'],
      ['Enterprise map','Katalog arsitektur dan submenu enterprise.', '#enterprise/map','Buka Enterprise']
    ]},
    'sync-deploy': {title:'Sync & Deployment Center', eyebrow:'DELIVERY / RELEASE CONTROL', description:'Pemeriksaan konsistensi sisi browser dan checklist publikasi. Dashboard statis tidak dapat menjalankan workflow GitHub atau menulis branch tanpa backend/token yang aman.', cards:[
      ['Status snapshot','Memeriksa apakah snapshot tersedia pada sesi ini.', '#sync-status','Periksa status'],
      ['GitHub Actions','Buka workflow repository untuk menjalankan atau memantau pipeline dengan izin GitHub.', 'https://github.com/planetbintang/.L/actions','Buka Actions'],
      ['GitHub Pages','Buka pengaturan deployment situs; publikasi tetap dikendalikan GitHub.', 'https://github.com/planetbintang/.L/deployments','Lihat deployments'],
      ['Checklist rilis','Validasi link aset, menu, route, privasi, dan perubahan sebelum merge.', '#release-checklist','Buka checklist']
    ]},
    'insights-growth': {title:'Insights & Growth', eyebrow:'ANALYTICS / PRODUCT GROWTH', description:'Ringkasan berbasis metadata snapshot dan catatan lokal untuk mengarahkan prioritas pengembangan tanpa mengarang metrik pengunjung.', cards:[
      ['Ringkasan repositori','Hitung jumlah repositori yang tersedia pada snapshot saat ini.', '#insight-repos','Lihat ringkasan'],
      ['Catatan prioritas','Simpan ide dan pekerjaan berikutnya pada browser ini.', '#insight-notes','Catatan lokal'],
      ['Katalog fitur','Jelajahi Feature Registry yang sudah terhubung ke sistem.', '#workspace/features','Buka Feature Registry'],
      ['Daftar domain','Lihat domain dan host yang terpetakan dari snapshot.', '#hosts','Buka peta domain']
    ]}
  };
  let selectedFiles = [];
  function currentKey() {
    const hash = location.hash.replace(/^#/, '');
    return hash.startsWith('control/') ? hash.slice(8).split('/')[0] : 'repository-hub';
  }
  function linkFor(href) {
    if (href.startsWith('#')) return href;
    return href;
  }
  function cardHtml(card, i) {
    const [title, desc, href, action] = card;
    return '<article class="control-card"><span class="control-card-index">'+String(i+1).padStart(2,'0')+'</span><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p><a href="'+esc(linkFor(href))+'" '+(href.startsWith('http')?'target="_blank" rel="noopener noreferrer"':'')+'>'+esc(action)+' <span aria-hidden="true">↗</span></a></article>';
  }
  function render(routeName) {
    const key = routeName?.startsWith('control-') ? routeName.slice(8) : currentKey();
    const page = pages[key] || pages['repository-hub'];
    const root = $('#controlCenterContent');
    if (!root) return;
    const snapshot = window.PBSystemSnapshot?.data;
    const repos = snapshot?.repositories || [];
    const updated = snapshot?.updatedAt ? new Date(snapshot.updatedAt).toLocaleString('id-ID') : 'Belum tersedia';
    const count = repos.length || snapshot?.repositoryCount || 0;
    root.innerHTML = '<div class="control-shell"><header class="control-hero"><div><p class="eyebrow">PLANETBINTANG <span>/</span> '+esc(page.eyebrow)+'</p><h1>'+esc(page.title)+'</h1><p>'+esc(page.description)+'</p></div><span class="control-status"><i></i>'+ (snapshot ? 'SNAPSHOT TERSEDIA' : 'MENUNGGU SNAPSHOT')+'</span></header>'+
      '<nav class="control-tabs" aria-label="Pusat kontrol"><a href="#control/repository-hub" '+(key==='repository-hub'?'aria-current="page"':'')+'>Repository Hub</a><a href="#control/media-center" '+(key==='media-center'?'aria-current="page"':'')+'>Media & Dokumen</a><a href="#control/system-integration" '+(key==='system-integration'?'aria-current="page"':'')+'>Integrasi</a><a href="#control/sync-deploy" '+(key==='sync-deploy'?'aria-current="page"':'')+'>Sync & Deploy</a><a href="#control/insights-growth" '+(key==='insights-growth'?'aria-current="page"':'')+'>Insights & Growth</a></nav>'+
      '<section class="control-kpis"><article><small>REPO PADA SNAPSHOT</small><b>'+esc(count)+'</b><span>Metadata tersedia</span></article><article><small>PEMBARUAN SNAPSHOT</small><b class="control-kpi-date">'+esc(updated)+'</b><span>Waktu dari sumber snapshot</span></article><article><small>MODE OPERASI</small><b>TERKONTROL</b><span>Tidak mengeksekusi kode repo</span></article></section>'+
      '<div class="control-card-grid">'+page.cards.map(cardHtml).join('')+'</div>'+
      (key==='media-center'?mediaPanel(): '')+
      (key==='sync-deploy'?releasePanel(): '')+
      (key==='insights-growth'?insightsPanel(count,updated): '')+
      (key==='system-integration'?integrationPanel(): '')+
      '<p class="control-footnote">Batas sinkronisasi: dashboard GitHub Pages bersifat statis. Operasi tulis/push otomatis memerlukan workflow GitHub Actions atau backend terautentikasi; token tidak boleh ditanam di JavaScript publik.</p></div>';
    wire(key);
  }
  function mediaPanel() {
    return '<section class="control-work-panel" id="media-picker"><div><p class="eyebrow">LOCAL MEDIA INTAKE</p><h2>Media & dokumen lokal</h2><p>Pilih satu atau beberapa berkas. Tidak ada unggahan otomatis.</p></div><label class="control-file-drop"> <span>＋ Pilih berkas dari perangkat</span><input id="controlMediaFiles" type="file" multiple accept="image/*,video/*,audio/*,.pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp" /></label><div id="controlMediaList" class="control-media-list"><p>Belum ada berkas dipilih.</p></div><div class="control-inline-note" id="media-formats">Berkas besar tidak dibaca penuh; daftar ini menampilkan metadata dasar agar tidak membebani memori browser.</div></section>';
  }
  function releasePanel() {
    return '<section class="control-work-panel" id="release-checklist"><p class="eyebrow">PRE-RELEASE CHECKLIST</p><h2>Checklist sebelum rilis</h2><div class="control-checklist">'+[
      'Periksa tautan navigasi dan deep link menu baru.',
      'Pastikan stylesheet dan JavaScript menggunakan path relatif untuk GitHub Pages.',
      'Uji tampilan desktop, tablet, dan layar kecil.',
      'Pastikan tidak ada token, kredensial, atau data privat dalam file statis.',
      'Jalankan pemeriksaan GitHub Actions dan tinjau diff sebelum merge.'
    ].map((v,i)=>'<label><input type="checkbox" data-release-check="'+i+'"><span>'+esc(v)+'</span></label>').join('')+'</div><p id="controlReleaseStatus" aria-live="polite">0 dari 5 langkah ditandai.</p><button class="control-action" id="controlExportChecklist" type="button">Ekspor checklist JSON</button></section>';
  }
  function insightsPanel(count, updated) {
    return '<section class="control-work-panel" id="insight-notes"><p class="eyebrow">LOCAL PRODUCT NOTES</p><h2>Catatan prioritas pengembangan</h2><p>Catatan disimpan pada localStorage browser ini saja.</p><textarea id="controlGrowthNotes" rows="5" placeholder="Contoh: uji menu baru, perbaiki dokumentasi, audit aksesibilitas…"></textarea><div class="control-action-row"><button class="control-action" id="controlSaveNotes" type="button">Simpan catatan</button><button class="control-action secondary" id="controlExportInsights" type="button">Ekspor ringkasan JSON</button></div><p id="controlNotesStatus" aria-live="polite">Snapshot: '+esc(updated)+' · repositori: '+esc(count)+'</p></section>';
  }
  function integrationPanel() {
    return '<section class="control-work-panel"><p class="eyebrow">INTEGRATION SAFETY</p><h2>Status integrasi</h2><div class="control-integration-list"><p><b>Snapshot / data statis</b><span>Terbaca jika PBSystemSnapshot tersedia.</span></p><p><b>GitHub API / write</b><span>Memerlukan otorisasi server-side atau workflow; tidak memakai token di browser.</span></p><p><b>Air Cloud / Enterprise</b><span>UI dan registry lokal tersedia; provisioning cloud live tidak diklaim aktif.</span></p><p><b>File Manager</b><span>Telusur metadata snapshot dan penyimpanan draft lokal; push ke GitHub memerlukan konektor aman.</span></p></div></section>';
  }
  function wire(key) {
    const input = $('#controlMediaFiles');
    if (input) input.addEventListener('change', () => {
      selectedFiles = Array.from(input.files || []);
      const list = $('#controlMediaList');
      list.innerHTML = selectedFiles.length ? selectedFiles.map((f) => '<article><b>'+esc(f.name)+'</b><span>'+esc(f.type || 'tipe tidak diketahui')+'</span><small>'+esc(formatBytes(f.size))+' · lastModified '+esc(f.lastModified ? new Date(f.lastModified).toLocaleDateString('id-ID') : '—')+'</small></article>').join('') : '<p>Belum ada berkas dipilih.</p>';
    });
    if (key==='sync-deploy') {
      const boxes = [...document.querySelectorAll('[data-release-check]')];
      const update = () => { const n=boxes.filter(b=>b.checked).length; const el=$('#controlReleaseStatus'); if(el) el.textContent=n+' dari '+boxes.length+' langkah ditandai.'; };
      boxes.forEach(b=>b.addEventListener('change',update));
      $('#controlExportChecklist')?.addEventListener('click',()=>downloadJson('planetbintang-release-checklist.json',{createdAt:new Date().toISOString(),items:boxes.map(b=>({task:b.nextElementSibling?.textContent||'',checked:b.checked}))}));
    }
    if (key==='insights-growth') {
      const area=$('#controlGrowthNotes');
      try { area.value=localStorage.getItem('pb-control-growth-notes') || ''; } catch (_) {}
      $('#controlSaveNotes')?.addEventListener('click',()=>{try{localStorage.setItem('pb-control-growth-notes',area.value);$('#controlNotesStatus').textContent='Catatan tersimpan di browser ini.';}catch(_){$('#controlNotesStatus').textContent='Penyimpanan browser tidak tersedia.';}});
      $('#controlExportInsights')?.addEventListener('click',()=>downloadJson('planetbintang-insights.json',{generatedAt:new Date().toISOString(),repositoryCount:window.PBSystemSnapshot?.data?.repositories?.length || 0,updatedAt:window.PBSystemSnapshot?.data?.updatedAt || null,notes:area.value,source:'local snapshot; no visitor analytics'}));
    }
  }
  function formatBytes(n){if(!Number.isFinite(n))return 'ukuran tidak diketahui';if(n<1024)return n+' B';const units=['KB','MB','GB','TB'];let x=n/1024,i=0;while(x>=1024&&i<units.length-1){x/=1024;i++;}return x.toFixed(1)+' '+units[i];}
  function downloadJson(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function activateRoute(key, push = false) {
    const route = 'control-' + key;
    if (!pages[key]) return;
    if (push && location.hash !== '#control/' + key) history.pushState({ systemRoute: route }, '', '#control/' + key);
    document.body.dataset.systemRoute = route;
    document.querySelectorAll('[data-system-page]').forEach((node) => { node.hidden = node.dataset.systemPage !== 'control-center'; });
    render(route);
    document.dispatchEvent(new CustomEvent('planetbintang:route-change', {detail:{name:route,group:'control-center',menu:'control',changed:true}}));
    window.scrollTo({top:0,behavior:'smooth'});
  }
  document.querySelectorAll('a[href^="#control/"]').forEach((a) => a.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    activateRoute(a.getAttribute('href').slice('#control/'.length).split('/')[0], true);
  }));
  function syncDeepLink() {
    const hash = location.hash.replace(/^#control\//, '').split('/')[0];
    if (pages[hash]) activateRoute(hash, false);
  }
  window.addEventListener('hashchange', syncDeepLink);
  window.addEventListener('popstate', syncDeepLink);
  window.PBControlCenter={render,activateRoute};
  document.addEventListener('planetbintang:route-change',(e)=>{if(e.detail?.group==='control-center')render(e.detail.name);});
  document.addEventListener('planetbintang:snapshot-state',()=>{if(document.body.dataset.systemRoute?.startsWith('control-'))render(document.body.dataset.systemRoute);});
})();