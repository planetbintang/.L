(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const STORE = {
    tasks: 'pb-workspace-tasks-v1', issues: 'pb-workspace-issues-v1', profile: 'pb-workspace-profile-v1',
    drafts: 'pb-workspace-code-drafts-v1', ai: 'pb-workspace-ai-requests-v1', defaultRepo: 'pb-workspace-default-repo-v1',
  };
  const fmt = new Intl.NumberFormat('id-ID');
  const read = (key, fallback) => { try { const x = JSON.parse(localStorage.getItem(key)); return x ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const safeText = (tag, value, className = '') => { const n = document.createElement(tag); n.textContent = value == null ? '' : String(value); if (className) n.className = className; return n; };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (x) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[x]));
  // Workspace markup is static HTML in index.html; behavior remains in this module.
  let repos = [];
  let selectedIssue = null;
  let selectedFile = null;
  let sourceText = '';
  let sourceAvailable = false;
  let tasks = read(STORE.tasks, []);
  let issues = read(STORE.issues, []);

  function notify(message, kind = 'ok') {
    const status = $('#workspaceToast') || (() => { const n = document.createElement('div'); n.id = 'workspaceToast'; n.className = 'workspace-toast'; n.setAttribute('role', 'status'); document.body.append(n); return n; })();
    status.textContent = message; status.dataset.kind = kind; status.classList.add('is-visible');
    clearTimeout(notify.timer); notify.timer = setTimeout(() => status.classList.remove('is-visible'), 3400);
  }
  function repoOptions(select, addAll = false) {
    if (!select) return;
    select.replaceChildren();
    if (addAll) select.add(new Option('Semua repo', 'all'));
    for (const repo of repos) select.add(new Option(repo.fullName || repo.name, repo.fullName || repo.name));
    const wanted = read(STORE.defaultRepo, 'planetbintang/.L');
    if ([...select.options].some((o) => o.value === wanted)) select.value = wanted;
    else if (select.options.length) select.selectedIndex = addAll ? 0 : 0;
  }
  function persistTasks() { if (!write(STORE.tasks, tasks)) notify('Penyimpanan browser penuh; ekspor atau hapus beberapa tugas.', 'error'); renderTasks(); renderAnalytics(); }
  function renderTasks() {
    const columns = { backlog: '#taskBacklog', progress: '#taskProgress', review: '#taskReview' };
    const counts = { backlog: 0, progress: 0, review: 0 };
    Object.values(columns).forEach((sel) => { const node = $(sel); if (node) node.replaceChildren(); });
    tasks.forEach((task) => {
      const status = columns[task.status] ? task.status : 'backlog'; counts[status]++;
      const card = document.createElement('article'); card.className = 'task-card';
      const top = document.createElement('div'); top.className = 'task-card-top'; top.append(safeText('b', task.title), safeText('small', task.repo || 'Repo belum dipilih'));
      const row = document.createElement('div'); row.className = 'task-card-actions';
      const select = document.createElement('select'); select.setAttribute('aria-label', 'Ubah status tugas');
      [['backlog','Backlog'],['progress','Dalam proses'],['review','Review']].forEach(([v,l]) => select.add(new Option(l,v)));
      select.value = status; select.addEventListener('change', () => { task.status = select.value; persistTasks(); });
      const remove = safeText('button', 'Hapus'); remove.type = 'button'; remove.className = 'task-delete'; remove.addEventListener('click', () => { tasks = tasks.filter((x) => x.id !== task.id); persistTasks(); });
      row.append(select, remove); card.append(top, row); $(columns[status]).append(card);
    });
    for (const status of Object.keys(counts)) { $(`#taskCount${status[0].toUpperCase()}${status.slice(1)}`).textContent = fmt.format(counts[status]); if (!counts[status]) $(columns[status]).append(safeText('p','Belum ada tugas.','workspace-empty-small')); }
    $('#wsTaskCount').textContent = fmt.format(tasks.length);
    $('#wsIssueCount').textContent = fmt.format(issues.length);
  }
  $('#taskCreateForm').addEventListener('submit', (event) => {
    event.preventDefault(); const title = $('#taskTitleInput').value.trim(); if (!title) return;
    tasks.unshift({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, title, repo: $('#taskRepoSelect').value || '', status: $('#taskStatusInput').value, createdAt: new Date().toISOString() });
    $('#taskTitleInput').value = ''; persistTasks(); notify('Tugas tersimpan lokal.');
  });

  function renderIssues() {
    const list = $('#issueList'); list.replaceChildren();
    const repoFilter = $('#issueRepoFilter').value || 'all'; const statusFilter = $('#issueStatusFilter').value || 'all'; const labelFilter = $('#issueLabelFilter').value.trim().toLowerCase();
    const filtered = issues.filter((x) => (repoFilter === 'all' || x.repo === repoFilter) && (statusFilter === 'all' || x.status === statusFilter) && (!labelFilter || (x.labels || []).join(' ').toLowerCase().includes(labelFilter)));
    $('#issueResultCount').textContent = `${fmt.format(filtered.length)} masalah lokal`;
    for (const issue of filtered) {
      const button = document.createElement('button'); button.type = 'button'; button.className = `issue-row${selectedIssue === issue.id ? ' is-selected' : ''}`;
      const heading = document.createElement('span'); heading.className = 'issue-row-heading'; heading.append(safeText('b',issue.title), safeText('em',issue.status === 'closed' ? 'SELESAI' : 'TERBUKA'));
      button.append(heading, safeText('small', `${issue.repo || 'Repo'} · ${new Date(issue.createdAt).toLocaleDateString('id-ID')}`), safeText('span',(issue.labels || []).join(' · ') || 'tanpa label','issue-labels'));
      button.addEventListener('click', () => { selectedIssue = issue.id; renderIssues(); renderIssueDetail(); }); list.append(button);
    }
    if (!filtered.length) list.append(safeText('p','Tidak ada masalah sesuai filter.','workspace-empty'));
    renderIssueDetail();
  }
  function renderIssueDetail() {
    const panel = $('#issueDetail'); panel.replaceChildren(); const issue = issues.find((x) => x.id === selectedIssue);
    if (!issue) { panel.append(safeText('div','Pilih masalah di daftar atau buat masalah lokal baru.','workspace-empty')); return; }
    const head = document.createElement('header'); head.className='issue-detail-head'; head.append(safeText('span',`#${issue.number}`,'issue-number'),safeText('h4',issue.title),safeText('span',issue.status === 'closed' ? 'Selesai' : 'Terbuka',`issue-status ${issue.status}`));
    panel.append(head,safeText('p',issue.body || 'Belum ada deskripsi.','issue-body'),safeText('small',`${issue.repo} · Dibuat ${new Date(issue.createdAt).toLocaleString('id-ID')}`,'issue-meta'));
    const labelList=document.createElement('div');labelList.className='issue-label-list';(issue.labels||[]).forEach((label)=>labelList.append(safeText('span',label,'issue-label')));panel.append(labelList);
    const actions=document.createElement('div');actions.className='issue-detail-actions';const toggle=safeText('button',issue.status==='closed'?'Buka kembali':'Tandai selesai');toggle.type='button';toggle.className='workspace-secondary';toggle.addEventListener('click',()=>{issue.status=issue.status==='closed'?'open':'closed';persistIssues();});const del=safeText('button','Hapus lokal');del.type='button';del.className='workspace-secondary';del.addEventListener('click',()=>{issues=issues.filter(x=>x.id!==issue.id);selectedIssue=null;persistIssues();});actions.append(toggle,del);panel.append(actions);
    const comments=document.createElement('div');comments.className='issue-comments';comments.append(safeText('h5',`Diskusi (${(issue.comments||[]).length})`));(issue.comments||[]).forEach((comment)=>{const c=document.createElement('article');c.append(safeText('b',comment.author||'Lokal'),safeText('small',new Date(comment.at).toLocaleString('id-ID')),safeText('p',comment.body));comments.append(c);});
    const form=document.createElement('form');form.className='issue-comment-form';const input=document.createElement('textarea');input.required=true;input.maxLength=1000;input.placeholder='Tambahkan catatan lokal…';const submit=safeText('button','Tambah catatan');submit.type='submit';submit.className='workspace-primary';form.append(input,submit);form.addEventListener('submit',(event)=>{event.preventDefault();const body=input.value.trim();if(!body)return;(issue.comments||(issue.comments=[])).push({author:read(STORE.profile,{}).name||'Lokal',body,at:new Date().toISOString()});persistIssues();});comments.append(form);panel.append(comments);
  }
  function persistIssues() { if (!write(STORE.issues,issues)) notify('Penyimpanan browser penuh.','error'); renderIssues(); renderTasks(); renderAnalytics(); }
  $('#issueRepoFilter').addEventListener('change',renderIssues);$('#issueStatusFilter').addEventListener('change',renderIssues);$('#issueLabelFilter').addEventListener('input',renderIssues);
  $('#issueCreateForm').addEventListener('submit',(event)=>{event.preventDefault();const title=$('#issueTitleInput').value.trim();if(!title)return;const issue={id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,number:issues.length+1,title,repo:$('#issueRepoFilter').value==='all'?(repos[0]?.fullName||''):$('#issueRepoFilter').value,status:'open',labels:$('#issueLabelFilter').value.trim()?[$('#issueLabelFilter').value.trim()]:['triage'],body:'',comments:[],createdAt:new Date().toISOString()};issues.unshift(issue);selectedIssue=issue.id;$('#issueTitleInput').value='';persistIssues();notify('Masalah lokal dibuat.');});

  const panels = $$('[data-workspace-panel]');
  function showView(view, scroll = false) {
    if (!panels.some((p) => p.dataset.workspacePanel === view)) view = 'projects';
    panels.forEach((p) => { p.hidden = p.dataset.workspacePanel !== view; });
    $$('#workspaceNav [data-workspace-view]').forEach((b) => { b.setAttribute('aria-selected',String(b.dataset.workspaceView===view));b.classList.toggle('is-active',b.dataset.workspaceView===view); });
    try { localStorage.setItem('pb-workspace-current-view',view); } catch {}
    if (scroll) $('#workspace').scrollIntoView({behavior:'smooth',block:'start'});
    if (view === 'analytics') renderAnalytics();
  }
  $$('#workspaceNav [data-workspace-view]').forEach((button)=>button.addEventListener('click',()=>showView(button.dataset.workspaceView)));
  $$('[data-workspace-target]').forEach((link)=>link.addEventListener('click',(event)=>{event.preventDefault();showView(link.dataset.workspaceTarget,true);}));

  function barChart(node, entries, color = 'blue') {
    node.replaceChildren(); const max=Math.max(1,...entries.map((x)=>x.value));
    if (!entries.length) { node.append(safeText('p','Data snapshot tidak tersedia.','workspace-empty-small')); return; }
    entries.slice(0,7).forEach((item)=>{const row=document.createElement('div');row.className='bar-row';const label=safeText('span',item.label,'bar-label');const track=document.createElement('span');track.className='bar-track';const fill=document.createElement('i');fill.style.width=`${Math.max(item.value?3:0,Math.min(100,item.value/max*100))}%`;if(color==='green')fill.style.background='#239bc5';track.append(fill);row.append(label,track,safeText('b',fmt.format(item.value),'bar-value'));node.append(row);});
  }
  function renderAnalytics() {
    if (!repos.length) return;
    const views=repos.reduce((s,r)=>s+(r.traffic14d?.views?.count||0),0), clones=repos.reduce((s,r)=>s+(r.traffic14d?.clones?.count||0),0);
    $('#analyticsRepos').textContent=fmt.format(repos.length);$('#analyticsPaths').textContent=fmt.format(repos.reduce((s,r)=>s+(r.tree?.entryCount||0),0));$('#analyticsFiles').textContent=fmt.format(repos.reduce((s,r)=>s+(r.tree?.fileCount||0),0));$('#analyticsViews').textContent=fmt.format(views);$('#analyticsClones').textContent=fmt.format(clones);
    const languages=new Map(),types=new Map();repos.forEach((r)=>{(r.languages||[]).slice(0,3).forEach((x)=>languages.set(x.name,(languages.get(x.name)||0)+1));types.set(r.appType||'Tidak terklasifikasi',(types.get(r.appType||'Tidak terklasifikasi')||0)+1);});
    barChart($('#languageChart'),[...languages].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value));barChart($('#systemChart'),[...types].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value));
    barChart($('#visibilityChart'),[{label:'Publik',value:repos.filter(r=>r.visibility==='public').length},{label:'Privat',value:repos.filter(r=>r.visibility==='private').length},{label:'Repo kosong',value:repos.filter(r=>r.state==='empty').length}],'green');
    barChart($('#localActivityChart'),[{label:'Tugas',value:tasks.length},{label:'Masalah',value:issues.length},{label:'Draft kode',value:Object.keys(read(STORE.drafts,{})).length},{label:'Permintaan AI lokal',value:read(STORE.ai,[]).length}]);
  }

  function draftKey(file) { return `${file.fullName}::${file.path}`; }
  function setCodeStatus(message, kind='') { const n=$('#codeStatus'); n.textContent=message;n.dataset.kind=kind; }
  async function readLimited(response, maxBytes) {
    if (!response.body?.getReader) { const value=await response.text(); if(new TextEncoder().encode(value).length>maxBytes)throw new Error('File lebih besar dari batas preview 1 MiB'); return value; }
    const reader=response.body.getReader();const chunks=[];let size=0;
    try { while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new Error('File lebih besar dari batas preview 1 MiB');}chunks.push(value);} }
    finally { try { reader.releaseLock(); } catch {} }
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return new TextDecoder('utf-8').decode(bytes);
  }
  function rawFileUrl(file) {
    const [owner,repo]=file.fullName.split('/');
    if(!owner||!repo||!file.branch||!file.path)return '';
    return `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${file.branch.split('/').map(encodeURIComponent).join('/')}/${file.path.split('/').map(encodeURIComponent).join('/')}`;
  }
  async function loadSelectedFile(file) {
    selectedFile=file; sourceText='';sourceAvailable=false;
    $('#codeRepoSelect').value=file.fullName;$('#codePathInput').value=`/${file.path}`;$('#codeGithubLink').href=file.url||'https://github.com/planetbintang';
    const editor=$('#codeEditor');const draft=read(STORE.drafts,{});const saved=draft[draftKey(file)];
    if(file.visibility!=='public') { editor.value=saved?.content||'';setCodeStatus(saved?'Draft lokal repo privat dimuat. Isi sumber tidak diambil oleh Pages. Buka GitHub dengan autentikasi untuk memeriksa sumber.':'Repo privat: browser Pages tidak dapat mengambil isi. Buka GitHub dengan autentikasi, lalu tempel ke editor jika ingin menyimpan draft lokal.','warn');$('#codeDirtyState').textContent=saved?'Draft lokal tersedia':'Belum ada perubahan';return; }
    setCodeStatus('Memuat file publik dari raw.githubusercontent.com…');
    try {
      const response=await fetch(rawFileUrl(file),{credentials:'omit',cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const length=Number(response.headers.get('content-length')||0);if(length>1_048_576)throw new Error('File lebih besar dari batas preview 1 MiB');
      const content=await readLimited(response,1_048_576);
      if(selectedFile!==file)return;
      sourceText=content;sourceAvailable=true;editor.value=saved?.content??content;
      setCodeStatus(saved?'Isi publik dan draft lokal dimuat.':'Isi file publik dimuat hanya ke browser; tidak disimpan ke server.');$('#codeDirtyState').textContent=saved?'Draft lokal tersedia':'Sumber GitHub';
    }catch(error){if(selectedFile!==file)return;editor.value=saved?.content||'';setCodeStatus(`Isi tidak dapat dimuat: ${error.message}. Anda dapat membuka GitHub atau menempelkan kode secara manual untuk draft lokal.`,'warn');}
  }
  document.addEventListener('planetbintang:file-selected',(event)=>{selectedFile=event.detail;$('#codeRepoSelect').value=selectedFile.fullName;$('#codePathInput').value=`/${selectedFile.path}`;$('#codeGithubLink').href=selectedFile.url||'https://github.com/planetbintang';loadSelectedFile(selectedFile);});
  $('#fileOpenEditorButton').addEventListener('click',()=>{if(!selectedFile)return;showView('code',true);});
  $('#codePickFile').addEventListener('click',()=>$('#fileManager').scrollIntoView({behavior:'smooth',block:'start'}));
  $('#codeRepoSelect').addEventListener('change',()=>{const r=repos.find(x=>x.fullName===$('#codeRepoSelect').value);if(r){setCodeStatus(r.visibility==='private'?'Repo privat; pilih file melalui GitHub setelah autentikasi.':'Pilih file pada File Manager untuk memuat sumber publik.','warn');$('#fileRepoSelect').value=r.fullName;$('#fileRepoSelect').dispatchEvent(new Event('change'));}});
  $('#codeEditor').addEventListener('input',()=>$('#codeDirtyState').textContent='Belum disimpan · draft hanya lokal');
  $('#codeSaveDraft').addEventListener('click',()=>{if(!selectedFile){setCodeStatus('Pilih file terlebih dahulu dari File Manager.','warn');return;}const drafts=read(STORE.drafts,{});drafts[draftKey(selectedFile)]={content:$('#codeEditor').value,updatedAt:new Date().toISOString()};if(write(STORE.drafts,drafts)){setCodeStatus('Draft disimpan di localStorage browser ini. Tidak ada perubahan dikirim ke GitHub.');$('#codeDirtyState').textContent='Draft lokal tersimpan';renderAnalytics();notify('Draft lokal tersimpan.');}else setCodeStatus('Gagal menyimpan; ruang localStorage mungkin penuh.','error');});
  $('#codeRestoreSource').addEventListener('click',()=>{if(!selectedFile){$('#codeEditor').value='';return;}const drafts=read(STORE.drafts,{});delete drafts[draftKey(selectedFile)];write(STORE.drafts,drafts);$('#codeEditor').value=sourceAvailable?sourceText:'';setCodeStatus(sourceAvailable?'Draft lokal dihapus; isi dipulihkan dari sumber publik.':'Draft lokal dihapus. Sumber repo privat tidak dapat dipulihkan oleh Pages.');$('#codeDirtyState').textContent=sourceAvailable?'Sumber GitHub':'Draft dihapus';renderAnalytics();});
  $('#codeFormatJson').addEventListener('click',()=>{try{$('#codeEditor').value=JSON.stringify(JSON.parse($('#codeEditor').value),null,2);$('#codeDirtyState').textContent='Format JSON berubah · belum disimpan';setCodeStatus('JSON valid dan diformat lokal.');}catch(error){setCodeStatus(`JSON tidak valid: ${error.message}`,'error');}});
  $('#codeCheckSyntax').addEventListener('click',()=>{const code=$('#codeEditor').value;const ext=(selectedFile?.path.split('.').pop()||'').toLowerCase();try{if(ext==='json'){JSON.parse(code);setCodeStatus('JSON valid (parse lokal; tidak dieksekusi).');return;}if(['js','mjs','cjs'].includes(ext)){new Function(code);setCodeStatus('Sintaks JavaScript dapat diparse. Kode tidak dipanggil atau dieksekusi.');return;}if(['html','htm'].includes(ext)){const doc=new DOMParser().parseFromString(code,'text/html');if(doc.querySelector('parsererror'))throw new Error('Markup tidak dapat diparse');setCodeStatus('Markup HTML diparse lokal; tidak dirender atau dijalankan.');return;}setCodeStatus(`Pemeriksa sintaks lokal belum tersedia untuk .${ext||'file'}; tidak ada kode yang dijalankan.`,'warn');}catch(error){setCodeStatus(`Pemeriksaan sintaks gagal: ${error.message}`,'error');}});
  $('#codeDownload').addEventListener('click',()=>{const blob=new Blob([$('#codeEditor').value],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(selectedFile?.path.split('/').pop()||'workspace-draft.txt')+'.draft';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});

  const profile=read(STORE.profile,{});$('#profileName').value=profile.name||'';$('#profileEmail').value=profile.email||'';
  const savedTheme=(()=>{try{return localStorage.getItem('planetbintang-dashboard-theme')==='soft'?'soft':'white';}catch{return 'white';}})();$('#workspaceTheme').value=savedTheme;
  $('#profileForm').addEventListener('submit',(event)=>{event.preventDefault();const next={name:$('#profileName').value.trim(),email:$('#profileEmail').value.trim()};write(STORE.profile,next);const defaultRepo=$('#defaultRepoSelect').value;if(defaultRepo)try{localStorage.setItem(STORE.defaultRepo,defaultRepo);}catch{};try{localStorage.setItem('planetbintang-dashboard-theme',$('#workspaceTheme').value);}catch{};document.body.classList.toggle('light-mode',$('#workspaceTheme').value==='soft');updateProfile();$('#profileSaveStatus').textContent='Preferensi tersimpan di browser ini.';notify('Preferensi lokal tersimpan.');});
  $('#defaultRepoSelect').addEventListener('change',()=>{try{localStorage.setItem(STORE.defaultRepo,$('#defaultRepoSelect').value);}catch{};$('#fileRepoSelect').value=$('#defaultRepoSelect').value;$('#fileRepoSelect').dispatchEvent(new Event('change'));});
  function updateProfile(){const p=read(STORE.profile,{});const name=p.name||'Workspace lokal';$('#workspaceGreeting').textContent=name;$('#workspaceAvatar').textContent=name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'PB';$('#workspaceMode').textContent=p.email?'Profil lokal · '+p.email:'Data tersimpan di browser ini';}
  updateProfile();

  $('#helpSearch').addEventListener('input',()=>{const q=$('#helpSearch').value.toLowerCase();$$('#helpCards>a,#helpCards>article').forEach(card=>card.hidden=!card.textContent.toLowerCase().includes(q));});
  function saveAiRequest(){const prompt=$('#aiPrompt').value.trim();if(!prompt){$('#aiStatus').textContent='Tulis permintaan terlebih dahulu.';return;}const history=read(STORE.ai,[]);history.unshift({prompt,repo:$('#aiRepoSelect').value||'',createdAt:new Date().toISOString()});if(write(STORE.ai,history.slice(0,20))){$('#aiStatus').textContent='Tersimpan lokal. Belum dikirim ke provider AI; tidak ada kode dibuat atau dieksekusi.';renderAiHistory();renderAnalytics();notify('Permintaan AI tersimpan lokal, belum dijalankan.','warn');}else $('#aiStatus').textContent='Tidak dapat menyimpan ke localStorage browser.';}
  function renderAiHistory(){const root=$('#aiHistory');root.replaceChildren();const history=read(STORE.ai,[]);if(!history.length){root.append(safeText('p','Belum ada permintaan tersimpan.','workspace-empty-small'));return;}history.forEach((item)=>{const row=document.createElement('article');row.append(safeText('b',item.repo||'Semua repo'),safeText('time',new Date(item.createdAt).toLocaleString('id-ID')),safeText('p',item.prompt));root.append(row);});}
  $('#aiSaveRequest').addEventListener('click',saveAiRequest);$('#aiClearRequest').addEventListener('click',()=>{$('#aiPrompt').value='';$('#aiStatus').textContent='Permintaan dibersihkan dari editor; riwayat lokal tidak dihapus.';});
  $$('[data-ai-intent]').forEach((button)=>button.addEventListener('click',()=>{const repo=$('#aiRepoSelect').value||'repo pilihan';const file=selectedFile&&selectedFile.fullName===$('#aiRepoSelect').value?` ${selectedFile.path}`:'';$('#aiPrompt').value=`${button.dataset.aiIntent} ${repo}${file}.\n\nKonteks/hasil yang diinginkan:\n`;showView('ai');$('#aiPrompt').focus();}));
  async function init() {
    repoOptions($('#taskRepoSelect'));repoOptions($('#issueRepoFilter'),true);repoOptions($('#codeRepoSelect'));repoOptions($('#defaultRepoSelect'));repoOptions($('#aiRepoSelect'));
    // Populate snapshot-backed workspace analytics and all repo selectors without exposing source files.
    try {
      const response=await fetch(`./data/repositories.json?workspace=${Date.now()}`,{cache:'no-store',credentials:'omit'});if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();if(!Array.isArray(data.repositories))throw new Error('snapshot invalid');repos=data.repositories;
      repoOptions($('#taskRepoSelect'));repoOptions($('#issueRepoFilter'),true);repoOptions($('#codeRepoSelect'));repoOptions($('#defaultRepoSelect'));repoOptions($('#aiRepoSelect'));
      const selected=read(STORE.defaultRepo,'planetbintang/.L');for(const id of ['taskRepoSelect','codeRepoSelect','defaultRepoSelect','aiRepoSelect'])if([...$(`#${id}`).options].some(o=>o.value===selected))$(`#${id}`).value=selected;
      $('#wsRepoCount').textContent=fmt.format(repos.length);$('#wsPagesCount').textContent=fmt.format(data.pagesEnabledCount||0);
      $('#issueRepoFilter').value='all';
      renderAnalytics();
    } catch(error) { $('#wsRepoCount').textContent='—';$('#wsPagesCount').textContent='—';notify(`Workspace snapshot tidak dimuat: ${error.message}`,'error'); }
    renderTasks();renderIssues();renderAiHistory();
    let current='projects';try{current=localStorage.getItem('pb-workspace-current-view')||'projects';}catch{}showView(current);
  }
  init();
})();
