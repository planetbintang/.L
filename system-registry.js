(() => {
  'use strict';
  const REGISTRY_URL = './data/system-registry.json';
  const REPO_URL = 'https://github.com/planetbintang/.L/blob/io/';
  const state = { data: null, status: 'loading', error: null };
  function normalizePath(path) { return String(path || '').replace(/^\.\//, '').replace(/^\/+/, ''); }
  function sourceUrl(path) {
    const clean = normalizePath(path);
    return clean ? REPO_URL + clean.split('/').map(encodeURIComponent).join('/') : '';
  }
  function resolveRoute(routeId) { return state.data?.routes?.find((item) => item.id === routeId) || null; }
  function annotateNavigation() {
    if (!state.data) return;
    const routeMap = new Map(state.data.routes.map((item) => [item.id, item]));
    document.querySelectorAll('[data-system-route]').forEach((node) => {
      const entry = routeMap.get(node.dataset.systemRoute);
      if (!entry) { node.dataset.registryState = 'unregistered'; return; }
      node.dataset.systemRegistryId = entry.id;
      node.dataset.registryState = 'registered';
      node.title = node.title || 'Registry: ' + entry.label;
      node.setAttribute('data-registry-source-count', String(entry.sourceFiles?.length || 0));
    });
  }
  async function load() {
    try {
      const response = await fetch(REGISTRY_URL + '?v=20261028-system-registry-v1', { cache: 'no-cache', credentials: 'omit' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (data.schemaVersion !== 1 || !Array.isArray(data.routes)) throw new Error('Schema registry tidak valid');
      const ids = new Set();
      data.routes.forEach((entry) => {
        if (!entry.id || !entry.label || !entry.route || ids.has(entry.id)) throw new Error('ID/route registry kosong atau duplikat');
        ids.add(entry.id);
        entry.sourceLinks = (entry.sourceFiles || []).map((path) => ({ path, url: sourceUrl(path) }));
      });
      state.data = data; state.status = 'ready'; annotateNavigation();
      document.documentElement.dataset.systemRegistry = 'ready';
      window.dispatchEvent(new CustomEvent('planetbintang:registry-ready', { detail: { routeCount: data.routes.length } }));
    } catch (error) {
      state.status = 'error'; state.error = error.message;
      document.documentElement.dataset.systemRegistry = 'error';
      window.dispatchEvent(new CustomEvent('planetbintang:registry-error', { detail: { message: error.message } }));
    }
  }
  window.PBSystemRegistry = Object.freeze({
    load,
    get status() { return state.status; },
    get error() { return state.error; },
    get data() { return state.data; },
    list: (group) => (state.data?.routes || []).filter((entry) => !group || entry.group === group),
    get: resolveRoute,
    sourceUrl,
    validate: () => {
      const entries = state.data?.routes || [], ids = entries.map((entry) => entry.id);
      return { ok: Boolean(state.data) && new Set(ids).size === ids.length, routeCount: entries.length, duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i) };
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void load(), { once: true });
  else void load();
})();