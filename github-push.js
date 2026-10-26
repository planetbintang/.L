(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const TOKEN_KEY = 'pb-github-push-token-session';
  const API = 'https://api.github.com';
  const state = { sha: '', loaded: false, dirty: false, busy: false, timer: null, lastPushedText: null, lastAutoHash: '' };
  const ui = {};
  const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');
  const status = (message, phase = 'ready') => {
    if (!ui.status) return;
    ui.status.textContent = message;
    ui.status.dataset.state = phase;
  };
  const repoName = () => String(ui.repo?.value || '').trim();
  const branchName = () => String(ui.branch?.value || '').trim();
  const filePath = () => String(ui.path?.value || '').trim().replace(/^\/+/, '');
  const tokenValue = () => String(ui.token?.value || sessionStorage.getItem(TOKEN_KEY) || '').trim();
  const validTarget = () => {
    const repo = repoName(), path = filePath();
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('Format repositori harus owner/nama.');
    if (!branchName()) throw new Error('Branch wajib diisi.');
    if (!path || path.split('/').some(part => !part || part === '.' || part === '..') || path.startsWith('.git/')) throw new Error('Path file tidak valid.');
    return { repo, branch: branchName(), path };
  };
  async function github(path, options = {}) {
    const token = tokenValue();
    if (!token) throw new Error('Masukkan GitHub Personal Access Token dengan izin Contents: Read and write.');
    const response = await fetch(API + path, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + token,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      },
      credentials: 'omit',
      cache: 'no-store'
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = body?.message || ('HTTP ' + response.status);
      if (response.status === 401) throw new Error('Token ditolak atau kedaluwarsa. Periksa token dan izin repo.');
      if (response.status === 403) throw new Error('Akses ditolak/rate limit. Pastikan token memiliki Contents: Read and write dan akses ke repo.');
      if (response.status === 404) throw new Error('Repo/file tidak ditemukan atau token tidak memiliki akses.');
      if (response.status === 409 || response.status === 422) throw new Error(detail + ' — mungkin file berubah di GitHub; muat ulang sebelum push.');
      throw new Error(detail);
    }
    return body;
  }
  function contentUrl(target) {
    return '/repos/' + target.repo + '/contents/' + encodePath(target.path);
  }
  function decodeContent(base64) {
    const binary = atob(String(base64 || '').replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
  function encodeContent(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    return btoa(binary);
  }
  function updateSelectedTarget(detail) {
    if (!detail) return;
    if (detail.fullName && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(detail.fullName)) ui.repo.value = detail.fullName;
    if (detail.branch) ui.branch.value = detail.branch;
    if (detail.path && !detail.path.split('/').some(part => part === '..')) ui.path.value = detail.path;
    state.sha = ''; state.loaded = false; state.dirty = false;
    if (ui.editor) ui.editor.value = '';
    status('File terpilih dari File Manager. Masukkan token, lalu klik “Muat dari GitHub” untuk mengambil isi file.', 'ready');
  }
  async function loadRemote() {
    if (state.busy) return;
    let target;
    try { target = validTarget(); } catch (error) { status(error.message, 'error'); return; }
    state.busy = true; setBusy(true); status('Memuat isi file dari GitHub…', 'working');
    try {
      const result = await github(contentUrl(target) + '?ref=' + encodeURIComponent(target.branch));
      if (Array.isArray(result) || !result.content) throw new Error('Path menunjuk folder atau file tidak dapat dibaca.');
      ui.editor.value = decodeContent(result.content);
      state.sha = result.sha || '';
      state.loaded = true; state.dirty = false; state.lastPushedText = ui.editor.value;
      status('File berhasil dimuat · ' + target.repo + ' / ' + target.path + ' · SHA ' + state.sha.slice(0, 10), 'success');
    } catch (error) {
      state.loaded = false;
      status('Gagal memuat: ' + error.message + (error.message.includes('tidak ditemukan') ? ' Jika ini file baru, Anda tetap bisa mengetik isi lalu klik Push.' : ''), 'error');
    } finally { state.busy = false; setBusy(false); }
  }
  async function readCurrentSha(target) {
    try {
      const current = await github(contentUrl(target) + '?ref=' + encodeURIComponent(target.branch));
      if (Array.isArray(current) || !current.sha) throw new Error('Path bukan file.');
      return current.sha;
    } catch (error) {
      if (String(error.message).includes('tidak ditemukan')) return '';
      throw error;
    }
  }
  async function pushNow(isAuto = false) {
    if (state.busy) return false;
    let target;
    try { target = validTarget(); } catch (error) { status(error.message, 'error'); return false; }
    if (!tokenValue()) { status('Masukkan GitHub Personal Access Token terlebih dahulu.', 'error'); ui.token?.focus(); return false; }
    const content = ui.editor.value;
    if (!isAuto && !confirm('Commit isi editor ke ' + target.repo + ' · ' + target.branch + ' · ' + target.path + '?')) return false;
    if (isAuto && (!ui.auto.checked || !state.loaded || content === state.lastPushedText)) return false;
    state.busy = true; setBusy(true); status((isAuto ? 'Auto-push' : 'Push') + ' sedang mengirim commit ke GitHub…', 'working');
    try {
      let sha = state.sha;
      if (!sha) sha = await readCurrentSha(target);
      const message = (ui.message.value || '').trim() || (isAuto ? 'Auto-update ' + target.path : 'Update ' + target.path);
      const body = { message, content: encodeContent(content), branch: target.branch };
      if (sha) body.sha = sha;
      const result = await github(contentUrl(target), { method: 'PUT', body: JSON.stringify(body) });
      state.sha = result.content?.sha || '';
      state.loaded = true; state.dirty = false; state.lastPushedText = content;
      const commitSha = result.commit?.sha || '';
      status('Berhasil commit ke GitHub · ' + target.repo + ' / ' + target.branch + ' / ' + target.path + (commitSha ? ' · commit ' + commitSha.slice(0, 12) : ''), 'success');
      return true;
    } catch (error) {
      status('Push gagal: ' + error.message, 'error');
      return false;
    } finally { state.busy = false; setBusy(false); }
  }
  function setBusy(busy) {
    [ui.load, ui.push].forEach(button => { if (button) button.disabled = busy; });
  }
  function scheduleAutoPush() {
    clearTimeout(state.timer);
    if (!ui.auto.checked || !state.loaded || !state.dirty) return;
    state.timer = setTimeout(async () => {
      if (!ui.auto.checked || !state.dirty || !state.loaded) return;
      const textNow = ui.editor.value;
      if (textNow === state.lastPushedText) { state.dirty = false; return; }
      await pushNow(true);
    }, 4000);
    status('Auto-push aktif: menunggu 4 detik setelah edit berhenti…', 'working');
  }
  function bind() {
    Object.assign(ui, {
      repo: $('#githubPushRepo'), branch: $('#githubPushBranch'), path: $('#githubPushPath'),
      token: $('#githubPushToken'), load: $('#githubPushLoad'), push: $('#githubPushButton'),
      message: $('#githubPushMessage'), editor: $('#githubPushEditor'), auto: $('#githubPushAuto'),
      status: $('#githubPushStatus')
    });
    if (!ui.editor) return;
    try { ui.token.value = sessionStorage.getItem(TOKEN_KEY) || ''; } catch {}
    const selectedRepo = $('#fileRepoSelect')?.value || '';
    if (selectedRepo) ui.repo.value = selectedRepo;
    const repoData = (window.PBSystemSnapshot?.data?.repositories || []).find(item => item.fullName === ui.repo.value);
    if (repoData?.branch) ui.branch.value = repoData.branch;
    ui.token.addEventListener('input', () => {
      try { if (ui.token.value) sessionStorage.setItem(TOKEN_KEY, ui.token.value); else sessionStorage.removeItem(TOKEN_KEY); } catch {}
    });
    ui.load.addEventListener('click', () => void loadRemote());
    ui.push.addEventListener('click', () => void pushNow(false));
    ui.repo.addEventListener('change', () => {
      state.sha = ''; state.loaded = false; state.dirty = false;
      const repo = (window.PBSystemSnapshot?.data?.repositories || []).find(item => item.fullName === ui.repo.value);
      if (repo?.branch) ui.branch.value = repo.branch;
    });
    ui.branch.addEventListener('change', () => { state.sha = ''; state.loaded = false; state.dirty = false; });
    ui.path.addEventListener('change', () => { state.sha = ''; state.loaded = false; state.dirty = false; });
    ui.editor.addEventListener('input', () => {
      if (!state.loaded) { state.dirty = true; status('Isi editor berubah. Muat file dari GitHub terlebih dahulu untuk mengaktifkan auto-push; Push manual tetap tersedia.', 'ready'); return; }
      state.dirty = ui.editor.value !== state.lastPushedText;
      scheduleAutoPush();
    });
    ui.auto.addEventListener('change', () => {
      clearTimeout(state.timer);
      if (ui.auto.checked) {
        if (!state.loaded) { ui.auto.checked = false; status('Muat file dari GitHub terlebih dahulu sebelum mengaktifkan auto-push.', 'error'); return; }
        if (!confirm('Aktifkan auto-push? Setiap edit akan menjadi commit ke GitHub setelah 4 detik tanpa perubahan.')) { ui.auto.checked = false; return; }
        scheduleAutoPush();
      } else status('Auto-push nonaktif. Perubahan hanya dikirim saat tombol Push ditekan.', 'ready');
    });
    document.addEventListener('planetbintang:file-selected', event => updateSelectedTarget(event.detail));
    $('#fileRepoSelect')?.addEventListener('change', () => {
      if ($('#fileRepoSelect').value) ui.repo.value = $('#fileRepoSelect').value;
      const repo = (window.PBSystemSnapshot?.data?.repositories || []).find(item => item.fullName === ui.repo.value);
      if (repo?.branch) ui.branch.value = repo.branch;
    });
    status('GitHub Push siap. File Manager hanya memuat metadata; klik “Muat dari GitHub” untuk mengambil isi kode.', 'ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
  window.PBGitHubPush = { load: loadRemote, push: () => pushNow(false) };
})();