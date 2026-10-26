(() => {
  'use strict';
  const DB_NAME = 'planetbintang-media-library';
  const DB_VERSION = 1;
  const STORE = 'assets';
  const $ = (s, r = document) => r.querySelector(s);
  const state = { db: null, items: [], selectedId: null, query: '', kind: 'all', busy: false, objectUrl: null };
  const ui = {};
  const bytes = n => { n = Math.max(0, Number(n) || 0); if (n < 1024) return n + ' B'; const units = ['KB','MB','GB','TB']; let i=-1; do { n/=1024; i++; } while(n>=1024&&i<units.length-1); return n.toLocaleString('id-ID',{maximumFractionDigits:1})+' '+units[i]; };
  const safeText = v => String(v ?? '');
  function openDb() {
    if (state.db) return Promise.resolve(state.db);
    return new Promise((resolve,reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => { const db=req.result; if(!db.objectStoreNames.contains(STORE)){const store=db.createObjectStore(STORE,{keyPath:'id'});store.createIndex('createdAt','createdAt');store.createIndex('kind','kind');} };
      req.onsuccess=()=>{state.db=req.result;state.db.onversionchange=()=>{state.db.close();state.db=null};resolve(state.db)};
      req.onerror=()=>reject(req.error||new Error('Database media tidak dapat dibuka.'));
    });
  }
  function reqValue(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Operasi database gagal.'))})}
  async function allRecords(){
    const db=await openDb(), tx=db.transaction(STORE,'readonly');
    const records=await reqValue(tx.objectStore(STORE).getAll());
    return records.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  async function getRecord(id){const db=await openDb();return reqValue(db.transaction(STORE,'readonly').objectStore(STORE).get(id))}
  async function putRecord(record){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||new Error('Penyimpanan media gagal.'))})}
  async function deleteRecord(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||new Error('Penghapusan gagal.'))})}
  function classify(file){
    const type=(file.type||'').toLowerCase(), ext=(file.name.split('.').pop()||'').toLowerCase();
    if(type.startsWith('image/')||['jpg','jpeg','png','gif','webp','avif','bmp','svg','heic','heif'].includes(ext))return 'image';
    if(type.startsWith('video/')||['mp4','webm','mov','m4v','mkv','avi','mpeg','mpg','ogv','3gp'].includes(ext))return 'video';
    if(type.startsWith('audio/')||['mp3','wav','ogg','m4a','aac','flac','opus'].includes(ext))return 'audio';
    if(type==='application/pdf'||ext==='pdf')return 'document';
    if(['doc','docx','odt','rtf','xls','xlsx','ods','ppt','pptx','odp'].includes(ext))return 'office';
    if(type.startsWith('text/')||['txt','md','csv','json','xml','srt','vtt','log'].includes(ext))return 'text';
    return 'file';
  }
  function kindLabel(k){return ({image:'Gambar',video:'Video / film',audio:'Audio',document:'PDF / dokumen',office:'Dokumen Office',text:'Teks / subtitle',remote:'URL eksternal',file:'Berkas'})[k]||k}
  function formatDate(s){const d=new Date(s);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(d)}
  function status(message){if(ui.status)ui.status.textContent=message}
  function clearObjectUrl(){if(state.objectUrl){URL.revokeObjectURL(state.objectUrl);state.objectUrl=null}}
  function revokePreview(){clearObjectUrl();if(ui.preview)ui.preview.replaceChildren()}
  function filtered(){return state.items.filter(item=>(state.kind==='all'||item.kind===state.kind)&&(!state.query||(item.name+' '+item.type+' '+item.kind+' '+(item.url||'')).toLowerCase().includes(state.query)))}
  function iconFor(kind){return ({image:'IMAGE',video:'FILM',audio:'AUDIO',document:'PDF',office:'DOC',text:'TEXT',remote:'LINK',file:'FILE'})[kind]||'FILE'}
  function thumb(item){
    const box=document.createElement('div');box.className='media-thumb';
    if(item.kind==='image'&&item.url){const img=document.createElement('img');img.loading='lazy';img.alt='';img.src=item.url;box.append(img)}
    else {box.textContent=iconFor(item.kind)}
    return box;
  }
  function render(){
    if(!ui.grid)return;
    const items=filtered();ui.grid.replaceChildren();
    if(!items.length){const empty=document.createElement('div');empty.className='media-empty';empty.textContent=state.items.length?'Tidak ada media yang cocok dengan filter.':'Belum ada aset. Unggah file lokal atau tambahkan URL HTTPS untuk memulai.';ui.grid.append(empty)}
    items.forEach(item=>{
      const card=document.createElement('article');card.className='media-card';card.setAttribute('aria-current',String(item.id===state.selectedId));
      const select=document.createElement('button');select.type='button';select.className='media-card-select';select.setAttribute('aria-label','Pilih '+item.name);
      select.append(thumb(item));const kind=document.createElement('span');kind.className='media-kind';kind.textContent=kindLabel(item.kind);const name=document.createElement('span');name.className='media-name';name.textContent=item.name;const meta=document.createElement('span');meta.className='media-meta';meta.textContent=(item.size?bytes(item.size)+' · ':'')+formatDate(item.createdAt);select.append(kind,name,meta);select.addEventListener('click',()=>selectItem(item.id));card.append(select);
      const actions=document.createElement('div');actions.className='media-card-actions';const open=document.createElement('button');open.type='button';open.textContent='Buka';open.addEventListener('click',()=>selectItem(item.id));actions.append(open);
      if(item.kind==='remote'&&item.url){const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Tab baru';actions.append(link)}
      const remove=document.createElement('button');remove.type='button';remove.textContent='Hapus';remove.addEventListener('click',()=>removeItem(item.id));actions.append(remove);card.append(actions);ui.grid.append(card);
    });
    ui.count.textContent=items.length.toLocaleString('id-ID')+' item ditampilkan';
    ui.total.textContent=state.items.length.toLocaleString('id-ID');
    ui.localCount.textContent=state.items.filter(x=>!x.remote).length.toLocaleString('id-ID');
    ui.remoteCount.textContent=state.items.filter(x=>x.remote).length.toLocaleString('id-ID');
    ui.totalBytes.textContent=bytes(state.items.reduce((n,x)=>n+(x.size||0),0));
    if(state.selectedId&&!items.some(x=>x.id===state.selectedId))state.selectedId=null;
    if(state.selectedId===null&&items.length)state.selectedId=items[0].id;
    if(state.selectedId!==null)renderInspector(state.selectedId);else resetInspector();
  }
  function row(label,value){const el=document.createElement('div');el.className='media-detail-row';const a=document.createElement('span');a.textContent=label;const b=document.createElement('span');b.textContent=value;el.append(a,b);return el}
  async function renderInspector(id){
    const item=state.items.find(x=>x.id===id);if(!item)return resetInspector();
    ui.title.textContent=item.name;ui.kind.textContent=kindLabel(item.kind);ui.details.replaceChildren(row('Jenis',item.type||kindLabel(item.kind)),row('Ukuran',item.size?bytes(item.size):'URL eksternal'),row('Ditambahkan',formatDate(item.createdAt)),row('Penyimpanan',item.remote?'URL saja — konten tetap di server asal':'IndexedDB lokal'));
    revokePreview();
    const token=id;
    try{
      const current=item.remote?item:await getRecord(id);if(state.selectedId!==token)return;
      const url=current.remote?current.url:(current.blob?URL.createObjectURL(current.blob):'');
      if(!current.remote&&url)state.objectUrl=url;
      if(!url){ui.preview.textContent='Pratinjau tidak tersedia.';return}
      let node;
      if(item.kind==='image'){node=document.createElement('img');node.alt=item.name;node.loading='lazy';node.src=url}
      else if(item.kind==='video'){node=document.createElement('video');node.controls=true;node.preload='metadata';node.playsInline=true;node.src=url}
      else if(item.kind==='audio'){node=document.createElement('audio');node.controls=true;node.preload='metadata';node.src=url}
      else if(item.kind==='document'&&(/\.pdf(?:$|[?#])/i.test(item.name)||/\.pdf(?:$|[?#])/i.test(url)||item.type==='application/pdf')){node=document.createElement('iframe');node.title='Pratinjau PDF '+item.name;node.loading='lazy';node.src=url}
      else if(item.kind==='text'&&!item.remote&&item.size<=2*1024*1024){node=document.createElement('pre');node.textContent=await current.blob.text();if(state.selectedId!==token)return}
      else {node=document.createElement('div');node.className='media-preview-empty';node.textContent=item.kind==='office'?'Pratinjau Office bergantung pada aplikasi yang mendukung format tersebut. Gunakan Unduh untuk membuka berkas.':'Format ini tidak dapat dipratinjau langsung. Gunakan Buka / Unduh.'}
      if(node)ui.preview.replaceChildren(node);
      ui.actions.replaceChildren();
      if(current.remote){const a=document.createElement('a');a.href=current.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Buka URL';ui.actions.append(a)}
      else {const a=document.createElement('a');a.href=url;a.download=item.name;a.textContent='Unduh';a.className='secondary';ui.actions.append(a)}
      if(item.kind==='video'||item.kind==='audio'){const note=document.createElement('span');note.className='media-preview-empty';note.textContent='Pemutaran memakai kontrol native browser. Format yang tidak didukung browser perlu dikonversi ke MP4/H.264 atau WebM.';ui.preview.append(note)}
    }catch(error){ui.preview.replaceChildren();const msg=document.createElement('div');msg.className='media-preview-empty';msg.textContent='Tidak dapat membuka pratinjau: '+error.message;ui.preview.append(msg)}
  }
  function resetInspector(){if(!ui.title)return;revokePreview();ui.title.textContent='Pilih aset';ui.kind.textContent='LIBRARY';ui.details.replaceChildren(row('Status','Belum ada pilihan'));ui.preview.innerHTML='<div class="media-preview-empty">Pilih gambar, film, audio, PDF, atau dokumen untuk melihat pratinjau.</div>';ui.actions.replaceChildren()}
  function selectItem(id){state.selectedId=id;render()}
  async function removeItem(id){const item=state.items.find(x=>x.id===id);if(!item||!confirm('Hapus '+item.name+' dari katalog media lokal?'))return;try{await deleteRecord(id);if(state.selectedId===id)state.selectedId=null;await refresh();status('Aset dihapus dari katalog media lokal.')}catch(e){status('Gagal menghapus: '+e.message)}}
  async function refresh(){state.items=await allRecords();render();await updateStorage()}
  async function updateStorage(){if(!navigator.storage?.estimate){ui.storage.textContent='Kuota browser tidak tersedia';return}try{const x=await navigator.storage.estimate();ui.storage.textContent=bytes(x.usage||0)+' digunakan · '+bytes(x.quota||0)+' kuota';if(x.quota&&x.usage/x.quota>.85)ui.warning.hidden=false}catch{ui.storage.textContent='Kuota browser tidak dapat dibaca'}}
  async function importFiles(files){
    if(state.busy)return;const list=[...files].filter(f=>f instanceof File);if(!list.length)return;
    state.busy=true;ui.upload.disabled=true;ui.progressWrap.hidden=false;
    let success=0,failed=0;const total=list.length;
    for(let i=0;i<list.length;i++){
      const file=list[i];
      try{
        if(navigator.storage?.estimate){const est=await navigator.storage.estimate();const free=Math.max(0,(est.quota||0)-(est.usage||0));if(est.quota&&file.size>free*0.9)throw new Error('Kuota browser tidak cukup. File '+bytes(file.size)+', ruang tersedia kira-kira '+bytes(free)+'.')}
        const record={id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2),name:file.name,type:file.type||'application/octet-stream',kind:classify(file),size:file.size,createdAt:new Date().toISOString(),remote:false,blob:file};
        await putRecord(record);success++;
      }catch(error){failed++;console.error('Media import failed:',file.name,error);status('Gagal menyimpan '+file.name+': '+error.message)}
      const pct=Math.round((i+1)/total*100);ui.progress.style.width=pct+'%';ui.progressText.textContent=(i+1)+'/'+total+' file · '+pct+'%';
    }
    ui.upload.disabled=false;ui.progressWrap.hidden=true;ui.fileInput.value='';state.busy=false;await refresh();status('Impor selesai: '+success+' berhasil, '+failed+' gagal. Aset tersimpan di browser ini.');
  }
  async function addRemote(){
    const raw=ui.urlInput.value.trim();if(!raw)return;
    let url;try{url=new URL(raw);if(url.protocol!=='https:')throw new Error('Hanya URL HTTPS yang diizinkan.')}catch(e){status('URL tidak valid: '+e.message);return}
    const name=ui.remoteName.value.trim()||decodeURIComponent(url.pathname.split('/').pop()||url.hostname);
    const ext=(name.split('.').pop()||'').toLowerCase();let kind=classify({type:'',name});
    if(kind==='file')kind='remote';
    const record={id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2),name,type:'URL eksternal',kind:kind==='remote'?'remote':kind,size:0,createdAt:new Date().toISOString(),remote:true,url:url.href};
    try{await putRecord(record);ui.urlInput.value='';ui.remoteName.value='';await refresh();selectItem(record.id);status('URL HTTPS ditambahkan ke katalog lokal. File tetap di server sumber.')}catch(e){status('Gagal menambahkan URL: '+e.message)}
  }
  function bind(){
    Object.assign(ui,{grid:$('#mediaGrid'),count:$('#mediaCount'),total:$('#mediaTotalCount'),localCount:$('#mediaLocalCount'),remoteCount:$('#mediaRemoteCount'),totalBytes:$('#mediaTotalBytes'),status:$('#mediaStatusText'),storage:$('#mediaStorageText'),warning:$('#mediaQuotaWarning'),search:$('#mediaSearch'),filter:$('#mediaTypeFilter'),fileInput:$('#mediaFileInput'),upload:$('#mediaUploadButton'),progressWrap:$('#mediaProgressWrap'),progress:$('#mediaProgressBar'),progressText:$('#mediaProgressText'),urlInput:$('#mediaUrlInput'),remoteName:$('#mediaRemoteName'),addUrl:$('#mediaAddUrlButton'),title:$('#mediaInspectorTitle'),kind:$('#mediaInspectorKind'),details:$('#mediaInspectorDetails'),preview:$('#mediaPreview'),actions:$('#mediaInspectorActions'),drop:$('#mediaDropzone')});
    if(!ui.grid)return;
    ui.fileInput.addEventListener('change',()=>importFiles(ui.fileInput.files));
    ui.upload.addEventListener('click',()=>ui.fileInput.click());
    ui.search.addEventListener('input',()=>{state.query=ui.search.value.trim().toLowerCase();render()});
    ui.filter.addEventListener('change',()=>{state.kind=ui.filter.value;render()});
    ui.addUrl.addEventListener('click',addRemote);
    ui.urlInput.addEventListener('keydown',e=>{if(e.key==='Enter')addRemote()});
    ['dragenter','dragover'].forEach(type=>ui.drop.addEventListener(type,e=>{e.preventDefault();ui.drop.classList.add('is-dragover')}));
    ['dragleave','drop'].forEach(type=>ui.drop.addEventListener(type,e=>{e.preventDefault();ui.drop.classList.remove('is-dragover')}));
    ui.drop.addEventListener('drop',e=>importFiles(e.dataTransfer?.files||[]));
    window.addEventListener('beforeunload',clearObjectUrl);
    refresh().then(()=>status('Media library siap. Penyimpanan bersifat lokal pada browser ini.')).catch(e=>status('Media library gagal dibuka: '+e.message));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.PBMediaLibrary={refresh,importFiles,selectItem};
})();