(() => {
  'use strict';
  const app = document.querySelector('#pb-hosting-account-center');
  if (!app) return;
  const API = String(window.PB_HOSTING_API_BASE || app.dataset.apiBase || '').replace(/\/+$/, '');
  const SESSION_KEY = 'pb-hosting-server-session-v2';
  const state = { user: null, tenant: null, role: 'viewer', token: sessionStorage.getItem(SESSION_KEY) || '', view: location.hash === '#register' ? 'register' : 'overview', message: '', error: false, overview: null, services: [], files: [], busy: false };
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bytes = (n) => { const v = Number(n || 0); return v < 1024 ? v + ' B' : v < 1048576 ? (v / 1024).toFixed(1) + ' KB' : (v / 1048576).toFixed(2) + ' MB'; };
  const date = (value) => value ? new Date(value).toLocaleString('id-ID') : '—';
  async function request(path, options = {}) {
    if (!API) throw new Error('Alamat API server belum dikonfigurasi. Backend belum dapat diakses dari halaman ini.');
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (state.token) headers.set('Authorization', 'Bearer ' + state.token);
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');
    let response;
    try { response = await fetch(API + path, { ...options, headers, cache: 'no-store' }); }
    catch { throw new Error('Tidak dapat menghubungi server Hosting API. Periksa deployment dan koneksi.'); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || ('Permintaan gagal (' + response.status + ').'));
    return data;
  }
  function message(text, error = false) { state.message = text; state.error = error; render(); }
  function setSession(data) {
    state.token = data.token;
    state.user = data.user;
    state.tenant = data.tenant;
    state.role = data.role || 'viewer';
    sessionStorage.setItem(SESSION_KEY, state.token);
    state.view = 'overview';
    state.message = '';
    state.error = false;
  }
  async function register(form) {
    const d = new FormData(form);
    const result = await request('/auth/register', { method: 'POST', body: JSON.stringify({ displayName: d.get('name'), email: d.get('email'), password: d.get('password'), workspaceName: d.get('workspaceName') }) });
    setSession(result);
    await render();
  }
  async function login(form) {
    const d = new FormData(form);
    const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: d.get('email'), password: d.get('password') }) });
    setSession(result);
    await render();
  }
  async function logout() {
    try { if (state.token) await request('/auth/logout', { method: 'POST' }); } catch {}
    sessionStorage.removeItem(SESSION_KEY);
    state.token = ''; state.user = null; state.tenant = null; state.services = []; state.files = []; state.view = 'overview';
    state.message = 'Anda telah keluar dari akun.'; state.error = false;
    render();
  }
  function renderHome() {
    app.innerHTML = '<div class="pb-home-account"><div><span class="pb-auth-kicker">SERVER ACCOUNT CENTER</span><b>Hosting Account</b><small>Register, login, profil, layanan, dan File Manager server-side.</small></div><div class="pb-home-actions"><a href="./accounts/index.html">REGISTER / LOGIN</a><a href="./accounts/index.html#register">BUAT AKUN</a></div></div><p class="pb-auth-disclaimer">Akun disimpan di PostgreSQL melalui server Hosting API. Browser hanya menyimpan token sesi sementara; tidak menggunakan IndexedDB sebagai sumber data akun.</p>';
  }
  function renderAuth() {
    const registerMode = state.view === 'register';
    app.innerHTML = '<section class="pb-auth-shell"><div class="pb-auth-intro"><span class="pb-auth-kicker">PLANETBINTANG / HOSTING IDENTITY</span><h2>Akses akun hosting Anda</h2><p>Identitas, profil, workspace, dan resource hosting dikelola melalui backend server dan PostgreSQL.</p><div class="pb-auth-points"><span>01 · IDENTITY</span><span>02 · WORKSPACE</span><span>03 · FILE MANAGER</span></div></div><div class="pb-auth-form"><div class="pb-auth-tabs"><button type="button" data-tab="login" class="' + (!registerMode ? 'active' : '') + '">LOGIN</button><button type="button" data-tab="register" class="' + (registerMode ? 'active' : '') + '">REGISTER</button></div>' +
      (registerMode ? '<form id="pb-register"><label>Nama lengkap<input name="name" autocomplete="name" minlength="2" maxlength="100" required></label><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Nama workspace<input name="workspaceName" maxlength="160" placeholder="Nama workspace hosting"></label><label>Kata sandi<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required><small>Minimal 12 karakter. Gunakan kata sandi unik.</small></label><button class="pb-primary" type="submit">BUAT AKUN SERVER</button></form>' : '<form id="pb-login"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Kata sandi<input name="password" type="password" autocomplete="current-password" required></label><button class="pb-primary" type="submit">MASUK KE HOSTING</button></form>') +
      '<p class="pb-auth-message ' + (state.error ? 'is-error' : '') + '" role="status">' + esc(state.message || (API ? 'Terhubung ke endpoint server Hosting API: ' + API : 'Backend belum terhubung. Alamat API server perlu dikonfigurasi terlebih dahulu.')) + '</p></div></section><p class="pb-auth-disclaimer">Autentikasi server-side menggunakan PostgreSQL, hash scrypt, token sesi acak, dan pemisahan data berdasarkan workspace. Pendaftaran publik sebaiknya dibuka setelah verifikasi email, pemulihan akun, rate limit, dan monitoring diaktifkan.</p>';
    app.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { state.view = button.dataset.tab; state.message = ''; render(); }));
    const form = document.querySelector('#pb-register', app) || document.querySelector('#pb-login', app);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('[type="submit"]'); button.disabled = true; button.textContent = 'MEMPROSES…';
      try { if (form.id === 'pb-register') await register(form); else await login(form); }
      catch (error) { state.message = error.message || 'Operasi akun gagal.'; state.error = true; render(); }
    });
  }
  async function loadDashboardData() {
    const results = await Promise.all([
      request('/account/overview'),
      request('/account/profile'),
      request('/services')
    ]);
    state.overview = results[0];
    state.user = results[1].user;
    state.tenant = results[1].tenant;
    state.role = results[1].role || state.role;
    state.services = results[2].services || [];
    if (state.view === 'files') state.files = (await request('/files?prefix=hosting/accounts/')).files || [];
  }
  function renderDashboard() {
    const tabs = ['overview','profile','services','files','settings'];
    const labels = { overview:'DASHBOARD', profile:'PROFIL', services:'MANAJEMEN HOSTING', files:'FILE MANAGER', settings:'PENGATURAN' };
    const counts = state.overview && state.overview.counts || {};
    let body = '';
    if (state.view === 'overview') {
      body = '<div class="pb-account-stats"><article><small>STATUS AKUN</small><b>AKTIF</b></article><article><small>RESOURCE HOSTING</small><b>' + Number(counts.services || 0) + '</b></article><article><small>FILE MANAGER</small><b>' + Number(counts.files || 0) + '</b></article><article><small>DATA TERSIMPAN</small><b>' + bytes(counts.bytes) + '</b></article></div><section class="pb-account-card"><h3>Workspace hosting</h3><p>' + esc(state.tenant && state.tenant.name || 'Workspace') + ' · Peran: ' + esc(state.role) + '</p><div class="pb-service-chips"><span>Website</span><span>Domain & DNS</span><span>Database</span><span>Email</span><span>SSL / TLS</span><span>Storage</span><span>Deployment</span><span>Backup</span></div></section><section class="pb-account-card"><h3>Aktivitas terbaru</h3>' + ((state.overview.recentActivity || []).length ? '<div class="pb-file-list">' + state.overview.recentActivity.map(x => '<div><code>' + esc(x.action) + '</code><span>' + esc(date(x.created_at)) + '</span></div>').join('') + '</div>' : '<p class="pb-muted">Belum ada aktivitas.</p>') + '</section>';
    } else if (state.view === 'profile') {
      const profile = state.user.profile || {};
      body = '<section class="pb-account-card"><h3>Informasi profil</h3><form id="pb-profile-form"><label>Nama tampilan<input name="displayName" value="' + esc(state.user.displayName) + '" required></label><label>Perusahaan<input name="company" value="' + esc(profile.company || '') + '"></label><label>Nomor kontak<input name="phone" value="' + esc(profile.phone || '') + '"></label><label>Zona waktu<select name="timezone"><option ' + ((profile.timezone || 'Asia/Jakarta') === 'Asia/Jakarta' ? 'selected' : '') + '>Asia/Jakarta</option><option ' + (profile.timezone === 'Asia/Makassar' ? 'selected' : '') + '>Asia/Makassar</option><option ' + (profile.timezone === 'Asia/Jayapura' ? 'selected' : '') + '>Asia/Jayapura</option><option ' + (profile.timezone === 'UTC' ? 'selected' : '') + '>UTC</option></select></label><button class="pb-primary" type="submit">SIMPAN PROFIL</button></form></section>';
    } else if (state.view === 'services') {
      body = '<section class="pb-account-card"><h3>Daftarkan resource hosting</h3><form id="pb-service-form"><label>Jenis layanan<select name="type"><option value="website">Website</option><option value="domain">Domain</option><option value="dns">DNS</option><option value="ssl">SSL/TLS</option><option value="database">Database</option><option value="email">Email</option><option value="storage">Storage</option><option value="application">Aplikasi</option><option value="hosting">Hosting</option><option value="backup">Backup</option></select></label><label>Nama layanan<input name="name" maxlength="180" placeholder="contoh: situs-utama atau example.com" required></label><label>Catatan konfigurasi<textarea name="notes" rows="3"></textarea></label><button class="pb-primary" type="submit">SIMPAN RESOURCE</button></form></section><section class="pb-account-card"><h3>Resource terdaftar (' + state.services.length + ')</h3>' + (state.services.length ? '<div class="pb-service-list">' + state.services.map(x => '<article><span>' + esc(x.type.toUpperCase()) + '</span><b>' + esc(x.name) + '</b><small>' + esc(x.notes || x.status || 'planned') + '</small><button type="button" data-activate="' + esc(x.id) + '">' + (x.status === 'active' ? 'AKTIF' : 'AKTIFKAN') + '</button><button type="button" data-remove="' + esc(x.id) + '">HAPUS</button></article>').join('') + '</div>' : '<p class="pb-muted">Belum ada resource. Tambahkan layanan untuk menyimpan konfigurasi hosting.</p>') + '</section>';
    } else if (state.view === 'files') {
      body = '<section class="pb-account-card"><h3>File Manager / REIC Workspace</h3><p>Record profil dan resource otomatis disinkronkan ke PostgreSQL. Anda juga dapat membuat berkas konfigurasi REIC.</p><form id="pb-file-form"><label>Nama berkas<input name="name" maxlength="180" placeholder="konfigurasi.reic" required></label><label>Konten REIC<textarea name="content" rows="5" placeholder="{ schema: PB.HOSTING.CONFIG/1 }"></textarea></label><button class="pb-primary" type="submit">SIMPAN KE FILE MANAGER</button></form></section><section class="pb-account-card"><h3>Isi direktori akun (' + state.files.length + ')</h3>' + (state.files.length ? '<div class="pb-file-list">' + state.files.map(x => '<div><code>' + esc(x.path) + '</code><span>' + bytes(x.size) + ' · ' + esc(x.type) + '</span></div>').join('') + '</div>' : '<p class="pb-muted">Belum ada berkas akun.</p>') + '</section>';
    } else {
      body = '<section class="pb-account-card"><h3>Keamanan akun</h3><p>Hash kata sandi scrypt dengan salt acak, token sesi 256-bit, sesi server 30 hari, dan pemisahan workspace.</p><div class="pb-setting-row"><b>Email</b><span>' + esc(state.user.email) + '</span></div><div class="pb-setting-row"><b>ID akun</b><span>' + esc(state.user.id) + '</span></div><div class="pb-setting-row"><b>Peran workspace</b><span>' + esc(state.role) + '</span></div><div class="pb-setting-row"><b>Workspace</b><span>' + esc(state.tenant && state.tenant.slug || '') + '</span></div></section><section class="pb-account-card"><h3>Ganti kata sandi</h3><form id="pb-password-form"><label>Kata sandi saat ini<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>Kata sandi baru<input name="newPassword" type="password" minlength="12" maxlength="128" autocomplete="new-password" required></label><button class="pb-primary" type="submit">PERBARUI KATA SANDI</button></form></section>';
    }
    app.innerHTML = '<section class="pb-account-layout"><aside class="pb-account-side"><span class="pb-auth-kicker">HOSTING ACCOUNT</span><div class="pb-avatar">' + esc((state.user.displayName || 'U').slice(0,1).toUpperCase()) + '</div><b>' + esc(state.user.displayName) + '</b><small>' + esc(state.user.email) + '</small><nav>' + tabs.map(t => '<button type="button" data-view="' + t + '" class="' + (state.view === t ? 'active' : '') + '">' + labels[t] + '</button>').join('') + '</nav><button type="button" class="pb-logout" id="pb-logout">KELUAR</button></aside><div class="pb-account-main"><header class="pb-account-head"><div><span class="pb-auth-kicker">PLANETBINTANG / HOSTING API</span><h2>' + labels[state.view] + '</h2><p>Data tersimpan di PostgreSQL dan dikelola melalui API server.</p></div><span>' + esc(state.tenant && state.tenant.name || '') + '</span></header>' + body + '<p class="pb-account-message ' + (state.error ? 'is-error' : '') + '" role="status">' + esc(state.message) + '</p></div></section>';
    app.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', async () => { state.view = button.dataset.view; state.message = ''; await render(); }));
    document.querySelector('#pb-logout', app).addEventListener('click', logout);
    const profileForm = document.querySelector('#pb-profile-form', app);
    if (profileForm) profileForm.addEventListener('submit', async event => {
      event.preventDefault(); const d = new FormData(profileForm);
      try { await request('/account/profile', { method: 'PUT', body: JSON.stringify({ displayName:d.get('displayName'), company:d.get('company'), phone:d.get('phone'), timezone:d.get('timezone') }) }); state.message = 'Profil tersimpan dan disinkronkan ke File Manager.'; state.error = false; await render(); }
      catch (e) { message(e.message, true); }
    });
    const serviceForm = document.querySelector('#pb-service-form', app);
    if (serviceForm) serviceForm.addEventListener('submit', async event => {
      event.preventDefault(); const d = new FormData(serviceForm);
      try { await request('/services', { method:'POST', body:JSON.stringify({ type:d.get('type'), name:d.get('name'), notes:d.get('notes') }) }); state.message = 'Resource tersimpan di server dan dibuatkan record REIC di File Manager.'; state.error = false; await render(); }
      catch(e) { message(e.message,true); }
    });
    app.querySelectorAll('[data-activate]').forEach(button => button.addEventListener('click', async () => {
      const service = state.services.find(x => x.id === button.dataset.activate); if (!service || service.status === 'active') return;
      try { await request('/services/' + encodeURIComponent(service.id), { method:'PUT', body:JSON.stringify({ status:'active' }) }); state.message = 'Status resource diperbarui.'; state.error = false; await render(); }
      catch(e) { message(e.message,true); }
    }));
    app.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Tandai resource ini sebagai dihapus?')) return;
      try { await request('/services/' + encodeURIComponent(button.dataset.remove), { method:'DELETE' }); state.message = 'Resource ditandai dihapus dan catatan REIC diperbarui.'; state.error = false; await render(); }
      catch(e) { message(e.message,true); }
    }));
    const fileForm = document.querySelector('#pb-file-form', app);
    if (fileForm) fileForm.addEventListener('submit', async event => {
      event.preventDefault(); const d = new FormData(fileForm), name = String(d.get('name')).trim();
      const safeName = name.replace(/[\\/\\\\]/g,'-');
      const filePath = 'hosting/accounts/custom/' + Date.now() + '-' + safeName;
      try { await request('/files', { method:'POST', body:JSON.stringify({ name:safeName, path:filePath, content:String(d.get('content') || ''), contentType:'application/reic+json' }) }); state.message = 'Berkas REIC tersimpan di File Manager server.'; state.error = false; await render(); }
      catch(e) { message(e.message,true); }
    });
    const passwordForm = document.querySelector('#pb-password-form', app);
    if (passwordForm) passwordForm.addEventListener('submit', async event => {
      event.preventDefault(); const d = new FormData(passwordForm);
      try { await request('/account/password', { method:'POST', body:JSON.stringify({ currentPassword:d.get('currentPassword'), newPassword:d.get('newPassword') }) }); state.message = 'Kata sandi diperbarui. Sesi lain telah dicabut.'; state.error = false; await render(); }
      catch(e) { message(e.message,true); }
    });
  }
  async function render() {
    if (app.dataset.view === 'home') { renderHome(); return; }
    if (!state.user) { renderAuth(); return; }
    try { await loadDashboardData(); renderDashboard(); }
    catch (error) {
      if (error.message && error.message.includes('Sesi tidak aktif')) { sessionStorage.removeItem(SESSION_KEY); state.token = ''; state.user = null; renderAuth(); message(error.message, true); return; }
      app.innerHTML = '<p class="pb-auth-message is-error">' + esc(error.message || 'Tidak dapat memuat dashboard server.') + '</p>';
    }
  }
  async function boot() {
    if (!API) { renderAuth(); return; }
    if (state.token) {
      try {
        const result = await request('/auth/me');
        state.user = result.user; state.tenant = result.tenant; state.role = result.role || 'viewer';
      } catch { sessionStorage.removeItem(SESSION_KEY); state.token = ''; }
    }
    await render();
  }
  boot();
})();