/* Planetbintang System Library: reusable layout blocks + searchable menu registry. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const root = $('#system-library');
  if (!root) return;

  const layoutKinds = [
    ['Dashboard','Ringkasan metrik, status, dan aktivitas','dashboard'],
    ['Statistik','Kartu angka dengan tren dan perbandingan','chart'],
    ['Daftar data','Daftar item dengan pencarian dan filter','list'],
    ['Tabel data','Kolom terstruktur dan navigasi halaman','table'],
    ['Kartu repositori','Nama repo, branch, dan status','repo'],
    ['File browser','Jelajah folder dan file melalui File Manager','file'],
    ['Panel detail','Metadata objek dan tindakan terkait','detail'],
    ['Form input','Input teks dengan validasi dasar','form'],
    ['Pusat sinkronisasi','Status indeks dan sumber data','sync'],
    ['Timeline','Aktivitas dan perubahan berurutan','timeline'],
    ['Menu kategori','Navigasi menu yang dikelompokkan','menu'],
    ['Pencarian global','Pencarian item katalog dan jalur','search'],
    ['Status sistem','Kesehatan modul dan konektivitas','status'],
    ['Panel media','Pratinjau aset dan metadata file','media'],
    ['Pengaturan','Preferensi tampilan dan perilaku','settings'],
    ['Workspace','Ringkasan tugas dan proyek','workspace'],
    ['Log aktivitas','Riwayat aksi dan waktu','logs'],
    ['Panel akses','Izin, sumber, dan metadata akses','access'],
    ['Integrasi','Status konektor dan sumber eksternal','integration'],
    ['Dokumentasi','Panduan, referensi, dan tautan sumber','docs']
  ];
  const blocks = Array.from({length:300}, (_, i) => {
    const kind = layoutKinds[i % layoutKinds.length];
    const variant = Math.floor(i / layoutKinds.length) + 1;
    return {id:'LAY-'+String(i+1).padStart(4,'0'),name:kind[0]+' · Varian '+variant,description:kind[1],category:kind[0],kind:kind[2],path:'#fileManager'};
  });

  const navItems = [...document.querySelectorAll('.main-nav a, .nav-dropdown-menu a')]
    .map((a,i)=>({id:'NAV-'+String(i+1).padStart(4,'0'),name:a.querySelector('b')?.textContent?.trim()||a.textContent.trim(),description:a.querySelector('small')?.textContent?.trim()||'Navigasi platform',category:'Navigasi',path:a.getAttribute('href')||'#overview',route:a.dataset.systemRoute||'',source:'index.html'}));
  const menuCategories = ['Repository','File Manager','Workspace','Platform','Air Cloud','SNAPS','Media','Dokumentasi','Sistem'];
  const virtualMenus = Array.from({length:1200},(_,i)=> {
    const category=menuCategories[i%menuCategories.length];
    const route = i%4===0 ? '#fileManager' : i%4===1 ? '#repositories' : i%4===2 ? '#workspace/features' : '#platform/overview';
    return {id:'SYS-'+String(i+1).padStart(5,'0'),name:category+' · Menu '+String(i+1).padStart(4,'0'),description:'Entri katalog sistem; buka sumber terkait untuk menelusuri data nyata.',category:'Menu sistem',path:route,source:'virtual-catalog'};
  });
  const entries = [...navItems, ...blocks.map(b=>({...b,source:'layout-library'})), ...virtualMenus];
  const categories = ['Semua','Blok layout','Navigasi','Menu sistem',...new Set(blocks.map(b=>b.category))];
  let page=0, pageSize=24, query='', category='Semua';
  const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const actualFiles = () => window.PB_REPOSITORY_INDEX?.files || [];
  const getVisible = () => {
    const q=query.toLocaleLowerCase();
    return entries.filter(x=>{
      const type = x.source==='layout-library'?'Blok layout':x.source==='virtual-catalog'?'Menu sistem':'Navigasi';
      const catMatch = category==='Semua'||category===type||category===x.category;
      return catMatch && (!q || [x.id,x.name,x.description,x.category,x.path].join(' ').toLocaleLowerCase().includes(q));
    });
  };
  function render(){
    const all=getVisible(), maxPage=Math.max(0,Math.ceil(all.length/pageSize)-1);
    page=Math.min(page,maxPage);
    const slice=all.slice(page*pageSize,(page+1)*pageSize);
    $('#libraryCount').textContent=all.length.toLocaleString('id-ID');
    $('#libraryTotal').textContent=entries.length.toLocaleString('id-ID');
    $('#libraryFiles').textContent=actualFiles().length ? actualFiles().length.toLocaleString('id-ID') : 'Hubungkan';
    $('#libraryGrid').innerHTML=slice.map(x=>'<article class="library-card"><small>'+esc(x.id)+' · '+esc(x.category)+'</small><strong>'+esc(x.name)+'</strong><small>'+esc(x.description)+'</small><small>Sumber: '+esc(x.source)+'</small><button type="button" data-open-path="'+esc(x.path)+'" data-menu-id="'+esc(x.id)+'">Buka / telusuri ↗</button></article>').join('')||'<div class="library-empty">Tidak ada item yang cocok. Ubah kata pencarian atau kategori.</div>';
    $('#libraryPage').textContent='Halaman '+(page+1)+' dari '+(maxPage+1);
    $('#libraryPrev').disabled=page===0; $('#libraryNext').disabled=page>=maxPage;
  }
  root.innerHTML='<div class="library-head"><div><p class="eyebrow">SYSTEM CATALOG · FILE MANAGER</p><h2>Blok Layout & Menu Sistem</h2><p>Telusuri komponen UI, menu navigasi, dan jalur File Manager dari satu katalog. Item layout adalah pola/varian siap dikembangkan; menu virtual ditandai jelas dan bukan klaim bahwa semua fitur sudah terimplementasi.</p></div><div class="library-stats"><div class="library-stat"><strong id="libraryTotal">—</strong><br><small>Total katalog</small></div><div class="library-stat"><strong id="libraryCount">—</strong><br><small>Hasil filter</small></div><div class="library-stat"><strong id="libraryFiles">—</strong><br><small>Indeks file</small></div></div></div><div class="library-tools"><input id="librarySearch" type="search" placeholder="Cari menu, blok, ID, atau jalur…" aria-label="Cari katalog"/><select id="libraryCategory" aria-label="Kategori"></select><select id="libraryPageSize" aria-label="Jumlah item per halaman"><option value="24">24 item/halaman</option><option value="48">48 item/halaman</option><option value="96">96 item/halaman</option></select></div><div class="library-grid" id="libraryGrid"></div><div class="library-foot"><button id="libraryPrev" type="button">← Sebelumnya</button><span id="libraryPage" aria-live="polite"></span><button id="libraryNext" type="button">Berikutnya →</button></div>';
  $('#libraryCategory').innerHTML=categories.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
  $('#librarySearch').addEventListener('input',e=>{query=e.target.value;page=0;render()});
  $('#libraryCategory').addEventListener('change',e=>{category=e.target.value;page=0;render()});
  $('#libraryPageSize').addEventListener('change',e=>{pageSize=Number(e.target.value);page=0;render()});
  $('#libraryPrev').addEventListener('click',()=>{page=Math.max(0,page-1);render()});
  $('#libraryNext').addEventListener('click',()=>{page++;render()});
  $('#libraryGrid').addEventListener('click',e=>{
    const btn=e.target.closest('[data-open-path]'); if(!btn)return;
    const target=btn.dataset.openPath;
    if(target.startsWith('#')) { location.hash=target.slice(1); }
    else location.hash='fileManager';
    const toast=$('#toast');
    if(toast){const strong=toast.querySelector('strong'),small=toast.querySelector('small');if(strong)strong.textContent='Katalog dipilih';if(small)small.textContent=btn.dataset.menuId+' · membuka jalur terkait';toast.classList.add('show');}
  });
  render();
})();
