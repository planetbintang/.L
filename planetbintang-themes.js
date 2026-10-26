(() => {
  'use strict';
  // ==========================================================================
  // PLANETBINTANG · PEMILIH TEMA UTAMA (3 tema AI Reber di tampilan utama)
  //   * Membawa sistem tema yang sudah ada di aireber (cahaya / air / berlian,
  //     lihat aireber/reber-app.js — THEME_KEY 'planetbintang.aireber.theme.v1')
  //     ke level header/root index.html sehingga berlaku pada SELURUH halaman.
  //   * Satu preferensi localStorage dipakai bersama: ganti tema di homepage
  //     otomatis mengikuti di AI Reber studio, dan sebaliknya.
  //   * Tanpa atribut data-pb-theme → tampilan gelap abstrak standar tetap utuh.
  // ==========================================================================
  const THEME_KEY = 'planetbintang.aireber.theme.v1'; // kunci sama dengan AI Reber
  const THEMES = ['cahaya', 'air', 'berlian'];

  function readStored() {
    try { return localStorage.getItem(THEME_KEY) || ''; } catch { return ''; }
  }
  function applyTheme(theme, persist = true) {
    const value = THEMES.includes(theme) ? theme : '';
    if (value) document.documentElement.dataset.pbTheme = value;
    else delete document.documentElement.dataset.pbTheme;
    const picker = document.getElementById('pbThemeSelect');
    if (picker) picker.value = value || 'default';
    if (persist) { try { localStorage.setItem(THEME_KEY, value); } catch { /* tema tetap berlaku dalam tab ini */ } }
    document.dispatchEvent(new CustomEvent('planetbintang:theme-change', { detail: { theme: value || 'luxury' } }));
  }

  // Terapkan sedini mungkin (skrip dimuat dengan defer sebelum DOMContentLoaded penuh).
  applyTheme(readStored(), false);

  // Sisipkan pemilih tema pada bar aksi header — tampil di semua halaman/rute.
  function mountPicker() {
    const actions = document.querySelector('.topbar-actions');
    if (!actions || document.getElementById('pbThemeSelect')) return;
    const label = document.createElement('label');
    label.className = 'pb-theme-picker';
    label.title = 'Tema Planetbintang — sinkron dengan tiga tema AI Reber (Cahaya · Air · Berlian)';
    label.innerHTML = '<span>TEMA</span><select id="pbThemeSelect" aria-label="Tema tampilan Planetbintang">'
      + '<option value="default">Gelap Abstrak</option>'
      + '<option value="cahaya">Cahaya</option>'
      + '<option value="air">Air</option>'
      + '<option value="berlian">Berlian Kaca</option></select>';
    actions.prepend(label);
    const select = label.querySelector('select');
    select.value = document.documentElement.dataset.pbTheme || 'default';
    select.addEventListener('change', (event) => applyTheme(event.target.value === 'default' ? '' : event.target.value));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountPicker);
  else mountPicker();

  window.PBThemes = { applyTheme, themes: THEMES, storageKey: THEME_KEY };
})();
