(() => {
  'use strict';
  // ==========================================================================
  // ENTERPRISE MAP LIST · Hyper-Enterprise Master Registry
  // Platform manajemen siklus hidup perangkat lunak (DevOps & Git Platform)
  // 20 arsitektur inti · 10.000 menu/fitur hierarkis · lazy-load per shard.
  // Skema mengikuti kontrak tabel SQL: system_menus + system_menu_descriptions
  // ==========================================================================

  const $ = (selector, root = document) => root.querySelector(selector);
  const fmt = new Intl.NumberFormat('id-ID');

  // 10 ARSITEKTUR INTI — DEVOPS & GIT PLATFORM (menu 0..4999)
  const DEVOPS_ARCHITECTURES = [
    ['core-code', '🌐 Core Code Management & Repositories', 'Manajemen kode sumber, commit, cabang, rilis, dan tata kelola repositori', [
      ['Code > Files', 'Pohon kode sumber, blame, riwayat warna'], ['Code > Commits', 'Registri perubahan + tanda tangan GPG'],
      ['Code > Branches', 'Matriks cabang, stale cleanup, ahead/behind'], ['Code > Tags & Releases', 'SemVer, arsip, changelog'],
      ['Code > Forks', 'Sinkronisasi hulu, kontribusi eksternal'], ['Pull Requests > Open', 'Review baris kode, reviewer'],
      ['Pull Requests > Drafts', 'Kerja awal tanpa notifikasi CI'], ['Pull Requests > Merged & Closed', 'Arsip merge, analisis konflik'],
      ['Pull Requests > Review Requests', 'Antrian personal via Code Owners'], ['Branch Protection Rules', 'Wajib approve, blok force push'],
      ['Code Owners', 'Auto-assign peninjau per pola direktori'], ['Repository Templates', 'Cetak biru standarisasi proyek'],
    ]],
    ['project-management', '🐛 Project Management & Issue Tracking', 'Pelacakan tugas, isu, papan agile, dan forum ide', [
      ['Issues > Active', 'Bug terbuka, label prioritas, penugasan'], ['Issues > Templates', 'Form bug tervalidasi'],
      ['Issues > Custom Fields', 'Impacted Version, Customer Tier'], ['Projects > Kanban Boards', 'Kolom + automasi status kartu'],
      ['Projects > Sprints & Backlogs', 'Story points, beban tim'], ['Projects > Milestones', 'Target tanggal rilis'],
      ['Projects > Roadmaps', 'Gantt lintas tim'], ['Discussions > General', 'Forum, pengumuman, polls'],
      ['Discussions > Ideas', 'Proposal fitur + upvoting'],
    ]],
    ['cicd-deployment', '🚀 CI/CD Automation & Deployment Pipelines', 'Orkestrasi workflow, runner, dan kontrol lingkungan rilis', [
      ['Actions > Workflow Runs', 'DAG, log konsol real-time'], ['Actions > Workflow Builders', 'Editor GUI + YAML'],
      ['Actions > Schedules', 'Pemicu cron berkala'], ['Runners > Self-Hosted', 'Klaster mesin organisasi'],
      ['Runners > Hosted Pools', 'VM otomatis dari platform'], ['Runners > Autoscaling Groups', 'Skala ikut antrean job'],
      ['Environments > Staging', 'Gerbang approval, secret uji'], ['Environments > Production', 'Proteksi + review ganda'],
      ['Environments > Deployments History', 'Registri versi + one-click rollback'],
    ]],
    ['security-compliance', '🔒 Security, Compliance & Privacy', 'Pemindaian otomatis, kunci identitas, dan kepatuhan', [
      ['Security > Code Scanning', 'SAST celah pola kode'], ['Security > Dependabot Alerts', 'Kerentanan pihak ketiga + patch'],
      ['Security > Secret Scanning', 'Deteksi bocor API key/token'], ['Security > GPG Keys', 'Verifikasi tanda tangan commit'],
      ['Security > SSH Keys', 'Kredensial akses repositori'], ['Security > Personal Access Tokens', 'Token berlingkup terbatas'],
      ['Compliance > Security Policies', 'Aturan wajib seluruh repo'], ['Compliance > Advisory Database', 'Ancaman internal + mitigasi'],
    ]],
    ['artifacts-packages', '📦 Artifacts & Package Registry', 'Penyimpanan artefak kompilasi dan optimasi ruang', [
      ['Packages > Container Registry', 'Docker images & OCI artifacts'], ['Packages > npm/Yarn Registry', 'Pustaka JS/TS internal'],
      ['Packages > Maven/NuGet/Python', 'Paket Java, .NET, Python'], ['Storage > Retention Policies', 'Auto-hapus paket lawas'],
      ['Storage > Artifact Downloads', 'Log unduhan aset biner'],
    ]],
    ['data-insights', '📊 Data Analytics & Insights', 'Metrik produktivitas dan operasional sistem', [
      ['Insights > Contribution Graph', 'Matriks intensitas kontribusi'], ['Insights > Code Velocity', 'Kode → produksi'],
      ['Insights > Dependency Graph', 'Peta keterkaitan pustaka'], ['Insights > Traffic', 'Kunjungan, klon, referrer'],
      ['Insights > Network', 'Git graph lintas forks'],
    ]],
    ['organization-access', '👥 Organization & Access Control', 'Keanggotaan, tim, peran, dan direktori enterprise', [
      ['Organization > Members', 'Undangan + 2FA'], ['Organization > Teams', 'Frontend Team, QA Team'],
      ['Organization > Roles & Permissions', 'Peran kustom di luar Admin/Write/Read'], ['Access > SAML/SSO', 'Azure AD, Okta'],
      ['Access > SCIM Provisioning', 'Auto akun ikut data kepegawaian'],
    ]],
    ['settings-integrations', '⚙️ System Settings & Integrations', 'Ekstensi aplikasi dan kustomisasi sistem', [
      ['Settings > Marketplaces', 'Galeri aplikasi terverifikasi'], ['Settings > Installed Apps', 'Izin akses data aplikasi'],
      ['Settings > Webhooks', 'Event HTTP POST eksternal'], ['Settings > General', 'Verified domains, profil publik'],
      ['Settings > Interaction Limits', 'Pembatasan komentar anti-spam'],
    ]],
    ['audit-monitoring', '🧾 Auditing, Logging & Monitoring', 'Ketertelusuran dan pemantauan sistem', [
      ['Audit Logs > Security Events', 'Login, sandi, eskalasi admin'], ['Audit Logs > Data Export', 'CSV/JSON untuk audit eksternal'],
      ['Audit Logs > Streaming', 'SIEM: Splunk, Datadog'],
    ]],
    ['billing-quotas', '💳 Billing & Resource Quotas', 'Langganan, pusat biaya, dan kuota sumber daya', [
      ['Billing > Subscriptions', 'Lisensi per pengguna'], ['Billing > Cost Analysis', 'Pengeluaran per proyek/tim'],
      ['Quotas > Storage', 'Batas ruang repo + paket'], ['Quotas > Compute Minutes', 'Kuota menit CI/CD'],
      ['Quotas > API Rate Limits', 'Ambang panggilan API/jam'],
    ]],
  ];

  // 10 ARSITEKTUR HYPER-ENTERPRISE (menu 5000..9999)
  const HYPER_ARCHITECTURES = [
    ['domain-dns-engine', '🌍 Architecture 1 · Domain Lifecycle & DNS Engine', 'Registrasi domain aktif + Anycast DNS (rentang 1–500)', [
      ['Domain > Availability', 'Bulk check 500 domain TLD'], ['Domain > Premium Brokerage', 'Negosiasi, escrow, premium'],
      ['Domain > Auto-Renewal Matrix', 'Grace period + redemption'], ['Domain > Privacy & WHOIS Proxy', 'Masking kontak legal'],
      ['Domain > Registrar Lock & Transfer', 'EPP code handshake'], ['DNS > Zone File Editor', 'A AAAA CNAME MX TXT SRV CAA'],
      ['DNS > GeoDNS', 'Routing benua/negara/kota'], ['DNS > Latency-Based', 'Ping tercepat'],
      ['DNS > Failover', 'Alih IP saat downtime'], ['DNS > DNSSEC', 'KSK/ZSK + record DS'],
      ['DNS > TTL Customization', '30 detik s.d. standar'], ['DNS > Dynamic DNS DDNS', 'Update IP dinamis'],
    ]],
    ['hosting-ip-infra', '🖥️ Architecture 2 · Hosting & IP Infrastructure', 'Provisioning VM/bare metal + IPAM (501–1000)', [
      ['Compute > Instances', 'VM Ubuntu/CentOS/Debian/Windows'], ['Compute > Bare Metal', 'Server fisik + RAID remote'],
      ['Compute > Auto-Scaling', 'Skala CPU/RAM/request'], ['Compute > Snapshots & Backups', 'AES-256, replikasi region'],
      ['IPAM > IPv4/IPv6 Subnets', '/24 /28 /48 /64 + konflik'], ['IPAM > Floating IPs', 'Alih IP detik tanpa downtime'],
      ['IPAM > Reverse DNS rDNS', 'PTR reputasi email'], ['IPAM > BGP Anycast', 'Siarkan IP multi-DC global'],
      ['Host > Nginx/Apache/Caddy', 'GUI reverse proxy vhost'], ['Host > PHP/Node.js/Python Manager', 'Runtime + memory_limit'],
      ['Host > Database Clusters', 'MySQL/Postgres/Mongo master-slave'],
    ]],
    ['hyper-monitoring', '📡 Architecture 3 · Hyper-Monitoring & Observability', 'Uptime, metrik agen, APM (1001–1500)', [
      ['Monitoring > Ping/ICMP', '50+ checkpoint global'], ['Monitoring > HTTP/HTTPS Status', '200/4xx/5xx + string'],
      ['Monitoring > SSL/TLS Expiry', 'H-30, H-7, H-1'], ['Monitoring > Port Scanner', '22 80 443 3306 ilegal'],
      ['Metrics > OS Telemetry', 'CPU RAM Swap'], ['Metrics > Disk I/O & Inodes', 'Baca/tulis + inode habis'],
      ['Metrics > Network Throughput', 'Ingress/egress lonjakan'], ['APM > Distributed Tracing', 'Microservices HTTP'],
      ['APM > Database Query Profiling', 'Slow queries'], ['APM > Error Exception Log', 'Stack trace grouping'],
    ]],
    ['edge-security-waf', '🛡️ Architecture 4 · Content Control & Edge Security', 'CDN, WAF, DDoS (1501–2000)', [
      ['CDN > Edge Caching', 'Cache per ekstensi/header/cookie'], ['CDN > Cache Purging', 'Purge All / URL / Tag'],
      ['CDN > Asset Optimization', 'WebP/Avif + minifikasi edge'], ['WAF > OWASP Top 10', 'SQLi XSS RCE'],
      ['WAF > Custom Rules Engine', 'User-Agent + geo block'], ['WAF > Rate Limiting', 'Req/IP/menit'],
      ['DDoS > Layer 3/4 Scrubbing', 'Scrubbing Center global'], ['DDoS > Layer 7 Challenge', 'JS sandbox / CAPTCHA'],
    ]],
    ['content-moderation-cms', '📝 Architecture 5 · Content Moderation & CMS', 'Filter otomatis, UGC, SEO (2001–2500)', [
      ['Moderation > Keyword Blacklist', 'Regex KTP/kartu kredit'], ['Moderation > AI Image Recognition', 'Eksplisit/kekerasan/copyright'],
      ['Moderation > Video Stream Audit', 'Frame-by-frame realtime'], ['UGC > File Upload Sanitize', 'Karantina, EXIF, malware'],
      ['UGC > Comment Moderation', 'Auto-approve/hold/delete'], ['SEO > Robots.txt Generator', 'Googlebot/Bingbot'],
      ['SEO > Sitemap Orchestrator', 'XML auto-update'],
    ]],
    ['alerting-incident', '🔔 Architecture 6 · Alerting & Incident Response', 'Rute alert, eskalasi, war room (2501–3000)', [
      ['Alerts > Channels', 'Webhook Telegram Slack WA SMS Voice-AI'], ['Alerts > Escalation Policies', 'SLA respons 15 menit'],
      ['Alerts > On-Call Scheduling', 'Shift backend/DevOps'], ['Incident > War Room Creation', 'Kanal darurat + TTR'],
      ['Incident > Post-Mortem Templates', 'RCA pasca-insiden'],
    ]],
    ['iam-enterprise', '👤 Architecture 7 · Identity & Access Management', 'Multi-tenant RBAC + SSO (3001–3500)', [
      ['IAM > RBAC', 'DNS Manager, Billing Admin, Auditor'], ['IAM > Policy Simulator', 'Uji izin sebelum apply'],
      ['Auth > Multi-Factor MFA', 'TOTP YubiKey Passkeys'], ['Auth > Directory Sync', 'SAML OIDC Okta AD'],
      ['Auth > Session Hijack Protection', 'Browser fingerprinting'],
    ]],
    ['storage-compliance', '🗄️ Architecture 8 · Data Storage & Compliance', 'Object storage + immutable audit (3500–4000)', [
      ['Storage > S3-Compatible Buckets', 'Server-side encryption'], ['Storage > Lifecycle Policies', 'Cold/Glacier mode'],
      ['Audit > Immutable Logs', 'WORM tak bisa dihapus root'], ['Audit > Log Streaming', 'Splunk Elastic Datadog'],
    ]],
    ['billing-metering', '🧮 Architecture 9 · Billing, Metering & Provisioning', 'Pay-per-use + kontrol anggaran (4001–4500)', [
      ['Billing > Pay-As-You-Go Tracker', 'RAM/CDN/DNS per detik'], ['Billing > Invoicing & Tax Ledger', 'PPN + multi-mata uang'],
      ['Billing > Budget Threshold Alerts', 'Stop otomatis lewat budget'],
    ]],
    ['developer-marketplace', '🧩 Architecture 10 · Marketplace & Dev Ecosystem', 'API engine + portal plugin (4501–5000)', [
      ['Developer > API Reference & Keys', 'Scopes + throttling'], ['Developer > Webhook Event Streams', '200+ events'],
      ['Marketplace > Plugin Management', 'Instal ekstensi pihak ketiga'],
    ]],
  ];

  const ALL_ARCHITECTURES = [...DEVOPS_ARCHITECTURES, ...HYPER_ARCHITECTURES];
  const MENUS_PER_ARCH = 500;
  const SUBMODULE_SUFFIXES = ['Console', 'Matrix', 'Ledger', 'Scheduler', 'Policy Engine', 'Dashboard', 'API Bridge', 'Audit Trail', 'Health Probe', 'Config Drift Guard', 'Replication Mesh'];

  // ---- Deterministic registry mirror of scripts/generate_enterprise_map.py ----
  function menuAt(index) {
    const archIndex = Math.floor(index / MENUS_PER_ARCH);
    const slot = index % MENUS_PER_ARCH;
    const isHyper = archIndex >= 10;
    const [slug, name, , features] = ALL_ARCHITECTURES[archIndex];
    const [featureName, shortDesc] = features[slot % features.length];
    const generation = Math.floor(slot / features.length);
    let menuName; let sub = false;
    if (generation === 0) {
      menuName = `${name.split('·').pop().trim().split(' & ')[0]} · ${featureName}`;
    } else {
      const module = SUBMODULE_SUFFIXES[(generation - 1) % SUBMODULE_SUFFIXES.length];
      const variant = Math.floor((generation - 1) / SUBMODULE_SUFFIXES.length) + 1;
      menuName = `${featureName} · ${module} #${String(variant).padStart(2, '0')}`;
      sub = true;
    }
    const code = isHyper ? `HYPER-A${String(archIndex - 9).padStart(2, '0')}-${String(slot + 1).padStart(3, '0')}` : `DEVOPS-${String(index).padStart(4, '0')}`;
    const leaf = (featureName.includes(' > ') ? featureName.split(' > ').pop() : featureName).toLowerCase().replace(/\//g, '-').replace(/ /g, '-');
    const routePath = isHyper ? `/hyper/${slug}/${leaf}-${String(slot + 1).padStart(3, '0')}` : `/enterprise/${slug}/${String(slot + 1).padStart(3, '0')}`;
    return {
      id: index + 1, menu_code: code, architecture_group: name, architecture_slug: slug,
      architecture_index: archIndex + 1, parent_id: sub ? archIndex * MENUS_PER_ARCH : null,
      menu_name: menuName, route_path: routePath, is_active: true, language_code: 'id',
      short_description: shortDesc, tier: isHyper ? 'hyper-enterprise' : 'devops-core',
    };
  }

  const state = { manifest: null, query: '', architecture: 'all', tier: 'all', selected: null, visibleLimit: 150, totalMenuCount: 10000 };

  async function loadManifest() {
    try {
      const response = await fetch('./data/enterprise-map-manifest.json', { cache: 'no-cache', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.manifest = await response.json();
      state.totalMenuCount = Number(state.manifest.totalMenuCount || 10000);
    } catch {
      state.manifest = null; // fallback deterministik lokal
    }
  }

  function matches(menu) {
    const q = state.query.trim().toLocaleLowerCase('id');
    if (state.architecture !== 'all' && menu.architecture_slug !== state.architecture) return false;
    if (state.tier !== 'all' && menu.tier !== state.tier) return false;
    if (!q) return true;
    return `${menu.menu_code} ${menu.menu_name} ${menu.architecture_group} ${menu.route_path} ${menu.short_description}`.toLocaleLowerCase('id').includes(q);
  }

  function searchMenus(limit = state.visibleLimit) {
    const found = [];
    for (let index = 0; index < state.totalMenuCount && found.length < limit; index += 1) {
      const menu = menuAt(index);
      if (matches(menu)) found.push(menu);
    }
    return found;
  }

  function countMatches() {
    let count = 0;
    for (let index = 0; index < state.totalMenuCount; index += 1) if (matches(menuAt(index))) count += 1;
    return count;
  }

  // ---- Render halaman Enterprise Map ----
  function renderPage() {
    const root = $('#enterpriseMapContent');
    if (!root) return;
    root.replaceChildren();

    const head = document.createElement('div');
    head.className = 'emap-head';
    head.innerHTML = `
      <p class="eyebrow">HYPER-ENTERPRISE MAP <span>/</span> MASTER REGISTRY</p>
      <h2>Enterprise Map List · ${fmt.format(state.totalMenuCount)} Menu Fungsional</h2>
      <p class="section-description">Hierarki 20 arsitektur inti untuk mengelola ribuan sub-menu, konfigurasi, dan modul dalam satu ekosistem DevOps, Git Platform, Domain, Hosting, Monitoring, WAF/CDN, Moderasi Konten, IAM, Storage, Billing, dan Marketplace.</p>`;
    root.append(head);

    const stats = document.createElement('div');
    stats.className = 'emap-stats';
    stats.innerHTML = `
      <div><b>${fmt.format(state.totalMenuCount)}</b><small>Total menu registry</small></div>
      <div><b>${ALL_ARCHITECTURES.length}</b><small>Arsitektur inti</small></div>
      <div><b>${fmt.format(DEVOPS_ARCHITECTURES.length * MENUS_PER_ARCH)}</b><small>Menu DevOps & Git</small></div>
      <div><b>${fmt.format(HYPER_ARCHITECTURES.length * MENUS_PER_ARCH)}</b><small>Menu Hyper-Enterprise</small></div>
      <div><b>${state.manifest ? 'Shard JSON' : 'Fallback lokal'}</b><small>Sumber manifest</small></div>`;
    root.append(stats);

    const controls = document.createElement('div');
    controls.className = 'emap-controls panel';
    controls.innerHTML = `
      <label class="search-box"><span aria-hidden="true">⌕</span><input id="emapSearch" type="search" placeholder="Cari menu, kode (DNS-FAIL-01), rute…" autocomplete="off" aria-label="Cari enterprise menu" /></label>
      <select id="emapArch" aria-label="Filter arsitektur"><option value="all">Semua arsitektur</option></select>
      <select id="emapTier" aria-label="Filter tier"><option value="all">Semua tier</option><option value="devops-core">DevOps Core (1–10)</option><option value="hyper-enterprise">Hyper-Enterprise (11–20)</option></select>
      <button type="button" class="workspace-primary" id="emapPaletteBtn">⌘ Command Palette</button>
      <span id="emapCount" class="emap-count"></span>`;
    root.append(controls);
    const archSelect = $('#emapArch', controls);
    ALL_ARCHITECTURES.forEach(([slug, name]) => archSelect.add(new Option(name, slug)));

    const grid = document.createElement('div');
    grid.className = 'emap-arch-grid';
    ALL_ARCHITECTURES.forEach(([slug, name, description, features], index) => {
      const card = document.createElement('article');
      card.className = `emap-arch-card ${index >= 10 ? 'emap-arch-hyper' : 'emap-arch-devops'}`;
      card.innerHTML = `<header><span class="emap-arch-index">A${String(index + 1).padStart(2, '0')}</span><b>${name}</b><small>${fmt.format(MENUS_PER_ARCH)} menu · rentang ${fmt.format(index * MENUS_PER_ARCH + 1)}–${fmt.format((index + 1) * MENUS_PER_ARCH)}</small></header>
        <p>${description}</p>
        <ul>${features.slice(0, 5).map(([fn, fd]) => `<li><b>${fn}</b><small>${fd}</small></li>`).join('')}
        ${features.length > 5 ? `<li class="emap-more">+${features.length - 5} sub-menu lain…</li>` : ''}</ul>
        <button type="button" data-arch="${slug}">Telusuri arsitektur →</button>`;
      card.querySelector('button').addEventListener('click', () => {
        state.architecture = slug; archSelect.value = slug; renderResults();
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      grid.append(card);
    });
    root.append(grid);

    const results = document.createElement('section');
    results.className = 'emap-results panel';
    results.id = 'emapResults';
    results.innerHTML = '<h3>Hasil Registry <small>system_menus · lazy scan</small></h3><div id="emapList" class="emap-list" role="list"></div>';
    root.append(results);

    const inspector = document.createElement('aside');
    inspector.className = 'emap-inspector';
    inspector.id = 'emapInspector';
    inspector.innerHTML = '<p class="workspace-empty">Pilih satu menu registry untuk melihat baris <code>system_menus</code> + <code>system_menu_descriptions</code>, rute URL, instruksi sistem, dan jalur filesystem virtualnya.</p>';
    root.append(inspector);

    $('#emapSearch').addEventListener('input', (event) => { state.query = event.target.value; renderResults(); });
    archSelect.addEventListener('change', (event) => { state.architecture = event.target.value; renderResults(); });
    $('#emapTier').addEventListener('change', (event) => { state.tier = event.target.value; renderResults(); });
    $('#emapPaletteBtn').addEventListener('click', openPalette);

    renderResults();
  }

  function selectMenu(menu) {
    state.selected = menu;
    const inspector = $('#emapInspector');
    if (!inspector) return;
    const fsPath = `sys/enterprise/${menu.architecture_slug}/menu-${String(menu.id).padStart(5, '0')}.json`;
    inspector.innerHTML = `
      <h4>${menu.menu_code}</h4>
      <b class="emap-inspect-name">${menu.menu_name}</b>
      <div class="emap-inspect-data">
        <div><b>ID</b><span>${menu.id}</span></div>
        <div><b>Arsitektur</b><span>${menu.architecture_group}</span></div>
        <div><b>Tier</b><span>${menu.tier}</span></div>
        <div><b>Parent ID</b><span>${menu.parent_id === null ? 'NULL (menu utama)' : menu.parent_id + 1}</span></div>
        <div><b>Route Path</b><span>${menu.route_path}</span></div>
        <div><b>Status</b><span>${menu.is_active ? 'AKTIF' : 'NONAKTIF'}</span></div>
        <div><b>Bahasa</b><span>${menu.language_code}</span></div>
        <div><b>Registry file</b><span>./data/enterprise-menus/menu-${String(menu.id).padStart(5, '0')}.json</span></div>
        <div><b>Virtual FS</b><span>/${fsPath}</span></div>
      </div>
      <p><strong>Fungsi komponen UI:</strong> ${menu.short_description}</p>
      <p><strong>Instruksi sistem:</strong> Mengirim peristiwa ke bus internal untuk modul turunan '${menu.menu_name}'; validasi terhadap kebijakan organisasi sebelum eksekusi worker regional.</p>
      <div class="emap-inspect-actions">
        <button type="button" class="workspace-secondary" id="emapOpenFs">Lihat di File Manager</button>
        <button type="button" class="workspace-secondary" id="emapSimulate">Simulasikan Handler Aman</button>
      </div>
      <output id="emapInspectStatus" class="emap-status"></output>`;
    $('#emapOpenFs').addEventListener('click', () => {
      window.PBSystemNavigation?.navigate('file-manager');
      window.PBFileManager?.setPath(fsPath.split('/').slice(1).join('/'));
    });
    $('#emapSimulate').addEventListener('click', () => {
      $('#emapInspectStatus').textContent = `✓ Simulasi aman berjalan · handler '${menu.menu_code}' status ready · tidak ada kode yang dieksekusi terhadap provider nyata.`;
    });
  }

  function renderResults() {
    const list = $('#emapList');
    if (!list) return;
    list.replaceChildren();
    const found = searchMenus();
    const countEl = $('#emapCount');
    if (countEl) countEl.textContent = `${fmt.format(countMatches())} menu cocok · tampil ${fmt.format(found.length)}`;
    found.forEach((menu) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `emap-row ${menu.tier === 'hyper-enterprise' ? 'emap-row-hyper' : ''}`;
      row.setAttribute('role', 'listitem');
      row.innerHTML = `<span class="emap-row-code">${menu.menu_code}</span><span class="emap-row-main"><b>${menu.menu_name}</b><small>${menu.architecture_group} · ${menu.route_path}</small></span><span class="emap-row-tier">${menu.tier === 'hyper-enterprise' ? 'HYPER' : 'DEVOPS'}</span>`;
      row.addEventListener('click', () => selectMenu(menu));
      list.append(row);
    });
    if (!found.length) list.append(Object.assign(document.createElement('p'), { className: 'workspace-empty', textContent: 'Tidak ada menu sesuai filter pencarian.' }));
  }

  // ---- Command Palette (pencarian cepat ribuan menu) ----
  function openPalette() {
    let dialog = $('#emapPaletteDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'emapPaletteDialog';
      dialog.className = 'emap-palette';
      dialog.innerHTML = `
        <div class="emap-palette-inner">
          <input id="emapPaletteInput" type="search" placeholder="⌘ Ketik nama menu / kode / rute enterprise…" autocomplete="off" aria-label="Command palette enterprise map" />
          <div id="emapPaletteList" class="emap-palette-list" role="listbox"></div>
          <footer><small>Enter buka inspektor · Esc tutup · sumber: system_menus registry</small><button type="button" id="emapPaletteClose">Tutup</button></footer>
        </div>`;
      document.body.append(dialog);
      $('#emapPaletteClose', dialog).addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
      const input = $('#emapPaletteInput', dialog);
      input.addEventListener('input', () => { state.query = input.value; renderPaletteResults(dialog); renderResults(); });
    }
    dialog.showModal();
    $('#emapPaletteInput', dialog).focus();
    renderPaletteResults(dialog);
  }

  function renderPaletteResults(dialog) {
    const list = $('#emapPaletteList', dialog);
    if (!list) return;
    list.replaceChildren();
    searchMenus(40).forEach((menu) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.innerHTML = `<b>${menu.menu_name}</b><small>${menu.menu_code} · ${menu.route_path}</small>`;
      item.addEventListener('click', () => { dialog.close(); selectMenu(menu); $('#emapResults')?.scrollIntoView({ behavior: 'smooth' }); });
      list.append(item);
    });
    if (!list.children.length) list.append(Object.assign(document.createElement('p'), { textContent: 'Tidak ditemukan.' }));
  }

  function render() {
    renderPage();
  }

  async function init() {
    await loadManifest();
    if ($('#enterpriseMapContent')) render();
  }

  window.PBEnterpriseMap = { render, menuAt, architectures: ALL_ARCHITECTURES, openPalette };
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})();
