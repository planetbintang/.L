(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const fmt = new Intl.NumberFormat('id-ID');
  const pages = {
    branches: { group: 'CODE / SOURCE', title: 'Branches', description: 'Branch default dan HEAD yang benar-benar tercatat pada snapshot. Branch lain dibuka langsung pada provider sumber.', kind: 'branch', href: 'tree' },
    commits: { group: 'CODE / SOURCE', title: 'Commits', description: 'SHA dan waktu commit terakhir dari indeks; buka commit di GitHub untuk melihat diff dan riwayat lengkap.', kind: 'commit', href: 'commit' },
    tags: { group: 'CODE / RELEASE', title: 'Tags & releases', description: 'Metadata tag tidak disalin ke snapshot publik. Gunakan shortcut untuk melihat tag dan rilis langsung di provider.', kind: 'external', href: 'tags' },
    milestones: { group: 'PLAN / DELIVERY', title: 'Milestones', description: 'Susun target milestone lokal per repo, tetapkan tanggal, dan ubah status. Catatan tersimpan hanya pada browser ini.', kind: 'planner', store: 'pb-platform-milestones-v1', item: 'milestone' },
    roadmap: { group: 'PLAN / DELIVERY', title: 'Roadmap', description: 'Rencanakan urutan kerja lintas repositori secara lokal; item ini belum menjadi milestone GitHub atau issue provider.', kind: 'planner', store: 'pb-platform-roadmap-v1', item: 'roadmap item' },
    'pull-requests': { group: 'REVIEW / GITHUB', title: 'Pull Requests', description: 'Buka antrean Pull Request pada repositori sumber. Status, reviewer, dan diff live tidak dimuat oleh Pages.', kind: 'external', href: 'pulls' },
    'merge-requests': { group: 'REVIEW / CROSS-PROVIDER', title: 'Merge Requests', description: 'Pola Merge Request disediakan sebagai pintu kerja lintas provider. Saat ini hanya shortcut GitHub Pull Request aktif; konektor GitLab belum tersambung.', kind: 'external', href: 'pulls' },
    'review-queue': { group: 'REVIEW / COLLABORATION', title: 'Review queue', description: 'Satu daftar pintas ke review per repositori. Antrian dan persetujuan tetap dikelola oleh provider, bukan disimulasikan di snapshot.', kind: 'external', href: 'pulls' },
    discussions: { group: 'REVIEW / COMMUNITY', title: 'Discussions', description: 'Buka diskusi di provider yang memiliki repo. Halaman publik tidak membaca thread privat atau identitas anggota.', kind: 'external', href: 'discussions' },
    activity: { group: 'REVIEW / ACTIVITY', title: 'Activity', description: 'Gunakan waktu dan SHA terakhir dari snapshot lalu buka log commit asli di GitHub. Ini bukan feed event live.', kind: 'commit-feed', href: 'commits' },
    pipelines: { group: 'DELIVERY / CI', title: 'Pipelines', description: 'Shortcut ke alur Actions pada GitHub. Hasil pipeline tidak diindeks; GitLab CI dan Bitbucket Pipelines memerlukan konektor masing-masing.', kind: 'external', href: 'actions' },
    deployments: { group: 'DELIVERY / RELEASE', title: 'Deployments', description: 'Peta Pages yang terdeteksi dari snapshot beserta pintas ke deployment repo. Status job live dibaca di provider.', kind: 'deployment', href: 'deployments' },
    environments: { group: 'DELIVERY / TARGETS', title: 'Environments', description: 'Pintasan ke target deployment per repo. Nama environment dan secret tidak dipublikasikan oleh snapshot.', kind: 'external', href: 'deployments' },
    packages: { group: 'DELIVERY / REGISTRY', title: 'Packages', description: 'Paket dan registry tidak diindeks dalam snapshot. Buka halaman Packages di provider setelah login.', kind: 'external', href: 'packages' },
    security: { group: 'DELIVERY / SECURITY', title: 'Security', description: 'Tidak ada pemindaian keamanan yang dijalankan oleh dashboard. Buka Security tab provider; konektor dan izin terpisah diperlukan untuk hasil live.', kind: 'external', href: 'security' },
    integrations: { group: 'INSIGHTS / CONNECTORS', title: 'Provider & integrations', description: '`.L` menyatukan peta root multi-repo. Status konektor menandai data yang sungguh tersedia, bukan mock koneksi.', kind: 'integrations' },
  };

  let snapshot = window.PBSystemSnapshot?.data || null;
  let currentRoute = '';

  const node = (tag, className = '', value = '') => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined && value !== null) el.textContent = String(value);
    return el;
  };
  const escapePath = (value) => String(value || '').split('/').map(encodeURIComponent).join('/');
  const safeRepoUrl = (repo) => {
    try {
      const url = new URL(repo.url);
      return url.protocol === 'https:' && url.hostname === 'github.com' ? url.href.replace(/\/$/, '') : '';
    } catch { return ''; }
  };
  const saveLocal = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };
  const readLocal = (key) => {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
  };

  function updateProviderCounters(data = snapshot) {
    if (!data) return;
    const repoCount = $('#platformRepoCount');
    const pathCount = $('#platformPathCount');
    if (repoCount) repoCount.textContent = fmt.format(data.repositoryCount || data.repositories?.length || 0);
    if (pathCount) pathCount.textContent = fmt.format(data.fileTreeIndex?.visiblePathCount || 0);
  }

  function makeProviderCards(data) {
    const wrap = node('div', 'platform-connectors');
    const cards = [
      ['GitHub', 'Snapshot aktif · read-only', 'Pull Requests · Actions · ekosistem kolaborasi', 'github', 'https://github.com/planetbintang'],
      ['GitLab', 'Belum terhubung', 'DevSecOps terpadu · CI/CD · security workflows', 'gitlab', 'https://gitlab.com'],
      ['Bitbucket', 'Belum terhubung', 'Atlassian/Jira · pull request · Pipelines', 'bitbucket', 'https://bitbucket.org'],
      ['Planetbintang `.L`', 'Root workspace aktif', `${fmt.format(data?.repositoryCount || data?.repositories?.length || 0)} repo · ${fmt.format(data?.fileTreeIndex?.visiblePathCount || 0)} path · hash snapshot`, 'root', '#fileManager'],
    ];
    cards.forEach(([name, state, detail, type, href]) => {
      const card = node('article', `platform-connector-card platform-connector-${type}`);
      const top = node('div', 'platform-connector-top');
      top.append(node('span', 'platform-connector-kicker', type === 'root' ? 'CROSS-REPO ROOT' : `${type.toUpperCase()} ADAPTER`), node('b', type === 'gitlab' || type === 'bitbucket' ? 'provider-offline' : 'provider-live', state));
      card.append(top, node('h3', '', name), node('p', '', detail));
      const link = node('a', 'workspace-secondary', type === 'root' ? 'Telusuri root /' : type === 'github' ? 'Buka GitHub ↗' : 'Buka platform ↗');
      link.href = href;
      if (href.startsWith('https:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      else link.addEventListener('click', (event) => { event.preventDefault(); window.PBSystemNavigation?.navigate('file-manager'); });
      card.append(link); wrap.append(card);
    });
    return wrap;
  }

  function basePage(route, config) {
    const root = $('#platformContent');
    if (!root) return null;
    root.replaceChildren();
    const page = node('div', `platform-view platform-view-${route}`);
    page.dataset.platformRoute = route;
    const head = node('header', 'platform-page-heading');
    const copy = node('div', 'platform-page-copy');
    copy.append(node('p', 'eyebrow', `PLANETBINTANG  /  ${config.group}`), node('h1', '', config.title), node('p', 'section-description', config.description));
    const actions = node('div', 'platform-heading-actions');
    const mode = node('span', 'platform-mode', config.kind === 'planner' ? 'LOCAL · BROWSER' : config.kind === 'integrations' ? 'CONNECTOR STATUS' : 'SNAPSHOT + PROVIDER');
    const home = node('button', 'workspace-secondary', '← Beranda'); home.type = 'button'; home.addEventListener('click', () => window.PBSystemNavigation?.navigate('system'));
    actions.append(mode, home); head.append(copy, actions); page.append(head);

    const stats = node('div', 'platform-stats');
    const repos = snapshot?.repositories || [];
    const pathTotal = snapshot?.fileTreeIndex?.visiblePathCount || 0;
    const available = repos.filter((repo) => repo.state === 'available').length;
    [[fmt.format(repos.length), 'REPO DALAM SNAPSHOT'], [fmt.format(pathTotal), 'PATH TERINDEKS'], [`${fmt.format(available)} / ${fmt.format(repos.length)}`, 'TREE TERSEDIA / TOTAL']].forEach(([value, label]) => {
      const card = node('article', 'platform-stat-card'); card.append(node('small', '', label), node('b', '', value)); stats.append(card);
    });
    page.append(stats);
    const body = node('div', 'platform-page-body');
    root.append(page);
    return { root, page, body };
  }

  function makeToolbar(config) {
    const toolbar = node('div', 'platform-toolbar');
    const repoLabel = node('label', 'platform-control'); repoLabel.append(node('span', '', 'REPOSITORY'));
    const repoSelect = node('select'); repoSelect.id = 'platformRepoFilter'; repoSelect.add(new Option('Semua repositori', 'all'));
    (snapshot?.repositories || []).forEach((repo) => repoSelect.add(new Option(repo.fullName || repo.name, repo.fullName || repo.name)));
    repoLabel.append(repoSelect);
    const searchLabel = node('label', 'platform-control platform-search'); searchLabel.append(node('span', '', 'CARI REPO / REF'));
    const search = node('input'); search.type = 'search'; search.placeholder = 'Nama repo atau branch'; searchLabel.append(search);
    const refresh = node('button', 'workspace-primary', '↻ Refresh snapshot'); refresh.type = 'button';
    refresh.addEventListener('click', async () => {
      if (!window.PBSystemSnapshot?.refresh) return;
      refresh.disabled = true; refresh.textContent = 'Memuat…';
      await window.PBSystemSnapshot.refresh();
      refresh.disabled = false; refresh.textContent = '↻ Refresh snapshot';
    });
    toolbar.append(repoLabel, searchLabel, refresh);
    return { toolbar, repoSelect, search };
  }

  function repoAction(repo, config) {
    const base = safeRepoUrl(repo);
    if (!base) return '';
    if (config.kind === 'branch') return `${base}/tree/${escapePath(repo.branch || repo.defaultBranch || 'main')}`;
    if (config.kind === 'commit') return repo.headSha ? `${base}/commit/${encodeURIComponent(repo.headSha)}` : `${base}/commits/${escapePath(repo.branch || 'main')}`;
    if (config.kind === 'deployment' && repo.pagesUrl) {
      try { const url = new URL(repo.pagesUrl); if (url.protocol === 'https:') return url.href; } catch {}
    }
    const suffix = config.href || '';
    return suffix ? `${base}/${escapePath(suffix)}` : base;
  }

  function statusFor(repo, config) {
    if (config.kind === 'branch') return repo.branch ? 'Branch default tercatat' : 'Branch belum terpetakan';
    if (config.kind === 'commit') return repo.headSha ? `HEAD ${repo.headSha.slice(0, 12)}` : 'SHA tidak tersedia';
    if (config.kind === 'deployment') return repo.pagesUrl ? 'GitHub Pages terdeteksi' : 'Deployment tidak tercatat';
    if (repo.state === 'empty') return 'Repository kosong';
    return 'Data live berada di provider';
  }

  function makeRepoRows(tableBody, config, selected = 'all', query = '') {
    tableBody.replaceChildren();
    const q = query.trim().toLocaleLowerCase('id');
    const repos = (snapshot?.repositories || []).filter((repo) => (selected === 'all' || repo.fullName === selected) && (!q || `${repo.fullName} ${repo.branch || ''} ${repo.headSha || ''}`.toLocaleLowerCase('id').includes(q)));
    repos.forEach((repo) => {
      const tr = node('tr');
      const name = node('td', 'platform-repo-cell');
      const glyph = node('span', 'platform-repo-glyph', 'PB');
      const nameWrap = node('span', 'platform-repo-name'); nameWrap.append(node('b', '', repo.fullName || repo.name), node('small', '', `${repo.visibility || 'unknown'} · ${repo.state || 'unknown'}`));
      name.append(glyph, nameWrap);
      const state = node('td'); state.append(node('span', 'platform-status-chip', statusFor(repo, config)));
      const detail = node('td', 'platform-detail-cell');
      if (config.kind === 'branch') detail.append(node('code', '', repo.branch || '—'), node('small', '', repo.headSha ? `HEAD ${repo.headSha.slice(0, 12)}` : 'SHA tidak tersedia'));
      else if (config.kind === 'commit' || config.kind === 'commit-feed') detail.append(node('code', '', repo.headSha ? repo.headSha.slice(0, 12) : '—'), node('small', '', repo.lastCommitAt || 'Waktu commit tidak tersedia'));
      else if (config.kind === 'deployment') detail.append(node('code', '', repo.pagesUrl || repo.homepage || 'Tidak ada URL Pages'), node('small', '', repo.branch ? `source branch ${repo.branch}` : 'source branch tidak diketahui'));
      else detail.append(node('code', '', config.href ? `/${config.href}` : 'provider source'), node('small', '', 'Konten ini tidak masuk snapshot publik'));
      const actionCell = node('td');
      const url = repoAction(repo, config); const action = node(url ? 'a' : 'span', `platform-open-link${url ? '' : ' is-disabled'}`, config.kind === 'deployment' && repo.pagesUrl ? 'Buka aplikasi ↗' : config.kind === 'branch' ? 'Lihat branch ↗' : config.kind === 'commit' || config.kind === 'commit-feed' ? 'Lihat commit ↗' : `Buka ${config.href || 'repo'} ↗`);
      if (url) { action.href = url; action.target = '_blank'; action.rel = 'noopener noreferrer'; }
      actionCell.append(action); tr.append(name, state, detail, actionCell); tableBody.append(tr);
    });
    if (!repos.length) { const tr = node('tr'); const td = node('td', 'platform-empty', 'Tidak ada repositori sesuai filter.'); td.colSpan = 4; tr.append(td); tableBody.append(tr); }
    return repos.length;
  }

  function renderRepoPage(route, config) {
    const view = basePage(route, config); if (!view) return;
    const controls = makeToolbar(config); view.body.append(controls.toolbar);
    const layout = node('div', 'platform-layout'); const main = node('section', 'platform-data-panel');
    const tableWrap = node('div', 'platform-table-wrap'); const table = node('table', 'platform-table');
    const thead = node('thead'); const header = node('tr');
    ['REPOSITORY', 'STATUS / SCOPE', config.kind === 'branch' ? 'DEFAULT REF / SHA' : config.kind === 'commit' || config.kind === 'commit-feed' ? 'LATEST COMMIT' : 'PROVIDER DATA', 'ACTION'].forEach((label) => header.append(node('th', '', label)));
    thead.append(header); const tbody = node('tbody'); table.append(thead, tbody); tableWrap.append(table); main.append(tableWrap);
    const footer = node('div', 'platform-table-footer'); const count = node('span', '', '0 repositori'); footer.append(count, node('span', '', 'Sumber: snapshot `.L` + provider GitHub')); main.append(footer);
    const side = node('aside', 'platform-side-panel');
    side.append(node('p', 'eyebrow', 'WHY THIS VIEW'), node('h2', '', config.kind === 'branch' || config.kind === 'commit' ? 'Satu root, banyak repo.' : 'Federasi tanpa mengarang status.'), node('p', '', config.kind === 'branch' || config.kind === 'commit' ? '`.L` merangkum path, branch, SHA, dan status tree lintas repositori. Diff, branch non-default, dan event live tetap berada di GitHub.' : 'Paket fitur mengikuti pola GitHub, GitLab, dan Bitbucket, tetapi halaman statis hanya menampilkan data yang benar-benar ada. Buka provider untuk hasil live.'));
    side.append(node('div', 'platform-source-note', 'Tidak menjalankan skrip repo · tidak membaca blob privat · aksi provider perlu login dan izin sendiri.'));
    layout.append(main, side); view.body.append(layout); view.page.append(view.body);
    const update = () => { count.textContent = `${fmt.format(makeRepoRows(tbody, config, controls.repoSelect.value, controls.search.value))} repositori`; };
    controls.repoSelect.addEventListener('change', update); controls.search.addEventListener('input', update); update();
  }

  function renderPlanner(route, config) {
    const view = basePage(route, config); if (!view) return;
    const controls = makeToolbar(config); view.body.append(controls.toolbar);
    const form = node('form', 'platform-planner-form');
    const titleLabel = node('label', 'platform-control'); titleLabel.append(node('span', '', config.item.toUpperCase())); const title = node('input'); title.required = true; title.maxLength = 140; title.placeholder = config.item === 'milestone' ? 'Contoh: rilis v2' : 'Contoh: konsolidasi UI sistem'; titleLabel.append(title);
    const dateLabel = node('label', 'platform-control'); dateLabel.append(node('span', '', 'TARGET DATE')); const date = node('input'); date.type = 'date'; dateLabel.append(date);
    const add = node('button', 'workspace-primary', `+ Tambah ${config.item}`); add.type = 'submit'; form.append(titleLabel, dateLabel, add);
    const status = node('p', 'platform-local-note', 'Lokal pada browser ini · belum dikirim ke GitHub/GitLab/Bitbucket.');
    const list = node('div', 'platform-planner-list');
    const draw = () => {
      list.replaceChildren();
      const items = readLocal(config.store).filter((item) => controls.repoSelect.value === 'all' || item.repo === controls.repoSelect.value);
      if (!items.length) { list.append(node('p', 'platform-empty-card', `Belum ada ${config.item}. Tambahkan rencana pertama di atas.`)); return; }
      items.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')).forEach((item) => {
        const card = node('article', 'platform-planner-card'); const head = node('div', 'platform-planner-card-head'); head.append(node('span', 'platform-planner-icon', config.item === 'milestone' ? 'M' : 'R'), node('span', 'platform-planner-title', item.title));
        const meta = node('p', 'platform-planner-meta', `${item.repo} · ${item.due ? new Date(`${item.due}T12:00:00`).toLocaleDateString('id-ID') : 'tanpa tanggal'}`);
        const actions = node('div', 'platform-planner-actions'); const stateSelect = node('select'); [['open','Terbuka'],['progress','Berjalan'],['done','Selesai']].forEach(([v,l]) => stateSelect.add(new Option(l, v))); stateSelect.value = item.status || 'open';
        stateSelect.addEventListener('change', () => { const all = readLocal(config.store); const target = all.find((x) => x.id === item.id); if (target) target.status = stateSelect.value; saveLocal(config.store, all); draw(); });
        const remove = node('button', 'workspace-secondary', 'Hapus lokal'); remove.type = 'button'; remove.addEventListener('click', () => { saveLocal(config.store, readLocal(config.store).filter((x) => x.id !== item.id)); draw(); });
        actions.append(stateSelect, remove); card.append(head, meta, actions); list.append(card);
      });
    };
    form.addEventListener('submit', (event) => {
      event.preventDefault(); const value = title.value.trim(); if (!value) return;
      const all = readLocal(config.store); all.unshift({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, title: value, repo: controls.repoSelect.value === 'all' ? (snapshot?.repositories?.[0]?.fullName || 'planetbintang/.L') : controls.repoSelect.value, due: date.value, status: 'open', createdAt: new Date().toISOString() });
      if (!saveLocal(config.store, all)) { status.textContent = 'Penyimpanan lokal gagal; ruang browser mungkin penuh.'; return; }
      title.value = ''; date.value = ''; status.textContent = `${config.item} tersimpan lokal · ${new Date().toLocaleTimeString('id-ID')}`; draw();
    });
    controls.repoSelect.addEventListener('change', draw); view.body.append(form, status, list); view.page.append(view.body); draw();
  }

  function renderIntegrations(route, config) {
    const view = basePage(route, config); if (!view) return;
    const intro = node('div', 'platform-integration-intro'); intro.append(node('span', 'platform-live-indicator', '●'), node('p', '', 'Snapshot GitHub aktif sebagai sumber metadata. Autentikasi provider tidak pernah disimpan dalam browser Pages.'));
    view.body.append(intro, makeProviderCards(snapshot));
    const diff = node('section', 'platform-differentiators'); diff.append(node('h2', '', 'Pembeda yang dipertahankan'), node('p', '', 'GitHub menonjol pada ekosistem kolaborasi dan Actions; GitLab menyatukan lifecycle DevSecOps; Bitbucket dekat dengan Jira/Atlassian. `.L` menambahkan root lintas repositori, File Manager `/`, dan indeks path/hash bersama. Provider selain GitHub memerlukan konektor dan izin terpisah.'));
    view.body.append(diff); view.page.append(view.body);
  }

  function render(route) {
    currentRoute = route;
    const config = pages[route]; if (!config) return;
    updateProviderCounters();
    if (config.kind === 'planner') renderPlanner(route, config);
    else if (config.kind === 'integrations') renderIntegrations(route, config);
    else renderRepoPage(route, config);
  }

  window.PBPlatformView = { render, updateProviderCounters };
  window.PBSystemSnapshot?.subscribe('platform-view', (data) => {
    snapshot = data; updateProviderCounters(data);
    if (currentRoute && pages[currentRoute]) render(currentRoute);
  });
  updateProviderCounters();
})();
