import { browseVirtualPath, getVirtualFileContent, formatSize } from './assets/virtual-fs.js';
import { KATA_CATEGORIES, getTotalKataCount } from './assets/kata-data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const PAGE_SIZE = 50;
const STORE_ROOT = 'aireber/workspace';
const PROMPT_ROOT = 'aireber/prompts';
const PROJECT_ROOT = 'aireber/projects';
const DB_NAME = 'planetbintang-file-workspace';
let currentPath = '/';
let currentPage = 0;
let currentNodes = [];
let currentTotal = 0;
let currentNode = null;
let currentView = 'studio';
let store;

function normalizePath(input) {
  const pieces = String(input ?? '').replaceAll('\\', '/').trim().split('/').filter(Boolean);
  if (pieces.some((part) => part === '.' || part === '..' || /[\u0000-\u001f\u007f]/.test(part))) throw new Error('Path tidak valid.');
  if (pieces.some((part) => part.length > 180) || pieces.length > 32) throw new Error('Path terlalu panjang.');
  const path = pieces.join('/');
  if (path.length > 1024) throw new Error('Path melebihi batas.');
  return path;
}
function requestValue(request) { return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error || new Error('Operasi IndexedDB gagal.')); }); }
function transactionDone(tx) { return new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onabort = tx.onerror = () => reject(tx.error || new Error('Transaksi IndexedDB gagal.')); }); }
function localIndexedDbAdapter() {
  let dbPromise;
  const open = () => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB tidak tersedia di browser ini.'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'path' });
        if (!db.objectStoreNames.contains('audit')) db.createObjectStore('audit', { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Workspace lokal gagal dibuka.'));
    });
    return dbPromise;
  };
  const all = async () => { const db = await open(); return requestValue(db.transaction('files', 'readonly').objectStore('files').getAll()); };
  const parents = (path) => { const parts = path.split('/'); const out = []; for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join('/')); return out; };
  const audit = async (action, path, bytes = 0) => { try { const db = await open(); const tx = db.transaction('audit', 'readwrite'); tx.objectStore('audit').add({ action, path, at: new Date().toISOString(), bytes, note: 'AI Reber standalone fallback' }); await transactionDone(tx); } catch { /* audit tidak menggagalkan penyimpanan lokal */ } };
  const get = async (path) => { const key = normalizePath(path); if (!key) return null; const db = await open(); return (await requestValue(db.transaction('files', 'readonly').objectStore('files').get(key))) || null; };
  const put = async (path, blob, mime, type = 'file') => {
    const key = normalizePath(path); if (!key) throw new Error('Path tidak boleh kosong.');
    const rows = await all(); const byPath = new Map(rows.map((row) => [row.path, row])); const old = byPath.get(key);
    if (old && old.type !== type) throw new Error('Nama item sudah dipakai oleh jenis berbeda.');
    for (const parent of parents(key)) if (byPath.get(parent)?.type === 'file') throw new Error(`Induk ${parent} adalah file.`);
    const db = await open(); const tx = db.transaction('files', 'readwrite'); const table = tx.objectStore('files'); const updatedAt = new Date().toISOString();
    for (const parent of parents(key)) if (byPath.get(parent)?.type !== 'directory') table.put({ path: parent, type: 'directory', mime: '', blob: new Blob([]), size: 0, updatedAt });
    table.put({ path: key, type, mime: type === 'file' ? mime : '', blob: type === 'file' ? blob : new Blob([]), size: type === 'file' ? blob.size : 0, updatedAt });
    await transactionDone(tx);
    await audit('save', key, type === 'file' ? blob.size : 0);
    return { path: key, type, size: type === 'file' ? blob.size : 0, updatedAt };
  };
  return {
    normalizePath,
    get,
    async list(path = '') {
      const base = normalizePath(path), prefix = base ? `${base}/` : '', rows = await all(), children = new Map();
      for (const row of rows) {
        if (!row.path.startsWith(prefix) || row.path === base) continue;
        const suffix = row.path.slice(prefix.length), part = suffix.split('/')[0], childPath = prefix + part, direct = !suffix.includes('/');
        if (!direct || row.type === 'directory') children.set(childPath, { path: childPath, type: 'directory', size: 0, source: 'local' });
        else children.set(childPath, { path: childPath, type: 'file', size: row.size || 0, mime: row.mime || '', source: 'local' });
      }
      return [...children.values()].sort((a, b) => Number(b.type === 'directory') - Number(a.type === 'directory') || a.path.localeCompare(b.path, 'id'));
    },
    async readFile(path) { const row = await get(path); if (!row || row.type !== 'file') throw new Error('File lokal tidak ditemukan.'); return { ...row, text: await row.blob.text() }; },
    async saveFile(path, content, mime = 'text/plain;charset=utf-8') { const blob = content instanceof Blob ? content : new Blob([String(content ?? '')], { type: mime }); return put(path, blob, mime, 'file'); },
    async mkdir(path) { return put(path, new Blob([]), '', 'directory'); },
    async remove(path) { const key = normalizePath(path); const rows = await all(); const hits = rows.filter((row) => row.path === key || row.path.startsWith(`${key}/`)); if (!hits.length) throw new Error('Item tidak ditemukan.'); const db = await open(); const tx = db.transaction('files', 'readwrite'); hits.forEach((row) => tx.objectStore('files').delete(row.path)); await transactionDone(tx); await audit('delete', key, hits.reduce((n,row)=>n+(Number(row.size)||0),0)); return hits.length; },
    async isDirectory(path) { const key = normalizePath(path); if (!key) return true; const rows = await all(); return rows.some((row) => row.type === 'directory' && row.path === key) || rows.some((row) => row.path.startsWith(`${key}/`)); },
  };
}

