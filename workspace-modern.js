(() => {
  'use strict';
  const workspace = document.getElementById('workspace');
  const nav = document.getElementById('workspaceNav');
  if (!workspace || !nav || document.getElementById('workspaceFeatureHub')) return;
  const features = [
    {icon:'▦',name:'Dashboard Sistem',desc:'Ringkasan dan aktivitas utama',items:[['Ringkasan proyek','projects'],['Aktivitas lokal','analytics'],['Navigasi cepat','nav']]},
    {icon:'◫',name:'Proyek & Tugas',desc:'Papan kerja dan pengelolaan tugas',items:[['Papan tugas','projects'],['Buat tugas baru','new-task'],['Kelola status tugas','task-board']]},
    {icon:'◎',name:'Masalah & Diskusi',desc:'Pelacakan masalah dan komentar lokal',items:[['Daftar masalah','issues'],['Buat masalah','new-issue'],['Diskusi dan komentar','issue-detail']]},
    {icon:'⌘',name:'Kode & Editor',desc:'Penampil sumber dan draft lokal',items:[['Buka editor kode','code'],['Simpan draft kode','code-save'],['Periksa sintaks','code-check']]},
    {icon:'⌂',name:'Repositori',desc:'Indeks sumber dan metadata Git',items:[['Indeks repositori','repositories'],['Daftar branch','branches'],['Riwayat commit','commits']]},
    {icon:'▤',name:'File Manager',desc:'Pohon folder dan pencarian berkas',items:[['Telusuri folder','file-manager'],['Cari berkas','file-search']]},
    {icon:'▥',name:'Analitik Sistem',desc:'Metrik snapshot dan aktivitas',items:[['Statistik snapshot','analytics'],['Bahasa repositori','language-chart']]},
    {icon:'▧',name:'Dokumentasi',desc:'Panduan penggunaan dan katalog',items:[['Panduan workspace','help'],['Katalog fitur sistem','catalog']]},
    {icon:'✦',name:'AI & Integrasi',desc:'Asisten dan status konektor',items:[['Buka AI Reber','ai'],['Status konektor','integrations']]},
    {icon:'⚙',name:'Pengaturan',desc:'Profil, preferensi, dan cadangan',items:[['Profil lokal','profile'],['Preferensi workspace','settings'],['Ekspor cadangan lokal','backup']]}
  ];
  const hub = document.createElement('section');
  hub.id = 'workspaceFeatureHub';
  hub.className = 'workspace-feature-hub';
  hub.setAttribute('aria-label','Sepuluh fitur utama dan dua puluh lima subfitur Workspace');
  hub.innerHTML = '<div class="workspace-feature-head"><div><p class="eyebrow">PUSAT KENDALI / 10 FITUR · 25 SUBFITUR</p><h3>Fitur ruang kerja</h3><p>Pilih fungsi untuk membuka panel operasional yang sesuai. Data tugas, masalah, profil, dan draft tertentu tersimpan lokal di browser ini.</p></div><input class="workspace-feature-search" id="workspaceFeatureSearch" type="search" placeholder="Cari fitur atau subfitur…" aria-label="Cari fitur workspace"></div><div class="workspace-feature-grid" id="workspaceFeatureGrid"></div><div class="workspace-feature-empty" id="workspaceFeatureEmpty">Tidak ada fitur yang cocok dengan pencarian.</div>';
  nav.insertAdjacentElement('afterend', hub);
  const grid = hub.querySelector('#workspaceFeatureGrid');
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  grid.innerHTML = features.map((f,i)=>'<article class="workspace-feature-card" data-feature-card><div class="workspace-feature-card-head"><span class="workspace-feature-icon" aria-hidden="true">'+f.icon+'</span><div><h4>'+esc(f.name)+'</h4><small>'+esc(f.desc)+' · '+f.items.length+' subfitur</small></div></div><div class="workspace-feature-actions">'+f.items.map(([label,action])=>'<button type="button" data-ws-action="'+action+'">'+esc(label)+' ↗</button>').join('')+'</div></article>').join('');
  const search = hub.querySelector('#workspaceFeatureSearch');
  search.addEventListener('input',()=>{
    const q=search.value.trim().toLocaleLowerCase('id');
    let visible=0;
    [...grid.children].forEach((card,i)=>{
      const f=features[i],match=!q||(f.name+' '+f.desc+' '+f.items.map(x=>x[0]).join(' ')).toLocaleLowerCase('id').includes(q);
      card.hidden=!match;if(match)visible++;
    });
    hub.querySelector('#workspaceFeatureEmpty').classList.toggle('is-visible',visible===0);
  });
  function view(name,focus){
    if(window.PBWorkspace?.showView) window.PBWorkspace.showView(name);
    else { const tab=nav.querySelector('[data-workspace-view="'+name+'"]');tab?.click(); }
    if(focus) setTimeout(()=>document.getElementById(focus)?.focus({preventScroll:false}),80);
  }
  function route(hash){
    window.location.hash=hash;
    const map={'#repositories':'repositories','#fileManager':'file-manager'};
    const selector=map[hash];
    if(selector) document.querySelector('[data-system-route="'+selector+'"]')?.click();
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
    const button=event.target.closest('[data-ws-action]');if(!button)return;
    switch(button.dataset.wsAction){
      case 'projects':view('projects');break;
      case 'analytics':case 'language-chart':view('analytics');break;
      case 'nav':nav.scrollIntoView({behavior:'smooth',block:'center'});break;
      case 'new-task':view('projects','taskTitleInput');break;
      case 'task-board':view('projects');document.getElementById('taskBoard')?.scrollIntoView({behavior:'smooth',block:'center'});break;
      case 'issues':view('issues');break;
      case 'new-issue':view('issues','issueTitleInput');break;
      case 'issue-detail':view('issues');document.getElementById('issueList')?.scrollIntoView({behavior:'smooth',block:'center'});break;
      case 'code':view('code');break;
      case 'code-save':view('code');document.getElementById('codeSaveDraft')?.click();break;
      case 'code-check':view('code');document.getElementById('codeCheckSyntax')?.click();break;
      case 'repositories':route('#repositories');break;
      case 'branches':route('#platform/branches');break;
      case 'commits':route('#platform/commits');break;
      case 'file-manager':route('#fileManager');break;
      case 'file-search':route('#fileManager');setTimeout(()=>document.getElementById('fileSearchInput')?.focus(),120);break;
      case 'help':view('help');break;
      case 'catalog':window.location.href='./git-feature-catalog.html';break;
      case 'ai':view('ai');break;
      case 'integrations':view('account');setTimeout(()=>document.getElementById('integrationSettings')?.scrollIntoView({behavior:'smooth',block:'center'}),80);break;
      case 'profile':view('account');setTimeout(()=>document.getElementById('profileSettings')?.scrollIntoView({behavior:'smooth',block:'center'}),80);break;
      case 'settings':view('account');break;
      case 'backup':backup();break;
    }
  });
  const navButtons=[...nav.querySelectorAll('[data-workspace-view]')];
  const originalShow=window.PBWorkspace?.showView;
  if(originalShow&&!window.PBWorkspace.__featureHubWrapped){
    window.PBWorkspace.showView=(name,...args)=>{const result=originalShow(name,...args);navButtons.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.workspaceView===name)));return result;};
    window.PBWorkspace.__featureHubWrapped=true;
  }
  const count=features.reduce((n,f)=>n+f.items.length,0);
  if(count!==25) console.warn('Workspace feature registry count mismatch:',count);
})();