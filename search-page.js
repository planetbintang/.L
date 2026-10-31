(() => {
  'use strict';
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './search-page.css?v=20261031-internal-search-v2';
  document.head.append(css);

  const searchInput = document.getElementById('globalSearchInput');
  const startInput = document.getElementById('safariStartInput');
  const topForm = document.getElementById('topbarSearchForm');
  const topInput = document.getElementById('topbarSearchInput');
  const homeForm = document.getElementById('homeSearchForm');
  const homeInput = document.getElementById('homeSearchInput');
  const mainForm = document.getElementById('globalSearchForm');
  const startForm = document.getElementById('safariStartForm');
  const results = document.getElementById('safariResultsList');
  const resultsTitle = document.getElementById('safariResultsTitle');
  const resultsCount = document.getElementById('safariResultsCount');
  const resultsStatus = document.getElementById('safariResultsStatus');

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const googleUrl = (query, type = 'web') => {
    const params = new URLSearchParams({q:query});
    if (type === 'images') params.set('tbm','isch');
    if (type === 'news') params.set('tbm','nws');
    if (type === 'videos') params.set('tbm','vid');
    return 'https://www.google.com/search?' + params.toString();
  };
  function setQuery(value) {
    [searchInput,startInput,topInput,homeInput].forEach(input => { if (input) input.value = value; });
    try { sessionStorage.setItem('pb-global-search-query', value); } catch (_) {}
  }
  function addCard(item) {
    const article = document.createElement('article');
    article.className = 'safari-result-card';
    const link = document.createElement('a');
    link.className = 'safari-result-link';
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.title || item.url;
    const url = document.createElement('p');
    url.className = 'safari-result-url';
    url.textContent = item.url;
    const desc = document.createElement('p');
    desc.className = 'safari-result-description';
    desc.textContent = item.description || 'Buka tautan ini untuk melihat sumber informasi.';
    const icon = document.createElement('span');
    icon.className = 'safari-result-icon';
    icon.textContent = item.icon || '↗';
    const body = document.createElement('div');
    body.append(link,url,desc);
    article.append(icon,body);
    results.append(article);
  }
  async function runSearch(value) {
    const query = String(value || '').trim();
    if (!query || !results) return;
    setQuery(query);
    if (location.hash !== '#cari') location.hash = '#cari';
    results.replaceChildren();
    resultsTitle.textContent = 'HASIL UNTUK “' + query.toLocaleUpperCase('id') + '”';
    resultsCount.textContent = 'MEMUAT';
    resultsStatus.textContent = 'Menyiapkan daftar hasil pencarian…';

    const isUrl = /^(https?:\/\/|www\.)/i.test(query) || /^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(query);
    if (isUrl) {
      const normalized = /^https?:\/\//i.test(query) ? query : 'https://' + query;
      try {
        const parsed = new URL(normalized);
        addCard({title:parsed.hostname,url:parsed.href,description:'Alamat situs yang Anda masukkan. Buka tautan untuk mengunjungi situs tersebut.',icon:'↗'});

      } catch (_) {
        }
      resultsStatus.textContent = 'URL dikenali. Hasil ditampilkan di halaman ini; buka tautan hanya jika ingin mengunjungi situs tujuan.';
      resultsCount.textContent = 'URL + PINTASAN';
      return;
    }

    // DuckDuckGo Instant Answer menyediakan referensi publik tanpa API key; Google tetap menjadi jalur hasil web lengkap.
    try {
      const endpoint = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1&skip_disambig=1';
      const response = await fetch(endpoint, {headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error('Search provider unavailable');
      const data = await response.json();
      const found = [];
      if (data.AbstractText && data.AbstractURL) found.push({title:data.Heading || query,url:data.AbstractURL,description:data.AbstractText,icon:'i'});
      (data.Results || []).forEach(item => { if(item.FirstURL) found.push({title:item.Text || item.FirstURL,url:item.FirstURL,description:'Referensi terkait dari DuckDuckGo.',icon:'↗'}); });
      function collect(items) {
        (items || []).forEach(item => {
          if (item.Topics) collect(item.Topics);
          else if (item.FirstURL) found.push({title:item.Text || item.FirstURL,url:item.FirstURL,description:'Topik terkait dari indeks referensi web.',icon:'↗'});
        });
      }
      collect(data.RelatedTopics);
      const seen = new Set();
      found.filter(item=>{if(seen.has(item.url))return false;seen.add(item.url);return true;}).slice(0,8).forEach(addCard);
      resultsStatus.textContent = found.length ? 'Referensi ditemukan dan ditampilkan langsung di halaman pencarian ini.' : 'Belum ada referensi otomatis untuk kata kunci ini. Coba kata kunci yang lebih spesifik.';
    } catch (_) {
      resultsStatus.textContent = 'Layanan referensi tidak merespons. Pencarian tetap berada di halaman ini; coba lagi beberapa saat.';
    }
    resultsCount.textContent = results.children.length + ' TAUTAN';
  }

  function sync(source,target) { if(source&&target) source.addEventListener('input',()=>{target.value=source.value;}); }
  sync(searchInput,startInput); sync(startInput,searchInput); sync(topInput,searchInput); sync(homeInput,searchInput);
  sync(topInput,homeInput); sync(homeInput,topInput);
  [mainForm,startForm].forEach(form=>form?.addEventListener('submit',event=>{event.preventDefault();runSearch((form===mainForm?searchInput:startInput)?.value);}));
  [topForm,homeForm].forEach(form=>form?.addEventListener('submit',event=>{event.preventDefault();const value=(form===topForm?topInput:homeInput)?.value||'';runSearch(value);}));
  document.querySelectorAll('[data-search-type]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    const query=searchInput?.value.trim()||startInput?.value.trim()||'';
    if(!query){searchInput?.focus();return;}
    window.open(googleUrl(query,link.dataset.searchType),'_blank','noopener');
  }));
  try {
    const saved=sessionStorage.getItem('pb-global-search-query');
    if(saved) setQuery(saved);
  } catch (_) {}
  [searchInput,startInput].forEach(input=>input?.addEventListener('input',()=>setQuery(input.value)));
  if (location.hash === '#cari' && searchInput) searchInput.setAttribute('aria-label','Cari di Google atau masukkan URL');
})();