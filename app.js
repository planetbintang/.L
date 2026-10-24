window.$ = (selector, root = document) => root.querySelector(selector);
window.$$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const toast = (title = 'Workspace tersimpan', detail = 'Konfigurasi workspace telah diperbarui.') => {
  const node = $('#toast');
  node.querySelector('strong').textContent = title;
  node.querySelector('small').textContent = detail;
  node.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => node.classList.remove('show'), 2800);
};

const drawer = $('#menuDrawer');
function setDrawer(open) {
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  $('#menuTrigger').setAttribute('aria-expanded', String(open));
}
$('#menuTrigger').addEventListener('click', () => setDrawer(true));
$('#bottomMenu').addEventListener('click', () => setDrawer(true));
$('#menuClose').addEventListener('click', () => setDrawer(false));
$('#drawerBackdrop').addEventListener('click', () => setDrawer(false));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setDrawer(false);
});

function updateClock() {
  const now = new Date();
  $('#mobileClock').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  $('#mobileDate').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}
updateClock();
setInterval(updateClock, 30000);

const desktopState = { index: null, app: 'explorer', fileFilter: '' };
const browserState = { history: JSON.parse(localStorage.getItem('planetbintang-browser-history') || '[]') };
const formatBytes = (bytes = 0) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
const api = async (url, options) => { const response = await fetch(url, options); if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `HTTP ${response.status}`); return response.json(); };

function browserTarget(value) {
  const query = value.trim();
  if (!query) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(query)) return '';
  return `#workspace/analytics?query=${encodeURIComponent(query)}`;
}
function rememberBrowserVisit(value, target) {
  browserState.history = [{ label: value, target, visitedAt: new Date().toISOString() }, ...browserState.history.filter((item) => item.target !== target)].slice(0, 5);
  localStorage.setItem('planetbintang-browser-history', JSON.stringify(browserState.history));
}
function launchBrowser(value) {
  const target = browserTarget(value);
  if (!target) { toast('Browser siap', 'Masukkan kata pencarian atau URL terlebih dahulu.'); $('#browserInput').focus(); return; }
  const settings = JSON.parse(localStorage.getItem('planetbintang-mobile-settings') || '{}');
  if (!settings.privateBrowsing) rememberBrowserVisit(value.trim(), target);
  openBrowserView(target, value.trim());
}
$('#browserForm').addEventListener('submit', (event) => { event.preventDefault(); launchBrowser($('#browserInput').value); });

function applyIndex(data) {
  desktopState.index = data;
  $('#repoName').textContent = data.git?.name || 'planetbintang/.L';
  $('#repoBranch').textContent = `branch: ${data.git?.branch || '--'} · ${data.files.toLocaleString('id-ID')} file`;
  $('#glanceFiles').textContent = `${data.files.toLocaleString('id-ID')} file`;
  $('#drawerStatus').textContent = `${data.files.toLocaleString('id-ID')} file siap digunakan`;
}
async function refreshIndex() {
  try { applyIndex(await api('/api/index')); toast('Repo diperbarui', 'Metadata workspace berhasil dimuat.'); }
  catch (error) { toast('Mode preview', 'API filesystem belum aktif; antarmuka tetap bisa digunakan.'); }
}
refreshIndex();
$('#indexNowButton').addEventListener('click', refreshIndex);

