(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#globalSearchForm'), input = $('#globalSearchInput');
  const results = $('#globalSearchResults'), status = $('#globalSearchStatus');
  const sidebar = $('#globalSearchFilters');
  if (!form || !input || !results || !sidebar) return;
  let repositories = [], treeIndexes = new Map(), activeType = 'all', requestToken = 0;
  const text = value => String(value ?? '');
  const slugify = value => text(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  const normalize = value => text(value).toLocaleLowerCase('id');
  function card({title, description, href, label, kind, path = '', repo = null}) {
    const article = document.createElement('article'); article.className = 'repo-card global-search-card';
    const badge = document.createElement('span'); badge.className = 'global-search-result-kind'; badge.textContent = kind;
    const heading = document.createElement('h3'); heading.textContent = title;
    const desc = document.createElement('p'); desc.textContent = description;
    article.append(badge, heading, desc);
    if (path) { const p = document.createElement('p'); p.className = 'global-search-result-path'; p.textContent = path; article.append(p); }
    if (repo) {
      const domain = document.createElement('p'); domain.className = 'global-search-domain';
      domain.textContent = 'Domain rencana: ' + (slugify(repo.name) ? 'https://' + slugify(repo.name) + '.planetbintang.com' : 'belum tersedia') + ' (perlu DNS dan hosting).';
      article.append(domain);
    }
    const a = document.createElement('a'); a.className = 'repo-action primary'; a.href = href; a.textContent = label; article.append(a);
    return article;
  }
  function setupLayout() {
    const section = $('#searchPage');
    if (!section || $('.global-search-layout', section)) return;
    const formNode = $('#globalSearchForm'), statusNode = $('#globalSearchStatus'), resultsNode = $('#globalSearchResults');
    const layout = document.createElement('div'); layout.className = 'global-search-layout';
    const aside = document.createElement('aside'); aside.className = 'global-search-sidebar';
    const h = document.createElement('h3'); h.textContent = 'JENIS PENCARIAN'; aside.append(h);
    sidebar.className = 'global-search-filters'; aside.append(sidebar);
    const main = document.createElement('div'); main.className = 'global-search-main';
    const toolbar = formNode.closest('.toolbar');
    main.append(toolbar, statusNode, resultsNode);
    layout.append(aside, main); section.append(layout);
  }
  function setFilter(type) { activeType = type; render(input.value); }
  function renderFilters(counts = {}) {
    sidebar.replaceChildren();
    [['all','Semua hasil',counts.all || 0],['repository','Repositori',counts.repository || 0],['folder','Folder & path',counts.folder || 0]].forEach(([type,label,count]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'global-search-filter';
      b.setAttribute('aria-pressed', String(activeType === type));
      const name = document.createElement('span'); name.textContent = label;
      const total = document.createElement('small'); total.textContent = String(count);
      b.append(name,total); b.addEventListener('click', () => setFilter(type)); sidebar.append(b);
    });
  }
  async function loadTree(repo) {
    if (!repo?.tree?.indexUrl) return null;
    const key = repo.fullName || repo.name;
    if (treeIndexes.has(key)) return treeIndexes.get(key);
    const promise = fetch('./' + repo.tree.indexUrl.replace(/^\.\//,''), {cache:'force-cache',credentials:'omit'})
      .then(r => { if (!r.ok) throw new Error('Index pohon tidak tersedia'); return r.json(); })
      .catch(() => null);
    treeIndexes.set(key,promise); return promise;
  }
  async function collectFolderResults(q, token) {
    const output = [];
    const candidates = repositories.filter(r => r.tree?.indexUrl && r.tree?.state !== 'unavailable');
    // Tree index berisi daftar path direktori; muat indeks secara paralel terbatas.
    for (let i=0; i<candidates.length; i+=6) {
      if (token !== requestToken) return output;
      const batch = await Promise.all(candidates.slice(i,i+6).map(async repo => ({repo,index:await loadTree(repo)})));
      for (const {repo,index} of batch) {
        if (!index || !index.directories) continue;
        Object.keys(index.directories).forEach(path => {
          if (!path || !normalize(path).includes(q)) return;
          output.push({repo,path});
        });
      }
    }
    return output.slice(0,150);
  }
  async function render(query) {
    const token = ++requestToken, q = normalize(query.trim());
    results.replaceChildren();
    if (!q) {
      status.textContent = 'Indeks siap. Ketik nama repositori atau path folder. Pencarian memakai snapshot struktur repositori yang dipublikasikan.';
      renderFilters({all:repositories.length,repository:repositories.length,folder:0}); return;
    }
    status.textContent = 'Mencari metadata dan indeks path folder…';
    const repoMatches = repositories.filter(repo => [repo.name,repo.fullName,repo.description,repo.language,repo.appType,repo.host,repo.homepage,repo.pagesUrl,...(repo.languages||[]).map(x=>x.name)].some(v=>normalize(v).includes(q))).slice(0,100);
    const folderMatches = await collectFolderResults(q,token);
    if (token !== requestToken) return;
    const allCount = repoMatches.length + folderMatches.length;
    renderFilters({all:allCount,repository:repoMatches.length,folder:folderMatches.length});
    const items = [];
    if (activeType !== 'folder') repoMatches.forEach(repo => {
      const name = text(repo.name || repo.fullName || 'Repositori');
      const desc = [repo.description || 'Repositori Planetbintang', repo.appType || '', repo.branch ? 'branch ' + repo.branch : ''].filter(Boolean).join(' · ');
      items.push(card({title:name,description:desc,href:'#fileManager',label:'Buka di File Manager',kind:'REPOSITORI',repo}));
      const latest = items[items.length-1].querySelector('a');
      latest.addEventListener('click', () => { try { sessionStorage.setItem('pb-search-repo',text(repo.fullName||repo.name)); sessionStorage.setItem('pb-search-path',''); } catch (_) {} });
    });
    if (activeType !== 'repository') folderMatches.forEach(({repo,path}) => {
      const name = path.split('/').pop() || '/';
      items.push(card({title:name,description:repo.fullName || repo.name || 'Repositori',path:'/' + path,href:'#fileManager/' + path.split('/').map(encodeURIComponent).join('/'),label:'Buka folder',kind:'FOLDER',repo:null}));
      items[items.length-1].querySelector('a').addEventListener('click', () => {
        try { sessionStorage.setItem('pb-search-repo',text(repo.fullName||repo.name)); sessionStorage.setItem('pb-search-path',path); } catch (_) {}
      });
    });
    items.forEach(item=>results.append(item));
    status.textContent = allCount + ' hasil ditemukan pada ' + repositories.length + ' metadata repositori. Pencarian folder berdasarkan indeks path yang tersedia; isi file tidak diunduh.';
    if (!items.length) { const empty=document.createElement('p'); empty.className='global-search-empty'; empty.textContent='Tidak ada hasil cocok pada jenis pencarian ini.'; results.append(empty); }
  }
  form.addEventListener('submit', e => { e.preventDefault(); render(input.value); });
  input.addEventListener('input', () => render(input.value));
  setupLayout();
  fetch('./data/repositories.json',{cache:'no-cache',credentials:'omit'})
    .then(r=>{if(!r.ok) throw new Error('Snapshot tidak tersedia');return r.json();})
    .then(data=>{repositories=Array.isArray(data.repositories)?data.repositories:[];status.textContent='Indeks siap · '+repositories.length+' entri sumber.';renderFilters({all:repositories.length,repository:repositories.length,folder:0});render(input.value);})
    .catch(()=>{status.textContent='Indeks repositori belum dapat dimuat. Periksa data/repositories.json.';});
})();