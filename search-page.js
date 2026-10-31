(() => {
  'use strict';
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './search-page.css?v=20261031-search-inline-v4';
  document.head.append(css);

  const $ = id => document.getElementById(id);
  const searchInput=$('globalSearchInput'), startInput=$('safariStartInput');
  const topForm=$('topbarSearchForm'), topInput=$('topbarSearchInput');
  const homeForm=$('homeSearchForm'), homeInput=$('homeSearchInput');
  const mainForm=$('globalSearchForm'), startForm=$('safariStartForm');
  const results=$('safariResultsList'), resultsTitle=$('safariResultsTitle');
  const resultsCount=$('safariResultsCount'), resultsStatus=$('safariResultsStatus');

  const SOURCES = {
    registry: './data/domain-registry.nz',
    media: 'https://raw.githubusercontent.com/planetbintang/al.l/io/data.media/domain-000001.jsonl',
    wiki: 'https://en.wikipedia.org/w/api.php'
  };
  let domainRecords = null;
  let domainLoadPromise = null;
  let activeType = 'all';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanDomain = value => String(value || '').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split(/[/?#]/)[0].replace(/:\d+$/,'');
  const validDomain = value => /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value);
  const setQuery = value => {
    [searchInput,startInput,topInput,homeInput].forEach(input => { if(input) input.value=value; });
    try { sessionStorage.setItem('pb-global-search-query',value); } catch (_) {}
  };
  function parseJsonl(text) {
    return String(text || '').split(/\r?\n/).filter(Boolean).flatMap(line => {
      try {
        const item=JSON.parse(line);
        const domain=cleanDomain(item.domain || item.name);
        if(!validDomain(domain)) return [];
        return [{domain,status:String(item.status || 'tercatat'),source:String(item.sumber || item.source || 'katalog'),shard:item.shard || null}];
      } catch (_) { return []; }
    });
  }
  async function loadDomainRecords() {
    if(domainRecords) return domainRecords;
    if(domainLoadPromise) return domainLoadPromise;
    domainLoadPromise=(async()=>{
      const tasks=await Promise.allSettled([
        fetch(SOURCES.registry,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('registry');return r.text();}),
        fetch(SOURCES.media,{mode:'cors'}).then(r=>{if(!r.ok)throw Error('media');return r.text();})
      ]);
      const merged=[];
      if(tasks[0].status==='fulfilled') merged.push(...parseJsonl(tasks[0].value));
      if(tasks[1].status==='fulfilled') merged.push(...parseJsonl(tasks[1].value));
      const seen=new Set();
      domainRecords=merged.filter(item=>{if(seen.has(item.domain))return false;seen.add(item.domain);return true;});
      domainRecords.sources={
        registry:tasks[0].status==='fulfilled',
        media:tasks[1].status==='fulfilled',
        mediaCount:tasks[1].status==='fulfilled'?parseJsonl(tasks[1].value).length:0
      };
      return domainRecords;
    })();
    return domainLoadPromise;
  }
  function addCard({title,url,description,icon='⌕',tag='HASIL',source=''}) {
    const article=document.createElement('article');
    article.className='safari-result-card';
    const mark=document.createElement('span');mark.className='safari-result-icon';mark.textContent=icon;
    const body=document.createElement('div');body.className='safari-result-body';
    const meta=document.createElement('div');meta.className='safari-result-meta';
    const type=document.createElement('span');type.className='safari-result-tag';type.textContent=tag;meta.append(type);
    if(source){const src=document.createElement('span');src.className='safari-result-source';src.textContent=source;meta.append(src);}
    const link=document.createElement('a');link.className='safari-result-link';link.href='#cari';link.removeAttribute('target');link.dataset.internalUrl=url;link.dataset.internalTitle=title||url;link.setAttribute('role','button');link.setAttribute('aria-label','Tampilkan '+(title||url)+' di area CARI');link.textContent=title||url;
    const address=document.createElement('p');address.className='safari-result-url';address.textContent=url;
    const desc=document.createElement('p');desc.className='safari-result-description';desc.textContent=description||'Buka sumber ini untuk melihat informasi lebih lanjut.';
    body.append(meta,link,address,desc);article.append(mark,body);results.append(article);
  }
  function renderDomains(query, records) {
    const needle=query.toLowerCase();
    const matched=records.filter(item=>item.domain.includes(needle)).slice(0,60);
    matched.forEach(item=>{
      const label=item.status==='aktif'?'LABEL KATALOG: AKTIF':item.status==='tidak aktif'?'LABEL KATALOG: TIDAK AKTIF':'STATUS: '+item.status.toUpperCase();
      addCard({
        title:item.domain,
        url:'https://'+item.domain,
        description:'Entri katalog domain. Label status berasal dari data sumber dan bukan hasil pemeriksaan DNS, registrasi, atau keterjangkauan saat ini.',
        icon:'◎',
        tag:'DOMAIN',
        source:label
      });
    });
    return matched.length;
  }
  function renderDirectUrl(query) {
    const raw=/^https?:\/\//i.test(query)?query:'https://'+query;
    try {
      const parsed=new URL(raw);
      if(!validDomain(cleanDomain(parsed.hostname))) return false;
      addCard({title:parsed.hostname,url:parsed.href,description:'URL yang Anda masukkan. Kartu ini menampilkan alamat yang diberikan, bukan hasil verifikasi koneksi.',icon:'↗',tag:'URL',source:'INPUT PENGGUNA'});
      return true;
    } catch (_) { return false; }
  }
  function showInlineDestination(url,title) {
    let viewer=$('safariInlineViewer');
    if(!viewer) {
      viewer=document.createElement('section');
      viewer.id='safariInlineViewer';
      viewer.className='safari-inline-viewer';
      viewer.setAttribute('aria-live','polite');
      results.after(viewer);
    }
    viewer.replaceChildren();
    const head=document.createElement('div');head.className='safari-inline-viewer-head';
    const heading=document.createElement('div');
    const label=document.createElement('p');label.className='safari-eyebrow';label.textContent='TAMPILAN DALAM CARI';
    const name=document.createElement('h3');name.textContent=title;
    const address=document.createElement('p');address.className='safari-inline-url';address.textContent=url;
    heading.append(label,name,address);
    const close=document.createElement('button');close.type='button';close.className='safari-inline-close';close.textContent='TUTUP TAMPILAN';
    close.addEventListener('click',()=>{viewer.hidden=true;viewer.replaceChildren();});
    head.append(heading,close);
    const frame=document.createElement('iframe');
    frame.className='safari-inline-frame';
    frame.title='Tampilan '+title+' di dalam menu CARI';
    frame.loading='lazy';frame.referrerPolicy='no-referrer';frame.src=url;
    const note=document.createElement('p');note.className='safari-inline-note';
    note.textContent='Situs tujuan dimuat di area ini. Jika pemilik situs melarang tampilan tertanam, halaman dapat menolak dimuat; menu CARI tetap terbuka.';
    viewer.append(head,note,frame);
    viewer.hidden=false;
    viewer.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function renderWiki(query) {
    const url=SOURCES.wiki+'?action=query&list=search&srsearch='+encodeURIComponent(query)+'&format=json&origin=*&srlimit=8';
    const response=await fetch(url);
    if(!response.ok) throw Error('Wikipedia unavailable');
    const data=await response.json();
    const items=data?.query?.search||[];
    items.forEach(item=>{
      const title=item.title||'Referensi Wikipedia';
      const href='https://en.wikipedia.org/wiki/'+encodeURIComponent(title.replace(/ /g,'_'));
      const summary=String(item.snippet||'').replace(/<[^>]*>/g,' ').replace(/&quot;/g,'"').replace(/&#039;/g,"'");
      addCard({title,url:href,description:summary||'Artikel referensi dari Wikipedia.',icon:'W',tag:'REFERENSI WEB',source:'WIKIPEDIA'});
    });
    return items.length;
  }
  function updateActiveType(type) {
    activeType=type;
    document.querySelectorAll('[data-search-type]').forEach(el=>{
      const active=el.dataset.searchType===type;
      el.classList.toggle('is-active',active);
      el.setAttribute('aria-pressed',String(active));
    });
  }
  async function runSearch(value,type=activeType) {
    const query=String(value||'').trim();
    if(!query||!results) return;
    setQuery(query);
    if(location.hash!=='#cari') location.hash='#cari';
    updateActiveType(type);
    results.replaceChildren();
    resultsTitle.textContent='HASIL UNTUK “'+query.toLocaleUpperCase('id')+'”';
    resultsCount.textContent='MEMUAT';
    resultsStatus.textContent='Menghubungkan registri .NZ dan katalog domain AL.L…';
    try {
      const records=await loadDomainRecords();
      const explicitUrl=/^(?:https?:\/\/|www\.)/i.test(query)||/[/?#]/.test(query);
      const direct=explicitUrl?renderDirectUrl(query):false;
      let domainCount=0, webCount=0;
      if(!direct && type!=='web') domainCount=renderDomains(query,records);
      if(!direct && !domainCount && type!=='web' && validDomain(cleanDomain(query))) {
        addCard({title:cleanDomain(query),url:'https://'+cleanDomain(query),description:'Nama domain dikenali dari input, tetapi belum ditemukan pada shard katalog yang tersedia. Ini bukan verifikasi DNS atau status registrasi.',icon:'◎',tag:'DOMAIN INPUT',source:'BELUM ADA DI KATALOG'});
        domainCount=1;
      }
      if(type==='all'||type==='web') {
        try { webCount=await renderWiki(query); }
        catch (_) { resultsStatus.textContent='Referensi web tidak tersedia. Hasil domain lokal tetap ditampilkan jika ada.'; }
      }
      const sourceNames=[
        records.sources.registry?'.NZ REGISTRY':'REGISTRY TIDAK TERSEDIA',
        records.sources.media?'AL.L DATA.MEDIA':'DATA.MEDIA TIDAK TERSEDIA'
      ];
      if(direct) resultsStatus.textContent='URL ditampilkan dari input Anda. Tidak ada pemeriksaan DNS atau status live yang dilakukan.';
      else if(domainCount||webCount) resultsStatus.textContent='Hasil ditampilkan dari katalog domain dan referensi web. Status domain adalah label katalog, bukan verifikasi live.';
      else resultsStatus.textContent='Tidak ada kecocokan pada sumber data yang tersedia. Coba nama domain atau kata kunci lain.';
      resultsCount.textContent=(direct?1:domainCount+webCount)+' HASIL';
      const sources=document.createElement('p');sources.className='safari-source-footnote';sources.textContent='SUMBER DATA: '+sourceNames.join(' · ')+' · '+records.length+' ENTRI DOMAIN DIMUAT ('+records.sources.mediaCount+' DARI AL.L SHARD TERSEDIA).';
      results.append(sources);
    } catch (_) {
      resultsStatus.textContent='Sumber registri tidak dapat dimuat. Periksa koneksi, lalu coba kembali.';
      resultsCount.textContent='0 HASIL';
    }
  }

  results?.addEventListener('click',event=>{
    const link=event.target.closest('a[data-internal-url]');
    if(!link) return;
    event.preventDefault();
    showInlineDestination(link.dataset.internalUrl,link.dataset.internalTitle||link.textContent);
  });
  function sync(source,target){if(source&&target)source.addEventListener('input',()=>{target.value=source.value;});}
  sync(searchInput,startInput);sync(startInput,searchInput);sync(topInput,searchInput);sync(homeInput,searchInput);sync(topInput,homeInput);sync(homeInput,topInput);
  [mainForm,startForm].forEach(form=>form?.addEventListener('submit',event=>{event.preventDefault();runSearch((form===mainForm?searchInput:startInput)?.value);}));
  [topForm,homeForm].forEach(form=>form?.addEventListener('submit',event=>{event.preventDefault();runSearch((form===topForm?topInput:homeInput)?.value,'all');}));
  document.querySelectorAll('[data-search-type]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    const query=searchInput?.value.trim()||startInput?.value.trim()||'';
    if(!query){searchInput?.focus();return;}
    runSearch(query,link.dataset.searchType||'all');
  }));
  try {const saved=sessionStorage.getItem('pb-global-search-query');if(saved)setQuery(saved);}catch(_){}
  [searchInput,startInput].forEach(input=>input?.addEventListener('input',()=>setQuery(input.value)));
  if(location.hash==='#cari'&&searchInput)searchInput.setAttribute('aria-label','Cari domain, URL, dan referensi web dari registri PlanetBintang');
})();