(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const output = $('#shellOutput');
  const panel = $('#shellPanel');
  let snapshot = null;

  const number = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));
  const safeText = (value) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 900);
  const writeLine = (value, type = 'result') => {
    const line = document.createElement('div');
    line.className = `shell-line ${type}`;
    line.textContent = safeText(value);
    output.append(line);
    output.scrollTop = output.scrollHeight;
  };
  const repoByName = (query) => {
    if (!snapshot || !query) return null;
    const key = query.toLocaleLowerCase('id');
    return snapshot.repositories.find((repo) => (repo.fullName || '').toLocaleLowerCase('id') === key)
      || snapshot.repositories.find((repo) => (repo.name || '').toLocaleLowerCase('id') === key)
      || null;
  };
  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return '';
      if (url.hostname !== 'github.com' && !Object.prototype.hasOwnProperty.call(snapshot?.domainMap || {}, url.hostname)) return '';
      return url.href;
    } catch { return ''; }
  };
  const showHelp = () => [
    'Perintah aman yang tersedia:',
    '  help                       daftar perintah',
    '  status                     ringkasan root dan sinkronisasi',
    '  list                       daftar nama repo dan visibility',
    '  search <teks>              filter kartu repositori',
    '  open <nama-repo>           buka Pages atau repo GitHub',
    '  hosts                      daftar host dan DNS publik',
    '  run repo-summary           ringkasan 45 repo',
    '  run pages-audit            repo dengan Pages aktif',
    '  run dns-map                peta host → IP publik',
    '  run traffic-summary        trafik repo agregat 14 hari',
    '  run root-map <nama-repo>   daftar root aman tingkat atas',
    '  clear                      kosongkan keluaran shell',
    '  close                      tutup shell',
    'Catatan: shell ini hanya menjalankan tugas allowlist baca-saja; tidak ada shell OS, eval, file write, atau eksekusi kode repo.'
  ].forEach((line) => writeLine(line));

  const scripts = {
    'repo-summary': () => {
      if (!snapshot) return 'Snapshot belum termuat.';
      return [`Root: ${snapshot.root || '.'} / ${snapshot.connector?.owner || 'planetbintang'}`,
        `Repositori: ${number(snapshot.repositoryCount)} · Publik: ${number(snapshot.publicCount)} · Privat: ${number(snapshot.privateCount)}`,
        `GitHub Pages terdeteksi: ${number(snapshot.pagesEnabledCount)}`,
        `SHA-256 data: ${snapshot.dataSha256 || '—'}`,
        `Snapshot: ${snapshot.updatedAt || '—'}`];
    },
    'pages-audit': () => {
      if (!snapshot) return 'Snapshot belum termuat.';
      const pages = snapshot.repositories.filter((repo) => repo.pagesEnabled || repo.pagesUrl);
      return pages.length ? [`Pages aktif/terdeteksi: ${pages.length}`, ...pages.map((repo) => `${repo.fullName} → ${repo.pagesUrl || repo.homepage || 'URL belum tersedia'}`)] : 'Tidak ada repo Pages aktif.';
    },
    'dns-map': () => {
      if (!snapshot) return 'Snapshot belum termuat.';
      const hosts = Object.entries(snapshot.domainMap || {});
      return hosts.length ? hosts.map(([host, info]) => `${host} → ${(info.addresses || []).join(', ') || 'DNS tidak tersedia'}`) : 'Peta DNS kosong.';
    },
    'traffic-summary': () => {
      if (!snapshot) return 'Snapshot belum termuat.';
      let views = 0, viewRepos = 0, clones = 0, cloneRepos = 0;
      for (const repo of snapshot.repositories) {
        const t = repo.traffic14d;
        if (t?.views) { views += Number(t.views.count || 0); viewRepos++; }
        if (t?.clones) { clones += Number(t.clones.count || 0); cloneRepos++; }
      }
      return [`Trafik repositori GitHub hingga 14 hari (bukan trafik Pages):`, `Views agregat: ${number(views)} pada ${viewRepos} repo.`, `Clones agregat: ${number(clones)} pada ${cloneRepos} repo.`, `Tidak memuat nama anggota atau identitas pengunjung.`];
    },
    'root-map': (repoName) => {
      const repo = repoByName(repoName);
      if (!repo) return `Repo tidak ditemukan: ${repoName || '(nama belum diisi)'}`;
      const items = (repo.rootItems || []).map((item) => `${item.type === 'folder' ? 'dir ' : 'file'}  ${item.name}`);
      return [`Root ./${repo.name} · ${items.length} item aman tingkat atas:`, ...(items.length ? items : ['(kosong atau tidak ada item aman)'])];
    }
  };

  function runCommand(raw) {
    const command = raw.trim();
    if (!command) return;
    writeLine(`. > ${command}`, 'command');
    const [verbRaw, ...parts] = command.split(/\s+/);
    const verb = verbRaw.toLowerCase();
    const rest = parts.join(' ').trim();
    if (verb === 'clear') { output.replaceChildren(); return; }
    if (verb === 'close' || verb === 'exit') { panel.hidden = true; $('#shellButton').setAttribute('aria-expanded', 'false'); return; }
    if (verb === 'help') { showHelp(); return; }
    if (!snapshot && verb !== 'help') { writeLine('Snapshot masih dimuat. Coba lagi sebentar.', 'error'); return; }
    if (verb === 'status') {
      writeLine(`Root . / ${snapshot.connector?.owner || 'planetbintang'} · ${snapshot.repositoryCount} repo · snapshot ${snapshot.updatedAt || '—'} · anggota/visitor data tersembunyi.`);
      return;
    }
    if (verb === 'list') {
      snapshot.repositories.forEach((repo) => writeLine(`${repo.visibility || 'unknown'}  ${repo.fullName}  [${repo.appType || 'app'}]`));
      return;
    }
    if (verb === 'search') {
      if (!rest) { writeLine('Gunakan: search <teks>', 'error'); return; }
      $('#searchInput').value = rest;
      $('#searchInput').dispatchEvent(new Event('input', { bubbles: true }));
      $('#repositories').scrollIntoView({ behavior: 'smooth', block: 'start' });
      writeLine(`Kartu difilter: ${rest}`);
      return;
    }
    if (verb === 'open') {
      const repo = repoByName(rest);
      if (!repo) { writeLine(`Repo tidak ditemukan: ${rest || '(nama belum diisi)'}`, 'error'); return; }
      const url = safeUrl(repo.pagesUrl || repo.homepage) || safeUrl(repo.url);
      if (!url) { writeLine('URL aman untuk repo ini tidak tersedia.', 'error'); return; }
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) writeLine(`Popup diblokir. Buka tautan repo dari kartu: ${url}`, 'error');
      else writeLine(`Membuka ${repo.fullName}; login GitHub mungkin diperlukan untuk repo privat.`);
      return;
    }
    if (verb === 'hosts') {
      Object.entries(snapshot.domainMap || {}).forEach(([host, info]) => writeLine(`${host} → ${(info.addresses || []).join(', ') || 'DNS tidak tersedia'}`));
      return;
    }
    if (verb === 'run') {
      const [scriptName, ...args] = parts;
      const script = scripts[(scriptName || '').toLowerCase()];
      if (!script) { writeLine(`Skrip tidak ada dalam allowlist. Jalankan 'help'. Kode yang diketik tidak dieksekusi.`, 'error'); return; }
      const result = script(args.join(' '));
      (Array.isArray(result) ? result : [result]).forEach((line) => writeLine(line));
      return;
    }
    writeLine(`Perintah tidak dikenal: ${verbRaw}. Tidak ada kode yang dijalankan; gunakan 'help'.`, 'error');
  }

  $('#shellButton').addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    $('#shellButton').setAttribute('aria-expanded', String(open));
    if (open) $('#shellInput').focus();
  });
  $('#shellClose').addEventListener('click', () => {
    panel.hidden = true;
    $('#shellButton').setAttribute('aria-expanded', 'false');
  });
  $('#shellForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('#shellInput');
    runCommand(input.value);
    input.value = '';
    input.focus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      panel.hidden = true;
      $('#shellButton').setAttribute('aria-expanded', 'false');
    }
  });
  writeLine('Planetbintang Root Shell · browser safe mode', 'system');
  writeLine("Ketik 'help'. Hanya perintah allowlist baca-saja yang berjalan; shell OS/kode bebas tidak tersedia di GitHub Pages.", 'system');
  fetch('./data/repositories.json', { credentials: 'omit', cache: 'no-cache' }).then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then((data) => { snapshot = data; writeLine(`Snapshot siap: ${number(data.repositoryCount)} repo.`, 'system'); })
    .catch(() => writeLine('Snapshot tidak dapat dimuat; gunakan dashboard utama.', 'error'));
})();