function getStore() {
  return window.PBLocalFiles || localIndexedDbAdapter();
}
function storagePath(virtualPath) {
  const segments = String(virtualPath || '/').split('/').filter(Boolean).map((part) => { try { return decodeURIComponent(part); } catch { return part; } });
  return normalizePath([STORE_ROOT, ...segments].join('/'));
}
function virtualPathFrom(parent, name) {
  const part = encodeURIComponent(name);
  return parent === '/' ? `/${part}` : `${parent}/${part}`;
}
function folderOpenIcon() {
  const img = document.createElement('img'); img.src = '../file-manager-icon.png'; img.alt = ''; img.loading = 'lazy'; return img;
}
function setStatus(selector, text) { const target = $(selector); if (target) target.textContent = text; }

const THEME_KEY = 'planetbintang.aireber.theme.v1';
function applyTheme(theme) {
  const value = ['cahaya', 'air', 'berlian'].includes(theme) ? theme : 'cahaya';
  document.documentElement.dataset.theme = value;
  const picker = $('#reberTheme'); if (picker) picker.value = value;
  try { localStorage.setItem(THEME_KEY, value); } catch { /* theme tetap berlaku dalam tab ini */ }
}
try { applyTheme(localStorage.getItem(THEME_KEY) || 'cahaya'); } catch { applyTheme('cahaya'); }
$('#reberTheme')?.addEventListener('change', (event) => applyTheme(event.target.value));
// Sinkron dua arah dengan tampilan utama Planetbintang (planetbintang-themes.js
// memakai THEME_KEY yang sama) — mis. saat kembali dari navigasi lintas halaman.
window.addEventListener('storage', (event) => { if (event.key === THEME_KEY) applyTheme(event.newValue); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { try { applyTheme(localStorage.getItem(THEME_KEY) || 'cahaya'); } catch { /* abaikan */ } } });
// Kabari pemilih tema pada tampilan utama Planetbintang agar ikut tersinkron.
document.addEventListener('planetbintang:theme-change', (event) => {
  const picker = $('#reberTheme');
  if (picker && ['cahaya', 'air', 'berlian'].includes(event.detail?.theme)) picker.value = event.detail.theme;
});

