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
const formatBytes = (bytes = 0) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
const api = async (url, options) => { const response = await fetch(url, options); if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `HTTP ${response.status}`); return response.json(); };

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
  const meta = { explorer: ['▤', 'File Explorer', 'Filesystem seluruh workspace'], index: ['⌁', 'Workspace Index', 'Data sistem & metadata'], access: ['⌘', 'Repo Access', 'GitHub, remote, dan branch'], settings: ['⚙', 'Bahasa & Input', 'Preferensi aplikasi'] }[app];
  $('#modalIcon').textContent = meta[0]; $('#modalTitle').textContent = meta[1]; $('#modalSubtitle').textContent = meta[2]; $('#modalBody').innerHTML = body;
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); desktopState.app = app; setDrawer(false);
}
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
function openSettings() { setModal('settings', '<div class="detail-box"><h4>Bahasa & Input</h4><p>Antarmuka mobile menggunakan Bahasa Indonesia.</p><p>Input sentuh aktif · layout responsif · tema liquid glass.</p></div><div class="detail-box"><h4>Tentang shell</h4><p>Planetbintang Mobile Workspace dapat menjalankan alat GitHub dari repositori ini melalui browser.</p></div>'); }
function openApp(app) { ({ explorer: openExplorer, index: openIndex, access: openAccess, settings: openSettings })[app]?.(); }
$$('[data-open-app]').forEach((button) => button.addEventListener('click', () => openApp(button.dataset.openApp)));
$('#modalClose').addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); });
$('#modalRefresh').addEventListener('click', () => { if (desktopState.app === 'explorer') openExplorer(); else if (desktopState.app === 'index') openIndex(); else if (desktopState.app === 'access') openAccess(); refreshIndex(); });
modal.addEventListener('click', (event) => { if (event.target === modal) $('#modalClose').click(); });
