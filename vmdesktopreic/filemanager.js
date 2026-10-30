/* VMDESKTOPREIC · File Manager REIC / resolution 01 */
(()=>{'use strict';
const $=s=>document.querySelector(s);
window.initPlanetFileManager=function(start='Home Folder'){
 const root=$('#fileManagerApp');if(!root)return;
 const base=['Desktop','Documents','Downloads','Music','Pictures','Public','Templates','Videos','Work','acct','sys','system_ext','cache','config','media','data'];
 const key='pb-vmdesktop-filemanager-v1';
 const seed=()=>({folders:base.map(name=>({name,type:'folder',path:'/home/martin/'+name,children:[]})),files:[{name:'konqueror-web-browser.png',type:'file',size:406937,path:'/home/martin/konqueror-web-browser.png',kind:'image'}]});
 let store;try{store=JSON.parse(localStorage.getItem(key))||seed()}catch(e){store=seed()}
 let path='/home/martin',selected=null,query='',mode='icons',history=[path],historyAt=0;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(store));status('Perubahan disimpan pada penyimpanan lokal browser.')}catch(e){status('Penyimpanan lokal penuh atau tidak tersedia.')}};
 const current=()=>path==='/home/martin'?{folders:store.folders,files:store.files}:findFolder(path);
 function findFolder(p){const walk=(folders)=>{for(const f of folders){if(f.path===p)return f;if(f.children){const x=walk(f.children);if(x)return x}}};return walk(store.folders)}
 const status=t=>{const el=$('#fmStatus');if(el)el.textContent=t};
 function go(p,add=true){if(p!== '/home/martin'&&!findFolder(p)){status('Folder tidak ditemukan.');return}path=p;selected=null;if(add){history=history.slice(0,historyAt+1);history.push(path);historyAt++}draw()}
 function entries(){const c=current();return c?[...(c.folders||[]),...(c.files||[])]:[]}
 function draw(){const c=current()||{folders:[],files:[]};const items=entries().filter(x=>!query||x.name.toLowerCase().includes(query.toLowerCase()));$('#fmPath').value=path;$('#fmCrumbs').innerHTML=path.split('/').filter(Boolean).map((x,i)=>'<button data-crumb="'+i+'">'+esc(x)+'</button>').join('<span>›</span>');$('#fmTree').innerHTML='<button class="fm-tree-root" data-path="/home/martin">▣ Beranda</button>'+store.folders.map(f=>'<button class="fm-tree-item '+(path===f.path?'active':'')+'" data-path="'+esc(f.path)+'"><span>▰</span>'+esc(f.name)+'</button>').join('');$('#fmItems').classList.toggle('list-mode',mode==='list');$('#fmItems').innerHTML=items.map(x=>'<button class="fm-entry '+(selected===x.path?'selected':'')+'" data-entry="'+esc(x.path)+'"><span class="fm-entry-icon">'+(x.type==='folder'?'📁':x.kind==='image'?'🖼️':'📄')+'</span><b>'+esc(x.name)+'</b>'+(mode==='list'?'<small>'+(x.type==='folder'?'Folder':format(x.size))+'</small>':'')+'</button>').join('')||'<div class="fm-empty">Folder ini kosong</div>';$('#fmCount').textContent=items.filter(x=>x.type==='folder').length+' Folder, '+items.filter(x=>x.type==='file').length+' File';$('#fmItems').querySelectorAll('[data-entry]').forEach(b=>{b.onclick=()=>{selected=b.dataset.entry;draw()};b.ondblclick=()=>{const x=entries().find(y=>y.path===b.dataset.entry);if(x?.type==='folder')go(x.path);else status('File dipilih: '+x.name+' · pratinjau lokal belum tersedia untuk format ini.')};});$('#fmTree').querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>go(b.dataset.path));$('#fmCrumbs').querySelectorAll('[data-crumb]').forEach(b=>b.onclick=()=>go('/'+path.split('/').filter(Boolean).slice(0,Number(b.dataset.crumb)+1).join('/')))}
 const format=n=>n?((n/1024).toFixed(1)+' KB'):'—';
 function addFolder(){const name=prompt('Nama folder baru:');if(!name?.trim())return;const c=current();if(!c.folders)c.folders=[];if(entries().some(x=>x.name.toLowerCase()===name.trim().toLowerCase())){status('Nama sudah digunakan.');return}c.folders.push({name:name.trim(),type:'folder',path:path+'/'+name.trim(),children:[],files:[]});persist();draw()}
 function rename(){if(!selected)return status('Pilih folder atau file terlebih dahulu.');const item=entries().find(x=>x.path===selected);if(!item)return;const name=prompt('Nama baru:',item.name);if(!name?.trim())return;item.name=name.trim();item.path=path+'/'+item.name;if(item.children)item.children.forEach(x=>x.path=item.path+'/'+x.name);selected=null;persist();draw()}
 function remove(){if(!selected)return status('Pilih folder atau file terlebih dahulu.');const c=current(),item=entries().find(x=>x.path===selected);if(!item||!confirm('Hapus '+item.name+' dari ruang file lokal?'))return;const list=item.type==='folder'?c.folders:c.files;const i=list.indexOf(item);if(i>=0)list.splice(i,1);selected=null;persist();draw()}
 function upload(files){const c=current();if(!c.files)c.files=[];[...files].forEach(f=>c.files.push({name:f.name,type:'file',size:f.size,path:path+'/'+f.name,kind:f.type.startsWith('image/')?'image':'file'}));persist();draw()}
 $('#fmBack').onclick=()=>{if(historyAt>0){historyAt--;go(history[historyAt],false)}};
 $('#fmForward').onclick=()=>{if(historyAt<history.length-1){historyAt++;go(history[historyAt],false)}};
 $('#fmUp').onclick=()=>{if(path!=='/home/martin')go(path.split('/').slice(0,-1).join('/')||'/home/martin')};
 $('#fmHome').onclick=()=>go('/home/martin');
 $('#fmNewFolder').onclick=addFolder;$('#fmRename').onclick=rename;$('#fmDelete').onclick=remove;
 $('#fmUpload').onclick=()=>$('#fmUploadInput').click();$('#fmUploadInput').onchange=e=>upload(e.target.files);
 $('#fmSearch').oninput=e=>{query=e.target.value;draw()};
 $('#fmView').onclick=()=>{mode=mode==='icons'?'list':'icons';draw()};
 $('#fmPath').onkeydown=e=>{if(e.key==='Enter')go(e.target.value)};
 $('#fmRefresh').onclick=()=>draw();
 $('#fmDownload').onclick=()=>{if(!selected)return status('Pilih file untuk mengunduh.');const item=entries().find(x=>x.path===selected);status(item?.type==='file'?'File sumber lokal belum tersedia untuk diunduh ulang.':'Pilih sebuah file, bukan folder.')};
 go(start==='Beranda File'?'/home/martin':(base.includes(start)?'/home/martin/'+start:'/home/martin'));
};
})();