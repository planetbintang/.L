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
    return '<section class="control-work-panel" id="media-picker"><div><p class="eyebrow">LOCAL MEDIA INTAKE</p><h2>Media & dokumen lokal</h2><p>Impor gambar, audio, video/film, PDF, dan dokumen ke penyimpanan browser. Berkas disimpan sebagai Blob di IndexedDB agar tidak perlu dibaca penuh ke memori; kapasitas tetap mengikuti kuota perangkat/browser.</p></div><label class="control-file-drop"><span>＋ Pilih berkas dari perangkat</span><input id="controlMediaFiles" type="file" multiple accept="image/*,video/*,audio/*,.pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.csv,.json,.zip" /></label><div id="controlMediaList" class="control-media-list"><p>Belum ada berkas dipilih.</p></div><div class="control-action-row"><button class="control-action" id="controlMediaSave" type="button">Simpan pilihan ke Media Library</button><button class="control-action secondary" id="controlMediaClear" type="button">Kosongkan pilihan</button></div><p id="controlMediaStatus" class="control-inline-note" aria-live="polite">Penyimpanan lokal aktif setelah berkas dipilih.</p><div class="control-inline-note" id="media-formats">Berkas besar tidak diubah menjadi Base64. Tidak ada unggahan otomatis ke GitHub atau layanan eksternal.</div></section><section class="control-work-panel" id="media-local"><p class="eyebrow">BROWSER STORAGE / INDEXEDDB</p><h2>Media Library lokal</h2><p>Pratinjau atau unduh file dari penyimpanan lokal, atau hapus salinan lokal yang tidak diperlukan.</p><div id="controlMediaLibrary" class="control-media-library"><p>Memuat Media Library…</p></div><div id="controlMediaPreview" class="control-media-preview" hidden></div></section>';
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
    if (input) {
      input.addEventListener('change', () => {
        selectedFiles = Array.from(input.files || []);
        const list = $('#controlMediaList');
        list.innerHTML = selectedFiles.length ? selectedFiles.map((f, i) => '<article><b>'+esc(f.name)+'</b><span>'+esc(f.type || 'tipe tidak diketahui')+'</span><small>'+esc(formatBytes(f.size))+' · '+esc(f.lastModified ? new Date(f.lastModified).toLocaleDateString('id-ID') : 'tanggal tidak diketahui')+'</small><small>Antrean '+(i+1)+' · belum disimpan</small></article>').join('') : '<p>Belum ada berkas dipilih.</p>';
        const status=$('#controlMediaStatus'); if(status) status.textContent=selectedFiles.length+' berkas dipilih. Tekan “Simpan pilihan ke Media Library” untuk menyimpan secara lokal.';
      });
      $('#controlMediaSave')?.addEventListener('click', async () => {
        if (!selectedFiles.length) { setMediaStatus('Pilih berkas terlebih dahulu.'); return; }
        const button=$('#controlMediaSave'); if(button) button.disabled=true;
        try {
          const db=await openMediaDb();
          for (const file of selectedFiles) {
            const record={id:mediaId(),name:file.name,type:file.type||'application/octet-stream',size:file.size,lastModified:file.lastModified||0,createdAt:new Date().toISOString(),blob:file};
            await mediaRequest(db,'readwrite',(store)=>store.put(record));
          }
          setMediaStatus(selectedFiles.length+' berkas disimpan di IndexedDB browser ini.');
          selectedFiles=[]; input.value=''; $('#controlMediaList').innerHTML='<p>Impor selesai. Pilih berkas lain jika diperlukan.</p>';
          await renderMediaLibrary();
        } catch (error) { setMediaStatus('Gagal menyimpan: '+(error?.name==='QuotaExceededError'?'kuota penyimpanan browser tidak cukup. Hapus item lokal atau gunakan media lebih kecil.':(error?.message||'penyimpanan tidak tersedia'))); }
        finally { if(button) button.disabled=false; }
      });
      $('#controlMediaClear')?.addEventListener('click',()=>{selectedFiles=[];input.value='';$('#controlMediaList').innerHTML='<p>Belum ada berkas dipilih.</p>';setMediaStatus('Pilihan dibersihkan; tidak ada berkas yang disimpan atau diunggah.');});
      renderMediaLibrary();
    }
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
  const MEDIA_DB_NAME='planetbintang-media-library';
  const MEDIA_STORE='assets';
  function mediaId(){return (globalThis.crypto?.randomUUID?.() || ('media-'+Date.now()+'-'+Math.random().toString(36).slice(2)));}
  function openMediaDb(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window)){reject(new Error('IndexedDB tidak didukung browser'));return;}const req=indexedDB.open(MEDIA_DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(MEDIA_STORE)){const store=db.createObjectStore(MEDIA_STORE,{keyPath:'id'});store.createIndex('createdAt','createdAt');}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Gagal membuka IndexedDB'));});}
  function mediaRequest(db,mode,operation){return new Promise((resolve,reject)=>{const tx=db.transaction(MEDIA_STORE,mode);const store=tx.objectStore(MEDIA_STORE);let result;try{result=operation(store);}catch(e){reject(e);return;}tx.oncomplete=()=>resolve(result?.result);tx.onerror=()=>reject(tx.error||result?.error||new Error('Transaksi IndexedDB gagal'));tx.onabort=()=>reject(tx.error||new Error('Transaksi dibatalkan'));});}
  function setMediaStatus(message){const el=$('#controlMediaStatus');if(el)el.textContent=message;}
  async function getMediaRecords(){const db=await openMediaDb();return await new Promise((resolve,reject)=>{const req=db.transaction(MEDIA_STORE,'readonly').objectStore(MEDIA_STORE).getAll();req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))));req.onerror=()=>reject(req.error||new Error('Gagal membaca Media Library'));});}
  async function renderMediaLibrary(){
    const target=$('#controlMediaLibrary');if(!target)return;
    try{const items=await getMediaRecords();if(!items.length){target.innerHTML='<p>Media Library masih kosong.</p>';return;}
      target.innerHTML=items.map(item=>'<article class="control-media-item"><div><b>'+esc(item.name)+'</b><span>'+esc(item.type)+' · '+esc(formatBytes(item.size))+'</span><small>Disimpan '+esc(item.createdAt||'waktu tidak tercatat')+'</small></div><div class="control-media-item-actions"><button class="control-action secondary" type="button" data-media-preview="'+esc(item.id)+'">Pratinjau</button><button class="control-action secondary" type="button" data-media-download="'+esc(item.id)+'">Unduh</button><button class="control-action danger" type="button" data-media-delete="'+esc(item.id)+'">Hapus</button></div></article>').join('');
      target.querySelectorAll('[data-media-preview]').forEach(b=>b.addEventListener('click',()=>showMediaPreview(b.dataset.mediaPreview)));
      target.querySelectorAll('[data-media-download]').forEach(b=>b.addEventListener('click',()=>downloadMedia(b.dataset.mediaDownload)));
      target.querySelectorAll('[data-media-delete]').forEach(b=>b.addEventListener('click',()=>deleteMedia(b.dataset.mediaDelete)));
    }catch(error){target.innerHTML='<p>Media Library tidak tersedia: '+esc(error.message||'IndexedDB gagal')+'.</p>';}
  }
  async function findMedia(id){const db=await openMediaDb();return await new Promise((resolve,reject)=>{const req=db.transaction(MEDIA_STORE,'readonly').objectStore(MEDIA_STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}
  async function showMediaPreview(id){
    const target=$('#controlMediaPreview');if(!target)return;
    try{const item=await findMedia(id);if(!item)return;const url=URL.createObjectURL(item.blob);target.hidden=false;target.dataset.objectUrl=url;
      let preview='<p><b>'+esc(item.name)+'</b> · '+esc(formatBytes(item.size))+'</p>';
      if(item.type.startsWith('image/'))preview+='<img alt="'+esc(item.name)+'" src="'+url+'">';
      else if(item.type.startsWith('video/'))preview+='<video controls preload="metadata" src="'+url+'"></video>';
      else if(item.type.startsWith('audio/'))preview+='<audio controls preload="metadata" src="'+url+'"></audio>';
      else if(item.type==='application/pdf')preview+='<iframe title="'+esc(item.name)+'" src="'+url+'"></iframe>';
      else preview+='<p>Pratinjau langsung tidak tersedia untuk tipe ini. Gunakan tombol Unduh untuk membuka aplikasi yang sesuai.</p>';
      target.innerHTML=preview;
    }catch(error){target.textContent='Gagal membuka pratinjau: '+(error.message||'kesalahan penyimpanan');}
  }
  async function downloadMedia(id){try{const item=await findMedia(id);if(!item)return;const url=URL.createObjectURL(item.blob);const a=document.createElement('a');a.href=url;a.download=item.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(error){setMediaStatus('Gagal mengunduh berkas: '+(error.message||'kesalahan penyimpanan'));}}
  async function deleteMedia(id){if(!window.confirm('Hapus salinan lokal ini dari Media Library?'))return;try{const db=await openMediaDb();await mediaRequest(db,'readwrite',(store)=>store.delete(id));const preview=$('#controlMediaPreview');if(preview?.dataset.objectUrl)URL.revokeObjectURL(preview.dataset.objectUrl);if(preview){preview.hidden=true;preview.innerHTML='';}await renderMediaLibrary();setMediaStatus('Salinan lokal dihapus. Berkas sumber pada perangkat/GitHub tidak berubah.');}catch(error){setMediaStatus('Gagal menghapus: '+(error.message||'kesalahan penyimpanan'));}}
  function formatBytes(n){if(!Number.isFinite(n))return 'ukuran tidak diketahui';if(n<1024)return n+' B';const units=['KB','MB','GB','TB'];let x=n/1024,i=0;while(x>=1024&&i<units.length-1){x/=1024;i++;}return x.toFixed(1)+' '+units[i];}
  function downloadJson(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function activateRoute(key, push = false) {
    const route = 'control-' + key;
    if (!pages[key]) return;
    if (push && location.hash !== '#control/' + key) history.pushState({ systemRoute: route }, '', '#control/' + key);
    document.body.dataset.systemRoute = route;
    document.querySelectorAll('.nav-dropdown').forEach((menu) => { menu.open = false; });
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
  if (location.hash.startsWith('#control/')) syncDeepLink();
  window.PBControlCenter={render,activateRoute};
  document.addEventListener('planetbintang:route-change',(e)=>{if(e.detail?.group==='control-center')render(e.detail.name);});
  document.addEventListener('planetbintang:snapshot-state',()=>{if(document.body.dataset.systemRoute?.startsWith('control-'))render(document.body.dataset.systemRoute);});
})();