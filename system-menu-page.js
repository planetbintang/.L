(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const root = document.getElementById('pbMenuPage');
  if (!root) return;
  function start() {
    const api = window.PBDesktopOSMenus;
    if (!api) { root.innerHTML='<p>Registri menu belum termuat. <a href="../../../index.html">Kembali ke situs utama</a></p>'; return; }
    const path = location.pathname;
    const match = path.match(/menu-(\d{5})\/index\.html$/);
    const categories = api.categories || [];
    if (match) {
      const item = api.get(Number(match[1])-1);
      if (!item) { root.innerHTML='<h1>Menu tidak ditemukan</h1>'; return; }
      document.title = item.display + ' · Planetbintang';
      root.innerHTML = '<p class="eyebrow">DESKTOP OS · FILESYSTEM SITUS</p><h1>'+esc(item.display)+'</h1><p>'+esc(item.category)+' · '+esc(item.id)+'</p><section class="details"><dl><dt>Tampilan</dt><dd>Halaman website responsif</dd><dt>Fungsi sistem</dt><dd>'+esc(item.systemFunction)+'</dd><dt>Integrasi menu</dt><dd>'+esc(item.integration)+'</dd><dt>Data</dt><dd>'+esc(item.data)+'</dd><dt>Data otomatis tersimpan</dt><dd>Favorit dan aktivitas disimpan di browser utama</dd><dt>Mode aktivitas</dt><dd>'+esc(item.activityMode)+'</dd><dt>File sistem</dt><dd><code>'+esc(item.folderPath)+'</code> · '+item.fileCount+' file</dd><dt>Menu induk</dt><dd>'+esc(item.category)+'</dd></dl></section><p class="actions"><a href="../../../index.html'+esc(item.parentRoute)+'">Buka sistem induk</a><a href="../index.html">Buka kategori</a><a href="../../../index.html">Kembali ke beranda</a></p><p class="note">Halaman ini adalah modul situs statis. Fungsi yang memerlukan OS native atau backend harus dihubungkan secara terpisah.</p>';
      return;
    }
    const slug = path.match(/(?:system-menus|aktif)\/([^/]+)\/index\.html$/)?.[1];
    const category = categories.find(c=>c.slug===slug);
    if (!category) { root.innerHTML='<h1>Kategori tidak ditemukan</h1><a href="../../index.html">Kembali</a>'; return; }
    document.title = category.name + ' · Menu OS Planetbintang';
    let page=0, query='';
    root.innerHTML='<p class="eyebrow">PLANETBINTANG · SUBMENU SISTEM</p><h1>'+esc(category.name)+'</h1><p>1250 menu dalam kategori ini; setiap menu memiliki folder dan satu file HTML.</p><label class="search">Cari submenu <input id="pbCatSearch" type="search" placeholder="Cari nama atau fungsi menu"></label><div id="pbCatList" class="menu-list"></div><nav class="pager"><button id="pbCatPrev">Sebelumnya</button><span id="pbCatPage"></span><button id="pbCatNext">Berikutnya</button></nav><p class="actions"><a href="../../index.html'+esc(category.parentRoute)+'">Buka sistem menu induk</a><a href="../../index.html">Kembali ke beranda</a></p>';
    const list=root.querySelector('#pbCatList');
    function draw(){
      const filtered=(api.listCategory(category.name)||[]).filter(item=>!query||[item.display,item.systemFunction,item.id].some(v=>v.toLocaleLowerCase('id').includes(query)));
      const pages=Math.max(1,Math.ceil(filtered.length/50));page=Math.min(page,pages-1);
      list.innerHTML=filtered.slice(page*50,(page+1)*50).map(item=>'<a class="menu-card" href="./menu-'+esc(String(item.index).padStart(5,'0'))+'/index.html"><b>'+esc(item.display)+'</b><small>'+esc(item.id)+' · '+esc(item.systemFunction)+'</small></a>').join('')||'<p>Tidak ada submenu yang cocok.</p>';
      root.querySelector('#pbCatPage').textContent='Halaman '+(page+1)+' / '+pages+' · '+filtered.length+' menu';
      root.querySelector('#pbCatPrev').disabled=page===0;root.querySelector('#pbCatNext').disabled=page>=pages-1;
    }
    root.querySelector('#pbCatSearch').addEventListener('input',e=>{query=e.target.value.toLocaleLowerCase('id').trim();page=0;draw();});
    root.querySelector('#pbCatPrev').addEventListener('click',()=>{page--;draw();});
    root.querySelector('#pbCatNext').addEventListener('click',()=>{page++;draw();});
    draw();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();