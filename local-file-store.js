(() => {
  'use strict';

  const DB_NAME = 'planetbintang-file-workspace';
  const DB_VERSION = 1;
  const FILES = 'files';
  const AUDIT = 'audit';
  let database;
  let opening;

  function normalizePath(input) {
    const value = String(input ?? '').replaceAll('\\', '/').trim();
    const parts = value.split('/').filter(Boolean);
    if (parts.some((part) => part === '.' || part === '..' || /[\u0000-\u001f\u007f]/.test(part))) {
      throw new Error('Path tidak valid: `.` dan `..` tidak diizinkan.');
    }
    if (parts.some((part) => part.length > 180) || parts.length > 32) throw new Error('Path terlalu panjang.');
    const path = parts.join('/');
    if (path.length > 1024) throw new Error('Path melebihi 1.024 karakter.');
    return path;
  }

  function openDatabase() {
    if (database) return Promise.resolve(database);
    if (opening) return opening;
    if (!('indexedDB' in window)) return Promise.reject(new Error('Browser ini tidak menyediakan IndexedDB.'));
    opening = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES, { keyPath: 'path' });
        if (!db.objectStoreNames.contains(AUDIT)) db.createObjectStore(AUDIT, { keyPath: 'id', autoIncrement: true });
      };
      request.onsuccess = () => { database = request.result; database.onversionchange = () => { database.close(); database = null; }; resolve(database); };
      request.onerror = () => { opening = null; reject(request.error || new Error('Database lokal tidak dapat dibuka.')); };
      request.onblocked = () => { opening = null; reject(new Error('Penyimpanan lokal sedang dibuka pada tab lain; tutup tab lama lalu coba lagi.')); };
    });
    return opening;
  }

  function requestValue(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Operasi penyimpanan gagal.'));
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error('Transaksi penyimpanan gagal.'));
    });
  }

  async function allFiles() {
    const db = await openDatabase();
    const tx = db.transaction(FILES, 'readonly');
    return requestValue(tx.objectStore(FILES).getAll());
  }

  async function getRecord(path) {
    const key = normalizePath(path);
    if (!key) return null;
    const db = await openDatabase();
    const tx = db.transaction(FILES, 'readonly');
    return (await requestValue(tx.objectStore(FILES).get(key))) || null;
  }

  async function addAudit(action, path = '', detail = {}) {
    try {
      const db = await openDatabase();
      const tx = db.transaction(AUDIT, 'readwrite');
      const store = tx.objectStore(AUDIT);
      const request = store.add({
        action: String(action).slice(0, 48),
        path: normalizePath(path),
        at: new Date().toISOString(),
        bytes: Math.max(0, Number(detail.bytes) || 0),
        note: String(detail.note || '').slice(0, 160),
      });
      request.onsuccess = () => {
        const id = Number(request.result);
        const all = store.getAll();
        all.onsuccess = () => {
          const rows = all.result || [];
          rows.sort((a, b) => a.id - b.id).slice(0, Math.max(0, rows.length - 500)).forEach((row) => store.delete(row.id));
        };
      };
      await transactionDone(tx);
      window.dispatchEvent(new CustomEvent('planetbintang:workspace-files-changed', { detail: { path: normalizePath(path) } }));
    } catch (error) {
      console.warn('File workspace audit could not be saved:', error);
    }
  }

  function parentPaths(path) {
    const pieces = path.split('/').filter(Boolean);
    const result = [];
    for (let index = 1; index < pieces.length; index += 1) result.push(pieces.slice(0, index).join('/'));
    return result;
  }

  function asBlob(value, mime) {
    if (value instanceof Blob) return value;
    return new Blob([String(value ?? '')], { type: mime || 'text/plain;charset=utf-8' });
  }

  async function putRecord(path, blob, mime = 'text/plain;charset=utf-8', type = 'file') {
    const key = normalizePath(path);
    if (!key) throw new Error('Nama file atau folder tidak boleh kosong.');
    const existing = await allFiles();
    const byPath = new Map(existing.map((item) => [item.path, item]));
    const current = byPath.get(key);
    if (current && current.type !== type) throw new Error('Nama tersebut sudah digunakan oleh jenis item lain.');
    for (const parent of parentPaths(key)) {
      if (byPath.get(parent)?.type === 'file') throw new Error(`Folder induk ${parent} adalah file.`);
    }
    const timestamp = new Date().toISOString();
    const db = await openDatabase();
    const tx = db.transaction(FILES, 'readwrite');
    const store = tx.objectStore(FILES);
    for (const parent of parentPaths(key)) {
      if (byPath.get(parent)?.type !== 'directory') store.put({ path: parent, type: 'directory', mime: '', blob: new Blob([]), size: 0, updatedAt: timestamp });
    }
    const value = type === 'file' ? blob : new Blob([]);
    store.put({ path: key, type, mime: type === 'file' ? (mime || value.type || 'application/octet-stream') : '', blob: value, size: type === 'file' ? value.size : 0, updatedAt: timestamp });
    await transactionDone(tx);
    await addAudit(type === 'directory' ? 'mkdir' : (current ? 'edit' : 'create'), key, { bytes: value.size });
    return { path: key, type, mime: type === 'file' ? (mime || value.type || 'application/octet-stream') : '', size: type === 'file' ? value.size : 0, updatedAt: timestamp };
  }

  async function saveFile(path, content, mime = 'text/plain;charset=utf-8') {
    return putRecord(path, asBlob(content, mime), mime, 'file');
  }

  async function makeDirectory(path) {
    return putRecord(path, new Blob([]), '', 'directory');
  }

  async function isDirectory(path) {
    const key = normalizePath(path);
    if (!key) return true;
    const rows = await allFiles();
    return rows.some((row) => row.type === 'directory' && row.path === key) || rows.some((row) => row.path.startsWith(`${key}/`));
  }

  async function list(path = '') {
    const base = normalizePath(path);
    const rows = await allFiles();
    const prefix = base ? `${base}/` : '';
    const children = new Map();
    for (const row of rows) {
      if (!row.path.startsWith(prefix) || row.path === base) continue;
      const suffix = row.path.slice(prefix.length);
      if (!suffix) continue;
      const part = suffix.split('/')[0];
      const childPath = prefix + part;
      const direct = !suffix.includes('/');
      const current = children.get(childPath);
      if (!direct || row.type === 'directory') {
        if (!current || current.type !== 'file') children.set(childPath, { path: childPath, type: 'directory', size: 0, sizeKnown: true, source: 'local', updatedAt: row.updatedAt || '' });
      } else {
        children.set(childPath, { path: childPath, type: 'file', size: Number(row.size) || 0, sizeKnown: true, source: 'local', mime: row.mime || '', updatedAt: row.updatedAt || '' });
      }
    }
    return [...children.values()].sort((a, b) => Number(b.type === 'directory') - Number(a.type === 'directory') || a.path.localeCompare(b.path, 'id', { sensitivity: 'base' }));
  }

  async function readFile(path) {
    const record = await getRecord(path);
    if (!record || record.type !== 'file') throw new Error('File lokal tidak ditemukan.');
    return { ...record, text: await record.blob.text() };
  }

  async function downloadFile(path) {
    const record = await getRecord(path);
    if (!record || record.type !== 'file') throw new Error('File lokal tidak ditemukan.');
    return record;
  }

  async function remove(path) {
    const key = normalizePath(path);
    if (!key) throw new Error('Folder root tidak dapat dihapus.');
    const rows = await allFiles();
    const targets = rows.filter((row) => row.path === key || row.path.startsWith(`${key}/`));
    if (!targets.length) throw new Error('Item tidak ditemukan.');
    const db = await openDatabase();
    const tx = db.transaction(FILES, 'readwrite');
    const store = tx.objectStore(FILES);
    targets.forEach((row) => store.delete(row.path));
    await transactionDone(tx);
    await addAudit('delete', key, { bytes: targets.reduce((sum, row) => sum + (Number(row.size) || 0), 0), note: `${targets.length} item` });
    return targets.length;
  }

  async function move(source, destination) {
    const from = normalizePath(source);
    const to = normalizePath(destination);
    if (!from || !to) throw new Error('Path asal dan tujuan wajib diisi.');
    if (to === from) return getRecord(from);
    if (to.startsWith(`${from}/`)) throw new Error('Folder tidak dapat dipindahkan ke dalam dirinya sendiri.');
    const rows = await allFiles();
    const selected = rows.filter((row) => row.path === from || row.path.startsWith(`${from}/`));
    if (!selected.length) throw new Error('Item asal tidak ditemukan.');
    const moving = new Set(selected.map((row) => row.path));
    const targets = selected.map((row) => ({ ...row, path: to + row.path.slice(from.length) }));
    const existing = new Map(rows.filter((row) => !moving.has(row.path)).map((row) => [row.path, row]));
    for (const row of targets) if (existing.has(row.path)) throw new Error(`Tujuan sudah ada: ${row.path}`);
    for (const target of targets) {
      for (const parent of parentPaths(target.path)) if (existing.get(parent)?.type === 'file') throw new Error(`Folder induk ${parent} adalah file.`);
    }
    const db = await openDatabase();
    const tx = db.transaction(FILES, 'readwrite');
    const store = tx.objectStore(FILES);
    for (const row of selected) store.delete(row.path);
    const timestamp = new Date().toISOString();
    for (const target of targets) store.put({ ...target, updatedAt: timestamp });
    for (const target of targets) {
      for (const parent of parentPaths(target.path)) if (!existing.has(parent)) store.put({ path: parent, type: 'directory', mime: '', blob: new Blob([]), size: 0, updatedAt: timestamp });
    }
    await transactionDone(tx);
    await addAudit('move', to, { note: `dari ${from}` });
    return targets[0];
  }

  async function stats() {
    const rows = await allFiles();
    let quota = null;
    try { quota = await navigator.storage?.estimate?.(); } catch { quota = null; }
    return {
      files: rows.filter((row) => row.type === 'file').length,
      folders: rows.filter((row) => row.type === 'directory').length,
      bytes: rows.reduce((sum, row) => sum + (Number(row.size) || 0), 0),
      usedBytes: Number(quota?.usage) || null,
      quotaBytes: Number(quota?.quota) || null,
      persistent: navigator.storage?.persisted ? await navigator.storage.persisted().catch(() => false) : false,
    };
  }

  async function audit(limit = 120) {
    const db = await openDatabase();
    const tx = db.transaction(AUDIT, 'readonly');
    const rows = await requestValue(tx.objectStore(AUDIT).getAll());
    return rows.sort((a, b) => b.id - a.id).slice(0, Math.max(1, Math.min(500, Number(limit) || 120)));
  }

  async function clear() {
    const db = await openDatabase();
    const tx = db.transaction(FILES, 'readwrite');
    tx.objectStore(FILES).clear();
    await transactionDone(tx);
    await addAudit('clear', '', { note: 'workspace dibersihkan' });
  }

  function base64FromBytes(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
    return btoa(binary);
  }

  async function exportBackup() {
    const rows = await allFiles();
    const entries = [];
    for (const row of rows) {
      entries.push(row.type === 'directory'
        ? { path: row.path, type: 'directory', updatedAt: row.updatedAt }
        : { path: row.path, type: 'file', mime: row.mime || 'application/octet-stream', size: Number(row.size) || 0, updatedAt: row.updatedAt, contentBase64: base64FromBytes(new Uint8Array(await row.blob.arrayBuffer())) });
    }
    await addAudit('backup-export', '', { note: `${entries.length} item` });
    return { format: 'planetbintang-file-workspace', version: 1, exportedAt: new Date().toISOString(), entries };
  }

  async function importBackup(payload) {
    if (!payload || payload.format !== 'planetbintang-file-workspace' || payload.version !== 1 || !Array.isArray(payload.entries)) throw new Error('Berkas bukan backup File Manager Planetbintang yang didukung.');
    const current = new Map((await allFiles()).map((row) => [row.path, row]));
    const prepared = [];
    for (const item of payload.entries) {
      const path = normalizePath(item.path);
      if (!path || !['file', 'directory'].includes(item.type)) throw new Error('Backup memiliki path atau jenis item tidak valid.');
      if (item.type === 'directory') prepared.push({ path, type: 'directory', mime: '', blob: new Blob([]), size: 0, updatedAt: item.updatedAt || new Date().toISOString() });
      else {
        if (typeof item.contentBase64 !== 'string') throw new Error(`Konten backup untuk ${path} tidak tersedia.`);
        let binary;
        try { binary = atob(item.contentBase64); } catch { throw new Error(`Konten base64 tidak valid untuk ${path}.`); }
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        const mime = String(item.mime || 'application/octet-stream').slice(0, 160);
        prepared.push({ path, type: 'file', mime, blob: new Blob([bytes], { type: mime }), size: bytes.length, updatedAt: item.updatedAt || new Date().toISOString() });
      }
    }
    const merged = new Map(current);
    prepared.forEach((row) => merged.set(row.path, row));
    const normalized = [...merged.values()];
    const byPath = new Map(normalized.map((row) => [row.path, row]));
    for (const row of normalized) {
      if (row.type === 'file' && normalized.some((other) => other.path.startsWith(`${row.path}/`))) throw new Error(`Path backup bertabrakan: ${row.path} file juga menjadi folder.`);
      for (const parent of parentPaths(row.path)) if (byPath.get(parent)?.type === 'file') throw new Error(`Folder induk ${parent} pada backup adalah file.`);
    }
    const db = await openDatabase();
    const tx = db.transaction(FILES, 'readwrite');
    const store = tx.objectStore(FILES);
    for (const row of prepared) {
      for (const parent of parentPaths(row.path)) if (!byPath.has(parent)) store.put({ path: parent, type: 'directory', mime: '', blob: new Blob([]), size: 0, updatedAt: new Date().toISOString() });
      store.put(row);
    }
    await transactionDone(tx);
    await addAudit('backup-import', '', { note: `${prepared.length} item diimpor` });
    return prepared.length;
  }

  window.PBLocalFiles = {
    normalizePath,
    list,
    get: getRecord,
    readFile,
    downloadFile,
    saveFile,
    mkdir: makeDirectory,
    isDirectory,
    remove,
    move,
    stats,
    audit,
    recordActivity: addAudit,
    clear,
    exportBackup,
    importBackup,
    ready: openDatabase,
  };
})();
