(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const STORE_KEY = 'planetbintang.menu-registry.v1';
  const GROUPS = [
    'Core Code Management & Repositories',
    'Project Management & Issue Tracking',
    'CI/CD Automation & Deployment',
    'Security, Compliance & Privacy',
    'Artifacts & Package Registry',
    'Data Analytics & Insights',
    'Organization & Access Control',
    'System Settings & Integrations',
    'Auditing, Logging & Monitoring',
    'Billing & Resource Quotas',
    'Domain Lifecycle & DNS Engine',
    'Hosting & IP Infrastructure Provisioning',
    'Hyper-Monitoring & Observability Engine',
    'Content Control & Edge Security',
    'Content Moderation & CMS Inspection',
    'Alerting, Incident Response & Notifications',
    'Identity & Access Management',
    'Data Storage & Compliance Logging',
    'Billing, Metering & Resource Provisioning',
    'Extension Marketplace & Developer Ecosystem'
  ];
  const seedRows = [
    ['CODE-FILES','Core Code Management & Repositories','Files','Code','/code/files','Source tree browser, commit, blame, dan riwayat perubahan.'],
    ['CODE-COMMITS','Core Code Management & Repositories','Commits','Code','/code/commits','Riwayat perubahan dan pemeriksaan diff.'],
    ['CODE-BRANCHES','Core Code Management & Repositories','Branches','Code','/code/branches','Daftar branch dan status ahead/behind.'],
    ['CODE-RELEASES','Core Code Management & Repositories','Tags & Releases','Code','/code/releases','Versi semantik, changelog, dan arsip rilis.'],
    ['PR-OPEN','Core Code Management & Repositories','Pull Requests: Open','Pull Requests','/pull-requests/open','Tinjauan kode masuk dan penugasan reviewer.'],
    ['PR-DRAFTS','Core Code Management & Repositories','Pull Requests: Drafts','Pull Requests','/pull-requests/drafts','Ruang kerja perubahan awal.'],
    ['ISSUES-ACTIVE','Project Management & Issue Tracking','Issues: Active','Issues','/issues/active','Bug, permintaan fitur, assignee, dan label prioritas.'],
    ['PROJECT-KANBAN','Project Management & Issue Tracking','Kanban Boards','Projects','/projects/boards','Visualisasi alur kerja dan status kartu.'],
    ['PROJECT-ROADMAP','Project Management & Issue Tracking','Roadmaps','Projects','/projects/roadmaps','Timeline dan dependensi proyek.'],
    ['ACTIONS-RUNS','CI/CD Automation & Deployment','Workflow Runs','Actions','/actions/runs','Riwayat pipeline dan log eksekusi.'],
    ['ACTIONS-BUILDER','CI/CD Automation & Deployment','Workflow Builders','Actions','/actions/builders','Perancangan workflow visual dan YAML.'],
    ['ENV-PROD','CI/CD Automation & Deployment','Production Environment','Environments','/environments/production','Gerbang persetujuan dan proteksi deployment.'],
    ['SEC-CODE','Security, Compliance & Privacy','Code Scanning','Security','/security/code-scanning','Hasil analisis statis dan temuan keamanan.'],
    ['SEC-SECRETS','Security, Compliance & Privacy','Secret Scanning','Security','/security/secret-scanning','Deteksi kemungkinan kebocoran kredensial.'],
    ['PKG-CONTAINER','Artifacts & Package Registry','Container Registry','Packages','/packages/container-registry','Registri artefak OCI dan container image.'],
    ['STORAGE-RETENTION','Artifacts & Package Registry','Retention Policies','Storage','/storage/retention','Aturan retensi dan pembersihan artefak lawas.'],
    ['INSIGHTS-CONTRIB','Data Analytics & Insights','Contribution Graph','Insights','/insights/contributions','Visualisasi aktivitas kontribusi harian.'],
    ['INSIGHTS-DEPENDENCY','Data Analytics & Insights','Dependency Graph','Insights','/insights/dependencies','Peta hubungan dependensi software.'],
    ['ORG-MEMBERS','Organization & Access Control','Members','Organization','/organization/members','Daftar anggota, undangan, dan status 2FA.'],
    ['ORG-ROLES','Organization & Access Control','Roles & Permissions','Organization','/organization/roles','Peran dan kebijakan akses.'],
    ['SETTINGS-WEBHOOKS','System Settings & Integrations','Webhooks','Settings','/settings/webhooks','Konfigurasi pengiriman event HTTP.'],
    ['SETTINGS-APPS','System Settings & Integrations','Installed Apps','Settings','/settings/apps','Kelola aplikasi terintegrasi dan izinnya.'],
    ['AUDIT-SECURITY','Auditing, Logging & Monitoring','Security Events','Audit Logs','/audit/security-events','Jejak login dan perubahan hak akses.'],
    ['AUDIT-EXPORT','Auditing, Logging & Monitoring','Data Export','Audit Logs','/audit/export','Ekspor log dalam format CSV/JSON.'],
    ['BILLING-COST','Billing & Resource Quotas','Cost Analysis','Billing','/billing/cost-analysis','Rincian biaya per proyek atau tim.'],
    ['QUOTA-STORAGE','Billing & Resource Quotas','Storage Quotas','Quotas','/quotas/storage','Monitoring kuota penyimpanan.'],
    ['DNS-AVAILABILITY','Domain Lifecycle & DNS Engine','Domain Availability','Domain','/domain/availability','Pemeriksaan ketersediaan domain secara massal.'],
    ['DNS-ZONE','Domain Lifecycle & DNS Engine','Zone File Editor','DNS','/dns/zones','CRUD record A, AAAA, CNAME, MX, TXT, SRV, dan CAA.'],
    ['DNS-GEODNS','Domain Lifecycle & DNS Engine','GeoDNS Routing','DNS','/dns/routing/geodns','Pengalihan lalu lintas berdasar lokasi geografis.'],
    ['DNS-FAILOVER','Domain Lifecycle & DNS Engine','DNS Failover Engine','DNS','/dns/failover','Failover DNS berdasarkan health check dan kebijakan yang dikonfigurasi.'],
    ['DNS-DNSSEC','Domain Lifecycle & DNS Engine','DNSSEC','DNS','/dns/dnssec','Pengelolaan kunci dan record DNSSEC.'],
    ['COMPUTE-INSTANCES','Hosting & IP Infrastructure Provisioning','Compute Instances','Compute','/compute/instances','Inventaris dan siklus hidup VM.'],
    ['IPAM-SUBNETS','Hosting & IP Infrastructure Provisioning','IPv4/IPv6 Subnets','IPAM','/ipam/subnets','Alokasi subnet dan deteksi konflik IP.'],
    ['HOST-WEBSERVER','Hosting & IP Infrastructure Provisioning','Web Server Configurations','Host','/host/webservers','Katalog konfigurasi Nginx, Apache, dan Caddy.'],
    ['MON-UPTIME','Hyper-Monitoring & Observability Engine','Uptime Monitoring','Monitoring','/monitoring/uptime','Pemantauan status HTTP/HTTPS dan uptime.'],
    ['MON-SSL','Hyper-Monitoring & Observability Engine','SSL/TLS Expiry','Monitoring','/monitoring/tls-expiry','Peringatan sertifikat menjelang kedaluwarsa.'],
    ['APM-TRACE','Hyper-Monitoring & Observability Engine','Distributed Tracing','APM','/apm/tracing','Pelacakan request lintas layanan.'],
    ['CDN-CACHE','Content Control & Edge Security','Edge Caching','CDN','/cdn/cache','Aturan cache berdasarkan path, ekstensi, dan header.'],
    ['WAF-RULES','Content Control & Edge Security','Custom WAF Rules','WAF','/waf/rules','Aturan pemfilteran request yang dapat ditinjau.'],
    ['MOD-UPLOAD','Content Moderation & CMS Inspection','File Upload Sanitization','Moderation','/moderation/uploads','Karantina unggahan dan pemindaian berkas.'],
    ['MOD-VIDEO','Content Moderation & CMS Inspection','Video Stream Audit','Moderation','/moderation/video','Audit konten video berdasarkan kebijakan.'],
    ['ALERT-CHANNELS','Alerting, Incident Response & Notifications','Alert Channels','Alerts','/alerts/channels','Kanal webhook dan notifikasi eksternal.'],
    ['INCIDENT-WARROOM','Alerting, Incident Response & Notifications','Incident War Room','Incident','/incident/war-room','Koordinasi dan pelacakan respons insiden.'],
    ['IAM-RBAC','Identity & Access Management','RBAC Policies','IAM','/iam/rbac','Peran dan izin berbasis kebijakan.'],
    ['AUTH-MFA','Identity & Access Management','Multi-Factor Authentication','Auth','/auth/mfa','Konfigurasi metode autentikasi tambahan.'],
    ['STORE-BUCKETS','Data Storage & Compliance Logging','Object Storage Buckets','Storage','/storage/buckets','Katalog bucket penyimpanan objek kompatibel S3.'],
    ['AUDIT-IMMUTABLE','Data Storage & Compliance Logging','Immutable Audit Logs','Audit','/audit/immutable','Jejak audit dengan retensi yang tidak dapat diubah oleh aplikasi.'],
    ['BILLING-METER','Billing, Metering & Resource Provisioning','Usage Metering','Billing','/billing/metering','Pengukuran konsumsi sumber daya dan biaya.'],
    ['DEV-API','Extension Marketplace & Developer Ecosystem','API Reference & Keys','Developer','/developer/api-keys','Katalog API dan cakupan token akses.'],
    ['DEV-MARKETPLACE','Extension Marketplace & Developer Ecosystem','Plugin Marketplace','Marketplace','/marketplace/plugins','Katalog ekstensi dan integrasi.']
  ];
  const cloneSeeds = () => seedRows.map((r, i) => ({ id: r[0], group: r[1], name: r[2], parent: r[3], route: r[4], description: r[5], active: true, builtin: true, order: i }));
  const safeText = (value, max = 240) => String(value ?? '').trim().slice(0, max);
  const validItem = (item) => item && typeof item === 'object' && safeText(item.name, 120) && GROUPS.includes(item.group);
  const els = {
    form: $('#menuRegistryForm'), editId: $('#menuRegistryEditId'), name: $('#menuRegistryName'),
    group: $('#menuRegistryGroup'), parent: $('#menuRegistryParent'), route: $('#menuRegistryRoute'),
    description: $('#menuRegistryDescription'), enabled: $('#menuRegistryEnabled'), save: $('#menuRegistrySave'),
    cancel: $('#menuRegistryCancel'), reset: $('#menuRegistryReset'), search: $('#menuRegistrySearch'),
    filter: $('#menuRegistryFilter'), status: $('#menuRegistryStatus'), list: $('#menuRegistryList'),
    total: $('#menuRegistryTotal'), active: $('#menuRegistryActive'), groups: $('#menuRegistryGroups'),
    custom: $('#menuRegistryCustom'), count: $('#menuRegistryResultCount'), exportButton: $('#menuRegistryExport'),
    importInput: $('#menuRegistryImport'), storage: $('#menuRegistryStorageState')
  };
  if (!els.form || !els.list) return;
  let items = loadItems();
  function loadItems() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (Array.isArray(saved)) return saved.filter(validItem).map((item, i) => ({
        id: safeText(item.id, 80) || 'custom-' + Date.now() + '-' + i,
        group: item.group, name: safeText(item.name, 120), parent: safeText(item.parent, 120),
        route: safeText(item.route, 180), description: safeText(item.description, 240),
        active: item.active !== false, builtin: item.builtin === true, order: Number(item.order) || i
      }));
    } catch (error) { console.warn('[PBMenuRegistry] local data unreadable; using seed catalog', error); }
    return cloneSeeds();
  }
  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(items));
      if (els.storage) els.storage.textContent = 'TERSIMPAN · LOCAL';
      return true;
    } catch (error) {
      if (els.storage) els.storage.textContent = 'GAGAL SIMPAN · EKSPOR CADANGAN';
      console.error('[PBMenuRegistry] save failed', error);
      return false;
    }
  }
  function createOption(label, value) {
    const option = document.createElement('option'); option.value = value; option.textContent = label; return option;
  }
  function setupGroups() {
    GROUPS.forEach(group => els.group.append(createOption(group, group)));
    GROUPS.forEach(group => els.filter.append(createOption(group, group)));
  }
  function updateStats(filtered) {
    if (els.total) els.total.textContent = String(items.length);
    if (els.active) els.active.textContent = String(items.filter(item => item.active).length);
    if (els.groups) els.groups.textContent = String(new Set(items.map(item => item.group)).size);
    if (els.custom) els.custom.textContent = String(items.filter(item => !item.builtin).length);
    if (els.count) els.count.textContent = filtered + ' item ditampilkan · ' + items.length + ' total';
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function render() {
    const query = safeText(els.search.value, 180).toLocaleLowerCase('id');
    const group = els.filter.value;
    const status = els.status.value;
    const filtered = items.filter(item => {
      if (group !== 'all' && item.group !== group) return false;
      if (status === 'active' && !item.active) return false;
      if (status === 'inactive' && item.active) return false;
      const text = [item.name, item.group, item.parent, item.route, item.description].join(' ').toLocaleLowerCase('id');
      return !query || text.includes(query);
    }).sort((a, b) => a.group.localeCompare(b.group, 'id') || a.name.localeCompare(b.name, 'id'));
    els.list.replaceChildren();
    if (!filtered.length) {
      els.list.append(el('div', 'menu-registry-empty', 'Tidak ada menu yang cocok. Ubah filter atau tambahkan item baru.'));
      updateStats(0); return;
    }
    filtered.forEach(item => {
      const card = el('article', 'menu-registry-card');
      const head = el('div', 'menu-registry-card-head');
      head.append(el('h3', '', item.name));
      const tag = el('span', 'menu-registry-tag' + (item.active ? '' : ' inactive'), item.active ? 'AKTIF' : 'NONAKTIF');
      head.append(tag); card.append(head);
      const meta = el('div', 'menu-registry-meta');
      meta.append(el('span', 'menu-registry-tag', item.group));
      if (item.parent) meta.append(el('span', 'menu-registry-tag', 'Induk: ' + item.parent));
      if (item.builtin) meta.append(el('span', 'menu-registry-tag', 'SEED'));
      else meta.append(el('span', 'menu-registry-tag', 'KUSTOM'));
      card.append(meta);
      card.append(el('p', '', item.description || 'Belum ada deskripsi.'));
      if (item.route) card.append(el('code', '', item.route));
      const actions = el('div', 'menu-registry-card-actions');
      const edit = el('button', '', 'Edit'); edit.type = 'button'; edit.dataset.action = 'edit'; edit.dataset.id = item.id;
      const toggle = el('button', '', item.active ? 'Nonaktifkan' : 'Aktifkan'); toggle.type = 'button'; toggle.dataset.action = 'toggle'; toggle.dataset.id = item.id;
      const remove = el('button', 'danger', 'Hapus'); remove.type = 'button'; remove.dataset.action = 'delete'; remove.dataset.id = item.id;
      actions.append(edit, toggle, remove); card.append(actions); els.list.append(card);
    });
    updateStats(filtered.length);
  }
  function clearForm() {
    els.form.reset(); els.editId.value = ''; els.enabled.checked = true;
    els.save.textContent = '+ Tambah menu'; els.cancel.hidden = true;
    $('#menuRegistryFormTitle').textContent = 'Tambah item menu';
  }
  function editItem(id) {
    const item = items.find(entry => entry.id === id); if (!item) return;
    els.editId.value = item.id; els.name.value = item.name; els.group.value = item.group;
    els.parent.value = item.parent; els.route.value = item.route; els.description.value = item.description;
    els.enabled.checked = item.active; els.save.textContent = 'Simpan perubahan'; els.cancel.hidden = false;
    $('#menuRegistryFormTitle').textContent = 'Edit: ' + item.name;
    els.form.scrollIntoView({ behavior: 'smooth', block: 'start' }); els.name.focus({ preventScroll: true });
  }
  els.form.addEventListener('submit', event => {
    event.preventDefault();
    const name = safeText(els.name.value, 120);
    const route = safeText(els.route.value, 180);
    if (!name || !GROUPS.includes(els.group.value)) return;
    if (route && !/^[/#a-zA-Z0-9._?=&-]*$/.test(route)) { els.route.setCustomValidity('Route hanya boleh berisi path/URL fragment sederhana.'); els.route.reportValidity(); return; }
    els.route.setCustomValidity('');
    const id = els.editId.value || 'custom-' + (globalThis.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 9));
    const existing = items.find(item => item.id === id);
    const entry = { id, group: els.group.value, name, parent: safeText(els.parent.value, 120), route,
      description: safeText(els.description.value, 240), active: els.enabled.checked, builtin: existing?.builtin === true, order: existing?.order ?? items.length };
    if (existing) items = items.map(item => item.id === id ? entry : item); else items.push(entry);
    persist(); clearForm(); render();
  });
  els.cancel.addEventListener('click', clearForm);
  els.reset.addEventListener('click', () => {
    if (!window.confirm('Pulihkan katalog awal? Semua menu kustom dan perubahan lokal akan diganti. Ekspor JSON dahulu bila ingin menyimpan cadangan.')) return;
    items = cloneSeeds(); persist(); clearForm(); render();
  });
  els.search.addEventListener('input', render);
  els.filter.addEventListener('change', render);
  els.status.addEventListener('change', render);
  els.list.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const item = items.find(entry => entry.id === button.dataset.id); if (!item) return;
    if (button.dataset.action === 'edit') { editItem(item.id); return; }
    if (button.dataset.action === 'toggle') {
      item.active = !item.active; persist(); render(); return;
    }
    if (button.dataset.action === 'delete') {
      if (!window.confirm('Hapus item menu "' + item.name + '" dari katalog lokal?')) return;
      items = items.filter(entry => entry.id !== item.id);
      if (els.editId.value === item.id) clearForm();
      persist(); render();
    }
  });
  els.exportButton.addEventListener('click', () => {
    const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), source: 'Planetbintang .L Menu Registry', items };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'planetbintang-menu-registry.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  els.importInput.addEventListener('change', async () => {
    const file = els.importInput.files?.[0]; if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('File impor maksimal 5 MiB.');
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(incoming) || !incoming.length || incoming.length > 10000 || !incoming.every(validItem)) throw new Error('Format JSON tidak valid. Harus berisi array items dengan nama dan kelompok arsitektur yang dikenal.');
      if (!window.confirm('Ganti katalog lokal dengan ' + incoming.length + ' item dari file ini? Ekspor katalog lama terlebih dahulu jika diperlukan.')) return;
      items = incoming.map((item, i) => ({ id: safeText(item.id, 80) || 'import-' + i + '-' + Date.now(), group: item.group,
        name: safeText(item.name, 120), parent: safeText(item.parent, 120), route: safeText(item.route, 180),
        description: safeText(item.description, 240), active: item.active !== false, builtin: item.builtin === true, order: Number(item.order) || i }));
      persist(); clearForm(); render();
    } catch (error) { window.alert('Impor gagal: ' + error.message); }
    finally { els.importInput.value = ''; }
  });
  setupGroups();
  persist();
  render();
  document.addEventListener('planetbintang:route-change', event => {
    if (event.detail?.name === 'menu-registry') render();
  });
  window.PBMenuRegistry = { render, exportItems: () => items.map(item => ({ ...item })), get count() { return items.length; } };
})();