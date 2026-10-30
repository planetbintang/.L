(() => {
  'use strict';
  const workspace = document.getElementById('workspace');
  const nav = document.getElementById('workspaceNav');
  if (!workspace || !nav) return;
  const suite = workspace.querySelector('[data-workspace-panel="suite"]');
  if (!suite) return;

  const V = (label, view, focus = '') => ({ label, view, focus });
  const R = (label, route) => ({ label, route });
  const C = (label, view, target) => ({ label, view, target });
  const features = [
    {icon:'▦',name:'Dashboard Sistem',desc:'Ringkasan dan pusat navigasi',items:[V('Ringkasan ruang kerja','projects'),V('Metrik sistem','analytics'),V('Aktivitas lokal','analytics','localActivityChart'),V('Navigasi panel','projects','workspaceNav'),V('Pusat bantuan','help'),R('Beranda PlanetBintang','#overview')]},
    {icon:'◫',name:'Manajemen Proyek',desc:'Perencanaan proyek lintas repositori',items:[V('Daftar proyek','projects'),V('Buat tugas proyek','projects','taskTitleInput'),C('Papan Kanban','projects','taskBoard'),V('Filter repositori','projects','taskRepoSelect'),V('Status pekerjaan','projects','taskStatusInput'),R('Roadmap proyek','#platform/roadmap')]},
    {icon:'☑',name:'Manajemen Tugas',desc:'Pencatatan dan alur penyelesaian tugas',items:[V('Tambah tugas','projects','taskTitleInput'),C('Lihat backlog','projects','taskBacklog'),C('Tugas berjalan','projects','taskProgress'),C('Antrean review','projects','taskReview'),V('Hitung tugas aktif','analytics','localActivityChart'),V('Kelola papan tugas','projects','taskBoard')]},
    {icon:'◎',name:'Issue & Diskusi',desc:'Pelacakan masalah dan catatan lokal',items:[V('Daftar masalah','issues'),V('Buat issue lokal','issues','issueTitleInput'),V('Filter status issue','issues','issueStatusFilter'),V('Filter label','issues','issueLabelFilter'),C('Daftar diskusi','issues','issueList'),C('Detail dan komentar','issues','issueDetail')]},
    {icon:'⌘',name:'Kode & Editor',desc:'Penampil sumber dan pengelolaan draft',items:[V('Buka editor kode','code'),C('Pilih file sumber','code','codePickFile'),C('Simpan draft','code','codeSaveDraft'),C('Pulihkan sumber','code','codeRestoreSource'),C('Periksa sintaks','code','codeCheckSyntax'),C('Unduh draft','code','codeDownload')]},
    {icon:'⌂',name:'Repositori',desc:'Indeks repositori dan metadata Git',items:[R('Indeks repositori','#repositories'),R('Cari repositori','#repositories'),R('Ringkasan repositori','#repositories'),R('Metadata Git','#platform/repositories'),R('Jenis aplikasi','#platform/repositories'),R('Status GitHub Pages','#platform/deployments')]},
    {icon:'▤',name:'File Manager',desc:'Pohon folder dan pengelolaan berkas',items:[R('Buka File Manager','#fileManager'),C('Cari berkas','code','codePickFile'),R('Telusuri folder root','#fileManager'),C('Pilih repositori file','projects','taskRepoSelect'),R('Lihat struktur direktori','#fileManager'),C('Buka editor dari file','code','codePickFile')]},
    {icon:'⑂',name:'Branch & Versi',desc:'Referensi branch dan versi repositori',items:[R('Daftar branch','#platform/branches'),R('Branch aktif','#platform/branches'),R('Bandingkan branch','#platform/branches'),R('Riwayat commit','#platform/commits'),R('Tag repositori','#platform/tags'),R('Rilis proyek','#platform/tags')]},
    {icon:'◷',name:'Riwayat Commit',desc:'Jejak perubahan dan identitas commit',items:[R('Daftar commit','#platform/commits'),R('Commit terbaru','#platform/commits'),R('Detail perubahan','#platform/commits'),R('Tag & release','#platform/tags'),R('Aktivitas repositori','#platform/activity'),R('Repositori terkait','#repositories')]},
    {icon:'▥',name:'Analitik Sistem',desc:'Metrik snapshot dan aktivitas',items:[V('Ikhtisar analitik','analytics'),C('Statistik repositori','analytics','systemChart'),C('Bahasa pemrograman','analytics','languageChart'),C('Visibilitas repositori','analytics','visibilityChart'),C('Aktivitas workspace','analytics','localActivityChart'),C('Ringkasan trafik GitHub','analytics','analyticsViews')]},
    {icon:'▧',name:'Dokumentasi',desc:'Panduan, referensi dan pengetahuan',items:[V('Pusat bantuan','help'),V('Cari dokumentasi','help','helpSearch'),R('Dokumentasi repositori','#repositories'),R('Katalog fitur Git','#platform/features'),V('Panduan editor','code'),V('Panduan File Manager','help')]},
    {icon:'✦',name:'AI Reber',desc:'Asisten dan konteks kerja',items:[V('Buka AI Reber','ai'),C('Kolom percakapan AI','ai','aiChatInput'),C('Kirim pertanyaan','ai','aiChatForm'),C('Bersihkan percakapan','ai','aiChatClear'),V('Pilih repo konteks AI','ai','aiRepoSelect'),R('Buka AI Studio','./aireber/')]},
    {icon:'⌁',name:'Integrasi',desc:'Konektor dan status layanan',items:[V('Status integrasi','account','integrationSettings'),C('Status GitHub','account','integrationSettings'),C('Status AI provider','account','integrationSettings'),C('Izin konektor','account','integrationSettings'),R('Operasi GitHub','#platform/operations'),R('Pusat konektor SNAPS','#snaps')]},
    {icon:'♙',name:'Profil Pengguna',desc:'Identitas tampilan dan preferensi',items:[V('Pengaturan profil','account','profileSettings'),C('Nama tampilan','account','profileName'),C('Email lokal','account','profileEmail'),C('Repositori default','account','defaultRepoSelect'),C('Simpan preferensi','account','profileForm'),V('Status akun lokal','account')]},
    {icon:'◇',name:'Keamanan Workspace',desc:'Privasi data dan batas operasi',items:[V('Preferensi keamanan','account','securitySettings'),C('Status snapshot read-only','account','integrationSettings'),C('Status runtime','account','integrationSettings'),C('Kebijakan penyimpanan','account','notificationSettings'),V('Batas akses browser','help'),V('Panduan keamanan','help')]},
    {icon:'♧',name:'Notifikasi & Aktivitas',desc:'Informasi status dan perubahan lokal',items:[V('Pengaturan notifikasi','account','notificationSettings'),C('Ringkasan aktivitas','analytics','localActivityChart'),V('Status tugas','projects'),V('Status masalah','issues'),R('Aktivitas repositori','#platform/activity'),V('Pusat bantuan','help')]},
    {icon:'⬇',name:'Cadangan & Ekspor',desc:'Ekspor data lokal dan pemulihan',items:[C('Ekspor cadangan workspace','account','workspaceBackup'),C('Ekspor draft kode','code','codeDownload'),V('Periksa data lokal','account','notificationSettings'),V('Preferensi penyimpanan','account','securitySettings'),V('Riwayat draft','code'),V('Panduan pemulihan','help')]},
    {icon:'⌖',name:'Roadmap & Target',desc:'Arah pengembangan dan rencana',items:[R('Buka roadmap','#platform/roadmap'),R('Daftar milestone','#platform/milestones'),R('Target repositori','#platform/milestones'),V('Papan proyek','projects'),V('Status pekerjaan','projects'),V('Analitik progres','analytics')]},
    {icon:'⚑',name:'Milestone',desc:'Target tahap dan pencapaian',items:[R('Semua milestone','#platform/milestones'),R('Milestone repositori','#platform/milestones'),R('Target berikutnya','#platform/roadmap'),V('Tugas terkait','projects'),V('Issue terkait','issues'),V('Analitik pencapaian','analytics')]},
    {icon:'✓',name:'Code Review',desc:'Pemeriksaan perubahan dan antrean review',items:[R('Pull requests','#platform/pull-requests'),R('Antrean review','#platform/review-queue'),R('Review repositori','#platform/pull-requests'),R('Diskusi perubahan','#platform/discussions'),V('Draft kode','code'),V('Pemeriksaan sintaks','code','codeCheckSyntax')]},
    {icon:'⇧',name:'CI & Pipeline',desc:'Status alur integrasi berkelanjutan',items:[R('Daftar pipeline','#platform/pipelines'),R('GitHub Actions','#platform/pipelines'),R('Status workflow','#platform/pipelines'),R('Log pipeline','#platform/activity'),R('Dokumentasi pipeline','#platform/pipelines'),V('Pusat bantuan','help')]},
    {icon:'◉',name:'Deploy & Publikasi',desc:'Rute publikasi dan status Pages',items:[R('Status deployment','#platform/deployments'),R('GitHub Pages','#platform/deployments'),R('Riwayat publikasi','#platform/activity'),R('Rilis proyek','#platform/tags'),R('Domain publik','#hosts'),V('Panduan publikasi','help')]},
    {icon:'◎',name:'Domain & Host',desc:'Pemetaan domain dan infrastruktur',items:[R('Peta domain & host','#hosts'),R('Daftar domain','#hosts'),R('Informasi DNS','#hosts'),R('Status Pages','#platform/deployments'),R('Peta jaringan','#networkMap'),V('Panduan domain','help')]},
    {icon:'▦',name:'Feature Registry',desc:'Katalog fitur dan indeks sistem',items:[V('Buka Feature Registry','features'),C('Cari fitur sistem','features','featureQuery'),C('Filter domain fitur','features','featureDomainFilter'),C('Filter ekstensi','features','featureExtensionFilter'),C('Detail fitur terpilih','features','featureInspectorTitle'),C('Simulasi fitur','features','featureSimulate')]},
    {icon:'?',name:'Bantuan & Dukungan',desc:'Panduan penggunaan dan pemecahan masalah',items:[V('Pusat bantuan','help'),C('Cari topik bantuan','help','helpSearch'),C('Dokumentasi sistem','help','helpCards'),R('Repositori sumber','#repositories'),R('Pusat pengembangan','#platform/features'),V('Kembali ke dashboard','projects')]}
  ];

  const hub = suite.querySelector('.workspace-feature-hub');
  if (!hub) return;
  const grid = hub.querySelector('#workspaceFeatureGrid');
  const search = hub.querySelector('#workspaceFeatureSearch');
  const empty = hub.querySelector('#workspaceFeatureEmpty');
  const status = hub.querySelector('#workspaceFeatureStatus');
  if (!grid || !search || !empty) return;

  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  grid.innerHTML = features.map((f,i)=>'<article class="workspace-feature-card" data-feature-card><div class="workspace-feature-card-head"><span class="workspace-feature-icon" aria-hidden="true">'+f.icon+'</span><div><h4>'+esc(f.name)+'</h4><small>'+esc(f.desc)+' · '+f.items.length+' subfitur</small></div></div><div class="workspace-feature-actions">'+f.items.map((item,j)=>'<button type="button" data-feature-index="'+i+'" data-subfeature-index="'+j+'">'+esc(item.label)+' ↗</button>').join('')+'</div></article>').join('');

  search.addEventListener('input',()=>{
    const q=search.value.trim().toLocaleLowerCase('id');
    let visible=0;
    [...grid.children].forEach((card,i)=>{
      const f=features[i],match=!q||(f.name+' '+f.desc+' '+f.items.map(x=>x.label).join(' ')).toLocaleLowerCase('id').includes(q);
      card.hidden=!match;if(match)visible++;
    });
    empty.classList.toggle('is-visible',visible===0);
  });

  function view(name,focus){
    if(window.PBWorkspace?.showView) window.PBWorkspace.showView(name);
    else nav.querySelector('[data-workspace-view="'+name+'"]')?.click();
    if(focus) setTimeout(()=>document.getElementById(focus)?.focus({preventScroll:false}),90);
  }
  function route(hash){
    if(hash.startsWith('./') || /^https?:/.test(hash)){window.location.href=hash;return;}
    window.location.hash=hash;
    const routeName=hash==='#fileManager'?'file-manager':hash==='#repositories'?'repositories':hash==='#hosts'?'hosts':hash==='#networkMap'?'network-map':null;
    if(routeName) document.querySelector('[data-system-route="'+routeName+'"]')?.click();
  }
  function activate(item){
    if(item.route){route(item.route);return;}
    if(item.view) view(item.view);
    if(item.target){
      const target=document.getElementById(item.target);
      if(!target)return;
      if(item.target==='workspaceBackup'){backup();return;}
      if(item.target==='codeDownload'||item.target==='codeSaveDraft'||item.target==='codeRestoreSource'||item.target==='codeCheckSyntax'||item.target==='codePickFile'||item.target==='aiChatClear'||item.target==='aiChatForm'||item.target==='profileForm'||item.target==='featureSimulate'){
        const action=item.target==='profileForm'?target.querySelector('button[type="submit"]'):target;
        action?.click();return;
      }
      setTimeout(()=>{target.scrollIntoView?.({behavior:'smooth',block:'center'});if(target.matches('input,select,textarea,button'))target.focus?.({preventScroll:true});},100);
    }
  }
  function backup(){
    const data={schema:'planetbintang-workspace-backup-v1',createdAt:new Date().toISOString(),storage:{}};
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key && (key.startsWith('pb-workspace-')||key==='pb-feature-workbench-v1'||key==='planetbintang.file-manager.workspace.v1')){
        try{data.storage[key]=JSON.parse(localStorage.getItem(key));}catch{data.storage[key]=localStorage.getItem(key);}
      }
    }
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='planetbintang-workspace-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
  }
  hub.addEventListener('click',event=>{
    const button=event.target.closest('button[data-feature-index]');if(!button)return;
    const feature=features[Number(button.dataset.featureIndex)];
    const item=feature?.items[Number(button.dataset.subfeatureIndex)];
    if(item){
      if(status) status.textContent='Dibuka: '+feature.name+' / '+item.label+'. Panel terkait telah dipilih; data tetap mengikuti batas penyimpanan lokal.';
      activate(item);
    }
  });

  const count=features.reduce((n,f)=>n+f.items.length,0);
  const summary=hub.querySelector('.workspace-feature-summary');
  if(summary) summary.setAttribute('aria-label',features.length+' fitur utama dan '+count+' subfitur');
  if(features.length!==25||count!==150) console.error('Workspace feature registry count mismatch:',features.length,count);
})();