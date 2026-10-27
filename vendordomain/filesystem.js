(() => {
'use strict';
const BASE = './system/generated/';
const $ = (s, root=document) => root.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style = document.createElement('style');
style.textContent = `
.filesystem-section{margin:30px 0;padding:24px;background:var(--panel,#fff);border:1px solid var(--line,#e4e9f2);border-radius:18px}
.filesystem-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap}
.filesystem-head h2{margin:5px 0 8px;font-size:clamp(21px,2.3vw,29px)}
.filesystem-head p{margin:0;color:var(--muted,#70809b);max-width:760px}
.fs-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:20px 0}
.fs-stat{padding:14px;border:1px solid var(--line,#e4e9f2);border-radius:12px;background:var(--bg,#f5f7fb)}
.fs-stat strong{display:block;font-size:23px;line-height:1.3}.fs-stat span{font-size:11px;color:var(--muted,#70809b)}
.fs-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
.fs-toolbar input,.fs-toolbar select{min-height:40px;padding:8px 11px;border:1px solid var(--line,#e4e9f2);border-radius:9px;background:var(--panel,#fff);color:var(--text,#17233b)}
.fs-toolbar input{flex:1;min-width:200px}
.fs-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.fs-module{border:1px solid var(--line,#e4e9f2);border-radius:12px;overflow:hidden;min-width:0}
.fs-module summary{list-style:none;cursor:pointer;padding:13px;display:flex;align-items:flex-start;gap:10px}.fs-module summary::-webkit-details-marker{display:none}
.fs-module summary:hover{background:var(--blue-soft,#edf1ff)}
.fs-number{font-size:11px;color:var(--muted,#70809b);font-variant-numeric:tabular-nums;padding-top:2px}
.fs-module-name{font-weight:700;font-size:12px;overflow-wrap:anywhere;flex:1}
.fs-module-meta{display:block;color:var(--muted,#70809b);font-size:10px;margin-top:5px;font-weight:400}
.fs-module-body{border-top:1px solid var(--line,#e4e9f2);padding:12px}
.fs-module-body p{font-size:12px;color:var(--muted,#70809b);margin:0 0 10px}
.fs-actions{display:flex;gap:7px;flex-wrap:wrap}.fs-btn{border:1px solid var(--line,#e4e9f2);background:var(--panel,#fff);color:var(--text,#17233b);border-radius:8px;padding:7px 10px;font-size:11px;font-weight:650;cursor:pointer}.fs-btn.primary{background:var(--blue,#4169f5);border-color:var(--blue,#4169f5);color:white}
.fs-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;flex-wrap:wrap;font-size:12px;color:var(--muted,#70809b)}
.fs-empty{padding:24px;text-align:center;color:var(--muted,#70809b);border:1px dashed var(--line,#e4e9f2);border-radius:12px;grid-column:1/-1}
.fs-detail{position:fixed;inset:0;background:#0d173a88;z-index:100;display:none;place-items:center;padding:20px}.fs-detail.open{display:grid}
.fs-detail-card{background:var(--panel,#fff);color:var(--text,#17233b);width:min(650px,100%);max-height:85vh;overflow:auto;border-radius:16px;padding:22px;box-shadow:0 25px 80px #0003}
.fs-detail-card h3{margin:6px 36px 10px 0;overflow-wrap:anywhere}.fs-detail-card pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg,#f5f7fb);padding:12px;border-radius:9px;font-size:11px}
.fs-detail-top{display:flex;justify-content:space-between;align-items:center}.fs-status{display:inline-flex;border-radius:7px;padding:4px 7px;background:#fff2d9;color:#8b5b00;font-size:10px;font-weight:750}
@media(max-width:1000px){.fs-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fs-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.filesystem-section{padding:15px}.fs-grid{grid-template-columns:1fr}.fs-stat strong{font-size:20px}}
`;
document.head.appendChild(style);
const section = document.createElement('section');
section.id = 'vendorFilesystem';
section.className = 'filesystem-section';
section.innerHTML = `
 <div class="filesystem-head"><div><div class="eyebrow">FILESYSTEM · SYSTEM CATALOG</div><h2>Filesystem VendorDomain</h2><p>Jelajahi modul sistem yang disimpan di repositori. Setiap modul memiliki manifest konfigurasi, dokumentasi, dan titik masuk JavaScript. Fitur administrasi, member, user, domain, DNS, hosting, billing, keamanan, API, serta manajer file terhubung ke katalog ini.</p></div><span class="local-tag">Scaffold lokal</span></div>
 <div class="fs-stat-grid"><div class="fs-stat"><strong id="fsFolderCount">—</strong><span>Folder modul</span></div><div class="fs-stat"><strong id="fsFileCount">—</strong><span>File modul</span></div><div class="fs-stat"><strong id="fsCategoryCount">—</strong><span>Kategori sistem</span></div><div class="fs-stat"><strong id="fsVisibleCount">—</strong><span>Hasil filter</span></div></div>
 <div class="fs-toolbar"><input id="fsSearch" type="search" placeholder="Cari modul, kategori, ID…" aria-label="Cari filesystem"><select id="fsCategory" aria-label="Filter kategori"><option value="all">Semua kategori</option></select><select id="fsPageSize" aria-label="Jumlah modul per halaman"><option value="30">30 per halaman</option><option value="60" selected>60 per halaman</option><option value="120">120 per halaman</option></select></div>
 <div id="fsGrid" class="fs-grid"><div class="fs-empty">Memuat katalog filesystem…</div></div>
 <div class="fs-pager"><span id="fsPageInfo">Memuat manifest…</span><div class="fs-actions"><button class="fs-btn" id="fsPrev" disabled>← Sebelumnya</button><button class="fs-btn" id="fsNext" disabled>Berikutnya →</button></div></div>
 <p class="helper-note">Keamanan: modul ini belum melakukan perubahan domain/DNS atau transaksi nyata. Data demo tidak menggantikan autentikasi server, database, dan integrasi penyedia resmi.</p>
 <div id="fsDetail" class="fs-detail" role="dialog" aria-modal="true" aria-label="Detail modul filesystem"><div class="fs-detail-card"><div class="fs-detail-top"><span class="eyebrow">DETAIL MODUL</span><button class="fs-btn" id="fsClose">Tutup ×</button></div><h3 id="fsDetailTitle">Modul</h3><div id="fsDetailMeta"></div><p id="fsDetailDescription"></p><pre id="fsDetailConfig"></pre><div class="fs-actions"><button class="fs-btn primary" id="fsCopyId">Salin ID modul</button><button class="fs-btn" id="fsReadme">Buka dokumentasi</button><button class="fs-btn" id="fsSource">Buka kode sumber</button></div></div></div>
`;
const main = $('#mainContent');
if (main) {
 const publisher = $('#publisher', main);
 if (publisher) main.insertBefore(section, publisher); else main.appendChild(section);
}
const navGroups = [
 ['drop-system','Filesystem VendorDomain','vendorFilesystem'],
 ['drop-domain','Katalog modul domain dan DNS','vendorFilesystem'],
 ['drop-vendor','Modul vendor dan integrasi','vendorFilesystem'],
 ['drop-publish','Modul file dan publikasi','vendorFilesystem']
];
navGroups.forEach(([id,label,target]) => {
 const host = document.getElementById(id);
 if (host && !host.querySelector('[data-filesystem-link]')) {
   const a=document.createElement('a'); a.href='#'+target; a.dataset.filesystemLink='true'; a.innerHTML='<span>▦</span>'+esc(label); host.appendChild(a);
 }
});
const sidebar = $('#sideModules');
if (sidebar && !sidebar.querySelector('[data-filesystem-shortcut]')) {
 const a=document.createElement('a');a.href='#vendorFilesystem';a.className='side-module';a.dataset.filesystemShortcut='true';a.innerHTML='<span class="module-icon">▦</span><span class="module-name">Filesystem VendorDomain</span><span class="module-count">510</span>';a.style.cssText='display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:9px;color:inherit;font-size:12px;margin-top:6px';a.addEventListener('click',()=>$('#vendorFilesystem')?.scrollIntoView({behavior:'smooth'}));sidebar.appendChild(a);
}
let modules=[],filtered=[],page=0,selected=null;
const pageSize=()=>Number($('#fsPageSize')?.value||60);
function render(){
 const grid=$('#fsGrid');if(!grid)return;
 const size=pageSize(),pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages-1);
 const visible=filtered.slice(page*size,(page+1)*size);
 grid.innerHTML=visible.length?visible.map(m=>`<details class="fs-module"><summary><span class="fs-number">${String(m.index).padStart(3,'0')}</span><span class="fs-module-name">${esc(m.label||m.name)}<span class="fs-module-meta">${esc(m.group||m.category)} · ${esc(m.folder||m.id)}</span></span><span>⌄</span></summary><div class="fs-module-body"><p>Konfigurasi, dokumentasi, dan kode sumber tersedia dalam repositori.</p><div class="fs-actions"><button class="fs-btn primary" data-fs-detail="${esc(m.folder||m.id)}">Detail konfigurasi</button><button class="fs-btn" data-fs-readme="${esc(m.folder||m.id)}">Dokumentasi</button><button class="fs-btn" data-fs-source="${esc(m.folder||m.id)}">Kode sumber</button></div></div></details>`).join(''):'<div class="fs-empty">Tidak ada modul yang cocok. Ubah kata pencarian atau kategori.</div>';
 $('#fsFolderCount').textContent=modules.length.toLocaleString('id-ID');
 $('#fsFileCount').textContent=(modules.length*3).toLocaleString('id-ID');
 $('#fsCategoryCount').textContent=new Set(modules.map(m=>m.group||m.category)).size.toLocaleString('id-ID');
 $('#fsVisibleCount').textContent=filtered.length.toLocaleString('id-ID');
 $('#fsPageInfo').textContent=filtered.length?`Menampilkan ${page*size+1}–${Math.min((page+1)*size,filtered.length)} dari ${filtered.length} modul`:'Tidak ada hasil';
 $('#fsPrev').disabled=page===0;$('#fsNext').disabled=(page+1)*size>=filtered.length;
 grid.querySelectorAll('[data-fs-detail]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openDetail(b.dataset.fsDetail)}));
 grid.querySelectorAll('[data-fs-readme]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openRepoFile(b.dataset.fsReadme,'README.md')}));
 grid.querySelectorAll('[data-fs-source]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openRepoFile(b.dataset.fsSource,'index.js')}));
}
function apply(){
 const q=($('#fsSearch')?.value||'').trim().toLocaleLowerCase('id-ID'),cat=$('#fsCategory')?.value||'all';
 filtered=modules.filter(m=>(cat==='all'||(m.group||m.category)===cat)&&(!q||[m.folder,m.id,m.label,m.name,m.group,m.category].join(' ').toLocaleLowerCase('id-ID').includes(q)));
 page=0;render();
}
function findModule(id){return modules.find(m=>(m.folder||m.id)===id)}
function openDetail(id){
 const m=findModule(id);if(!m)return;selected=m;
 $('#fsDetailTitle').textContent=m.label||m.name||m.id;
 $('#fsDetailMeta').innerHTML='<span class="fs-status">SCAFFOLD · DEMO LOKAL</span> <span class="fs-number">'+esc(m.folder||m.id)+'</span>';
 $('#fsDetailDescription').textContent='Kategori: '+(m.group||m.category)+'. Modul menyediakan metadata dan validasi input dasar. Operasi produksi memerlukan layanan backend terautentikasi.';
 $('#fsDetailConfig').textContent=JSON.stringify({id:m.folder||m.id,name:m.label||m.name,category:m.group||m.category,files:['module.json','README.md','index.js'],dataMode:'demo-local',productionReady:false},null,2);
 $('#fsDetail').classList.add('open');
}
function openRepoFile(id,file){const m=findModule(id);if(!m)return;window.open('https://github.com/planetbintang/.L/blob/io/vendordomain/system/generated/'+encodeURIComponent(m.folder||m.id)+'/'+file,'_blank','noopener,noreferrer')}
function closeDetail(){$('#fsDetail').classList.remove('open')}
$('#fsSearch')?.addEventListener('input',apply);$('#fsCategory')?.addEventListener('change',apply);$('#fsPageSize')?.addEventListener('change',apply);
$('#fsPrev')?.addEventListener('click',()=>{if(page>0){page--;render()}});
$('#fsNext')?.addEventListener('click',()=>{if((page+1)*pageSize()<filtered.length){page++;render()}});
$('#fsClose')?.addEventListener('click',closeDetail);
$('#fsDetail')?.addEventListener('click',e=>{if(e.target.id==='fsDetail')closeDetail()});
$('#fsCopyId')?.addEventListener('click',async()=>{if(!selected)return;try{await navigator.clipboard.writeText(selected.folder||selected.id);$('#fsCopyId').textContent='Tersalin ✓'}catch(e){$('#fsCopyId').textContent='Salin manual: '+(selected.folder||selected.id)}});
$('#fsReadme')?.addEventListener('click',()=>selected&&openRepoFile(selected.folder||selected.id,'README.md'));
$('#fsSource')?.addEventListener('click',()=>selected&&openRepoFile(selected.folder||selected.id,'index.js'));
fetch(BASE+'system-manifest.json').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(data=>{
 modules=Array.isArray(data.modules)?data.modules:[];
 if(!modules.length)throw new Error('Daftar modul kosong');
 const cats=[...new Set(modules.map(m=>m.group||m.category).filter(Boolean))].sort();
 $('#fsCategory').innerHTML='<option value="all">Semua kategori</option>'+cats.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
 apply();
}).catch(err=>{
 $('#fsGrid').innerHTML='<div class="fs-empty"><strong>Manifest belum dapat dimuat.</strong><p>Pastikan folder system/generated dan file system-manifest.json tersedia pada branch yang dipublikasikan.</p><small>'+esc(err.message)+'</small></div>';
 $('#fsPageInfo').textContent='Katalog tidak tersedia';
});
})();