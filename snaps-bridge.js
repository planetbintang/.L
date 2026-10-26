/*
 * PLANETBINTANG · SNAPS BRIDGE v1  (2026.10.26)
 * SNAP = System Nexus for Automated Programming & Storage.
 *
 * Logo + nama PLANETBINTANG + ikon folder adalah anchor permanen sistem input/output:
 * setiap operasi IO, koneksi MCP/git, token kustom, dan impor RAG dicatat di bawah
 * identitas brand ini (window.PBSnaps). Registry konektor: ./mcp-registry.json
 *
 * Mode aman statis (GitHub Pages): token disimpan HANYA di localStorage perangkat
 * pengguna, tidak pernah dikirim ke pihak ketiga selain endpoint resmi provider,
 * dan tidak pernah di-commit. Mode terhubung penuh: jalankan server.py lokal yang
 * menyediakan endpoint /snaps/* dengan token dari environment variable.
 */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const STORE = {
    tokens: 'planetbintang.snaps.tokens.v1',
    connections: 'planetbintang.snaps.connections.v1',
    rag: 'planetbintang.snaps.rag-corpus.v1',
    activity: 'planetbintang.snaps.activity.v1',
    registryCache: 'planetbintang.snaps.registry.v1',
  };
  const BRAND = {
    wordmark: 'PLANETBINTANG',
    logo: './brand-logo-browser.png',
    folderIcon: './file-manager-icon.png',
    tagline: 'SNAPS · MCP HUB · PUSAT KODE & DATA AI',
  };

  const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nowIso = () => new Date().toISOString();
  const fmtTime = (v) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v));

  function log(action, detail, status = 'ok') {
    const entry = { id: uid('snap'), at: nowIso(), action, detail: String(detail).slice(0, 400), status };
    write(STORE.activity, [entry, ...read(STORE.activity, [])].slice(0, 200));
    document.dispatchEvent(new CustomEvent('planetbintang:snaps-activity', { detail: entry }));
  }

  /* ---------- Token kustom (per konektor) ---------- */
  function getTokens() { return read(STORE.tokens, {}); }
  function setToken(connectorId, token) {
    const tokens = getTokens();
    if (token) tokens[connectorId] = { value: token, savedAt: nowIso() };
    else delete tokens[connectorId];
    write(STORE.tokens, tokens);
    log(token ? 'token-save' : 'token-clear', connectorId);
  }
  function tokenFor(connectorId) { return getTokens()[connectorId]?.value || ''; }
  // Redaksi token untuk tampilan/log: tampilkan 4 karakter pertama saja.
  function maskToken(token) { return token ? `${token.slice(0, 4)}${'•'.repeat(Math.max(4, Math.min(16, token.length - 4)))}` : '(kosong)'; }

  /* ---------- Registry ---------- */
  let registry = null;
  async function loadRegistry() {
    if (registry) return registry;
    try {
      const response = await fetch('./mcp-registry.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      registry = await response.json();
      write(STORE.registryCache, registry);
    } catch (error) {
      registry = read(STORE.registryCache, null);
      if (!registry) throw error;
    }
    return registry;
  }
  function connector(id) { return (registry?.connectors || []).find((item) => item.id === id) || null; }

  /* ---------- Probe / test koneksi ---------- */
  const probes = {};
  function probeState(id) { return probes[id] || { status: 'idle', detail: 'Belum diuji', at: null }; }

  async function markProbe(id, status, detail) {
    probes[id] = { status, detail: String(detail).slice(0, 300), at: nowIso() };
    const connections = read(STORE.connections, {});
    connections[id] = { lastStatus: status, lastDetail: probes[id].detail, lastAt: probes[id].at };
    write(STORE.connections, connections);
    log(`probe-${status}`, `${id} · ${probes[id].detail}`);
    renderStatusChips();
  }

  async function probeConnector(id) {
    const item = connector(id);
    if (!item) return;
    await markProbe(id, 'testing', 'Menghubungkan…');
    try {
      if (id === 'git-github') return await probeGithub(item);
      if (id === 'git-gitlab') return await probeGitlab(item);
      if (id === 'git-bitbucket') return await probeBitbucket(item);
      if (id === 'ai-google-aistudio') return await probeAiStudio(item);
      if (id === 'rag-archive-org') return await probeArchive(item);
      if (id === 'rag-perpusnas') return await probePerpusnas(item);
      if (id === 'rag-libraryofcongress') return await probeLoc(item);
      throw new Error('Probe belum tersedia untuk konektor ini.');
    } catch (error) {
      await markProbe(id, 'error', error.message || String(error));
    }
  }

  async function probeGithub(item) {
    const token = tokenFor('git-github');
    const headers = { Accept: 'application/vnd.github+json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(token ? 'https://api.github.com/user' : 'https://api.github.com/zen', { headers });
    if (!response.ok) throw new Error(`GitHub menolak koneksi (HTTP ${response.status}). Periksa token scoped read-only.`);
    const payload = await response.json().catch(() => null);
    const who = token && payload?.login ? payload.login : null;
    const detail = who ? `Terautentikasi sebagai ${who}. MCP endpoint: ${item.endpoint}` : 'Mode publik tanpa token (read-only snapshot). Tambahkan token kustom untuk cakupan repo privat.';
    await markProbe('git-github', 'connected', detail);
  }

  async function probeGitlab(item) {
    const token = tokenFor('git-gitlab');
    const url = token ? 'https://gitlab.com/api/v4/user' : 'https://gitlab.com/api/v4/projects?per_page=1';
    const headers = token ? { 'PRIVATE-TOKEN': token } : {};
    const response = await fetch(url, { headers }).catch(() => { throw new Error('Jaringan/CORS GitLab diblokir browser — gunakan jembatan server-side.'); });
    if (!response.ok) throw new Error(`GitLab HTTP ${response.status}.`);
    await markProbe('git-gitlab', 'connected', token ? 'Terautentikasi dengan token PRIVATE-TOKEN.' : 'Mode publik; tambahkan token kustom untuk project privat.');
  }

  async function probeBitbucket(item) {
    const token = tokenFor('git-bitbucket');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch('https://api.bitbucket.org/2.0/user', { headers }).catch(() => { throw new Error('Jaringan/CORS Bitbucket diblokir browser.'); });
    if (response.status === 401) throw new Error('Token Bitbucket ditolak (401).');
    if (!response.ok && !token) throw new Error(`Bitbucket HTTP ${response.status}.`);
    await markProbe('git-bitbucket', 'connected', token ? 'Terautentikasi token kustom.' : 'Mode publik tanpa token.');
  }

  async function probeAiStudio(item) {
    const key = tokenFor('ai-google-aistudio');
    if (!key) throw new Error('Google AI Studio membutuhkan API key kustom. Buat di https://aistudio.google.com/apikey lalu tempel pada kolom token konektor ini.');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body?.error?.message || `AI Studio menolak key (HTTP ${response.status}).`);
    }
    const models = (await response.json()).models || [];
    await markProbe('ai-google-aistudio', 'connected', `API key valid. ${models.length} model tersedia (default: ${item.defaultModel}). Siap menginput kode otomatis ke /workspace.`);
  }

  async function generateWithAiStudio(prompt, contextChunks = []) {
    const item = connector('ai-google-aistudio');
    const key = tokenFor('ai-google-aistudio');
    if (!key) throw new Error('Simpan API key Google AI Studio terlebih dahulu.');
    const grounded = [
      `[SNAPS/${BRAND.wordmark}] Peran: insinyur perangkat lunak. Hasilkan kode aplikasi lengkap sesuai permintaan.`,
      contextChunks.length ? `Konteks RAG (sumber pustaka/arsip):\n${contextChunks.slice(0, 6).map((chunk, i) => `#${i + 1} ${chunk}`).join('\n')}` : '',
      `Permintaan:\n${prompt}`,
    ].filter(Boolean).join('\n\n');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${item.defaultModel}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: grounded }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 8192 } }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body?.error?.message || `generateContent gagal (HTTP ${response.status}).`);
    }
    const data = await response.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    if (!text.trim()) throw new Error('Model mengembalikan respons kosong.');
    log('aistudio-generate', `${prompt.slice(0, 80)}… · ${text.length} karakter`);
    return text;
  }

  async function probeArchive(item) {
    const response = await fetch('https://archive.org/metadata/torahbiblicalte00grin');
    if (!response.ok) throw new Error(`Internet Archive HTTP ${response.status}.`);
    const meta = await response.json();
    await markProbe('rag-archive-org', 'connected', `Metadata item contoh dimuat (${meta?.metadata?.title ? `"${String(meta.metadata.title).slice(0, 60)}"` : 'OK'}). Sumber RAG siap dipakai dari browser.`);
  }

  async function probePerpusnas(item) {
    try {
      const response = await fetch('https://catalog.perpusnas.go.id/', { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await markProbe('rag-perpusnas', 'connected', 'Katalog Perpusnas terjangkau langsung dari browser.');
    } catch (error) {
      // Kemungkinan besar CORS/403 — arahkan ke jembatan server-side.
      const bridge = await checkLocalBridge();
      if (bridge) await markProbe('rag-perpusnas', 'degraded', `Browser diblokir CORS (${error.message}). Jalankan python3 server.py — jembatan lokal /snaps/rag/perpusnas aktif.`);
      else await markProbe('rag-perpusnas', 'degraded', 'Browser diblokir CORS/403 oleh perpusnas.go.id. Untuk impor korpus, jalankan jembatan lokal: python3 server.py (endpoint /snaps/rag/perpusnas), atau impor manual via menu RAG.');
    }
  }

  async function probeLoc(item) {
    const response = await fetch('https://www.loc.gov/search/?q=indonesia&fo=json&c=1').catch(() => { throw new Error('Jaringan/CORS loc.gov diblokir browser.'); });
    if (!response.ok) throw new Error(`LoC HTTP ${response.status}.`);
    await markProbe('rag-libraryofcongress', 'connected', 'Search API Library of Congress merespons JSON.');
  }

  async function checkLocalBridge() {
    try {
      const response = await fetch('http://127.0.0.1:4173/snaps/status', { mode: 'cors' });
      return response.ok;
    } catch { return false; }
  }

  /* ---------- RAG corpus (pusat data AI) ---------- */
  function ragItems() { return read(STORE.rag, []); }
  function addRagItem(source, title, excerpt, url) {
    const item = { id: uid('rag'), source, title: String(title).slice(0, 200), excerpt: String(excerpt).slice(0, 4000), url: url || '', addedAt: nowIso() };
    write(STORE.rag, [item, ...ragItems()].slice(0, 300));
    log('rag-import', `${source} · ${item.title}`);
    return item;
  }
  function removeRagItem(id) { write(STORE.rag, ragItems().filter((item) => item.id !== id)); log('rag-remove', id); }

  async function searchRagSource(sourceId, query) {
    const q = encodeURIComponent(query);
    if (sourceId === 'rag-archive-org') {
      const response = await fetch(`https://archive.org/advancedsearch.php?q=${q}&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&rows=12&page=1&output=json`);
      if (!response.ok) throw new Error(`Internet Archive HTTP ${response.status}`);
      const docs = (await response.json()).response?.docs || [];
      return docs.map((doc) => ({ title: Array.isArray(doc.title) ? doc.title.join(', ') : (doc.title || doc.identifier), excerpt: `Identifier: ${doc.identifier}${doc.year ? ` · Tahun: ${doc.year}` : ''}`, url: `https://archive.org/details/${doc.identifier}` }));
    }
    if (sourceId === 'rag-libraryofcongress') {
      const response = await fetch(`https://www.loc.gov/search/?q=${q}&fo=json&c=8`).catch(() => { throw new Error('CORS/jaringan loc.gov diblokir browser.'); });
      if (!response.ok) throw new Error(`LoC HTTP ${response.status}`);
      const results = (await response.json()).results || [];
      return results.map((r) => ({ title: r.title || r.label || 'Tanpa judul', excerpt: (r.exhibits?.[0] || r.description || r.label || 'Sumber otoritas LoC').toString().slice(0, 300), url: r.url || '' }));
    }
    if (sourceId === 'rag-perpusnas') {
      const bridge = await fetch(`http://127.0.0.1:4173/snaps/rag/perpusnas?q=${q}`).catch(() => null);
      if (bridge && bridge.ok) {
        const payload = await bridge.json();
        return (payload.results || []).map((r) => ({ title: r.title || 'Tanpa judul', excerpt: r.author ? `Pengarang: ${r.author}` : 'Katalog Perpusnas', url: r.url || '' }));
      }
      throw new Error('Katalog Perpusnas memblokir permintaan lintas-origin dari browser. Jalankan jembatan lokal (python3 server.py) lalu ulangi pencarian, atau gunakan sumber arsip lain.');
    }
    throw new Error('Sumber RAG tidak dikenal.');
  }

  /* ---------- Input otomatis kode ke File Manager (/workspace) ---------- */
  async function writeToWorkspace(name, content) {
    const cleanName = String(name).replaceAll('\\', '/').split('/').pop().replace(/[^a-zA-Z0-9._ -]/g, '-').slice(0, 120) || 'generated-app.txt';
    const body = String(content);
    // Use the same IndexedDB-backed store that the .L File Manager reads.
    // localStorage remains a compatibility fallback only for older builds.
    if (window.PBLocalFiles?.saveFile) {
      const path = `workspace/snaps/${cleanName}`;
      await window.PBLocalFiles.saveFile(path, body, 'text/plain;charset=utf-8');
      document.dispatchEvent(new CustomEvent('planetbintang:workspace-files-changed', { detail: { path } }));
      log('code-input-file-manager', `/${path} · ${body.length} karakter`);
      return { name: cleanName, path, content: body, updatedAt: nowIso(), storage: 'indexeddb-file-manager' };
    }
    const KEY = 'planetbintang.file-manager.workspace.v1';
    const filesList = read(KEY, []).filter((f) => f && f.name);
    const existing = filesList.find((f) => f.name === cleanName);
    const record = { id: existing?.id || `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, name: cleanName, content: body, createdAt: existing?.createdAt || nowIso(), updatedAt: nowIso() };
    const next = existing ? filesList.map((f) => (f.id === existing.id ? record : f)) : [record, ...filesList];
    if (!write(KEY, next)) throw new Error('Penyimpanan browser penuh; hapus sebagian file workspace lalu coba lagi.');
    document.dispatchEvent(new CustomEvent('planetbintang:workspace-files-changed'));
    log('code-input-workspace-fallback', `/workspace/${cleanName} · ${body.length} karakter`);
    return record;
  }

  /* ---------- UI: halaman #snaps ---------- */
  function pageShell() {
    return `
    <div class="snaps-view">
      <header class="snaps-heading">
        <div class="snaps-brand-anchor">
          <span class="snaps-logo"><img src="${BRAND.logo}" alt="Logo Planetbintang" /></span>
          <span class="snaps-folder"><img src="${BRAND.folderIcon}" alt="Ikon folder sistem" /></span>
          <div><p class="eyebrow">SNAPS <span>/</span> PERMANENT I/O NEXUS</p><h2>${BRAND.wordmark} — Pusat Kode & Pembuat Aplikasi Terintegrasi</h2>
          <p class="section-description">Logo + Nama PLANETBINTANG + Ikon Folder adalah snap permanen sistem input/output. Hubungkan MCP/git sumber kode dengan URL &amp; token kustom, sambungkan Google AI Studio untuk input kode otomatis, dan jadikan perpustakaan/arsip (Perpusnas, Internet Archive) sebagai pusat data RAG.</p></div>
        </div>
        <span class="tools-badge" id="snapsBridgeBadge">MEMERIKSA JEMBATAN LOKAL…</span>
      </header>
      <div class="tools-grid" id="snapsConnectors"></div>
      <section class="tools-card" id="snapsCodegen">
        <div class="tools-card-head"><div><h3>Penginput Otomatis Kode Aplikasi · Google AI Studio</h3><p>Buat kode dari prompt (opsional diperkaya konteks RAG), lalu kirim langsung ke File Manager <code>/workspace</code>.</p></div><span class="local-badge">TOKEN KUSTOM · X-GOOG-API-KEY</span></div>
        <form id="snapsCodegenForm" class="tools-form-inline">
          <label>Prompt aplikasi<textarea id="snapsCodePrompt" rows="4" required placeholder="Contoh: buat aplikasi React to-do list dengan penyimpanan localStorage dan tampilan gelap."></textarea></label>
          <label>Nama file output<input id="snapsCodeFile" maxlength="100" placeholder="app-generated.jsx" /></label>
          <label class="tools-switch"><input id="snapsUseRag" type="checkbox" />Sertakan konteks korpus RAG (snaps)</label>
          <button class="workspace-primary" type="submit">Generate → input ke /workspace</button>
          <span id="snapsCodeStatus" aria-live="polite" class="tools-note"></span>
        </form>
        <pre id="snapsCodePreview" class="feature-preview" hidden></pre>
      </section>
      <section class="tools-card" id="snapsRag">
        <div class="tools-card-head"><div><h3>Pusat Data AI · RAG Perpustakaan & Arsip</h3><p>Impor metadata/teks dari katalog Perpusnas, Internet Archive, dan Library of Congress sebagai korpus konteks generator kode.</p></div><span class="local-badge" id="snapsRagCount">0 ITEM</span></div>
        <form id="snapsRagForm" class="tools-form-inline">
          <label>Sumber<select id="snapsRagSource">
            <option value="rag-archive-org">Internet Archive (langsung dari browser)</option>
            <option value="rag-perpusnas">Perpustakaan Nasional RI (via jembatan lokal)</option>
            <option value="rag-libraryofcongress">Library of Congress</option>
          </select></label>
          <label>Kata kunci<input id="snapsRagQuery" required maxlength="160" placeholder="mis. pemrograman sistem operasi" /></label>
          <button class="workspace-secondary" type="submit">Cari &amp; impor</button>
          <span id="snapsRagStatus" aria-live="polite" class="tools-note"></span>
        </form>
        <div id="snapsRagResults" class="tools-log-list"></div>
        <div id="snapsRagCorpus" class="tools-file-list"></div>
      </section>
      <section class="tools-card"><div class="tools-card-head"><div><h3>Aktivitas SNAPS</h3><p>Jejak operasi IO, probe, token (termask), dan impor RAG di bawah anchor brand.</p></div></div><div id="snapsActivity" class="tools-log-list"></div></section>
    </div>`;
  }

  function connectorCard(item) {
    const state = probeState(item.id);
    const hasToken = Boolean(tokenFor(item.id));
    const authLabel = item.authType === 'custom-token' ? 'TOKEN KUSTOM' : item.authType === 'none-public' ? 'PUBLIK TANPA TOKEN' : item.authType;
    return `
    <article class="tools-card snaps-connector" data-snaps-id="${esc(item.id)}">
      <div class="snaps-connector-head"><span class="snaps-mini-icon"><img src="${BRAND.folderIcon}" alt="" /><img class="snaps-mini-logo" src="${BRAND.logo}" alt="" /></span>
        <div><b>${esc(item.title)}</b><small>${esc(item.kind)} · ${authLabel}</small></div>
        <em class="snaps-chip chip-${state.status}">${state.status.toUpperCase()}</em></div>
      <p class="snaps-endpoint" title="${esc(item.endpoint || '')}">${esc(item.endpoint || '—')}</p>
      <p class="snaps-role">${esc(item.snapRole || '')}</p>
      ${item.authType === 'custom-token' ? `<label class="snaps-token-field">Token kustom ${esc(item.headerName || 'API key')}<input type="password" data-snaps-token="${esc(item.id)}" placeholder="${hasToken ? `Tersimpan: ${maskToken(tokenFor(item.id))}` : 'tempel token / API key'}" autocomplete="off" /></label>` : ''}
      <div class="snaps-actions">
        ${item.authType === 'custom-token' ? `<button class="workspace-secondary" data-snaps-save-token="${esc(item.id)}">Simpan token</button><button class="workspace-secondary danger" data-snaps-clear-token="${esc(item.id)}">Hapus</button>` : ''}
        <button class="workspace-primary" data-snaps-test="${esc(item.id)}">Test koneksi</button>
      </div>
      <small class="snaps-probe-detail">${esc(state.detail)}${state.at ? ` · ${fmtTime(state.at)}` : ''}</small>
    </article>`;
  }

  function renderConnectors() {
    const host = $('#snapsConnectors');
    if (!host || !registry) return;
    host.innerHTML = registry.connectors.map(connectorCard).join('');
    host.querySelectorAll('[data-snaps-test]').forEach((button) => button.addEventListener('click', () => probeConnector(button.dataset.snapsTest)));
    host.querySelectorAll('[data-snaps-save-token]').forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.snapsSaveToken;
      const input = host.querySelector(`[data-snaps-token="${id}"]`);
      const value = (input?.value || '').trim();
      if (!value) return;
      setToken(id, value);
      renderConnectors();
    }));
    host.querySelectorAll('[data-snaps-clear-token]').forEach((button) => button.addEventListener('click', () => { setToken(button.dataset.snapsClearToken, ''); renderConnectors(); }));
  }

  function renderStatusChips() {
    document.querySelectorAll('.snaps-connector').forEach((card) => {
      const id = card.dataset.snapsId;
      const chip = card.querySelector('.snaps-chip');
      const detail = card.querySelector('.snaps-probe-detail');
      const state = probeState(id);
      if (chip) { chip.textContent = state.status.toUpperCase(); chip.className = `snaps-chip chip-${state.status}`; }
      if (detail) detail.textContent = `${state.detail}${state.at ? ` · ${fmtTime(state.at)}` : ''}`;
    });
  }

  function renderRagCorpus() {
    const host = $('#snapsRagCorpus');
    const count = $('#snapsRagCount');
    if (!host) return;
    const items = ragItems();
    if (count) count.textContent = `${items.length} ITEM`;
    if (!items.length) { host.innerHTML = '<div class="tools-empty">Korpus RAG masih kosong. Cari sumber pustaka/arsip di atas lalu impor.</div>'; return; }
    host.innerHTML = items.map((item) => `<article class="tools-file-row"><div><b>${esc(item.title)}</b><small>${esc(item.source)} · ${esc(item.excerpt.slice(0, 160))}${item.url ? ` · <a href="${esc(item.url)}" target="_blank" rel="noopener">sumber ↗</a>` : ''} · ${fmtTime(item.addedAt)}</small></div><div class="tools-row-actions"><button class="workspace-secondary danger" data-rag-remove="${esc(item.id)}">Hapus</button></div></article>`).join('');
    host.querySelectorAll('[data-rag-remove]').forEach((button) => button.addEventListener('click', () => { removeRagItem(button.dataset.ragRemove); renderRagCorpus(); }));
  }

  function renderActivity() {
    const host = $('#snapsActivity');
    if (!host) return;
    const list = read(STORE.activity, []);
    host.innerHTML = list.length ? list.slice(0, 30).map((entry) => `<div><b>${esc(entry.action)}</b><span>${esc(entry.detail)}</span><time>${fmtTime(entry.at)}</time></div>`).join('') : '<div class="tools-empty">Belum ada aktivitas SNAPS.</div>';
  }

  async function autoProbeOnOpen() {
    // Test koneksi default saat halaman dibuka: GitHub publik, AI Studio (jika ada key), Internet Archive.
    probeConnector('git-github');
    probeConnector('rag-archive-org');
    if (tokenFor('ai-google-aistudio')) probeConnector('ai-google-aistudio');
    probeConnector('rag-perpusnas');
  }

  async function render(route) {
    const host = $('#snapsContent');
    if (!host) return;
    try { await loadRegistry(); } catch { host.innerHTML = '<div class="tools-empty">Registry mcp-registry.json tidak ditemukan.</div>'; return; }
    host.innerHTML = pageShell();
    renderConnectors();
    renderRagCorpus();
    renderActivity();

    const badge = $('#snapsBridgeBadge');
    checkLocalBridge().then((up) => { if (badge) { badge.textContent = up ? 'JEMBATAN LOKAL AKTIF · server.py' : 'MODE STATIS · BROWSER (token lokal)'; badge.classList.toggle('is-active', up); } });

    $('#snapsCodegenForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = $('#snapsCodeStatus');
      const preview = $('#snapsCodePreview');
      const prompt = $('#snapsCodePrompt').value.trim();
      if (!prompt) return;
      status.textContent = 'Menghubungi Google AI Studio (gemini)…';
      try {
        const contexts = $('#snapsUseRag').checked ? ragItems().slice(0, 6).map((item) => `${item.title}: ${item.excerpt.slice(0, 400)}`) : [];
        const code = await generateWithAiStudio(prompt, contexts);
        const fileName = $('#snapsCodeFile').value.trim() || `snaps-app-${new Date().toISOString().slice(0, 10)}.txt`;
        const stored = await writeToWorkspace(fileName, code);
        preview.hidden = false;
        preview.textContent = code.slice(0, 6000);
        status.textContent = `Selesai. Kode (${code.length} karakter) disimpan ke ${stored.path ? `File Manager /${stored.path}` : `workspace lokal /${fileName}`}.`;
        renderRagCorpus();
      } catch (error) {
        status.textContent = `Gagal: ${error.message}`;
      }
    });

    $('#snapsRagForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const sourceId = $('#snapsRagSource').value;
      const query = $('#snapsRagQuery').value.trim();
      const status = $('#snapsRagStatus');
      const resultsHost = $('#snapsRagResults');
      if (!query) return;
      status.textContent = 'Mencari di sumber…';
      resultsHost.innerHTML = '';
      try {
        const results = await searchRagSource(sourceId, query);
        status.textContent = `${results.length} hasil. Klik "Impor" untuk memasukkan ke korpus RAG.`;
        const item = connector(sourceId);
        resultsHost.innerHTML = results.map((r, index) => `<div class="snaps-rag-result"><div><b>${esc(r.title)}</b><span>${esc(r.excerpt)}</span></div><button class="workspace-secondary" data-rag-import='${esc(JSON.stringify({ source: item?.title || sourceId, title: r.title, excerpt: r.excerpt, url: r.url }))}'>Impor</button></div>`).join('');
        resultsHost.querySelectorAll('[data-rag-import]').forEach((button) => button.addEventListener('click', () => {
          const payload = JSON.parse(button.dataset.ragImport);
          addRagItem(payload.source, payload.title, payload.excerpt, payload.url);
          button.disabled = true; button.textContent = 'Terkirim ✓';
          renderRagCorpus();
        }));
      } catch (error) {
        status.textContent = `Gagal: ${error.message}`;
      }
    });

    autoProbeOnOpen();
  }

  /* ---------- Publik API ---------- */
  window.PBSnaps = {
    BRAND,
    loadRegistry,
    connectors: () => registry?.connectors || [],
    tokenFor, setToken, maskToken,
    probeConnector, probeState,
    generateWithAiStudio, writeToWorkspace,
    ragItems, addRagItem, searchRagSource,
    checkLocalBridge,
    render,
  };

  /* ---------- Integrasi header: badge SNAPS pada brand (logo+nama+ikon folder) ---------- */
  function decorateBrandAnchor() {
    const brand = $('.brand');
    if (!brand || brand.querySelector('.snaps-anchor-badge')) return;
    const frame = brand.querySelector('.brand-icon-frame');
    if (frame) {
      frame.title = 'SNAPS permanen — klik untuk membuka hub konektor';
      frame.style.cursor = 'pointer';
      frame.addEventListener('click', (event) => {
        if (window.location.hash.startsWith('#snaps')) return;
        event.preventDefault();
        event.stopPropagation();
        window.location.hash = '#snaps';
      });
      const badge = document.createElement('span');
      badge.className = 'snaps-anchor-badge';
      badge.textContent = 'SNAPS';
      badge.setAttribute('aria-hidden', 'true');
      brand.appendChild(badge);
    }
  }

  function boot() {
    decorateBrandAnchor();
    // Prefetch registry agar probe awal cepat.
    loadRegistry().catch(() => {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
