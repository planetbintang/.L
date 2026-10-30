(() => {
  'use strict';
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './search-page.css?v=20261030-safari-hub-style-v2';
  document.head.append(css);

  const searchInput = document.getElementById('globalSearchInput');
  const startInput = document.getElementById('safariStartInput');
  const topForm = document.getElementById('topbarSearchForm');
  const topInput = document.getElementById('topbarSearchInput');
  const homeForm = document.getElementById('homeSearchForm');
  const homeInput = document.getElementById('homeSearchInput');

  // Kedua kolom pada halaman Safari memakai kueri yang sama.
  function sync(source, target) {
    if (source && target) source.addEventListener('input', () => { target.value = source.value; });
  }
  sync(searchInput, startInput);
  sync(startInput, searchInput);
  sync(topInput, searchInput);
  sync(homeInput, searchInput);
  sync(topInput, homeInput);
  sync(homeInput, topInput);

  function openSafariSearch(value) {
    const query = String(value || '').trim();
    if (searchInput) searchInput.value = query;
    if (startInput) startInput.value = query;
    if (location.hash !== '#cari') location.hash = '#cari';
    // Biarkan navigasi sistem selesai sebelum fokus dipindahkan ke kolom Safari.
    window.setTimeout(() => {
      if (searchInput) {
        searchInput.value = query;
        searchInput.focus();
      }
    }, 120);
  }

  if (topForm && topInput) {
    topForm.addEventListener('submit', event => {
      event.preventDefault();
      openSafariSearch(topInput.value);
    });
  }
  if (homeForm && homeInput) {
    homeForm.addEventListener('submit', event => {
      event.preventDefault();
      openSafariSearch(homeInput.value);
    });
  }

  try {
    const saved = sessionStorage.getItem('pb-global-search-query');
    if (saved && searchInput) {
      searchInput.value = saved;
      if (startInput) startInput.value = saved;
    }
  } catch (_) {}

  [searchInput, startInput].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      try { sessionStorage.setItem('pb-global-search-query', input.value); } catch (_) {}
    });
  });
})();
