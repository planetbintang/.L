(()=>{'use strict';
const $=s=>document.querySelector(s),list=$('#list'),search=$('#search'),view=$('#viewer'),source=$('#source'),back=$('#back'),count=$('#count');
let entries=[],currentFile='';
const siteRoot=location.origin+location.pathname.split('/').slice(0,-3).join('/')+'/';
const siteFile=file=>siteRoot+file.split('/').map(encodeURIComponent).join('/');
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const ext=f=>(f.split('.').pop()||'').toLowerCase();
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function setMode(mode){document.querySelectorAll('[data-view-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.viewMode===mode));document.querySelectorAll('[data-view-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.viewPanel!==mode))}
function showSource(text){source.textContent=text}
async function renderHtml(text,file,meta){
 const frame=el('iframe','reic-preview');frame.title='Pratinjau '+file;frame.setAttribute('sandbox','allow-forms allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');
 const base=new URL(siteFile(file));base.pathname=base.pathname.slice(0,base.pathname.lastIndexOf('/')+1);
 let html=text;
 if(/<html[\s>]/i.test(text)){html=text.replace(/<head([^>]*)>/i,'<head$1><base href="'+esc(base.href)+'">');if(!/<head[\s>]/i.test(html))html='<base href="'+esc(base.href)+'">'+html}
 else html='<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+esc(base.href)+'"></head><body>'+text+'</body></html>';
 const stylePath=(meta.match(/^\s*style:\s*(.+)\s*$/im)||[])[1];
 const scriptPath=(meta.match(/^\s*script:\s*(.+)\s*$/im)||[])[1];
 if(stylePath){const link='<link rel="stylesheet" href="'+esc(stylePath.trim())+'">';html=/<head[^>]*>/i.test(html)?html.replace(/<head[^>]*>/i,m=>m+link):html.replace(/<html[^>]*>/i,m=>m+'<head>'+link+'</head>');}
 if(scriptPath){const script='<script src="'+esc(scriptPath.trim())+'"><\/script>';html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,script+'</body>'):html+script;}
 if(stylePath){try{const u=new URL(stylePath.trim(),base.href);const r=await fetch(u.href);if(!r.ok)throw Error('HTTP '+r.status);const css=await r.text();const tag='<link rel="stylesheet" href="'+esc(stylePath.trim())+'">';html=html.replace(tag,'<style>'+css.replace(/<\/style/gi,'<\\\\/style')+'</style>')}catch(e){html=html.replace('</body>','<p>REIC CSS gagal dimuat: '+esc(e.message)+'</p></body>')}}
 if(scriptPath){try{const u=new URL(scriptPath.trim(),base.href);const r=await fetch(u.href);if(!r.ok)throw Error('HTTP '+r.status);const js=await r.text();const tag='<script src="'+esc(scriptPath.trim())+'"><\/script>';html=html.replace(tag,'<script>'+js.replace(/<\/script/gi,'<\\\\/script')+'</script>')}catch(e){html=html.replace('</body>','<p>REIC JS gagal dimuat: '+esc(e.message)+'</p></body>')}}
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
async function render(text,file){
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
 if(looksHtml){previewPanel.append(await renderHtml(body,file,header?header[1]:''))}
 else if(type==='json'){try{const pre=el('pre','code-preview',JSON.stringify(JSON.parse(body),null,2));previewPanel.append(pre)}catch{previewPanel.append(el('pre','code-preview',body))}}
 else if(type==='md'||type==='markdown'||type==='txt'){previewPanel.append(type==='md'||type==='markdown'?renderMarkdown(body):el('pre','code-preview',body))}
 else {previewPanel.append(el('pre','code-preview',body))}
 sourcePanel.append(el('pre','code-preview',text));
 workspace.append(previewPanel,sourcePanel);
 const choose=mode=>{setMode(mode);previewPanel.classList.toggle('hidden',mode!=='preview');sourcePanel.classList.toggle('hidden',mode!=='source')};
 preview.addEventListener('click',()=>choose('preview'));raw.addEventListener('click',()=>choose('source'));
 showSource(text);$('#runtimeOutput').textContent=header?'Metadata REIC terdeteksi. Pratinjau berjalan dalam iframe terisolasi; kode sumber tersedia pada tab Sumber.':'Berkas dimuat. Pratinjau dipilih berdasarkan tipe konten.';
}

const configFields={
 layout:[['Tata letak','select',['Panel berlapis','Kanvas lebar','Kartu modular','Pohon navigasi','Tabel data']],['Kepadatan','select',['Rapat','Seimbang','Lapang']],['Navigasi','select',['Sidebar kiri','Tab atas','Panel kontekstual']]],
 pilihan:[['Tema modul','select',['Gelap OsMediaVm','Kontras tinggi','Netral','Otomatis']],['Mode kerja','select',['Visual','Teknis','Pemeliharaan']],['Akses fitur','select',['Standar','Terbatas','Lanjutan']]],
 penerapan:[['Status penerapan','select',['Konsep','Siap diterapkan','Aktif','Ditangguhkan']],['Lingkungan','select',['Lokal','GitHub Pages','Backend eksternal']],['Versi modul','text','1.0.0']],
 penyimpanan:[['Strategi','select',['Lokal perangkat','Ekspor JSON','Backend eksternal']],['Kunci penyimpanan','text','osmediavm.reic'],['Cadangan','select',['Manual','Setiap perubahan']]],
 folder:[['Folder modul','text','osmediavm/recordin'],['File definisi','text','module.reic'],['File pendamping','text','module.css, module.js']],
 konfigurasi:[['ID konfigurasi','text','reic-module'],['Catatan','textarea','Konfigurasi khusus modul'],['Validasi','select',['Periksa sebelum simpan','Peringatan saja','Nonaktif']]]
};
let activeConfigFile='';
function moduleProfile(file){const n=file.toLowerCase();if(n.includes('15000'))return ['INFRASTRUKTUR / GRID TEKNIS','Tampilan bertingkat untuk komponen runtime, dependensi, dan jalur sistem.'];if(n.includes('1500'))return ['REGISTRI / POHON DATA','Tampilan pohon dan tabel untuk indeks, metadata, serta relasi berkas.'];if(n.includes('component')||n.includes('detail'))return ['KOMPONEN / KANVAS MODULAR','Tampilan kanvas dengan panel properti dan pratinjau komponen.'];return ['FITUR / KARTU MODULAR','Tampilan kartu dan panel kontekstual untuk fitur utama.'];}
function configKey(file){return 'osmediavm:reic-config:'+file}
function renderConfig(file){activeConfigFile=file;const [profile,desc]=moduleProfile(file);$('#layoutBadge').textContent=profile;$('#moduleDescription').textContent=desc;selectConfigTab('layout');}
function selectConfigTab(tab){document.querySelectorAll('[data-config-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.configTab===tab));const panel=$('#configPanel');if(!panel)return;panel.replaceChildren();const [profile]=moduleProfile(activeConfigFile);const card=el('div','config-card');card.append(el('h4','',tab==='layout'?'Susunan antarmuka':tab==='pilihan'?'Preferensi modul':tab==='penerapan'?'Penerapan sistem':tab==='penyimpanan'?'Strategi penyimpanan':tab==='folder'?'Struktur sistem folder & file':'Parameter konfigurasi'));card.append(el('p','',profile+' · '+activeConfigFile));const saved=(()=>{try{return JSON.parse(localStorage.getItem(configKey(activeConfigFile))||'{}')}catch{return {}}})();const fields=configFields[tab]||[];fields.forEach(([label,type,opts])=>{const wrap=el('div','config-field');wrap.append(el('label','',label));let input;if(type==='select'){input=el('select');opts.forEach(v=>{const o=el('option','',v);o.value=v;input.append(o)});input.value=saved[tab]?.[label]||opts[0]}else if(type==='textarea'){input=el('textarea');input.rows=3;input.value=saved[tab]?.[label]||opts}else{input=el('input');input.type='text';input.value=saved[tab]?.[label]||opts}input.dataset.configField=label;wrap.append(input);card.append(wrap)});if(tab==='folder'){const tree=el('div','folder-tree');['osmediavm/','recordin/','components/','manifest.json',activeConfigFile.split('/').pop(),'module.css','module.js'].forEach((v,i)=>tree.append(el('div','',((i===0||i===1||i===2)?'▸ ':'↳ ')+v)));card.append(tree)}panel.append(card)}
document.querySelectorAll('[data-config-tab]').forEach(b=>b.addEventListener('click',()=>selectConfigTab(b.dataset.configTab)));
$('#saveConfig')?.addEventListener('click',()=>{try{const all=(()=>{try{return JSON.parse(localStorage.getItem(configKey(activeConfigFile))||'{}')}catch{return {}}})();const tab=document.querySelector('[data-config-tab].selected')?.dataset.configTab||'layout';all[tab]={};$('#configPanel').querySelectorAll('[data-config-field]').forEach(x=>all[tab][x.dataset.configField]=x.value);localStorage.setItem(configKey(activeConfigFile),JSON.stringify(all));$('#saveStatus').textContent='Tersimpan di perangkat ini · '+new Date().toLocaleTimeString('id-ID');$('#saveStatus').classList.add('status-good')}catch(e){$('#saveStatus').textContent='Gagal menyimpan: '+e.message}});

async function openFile(file){
 try{
  currentFile=file;const response=await fetch(siteFile(file),{cache:'no-cache'});
  if(!response.ok)throw Error('HTTP '+response.status+' saat membaca '+file);
  const text=await response.text();$('#viewTitle').textContent=file;view.classList.remove('hidden');list.parentElement.classList.add('hidden');
  history.replaceState(null,'','#'+encodeURIComponent(file));await render(text,file);renderConfig(file);
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
async function loadCatalog(){
 let data=null,lastError=null;
 try{const r=await fetch('./manifest.json',{cache:'no-cache'});if(!r.ok)throw Error('manifest.json HTTP '+r.status);data=await r.json();}catch(e){lastError=e;}
 let files=Array.isArray(data)?data:Array.isArray(data?.files)?data.files:null;
 if(!files){
  try{const r=await fetch(siteFile('scripts/html-reic-migration-manifest.txt'),{cache:'no-cache'});if(!r.ok)throw Error('daftar migrasi HTTP '+r.status);const txt=await r.text();files=txt.split(/\\r?\\n/).map(s=>s.trim()).filter(s=>s.toLowerCase().endsWith('.reic')).map(file=>({file,title:file.split('/').pop().replace(/\\.reic$/i,''),source:file.split('/').slice(0,-1).join('/')||'Root',type:'reic'}));}
  catch(e){lastError=e;}
 }
 if(!files)throw lastError||Error('Katalog REIC tidak tersedia');
 entries=files.filter(x=>x&&typeof x.file==='string'&&x.file.toLowerCase().endsWith('.reic')&&!x.file.startsWith('/')&&!x.file.split('/').includes('..'));
 draw();const hash=decodeURIComponent(location.hash.slice(1));if(hash&&entries.some(x=>x.file===hash))openFile(hash);
}
loadCatalog().catch(e=>{count.textContent='Katalog gagal dimuat: '+e.message;list.replaceChildren(el('p','runtime-error','Katalog tidak dapat dibaca. Pastikan scripts/html-reic-migration-manifest.txt tersedia dan berisi jalur berkas .reic.'))});
})();