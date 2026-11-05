(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const services = [
    ['Domain & Registrar', 'Pendaftaran, transfer, portofolio, ekstensi, reseller.', '◉', /domain|registr|vendor|reseller|ekstensi|tld/i],
    ['DNS & Network', 'Zona DNS, nameserver, routing, propagasi, jaringan.', '⌁', /dns|nameserver|routing|url|network/i],
    ['Compute & Hosting', 'Proyek hosting, runtime, server, deployment, scaling.', '▣', /hosting|server|runtime|deployment|build|ci\/cd/i],
    ['Storage & Database', 'Database, file, backup, media, arsip, pemulihan.', '▤', /database|file|media|backup|penyimpanan/i],
    ['Security & Identity', 'TLS, SSL, IAM, pengguna, akses, audit, firewall.', '⬡', /ssl|keamanan|akses|pengguna|autentikasi|firewall|kepatuhan/i],
    ['API & Integration', 'API gateway, key, webhook, SDK, konektor.', '⌘', /api|integrasi|webhook|plugin|sdk/i],
    ['Web & CMS', 'Penerbitan, konten, CMS, SEO, editor situs.', '▧', /situs|cms|konten|seo|penerbit|artikel/i],
    ['AI & Automation', 'Asisten, workflow, otomasi, rekomendasi AI.', '✧', /ai|otomasi|workflow|otomatisasi/i],
    ['Observability', 'Monitoring, log, analitik, uptime, performa.', '◌', /monitor|analitik|trafik|log|statistik|uptime/i],
    ['Billing & Governance', 'Paket, transaksi, billing, kebijakan, laporan.', '＄', /tagihan|billing|perdagangan|transaksi|laporan/i],
  ];

  let features = [];
  let selectedService = '';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

  function featureHref(feature) {
    let target = String(feature.detailPath || '').trim();
    if (target.endsWith('/')) target += 'index.html';
    else if (/\.reic$/i.test(target)) target = target.replace(/\.reic$/i, '.html');
    return `../features/${target}`;
  }

  function normalizeApiBase() {
    try {
      const value = localStorage.getItem('vd-portal-api') || '';
      if (!value) return '';
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return '';
      return url.href.replace(/\/+$/, '');
    } catch {
      return '';
    }
  }

  function updateBackendStatus(label, detail) {
    const status = $('#backend');
    status.textContent = label;
    status.title = detail;
    status.setAttribute('aria-label', `${label}. ${detail}`);
  }

  async function checkBackend() {
    const apiBase = normalizeApiBase();
    if (!apiBase) {
      updateBackendStatus('TIDAK DIKONFIGURASI', 'Atur URL backend HTTPS tepercaya dari portal VendorDomain. Status ini tidak memeriksa registry.');
      return;
    }

    updateBackendStatus('MEMERIKSA', 'Mengirim GET /health tanpa token atau permintaan perubahan.');
    try {
      const response = await fetch(`${apiBase}/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(`HTTP ${response.status}`);

      const checkedAt = new Date().toLocaleTimeString('id-ID');
      const detail = `${result.service || 'Backend API'} merespons sehat pada ${checkedAt}. Storage: ${result.storage || 'tidak dilaporkan'}. Cloudflare: ${result.cloudflareConfigured ? 'terkonfigurasi' : 'belum dikonfigurasi'}. Pemeriksaan ini hanya health endpoint; bukan bukti monitoring resource atau izin operasi.`;
      updateBackendStatus('TERHUBUNG', detail);
    } catch (error) {
      const message = error?.name === 'TimeoutError' ? 'timeout setelah 5 detik' : (error?.message || 'koneksi gagal');
      updateBackendStatus('GAGAL', `Health check tidak berhasil: ${message}. Registry statis tetap terpisah dari status backend.`);
    }
  }

  function renderFeatures() {
    const query = $('#search').value.trim().toLocaleLowerCase('id-ID');
    const moduleName = $('#moduleFilter').value;
    const service = services.find((item) => item[0] === selectedService);
    const visible = features.filter((feature) => {
      const text = `${feature.name} ${feature.module} ${feature.category} ${feature.description}`.toLocaleLowerCase('id-ID');
      return (!moduleName || feature.module === moduleName)
        && (!query || text.includes(query))
        && (!service || service[3].test(`${feature.name} ${feature.module}`));
    });

    $('#features').innerHTML = visible.map((feature) => `
      <article class="feature">
        <span class="id">${escapeHtml(feature.code)}</span>
        <div>
          <a href="${escapeHtml(featureHref(feature))}">${escapeHtml(feature.name)}</a>
          <small>${escapeHtml(feature.module)}</small>
        </div>
      </article>`).join('') || '<p class="muted">Tidak ada fitur yang cocok.</p>';
    $('#count').textContent = String(features.length);
    $('#featureSummary')?.replaceChildren(document.createTextNode(`${visible.length} dari ${features.length} menu katalog ditampilkan.`));
  }

  function renderServices() {
    $('#services').innerHTML = services.map(([name, description, icon, matcher]) => {
      const count = features.filter((feature) => matcher.test(`${feature.name} ${feature.module}`)).length;
      const active = selectedService === name;
      return `<a class="service" href="#features" data-service="${escapeHtml(name)}" aria-pressed="${active}">
        <span class="ico">${icon}</span>
        <b>${escapeHtml(name)}</b>
        <span>${escapeHtml(description)}</span>
        <small>${count} menu katalog terkait${active ? ' · dipilih' : ' ↗'}</small>
      </a>`;
    }).join('');
  }

  async function loadRegistry() {
    const health = $('#health');
    try {
      const response = await fetch('../features/index.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const registry = await response.json();
      features = Array.isArray(registry.features) ? registry.features : [];
      const modules = [...new Set(features.map((feature) => feature.module).filter(Boolean))].sort();

      $('#modules').textContent = String(modules.length);
      $('#moduleFilter').innerHTML = '<option value="">Semua modul</option>'
        + modules.map((moduleName) => `<option value="${escapeHtml(moduleName)}">${escapeHtml(moduleName)}</option>`).join('');
      health.textContent = `Registry katalog dimuat · ${features.length} menu · ${new Date().toLocaleTimeString('id-ID')}`;
      renderServices();
      renderFeatures();
    } catch (error) {
      health.textContent = `Registry katalog gagal dimuat: ${error.message}`;
      $('#features').textContent = 'Periksa koneksi ke features/index.json.';
      $('#services').textContent = 'Katalog layanan belum tersedia.';
      $('#count').textContent = '—';
      $('#modules').textContent = '—';
    }
  }

  async function refresh() {
    await Promise.all([loadRegistry(), checkBackend()]);
  }

  $('#search').addEventListener('input', renderFeatures);
  $('#moduleFilter').addEventListener('change', renderFeatures);
  $('#refresh').addEventListener('click', refresh);
  $('#services').addEventListener('click', (event) => {
    const card = event.target.closest('[data-service]');
    if (!card) return;
    event.preventDefault();
    selectedService = selectedService === card.dataset.service ? '' : card.dataset.service;
    $('#moduleFilter').value = '';
    $('#search').value = '';
    renderServices();
    renderFeatures();
    $('#features').scrollIntoView({ behavior: 'smooth' });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkBackend();
  });

  refresh();
  window.setInterval(() => {
    if (document.visibilityState === 'visible') checkBackend();
  }, 60000);
})();
