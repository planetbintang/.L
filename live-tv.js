/* Official broadcaster live portals; embedding is subject to each provider's policy. */
(() => {
  'use strict';
  const panel = document.querySelector('[data-live-tv]');
  if (!panel) return;
  const frame = panel.querySelector('[data-live-tv-frame]');
  const status = panel.querySelector('[data-live-tv-status]');
  const openLink = panel.querySelector('[data-live-tv-open]');
  const buttons = [...panel.querySelectorAll('[data-live-tv-url]')];
  if (!frame || !status || !openLink || !buttons.length) return;

  function selectChannel(button) {
    const url = button.dataset.liveTvUrl;
    const name = button.dataset.liveTvName || button.textContent.trim();
    if (!url) return;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    frame.src = url;
    frame.title = 'Siaran langsung ' + name;
    openLink.href = url;
    openLink.textContent = 'BUKA ' + name.toLocaleUpperCase('id-ID') + ' DI SITUS RESMI ↗';
    status.textContent = 'Memuat portal siaran ' + name + '. Jika pemutar tidak tampil, gunakan tombol buka situs resmi.';
  }
  buttons.forEach(button => button.addEventListener('click', () => selectChannel(button)));
  frame.addEventListener('load', () => {
    status.textContent = 'Portal channel telah dimuat. Jika penyedia membatasi pemutaran di dalam halaman, buka siaran melalui situs resminya.';
  });
  selectChannel(buttons.find(button => button.getAttribute('aria-pressed') === 'true') || buttons[0]);
})();
