(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = { data: null, query: '', visibility: 'all', appType: 'all' };
  // Binary visibility mask: bit 0..9 hides repositories named exactly 0..9.
  const HIDDEN_REPOSITORY_MASK = 0b1111111111;
  const isHiddenRepository = (repo) => {
    const name = String(repo?.name ?? '').trim();
    if (!/^[0-9]$/.test(name)) return false;
    return (HIDDEN_REPOSITORY_MASK & (1 << Number(name))) !== 0;
  };
  const visibleSnapshot = (data) => {
    const repositories = (data.repositories || []).filter((repo) => !isHiddenRepository(repo));
    const publicCount = repositories.filter((repo) => repo.visibility === 'public').length;
    const privateCount = repositories.filter((repo) => repo.visibility === 'private').length;
    const pagesEnabledCount = repositories.filter((repo) => Boolean(repo.pagesUrl || repo.homepage)).length;
    return { ...data, repositories, repositoryCount: repositories.length, publicCount, privateCount, pagesEnabledCount };
  };
  const snapshotConsumers = new Map();
  const consumerStates = new Map();
  const fmt = new Intl.NumberFormat('id-ID');
  const fmtDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date) + ' UTC';
  };
  const safeHttps = (value) => {
    try { const url = new URL(value); return url.protocol === 'https:' && !/github/i.test(url.hostname) ? url.href : ''; } catch { return ''; }
  };
  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value == null || value === '' ? '—' : String(value);
    return node;
  };
  const anchor = (href, label, className = '') => {
    const url = safeHttps(href);
    const node = document.createElement(url ? 'a' : 'span');
    if (url) { node.href = url; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
    node.className = className;
    node.textContent = label;
    return node;
  };
  const detail = (label, value, className = '') => {
    const wrapper = document.createElement('div'); wrapper.className = 'detail-cell';
    wrapper.append(text('span', label, 'detail-label'));
    if (value instanceof Node) wrapper.append(value); else wrapper.append(text('div', value, `detail-value ${className}`.trim()));
    return wrapper;
  };
  const setConnection = (label, live) => {
    const node = $('#connectionLabel');
    node.textContent = label;
    node.parentElement.classList.toggle('is-live', Boolean(live));
  };
  function announceSync(phase, detail = {}) {
    window.dispatchEvent(new CustomEvent('planetbintang:snapshot-state', { detail: { phase, ...detail } }));
  }
  async function runSnapshotConsumer(name, handler, data) {
    consumerStates.set(name, 'loading'); announceSync('consumer', { name, status: 'loading' });
    try {
      await handler(data);
      consumerStates.set(name, 'ready'); announceSync('consumer', { name, status: 'ready' });
      return true;
    } catch (error) {
      consumerStates.set(name, 'error'); announceSync('consumer', { name, status: 'error', message: error.message });
      return false;
    }
  }

  function renderSummary(data) {
    $('#metricTotal').textContent = fmt.format(data.repositoryCount || data.repositories.length);
    $('#metricPublic').textContent = fmt.format(data.publicCount || 0);
    $('#metricPrivate').textContent = fmt.format(data.privateCount || 0);
    $('#metricPages').textContent = fmt.format(data.pagesEnabledCount || 0);
    $('#metricHash').textContent = data.dataSha256 ? data.dataSha256.slice(0, 16) + '…' : '—';
    $('#snapshotStatus').textContent = `Snapshot ${fmtDate(data.updatedAt)} · ${data.repositoryCount || data.repositories.length} repo`;
    $('#footerSnapshot').textContent = `Snapshot ${fmtDate(data.updatedAt)} · ${data.repositoryCount || data.repositories.length} repositori`;
    $('#connectorState').textContent = data.connector?.label ? `${data.connector.label} ↔ ${data.connector.owner || 'GitHub'}` : 'GitHub';
    $('#syncState').textContent = data.connector?.sync?.toLowerCase().includes('when') ? 'MENUNGGU SECRET' : 'TERJADWAL';
    $('#dnsUpdated').textContent = `DNS snapshot: ${fmtDate(data.dnsCheckedAt)}`;
    setConnection('Snapshot GitHub', true);
  }

  function buildAppFilter(repositories) {
    const select = $('#appFilter');
    const current = select.value;
    const types = [...new Set(repositories.map((repo) => repo.appType).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));
    select.replaceChildren(new Option('Semua tipe aplikasi', 'all'));
    types.forEach((type) => select.add(new Option(type, type)));
    select.value = types.includes(current) ? current : 'all';
  }

  function safeRootName(name) {
    return !/(^|[._-])(secret|secrets|credential|credentials|token|tokens|password|passwd|private|key|keys|pem|cert|certificate|ssl|ssh|id_rsa|env|dotenv|backup|dump|member|user|traffic|analytics)([._/-]|$)/i.test(name || '');
  }

  function trafficBadges(repo) {
    const line = document.createElement('div'); line.className = 'traffic-line';
    const traffic = repo.traffic14d;
    const days = traffic?.windowDays || 14;
    if (!traffic || (!traffic.views && !traffic.clones)) {
      line.append(text('span', `Trafik repo ${days} hari: data tidak tersedia`, 'traffic-pill'));
      line.append(text('span', 'Identitas/member: tersembunyi', 'traffic-pill'));
      return line;
    }
    if (traffic.views) line.append(text('span', `${fmt.format(traffic.views.count || 0)} views · ${fmt.format(traffic.views.uniques || 0)} unik · ${days} hari`, 'traffic-pill'));
    if (traffic.clones) line.append(text('span', `${fmt.format(traffic.clones.count || 0)} clone · ${fmt.format(traffic.clones.uniqueCloners || 0)} unik · ${days} hari`, 'traffic-pill'));
    line.append(text('span', 'Agregat · tanpa identitas', 'traffic-pill'));
    return line;
  }

  function makeRepoCard(repo) {
    const card = document.createElement('article'); card.className = 'repo-card';
    const head = document.createElement('header'); head.className = 'repo-head';
    const titleRow = document.createElement('div'); titleRow.className = 'repo-title-row';
    const glyph = document.createElement('span'); glyph.className = 'repo-glyph';
    const logo = document.createElement('img'); logo.src = './brand-logo-browser.png'; logo.alt = ''; glyph.append(logo);
    const nameWrap = document.createElement('div'); nameWrap.className = 'repo-name';
    const title = document.createElement('h3'); title.append(anchor(repo.url, repo.fullName || repo.name));
    nameWrap.append(title, text('small', `branch: ${repo.branch || '—'} · ${repo.state === 'empty' ? 'repo kosong' : repo.state === 'unavailable' ? 'akses tidak tersedia' : 'metadata publik'}`));
    titleRow.append(glyph, nameWrap);
    const badge = text('span', (repo.visibility || 'unknown').toUpperCase(), `visibility-badge ${repo.visibility || ''}`);
    head.append(titleRow, badge); card.append(head);

    const details = document.createElement('div'); details.className = 'repo-details';
    details.append(detail('Sistem / aplikasi', text('span', repo.appType || 'Tidak terklasifikasi', 'app-tag')));
    details.append(detail('Bahasa utama', (repo.languages || []).length ? repo.languages.slice(0, 3).map((language) => language.name).join(' · ') : '—'));
    details.append(detail('Domain deployment', repo.pagesUrl || repo.homepage ? anchor(repo.pagesUrl || repo.homepage, repo.domain || 'Buka domain') : 'Belum ada domain Pages'));
    const hostValue = document.createElement('div'); hostValue.className = 'detail-value';
    hostValue.append(text('span', repo.host || 'snapshot-local'));
    hostValue.append(document.createElement('br'));
    hostValue.append(text('code', (repo.ipAddresses || []).join(' · ') || 'DNS IP tidak tersedia'));
    details.append(detail('Host / IP DNS publik', hostValue));
    const shaValue = document.createElement('div'); shaValue.className = 'detail-value';
    shaValue.append(repo.headSha ? anchor(`${repo.url}/commit/${repo.headSha}`, repo.headSha.slice(0, 12)) : text('span', '—'));
    if (repo.lastCommitAt) { shaValue.append(document.createElement('br')); shaValue.append(text('small', fmtDate(repo.lastCommitAt))); }
    details.append(detail('SHA commit terakhir', shaValue));
    details.append(detail('Anggota', 'Tidak dipublikasikan · tersimpan pada snapshot'));
    details.append(trafficBadges(repo));
    card.append(details);

    const actions = document.createElement('div'); actions.className = 'repo-actions';
    const openRepo = anchor(repo.url, 'Buka repositori ↗', 'repo-action primary'); actions.append(openRepo);
    if (repo.pagesUrl || repo.homepage) actions.append(anchor(repo.pagesUrl || repo.homepage, 'Buka aplikasi ↗', 'repo-action'));
    else actions.append(text('span', 'Butuh runtime asal', 'repo-action disabled'));
    card.append(actions);

    const safeItems = (repo.rootItems || []).filter((item) => safeRootName(item.name));
    const root = document.createElement('details'); root.className = 'root-details';
    const summary = document.createElement('summary');
    summary.append(text('span', `Peta root filesystem · ${safeItems.length} item aman`));
    root.append(summary);
    const list = document.createElement('ul'); list.className = 'root-list';
    if (safeItems.length) safeItems.forEach((item) => list.append(text('li', `${item.type === 'folder' ? '▸ ' : '· '}${item.name}`)));
    else list.append(text('li', repo.state === 'empty' ? 'Repository kosong' : 'Tidak ada jalur aman yang dapat ditampilkan'));
    root.append(list); card.append(root);
    return card;
  }

  function renderRepositories() {
    const grid = $('#repoGrid'); grid.replaceChildren();
    const query = state.query.trim().toLocaleLowerCase('id');
    const filtered = (state.data?.repositories || []).filter((repo) => {
      if (state.visibility !== 'all' && repo.visibility !== state.visibility) return false;
      if (state.appType !== 'all' && repo.appType !== state.appType) return false;
      const haystack = [repo.fullName, repo.appType, repo.branch, repo.domain, ...(repo.languages || []).map((item) => item.name)].join(' ').toLocaleLowerCase('id');
      return !query || haystack.includes(query);
    });
    filtered.forEach((repo) => grid.append(makeRepoCard(repo)));
    $('#resultCount').textContent = `${fmt.format(filtered.length)} dari ${fmt.format(state.data?.repositories.length || 0)} repositori`;
    if (!filtered.length) {
      const empty = document.createElement('div'); empty.className = 'empty-card';
      empty.append(text('strong', 'Tidak ada hasil'), text('span', 'Ubah kata pencarian atau filter visibilitas.'));
      grid.append(empty);
    }
  }

  function renderHosts(data) {
    const grid = $('#hostGrid'); grid.replaceChildren();
    const uses = new Map();
    (data.repositories || []).forEach((repo) => {
      if (!repo.host) return;
      if (!uses.has(repo.host)) uses.set(repo.host, []);
      uses.get(repo.host).push(repo.name);
    });
    const entries = Object.entries(data.domainMap || {}).sort(([a], [b]) => a.localeCompare(b));
    entries.forEach(([host, info]) => {
      const card = document.createElement('article'); card.className = 'host-card';
      const top = document.createElement('div'); top.className = 'host-card-top';
      top.append(text('h3', host), text('span', 'SNAPSHOT HOST', 'host-type'));
      card.append(top);
      const addresses = document.createElement('ul'); addresses.className = 'host-addresses';
      const ips = info?.addresses || [];
      if (ips.length) ips.forEach((ip) => addresses.append(text('li', ip)));
      else addresses.append(text('li', 'DNS tidak teresolusi', 'no-address'));
      card.append(addresses);
      const repoNames = uses.get(host) || [];
      card.append(text('p', repoNames.length ? `Terhubung ke ${repoNames.length} repo: ${repoNames.slice(0, 4).join(', ')}${repoNames.length > 4 ? '…' : ''}` : 'Host sistem / API.', 'host-uses'));
      grid.append(card);
    });
    if (!entries.length) grid.append(text('div', 'Tidak ada domain terpetakan pada snapshot ini.', 'empty-card'));
  }

  async function loadSnapshot(cacheBust = false) {
    setConnection('Memuat snapshot', false);
    announceSync('loading');
    try {
      const suffix = cacheBust ? `?t=${Date.now()}` : '';
      const response = await fetch(`./data/repositories.json${suffix}`, { cache: cacheBust ? 'no-store' : 'no-cache', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.repositories)) throw new Error('Format snapshot tidak valid');
      const filteredData = visibleSnapshot(data);
      state.data = filteredData;
      renderSummary(filteredData);
      buildAppFilter(filteredData.repositories);
      renderRepositories();
      renderHosts(filteredData);
      const results = await Promise.all([...snapshotConsumers].map(([name, handler]) => runSnapshotConsumer(name, handler, filteredData)));
      announceSync(results.every(Boolean) ? 'ready' : 'partial', { updatedAt: filteredData.updatedAt, repositoryCount: filteredData.repositoryCount, dataSha256: filteredData.dataSha256 || '' });
      return true;
    } catch (error) {
      setConnection('Snapshot gagal', false);
      announceSync('error', { message: error.message });
      $('#snapshotStatus').textContent = 'Data belum tersedia';
      $('#repoGrid').replaceChildren(text('div', `Tidak dapat membaca data dashboard: ${error.message}`, 'empty-card'));
      return false;
    }
  }

  window.PBSystemSnapshot = {
    get data() { return state.data; },
    get consumers() { return Object.fromEntries(consumerStates); },
    subscribe(name, handler) {
      snapshotConsumers.set(name, handler);
      if (state.data) void runSnapshotConsumer(name, handler, state.data);
      return () => { snapshotConsumers.delete(name); consumerStates.delete(name); };
    },
    refresh() { return loadSnapshot(true); },
  };

  $('#searchInput').addEventListener('input', (event) => { state.query = event.target.value; renderRepositories(); });
  $('#visibilityFilter').addEventListener('change', (event) => { state.visibility = event.target.value; renderRepositories(); });
  $('#appFilter').addEventListener('change', (event) => { state.appType = event.target.value; renderRepositories(); });
  $('#clearFilters').addEventListener('click', () => {
    state.query = ''; state.visibility = 'all'; state.appType = 'all';
    $('#searchInput').value = ''; $('#visibilityFilter').value = 'all'; $('#appFilter').value = 'all'; renderRepositories();
  });

  const settingsPanel = $('#settingsPanel');
  const setSettingsOpen = (open) => {
    settingsPanel.hidden = !open;
    $('#settingsButton').setAttribute('aria-expanded', String(open));
    if (open) settingsPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  $('#settingsButton').addEventListener('click', () => setSettingsOpen(settingsPanel.hidden));
  $('#closeSettings').addEventListener('click', () => setSettingsOpen(false));
  $('#reloadButton').addEventListener('click', async () => {
    $('#reloadButton').textContent = 'Memuat…';
    await loadSnapshot(true);
    $('#reloadButton').textContent = 'Muat ulang';
  });
  $('#themeButton').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    try { localStorage.setItem('planetbintang-dashboard-theme', document.body.classList.contains('light-mode') ? 'soft' : 'white'); } catch {}
  });
  try { if (localStorage.getItem('planetbintang-dashboard-theme') === 'soft') document.body.classList.add('light-mode'); } catch {}

  loadSnapshot();
})();