function setView(view) {
  currentView = view;
  $$('[data-view-tab]').forEach((button) => {
    const active = button.dataset.viewTab === view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  $$('[data-view]').forEach((panel) => { const active = panel.dataset.view === view; panel.hidden = !active; panel.classList.toggle('active', active); });
  if (view === 'filesystem') void refreshFilesystem();
  if (view === 'projects') void refreshProjects();
}
$$('[data-view-tab]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.viewTab));
  button.addEventListener('keydown', (event) => {
    const tabs = $$('[data-view-tab]'); const index = tabs.indexOf(button);
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
      : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
    if (next >= 0) { event.preventDefault(); tabs[next].focus(); setView(tabs[next].dataset.viewTab); }
  });
});

function renderBreadcrumb() {
  const host = $('#breadcrumbs'); host.replaceChildren();
  const root = document.createElement('button'); root.type = 'button'; root.textContent = '/'; root.addEventListener('click', () => navigate('/')); host.append(root);
  const parts = currentPath.split('/').filter(Boolean); let built = '';
  for (const part of parts) {
    const sep = document.createElement('span'); sep.textContent = '/'; host.append(sep);
    try { built += `/${encodeURIComponent(decodeURIComponent(part))}`; } catch { built += `/${encodeURIComponent(part)}`; }
    const target = built; const button = document.createElement('button'); button.type = 'button';
    try { button.textContent = decodeURIComponent(part); } catch { button.textContent = part; }
    button.addEventListener('click', () => navigate(target)); host.append(button);
  }
  $('#pathInput').value = currentPath;
}
function setPreview(node, content = '') {
  currentNode = node;
  $('#previewTitle').textContent = node?.name || 'Pilih file';
  $('#previewPath').textContent = node?.path || '—';
  $('#fileEditor').value = content;
  $('#fileEditor').disabled = !node || node.type !== 'file';
  $('#saveFile').disabled = !node || node.type !== 'file';
  $('#deleteFile').hidden = !node?.local;
  setStatus('#fileStatus', node?.type === 'file' ? (node.local ? 'Draft lokal; tidak ada kode yang dieksekusi.' : 'File virtual read-only sampai disimpan sebagai override lokal.') : 'Tidak ada kode yang dieksekusi.');
}
async function openNode(node) {
  if (node.type === 'folder') { navigate(node.path); return; }
  let content = node.content || getVirtualFileContent(node.path) || '';
  if (node.local) {
    try { content = (await store.readFile(node.dbPath)).text; }
    catch (error) { setStatus('#fileStatus', error.message); }
  } else {
    const dbPath = storagePath(node.path);
    try { const local = await store.get(dbPath); if (local?.type === 'file') { content = await (await store.readFile(dbPath)).text; node.local = true; node.dbPath = dbPath; } } catch { /* no local override */ }
  }
  setPreview(node, content);
  $$('.node-row').forEach((row) => row.classList.toggle('selected', row.dataset.path === node.path));
}
function renderNodes(nodes) {
  const list = $('#nodeList'); list.replaceChildren();
  const query = $('#fsSearch').value.trim().toLowerCase();
  const filtered = nodes.filter((node) => !query || node.name.toLowerCase().includes(query));
  if (!filtered.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = query ? 'Tidak ada item cocok pada halaman/folder ini.' : 'Folder kosong. Buat file atau folder lokal.'; list.append(empty); }
  for (const node of filtered) {
    const row = document.createElement('button'); row.type = 'button'; row.className = 'node-row'; row.dataset.path = node.path;
    if (node === currentNode || currentNode?.path === node.path) row.classList.add('selected');
    if (node.type === 'folder') row.append(folderOpenIcon()); else { const icon = document.createElement('span'); icon.textContent = ({ieje:'▣',aeea:'◈',nz:'⌘',ck:'◆',regs:'▦',log:'≋'})[node.extension?.replace(/^\./,'')] || '▤'; icon.className = 'node-file-icon'; row.append(icon); }
    const name = document.createElement('span'); name.className = 'node-name'; name.textContent = node.name; row.append(name);
    const meta = document.createElement('span'); meta.className = 'node-meta'; meta.textContent = node.type === 'folder' ? 'FOLDER' : `${node.extension || 'FILE'}${node.local ? ' · LOCAL' : ''}`; row.append(meta);
    row.addEventListener('click', () => void openNode(node)); list.append(row);
  }
  $('#listCount').textContent = `${filtered.length} item${currentTotal ? ` · ${currentTotal.toLocaleString('id-ID')} total` : ''}`;
  $('#listTitle').textContent = currentPath;
}
async function refreshFilesystem() {
  if (!store) return;
  const result = browseVirtualPath(currentPath, currentPage, PAGE_SIZE);
  const nodes = (result.nodes || []).map((node) => ({ ...node, extension: node.extension || (node.type === 'file' ? `.${node.name.split('.').pop()}` : '') }));
  let localNodes = [];
  try {
    const rows = await store.list(storagePath(currentPath));
    localNodes = rows.map((row) => {
      const name = row.path.split('/').pop(); const logicalPath = virtualPathFrom(currentPath, name); const isFolder = row.type === 'directory';
      return { name, path: logicalPath, type: isFolder ? 'folder' : 'file', extension: isFolder ? '' : `.${name.split('.').pop()}`, local: true, dbPath: row.path, size: Number(row.size) || 0 };
    });
  } catch (error) { setStatus('#fileStatus', `Workspace lokal tidak tersedia: ${error.message}`); }
  const byName = new Map(nodes.map((node) => [node.name, node]));
  for (const local of localNodes) byName.set(local.name, local);
  currentNodes = [...byName.values()].sort((a,b) => Number(b.type === 'folder') - Number(a.type === 'folder') || a.name.localeCompare(b.name,'id',{sensitivity:'base'}));
  currentTotal = result.total || currentNodes.length; currentTotal += Math.max(0, localNodes.length - (result.nodes || []).filter((x) => localNodes.some((l) => l.name === x.name)).length);
  renderBreadcrumb(); renderNodes(currentNodes);
  $('#pageLabel').textContent = currentPath === '/allunivers_os/kata' ? `Halaman ${currentPage + 1} / ${Math.max(1,Math.ceil((result.total || 0)/PAGE_SIZE)).toLocaleString('id-ID')}` : 'Halaman 1';
  $('#prevPage').disabled = currentPage <= 0;
  $('#nextPage').disabled = currentPath !== '/allunivers_os/kata' || (currentPage + 1) * PAGE_SIZE >= (result.total || 0);
  $('#fsUp').disabled = currentPath === '/';
  if (!currentNode || currentNode.path !== $('#previewPath').textContent) setPreview(null);
}
function navigate(path) {
  try {
    const raw = String(path || '/').trim(); const parts = raw.replaceAll('\\','/').split('/').filter(Boolean).map((part) => { let decoded; try { decoded = decodeURIComponent(part); } catch { decoded = part; } if (decoded === '.' || decoded === '..' || /[\u0000-\u001f\u007f]/.test(decoded)) throw new Error('Path tidak valid.'); return encodeURIComponent(decoded); });
    currentPath = parts.length ? `/${parts.join('/')}` : '/'; currentPage = 0; currentNode = null; $('#fsSearch').value = ''; void refreshFilesystem();
  } catch (error) { setStatus('#fileStatus', error.message); }
}
$('#fsRoot').addEventListener('click', () => navigate('/'));
$('#fsUp').addEventListener('click', () => navigate(currentPath.split('/').slice(0,-1).join('/') || '/'));
$('#pathForm').addEventListener('submit', (event) => { event.preventDefault(); navigate($('#pathInput').value); });
$('#fsSearch').addEventListener('input', () => renderNodes(currentNodes));
$('#prevPage').addEventListener('click', () => { if (currentPage > 0) { currentPage -= 1; currentNode = null; void refreshFilesystem(); } });
$('#nextPage').addEventListener('click', () => { if (currentPath === '/allunivers_os/kata' && (currentPage + 1) * PAGE_SIZE < currentTotal) { currentPage += 1; currentNode = null; void refreshFilesystem(); } });

function templateFor(name, ext) {
  const stem = name.replace(/\.[^.]+$/,'');
  if (ext === '.ieje') return `REBER_KATA_INDEX v1.0\nkata: ${stem}\ncategory: local\ntype: node\nview: visual\nrender: component\naccess: private-local\nsystem: allunivers_os\nengine: reber_ai-static\nextension: .ieje\nstatus: draft\n`;
  if (ext === '.aeea') return `REBER_STYLE v1.0\nkata: ${stem}\ntheme: white-blue\nprimary: #176ee8\nbackground: #eef7ff\nborder: 1px solid #c9dcf1\nradius: 10px\nextension: .aeea\n`;
  if (ext === '.nz') return `REBER_FUNGSI v1.0\nkata: ${stem}\nmode: local-draft\nexecution: disabled\ninput: text\noutput: structured draft\nvalidate: manual-review\nextension: .nz\n`;
  if (ext === '.ck') return `REBER_COMPONENT v1.0\nname: ${stem}\nsource: local-draft\nexecution: disabled\nextension: .ck\n`;
  if (ext === '.regs') return `REBER_REGISTRY v1.0\nname: ${stem}\nvisibility: local\npermissions: read, write\nextension: .regs\n`;
  if (ext === '.log') return `REBER_LOG v1.0\n[${new Date().toISOString()}] local draft created\n`;
  return `# ${stem}\n\nDraft lokal AI Reber. Kode tidak dieksekusi.\n`;
}
async function createFile() {
  const raw = window.prompt('Nama file (tanpa ekstensi; akan disimpan lokal):','file-baru'); if (!raw) return;
  const name = raw.trim().replaceAll('/','-').replaceAll('\\','-'); if (!name || name.length > 140) return setStatus('#fileStatus','Nama file tidak valid.');
  const ext = $('#newFileExt').value; const full = name.toLowerCase().endsWith(ext) ? name : `${name}${ext}`; const path = storagePath(virtualPathFrom(currentPath,full));
  try { await store.saveFile(path, templateFor(full,ext), 'text/plain;charset=utf-8'); await refreshFilesystem(); const node=currentNodes.find((item)=>item.name===full); if(node) await openNode(node); setStatus('#fileStatus',`Tersimpan di Workspace lokal: /${path}`); }
  catch(error){setStatus('#fileStatus',`Gagal menyimpan: ${error.message}`);}
}
async function createFolder() {
  const name=window.prompt('Nama folder lokal:','folder-baru'); if(!name) return;
  try { await store.mkdir(storagePath(virtualPathFrom(currentPath,name.trim()))); await refreshFilesystem(); setStatus('#fileStatus','Folder ditambahkan ke File Manager lokal.'); }
  catch(error){setStatus('#fileStatus',`Gagal membuat folder: ${error.message}`);}
}
$('#newFile').addEventListener('click',()=>void createFile());
$('#newFolder').addEventListener('click',()=>void createFolder());
$('#saveFile').addEventListener('click',async()=>{
  if(!currentNode||currentNode.type!=='file')return;
  const path=currentNode.dbPath||storagePath(currentNode.path);
  try{await store.saveFile(path,$('#fileEditor').value,'text/plain;charset=utf-8');currentNode.local=true;currentNode.dbPath=path;await refreshFilesystem();setPreview(currentNode,$('#fileEditor').value);setStatus('#fileStatus',`Draft tersimpan di /${path}; tidak dieksekusi.`);}
  catch(error){setStatus('#fileStatus',`Gagal menyimpan: ${error.message}`);}
});
$('#deleteFile').addEventListener('click',async()=>{
  if(!currentNode?.local||!currentNode.dbPath)return;
  if(!window.confirm(`Hapus draft lokal /${currentNode.dbPath}?`))return;
  try{await store.remove(currentNode.dbPath);currentNode=null;setPreview(null);await refreshFilesystem();setStatus('#fileStatus','Draft lokal dihapus. File dasar virtual tidak berubah.');}
  catch(error){setStatus('#fileStatus',`Gagal menghapus: ${error.message}`);}
});
$('#uploadButton').addEventListener('click',()=>$('#uploadInput').click());
$('#uploadInput').addEventListener('change',async(event)=>{
  const files=[...(event.target.files||[])];try{for(const file of files){const path=storagePath(virtualPathFrom(currentPath,file.name));await store.saveFile(path,file,file.type||'application/octet-stream');}await refreshFilesystem();setStatus('#fileStatus',`${files.length} file diunggah ke Workspace lokal.`);}catch(error){setStatus('#fileStatus',`Unggah gagal: ${error.message}`);}finally{event.target.value='';}
});

function openParentFileManager() {
  // GitHub Pages project sites keep this route under /.L/; the hash route
  // points directly at the IndexedDB namespace exposed in the root File Manager.
  window.location.href = '../#fileManager/workspace/aireber';
}
$$('[data-open-file-manager]').forEach((button)=>button.addEventListener('click',openParentFileManager));
$$('.tree-link').forEach((button)=>button.addEventListener('click',()=>{setView('filesystem');navigate(button.dataset.path);}));

async function refreshPrompts() {
  const host=$('#promptHistory');host.replaceChildren();
  try {
    const entries=await store.list(PROMPT_ROOT); const files=entries.filter((row)=>row.type==='file').slice(-100).reverse();
    $('#promptCount').textContent=`${files.length} prompt lokal`;
    if(!files.length){const empty=document.createElement('div');empty.className='empty-state';empty.textContent='Belum ada prompt tersimpan. AI belum terhubung.';host.append(empty);return;}
    for(const item of files){const record=await store.readFile(item.path);const article=document.createElement('article');article.className='prompt-entry';const meta=document.createElement('small');meta.textContent=`${item.path} · ${item.updatedAt?new Date(item.updatedAt).toLocaleString('id-ID'):'lokal'}`;const text=document.createElement('p');text.textContent=record.text;article.append(meta,text);host.append(article);}
  } catch(error){$('#promptCount').textContent='Workspace tidak tersedia';const empty=document.createElement('div');empty.className='empty-state';empty.textContent=error.message;host.append(empty);}
}
$('#promptForm').addEventListener('submit',async(event)=>{
  event.preventDefault();const prompt=$('#promptInput').value.trim();if(!prompt)return setStatus('#promptStatus','Tulis prompt sebelum menyimpan.');
  const stamp=new Date().toISOString().replaceAll(':','-');const path=`${PROMPT_ROOT}/prompt-${stamp}.txt`;
  try{await store.saveFile(path,`AI REBER — PROMPT LOKAL\ncreated: ${new Date().toISOString()}\nruntime: offline; not sent to a model\n\n${prompt}\n`,'text/plain;charset=utf-8');$('#promptInput').value='';setStatus('#promptStatus',`Tersimpan di File Manager: /${path}. Tidak dikirim ke AI.`);await refreshPrompts();}
  catch(error){setStatus('#promptStatus',`Gagal menyimpan prompt: ${error.message}`);}
});
$('#reloadPrompts').addEventListener('click',()=>void refreshPrompts());
$$('[data-prompt]').forEach((button)=>button.addEventListener('click',()=>{$('#promptInput').value=button.dataset.prompt;$('#promptInput').focus();}));

function slugify(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50);}
$('#projectName').addEventListener('input',()=>{if(!$('#projectSlug').dataset.touched)$('#projectSlug').value=slugify($('#projectName').value);$('#domainPreview').textContent=`${$('#projectSlug').value||'slug'}.allunivers.digital · belum didaftarkan`;});
$('#projectSlug').addEventListener('input',()=>{$('#projectSlug').dataset.touched='1';$('#projectSlug').value=slugify($('#projectSlug').value);$('#domainPreview').textContent=`${$('#projectSlug').value||'slug'}.allunivers.digital · belum didaftarkan`;});
async function refreshProjects(){
  const host=$('#projectList');host.replaceChildren();
  try{const entries=await store.list(PROJECT_ROOT),files=entries.filter((row)=>row.type==='file');if(!files.length){const empty=document.createElement('div');empty.className='empty-state';empty.textContent='Belum ada proyek lokal.';host.append(empty);return;}
    for(const file of files){let project;try{project=JSON.parse((await store.readFile(file.path)).text);}catch{continue;}const card=document.createElement('article');card.className='project-card';const h=document.createElement('h3');h.textContent=project.name||'Proyek';const p=document.createElement('p');p.textContent=project.description||'Draft sistem lokal.';const d=document.createElement('code');d.textContent=`${project.slug}.allunivers.digital · belum didaftarkan`;const footer=document.createElement('footer');const path=document.createElement('span');path.className='node-meta';path.textContent=project.systemPath||'';const del=document.createElement('button');del.type='button';del.className='danger-button';del.textContent='Hapus metadata';del.addEventListener('click',async()=>{if(!window.confirm(`Hapus metadata ${project.name}? File template tetap dipertahankan.`))return;await store.remove(file.path);await refreshProjects();});footer.append(path,del);card.append(h,p,d,footer);host.append(card);}
  }catch(error){const empty=document.createElement('div');empty.className='empty-state';empty.textContent=`Workspace lokal tidak tersedia: ${error.message}`;host.append(empty);}
}
$('#projectForm').addEventListener('submit',async(event)=>{
  event.preventDefault();const name=$('#projectName').value.trim(),slug=slugify($('#projectSlug').value),description=$('#projectDescription').value.trim();if(!name||!slug)return setStatus('#projectStatus','Nama dan slug wajib diisi.');
  const project={name,slug,description,domain:`${slug}.allunivers.digital`,systemPath:`/allunivers_os/${slug}`,status:'draft-lokal',createdAt:new Date().toISOString(),runtime:'client-only'};const metadataPath=`${PROJECT_ROOT}/${slug}.json`;const base=`${STORE_ROOT}/allunivers_os/${slug}`;
  try{if(await store.get(metadataPath))return setStatus('#projectStatus','Slug tersebut sudah ada di registri lokal.');await store.saveFile(metadataPath,JSON.stringify(project,null,2),'application/json;charset=utf-8');await store.saveFile(`${base}/index.ieje`,`REBER_KATA_INDEX v1.0\nsystem: ${name}\nslug: ${slug}\nview: visual\nstatus: local-draft\nexecution: disabled\n`,'text/plain;charset=utf-8');await store.saveFile(`${base}/style.aeea`,`REBER_STYLE v1.0\nsystem: ${name}\nprimary: #176ee8\nbackground: #eef7ff\nradius: 10px\n`,'text/plain;charset=utf-8');await store.saveFile(`${base}/fungsi.nz`,`REBER_FUNGSI v1.0\nsystem: ${name}\nmode: local-draft\nexecute: disabled\nreview: manual\n`,'text/plain;charset=utf-8');$('#projectForm').reset();delete $('#projectSlug').dataset.touched;$('#domainPreview').textContent='slug.allunivers.digital · belum didaftarkan';setStatus('#projectStatus','Draft tersimpan di File Manager lokal; domain belum didaftarkan.');await refreshProjects();}
  catch(error){setStatus('#projectStatus',`Gagal menyimpan proyek: ${error.message}`);}
});

