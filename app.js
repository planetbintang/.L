window.$ = (selector, root = document) => root.querySelector(selector);
window.$$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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


const desktopState = { index: null, app: 'explorer', fileFilter: '' };
const formatBytes = (bytes = 0) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
const api = async (url, options) => { const response = await fetch(url, options); if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `HTTP ${response.status}`); return response.json(); };

function updateClock() {
  const now = new Date();
  $('#desktopClock').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  $('#desktopDate').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}
updateClock(); setInterval(updateClock, 30000);

function applyIndex(data) {
  desktopState.index = data;
  $('#fileCount').textContent = data.files.toLocaleString('id-ID');
  $('#folderCount').textContent = data.folders.toLocaleString('id-ID');
  $('#workspaceSize').textContent = formatBytes(data.bytes);
  $('#trackedCount').textContent = (data.git?.tracked ?? 0).toLocaleString('id-ID');
  $('#modifiedCount').textContent = (data.git?.modified ?? 0).toLocaleString('id-ID');
  $('#ignoredCount').textContent = (data.system ?? 0).toLocaleString('id-ID');
  $('#stageFileCount').textContent = `${data.files.toLocaleString('id-ID')} FILES`;
  $('#repoName').textContent = data.git?.name || 'sumberkode/.L';
  $('#repoPath').textContent = data.root;
  $('#repoVisibility').textContent = data.git?.visibility || 'REPO TERHUBUNG';
  $('#repoBranch').textContent = `branch: ${data.git?.branch || '--'}`;
  $('#accessTitle').textContent = data.git?.remote && data.git.remote !== 'Belum terhubung' ? 'Remote repository aktif' : 'Local workspace aktif';
  $('#indexProgress').style.width = '100%';
  $('#indexStatus').textContent = `${data.files.toLocaleString('id-ID')} file siap dijelajah · ${new Date(data.generatedAt).toLocaleTimeString('id-ID')}`;
}

async function refreshIndex() {
  $('#indexStatus').textContent = 'Membaca filesystem workspace...';
  $('#indexProgress').style.width = '48%';
  try { applyIndex(await api('/api/index')); toast('Filesystem terindeks', 'Seluruh file workspace siap dijelajah.'); }
  catch (error) { $('#indexStatus').textContent = 'Server workspace belum aktif'; $('#indexProgress').style.width = '8%'; toast('Mode preview', 'Jalankan server.py untuk mengaktifkan filesystem API.'); }
}
refreshIndex();

