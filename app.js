const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const toast = (title = 'Pengaturan tersimpan', detail = 'Konfigurasi desktop telah diperbarui.') => {
  const node = $('#toast');
  node.querySelector('strong').textContent = title;
  node.querySelector('small').textContent = detail;
  node.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => node.classList.remove('show'), 2800);
};

$$('.nav-item').forEach((item) => item.addEventListener('click', () => {
  $$('.nav-item').forEach((entry) => entry.classList.remove('active'));
  item.classList.add('active');
  $('#sectionName').textContent = item.querySelector('span:nth-child(2)').textContent.toUpperCase();
  toast('Kategori dibuka', `${item.querySelector('span:nth-child(2)').textContent} siap dikonfigurasi.`);
}));

$$('.segment').forEach((button) => button.addEventListener('click', () => {
  const position = button.dataset.position;
  $$('.segment').forEach((entry) => entry.classList.toggle('active', entry === button));
  $$('.ll-corner').forEach((corner) => corner.classList.toggle('position-2', position === '2'));
  $('#positionHelp').textContent = position === '1' ? 'Garis horizontal berada di atas inti LL' : 'Garis lurus ke atas dipindahkan ke kanan inti LL';
}));

$$('.theme-option').forEach((button) => button.addEventListener('click', () => {
  $$('.theme-option').forEach((entry) => entry.classList.toggle('selected', entry === button));
  document.body.classList.toggle('light-mode', button.dataset.theme === 'light');
  toast('Tema diperbarui', `Tema ${button.textContent.trim()} diterapkan ke desktop.`);
}));

$('#llToggle').addEventListener('change', (event) => {
  $$('.ll-corner').forEach((corner) => { corner.style.opacity = event.target.checked ? '1' : '0.18'; });
});

$('#globalSearch').addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase();
  $$('.setting-row').forEach((row) => { row.hidden = query && !row.textContent.toLowerCase().includes(query); });
});

$$('.setting-row').forEach((row) => row.addEventListener('click', () => {
  $$('.setting-row').forEach((entry) => entry.classList.remove('selected'));
  row.classList.add('selected');
  toast('Modul dipilih', `${row.querySelector('strong').textContent} siap disesuaikan.`);
}));

$('#saveButton').addEventListener('click', () => toast());
$('#resetButton').addEventListener('click', () => {
  $('#globalSearch').value = '';
  $$('.setting-row').forEach((row) => { row.hidden = false; row.classList.remove('selected'); });
  $$('.segment').forEach((entry) => entry.classList.toggle('active', entry.dataset.position === '1'));
  $$('.ll-corner').forEach((corner) => { corner.classList.remove('position-2'); corner.style.opacity = '1'; });
  $('#llToggle').checked = true;
  $('#positionHelp').textContent = 'Garis horizontal berada di atas inti LL';
  toast('Pengaturan direset', 'Konfigurasi kembali ke nilai awal.');
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#globalSearch').focus(); }
});
