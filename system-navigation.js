(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const routes = {
    system: { group: 'system', hash: '#overview' },
    projects: { group: 'workspace', view: 'projects', hash: '#workspace/projects' },
    issues: { group: 'workspace', view: 'issues', hash: '#workspace/issues' },
    code: { group: 'workspace', view: 'code', hash: '#workspace/code' },
    analytics: { group: 'workspace', view: 'analytics', hash: '#workspace/analytics' },
    ai: { group: 'workspace', view: 'ai', hash: '#workspace/ai' },
    'workspace-account': { group: 'workspace', view: 'account', hash: '#workspace/account' },
    'workspace-help': { group: 'workspace', view: 'help', hash: '#workspace/help' },
    'file-manager': { group: 'file-manager', hash: '#fileManager' },
    repositories: { group: 'repositories', hash: '#repositories' },
    hosts: { group: 'hosts', hash: '#hosts' },
  };
  const workspaceRoutes = new Map(Object.entries(routes).filter(([, route]) => route.view).map(([name, route]) => [route.view, name]));
  const pages = [...document.querySelectorAll('[data-system-page]')];
  const navLinks = [...document.querySelectorAll('.main-nav [data-system-route]')];
  const routeLinks = [...document.querySelectorAll('[data-system-route]')];
  const syncHub = $('#syncHub');
  const syncButton = $('#syncHubRefresh');
  let currentRoute = 'system';

  function routeFromHash() {
    const hash = decodeURIComponent(window.location.hash || '').replace(/^#/, '');
    if (!hash || hash === 'top' || hash === 'overview') return 'system';
    if (hash === 'workspace') return 'projects';
    if (hash.startsWith('workspace/')) return workspaceRoutes.get(hash.slice('workspace/'.length)) || 'projects';
    return ({ fileManager: 'file-manager', repositories: 'repositories', hosts: 'hosts' })[hash] || null;
  }

  function routeForWorkspaceView(view) {
    return workspaceRoutes.get(view) || 'projects';
  }

  function applyRoute(name, options = {}) {
    const routeName = routes[name] ? name : 'system';
    const route = routes[routeName];
    const { updateUrl = true, scroll = true } = options;
    const changed = currentRoute !== routeName;
    currentRoute = routeName;
    document.body.dataset.systemRoute = routeName;
    pages.forEach((page) => { page.hidden = page.dataset.systemPage !== route.group; });
    navLinks.forEach((link) => {
      if (link.dataset.systemRoute === routeName) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (route.view && window.PBWorkspace?.showView) window.PBWorkspace.showView(route.view, false);
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
  document.addEventListener('planetbintang:workspace-view', (event) => {
    const next = routeForWorkspaceView(event.detail?.view);
    if (next !== currentRoute) applyRoute(next, { scroll: false });
  });
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
    const snapshot = data;
    const meta = $('#syncHubMeta');
    if (!snapshot) {
      if (meta) meta.textContent = 'Snapshot belum tersedia di browser ini.';
      $('#syncHubDashboard').textContent = 'Menunggu';
    } else {
      const parsedDate = snapshot.updatedAt ? new Date(snapshot.updatedAt) : null;
      const date = parsedDate && !Number.isNaN(parsedDate.getTime()) ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(parsedDate) + ' UTC' : 'waktu tidak tercatat';
      const count = snapshot.repositoryCount || snapshot.repositories?.length || 0;
      const sha = snapshot.dataSha256 ? ` · SHA ${snapshot.dataSha256.slice(0, 12)}` : '';
      if (meta) meta.textContent = `${count} repo · ${date}${sha}`;
      $('#syncHubDashboard').textContent = 'Tersedia';
    }
    const statuses = window.PBSystemSnapshot?.consumers || {};
    $('#syncHubWorkspace').textContent = statuses.workspace === 'ready' ? 'Tersinkron' : statuses.workspace === 'error' ? 'Periksa' : 'Memuat';
    $('#syncHubFiles').textContent = statuses['file-manager'] === 'ready' ? 'Tersinkron' : statuses['file-manager'] === 'error' ? 'Periksa' : 'Memuat';
  }

  function openHub() {
    if (!syncHub) return;
    updateHub();
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
        if (statuses.workspace === 'ready' && statuses['file-manager'] === 'ready') setHubState('Snapshot dan menu tersinkron', 'ready');
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
    if (!window.PBSystemSnapshot?.refresh) {
      setHubState('Pusat snapshot tidak tersedia', 'error'); return;
    }
    syncButton.disabled = true; syncButton.textContent = 'Memuat snapshot…';
    try {
      const ok = await window.PBSystemSnapshot.refresh();
      if (!ok) setHubState('Gagal memuat; data sebelumnya dipertahankan', 'error');
      updateHub();
    } catch {
      setHubState('Gagal memuat; data sebelumnya dipertahankan', 'error');
    } finally {
      syncButton.disabled = false; syncButton.textContent = 'Muat ulang snapshot';
    }
  });

  window.PBSystemNavigation = { navigate: (name) => applyRoute(name, { scroll: true }) };
  updateHub();
  if (window.PBSystemSnapshot?.data) {
    const statuses = window.PBSystemSnapshot.consumers || {};
    setHubState(statuses.workspace === 'ready' && statuses['file-manager'] === 'ready' ? 'Snapshot dan menu tersinkron' : 'Snapshot tersedia; menyelaraskan menu', statuses.workspace === 'ready' && statuses['file-manager'] === 'ready' ? 'ready' : 'loading');
  }
  applyRoute(routeFromHash() || 'system', { updateUrl: false, scroll: false });
})();
