/* VMDESKTOPREIC · File Manajer REIC / resolution 01 */
(()=>{'use strict';
const $=s=>document.querySelector(s);
window.initPlanetFileManager=function(start='Home Folder'){
 const root=$('#fileManagerApp');if(!root)return;
 const systemRoots=['acct','sys','system_ext','cache','config','media','data'];
 const homeFolders=['Desktop','Documents','Downloads','Music','Pictures','Public','Templates','Videos','Work'];
 const base=[...systemRoots,'home'];
 const key='pb-vmdesktop-filemanager-v1';
 const seed=()=>({folders:[...systemRoots.map(name=>({name,type:'folder',path:'/'+name,children:[],files:[]})),{name:'home',type:'folder',path:'/home',children:homeFolders.map(name=>({name,type:'folder',path:'/home/'+name,children:[],files:[]})),files:[{name:'konqueror-web-browser.png',type:'file',size:406937,path:'/home/konqueror-web-browser.png',kind:'image'}]}],files:[]});
 let store;try{store=JSON.parse(localStorage.getItem(key))||seed()}catch(e){store=seed()}
 // Migrasi struktur lama /home/martin: direktori sistem kembali ke root virtual,
 // sedangkan direktori pribadi dan berkas tetap berada di /home.
 if(store.folders?.some(f=>String(f.path||'').startsWith('/home/martin/'))){const oldFolders=store.folders;const roots=[],personal=[];oldFolders.forEach(f=>{const n=f.name;f.path=systemRoots.includes(n)?'/'+n:'/home/'+n;(systemRoots.includes(n)?roots:personal).push(f)});const oldFiles=store.files||[];oldFiles.forEach(f=>f.path='/home/'+f.name);store.folders=[...roots,{name:'home',type:'folder',path:'/home',children:personal,files:oldFiles}];store.files=[];try{localStorage.setItem(key,JSON.stringify(store))}catch(e){}}
 let path='/',selected=null,query='',mode='icons',history=[path],historyAt=0;
 let repoTreeLoading=false,repoTreeReady=false,repoTreeError='';
 const repoRoot={name:'CODE',type:'folder',path:'/CODE',children:[],files:[],source:'github'};
 async function loadRepositoryTree(){
  if(repoTreeLoading||repoTreeReady)return;repoTreeLoading=true;status('Mengindeks folder dan file repositori GitHub planetbintang/.L…');
  try{
   const response=await fetch('https://api.github.com/repos/planetbintang/.L/git/trees/io?recursive=1',{headers:{Accept:'application/vnd.github+json'},cache:'force-cache'});
   if(!response.ok)throw Error('GitHub API HTTP '+response.status);
   const data=await response.json();if(data.truncated)throw Error('Indeks GitHub terpotong; tampilkan struktur parsial.');
   const dirs=new Map([['',repoRoot]]);
   const rows=Array.isArray(data.tree)?data.tree:[];
   rows.filter(x=>x.type==='tree').sort((a,b)=>a.path.split('/').length-b.path.split('/').length).forEach(x=>{
    const parts=x.path.split('/'),name=parts.pop(),parentPath=parts.join('/'),parent=dirs.get(parentPath);
    if(!parent)return;const folder={name,type:'folder',path:'/CODE/'+x.path,children:[],files:[],source:'github'};parent.children.push(folder);dirs.set(x.path,folder);
   });
   rows.filter(x=>x.type==='blob').forEach(x=>{
    const parts=x.path.split('/'),name=parts.pop(),parent=dirs.get(parts.join('/'));if(!parent)return;
    parent.files.push({name,type:'file',size:x.size||0,path:'/CODE/'+x.path,kind:/\\.(png|jpe?g|gif|webp|svg)$/i.test(name)?'image':'file',sha:x.sha,sourceUrl:'https://github.com/planetbintang/.L/blob/io/'+x.path});
   });
   repoRoot.children.sort((a,b)=>a.name.localeCompare(b.name));store.folders=store.folders.filter(x=>x.name!=='CODE');store.folders.push(repoRoot);repoTreeReady=true;
   status(rows.length.toLocaleString('id-ID')+' entri repositori berhasil dimuat ke CODE.');draw();
  }catch(error){repoTreeError=error.message;status('Indeks CODE belum dapat dimuat: '+error.message);draw();}
  finally{repoTreeLoading=false;}
 }
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(store));status('Perubahan disimpan pada penyimpanan lokal browser.')}catch(e){status('Penyimpanan lokal penuh atau tidak tersedia.')}};
 const current=()=>path==='/'?{folders:store.folders,files:store.files}:findFolder(path);
 function findFolder(p){const walk=(folders)=>{for(const f of folders){if(f.path===p)return f;if(f.children){const x=walk(f.children);if(x)return x}}};return walk(store.folders)}
 const status=t=>{const el=$('#fmStatus');if(el)el.textContent=t};
 function go(p,add=true){if(p==='/CODE'&&!repoTreeReady){path=p;selected=null;draw();loadRepositoryTree();return}if(p!== '/'&&!findFolder(p)){status('Folder tidak ditemukan.');return}path=p;selected=null;if(add){history=history.slice(0,historyAt+1);history.push(path);historyAt++}draw()}
 function entries(){const c=current();return c?[...(c.folders||[]),...(c.files||[])]:[]}
 function draw(){const c=current()||{folders:[],files:[]};const items=entries().filter(x=>!query||x.name.toLowerCase().includes(query.toLowerCase()));$('#fmPath').value=path;$('#fmCrumbs').innerHTML=path.split('/').filter(Boolean).map((x,i)=>'<button data-crumb="'+i+'">'+esc(x)+'</button>').join('<span>›</span>');$('#fmTree').innerHTML='<button class="fm-tree-root" data-path="/">▣ Beranda File</button>'+store.folders.map(f=>'<button class="fm-tree-item '+(path===f.path?'active':'')+'" data-path="'+esc(f.path)+'"><span>▰</span>'+esc(f.name)+'</button>').join('')+(repoTreeLoading?'<small class="fm-repo-state">MENGINDEKS GITHUB…</small>':repoTreeError?'<small class="fm-repo-state">'+esc(repoTreeError)+'</small>':'');$('#fmItems').classList.toggle('list-mode',mode==='list');$('#fmItems').innerHTML=items.map(x=>'<button class="fm-entry '+(selected===x.path?'selected':'')+'" data-entry="'+esc(x.path)+'"><span class="fm-entry-icon" data-kind="'+(x.type==='folder'?'folder':x.kind==='image'?'image':'file')+'">'+(x.type==='folder'?'<i aria-hidden="true"></i>':x.kind==='image'?'<i aria-hidden="true">▧</i>':'<i aria-hidden="true">▤</i>')+'</span><b>'+esc(x.name)+'</b>'+(mode==='list'?'<small>'+(x.type==='folder'?'Folder':format(x.size))+'</small>':'')+'</button>').join('')||'<div class="fm-empty">Folder ini kosong</div>';$('#fmCount').textContent=items.filter(x=>x.type==='folder').length+' Folder, '+items.filter(x=>x.type==='file').length+' File';$('#fmItems').querySelectorAll('[data-entry]').forEach(b=>{b.onclick=()=>{selected=b.dataset.entry;draw()};b.ondblclick=()=>{const x=entries().find(y=>y.path===b.dataset.entry);if(x?.type==='folder')go(x.path);else if(x.sourceUrl){status('Berkas repositori dipilih · membuka sumber GitHub.');window.open(x.sourceUrl,'_blank','noopener')}else status('File dipilih: '+x.name+' · pratinjau lokal belum tersedia untuk format ini.')};});$('#fmTree').querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>go(b.dataset.path));$('#fmCrumbs').querySelectorAll('[data-crumb]').forEach(b=>b.onclick=()=>go('/'+path.split('/').filter(Boolean).slice(0,Number(b.dataset.crumb)+1).join('/')))}
 const format=n=>n?((n/1024).toFixed(1)+' KB'):'—';
 function addFolder(){const name=prompt('Nama folder baru:');if(!name?.trim())return;const c=current();if(!c.folders)c.folders=[];if(entries().some(x=>x.name.toLowerCase()===name.trim().toLowerCase())){status('Nama sudah digunakan.');return}c.folders.push({name:name.trim(),type:'folder',path:path+'/'+name.trim(),children:[],files:[]});persist();draw()}
 function rename(){if(!selected)return status('Pilih folder atau file terlebih dahulu.');const item=entries().find(x=>x.path===selected);if(!item)return;const name=prompt('Nama baru:',item.name);if(!name?.trim())return;item.name=name.trim();item.path=path+'/'+item.name;if(item.children)item.children.forEach(x=>x.path=item.path+'/'+x.name);selected=null;persist();draw()}
 function remove(){if(!selected)return status('Pilih folder atau file terlebih dahulu.');const c=current(),item=entries().find(x=>x.path===selected);if(!item||!confirm('Hapus '+item.name+' dari ruang file lokal?'))return;const list=item.type==='folder'?c.folders:c.files;const i=list.indexOf(item);if(i>=0)list.splice(i,1);selected=null;persist();draw()}
 function upload(files){const c=current();if(!c.files)c.files=[];[...files].forEach(f=>c.files.push({name:f.name,type:'file',size:f.size,path:path+'/'+f.name,kind:f.type.startsWith('image/')?'image':'file'}));persist();draw()}
 $('#fmBack').onclick=()=>{if(historyAt>0){historyAt--;go(history[historyAt],false)}};
 $('#fmForward').onclick=()=>{if(historyAt<history.length-1){historyAt++;go(history[historyAt],false)}};
 $('#fmUp').onclick=()=>{if(path!=='/')go(path.split('/').slice(0,-1).join('/')||'/')};
 $('#fmHome').onclick=()=>go('/');
 $('#fmNewFolder').onclick=addFolder;$('#fmRename').onclick=rename;$('#fmDelete').onclick=remove;
 $('#fmUpload').onclick=()=>$('#fmUploadInput').click();$('#fmUploadInput').onchange=e=>upload(e.target.files);
 $('#fmSearch').oninput=e=>{query=e.target.value;draw()};
 $('#fmView').onclick=()=>{mode=mode==='icons'?'list':'icons';draw()};
 $('#fmPath').onkeydown=e=>{if(e.key==='Enter')go(e.target.value)};
 $('#fmRefresh').onclick=()=>draw();
 $('#fmDownload').onclick=()=>{if(!selected)return status('Pilih file untuk mengunduh.');const item=entries().find(x=>x.path===selected);status(item?.type==='file'?'File sumber lokal belum tersedia untuk diunduh ulang.':'Pilih sebuah file, bukan folder.')};
 go(start==='Beranda File'?'/':(base.includes(start)?'/'+start:'/'));\n loadRepositoryTree();
};
})();