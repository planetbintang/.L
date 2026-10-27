(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#globalSearchForm'), input = $('#globalSearchInput');
  const topForm = $('#topbarSearchForm'), topInput = $('#topbarSearchInput');
  const homeForm = $('#homeSearchForm'), homeInput = $('#homeSearchInput');
  const results = $('#globalSearchResults'), status = $('#globalSearchStatus');
  if (!form || !input || !results || !status) return;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet'; stylesheet.href = './search-page.css?v=20261027-dual-search-v1';
  document.head.append(stylesheet);
  let repositories = [], treeIndexes = new Map(), activeType = 'all', requestToken = 0;
  const text = value => String(value ?? '');
  const slugify = value => text(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  const normalize = value => text(value).toLocaleLowerCase('id');
  const cleanQuery = value => normalize(value).trim()
    .replace(/^https?:\/\//, '').replace(/^www\./, '')
    .replace(/\.planetbintang\.com(?=\/|$)/, '')
    .replace(/\/+$/, '').trim();
  let domainCatalogPromise = null;
  async function loadDomainCatalog() {
    if (domainCatalogPromise) return domainCatalogPromise;
    const base = 'https://raw.githubusercontent.com/planetbintang/al.l/io/data.media/';
    domainCatalogPromise = Promise.all([
      fetch(base + 'domain-000001.media', {cache:'force-cache',credentials:'omit'}).then(r => r.ok ? r.text() : '').catch(() => ''),
      fetch(base + 'domain-seeds.txt', {cache:'force-cache',credentials:'omit'}).then(r => r.ok ? r.text() : '').catch(() => '')
    ]).then(([jsonl,seeds]) => {
      const found = new Map();
      jsonl.split(/\r?\n/).forEach(line => {
        try {
          const record = JSON.parse(line);
          const domain = text(record.domain).trim().toLowerCase();
          if (domain && /^[a-z0-9.-]+$/.test(domain)) found.set(domain, {domain, status:text(record.status || 'tercatat'), source:'domain-000001.media'});
        } catch (_) {}
      });
      seeds.split(/\r?\n/).forEach(line => {
        const domain = line.trim().toLowerCase();
        if (domain && /^[a-z0-9.-]+$/.test(domain) && !found.has(domain)) found.set(domain, {domain,status:'seed',source:'domain-seeds.txt'});
      });
      return [...found.values()];
    });
    return domainCatalogPromise;
  }
  function card({title, description, href, label, kind, path = '', repo = null}) {
    const article = document.createElement('article'); article.className = 'repo-card global-search-card';
    const badge = document.createElement('span'); badge.className = 'global-search-result-kind'; badge.textContent = kind;
    const heading = document.createElement('h3'); heading.textContent = title;
    const desc = document.createElement('p'); desc.textContent = description;
    article.append(badge, heading, desc);
    if (path) { const p = document.createElement('p'); p.className = 'global-search-result-path'; p.textContent = path; article.append(p); }
    if (repo) { const domain = document.createElement('p'); domain.className = 'global-search-domain'; domain.textContent = 'Domain rencana: ' + (slugify(repo.name) ? 'https://' + slugify(repo.name) + '.planetbintang.com' : 'belum tersedia') + ' (perlu DNS dan hosting).'; article.append(domain); }
    const a = document.createElement('a'); a.className = 'repo-action primary'; a.href = href; a.textContent = label; article.append(a);
    return article;
  }
  function setupLayout() {
    const section = $('#searchPage');
    if (!section || $('.global-search-layout', section)) return;
    const toolbar = $('#globalSearchForm')?.closest('.toolbar');
    const statusNode = $('#globalSearchStatus'), resultsNode = $('#globalSearchResults');
    const layout = document.createElement('div'); layout.className = 'global-search-layout';
    const aside = document.createElement('aside'); aside.className = 'global-search-sidebar';
    const h = document.createElement('h3'); h.textContent = 'JENIS PENCARIAN'; aside.append(h);
    const filterBox = document.createElement('div'); filterBox.id = 'globalSearchFilters'; filterBox.className = 'global-search-filters'; aside.append(filterBox);
    const main = document.createElement('div'); main.className = 'global-search-main';
    if (toolbar) main.append(toolbar); main.append(statusNode, resultsNode);
    layout.append(aside, main); section.append(layout);
  }
  setupLayout();
  const filterBox = $('#globalSearchFilters');
  function renderFilters(counts = {}) {
    if (!filterBox) return;
    filterBox.replaceChildren();
    [['all','Semua hasil',counts.all || 0],['repository','Repositori',counts.repository || 0],['folder','Folder & path',counts.folder || 0],['domain','Domain .media',counts.domain || 0]].forEach(([type,label,count]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'global-search-filter'; b.setAttribute('aria-pressed', String(activeType === type));
      const name = document.createElement('span'); name.textContent = label; const total = document.createElement('small'); total.textContent = String(count);
      b.append(name,total); b.addEventListener('click', () => { activeType = type; render(input.value); }); filterBox.append(b);
    });
  }
  async function loadTree(repo) {
    if (!repo?.tree?.indexUrl) return null;
    const key = repo.fullName || repo.name;
    if (treeIndexes.has(key)) return treeIndexes.get(key);
    const promise = fetch('./' + repo.tree.indexUrl.replace(/^\.\//,''), {cache:'force-cache',credentials:'omit'})
      .then(r => { if (!r.ok) throw new Error('Index pohon tidak tersedia'); return r.json(); }).catch(() => null);
    treeIndexes.set(key,promise); return promise;
  }
  async function collectFolderResults(q, token) {
    const output = [], candidates = repositories.filter(r => r.tree?.indexUrl && r.tree?.state !== 'unavailable');
    for (let i=0; i<candidates.length; i+=6) {
      if (token !== requestToken) return output;
      const batch = await Promise.all(candidates.slice(i,i+6).map(async repo => ({repo,index:await loadTree(repo)})));
      for (const {repo,index} of batch) {
        if (!index?.directories) continue;
        Object.keys(index.directories).forEach(path => {
          if (path && (normalize(path).includes(q) || normalize((repo.fullName || repo.name) + '/' + path).includes(q))) output.push({repo,path});
        });
      }
    }
    return output.slice(0,150);
  }
  async function render(query) {
    const token = ++requestToken, q = cleanQuery(query); results.replaceChildren();
    if (!q) { status.textContent = 'Indeks siap. Cari repositori, folder, atau domain dari katalog al.l/data.media.'; renderFilters({all:repositories.length,repository:repositories.length,folder:0,domain:0}); return; }
    status.textContent = 'Mencari repositori, path folder, dan katalog domain al.l/data.media…';
    const repoMatches = repositories.filter(repo => [repo.name,repo.fullName,repo.description,repo.language,repo.appType,repo.host,repo.homepage,repo.pagesUrl,...(repo.languages||[]).map(x=>x.name)].some(v=>normalize(v).includes(q))).slice(0,100);
    const [folderMatches, allDomains] = await Promise.all([collectFolderResults(q,token), loadDomainCatalog()]);
    if (token !== requestToken) return;
    const domainMatches = allDomains.filter(item => normalize(item.domain).includes(q)).slice(0,100);
    const allCount = repoMatches.length + folderMatches.length + domainMatches.length;
    renderFilters({all:allCount,repository:repoMatches.length,folder:folderMatches.length,domain:domainMatches.length});
    const items = [];
    if (activeType !== 'folder') repoMatches.forEach(repo => {
      const name = text(repo.name || repo.fullName || 'Repositori');
      const desc = [repo.fullName || '',repo.appType || '',repo.branch ? 'branch ' + repo.branch : ''].filter(Boolean).join(' · ');
      const item = card({title:name,description:desc,href:'#fileManager',label:'Buka di File Manager',kind:'REPOSITORI',repo});
      item.querySelector('a').addEventListener('click', () => { try { sessionStorage.setItem('pb-search-repo',text(repo.fullName||repo.name)); sessionStorage.setItem('pb-search-path',''); } catch (_) {} });
      items.push(item);
    });
    if (activeType !== 'repository') folderMatches.forEach(({repo,path}) => {
      const item = card({title:path.split('/').pop() || '/',description:repo.fullName || repo.name || 'Repositori',path:'/' + path,href:'#fileManager/' + path.split('/').map(encodeURIComponent).join('/'),label:'Buka folder',kind:'FOLDER'});
      item.querySelector('a').addEventListener('click', () => { try { sessionStorage.setItem('pb-search-repo',text(repo.fullName||repo.name)); sessionStorage.setItem('pb-search-path',path); } catch (_) {} });
      items.push(item);
    });
    if (activeType === 'all' || activeType === 'domain') domainMatches.forEach(({domain,status:domainStatus,source}) => {
      const item = card({title:domain,description:'Katalog domain al.l/data.media · status: ' + domainStatus,path:source,href:'https://' + domain,label:'Buka situs',kind:'DOMAIN'});
      item.querySelector('a').target = '_blank'; item.querySelector('a').rel = 'noopener noreferrer';
      items.push(item);
    });
    items.forEach(item=>results.append(item));
    status.textContent = allCount + ' hasil ditemukan: ' + repoMatches.length + ' repositori, ' + folderMatches.length + ' folder, ' + domainMatches.length + ' domain dari katalog al.l/data.media. Katalog membaca shard yang tersedia di GitHub; file bulk di storage terpisah tidak diasumsikan tersedia.';
    if (!items.length) { const empty=document.createElement('p'); empty.className='global-search-empty'; empty.textContent='Tidak ada hasil cocok pada jenis pencarian ini.'; results.append(empty); }
  }
  function openGlobalSearch(value) {
    const query = text(value).trim();
    if (input) { input.value = query; }
    try { sessionStorage.setItem('pb-global-search-query', query); } catch (_) {}
    if (location.hash !== '#cari') location.hash = '#cari';
    const run = () => { if (input) { input.value = query; render(query); } };
    window.setTimeout(run, 80);
    window.setTimeout(run, 260);
  }
  form.addEventListener('submit', e => { e.preventDefault(); render(input.value); });
  input.addEventListener('input', () => render(input.value));
  if (topForm && topInput) topForm.addEventListener('submit', e => { e.preventDefault(); openGlobalSearch(topInput.value); });
  if (homeForm && homeInput) homeForm.addEventListener('submit', e => { e.preventDefault(); openGlobalSearch(homeInput.value); });
  if (topInput && homeInput) {
    topInput.addEventListener('input', () => { if (document.activeElement === topInput) homeInput.value = topInput.value; });
    homeInput.addEventListener('input', () => { if (document.activeElement === homeInput) topInput.value = homeInput.value; });
  }
  try {
    const savedQuery = sessionStorage.getItem('pb-global-search-query');
    if (savedQuery && input) { input.value = savedQuery; if (topInput) topInput.value = savedQuery; if (homeInput) homeInput.value = savedQuery; }
  } catch (_) {}
  fetch('./data/repositories.json',{cache:'no-cache',credentials:'omit'}).then(r=>{if(!r.ok)throw new Error('Snapshot tidak tersedia');return r.json();})
    .then(data=>{repositories=Array.isArray(data.repositories)?data.repositories:[];status.textContent='Indeks siap · '+repositories.length+' entri sumber.';renderFilters({all:repositories.length,repository:repositories.length,folder:0});render(input.value);})
    .catch(()=>{status.textContent='Indeks repositori belum dapat dimuat. Periksa data/repositories.json.';});
})();