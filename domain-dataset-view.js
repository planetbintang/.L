(()=> {
  'use strict';
  const root=document.getElementById('searchPage');
  if(!root||root.dataset.domainDatasetReady==='1') return;
  root.dataset.domainDatasetReady='1';
  const nav=root.querySelector('.safari-search-types');
  const results=root.querySelector('.safari-results');
  const hero=root.querySelector('.safari-search-hero');
  if(!nav||!results||!hero) return;

  const sources={
    home:'https://domainsproject.org/',
    repo:'https://github.com/tb0hdan/domains',
    stats:'https://github.com/tb0hdan/domains/blob/master/STATS.md',
    raw:'https://dataset.domainsproject.org/',
    docs:'https://github.com/tb0hdan/domains#using-dataset'
  };
  const style=document.createElement('style');
  style.textContent=`
    #searchPage .pb-domain-tabs{display:flex;gap:0;overflow:auto;margin:.75rem 0 0;border-bottom:1px solid #d5e4f1}
    #searchPage .pb-domain-tabs button{flex:1 0 auto;padding:.65rem .8rem;border:1px solid #cbdceb;background:#f3f8fc;color:#12304b;font-weight:800;letter-spacing:.04em}
    #searchPage .pb-domain-tabs button[aria-selected="true"]{background:#123d60;color:white;border-color:#123d60}
    #searchPage .pb-domain-panel{padding:1rem;background:linear-gradient(145deg,#f7fbff,#eaf4fc);color:#102b45;border:1px solid #d2e3f2}
    #searchPage .pb-domain-panel[hidden]{display:none}
    #searchPage .pb-domain-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:.7rem;margin:.8rem 0}
    #searchPage .pb-domain-card{padding:.9rem;border:1px solid #c8dcec;background:#fff;min-width:0}
    #searchPage .pb-domain-card h3{margin:0 0 .45rem;font-size:1rem;color:#123d60}
    #searchPage .pb-domain-card p{margin:.3rem 0;color:#435c73;line-height:1.5;font-size:.86rem}
    #searchPage .pb-domain-card a{display:inline-block;margin-top:.5rem;color:#075d9c;font-weight:800;text-decoration:underline}
    #searchPage .pb-domain-status{padding:.65rem .8rem;background:#e4f1fb;border-left:3px solid #287db6;font-size:.84rem;line-height:1.5}
    #searchPage .pb-domain-stream{font-family:ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:#071b2e;color:#d9efff;padding:1rem;min-height:110px}
    @media(max-width:600px){#searchPage .pb-domain-panel{padding:.65rem}}
  `;
  document.head.append(style);

  const tabs=document.createElement('nav');
  tabs.className='pb-domain-tabs';
  tabs.setAttribute('aria-label','Dataset domain');
  tabs.innerHTML='<button type="button" data-domain-view="search" aria-selected="true">CARI</button><button type="button" data-domain-view="dataset" aria-selected="false">VIEW DATASET</button><button type="button" data-domain-view="stream" aria-selected="false">STREAMING</button>';
  hero.append(tabs);

  const panel=document.createElement('section');
  panel.className='pb-domain-panel';
  panel.id='pbDomainDatasetPanel';
  panel.hidden=true;
  panel.innerHTML=`
    <p class="safari-eyebrow">REIC · DOMAIN DATASET LINK</p>
    <h2>DATASET DOMAIN TERHUBUNG</h2>
    <p>REIC menggunakan DomainsProject sebagai sumber dataset eksternal. Dataset publik GitHub memakai Git LFS dan berkas terkompresi XZ; sumber ini ditautkan sebagai repositori data, bukan disalin ke GitHub Pages.</p>
    <div class="pb-domain-grid">
      <article class="pb-domain-card"><h3>REPOSITORI DATASET</h3><p>Daftar domain publik, struktur per negara/TLD, petunjuk Git LFS, dan proses unpack.</p><a href="${sources.repo}" target="_blank" rel="noopener noreferrer">Buka GitHub dataset ↗</a></article>
      <article class="pb-domain-card"><h3>DATASET MENTAH</h3><p>Endpoint distribusi data mentah untuk pengguna berlangganan. Tidak otomatis diunduh ke browser.</p><a href="${sources.raw}" target="_blank" rel="noopener noreferrer">Buka dataset.domainsproject.org ↗</a></article>
      <article class="pb-domain-card"><h3>STATISTIK & LISENSI</h3><p>Periksa jumlah data, versi, batas cakupan, dan lisensi BSD-3-Clause sebelum sinkronisasi.</p><a href="${sources.stats}" target="_blank" rel="noopener noreferrer">Lihat statistik ↗</a></article>
      <article class="pb-domain-card"><h3>PORTAL SUMBER</h3><p>Informasi resmi cakupan dataset dan layanan DomainsProject.</p><a href="${sources.home}" target="_blank" rel="noopener noreferrer">Buka DomainsProject ↗</a></article>
    </div>
    <p class="pb-domain-status"><strong>STATUS INTEGRASI:</strong> tautan sumber aktif. Pengindeksan penuh 450 juta nama belum dijalankan. Dataset publik yang disebut proyek memerlukan Git LFS + XZ dan penyimpanan/server indeks tersendiri.</p>
  `;
  results.before(panel);

  const stream=document.createElement('section');
  stream.className='pb-domain-panel';
  stream.id='pbDomainStreamPanel';
  stream.hidden=true;
  stream.innerHTML=`
    <p class="safari-eyebrow">REIC · DATA STREAM</p>
    <h2>STREAMING DATASET DOMAIN</h2>
    <p>Stream nama domain baru (Newly Observed Hostnames / NOH) disediakan sebagai layanan WebSocket pada paket DomainsProject berbayar. URL WebSocket dan kredensial tidak dipublikasikan sebagai endpoint anonim, sehingga REIC tidak membuat koneksi palsu atau menampilkan viewer aktif fiktif.</p>
    <div class="pb-domain-stream" role="status">REIC DATA STREAM
MODE: EXTERNAL SOURCE LINK
LIVE SOCKET: BELUM DIKONFIGURASI
INDEX SYNC: MENUNGGU SERVER INGEST
CLIENT: SIAP UNTUK ENDPOINT RESMI + TOKEN</div>
    <div class="pb-domain-grid">
      <article class="pb-domain-card"><h3>AKSES STREAM NOH</h3><p>Informasi paket dan akses WebSocket resmi dari penyedia.</p><a href="${sources.home}" target="_blank" rel="noopener noreferrer">Lihat akses streaming ↗</a></article>
      <article class="pb-domain-card"><h3>PETUNJUK INGEST</h3><p>Gunakan server REIC untuk menerima event, validasi nama, deduplikasi, lalu simpan ke indeks pencarian.</p><a href="${sources.docs}" target="_blank" rel="noopener noreferrer">Lihat format dataset ↗</a></article>
    </div>
    <p class="pb-domain-status">Untuk mengaktifkan live streaming secara nyata, backend REIC perlu endpoint resmi, token/API key, serta penyimpanan indeks. Jangan menaruh token provider di JavaScript publik.</p>
  `;
  panel.after(stream);

  function activate(view){
    tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.domainView===view)));
    results.hidden=view!=='search';
    panel.hidden=view!=='dataset';
    stream.hidden=view!=='stream';
    if(view==='search') hero.scrollIntoView({block:'nearest'});
    else panel.scrollIntoView({block:'nearest'});
  }
  tabs.addEventListener('click',event=>{
    const button=event.target.closest('button[data-domain-view]');
    if(button) activate(button.dataset.domainView);
  });
  document.querySelectorAll('[data-search-type]').forEach(link=>link.addEventListener('click',()=>activate('search')));
  window.addEventListener('hashchange',()=>{if(location.hash!=='#cari')activate('search');});
  window.REIC_DOMAIN_DATASET={provider:'DomainsProject',links:sources,activate};
})();