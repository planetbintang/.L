/* Channel selector and transparent, browser-local viewer-time estimate.
   Cross-tab counts are limited to this browser profile and are not global analytics. */
(() => {
  'use strict';
  const root = document.querySelector('[data-live-tv-dashboard]');
  if (!root) return;
  const frame = root.querySelector('[data-live-tv-frame]');
  const status = root.querySelector('[data-live-tv-status]');
  const openLink = root.querySelector('[data-live-tv-open]');
  const channelButtons = [...root.querySelectorAll('[data-live-tv-url]')];
  const categoryButtons = [...root.querySelectorAll('[data-live-tv-category]')];
  const activeCount = root.querySelector('[data-live-tv-active]');
  const viewClock = root.querySelector('[data-live-tv-duration]');
  const viewMinutes = root.querySelector('[data-live-tv-minutes]');
  const revenue = root.querySelector('[data-live-tv-revenue]');
  const rate = 1;
  const tabId = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : String(Date.now()) + Math.random();
  const channelKey = 'planetbintang-live-tv-channel';
  const currentLabel = root.querySelector('[data-live-tv-current]');
  let selected = channelButtons.find(b => b.getAttribute('aria-pressed') === 'true') || channelButtons[0];
  let elapsed = 0;
  let lastTick = Date.now();
  let lastHeartbeat = 0;
  let activeTabs = new Map([[tabId, Date.now()]]);
  let category = 'Semua';
  let channelStarted = Date.now();
  let totalMinutes = 0;
  let bc = null;
  try { bc = new BroadcastChannel('planetbintang-live-tv-presence'); } catch (_) {}

  const formatTime = seconds => {
    const s = Math.max(0, Math.floor(seconds));
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map(n => String(n).padStart(2, '0')).join(':');
  };
  const money = value => '$' + value.toFixed(2);
  function announce() {
    const now = Date.now();
    activeTabs.set(tabId, now);
    if (bc) bc.postMessage({type:'heartbeat', id:tabId, at:now, visible:!document.hidden});
    for (const [id, at] of activeTabs) if (now - at > 12000) activeTabs.delete(id);
    activeCount.textContent = String([...activeTabs.values()].filter(at => now-at < 12000).length);
  }
  function updateMetrics() {
    const current = elapsed + ((!document.hidden && selected) ? (Date.now()-lastTick)/1000 : 0);
    viewClock.textContent = formatTime(current);
    totalMinutes = current / 60;
    viewMinutes.textContent = totalMinutes.toFixed(2);
    revenue.textContent = money(totalMinutes * rate);
  }
  function chooseChannel(button) {
    if (!button) return;
    selected = button;
    const url = button.dataset.liveTvUrl;
    const name = button.dataset.liveTvName || button.textContent.trim();
    channelButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    frame.src = url;
    frame.title = 'Portal siaran ' + name;
    if (currentLabel) currentLabel.textContent = name;
    openLink.href = url;
    openLink.textContent = 'BUKA ' + name.toLocaleUpperCase('id-ID') + ' DI SITUS RESMI ↗';
    status.textContent = 'Membuka portal resmi ' + name + '. Jika tidak dapat diputar di sini, gunakan tombol situs resmi.';
    channelStarted = Date.now();
    try { sessionStorage.setItem(channelKey, name); } catch (_) {}
  }
  function filterChannels(nextCategory) {
    category = nextCategory;
    categoryButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.liveTvCategory === category)));
    channelButtons.forEach(button => {
      button.hidden = category !== 'Semua' && button.dataset.liveTvGenre !== category;
    });
  }
  channelButtons.forEach(button => button.addEventListener('click', () => chooseChannel(button)));
  categoryButtons.forEach(button => button.addEventListener('click', () => filterChannels(button.dataset.liveTvCategory)));
  if (bc) bc.onmessage = event => {
    const data = event.data || {};
    if (data.type === 'heartbeat' && data.id && data.id !== tabId) {
      activeTabs.set(data.id, data.at || Date.now());
      announce();
    } else if (data.type === 'bye' && data.id) activeTabs.delete(data.id);
  };
  document.addEventListener('visibilitychange', () => { lastTick = Date.now(); announce(); updateMetrics(); });
  window.addEventListener('pagehide', () => { if (bc) bc.postMessage({type:'bye',id:tabId}); });
  if (frame) frame.addEventListener('load', () => {
    status.textContent = 'Portal channel dimuat. Keberhasilan video live bergantung pada kebijakan embed penyedia.';
  });
  filterChannels('Semua');
  chooseChannel(selected);
  announce();
  setInterval(() => {
    const now = Date.now();
    if (!document.hidden) elapsed += Math.max(0, now-lastTick)/1000;
    lastTick = now;
    announce();
    updateMetrics();
  }, 1000);
})();
