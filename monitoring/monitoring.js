const $ = (id) => document.getElementById(id);
const siteBase = new URL('../', window.location.href);
const resultById = new Map();
let targets = [];
let intervalMs = 60_000;
let timeoutMs = 12_000;
let lastRunAt = 0;
let isRunning = false;

function localTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak valid';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(date);
}

function safeTargetUrl(path) {
  if (typeof path !== 'string' || !path || path.startsWith('/') || path.includes('\\')) {
    throw new Error('Path target tidak valid');
  }
  const segments = path.split('/');
  if (segments.some((segment) => segment === '..' || segment === '.')) {
    throw new Error('Path target keluar dari root situs');
  }
  const url = new URL(path, siteBase);
  if (url.origin !== window.location.origin || !url.pathname.startsWith(siteBase.pathname)) {
    throw new Error('Target harus berada pada origin dan root situs yang sama');
  }
  return url;
}

function setMonitorState(text, state) {
  const element = $('monitorState');
  element.textContent = text;
  element.dataset.state = state;
}

function makeCell(content) {
  const cell = document.createElement('td');
  cell.textContent = content;
  return cell;
}

function renderRows() {
  const body = $('routeRows');
  const query = $('routeFilter').value.trim().toLocaleLowerCase('id');
  const visible = targets.filter((target) => {
    const text = `${target.label} ${target.path} ${target.type}`.toLocaleLowerCase('id');
    return !query || text.includes(query);
  });
  body.replaceChildren();

  if (!visible.length) {
    const row = document.createElement('tr');
    const cell = makeCell('Tidak ada route yang cocok dengan filter.');
    cell.colSpan = 6;
    cell.className = 'empty';
    row.append(cell);
    body.append(row);
    return;
  }

  for (const target of visible) {
    const result = resultById.get(target.id) || {
      state: 'pending', label: 'MENUNGGU', http: '—', latency: '—', checkedAt: ''
    };
    const row = document.createElement('tr');
    const systemCell = document.createElement('td');
    const name = document.createElement('strong');
    name.textContent = target.label;
    const type = document.createElement('small');
    type.textContent = target.type;
    systemCell.append(name, type);

    const pathCell = document.createElement('td');
    const link = document.createElement('a');
    link.href = safeTargetUrl(target.path).href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const code = document.createElement('code');
    code.textContent = target.path;
    link.append(code);
    pathCell.append(link);

    const statusCell = document.createElement('td');
    const chip = document.createElement('span');
    chip.className = `status-chip ${result.state}`;
    chip.textContent = result.label;
    statusCell.append(chip);

    row.append(systemCell, pathCell, statusCell,
      makeCell(result.http), makeCell(result.latency), makeCell(result.checkedAt));
    body.append(row);
  }
}

function updateCounters() {
  const total = targets.length;
  const checked = [...resultById.values()];
  const ok = checked.filter((item) => item.state === 'ok').length;
  const issue = checked.filter((item) => item.state === 'error').length;
  $('totalCount').textContent = String(total);
  $('okCount').textContent = String(ok);
  $('issueCount').textContent = String(issue);
  $('lastChecked').textContent = lastRunAt ? localTime(lastRunAt) : '—';
  $('runSummary').textContent = isRunning
    ? `Memeriksa ${checked.length.toLocaleString('id-ID')} dari ${total.toLocaleString('id-ID')} target…`
    : (lastRunAt
      ? `${checked.length.toLocaleString('id-ID')} target diperiksa · ${ok.toLocaleString('id-ID')} terjangkau · ${issue.toLocaleString('id-ID')} bermasalah · hasil hanya disimpan di tab ini.`
      : 'Belum ada pemeriksaan.');
  $('refreshButton').disabled = isRunning;
  renderRows();
}

async function fetchWithTimeout(url, method, timeoutSignal) {
  return fetch(url, {
    method,
    cache: 'no-store',
    credentials: 'omit',
    mode: 'same-origin',
    redirect: 'manual',
    ...(method === 'GET' ? { headers: { Range: 'bytes=0-0' } } : {}),
    signal: timeoutSignal
  });
}

