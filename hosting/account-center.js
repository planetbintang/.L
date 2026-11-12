(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SESSION_KEY = 'pb-hosting-account-session-v1';
  const ROOT = 'hosting/accounts';
  const app = $('#pb-hosting-account-center');
  if (!app) return;
  const isHome = app.dataset.view === 'home';
  const state = { user: null, view: location.hash === '#register' ? 'register' : 'overview', services: [], message: '', busy: false };
  const store = () => window.PBLocalFiles;
  const emailKey = (email) => btoa(unescape(encodeURIComponent(email.toLowerCase()))).replace(/[^a-z0-9]/gi, '').slice(0, 90);
  const filePath = (email) => ROOT + '/users/' + emailKey(email) + '.reic';
  const profilePath = (email) => ROOT + '/profiles/' + emailKey(email) + '.reic';
  const servicePath = (email, id) => ROOT + '/services/' + emailKey(email) + '/' + id + '.reic';
  const activityPath = (email) => ROOT + '/activity/' + emailKey(email) + '.jsonl';
  const readJson = async (path) => {
    const item = await store().readFile(path);
    return JSON.parse(item.text);
  };
  const saveJson = async (path, value) => store().saveFile(path, JSON.stringify(value, null, 2), 'application/json;charset=utf-8');
  const log = async (action, detail) => {
    const row = { at: new Date().toISOString(), module: 'hosting', action, detail: detail || '' };
    if (state.user) {
      const path = activityPath(state.user.email);
      let old = '';
      try { old = (await store().readFile(path)).text; } catch {}
      await store().saveFile(path, old + JSON.stringify(row) + '\n', 'application/x-ndjson;charset=utf-8');
    }
    await store().recordActivity('hosting-' + action, ROOT, { note: detail || action });
  };
  const derive = async (password, salt) => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, key, 256);
    return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };
  const randomSalt = () => crypto.getRandomValues(new Uint8Array(16));
  const toHex = (bytes) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const fromHex = (hex) => new Uint8Array((hex.match(/.{2}/g) || []).map((v) => parseInt(v, 16)));
  const setMessage = (message, error) => { state.message = message; state.error = !!error; render(); };
  const loadSession = async () => {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (!session || !session.email) return;
      const record = await readJson(filePath(session.email));
      if (record.status === 'active') {
        state.user = record;
        await loadServices();
      }
    } catch { sessionStorage.removeItem(SESSION_KEY); }
  };
  const loadServices = async () => {
    state.services = [];
    if (!state.user) return;
    const rows = await store().list(ROOT + '/services/' + emailKey(state.user.email)).catch(() => []);
    for (const row of rows) if (row.type === 'file' && row.path.endsWith('.reic')) {
      try { state.services.push(await readJson(row.path)); } catch {}
    }
  };
  const register = async (form) => {
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) throw new Error('Periksa nama, email, dan kata sandi (minimal 10 karakter).');
    const path = filePath(email);
    try { await readJson(path); throw new Error('Email sudah terdaftar pada workspace browser ini.'); } catch (e) { if (e.message === 'Email sudah terdaftar pada workspace browser ini.') throw e; }
    const salt = randomSalt();
    const user = { schema: 'PB.HOSTING.USER/1', id: 'usr_' + crypto.randomUUID(), name, email, role: 'customer', status: 'active', createdAt: new Date().toISOString(), password: { algorithm: 'PBKDF2-SHA256', iterations: 210000, salt: toHex(salt), hash: await derive(password, salt) } };
    await saveJson(path, user);
    await saveJson(profilePath(email), { schema: 'PB.HOSTING.PROFILE/1', userId: user.id, displayName: name, company: '', phone: '', timezone: 'Asia/Jakarta', updatedAt: new Date().toISOString() });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, createdAt: new Date().toISOString() }));
    state.user = user; state.view = 'overview'; state.services = [];
    await log('register', 'Akun hosting dibuat di penyimpanan lokal File Manager');
    setMessage('Akun lokal berhasil dibuat. Data tersimpan di File Manager pada browser ini.', false);
  };
  const login = async (form) => {
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');
    const user = await readJson(filePath(email)).catch(() => null);
    if (!user || user.status !== 'active') throw new Error('Akun tidak ditemukan atau tidak aktif pada workspace ini.');
    const actual = await derive(password, fromHex(user.password.salt));
    if (actual !== user.password.hash) throw new Error('Email atau kata sandi tidak cocok.');
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, createdAt: new Date().toISOString() }));
    state.user = user; state.view = 'overview'; await loadServices();
    await log('login', 'Login workspace hosting');
    setMessage('Login berhasil.', false);
  };
  const logout = async () => {
    if (state.user) await log('logout', 'Logout workspace hosting');
    sessionStorage.removeItem(SESSION_KEY); state.user = null; state.services = []; state.view = 'overview';
    setMessage('Anda telah keluar dari akun.', false);
  };
  const renderAuth = () => {
    app.innerHTML = '<section class="pb-auth-shell"><div class="pb-auth-intro"><span class="pb-auth-kicker">PLANETBINTANG / HOSTING IDENTITY</span><h2>Akses akun hosting Anda</h2><p>Daftar atau masuk untuk membuka profil, dashboard, pengaturan, dan manajemen layanan hosting.</p><div class="pb-auth-points"><span>01 · ACCOUNT</span><span>02 · SERVICES</span><span>03 · FILE MANAGER</span></div></div><div class="pb-auth-form"><div class="pb-auth-tabs"><button type="button" data-tab="login" class="' + (state.view === 'register' ? '' : 'active') + '">LOGIN</button><button type="button" data-tab="register" class="' + (state.view === 'register' ? 'active' : '') + '">REGISTER</button></div>' +
      (state.view === 'register' ? '<form id="pb-register"><label>Nama lengkap<input name="name" autocomplete="name" required minlength="2"></label><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Kata sandi<input name="password" type="password" autocomplete="new-password" minlength="10" required><small>Minimal 10 karakter. Gunakan kata sandi unik.</small></label><button class="pb-primary" type="submit">BUAT AKUN</button></form>' : '<form id="pb-login"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Kata sandi<input name="password" type="password" autocomplete="current-password" required></label><button class="pb-primary" type="submit">MASUK KE HOSTING</button></form>') +
      '<p class="pb-auth-message ' + (state.error ? 'is-error' : '') + '" role="status">' + esc(state.message || 'Penyimpanan terhubung ke File Manager lokal pada perangkat ini.') + '</p></div></section><p class="pb-auth-disclaimer">MODE WORKSPACE LOKAL: akun dan data tersimpan di IndexedDB browser melalui File Manager. Ini bukan autentikasi server dan belum dapat digunakan untuk akun lintas perangkat atau layanan hosting produksi.</p>';
    app.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { state.view = button.dataset.tab; state.message = ''; render(); }));
    const form = $('#pb-register', app) || $('#pb-login', app);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); const button = $('button[type="submit"]', form); button.disabled = true; button.textContent = 'MEMPROSES…';
      try { if (form.id === 'pb-register') await register(form); else await login(form); }
      catch (error) { state.message = error.message || 'Operasi akun gagal.'; state.error = true; render(); }
    });
  };
  const renderHome = () => {
    app.innerHTML = '<div class="pb-home-account"><div><span class="pb-auth-kicker">ACCOUNT CENTER</span><b>' + (state.user ? 'Halo, ' + esc(state.user.name) : 'Akun Hosting') + '</b><small>' + (state.user ? esc(state.user.email) : 'Daftar atau masuk untuk mengelola layanan hosting') + '</small></div><div class="pb-home-actions">' + (state.user ? '<a href="./accounts/index.reic">DASHBOARD PROFIL</a><button type="button" id="pb-home-logout">KELUAR</button>' : '<a href="./accounts/index.reic#register">REGISTER / LOGIN</a>') + '</div></div>';
    const out = $('#pb-home-logout', app); if (out) out.addEventListener('click', logout);
  };
  const renderDashboard = async () => {
    const profile = await readJson(profilePath(state.user.email)).catch(() => ({ displayName: state.user.name, company: '', phone: '', timezone: 'Asia/Jakarta' }));
    const stats = await store().stats();
    const used = stats.bytes > 1024 * 1024 ? (stats.bytes / 1048576).toFixed(2) + ' MB' : (stats.bytes / 1024).toFixed(1) + ' KB';
    const tabs = ['overview','profile','services','settings','files'];
    const labels = { overview:'DASHBOARD', profile:'PROFIL', services:'MANAJEMEN HOSTING', settings:'PENGATURAN', files:'FILE MANAGER' };
    app.innerHTML = '<section class="pb-account-layout"><aside class="pb-account-side"><span class="pb-auth-kicker">HOSTING ACCOUNT</span><div class="pb-avatar">' + esc((state.user.name || 'U').slice(0,1).toUpperCase()) + '</div><b>' + esc(state.user.name) + '</b><small>' + esc(state.user.email) + '</small><nav>' + tabs.map((tab) => '<button type="button" data-view="' + tab + '" class="' + (state.view === tab ? 'active' : '') + '">' + labels[tab] + '</button>').join('') + '</nav><button type="button" class="pb-logout" id="pb-logout">KELUAR</button></aside><div class="pb-account-main"><header class="pb-account-head"><div><span class="pb-auth-kicker">PLANETBINTANG / HOSTING</span><h2>' + labels[state.view] + '</h2><p>Kelola identitas, layanan, konfigurasi, dan berkas akun dari satu workspace.</p></div><a href="../index.reic">SEMUA MODUL HOSTING ↗</a></header>' +
      (state.view === 'overview' ? '<div class="pb-account-stats"><article><small>STATUS AKUN</small><b>AKTIF</b></article><article><small>LAYANAN TERCATAT</small><b>' + state.services.length + '</b></article><article><small>FILE LOKAL</small><b>' + stats.files + '</b></article><article><small>RUANG WORKSPACE</small><b>' + used + '</b></article></div><section class="pb-account-card"><h3>Ringkasan akun</h3><p>Selamat datang, ' + esc(profile.displayName || state.user.name) + '. Dashboard ini menampilkan catatan layanan dan data yang dikelola melalui File Manager.</p><div class="pb-service-chips"><span>Domain & DNS</span><span>Website & Aplikasi</span><span>Database & Email</span><span>SSL & Keamanan</span><span>Deployment</span><span>Backup</span></div></section><section class="pb-account-card"><h3>Aktivitas terakhir</h3><p class="pb-muted">Catatan akun dan perubahan tersimpan di hosting/accounts/activity/.</p><button type="button" data-view="files">BUKA FILE MANAGER DATA</button></section>' :
      state.view === 'profile' ? '<section class="pb-account-card"><h3>Informasi profil</h3><form id="pb-profile-form"><label>Nama tampilan<input name="displayName" value="' + esc(profile.displayName || state.user.name) + '" required></label><label>Perusahaan<input name="company" value="' + esc(profile.company || '') + '"></label><label>Nomor kontak<input name="phone" value="' + esc(profile.phone || '') + '"></label><label>Zona waktu<select name="timezone"><option>Asia/Jakarta</option><option>Asia/Makassar</option><option>Asia/Jayapura</option><option>UTC</option></select></label><button class="pb-primary" type="submit">SIMPAN PROFIL</button></form></section>' :
      state.view === 'services' ? '<section class="pb-account-card"><h3>Daftarkan resource hosting</h3><form id="pb-service-form"><label>Jenis layanan<select name="type"><option value="website">Website</option><option value="domain">Domain</option><option value="database">Database</option><option value="email">Email</option><option value="storage">Storage</option><option value="application">Aplikasi</option><option value="ssl">SSL/TLS</option></select></label><label>Nama / identitas layanan<input name="name" placeholder="contoh: situs-utama atau example.com" required></label><label>Catatan konfigurasi<textarea name="notes" rows="3" placeholder="Document root, region, runtime, atau catatan layanan"></textarea></label><button class="pb-primary" type="submit">SIMPAN RESOURCE</button></form></section><section class="pb-account-card"><h3>Resource terdaftar (' + state.services.length + ')</h3>' + (state.services.length ? '<div class="pb-service-list">' + state.services.map((service) => '<article><span>' + esc(service.type.toUpperCase()) + '</span><b>' + esc(service.name) + '</b><small>' + esc(service.notes || 'Tidak ada catatan') + '</small><button type="button" data-remove-service="' + esc(service.id) + '">HAPUS</button></article>').join('') + '</div>' : '<p class="pb-muted">Belum ada resource. Tambahkan website, domain, database, email, storage, aplikasi, atau SSL.</p>') + '</section>' :
      state.view === 'settings' ? '<section class="pb-account-card"><h3>Pengaturan dan keamanan</h3><p>Metode autentikasi lokal: PBKDF2-SHA256 dengan salt unik. Sesi akun disimpan per tab/peramban dan berakhir saat logout atau sesi browser ditutup.</p><div class="pb-setting-row"><b>Identitas akun</b><span>' + esc(state.user.id) + '</span></div><div class="pb-setting-row"><b>Peran</b><span>' + esc(state.user.role) + '</span></div><div class="pb-setting-row"><b>Dibuat</b><span>' + esc(new Date(state.user.createdAt).toLocaleString('id-ID')) + '</span></div><p class="pb-muted">Untuk produksi, pindahkan autentikasi ke API server dengan cookie HttpOnly, CSRF protection, rate limiting, verifikasi email, dan kontrol akses server-side.</p></section>' :
      '<section class="pb-account-card"><h3>Lokasi data File Manager</h3><p>Seluruh record akun dan resource di bawah ini disimpan sebagai file REIC/JSON yang dapat dijelajahi dari File Manager pada origin browser yang sama.</p><div class="pb-file-paths"><code>' + esc(filePath(state.user.email)) + '</code><code>' + esc(profilePath(state.user.email)) + '</code><code>' + esc(ROOT + '/services/' + emailKey(state.user.email) + '/') + '</code><code>' + esc(activityPath(state.user.email)) + '</code></div><button type="button" id="pb-refresh-files">SEGARKAN DAFTAR FILE</button><div id="pb-file-list" class="pb-file-list">Memuat…</div></section>') +
      '<p class="pb-account-message ' + (state.error ? 'is-error' : '') + '" role="status">' + esc(state.message) + '</p></div></section>';
    app.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { state.view = button.dataset.view; state.message = ''; render(); }));
    $('#pb-logout', app).addEventListener('click', logout);
    const profileForm = $('#pb-profile-form', app);
    if (profileForm) profileForm.addEventListener('submit', async (event) => {
      event.preventDefault(); const data = new FormData(profileForm);
      const next = { schema:'PB.HOSTING.PROFILE/1', userId:state.user.id, displayName:String(data.get('displayName')).trim(), company:String(data.get('company') || '').trim(), phone:String(data.get('phone') || '').trim(), timezone:String(data.get('timezone') || 'Asia/Jakarta'), updatedAt:new Date().toISOString() };
      await saveJson(profilePath(state.user.email), next); state.user.name = next.displayName; await saveJson(filePath(state.user.email), state.user); await log('profile-update', 'Profil akun diperbarui'); setMessage('Profil berhasil disimpan ke File Manager.', false);
    });
    const serviceForm = $('#pb-service-form', app);
    if (serviceForm) serviceForm.addEventListener('submit', async (event) => {
      event.preventDefault(); const data = new FormData(serviceForm);
      const service = { schema:'PB.HOSTING.SERVICE/1', id:'svc_' + crypto.randomUUID(), userId:state.user.id, type:String(data.get('type')), name:String(data.get('name')).trim(), notes:String(data.get('notes') || '').trim(), status:'recorded', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
      await saveJson(servicePath(state.user.email, service.id), service); await loadServices(); await log('service-create', service.type + ': ' + service.name); state.message = 'Resource tersimpan pada File Manager.'; render();
    });
    app.querySelectorAll('[data-remove-service]').forEach((button) => button.addEventListener('click', async () => {
      if (!confirm('Hapus catatan resource ini dari File Manager?')) return;
      await store().remove(servicePath(state.user.email, button.dataset.removeService)); await loadServices(); await log('service-delete', button.dataset.removeService); state.message = 'Resource dihapus dari File Manager.'; render();
    }));
    const refreshFiles = $('#pb-refresh-files', app);
    if (refreshFiles) refreshFiles.addEventListener('click', renderFileList);
    if (state.view === 'files') renderFileList();
  };
  const renderFileList = async () => {
    const target = $('#pb-file-list', app); if (!target || !state.user) return;
    const paths = [filePath(state.user.email), profilePath(state.user.email), ROOT + '/services/' + emailKey(state.user.email), activityPath(state.user.email)];
    const rows = [];
    for (const path of paths) {
      try {
        const record = await store().get(path);
        if (record) rows.push({ path, type: record.type, size: record.size || 0 });
        else if (path.endsWith('/' + emailKey(state.user.email))) rows.push({ path, type: 'directory', size: 0 });
      } catch {}
    }
    const serviceRows = await store().list(ROOT + '/services/' + emailKey(state.user.email)).catch(() => []);
    serviceRows.forEach((row) => rows.push({ path: row.path, type: row.type, size: row.size || 0 }));
    target.innerHTML = rows.length ? rows.map((row) => '<div><code>' + esc(row.path) + '</code><span>' + esc(row.type) + ' · ' + Number(row.size).toLocaleString('id-ID') + ' B</span></div>').join('') : '<p class="pb-muted">Belum ada file akun.</p>';
  };
  const render = () => {
    if (isHome) { renderHome(); return; }
    if (!state.user) { renderAuth(); return; }
    renderDashboard();
  };
  const boot = async () => {
    if (!store()) { app.innerHTML = '<p class="pb-auth-message is-error">File Manager storage belum dimuat. Muat local-file-store.js terlebih dahulu.</p>'; return; }
    try { await store().ready(); await loadSession(); render(); }
    catch (error) { app.innerHTML = '<p class="pb-auth-message is-error">Penyimpanan tidak tersedia: ' + esc(error.message) + '</p>'; }
  };
  boot();
})();