(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const routeLabels = {
    system: 'ROUTE / OVERVIEW', repositories: 'ROUTE / CODE', 'file-manager': 'ROUTE / CODE / FILES', features: 'ROUTE / CODE / FEATURES',
    projects: 'ROUTE / PLAN', issues: 'ROUTE / PLAN / ISSUES', code: 'ROUTE / CODE / EDITOR', analytics: 'ROUTE / INSIGHTS', ai: 'ROUTE / INSIGHTS / AI',
    'workspace-account': 'ROUTE / INSIGHTS / ACCOUNT', 'workspace-help': 'ROUTE / INSIGHTS / HELP', hosts: 'ROUTE / INSIGHTS / HOSTS',
    'manage-files': 'ROUTE / MANAGE / FILES', 'manage-storage': 'ROUTE / MANAGE / STORAGE', 'manage-settings': 'ROUTE / MANAGE / SETTINGS', 'manage-access': 'ROUTE / MANAGE / ACCESS', 'manage-activity': 'ROUTE / MANAGE / ACTIVITY',
    'execute-run': 'ROUTE / EXECUTE / RUN', 'execute-console': 'ROUTE / EXECUTE / CONSOLE', 'execute-jobs': 'ROUTE / EXECUTE / JOBS', 'execute-deploy': 'ROUTE / EXECUTE / DEPLOY', 'execute-logs': 'ROUTE / EXECUTE / LOGS',
  };
  const status = $('#viewTransitionStatus');
  const targetForRoute = (detail) => detail.group === 'workspace' ? $(`[data-workspace-panel="${detail.view}"]`) : $(`[data-system-page="${detail.group}"]`);
  function animate(detail) {
    const target = targetForRoute(detail);
    document.body.dataset.activeRoute = detail.name;
    if (status) status.textContent = routeLabels[detail.name] || `ROUTE / ${detail.name.toUpperCase()}`;
    if (!target) return;
    target.classList.remove('route-enter-active');
    // Force a new animation frame so repeated navigation to the same panel remains visible.
    void target.offsetWidth;
    target.classList.add('route-enter-active');
    window.setTimeout(() => target.classList.remove('route-enter-active'), 520);
    const heading = target.querySelector('h1, h2, h3, [role="heading"]');
    if (heading && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    if (heading) window.setTimeout(() => heading.focus({ preventScroll: true }), 80);
  }
  document.addEventListener('planetbintang:route-change', (event) => animate(event.detail || {}));
  document.querySelectorAll('[data-flow-route]').forEach((button) => button.addEventListener('click', () => {
    const route = button.dataset.flowRoute;
    if (window.PBSystemNavigation?.navigate) window.PBSystemNavigation.navigate(route);
  }));
  document.addEventListener('keydown', (event) => {
    if (!(event.altKey && event.key === 'ArrowLeft')) return;
    event.preventDefault(); window.history.back();
  });
  if (status) status.textContent = routeLabels[window.PBSystemNavigation?.currentRoute] || 'ROUTE / OVERVIEW';
})();
