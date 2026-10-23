(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const routes = {
    system: { group: 'system', hash: '#overview' },
    projects: { group: 'workspace', view: 'projects', menu: 'plan', hash: '#workspace/projects' },
    issues: { group: 'workspace', view: 'issues', menu: 'plan', hash: '#workspace/issues' },
    code: { group: 'workspace', view: 'code', menu: 'code', hash: '#workspace/code' },
    analytics: { group: 'workspace', view: 'analytics', menu: 'insights', hash: '#workspace/analytics' },
    ai: { group: 'workspace', view: 'ai', menu: 'insights', hash: '#workspace/ai' },
    'workspace-account': { group: 'workspace', view: 'account', menu: 'insights', hash: '#workspace/account' },
    'workspace-help': { group: 'workspace', view: 'help', menu: 'insights', hash: '#workspace/help' },
    'file-manager': { group: 'file-manager', menu: 'code', hash: '#fileManager' },
    repositories: { group: 'repositories', menu: 'code', hash: '#repositories' },
    hosts: { group: 'hosts', menu: 'insights', hash: '#hosts' },
  };
  const platformRoutes = [
    ['branches', 'code'], ['commits', 'code'], ['tags', 'code'],
    ['milestones', 'plan'], ['roadmap', 'plan'],
    ['pull-requests', 'review'], ['merge-requests', 'review'], ['review-queue', 'review'], ['discussions', 'review'], ['activity', 'review'],
    ['pipelines', 'delivery'], ['deployments', 'delivery'], ['environments', 'delivery'], ['packages', 'delivery'], ['security', 'delivery'],
    ['integrations', 'insights'],
  ];
  platformRoutes.forEach(([name, menu]) => { routes[name] = { group: 'platform', menu, hash: `#platform/${name}` }; });

  const workspaceRoutes = new Map(Object.entries(routes).filter(([, route]) => route.view).map(([name, route]) => [route.view, name]));
  const pages = [...document.querySelectorAll('[data-system-page]')];
  const navLinks = [...document.querySelectorAll('.main-nav a[data-system-route]')];
  const routeLinks = [...document.querySelectorAll('[data-system-route]')];
  const menuDetails = [...document.querySelectorAll('.nav-dropdown[data-menu]')];
  const syncHub = $('#syncHub');
  const syncButton = $('#syncHubRefresh');
  let currentRoute = 'system';

  const SYSTEM_ROOTS = ['data', 'proc', 'sys', 'media', 'acct', 'pro', 'config', 'cache'];
  function routeFromHash() {
    const hash = decodeURIComponent(window.location.hash || '').replace(/^#/, '');
    if (!hash || hash === 'top' || hash === 'overview') return 'system';
    if (hash === 'workspace') return 'projects';
    if (hash.startsWith('workspace/')) return workspaceRoutes.get(hash.slice('workspace/'.length)) || 'projects';
    if (hash.startsWith('platform/')) {
      const route = hash.slice('platform/'.length);
      return routes[route]?.group === 'platform' ? route : null;
    }
    // Sub URL folder sistem: #fileManager, #fileManager/data, #fileManager/proc/1, ...
    if (hash === 'fileManager' || hash.startsWith('fileManager/')) return 'file-manager';
    return ({ repositories: 'repositories', hosts: 'hosts' })[hash] || null;
  }

  function filePathFromHash() {
    const hash = decodeURIComponent(window.location.hash || '').replace(/^#/, '');
    if (!hash.startsWith('fileManager/')) return '';
    return hash.slice('fileManager/'.length).split('/').filter((part) => part && part !== '.' && part !== '..').join('/');
  }

  function routeForWorkspaceView(view) { return workspaceRoutes.get(view) || 'projects'; }
  function closeMenus() { menuDetails.forEach((menu) => { menu.open = false; }); }

  function applyRoute(name, options = {}) {
    const routeName = routes[name] ? name : 'system';
    let route = routes[routeName];
    const { updateUrl = true, scroll = true } = options;
    // Sub URL folder sistem: #fileManager/<path> tetap berada pada rute file-manager.
    if (name === 'file-manager') route = { ...route, hash: `#fileManager${filePathFromHash() ? `/${filePathFromHash()}` : ''}` };
    const changed = currentRoute !== routeName;
    currentRoute = routeName;
    document.body.dataset.systemRoute = routeName;
    pages.forEach((page) => { page.hidden = page.dataset.systemPage !== route.group; });
    if (route.group === 'file-manager') window.PBFileManager?.setPath(filePathFromHash());
    navLinks.forEach((link) => {
      if (link.dataset.systemRoute === routeName) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    menuDetails.forEach((menu) => {
      const active = Boolean(route.menu && menu.dataset.menu === route.menu);
      const summary = $('summary', menu);
      if (active) summary?.setAttribute('aria-current', 'page');
      else summary?.removeAttribute('aria-current');
      menu.classList.toggle('has-active-route', active);
    });
    closeMenus();

    if (route.view && window.PBWorkspace?.showView) window.PBWorkspace.showView(route.view, false);
    if (route.group === 'platform') window.PBPlatformView?.render(routeName);
    const settings = $('#settingsPanel');
    if (changed && settings && !settings.hidden) {
      settings.hidden = true;
      $('#settingsButton')?.setAttribute('aria-expanded', 'false');
    }
    if (updateUrl && window.location.hash !== route.hash) window.history.pushState({ systemRoute: routeName }, '', route.hash);
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  routeLinks.forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    applyRoute(link.dataset.systemRoute, { scroll: true });
  }));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-dropdown')) closeMenus();
  });
  document.addEventListener('planetbintang:workspace-view', (event) => {
    const next = routeForWorkspaceView(event.detail?.view);
    if (next !== currentRoute) applyRoute(next, { scroll: false });
  });
  document.querySelectorAll('[data-open-settings]').forEach((button) => button.addEventListener('click', () => {
    closeMenus(); $('#settingsButton')?.click();
  }));
  window.addEventListener('popstate', () => {
    const next = routeFromHash(); if (next) applyRoute(next, { updateUrl: false, scroll: true });
  });
  window.addEventListener('hashchange', () => {
    const next = routeFromHash(); if (next && next !== currentRoute) applyRoute(next, { updateUrl: false, scroll: true });
  });

  function setHubState(label, phase = 'ready') {
    const state = $('#syncHubState');
    const dot = $('#syncHubDot');
    if (state) state.textContent = label;
    if (dot) dot.dataset.state = phase;
  }
  function updateHub(data = window.PBSystemSnapshot?.data) {
    if (!syncHub) return;
    const meta = $('#syncHubMeta');
    if (!data) {
      if (meta) meta.textContent = 'Snapshot belum tersedia di browser ini.';
    } else {
      const parsedDate = data.updatedAt ? new Date(data.updatedAt) : null;
      const date = parsedDate && !Number.isNaN(parsedDate.getTime()) ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(parsedDate) + ' UTC' : 'waktu tidak tercatat';
      const count = data.repositoryCount || data.repositories?.length || 0;
      const sha = data.dataSha256 ? ` · SHA ${data.dataSha256.slice(0, 12)}` : '';
      if (meta) meta.textContent = `${count} repo · ${date}${sha}`;
    }
    const statuses = window.PBSystemSnapshot?.consumers || {};
  }
  function renderHubUrls(data = window.PBSystemSnapshot?.data) {
    const target = $('#syncHubUrls');
    if (!target) return;
    const repos = (data?.repositories || []).filter((repo) => repo?.name || repo?.fullName);
    if (!repos.length) { target.innerHTML = '<div class="hub-url-empty">Katalog URL belum tersedia.</div>'; return; }
    target.innerHTML = repos.map((repo, index) => {
      const name = String(repo.name || repo.fullName.split('/').pop()) || 'root';
      const slug = encodeURIComponent(name).replace(/%2F/g, '/');
      const url = `https://planetbintang.github.io/.L/${slug}/`;
      return `<a class="hub-url-item" href="${url}" target="_blank" rel="noopener noreferrer"><b>${String(index + 1).padStart(2, '0')}</b><span>${url}</span><i aria-hidden="true">↗</i></a>`;
    }).join('');
  }
  function openHub() {
    if (!syncHub) return;
    closeMenus(); updateHub(); renderHubUrls();
    if (!syncHub.open) syncHub.showModal();
    $('#syncHubClose')?.focus();
  }
  document.querySelectorAll('[data-sync-hub-trigger]').forEach((trigger) => trigger.addEventListener('click', (event) => {
    event.preventDefault(); openHub();
  }));
  $('#syncHubClose')?.addEventListener('click', () => syncHub.close());
  syncHub?.addEventListener('click', (event) => { if (event.target === syncHub) syncHub.close(); });

  window.addEventListener('planetbintang:snapshot-state', (event) => {
    const detail = event.detail || {};
    if (detail.phase === 'loading') setHubState('Memuat snapshot terbit…', 'loading');
    else if (detail.phase === 'consumer') {
      updateHub();
      const name = detail.name === 'file-manager' ? 'File Manager' : detail.name === 'workspace' ? 'Workspace' : detail.name;
      if (detail.status === 'error') setHubState(`${name} belum tersinkron`, 'error');
      else if (detail.status === 'loading') setHubState(`Menyegarkan ${name}…`, 'loading');
      else {
        const statuses = window.PBSystemSnapshot?.consumers || {};
        if (statuses.workspace === 'ready' && statuses['file-manager'] === 'ready' && statuses['platform-view'] === 'ready') setHubState('Snapshot dan menu tersinkron', 'ready');
      }
    } else if (detail.phase === 'ready') {
      setHubState('Snapshot dan menu tersinkron', 'ready'); updateHub();
    } else if (detail.phase === 'partial') {
      setHubState('Snapshot termuat; periksa status modul', 'partial'); updateHub();
    } else if (detail.phase === 'error') {
      setHubState('Gagal memuat; data sebelumnya dipertahankan', 'error'); updateHub();
    }
  });
  syncButton?.addEventListener('click', async () => {
    if (!window.PBSystemSnapshot?.refresh) { setHubState('Pusat snapshot tidak tersedia', 'error'); return; }
    syncButton.disabled = true; syncButton.textContent = 'Memuat snapshot…';
    try {
      const ok = await window.PBSystemSnapshot.refresh();
      if (!ok) setHubState('Gagal memuat; data sebelumnya dipertahankan', 'error');
      updateHub();
    } catch { setHubState('Gagal memuat; data sebelumnya dipertahankan', 'error'); }
    finally { syncButton.disabled = false; syncButton.textContent = 'Muat ulang snapshot'; }
  });

  window.PBSystemNavigation = { navigate: (name) => applyRoute(name, { scroll: true }), systemRoots: SYSTEM_ROOTS };
  updateHub();
  if (window.PBSystemSnapshot?.data) {
    const statuses = window.PBSystemSnapshot.consumers || {};
    const ready = statuses.workspace === 'ready' && statuses['file-manager'] === 'ready' && statuses['platform-view'] === 'ready';
    setHubState(ready ? 'Snapshot dan menu tersinkron' : 'Snapshot tersedia; menyelaraskan menu', ready ? 'ready' : 'loading');
  }
  applyRoute(routeFromHash() || 'system', { updateUrl: false, scroll: false });
})();