const modal = $('#appModal');
function setModal(app, body) {
  const meta = { explorer: ['▤', 'File Explorer', 'Filesystem seluruh workspace'], index: ['⌁', 'Workspace Index', 'Data sistem & metadata'], access: ['⌘', 'Repo Access', 'Privat / publik terdeteksi'], settings: ['⚙', 'Settings', 'Bahasa & Input System'] }[app];
  $('#modalIcon').textContent = meta[0]; $('#modalTitle').textContent = meta[1]; $('#modalSubtitle').textContent = meta[2]; $('#modalBody').innerHTML = body;
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); desktopState.app = app;
}
function openExplorer() {
  const entries = (desktopState.index?.entries || []).filter((entry) => !desktopState.fileFilter || entry.path.toLowerCase().includes(desktopState.fileFilter));
  const rows = entries.length ? entries.map((entry) => `<tr class="file-row" data-file-path="${encodeURIComponent(entry.path)}"><td class="file-name">${entry.kind === 'system' ? '◈' : '□'} ${entry.path}</td><td>${entry.extension || 'folderless'}</td><td>${formatBytes(entry.size)}</td><td class="file-kind">${entry.kind}</td></tr>`).join('') : '<tr><td colspan="4" class="modal-empty">Belum ada data indeks. Klik Indeks Sekarang.</td></tr>';
  setModal('explorer', `<div class="explorer-toolbar"><div class="explorer-path">⌂ / sumberkode</div><input class="explorer-search" id="fileFilter" value="${desktopState.fileFilter}" placeholder="Filter file..." /></div><table class="file-table"><thead><tr><th>Nama file / path</th><th>Tipe</th><th>Ukuran</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`);
  $('#fileFilter').addEventListener('input', (event) => { desktopState.fileFilter = event.target.value.toLowerCase(); openExplorer(); });
  $$('.file-row').forEach((row) => row.addEventListener('click', () => openFile(decodeURIComponent(row.dataset.filePath))));
}
async function openFile(path) {
  try { const file = await api(`/api/file?path=${encodeURIComponent(path)}`); setModal('explorer', `<button class="back-link" id="backExplorer">← Kembali ke Explorer</button><div class="file-view-head"><strong>${file.path}</strong><span>${formatBytes(file.size)}</span></div><pre class="file-preview">${file.content.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]))}</pre>`); $('#backExplorer').addEventListener('click', openExplorer); }
  catch (error) { setModal('explorer', `<div class="modal-empty">${error.message}</div>`); }
}
function openIndex() {
  const data = desktopState.index;
  setModal('index', data ? `<div class="index-detail"><div class="detail-box"><h4>Filesystem</h4><p>Root <b>${data.root}</b></p><p>Files <b>${data.files.toLocaleString('id-ID')}</b></p><p>Folders <b>${data.folders.toLocaleString('id-ID')}</b></p><p>Size <b>${formatBytes(data.bytes)}</b></p></div><div class="detail-box"><h4>Git metadata</h4><p>Repository <b>${data.git.name}</b></p><p>Branch <b>${data.git.branch}</b></p><p>Tracked <b>${data.git.tracked}</b></p><p>Modified <b>${data.git.modified}</b></p></div></div><div class="detail-box" style="margin-top:12px"><h4>Index policy</h4><p>Semua file workspace diindeks read-only. Folder .git internal tidak dibuka sebagai file preview; metadata Git tetap dibaca melalui CLI lokal.</p></div>` : '<div class="modal-empty">Indeks belum tersedia.</div>');
}
function openAccess() {
  const gitMeta = desktopState.index?.git || {}; setModal('access', `<div class="access-detail"><div class="detail-box"><span>Workspace root</span><b>${desktopState.index?.root || '/home/ubuntu/sumberkode'}</b></div><div class="detail-box"><span>Remote</span><b>${gitMeta.remote || 'Belum terhubung'}</b></div><div class="detail-box"><span>Visibility</span><b>${gitMeta.visibility || 'Belum terdeteksi'}</b></div><div class="settings-modal-note"><strong>Mode akses aman</strong><br />Desktop hanya memproses filesystem lokal repository ini dalam mode read-only. Tidak ada file yang diubah saat indexing.</div></div>`);
}
function openSettings() { modal.classList.remove('open'); $('#sectionName').textContent = 'UMUM & TAMPILAN'; document.querySelector('.content-header').scrollIntoView({ behavior: 'smooth' }); }
function openApp(app) { ({ explorer: openExplorer, index: openIndex, access: openAccess, settings: openSettings })[app]?.(); }
$$('[data-open-app]').forEach((button) => button.addEventListener('click', () => openApp(button.dataset.openApp)));
$('#indexNowButton').addEventListener('click', refreshIndex);
$('#desktopSearch').addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase();
  if (query.includes('file') || query.includes('explorer') || query.includes('storage')) openApp('explorer');
  else if (query.includes('repo') || query.includes('git') || query.includes('remote')) openApp('access');
  else if (query.includes('index') || query.includes('workspace') || query.includes('7d')) openApp('index');
  else if (query.includes('setting') || query.includes('input')) openApp('settings');
});
$('#modalClose').addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); });
$('#modalRefresh').addEventListener('click', () => { if (desktopState.app === 'explorer') openExplorer(); else if (desktopState.app === 'index') openIndex(); else if (desktopState.app === 'access') openAccess(); refreshIndex(); });
modal.addEventListener('click', (event) => { if (event.target === modal) $('#modalClose').click(); });
