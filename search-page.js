(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#globalSearchForm');
  const input = $('#globalSearchInput');
  const results = $('#globalSearchResults');
  const status = $('#globalSearchStatus');
  if (!form || !input || !results) return;
  let repositories = [];
  const safeText = (value) => String(value ?? '');
  const slugify = (value) => safeText(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  function linkCard(title, description, href, label = 'Buka') {
    const card = document.createElement('article'); card.className = 'repo-card';
    const h = document.createElement('h3'); h.textContent = title;
    const p = document.createElement('p'); p.textContent = description;
    const a = document.createElement('a'); a.className = 'repo-action primary'; a.href = href; a.textContent = label;
    card.append(h, p, a); return card;
  }
  function render(query) {
    const q = query.trim().toLocaleLowerCase('id');
    results.replaceChildren();
    if (!q) { status.textContent = 'Ketik nama repositori, folder, path, atau kata kunci untuk mulai mencari.'; return; }
    const matched = repositories.filter(repo => [repo.name, repo.fullName, repo.description, repo.language, repo.appType, repo.host, repo.homepage, repo.pagesUrl].some(v => safeText(v).toLocaleLowerCase('id').includes(q))).slice(0, 50);
    matched.forEach(repo => {
      const name = safeText(repo.name || repo.fullName || 'Repositori');
      const slug = slugify(name);
      const description = [repo.description || 'Repositori Planetbintang', repo.language || '', repo.host || ''].filter(Boolean).join(' · ');
      const card = linkCard(name, description, '#fileManager', 'Buka di File Manager');
      const domain = document.createElement('p'); domain.className = 'global-search-domain';
      domain.textContent = 'Domain yang disarankan: ' + (slug ? 'https://' + slug + '.planetbintang.com' : 'belum tersedia') + ' · perlu konfigurasi DNS/hosting.';
      card.append(domain);
      card.querySelector('a').addEventListener('click', () => {
        try { sessionStorage.setItem('pb-search-repo', safeText(repo.fullName || repo.name)); } catch (_) {}
      });
      results.append(card);
    });
    // Crawl metadata for folder paths already present in the published tree index.
    const folderQuery = q.replace(/^\/+|\/+$/g, '');
    const folderLinks = [];
    if (folderQuery && /^[a-z0-9._/-]+$/i.test(folderQuery)) {
      const path = folderQuery.split('/').filter(part => part && part !== '.' && part !== '..').join('/');
      if (path) folderLinks.push(linkCard('/' + path, 'Buka path ini pada File Manager. Hasil path mengikuti indeks folder yang tersedia di browser.', '#fileManager/' + path, 'Buka folder'));
    }
    folderLinks.forEach(card => results.append(card));
    status.textContent = matched.length + ' repositori cocok' + (folderLinks.length ? ' · path folder juga tersedia' : '') + '. Isi folder bergantung pada snapshot File Manager yang sudah dipublikasikan.';
    if (!matched.length && !folderLinks.length) {
      const empty = document.createElement('p'); empty.className = 'fm-empty'; empty.textContent = 'Tidak ada hasil yang cocok pada indeks repositori atau path yang dimasukkan.'; results.append(empty);
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); render(input.value); });
  input.addEventListener('input', () => render(input.value));
  fetch('./data/repositories.json', { cache: 'no-cache', credentials: 'omit' })
    .then(response => { if (!response.ok) throw new Error('Snapshot tidak tersedia'); return response.json(); })
    .then(data => { repositories = Array.isArray(data.repositories) ? data.repositories : []; status.textContent = 'Indeks siap · ' + repositories.length + ' entri sumber.'; render(input.value); })
    .catch(() => { status.textContent = 'Indeks repositori belum dapat dimuat. Periksa data/repositories.json.'; });
})();