const modal = $('#appModal');
function setModal(app, body) {
  const meta = { browser: ['⌕', 'Browser Plugin', 'Pencarian snapshot dan aktivitas lokal'], explorer: ['▤', 'File Explorer', 'Filesystem seluruh workspace'], index: ['⌁', 'Workspace Index', 'Data sistem & metadata'], access: ['⌘', 'Repo Access', 'Snapshot, branch, dan metadata'], settings: ['⚙', 'Bahasa & Input', 'Preferensi aplikasi'] }[app];
  $('#modalIcon').textContent = meta[0]; $('#modalTitle').textContent = meta[1]; $('#modalSubtitle').textContent = meta[2]; $('#modalBody').innerHTML = body;
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); desktopState.app = app; setDrawer(false);
}
function openBrowserView(target, label = target) {
  setModal('browser', `<div class="browser-view"><form class="browser-modal-form" id="browserModalForm"><span>⌕</span><input id="browserModalInput" value="${label.replace(/"/g, '&quot;')}" aria-label="URL browser" /><button type="submit">Buka</button></form><div class="browser-view-note"><span>Snapshot view internal · sistem tidak membuka URL eksternal</span><button type="button" id="browserBack">Aktivitas</button></div><iframe class="browser-frame" title="Browser internal" src="${target.replace(/"/g, '&quot;')}" loading="lazy" referrerpolicy="no-referrer"></iframe></div>`);
  $('#browserModalForm').addEventListener('submit', (event) => { event.preventDefault(); launchBrowser($('#browserModalInput').value); });
  $('#browserBack').addEventListener('click', openBrowser);
}
function openBrowser() {
  const historyRows = browserState.history.length ? browserState.history.map((item) => `<button class="browser-history-row" data-browser-target="${encodeURIComponent(item.target)}"><span>↗</span><div><b>${item.label}</b><small>${item.target}</small></div><i>›</i></button>`).join('') : '<div class="modal-empty">Belum ada aktivitas browsing lokal.</div>';
  setModal('browser', `<div class="browser-settings"><div class="detail-box"><h4>Konfigurasi browser</h4><p>Sumber input sistem: <b>planetbintang/</b></p><p>Mode pembukaan: <b>tab browser baru</b></p><p>Penyimpanan aktivitas: <b>local device</b></p></div><div class="detail-box"><div class="browser-modal-head"><h4>Aktivitas browsing</h4><button id="clearBrowserHistory" class="clear-history">Hapus data</button></div><div class="browser-history-list">${historyRows}</div></div></div>`);
  $$('.browser-history-row').forEach((row) => row.addEventListener('click', () => launchBrowser(decodeURIComponent(row.dataset.browserTarget))));
  $('#clearBrowserHistory')?.addEventListener('click', () => { browserState.history = []; localStorage.removeItem('planetbintang-browser-history'); openBrowser(); toast('Data browsing dihapus', 'Riwayat lokal planetbintang/ sudah dibersihkan.'); });
}
$('#browserActivityButton').addEventListener('click', openBrowser);
function openExplorer() {
  const entries = (desktopState.index?.entries || []).filter((entry) => !desktopState.fileFilter || entry.path.toLowerCase().includes(desktopState.fileFilter));
  const rows = entries.length ? entries.map((entry) => `<tr class="file-row" data-file-path="${encodeURIComponent(entry.path)}"><td class="file-name">${entry.kind === 'system' ? '◈' : '□'} ${entry.path}</td><td>${entry.extension || 'folderless'}</td><td>${formatBytes(entry.size)}</td><td>${entry.kind}</td></tr>`).join('') : '<tr><td colspan="4" class="modal-empty">Belum ada data indeks. Segarkan repo terlebih dahulu.</td></tr>';
  setModal('explorer', `<div class="explorer-toolbar"><div class="explorer-path">⌂ / planetbintang/.L</div><input class="explorer-search" id="fileFilter" value="${desktopState.fileFilter}" placeholder="Filter file..." /></div><table class="file-table"><thead><tr><th>Nama file / path</th><th>Tipe</th><th>Ukuran</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`);
  $('#fileFilter').addEventListener('input', (event) => { desktopState.fileFilter = event.target.value.toLowerCase(); openExplorer(); });
  $$('.file-row').forEach((row) => row.addEventListener('click', () => openFile(decodeURIComponent(row.dataset.filePath))));
}
async function openFile(path) {
  try { const file = await api(`/api/file?path=${encodeURIComponent(path)}`); setModal('explorer', `<button class="back-link" id="backExplorer">← Kembali ke Explorer</button><div class="file-view-head"><strong>${file.path}</strong><span>${formatBytes(file.size)}</span></div><pre class="file-preview">${file.content.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]))}</pre>`); $('#backExplorer').addEventListener('click', openExplorer); }
  catch (error) { setModal('explorer', `<div class="modal-empty">${error.message}</div>`); }
}
function openIndex() {
  const data = desktopState.index;
  setModal('index', data ? `<div class="detail-box"><h4>Workspace</h4><p>Root <b>${data.root}</b></p><p>Files <b>${data.files.toLocaleString('id-ID')}</b></p><p>Folders <b>${data.folders.toLocaleString('id-ID')}</b></p><p>Ukuran <b>${formatBytes(data.bytes)}</b></p></div><div class="detail-box"><h4>Git metadata</h4><p>Repository <b>${data.git.name}</b></p><p>Branch <b>${data.git.branch}</b></p><p>Tracked <b>${data.git.tracked}</b></p><p>Modified <b>${data.git.modified}</b></p></div>` : '<div class="modal-empty">Indeks belum tersedia.</div>');
}
function openAccess() {
  const gitMeta = desktopState.index?.git || {};
  setModal('access', `<div class="detail-box"><p>Workspace root</p><b>${desktopState.index?.root || '/workspace'}</b></div><div class="detail-box"><p>Remote GitHub</p><b>${gitMeta.remote || 'Belum terhubung'}</b></div><div class="detail-box"><p>Visibility</p><b>${gitMeta.visibility || 'Belum terdeteksi'}</b></div><div class="detail-box"><p>Mode akses</p><b>Read-only filesystem</b></div>`);
}
function openSettings() {
  const settings = JSON.parse(localStorage.getItem('planetbintang-mobile-settings') || '{}');
  setModal('settings', `<div class="detail-box mobile-settings-head"><span class="eyebrow">AL.L / MOBILE CONFIG</span><h4>Setelan sistem seluler</h4><p>Antarmuka selalu berjalan dalam mode mobile. Konfigurasi diadaptasi dari sistem Nalar Aksara pada <b>planetbintang/al.l</b>.</p></div><div class="mobile-setting-list"><label class="mobile-setting-row"><span><b>Tema antarmuka</b><small>Preferensi tema gelap atau terang seperti al.l</small></span><select class="mobile-setting-select" id="mobileTheme"><option value="gelap" ${settings.theme !== 'terang' ? 'selected' : ''}>Gelap</option><option value="terang" ${settings.theme === 'terang' ? 'selected' : ''}>Terang</option></select></label><label class="mobile-setting-row"><span><b>Bahasa sistem</b><small>Kata, angka, simbol, dan biner</small></span><select class="mobile-setting-select" id="mobileLanguage"><option selected>id-ID · Indonesia</option></select></label><label class="mobile-setting-row"><span><b>Sumber pengetahuan lokal</b><small>Input berkas .nz dibaca di perangkat tanpa pengiriman otomatis</small></span><span class="setting-badge">LOKAL</span></label><label class="mobile-setting-row"><span><b>Katalog data media</b><small>Indeks domain virtual dan shard aktif al.l</small></span><span class="setting-badge">AKTIF</span></label><label class="mobile-setting-row"><span><b>Input sentuh</b><small>Optimalkan tombol dan gesture untuk layar sentuh</small></span><input class="mobile-setting-toggle" data-setting-key="touch" type="checkbox" ${settings.touch !== false ? 'checked' : ''} /></label><label class="mobile-setting-row"><span><b>Mode privat browsing</b><small>Jangan simpan aktivitas browser di perangkat</small></span><input class="mobile-setting-toggle" data-setting-key="privateBrowsing" type="checkbox" ${settings.privateBrowsing ? 'checked' : ''} /></label></div><div class="detail-box"><h4>Sesi dan arsip</h4><p>Aktivitas lokal dapat dibersihkan kapan saja. Tidak ada akun dan tidak ada pengiriman otomatis.</p><button class="clear-history" id="clearAllLocalData">Bersihkan data lokal</button></div>`);
  $('#mobileTheme').addEventListener('change', (event) => { const current = JSON.parse(localStorage.getItem('planetbintang-mobile-settings') || '{}'); current.theme = event.target.value; localStorage.setItem('planetbintang-mobile-settings', JSON.stringify(current)); document.body.classList.toggle('light-mode', event.target.value === 'terang'); toast('Tema disimpan', `Tema ${event.target.value} diterapkan.`); });
  $('#mobileLanguage').addEventListener('change', (event) => toast('Bahasa sistem', `Bahasa ${event.target.value} aktif.`));
  $('#clearAllLocalData').addEventListener('click', () => { localStorage.removeItem('planetbintang-browser-history'); localStorage.removeItem('planetbintang-mobile-settings'); browserState.history = []; toast('Data lokal dibersihkan', 'Riwayat, tema, dan preferensi lokal dihapus.'); openSettings(); });
  $$('.mobile-setting-toggle').forEach((toggle) => toggle.addEventListener('change', (event) => {
    const current = JSON.parse(localStorage.getItem('planetbintang-mobile-settings') || '{}');
    current[event.target.dataset.settingKey] = event.target.checked;
    localStorage.setItem('planetbintang-mobile-settings', JSON.stringify(current));
    if (event.target.dataset.settingKey === 'privateBrowsing' && event.target.checked) { browserState.history = []; localStorage.removeItem('planetbintang-browser-history'); }
    toast('Setelan mobile disimpan', `${event.target.closest('.mobile-setting-row').querySelector('b').textContent} diperbarui.`);
  }));
}
function openApp(app) { ({ browser: openBrowser, explorer: openExplorer, index: openIndex, access: openAccess, settings: openSettings })[app]?.(); }
$$('[data-open-app]').forEach((button) => button.addEventListener('click', () => openApp(button.dataset.openApp)));
$('#modalClose').addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); });
$('#modalRefresh').addEventListener('click', () => { if (desktopState.app === 'explorer') openExplorer(); else if (desktopState.app === 'index') openIndex(); else if (desktopState.app === 'access') openAccess(); refreshIndex(); });
modal.addEventListener('click', (event) => { if (event.target === modal) $('#modalClose').click(); });
