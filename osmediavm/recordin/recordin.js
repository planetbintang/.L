(()=>{'use strict';
const $=s=>document.querySelector(s),list=$('#list'),search=$('#search'),view=$('#viewer'),source=$('#source'),back=$('#back'),count=$('#count');
let entries=[],currentFile='';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const ext=f=>(f.split('.').pop()||'').toLowerCase();
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function setMode(mode){document.querySelectorAll('[data-view-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.viewMode===mode));document.querySelectorAll('[data-view-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.viewPanel!==mode))}
function showSource(text){source.textContent=text}
function renderHtml(text,file,meta){
 const frame=el('iframe','reic-preview');frame.title='Pratinjau '+file;frame.setAttribute('sandbox','allow-forms allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');
 const base=new URL('./'+file,location.href);base.pathname=base.pathname.slice(0,base.pathname.lastIndexOf('/')+1);
 let html=text;
 if(/<html[\s>]/i.test(text)){html=text.replace(/<head([^>]*)>/i,'<head$1><base href="'+esc(base.href)+'">');if(!/<head[\s>]/i.test(html))html='<base href="'+esc(base.href)+'">'+html}
 else html='<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+esc(base.href)+'"></head><body>'+text+'</body></html>';
 const stylePath=(meta.match(/^\s*style:\s*(.+)\s*$/im)||[])[1];
 const scriptPath=(meta.match(/^\s*script:\s*(.+)\s*$/im)||[])[1];
 if(stylePath){const link='<link rel="stylesheet" href="'+esc(stylePath.trim())+'">';html=/<head[^>]*>/i.test(html)?html.replace(/<head[^>]*>/i,m=>m+link):html.replace(/<html[^>]*>/i,m=>m+'<head>'+link+'</head>');}
 if(scriptPath){const script='<script src="'+esc(scriptPath.trim())+'"><\/script>';html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,script+'</body>'):html+script;}
 frame.srcdoc=html;return frame
}
function renderMarkdown(text){
 const root=el('article','markdown-preview');
 text.split(/\r?\n/).forEach(line=>{
  let m;if(!line.trim()){root.append(el('div','md-space'));return}
  if((m=/^(#{1,6})\s+(.*)$/.exec(line))){root.append(el('h'+m[1].length,'',m[2]));return}
  if(/^\s*[-*]\s+/.test(line)){root.append(el('p','md-list','• '+line.replace(/^\s*[-*]\s+/,'')));return}
  if(/^>\s?/.test(line)){root.append(el('blockquote','',line.replace(/^>\s?/,'')));return}
  root.append(el('p','',line))
 });return root
}
function render(text,file){
 const workspace=$('#componentWorkspace');workspace.replaceChildren();
 const type=ext(file),looksHtml=type==='html'||type==='htm'||/<(?:!doctype\s+html|html|body|section|main|article|div|header|nav|form|table|svg)(?:\s|>)/i.test(text);
 const header=text.match(/^---\s*REIC[^\n]*---\s*([\s\S]*?)---\s*END REIC HEADER\s*---/i);
 const body=header?text.slice(header[0].length).trim():text;
 const info=el('div','runtime-info');
 info.append(el('span','runtime-chip',type.toUpperCase()+' · '+(looksHtml?'pratinjau antarmuka':type==='json'?'data terstruktur':type==='md'||type==='markdown'?'dokumen':'teks sumber')));
 workspace.append(info);
 const toolbar=el('div','runtime-toolbar');
 const preview=el('button','selected','Pratinjau');preview.type='button';preview.dataset.viewMode='preview';
 const raw=el('button','','Sumber');raw.type='button';raw.dataset.viewMode='source';
 toolbar.append(preview,raw);workspace.append(toolbar);
 const previewPanel=el('section','runtime-panel');previewPanel.dataset.viewPanel='preview';
 const sourcePanel=el('section','runtime-panel hidden');sourcePanel.dataset.viewPanel='source';
 if(looksHtml){previewPanel.append(renderHtml(body,file,header?header[1]:''))}
 else if(type==='json'){try{const pre=el('pre','code-preview',JSON.stringify(JSON.parse(body),null,2));previewPanel.append(pre)}catch{previewPanel.append(el('pre','code-preview',body))}}
 else if(type==='md'||type==='markdown'||type==='txt'){previewPanel.append(type==='md'||type==='markdown'?renderMarkdown(body):el('pre','code-preview',body))}
 else {previewPanel.append(el('pre','code-preview',body))}
 sourcePanel.append(el('pre','code-preview',text));
 workspace.append(previewPanel,sourcePanel);
 const choose=mode=>{setMode(mode);previewPanel.classList.toggle('hidden',mode!=='preview');sourcePanel.classList.toggle('hidden',mode!=='source')};
 preview.addEventListener('click',()=>choose('preview'));raw.addEventListener('click',()=>choose('source'));
 showSource(text);$('#runtimeOutput').textContent=header?'Metadata REIC terdeteksi. Pratinjau berjalan dalam iframe terisolasi; kode sumber tersedia pada tab Sumber.':'Berkas dimuat. Pratinjau dipilih berdasarkan tipe konten.';
}
async function openFile(file){
 try{
  currentFile=file;const response=await fetch('./'+file.split('/').map(encodeURIComponent).join('/'),{cache:'no-cache'});
  if(!response.ok)throw Error('HTTP '+response.status+' saat membaca '+file);
  const text=await response.text();$('#viewTitle').textContent=file;view.classList.remove('hidden');list.parentElement.classList.add('hidden');
  history.replaceState(null,'','#'+encodeURIComponent(file));render(text,file);
 }catch(e){$('#componentWorkspace').replaceChildren(el('p','runtime-error','Berkas gagal dibuka: '+e.message));view.classList.remove('hidden');list.parentElement.classList.add('hidden');showSource('Gagal membuka berkas: '+e.message)}
}
function draw(){
 const term=search.value.trim().toLocaleLowerCase('id');
 const found=entries.filter(x=>(x.file+' '+x.title+' '+x.source+' '+(x.type||'')).toLocaleLowerCase('id').includes(term));
 list.replaceChildren(...found.map(x=>{const a=el('a','item');a.href='#'+encodeURIComponent(x.file);a.append(el('strong','',x.title||x.file),el('small','',x.source||'REIC'),el('code','',x.file));a.addEventListener('click',e=>{e.preventDefault();openFile(x.file)});return a}));
 count.textContent=found.length.toLocaleString('id')+' berkas ditemukan'+(entries.length?' · total '+entries.length.toLocaleString('id'):'');
}
search.addEventListener('input',draw);
back.addEventListener('click',()=>{view.classList.add('hidden');list.parentElement.classList.remove('hidden');history.replaceState(null,'',location.pathname);$('#componentWorkspace').replaceChildren()});
fetch('./manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('manifest.json tidak tersedia (HTTP '+r.status+')');return r.json()}).then(d=>{
 entries=(Array.isArray(d)?d:Array.isArray(d.files)?d.files:[]).filter(x=>x&&typeof x.file==='string'&&x.file.toLowerCase().endsWith('.reic'));
 draw();const hash=decodeURIComponent(location.hash.slice(1));if(hash&&entries.some(x=>x.file===hash))openFile(hash);
}).catch(e=>{count.textContent='Katalog gagal dimuat: '+e.message;list.replaceChildren(el('p','runtime-error','Periksa manifest.json dan pastikan berisi daftar berkas REIC yang tersedia.'))});
})();