/* REIC ENVIRONMENT MENU — 25,000 searchable menus, preview-only by default. */
(()=>{'use strict';
 if(window.VMDESKTOPREIC_ENVIRONMENT_MENU)return;
 const root=document.querySelector('#vmDesktop'); if(!root)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const state={catalog:null,query:'',category:'all',page:0,selected:null};
 const button=root.querySelector('.vm-core-menu [data-environment-menu="true"]')||document.createElement('button');
 if(!button.parentNode){button.type='button';button.className='core-item reic-environment-launch';button.dataset.environmentMenu='true';button.title='25.000 menu environment REIC';button.innerHTML='<span>⌘</span><b>ENVIRONMENT<br>25.000 MENU</b>';root.querySelector('.vm-core-menu')?.append(button);}
 const backdrop=document.createElement('div');backdrop.className='reic-environment-backdrop';backdrop.hidden=true;
 backdrop.innerHTML='<section class="reic-environment-window" role="dialog" aria-modal="true" aria-labelledby="reicEnvironmentTitle"><header><div><small>REIC · VMDESKTOPREIC · ENVIRONMENT SYSTEM</small><h2 id="reicEnvironmentTitle">25.000 MENU ENVIRONMENT</h2><p id="reicEnvironmentDescription">Katalog konfigurasi REIC yang dapat dicari dan dipreview.</p></div><button type="button" data-env-close aria-label="Tutup">×</button></header><div class="reic-environment-toolbar"><input type="search" data-env-search placeholder="Cari ID, menu, kategori, tindakan…" aria-label="Cari menu environment"><select data-env-category aria-label="Filter kategori"><option value="all">SEMUA KATEGORI</option></select><span data-env-count>MEMUAT…</span></div><div class="reic-environment-layout"><nav data-env-categories aria-label="Kategori environment"></nav><main><div data-env-list class="reic-environment-list"></div><div class="reic-environment-pager"><button data-env-prev>SEBELUMNYA</button><span data-env-page>HALAMAN</span><button data-env-next>BERIKUTNYA</button></div></main></div><footer><span data-env-status>RUNTIME SIAP · PREVIEW-ONLY</span><span>REIC INDEPENDEN · ADAPTER WRITE MEMERLUKAN REVIEW</span></footer></section>';
 root.append(backdrop);
 const $=s=>backdrop.querySelector(s), list=$('[data-env-list]'), search=$('[data-env-search]'), category=$('[data-env-category]'), categories=$('[data-env-categories]');
 const status=text=>{$('[data-env-status]').textContent=text;};
 async function load(){
  if(state.catalog)return state.catalog;
  const response=await fetch('./environment/menu-catalog-25000.json',{cache:'force-cache'});
  if(!response.ok)throw Error('Katalog environment HTTP '+response.status);
  state.catalog=await response.json();
  state.catalog.categories.forEach(c=>{const option=document.createElement('option');option.value=c.id;option.textContent=c.name+' · '+c.count;category.append(option);});
  return state.catalog;
 }
 function filtered(){const q=state.query.trim().toLocaleLowerCase('id');return (state.catalog?.menus||[]).filter(item=>(state.category==='all'||item.categoryId===state.category)&&(!q||Object.values(item).join(' ').toLocaleLowerCase('id').includes(q)));}
 function render(){
  const rows=filtered(),size=60,pages=Math.max(1,Math.ceil(rows.length/size));state.page=Math.min(state.page,pages-1);
  $('[data-env-count]').textContent=rows.length.toLocaleString('id-ID')+' / '+(state.catalog?.totalMenus||0).toLocaleString('id-ID')+' MENU';
  list.innerHTML=rows.slice(state.page*size,(state.page+1)*size).map(item=>'<button class="reic-environment-card" data-env-id="'+esc(item.id)+'"><small>'+esc(item.id)+' · '+esc(item.category)+'</small><b>'+esc(item.menu)+'</b><span>'+esc(item.description)+'</span><i>'+esc(item.action)+' · '+esc(item.scope)+' ↗</i></button>').join('')||'<p class="reic-environment-empty">Tidak ada menu yang cocok dengan pencarian.</p>';
  $('[data-env-page]').textContent='HALAMAN '+(state.page+1)+' / '+pages;
  $('[data-env-prev]').disabled=state.page===0;$('[data-env-next]').disabled=state.page>=pages-1;
  categories.querySelectorAll('[data-env-category]').forEach(b=>b.classList.toggle('active',b.dataset.envCategory===state.category));
 }
 function showDetail(item){state.selected=item;list.innerHTML='<article class="reic-environment-detail"><button data-env-back>← KEMBALI KE KATALOG</button><small>'+esc(item.id)+' · '+esc(item.category)+'</small><h3>'+esc(item.menu)+'</h3><p>'+esc(item.description)+'</p><dl><div><dt>TINDAKAN</dt><dd>'+esc(item.action)+'</dd></div><div><dt>RUANG LINGKUP</dt><dd>'+esc(item.scope)+'</dd></div><div><dt>IZIN</dt><dd>'+esc(item.permission)+'</dd></div><div><dt>EKSEKUSI</dt><dd>PREVIEW-ONLY</dd></div></dl><div class="reic-environment-actions"><button data-env-preview>JALANKAN PREVIEW</button><button data-env-copy>SALIN ID</button></div><p class="reic-environment-result" data-env-result>Menu ini tidak mengubah sistem. Adapter write belum dikonfigurasi.</p></article>';status('MENU TERPILIH · '+item.id);}
 async function open(){backdrop.hidden=false;backdrop.classList.add('open');button.classList.add('active');try{await load();categories.innerHTML='<button data-env-category="all" class="active">SEMUA MENU<br><b>25.000</b></button>'+state.catalog.categories.map(c=>'<button data-env-category="'+esc(c.id)+'">'+esc(c.name)+'<br><b>'+c.count.toLocaleString('id-ID')+'</b></button>').join('');render();search.focus();status('KATALOG DIMUAT · PREVIEW-ONLY');}catch(error){list.innerHTML='<p class="reic-environment-empty">Gagal memuat katalog: '+esc(error.message)+'</p>';status('KATALOG ERROR');}}
 function close(){backdrop.hidden=true;backdrop.classList.remove('open');button.classList.remove('active');}
 document.querySelectorAll('[data-environment-menu="true"]').forEach(trigger=>trigger.addEventListener('click',e=>{e.preventDefault();open();}));
 $('[data-env-close]').addEventListener('click',close);backdrop.addEventListener('click',e=>{if(e.target===backdrop)close();});
 search.addEventListener('input',()=>{state.query=search.value;state.page=0;state.selected=null;render();});category.addEventListener('change',()=>{state.category=category.value;state.page=0;state.selected=null;render();});
 categories.addEventListener('click',e=>{const b=e.target.closest('[data-env-category]');if(!b)return;state.category=b.dataset.envCategory;category.value=state.category;state.page=0;state.selected=null;render();});
 $('[data-env-prev]').addEventListener('click',()=>{state.page--;render();});$('[data-env-next]').addEventListener('click',()=>{state.page++;render();});
 list.addEventListener('click',e=>{const card=e.target.closest('[data-env-id]');if(card){const item=state.catalog.menus.find(x=>x.id===card.dataset.envId);if(item)showDetail(item);return;}if(e.target.closest('[data-env-back]')){render();status('KATALOG AKTIF · '+filtered().length.toLocaleString('id-ID')+' HASIL');return;}if(e.target.closest('[data-env-preview]')){const result=$('[data-env-result]');result.textContent='PREVIEW BERHASIL · '+state.selected.id+' siap dipasang melalui adapter yang direview.';status('PREVIEW SELESAI · '+state.selected.id);return;}if(e.target.closest('[data-env-copy]')){navigator.clipboard?.writeText(state.selected.id);status('ID DISALIN · '+state.selected.id);}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!backdrop.hidden)close();if(e.key==='/'&&!backdrop.hidden&&document.activeElement!==search){e.preventDefault();search.focus();}});
 window.VMDESKTOPREIC_ENVIRONMENT_MENU=Object.freeze({version:'1.0.0',totalMenus:25000,open,close,get status(){return state.catalog?'ready':'not-loaded';}});
 root.dataset.environmentMenuReady='true';
})();