async function checkOne(target) {
  const startedAt = performance.now();
  const checkedAt = new Date().toISOString();
  let controller;
  let timer;
  try {
    const url = safeTargetUrl(target.path);
    controller = new AbortController();
    timer = window.setTimeout(() => controller.abort(), timeoutMs);
    let response = await fetchWithTimeout(url, 'HEAD', controller.signal);
    if (response.status === 405 || response.status === 501) {
      response = await fetchWithTimeout(url, 'GET', controller.signal);
      try { await response.body?.cancel(); } catch { /* Response body is intentionally not read. */ }
    }
    const latency = Math.max(0, Math.round(performance.now() - startedAt));
    const ok = response.status >= 200 && response.status < 300;
    return {
      id: target.id,
      state: ok ? 'ok' : 'error',
      label: ok ? 'TERJANGKAU' : 'HTTP ERROR',
      http: `HTTP ${response.status}`,
      latency: `${latency} ms`,
      checkedAt: localTime(checkedAt),
      statusCode: response.status
    };
  } catch (error) {
    const isTimeout = error?.name === 'AbortError';
    const latency = Math.max(0, Math.round(performance.now() - startedAt));
    return {
      id: target.id,
      state: 'error',
      label: isTimeout ? 'TIMEOUT' : 'GAGAL AKSES',
      http: isTimeout ? 'TIMEOUT' : '—',
      latency: `${latency} ms`,
      checkedAt: localTime(checkedAt),
      error: isTimeout ? 'Probe melampaui batas waktu.' : 'Fetch ditolak atau tidak dapat diselesaikan.'
    };
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

async function checkSnapshot() {
  const statusUrl = new URL('monitoring/snapshot-status.json', siteBase);
  try {
    const response = await fetch(statusUrl, {
      cache: 'no-store', credentials: 'omit', mode: 'same-origin'
    });
    if (!response.ok) throw new Error(`Status snapshot HTTP ${response.status}`);
    const status = await response.json();
    if (status.schemaVersion !== 1 || typeof status.sourceSnapshotUpdatedAt !== 'string') {
      throw new Error('Format status snapshot tidak valid');
    }
    const updatedAt = status.sourceSnapshotUpdatedAt;
    const updatedMillis = Date.parse(updatedAt);
    if (!Number.isFinite(updatedMillis)) throw new Error('Waktu snapshot tidak valid');

    $('snapshotUpdated').textContent = `${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(updatedMillis))} · ${formatAge(Date.now() - updatedMillis)}`;
    $('snapshotStatusGenerated').textContent = status.statusGeneratedAt
      ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(status.statusGeneratedAt))
      : 'Tidak tersedia';
    $('snapshotExposure').textContent = 'Tidak ditautkan';

    const age = Date.now() - updatedMillis;
    const fresh = Number.isFinite(age) && age >= 0 && age <= 36 * 60 * 60 * 1000;
    const state = $('snapshotState');
    state.textContent = fresh ? 'DALAM 36 JAM' : 'LEBIH DARI 36 JAM / TIDAK VALID';
    state.className = `badge ${fresh ? 'good' : 'bad'}`;
  } catch (error) {
    $('snapshotUpdated').textContent = 'Tidak dapat dibaca';
    $('snapshotStatusGenerated').textContent = '—';
    $('snapshotExposure').textContent = 'Status tidak tersedia';
    $('snapshotState').textContent = error.message || 'GAGAL';
    $('snapshotState').className = 'badge bad';
  }
}

function formatAge(milliseconds) {
  if (!Number.isFinite(milliseconds)) return 'umur tidak diketahui';
  if (milliseconds < 0) return 'waktu perangkat lebih awal';
  const minutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(minutes / 1_440);
  if (days) return `${days.toLocaleString('id-ID')} hari lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours) return `${hours} jam lalu`;
  return `${minutes} menit lalu`;
}

async function runChecks() {
  if (isRunning || !targets.length) return;
  isRunning = true;
  setMonitorState('Pemeriksaan berjalan…', 'running');
  updateCounters();
  const results = [];
  for (let index = 0; index < targets.length; index += 4) {
    const batch = targets.slice(index, index + 4);
    const batchResults = await Promise.all(batch.map(checkOne));
    results.push(...batchResults);
    for (const result of batchResults) resultById.set(result.id, result);
    updateCounters();
  }
  lastRunAt = Date.now();
  isRunning = false;
  const hasIssues = results.some((result) => result.state === 'error');
  setMonitorState(hasIssues ? 'Pemeriksaan selesai · ada masalah HTTP' : 'Pemeriksaan selesai · route terjangkau', hasIssues ? 'issue' : 'done');
  updateCounters();
  void checkSnapshot();
}

async function initialize() {
  $('routeFilter').addEventListener('input', renderRows);
  $('refreshButton').addEventListener('click', () => { void runChecks(); });
  try {
    const response = await fetch(new URL('monitoring/targets.json', siteBase), {
      cache: 'no-store', credentials: 'omit', mode: 'same-origin'
    });
    if (!response.ok) throw new Error(`Daftar target HTTP ${response.status}`);
    const config = await response.json();
    targets = (Array.isArray(config.targets) ? config.targets : []).filter((target) => {
      if (!target || typeof target.id !== 'string' || typeof target.label !== 'string' || typeof target.type !== 'string') return false;
      try { safeTargetUrl(target.path); return true; } catch { return false; }
    });
    intervalMs = Math.max(30, Math.min(600, Number(config.intervalSeconds) || 60)) * 1_000;
    timeoutMs = Math.max(3, Math.min(30, Number(config.timeoutSeconds) || 12)) * 1_000;
    if (!targets.length) throw new Error('Daftar target kosong atau tidak valid');
    updateCounters();
    await runChecks();
    window.setInterval(() => {
      if (document.visibilityState === 'visible') void runChecks();
    }, intervalMs);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRunAt >= intervalMs) void runChecks();
    });
  } catch (error) {
    targets = [];
    $('routeRows').innerHTML = '';
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'empty';
    cell.textContent = error.message || 'Daftar target gagal dimuat.';
    row.append(cell);
    $('routeRows').append(row);
    setMonitorState('Gagal memuat monitoring', 'issue');
    $('runSummary').textContent = 'Periksa akses monitoring/targets.json lalu muat ulang halaman.';
    updateCounters();
  }
}

void initialize();