async function loadSourceIndex(){
  const summary=$('#sourceSummary'),list=$('#sourceList');
  try{const response=await fetch('./source-index.json',{cache:'no-cache'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const manifest=await response.json();summary.textContent=`${manifest.sourceFileCount} file · ${(manifest.sourceBytes/1024).toFixed(1)} KB · ${manifest.repository} @ ${manifest.sourceCommit.slice(0,12)} · seluruh source text non-eksekusi.`;list.replaceChildren();for(const file of manifest.files){const row=document.createElement('div');row.className='source-row';const link=document.createElement('a');link.href=`./${file.publicPath}`;link.target='_blank';link.rel='noopener noreferrer';link.textContent=file.originalPath;const size=document.createElement('span');size.textContent=formatSize(file.bytes);const hash=document.createElement('span');hash.textContent=file.sha256.slice(0,12);row.append(link,size,hash);list.append(row);}}
  catch(error){summary.textContent=`Manifest source tidak dapat dimuat: ${error.message}`;}
}

$('#kataTotal').textContent=`${getTotalKataCount().toLocaleString('id-ID')}+`;
$('#nextPage').title=`Kategori: ${KATA_CATEGORIES.length}`;
store=getStore();
$('#storageBadge').textContent=window.PBLocalFiles?'FILE MANAGER INDEXEDDB':'INDEXEDDB PERANGKAT';
void refreshPrompts();
void loadSourceIndex();
setView('studio');
