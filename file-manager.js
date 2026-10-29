(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const fmt = new Intl.NumberFormat('id-ID');
  const state = { data: null, repo: '', path: '', query: '', extension: 'all', manifest: null, entries: [], pageIndex: 0, pageCount: 0, loading: false, selected: null, requestId: 0 };

  // Pemetaan root OS MEDIA VM pada File Manager. Folder ini adalah namespace filesystem aplikasi;
  // bukan akses langsung ke partisi OS Android atau penyimpanan server.
  // /acct /sys /systsm_ext /cache /config /media /data memiliki peran sesuai system-root-map.
  const VIRTUAL_REPO = 'planetbintang/.SYSTEM';
  const L_REPO = 'planetbintang/.L';
  const VIRTUAL_INDEX_URL = 'data/trees/0000000000000000/index.json';
  // Folder tingkat root yang dikelola pada ROOT .L — termasuk folder sistem
  // virtual (/proc /sys /media /acct /pro /config /cache /system_ext) yang
  // selalu ditampilkan di samping folder nyata repositori (.github data scripts).
  const VIRTUAL_SHORTCUTS = ['data', 'proc', 'sys', 'media', 'acct', 'pro', 'config', 'cache', 'systsm_ext', 'system_ext', 'workspace', 'planetbintang.com'];
  const VIRTUAL_ROOT_META = {
    proc: { desc: 'Snapshot proses dan diagnostik; data contoh, bukan /proc perangkat langsung', items: 3 },
    sys: { desc: 'Sistem inti permanen: registry, status, dan rekonstruksi modul yang telah divalidasi', items: 6 },
    media: { desc: 'Media publik hasil rilis/publikasi dari rangkaian sistem yang sudah disiapkan', items: 2 },
    acct: { desc: 'Action, activity, activation, dan account; semua aksi dicatat sebagai event', items: 4 },
    pro: { desc: 'Profil kebijakan sistem kompatibilitas lama', items: 2 },
    config: { desc: 'Konfigurasi internal permanen yang hanya dapat diubah pemilik sistem', items: 2 },
    cache: { desc: 'Area sementara untuk rekonstruksi system_ext sebelum promosi ke sys; tunduk pada kebijakan hemat baterai', items: 3 },
    systsm_ext: { desc: 'Staging dan penyimpanan sementara seluruh sistem/perangkat terdeteksi; sumber rekonstruksi untuk sys', items: 5 },
    system_ext: { desc: 'Alias kompatibilitas untuk systsm_ext dan katalog modul virtual terdahulu', items: 20692 },
    workspace: { desc: 'Penyimpanan workspace lokal dari menu Manage', items: 0 },
  };
  const GENERATED_EXTENSIONS = ['html', 'css', 'js', 'nz'];
  const GENERATED_MODULES = ['core', 'ui', 'data', 'api', 'device', 'app', 'docs', 'brand', 'pipeline', 'ai', 'integration', 'security', 'storage'];
  const GENERATED_BUCKETS = 256;
  const GENERATED_FILES_PER_BUCKET = 16;
  const FEATURE_DOMAINS = ['access', 'analytics', 'api', 'app', 'automation', 'backup', 'brand', 'code', 'community', 'content', 'data', 'design', 'device', 'docs', 'execute', 'files', 'forms', 'graph', 'integration', 'management', 'monitoring', 'pipeline', 'security', 'workspace'];
  const FEATURE_BUCKETS = 384;
  const FEATURES_PER_BUCKET = 32;
  const ADVANCED_FEATURES = ['charts', 'diagrams', 'documents', 'design', 'editor', 'pipelines', 'crud', 'ai', 'codeblocks', 'documentation', 'integrations', 'management', 'branding', 'icons', 'live-preview', 'device-console'];
  const ENTERPRISE_DOMAINS = ['core-code', 'project-management', 'cicd-deployment', 'security-compliance', 'artifacts-packages', 'data-insights', 'organization-access', 'settings-integrations', 'audit-monitoring', 'billing-quotas'];
  const ENTERPRISE_BUCKETS = 128;
  const ENTERPRISE_FILES_PER_BUCKET = 32;
  function generatedCode(path, extension, index) {
    const name = basename(path);
    if (extension === 'html') return `<!-- Planetbintang virtual system file ${index} -->\n<section data-system-file="${name}">\n  <h1>${name}</h1>\n  <p>Generated interface contract for the Planetbintang filesystem.</p>\n</section>`;
    if (extension === 'css') return `/* Planetbintang virtual style ${index} */\n[data-system-file="${name}"] {\n  display: grid;\n  min-height: 40px;\n  color: var(--lux-blue-bright);\n}`;
    if (extension === 'js') return `// Planetbintang virtual module ${index}\nexport function ${name.replace(/[^a-z0-9]/gi, '_')} (context = {}) {\n  return { ok: true, module: '${name}', context };\n}`;
    return `# Planetbintang .nz module ${index}\nmodule = ${name}\nstatus = synchronized\nmode = virtual-filesystem`;
  }
  function generatedFeatureCode(domain, extension, index) {
    const feature = `feature_${String(index).padStart(5, '0')}`;
    if (extension === 'html') return `<!-- Planetbintang feature ${feature} -->\n<article data-feature="${feature}" data-domain="${domain}">\n  <header><h2>${domain} feature ${index}</h2></header>\n  <section data-slot="content"></section>\n</article>`;
    if (extension === 'css') return `/* Feature ${feature} · ${domain} */\n[data-feature="${feature}"] {\n  display: grid;\n  gap: 12px;\n  contain: content;\n}`;
    if (extension === 'js') return `// Feature ${feature} · ${domain}\nexport function run_${feature}(context = {}) {\n  return { feature: '${feature}', domain: '${domain}', status: 'ready', context };\n}`;
    return `# Planetbintang feature ${feature}\ndomain = ${domain}\nfeature_id = ${feature}\nstatus = ready\nexecution = disabled-by-default`;
  }
  function generatedSystemEntries(path) {
    // Pemetaan domain + template konfigurasi deployment (virtual File Manager; bukan server aktif).
    if (path === 'planetbintang.com') return [
      { path: 'planetbintang.com/index.html', type: 'file', mode: '0100644', size: 220, sizeKnown: true, function: 'Halaman indeks domain tanpa redirect ke alamat GitHub Pages', codeContent: `<!doctype html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>planetbintang.com</title><meta name="description" content="Halaman utama Planetbintang."></head>
<body><main><h1>planetbintang.com</h1><p>Selamat datang di Planetbintang.</p></main></body>
</html>` },
      { path: 'planetbintang.com/CNAME', type: 'file', mode: '0100644', size: 17, sizeKnown: true, function: 'Nilai custom domain GitHub Pages', codeContent: 'planetbintang.com' },
      { path: 'planetbintang.com/domain-config.json', type: 'file', mode: '0100644', size: 900, sizeKnown: true, function: 'Konfigurasi domain machine-readable; sinkron dengan deployment/planetbintang.com/domain-config.json', codeContent: `{
  "schemaVersion": 1,
  "domain": "planetbintang.com",
  "www": "www.planetbintang.com",
  "hosting": "GitHub Pages",
  "repository": "planetbintang/.L",
  "publishingBranch": "io",
  "publishingFolder": "/",
  "customDomainFile": "/CNAME",
  "dns": {
    "apexA": ["185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"],
    "apexAAAA": ["2606:50c0:8000::153", "2606:50c0:8001::153", "2606:50c0:8002::153", "2606:50c0:8003::153"],
    "wwwCNAME": "planetbintang.github.io"
  },
  "https": { "enableEnforceHttpsAfterDnsAndCertificateReady": true, "providerManagedCertificate": true }
}` },
      { path: 'planetbintang.com/DOMAIN-SETUP.txt', type: 'file', mode: '0100644', size: 1800, sizeKnown: true, function: 'Panduan aktivasi domain dan pengaturan GitHub Pages', codeContent: `Buka https://github.com/planetbintang/.L/settings/pages
Pilih Deploy from a branch, branch io, folder / (root).
Set Custom domain ke planetbintang.com lalu Save.

DNS apex A (@):
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153

DNS www CNAME -> planetbintang.github.io

Setelah DNS valid dan sertifikat tersedia, aktifkan Enforce HTTPS.
Workflow pemeriksaan berkala: .github/workflows/domain-dns-check.yml

Catatan: File di repositori tidak mengubah DNS registrar. Pastikan konfigurasi Pages pada Settings secara manual, karena koneksi yang tersedia tidak memiliki aksi untuk mengubah Settings > Pages.` },
      { path: 'planetbintang.com/nginx', type: 'directory', mode: '040755', items: 1, function: 'Template Nginx untuk hosting VPS sendiri; tidak dijalankan oleh GitHub Pages' },
      { path: 'planetbintang.com/dns', type: 'directory', mode: '040755', items: 1, function: 'Catatan DNS/CNAME; record harus diterapkan di registrar/DNS provider' },
      { path: 'planetbintang.com/ssl', type: 'directory', mode: '040755', items: 1, function: 'TLS/SSL untuk GitHub Pages atau hosting sendiri' },
      { path: 'planetbintang.com/cert', type: 'directory', mode: '040755', items: 1, function: 'Siklus hidup sertifikat TLS dan perlindungan private key' },
      { path: 'planetbintang.com/ssh', type: 'directory', mode: '040755', items: 1, function: 'Panduan SSH aman; jangan simpan private key di repositori' },
      { path: 'planetbintang.com/email', type: 'directory', mode: '040755', items: 1, function: 'Template email DNS; MX/SPF/DKIM/DMARC harus mengikuti penyedia email' },
      { path: 'planetbintang.com/browser', type: 'directory', mode: '040755', items: 1, function: 'Konfigurasi kompatibilitas HTTP/HTTPS dan browser/perangkat' },
      { path: 'planetbintang.com/github-pages', type: 'directory', mode: '040755', items: 2, function: 'Konfigurasi hosting GitHub Pages yang benar-benar menerbitkan situs dari branch io root' },
      { path: 'planetbintang.com/hosting', type: 'directory', mode: '040755', items: 2, function: 'Panduan target hosting, deployment, dan batas hosting statis' },
      { path: 'planetbintang.com/http-https', type: 'directory', mode: '040755', items: 1, function: 'Kebijakan canonical URL, HTTPS, dan pengalihan' },
      { path: 'planetbintang.com/monitoring', type: 'directory', mode: '040755', items: 2, function: 'Pemeriksaan DNS, HTTP, HTTPS, dan ketersediaan domain' },
      { path: 'planetbintang.com/redirects', type: 'directory', mode: '040755', items: 1, function: 'Kebijakan www dan apex; jangan membuat redirect sebelum DNS siap' },
      { path: 'planetbintang.com/security', type: 'directory', mode: '040755', items: 2, function: 'Checklist keamanan domain, DNS, secrets, dan deployment' },
      { path: 'planetbintang.com/verification', type: 'directory', mode: '040755', items: 2, function: 'Checklist verifikasi setelah perubahan DNS dan Pages' },
      { path: 'planetbintang.com/www', type: 'directory', mode: '040755', items: 1, function: 'Konfigurasi host www.planetbintang.com' },
      { path: 'planetbintang.com/logs', type: 'directory', mode: '040755', items: 1, function: 'Panduan membaca hasil workflow; log tidak disimpan sebagai log server di GitHub Pages' },
      { path: 'planetbintang.com/automation', type: 'directory', mode: '040755', items: 2, function: 'Workflow nyata di GitHub Actions untuk memeriksa DNS dan HTTPS' },
      { path: 'planetbintang.com/runtime', type: 'directory', mode: '040755', items: 2, function: 'Inventaris runtime browser, runner CI, dan batas hosting server-side; terhubung ke dokumentasi runtime nyata' },
      { path: 'planetbintang.com/data-pipeline', type: 'directory', mode: '040755', items: 2, function: 'Pipeline validasi sumber, publikasi, DNS, TLS, health-check, dan sign-off domain' },
      { path: 'planetbintang.com/host-dns', type: 'directory', mode: '040755', items: 1, function: 'Konfigurasi host dan DNS untuk apex dan www; membutuhkan panel DNS otoritatif' },
      { path: 'planetbintang.com/activation-stack', type: 'directory', mode: '040755', items: 1, function: 'Peta seluruh lapisan aktivasi domain: source, deploy, runtime, DNS, TLS, monitoring, security, verification' },
      { path: 'planetbintang.com/README.md', type: 'file', mode: '0100644', size: 2400, sizeKnown: true, function: 'Panduan domain operasional yang tersimpan di repository', fetchPath: 'deployment/planetbintang.com/README.md' },
      { path: 'planetbintang.com/verify-domain.sh', type: 'file', mode: '0100755', size: 1800, sizeKnown: true, function: 'Skrip pemeriksaan DNS dan HTTPS yang dapat dijalankan manual', fetchPath: 'deployment/planetbintang.com/verify-domain.sh' },
      { path: 'planetbintang.com/activation-status.json', type: 'file', mode: '0100644', size: 600, sizeKnown: true, function: 'Checklist status domain; bukan klaim status live', fetchPath: 'deployment/planetbintang.com/activation-status.json' },
    ];
    if (path === 'planetbintang.com/runtime') return [
      { path: 'planetbintang.com/runtime/README.md', type: 'file', mode: '0100644', size: 1800, sizeKnown: true, function: 'Dokumentasi runtime aktual dan batas GitHub Pages', fetchPath: 'deployment/planetbintang.com/runtime/README.md' },
      { path: 'planetbintang.com/runtime/runtime-manifest.json', type: 'file', mode: '0100644', size: 900, sizeKnown: true, function: 'Manifest runtime yang dapat dibaca mesin', fetchPath: 'deployment/planetbintang.com/runtime/runtime-manifest.json' },
    ];
    if (path === 'planetbintang.com/data-pipeline') return [
      { path: 'planetbintang.com/data-pipeline/README.md', type: 'file', mode: '0100644', size: 1600, sizeKnown: true, function: 'Tahapan pipeline aktivasi domain dan kebijakan kegagalan', fetchPath: 'deployment/planetbintang.com/data-pipeline/README.md' },
      { path: 'planetbintang.com/data-pipeline/pipeline.json', type: 'file', mode: '0100644', size: 700, sizeKnown: true, function: 'Manifest pipeline validasi dan sign-off', fetchPath: 'deployment/planetbintang.com/data-pipeline/pipeline.json' },
    ];
    if (path === 'planetbintang.com/host-dns') return [
      { path: 'planetbintang.com/host-dns/README.md', type: 'file', mode: '0100644', size: 1500, sizeKnown: true, function: 'Record DNS apex/www dan batas kewenangan konfigurasi', fetchPath: 'deployment/planetbintang.com/host-dns/README.md' },
    ];
    if (path === 'planetbintang.com/activation-stack') return [
      { path: 'planetbintang.com/activation-stack/README.md', type: 'file', mode: '0100644', size: 1900, sizeKnown: true, function: 'Peta lengkap seluruh lapisan aktivasi domain dan checklist', fetchPath: 'deployment/planetbintang.com/activation-stack/README.md' },
    ];
    if (path === 'planetbintang.com/github-pages') return [
      { path: 'planetbintang.com/github-pages/settings.md', type: 'file', mode: '0100644', size: 850, sizeKnown: true, function: 'Langkah konfigurasi Pages yang harus tersimpan pada GitHub Settings', codeContent: `# GitHub Pages — planetbintang.com\n\nRepository: planetbintang/.L\nBranch: io\nFolder: / (root)\nCustom domain: planetbintang.com\nCustom domain file: /CNAME (root repository, exact content planetbintang.com)\n\n1. Buka https://github.com/planetbintang/.L/settings/pages\n2. Build and deployment: Deploy from a branch → io → / (root) → Save.\n3. Custom domain: planetbintang.com → Save.\n4. Tunggu DNS check dan penerbitan sertifikat.\n5. Aktifkan Enforce HTTPS setelah tersedia.\n\nFile repository tidak dapat menulis ke Settings > Pages; verifikasi status langsung di halaman tersebut.` },
      { path: 'planetbintang.com/github-pages/publishing.json', type: 'file', mode: '0100644', size: 300, sizeKnown: true, function: 'Manifest deklaratif untuk konfigurasi publikasi GitHub Pages', codeContent: JSON.stringify({ provider: 'GitHub Pages', repository: 'planetbintang/.L', branch: 'io', directory: '/', domain: 'planetbintang.com', cnameFile: '/CNAME', staticHosting: true, serverSideRuntime: false }, null, 2) },
    ];
    if (path === 'planetbintang.com/hosting') return [
      { path: 'planetbintang.com/hosting/architecture.md', type: 'file', mode: '0100644', size: 720, sizeKnown: true, function: 'Arsitektur hosting aktif dan batasan teknis', codeContent: `# Hosting architecture\n\nTarget aktif yang dikonfigurasi di repository ini adalah GitHub Pages: static HTML, CSS, JavaScript, dan aset.\n\n- Root repository branch io adalah document root yang dipublikasikan.\n- CNAME pada root menyatakan planetbintang.com sebagai custom domain.\n- DNS domain harus diarahkan ke GitHub Pages dari panel DNS otoritatif.\n- GitHub Pages bukan VPS: tidak menjalankan Nginx, Node server, PHP, database, atau SSH server.\n- Folder Nginx/SSH di File Manager adalah dokumentasi/template untuk hosting VPS terpisah, bukan layanan yang berjalan di GitHub Pages.` },
      { path: 'planetbintang.com/hosting/deployment-checklist.md', type: 'file', mode: '0100644', size: 500, sizeKnown: true, function: 'Checklist sebelum publikasi dan sesudah commit', codeContent: `# Deployment checklist\n- [ ] Commit perubahan ke branch io.\n- [ ] Pastikan Actions/Pages build sukses.\n- [ ] Pastikan CNAME di root berisi planetbintang.com.\n- [ ] Uji https://planetbintang.github.io/.L/ sebagai origin pembanding.\n- [ ] Uji https://planetbintang.com/ dan https://www.planetbintang.com/.\n- [ ] Periksa DevTools/Network untuk asset 404 dan mixed content.\n- [ ] Jangan menyimpan kredensial atau private key dalam repo.` },
    ];
    if (path === 'planetbintang.com/monitoring') return [
      { path: 'planetbintang.com/monitoring/health-check.md', type: 'file', mode: '0100644', size: 720, sizeKnown: true, function: 'Kriteria pemeriksaan DNS dan respons HTTP(S)', codeContent: `# Domain health checks\n\nWorkflow Domain DNS Check memeriksa A records apex dan CNAME www. Hasil workflow dapat dilihat pada tab Actions.\n\nPeriksa juga secara manual:\n- https://planetbintang.com/ harus mengembalikan halaman situs.\n- https://www.planetbintang.com/ harus mengarah ke situs yang sama.\n- Sertifikat TLS harus valid untuk host yang dibuka.\n- File CSS, JS, gambar, favicon, dan manifest tidak boleh 404.\n\nDNS sukses saja tidak membuktikan bahwa GitHub Pages custom domain sudah tersimpan. Periksa Settings > Pages dan hasil HTTPS secara terpisah.` },
      { path: 'planetbintang.com/monitoring/expected-state.json', type: 'file', mode: '0100644', size: 260, sizeKnown: true, function: 'Expected DNS dan origin untuk dibandingkan dengan hasil pemeriksaan', codeContent: JSON.stringify({ apex: 'planetbintang.com', apexA: ['185.199.108.153','185.199.109.153','185.199.110.153','185.199.111.153'], wwwCNAME: 'planetbintang.github.io', origin: 'https://planetbintang.com/', canonical: 'https://planetbintang.com/' }, null, 2) },
    ];
    if (path === 'planetbintang.com/redirects') return [
      { path: 'planetbintang.com/redirects/canonical-policy.md', type: 'file', mode: '0100644', size: 460, sizeKnown: true, function: 'Kebijakan URL kanonis tanpa mengaktifkan redirect sebelum domain siap', codeContent: `# Canonical URL policy\n\nTarget utama: https://planetbintang.com/\nAlias: https://www.planetbintang.com/\n\nKonfigurasikan custom domain di GitHub Pages dan DNS terlebih dahulu. GitHub Pages menangani pemetaan custom domain; jangan mengandalkan file .htaccess atau konfigurasi Nginx karena keduanya tidak dijalankan oleh GitHub Pages. Uji kedua host setelah sertifikat tersedia.` },
    ];
    if (path === 'planetbintang.com/security') return [
      { path: 'planetbintang.com/security/security-checklist.md', type: 'file', mode: '0100644', size: 520, sizeKnown: true, function: 'Kontrol keamanan untuk domain dan repositori publik', codeContent: `# Security checklist\n- Jangan commit token GitHub, password registrar, private key, atau file .env rahasia.\n- Gunakan least privilege untuk token/workflow dan jangan memberi workflow akses tulis bila tidak dibutuhkan.\n- Jangan mengubah MX, SPF, DKIM, DMARC, atau nameserver tanpa nilai resmi provider.\n- Aktifkan HTTPS hanya setelah sertifikat valid.\n- Review perubahan workflow sebelum merge/commit.\n- Ingat GitHub Pages adalah hosting statis; jangan simpan data rahasia di file publik.` },
      { path: 'planetbintang.com/security/secret-boundaries.md', type: 'file', mode: '0100644', size: 320, sizeKnown: true, function: 'Batas rahasia dan hak akses sistem', codeContent: `# Secrets and permissions\nRepository files cannot modify registrar DNS without a provider API and authorized secret. GitHub Pages settings also require an authorized Settings operation. Never store credentials in File Manager virtual content. Use GitHub Actions secrets only for a specific, reviewed integration and minimum scopes.` },
    ];
    if (path === 'planetbintang.com/verification') return [
      { path: 'planetbintang.com/verification/verify-after-dns.md', type: 'file', mode: '0100644', size: 520, sizeKnown: true, function: 'Prosedur verifikasi aktivasi domain', codeContent: `# Verify after DNS changes\n1. Jalankan workflow Domain DNS Check dari Actions.\n2. Pastikan empat IPv4 GitHub Pages terdeteksi untuk apex.\n3. Pastikan www CNAME menuju planetbintang.github.io.\n4. Buka Settings > Pages dan pastikan custom domain tersimpan tanpa error.\n5. Tunggu sertifikat TLS; jangan paksa HTTPS sebelum sertifikat siap.\n6. Buka https://planetbintang.com/ dan https://www.planetbintang.com/ dari jaringan lain.\n7. Jika gagal, periksa DNS otoritatif, Actions, Pages build, dan status sertifikat.` },
      { path: 'planetbintang.com/verification/status-template.json', type: 'file', mode: '0100644', size: 220, sizeKnown: true, function: 'Template status; bukan hasil live check', codeContent: JSON.stringify({ status: 'pending_external_verification', dnsVerified: false, pagesCustomDomainVerified: false, httpsVerified: false, note: 'Isi status berdasarkan hasil pemeriksaan aktual; jangan menganggap konfigurasi aktif hanya karena file tersedia.' }, null, 2) },
    ];
    if (path === 'planetbintang.com/www') return [
      { path: 'planetbintang.com/www/cname.md', type: 'file', mode: '0100644', size: 240, sizeKnown: true, function: 'Target DNS untuk subdomain www', codeContent: `# www.planetbintang.com\nRecord type: CNAME\nHost/name: www\nTarget/value: planetbintang.github.io\nTTL: provider default\n\nSet pada penyedia DNS otoritatif. Jangan membuat CNAME pada host apex @; gunakan empat record A yang direkomendasikan GitHub Pages.` },
    ];
    if (path === 'planetbintang.com/logs') return [
      { path: 'planetbintang.com/logs/where-to-find-results.md', type: 'file', mode: '0100644', size: 260, sizeKnown: true, function: 'Lokasi log workflow dan batas log hosting statis', codeContent: `# Results and logs\nWorkflow logs: repository GitHub → Actions → Domain DNS Check.\nGitHub Pages does not expose server shell or Nginx access logs. Do not create fake runtime logs in the repository. Use an external uptime monitor if continuous HTTP checks are required.` },
    ];
    if (path === 'planetbintang.com/automation') return [
      { path: 'planetbintang.com/automation/domain-dns-check.yml', type: 'file', mode: '0100644', size: 1800, sizeKnown: true, function: 'Workflow terjadwal untuk pemeriksaan DNS', fetchPath: '.github/workflows/domain-dns-check.yml' },
      { path: 'planetbintang.com/automation/domain-health-check.yml', type: 'file', mode: '0100644', size: 1500, sizeKnown: true, function: 'Workflow terjadwal untuk pemeriksaan respons HTTPS apex dan www', fetchPath: '.github/workflows/domain-health-check.yml' },
    ];
    if (path === 'planetbintang.com/nginx') return [
      { path: 'planetbintang.com/nginx/planetbintang.com.conf', type: 'file', mode: '0100644', size: 620, sizeKnown: true, function: 'Template server block Nginx untuk static site; pasang hanya pada VPS yang dikelola sendiri', codeContent: `server {
    listen 80;
    listen [::]:80;
    server_name planetbintang.com www.planetbintang.com;
    root /var/www/planetbintang.com;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location ~* \\.(?:css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }
    # HTTPS listener dan redirect 80->443 ditambahkan setelah sertifikat terpasang.
}` },
    ];
    if (path === 'planetbintang.com/dns') return [
      { path: 'planetbintang.com/dns/records.md', type: 'file', mode: '0100644', size: 650, sizeKnown: true, function: 'DNS checklist untuk GitHub Pages; email records belum diisi karena provider tidak diketahui', codeContent: `# DNS: planetbintang.com

## Apex A records (@)
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153

## www
CNAME www -> planetbintang.github.io

## Penting
Tambahkan domain di GitHub Settings -> Pages lebih dahulu, lalu atur DNS di provider domain. CNAME di repo tidak mengubah DNS registrar.
Jangan hapus record email atau record aktif yang melayani layanan lain. Jangan gunakan wildcard DNS. Aktifkan Enforce HTTPS setelah sertifikat tersedia.` },
    ];
    if (path === 'planetbintang.com/ssl') return [
      { path: 'planetbintang.com/ssl/tls.md', type: 'file', mode: '0100644', size: 540, sizeKnown: true, function: 'Panduan sertifikat TLS; GitHub Pages mengelola sertifikatnya setelah DNS valid', codeContent: `# SSL/TLS
- GitHub Pages: set custom domain pada Settings → Pages, pastikan DNS benar, tunggu penerbitan sertifikat, lalu aktifkan Enforce HTTPS.
- VPS/Nginx: gunakan ACME client seperti Certbot untuk memperoleh sertifikat; baru aktifkan listener 443 dan redirect HTTP ke HTTPS.
- Perpanjangan sertifikat harus otomatis dan dipantau.
- Jangan commit private key, token, atau file sertifikat privat ke repositori.` },
    ];
    if (path === 'planetbintang.com/ssh') return [
      { path: 'planetbintang.com/ssh/README.md', type: 'file', mode: '0100644', size: 420, sizeKnown: true, function: 'Panduan SSH untuk VPS; GitHub Pages sendiri tidak menyediakan akses SSH ke web server', codeContent: `# SSH
- GitHub Pages adalah hosting statis dan tidak menyediakan shell SSH untuk server situs.
- Untuk VPS milik sendiri, gunakan kunci ed25519, nonaktifkan password login setelah menguji akses kunci, batasi firewall dan gunakan akun non-root.
- Private key hanya disimpan di perangkat/secret manager, bukan di Git.
- Jangan mengaktifkan SSH server publik tanpa kontrol akses dan pembaruan keamanan.` },
    ];
    if (path === 'planetbintang.com/email') return [
      { path: 'planetbintang.com/email/records-template.md', type: 'file', mode: '0100644', size: 480, sizeKnown: true, function: 'Template konfigurasi email; nilai MX/SPF/DKIM bergantung pada penyedia email yang dipakai', codeContent: `# Email DNS records

Provider email belum ditentukan. Jangan menambahkan MX atau SPF contoh secara acak karena dapat mengganggu email aktif.

Isi dari panel provider yang dipilih:
- MX: hostname dan priority resmi provider.
- SPF: satu TXT record yang menggabungkan seluruh pengirim sah.
- DKIM: selector dan TXT/CNAME key dari provider.
- DMARC: mulai dari kebijakan pemantauan, lalu tingkatkan setelah laporan tervalidasi.
- Verifikasi mailbox dan alur pemulihan akun sebelum perubahan DNS.` },
    ];
    if (path === 'planetbintang.com/cert') return [
      { path: 'planetbintang.com/cert/certificate-lifecycle.md', type: 'file', mode: '0100644', size: 440, sizeKnown: true, function: 'Panduan penerbitan, pembaruan, dan penyimpanan sertifikat', codeContent: `# Certificate lifecycle
- GitHub Pages menerbitkan dan memperbarui TLS certificate setelah custom domain dan DNS valid.
- Untuk VPS, gunakan ACME/Certbot dan otomatisasi renewal.
- Jangan simpan private key (.key), access token, atau certificate private material di Git.
- Pantau masa berlaku sertifikat dan uji HTTPS setelah setiap perubahan DNS.` },
    ];
    if (path === 'planetbintang.com/http-https') return [
      { path: 'planetbintang.com/http-https/redirect-policy.md', type: 'file', mode: '0100644', size: 380, sizeKnown: true, function: 'Kebijakan HTTPS untuk situs publik', codeContent: `# HTTP / HTTPS
- URL kanonis publik: https://planetbintang.com/
- HTTP harus dialihkan permanen ke HTTPS pada hosting yang dikelola sendiri.
- GitHub Pages: aktifkan Enforce HTTPS pada Settings -> Pages setelah certificate ready.
- Jangan menambahkan redirect Nginx 443 sebelum sertifikat valid.
- Uji domain apex, www, asset CSS/JS, dan halaman internal di desktop serta perangkat mobile.` },
    ];
    if (path === 'planetbintang.com/browser') return [
      { path: 'planetbintang.com/browser/compatibility.md', type: 'file', mode: '0100644', size: 500, sizeKnown: true, function: 'Checklist kompatibilitas HTTP/HTTPS, responsif, aksesibilitas, dan browser modern', codeContent: `# Browser compatibility
- Sajikan halaman utama melalui HTTPS; gunakan HTTP hanya untuk redirect permanen ke HTTPS pada hosting yang dikelola sendiri.
- Gunakan HTML semantik, UTF-8, viewport meta, CSS responsif, dan JavaScript progressive enhancement.
- Hindari fitur eksperimental tanpa fallback; uji Chrome, Firefox, Safari, Edge, browser Android/iOS, keyboard, zoom, dan koneksi lambat.
- Pastikan semua asset memakai path relatif yang cocok dengan GitHub Pages project path /.L/ atau custom domain root.
- Iframe pihak ketiga (misalnya Google/ChatGPT) dapat diblokir oleh kebijakan frame; sediakan tombol buka situs langsung.` },
    ];
    if (path === 'sys/system_ext' || path.startsWith('sys/system_ext/')) {
      const sourcePath = path.replace(/^sys\/system_ext/, 'system_ext');
      return generatedSystemEntries(sourcePath).map((entry) => ({
        ...entry,
        path: `sys/system_ext${entry.path.slice('system_ext'.length)}`,
        function: `${entry.function || 'system_ext entry'} · mirror /sys`,
      }));
    }
    if (path === 'sys/planetbintang') return [
      { path: 'sys/planetbintang/advanced', type: 'directory', mode: '040755', items: ADVANCED_FEATURES.length, function: 'Advanced system feature registry · setiap fitur memiliki filesystem sendiri' },
    ];
    // Enterprise Map List · Hyper-Enterprise Master Registry (10.000 menu JSON nyata di /data/enterprise-menus)
    const ENTERPRISE_MAP_ARCHITECTURES = ['core-code', 'project-management', 'cicd-deployment', 'security-compliance', 'artifacts-packages', 'data-insights', 'organization-access', 'settings-integrations', 'audit-monitoring', 'billing-quotas', 'domain-dns-engine', 'hosting-ip-infra', 'hyper-monitoring', 'edge-security-waf', 'content-moderation-cms', 'alerting-incident', 'iam-enterprise', 'storage-compliance', 'billing-metering', 'developer-marketplace'];
    if (path === 'sys/enterprise') return ENTERPRISE_MAP_ARCHITECTURES.map((slug, archIndex) => ({
      path: `sys/enterprise/${slug}`, type: 'directory', mode: '040755', items: 500,
      function: `Arsitektur A${String(archIndex + 1).padStart(2, '0')} · ${500} menu registry · rentang ${archIndex * 500 + 1}–${(archIndex + 1) * 500}${archIndex >= 10 ? ' · Hyper-Enterprise tier' : ' · DevOps Core tier'}`,
    })).concat([{ path: 'sys/enterprise/manifest.json', type: 'file', mode: '0100644', size: 4200, sizeKnown: true, function: 'Master registry manifest · schema system_menus', codeContent: '{\n "schemaVersion": 1,\n "totalMenuCount": 10000,\n "architectureCount": 20,\n "menusPerArchitecture": 500,\n "registryTable": "system_menus + system_menu_descriptions",\n "source": "scripts/generate_enterprise_map.py deterministic registry"\n}' }]);
    const enterpriseArchMatch = path.match(/^sys\/enterprise\/([a-z-]+)$/);
    if (enterpriseArchMatch && ENTERPRISE_MAP_ARCHITECTURES.includes(enterpriseArchMatch[1])) {
      const archIndex = ENTERPRISE_MAP_ARCHITECTURES.indexOf(enterpriseArchMatch[1]);
      // Batch rename: nama file mengikuti nama menu (<slug-menu>-<MENU-CODE>.json),
      // dipetakan dari window.PB_ENTERPRISE_MENU_INDEX (data/enterprise-menus-index.js).
      const emapIndex = window.PB_ENTERPRISE_MENU_INDEX || {};
      return Array.from({ length: 500 }, (_, slot) => {
        const id = archIndex * 500 + slot + 1;
        const fileName = emapIndex[String(id).padStart(5, '0')] || `menu-${String(id).padStart(5, '0')}.json`;
        return { path: `${path}/${fileName}`, type: 'file', mode: '0100644', size: 24576, sizeKnown: true, function: `system_menus row #${id} · arsitektur ${enterpriseArchMatch[1]} · ≥150 baris fitur padat`, fetchPath: `data/enterprise-menus/${fileName}` };
      });
    }
    // Mirror path lama: /system_ext/hyper-menus/<arsitektur> → shard yang sama.
    if (path === 'system_ext/hyper-menus') return generatedSystemEntries('sys/enterprise').map((entry) => ({
      ...entry,
      path: `system_ext/hyper-menus${entry.path.slice('sys/enterprise'.length)}`,
      function: `${entry.function} · mirror system_ext`,
    }));
    const hyperMirrorMatch = path.match(/^system_ext\/hyper-menus\/([a-z-]+)$/);
    if (hyperMirrorMatch) return generatedSystemEntries(`sys/enterprise/${hyperMirrorMatch[1]}`).map((entry) => ({
      ...entry,
      path: `system_ext/hyper-menus/${hyperMirrorMatch[1]}${entry.path.slice(`sys/enterprise/${hyperMirrorMatch[1]}`.length)}`,
      function: `${entry.function} · mirror system_ext`,
    }));
    if (path === 'sys/planetbintang/advanced') return ADVANCED_FEATURES.map((feature, index) => {
      const extension = GENERATED_EXTENSIONS[index % GENERATED_EXTENSIONS.length];
      const file = `${feature}-system-${String(index + 1).padStart(2, '0')}.${extension}`;
      return { path: `sys/planetbintang/advanced/${file}`, type: 'file', mode: '0100644', size: generatedFeatureCode(feature, extension, 20000 + index).length, sizeKnown: true, function: `Advanced feature ${index + 1}: ${feature}`, codeContent: generatedFeatureCode(feature, extension, 20000 + index) };
    });
    if (path === 'system_ext') return [
      { path: 'system_ext/catalog', type: 'directory', mode: '040755', function: '4.096 file kode virtual dalam 256 bucket lazy-load' },
      { path: 'system_ext/features', type: 'directory', mode: '040755', function: '12.288 fitur virtual · satu fitur = satu file · 24 domain sistem' },
      { path: 'system_ext/enterprise', type: 'directory', mode: '040755', function: '4.096 enterprise-map feature files · 10 domain platform' },
      { path: 'system_ext/hyper-menus', type: 'directory', mode: '040755', function: 'Enterprise Map List · 10.000 menu registry hierarkis · 20 arsitektur × 500 shard mirror /sys/enterprise' },
      { path: 'system_ext/modules', type: 'directory', mode: '040755', function: 'Modul fitur: core, UI, data, API, AI, pipeline, dan integrasi' },
      { path: 'system_ext/etc', type: 'directory', mode: '040755', function: 'Konfigurasi partisi system_ext' },
      { path: 'system_ext/compatibility_matrix.xml', type: 'file', mode: '0100644', size: 210, sizeKnown: true, codeContent: '<compatibility-matrix version="202404" type="framework">\n  <hal format="aidl" optional="false"><name>gatekeeper</name><version>1</version></hal>\n</compatibility-matrix>' },
    ];
    if (path === 'system_ext/catalog') return Array.from({ length: GENERATED_BUCKETS }, (_, bucket) => ({
      path: `system_ext/catalog/b${String(bucket).padStart(3, '0')}`, type: 'directory', mode: '040755', items: GENERATED_FILES_PER_BUCKET,
      function: `Bucket ${bucket}: ${GENERATED_FILES_PER_BUCKET} file HTML/CSS/JS/NZ`,
    }));
    const bucketMatch = path.match(/^system_ext\/catalog\/b(\d{3})$/);
    if (bucketMatch) return Array.from({ length: GENERATED_FILES_PER_BUCKET }, (_, offset) => {
      const index = Number(bucketMatch[1]) * GENERATED_FILES_PER_BUCKET + offset;
      const extension = GENERATED_EXTENSIONS[index % GENERATED_EXTENSIONS.length];
      const file = `pb-${String(index).padStart(4, '0')}.${extension}`;
      return { path: `${path}/${file}`, type: 'file', mode: '0100644', size: generatedCode(file, extension, index).length, sizeKnown: true, function: `Generated ${extension.toUpperCase()} system contract`, codeContent: generatedCode(file, extension, index) };
    });
    if (path === 'system_ext/features') return Array.from({ length: FEATURE_BUCKETS }, (_, bucket) => ({
      path: `system_ext/features/f${String(bucket).padStart(3, '0')}`, type: 'directory', mode: '040755', items: FEATURES_PER_BUCKET,
      function: `Feature bucket ${bucket}: ${FEATURES_PER_BUCKET} feature-file terintegrasi`,
    }));
    const featureBucketMatch = path.match(/^system_ext\/features\/f(\d{3})$/);
    if (featureBucketMatch) return Array.from({ length: FEATURES_PER_BUCKET }, (_, offset) => {
      const index = Number(featureBucketMatch[1]) * FEATURES_PER_BUCKET + offset;
      const domain = FEATURE_DOMAINS[index % FEATURE_DOMAINS.length];
      const extension = GENERATED_EXTENSIONS[index % GENERATED_EXTENSIONS.length];
      const file = `${domain}-feature-${String(index).padStart(5, '0')}.${extension}`;
      return { path: `${path}/${file}`, type: 'file', mode: '0100644', size: generatedFeatureCode(domain, extension, index).length, sizeKnown: true, function: `Feature ${index}: ${domain} · ${extension.toUpperCase()}`, codeContent: generatedFeatureCode(domain, extension, index) };
    });
    if (path === 'system_ext/enterprise') return Array.from({ length: ENTERPRISE_BUCKETS }, (_, bucket) => ({
      path: `system_ext/enterprise/e${String(bucket).padStart(3, '0')}`, type: 'directory', mode: '040755', items: ENTERPRISE_FILES_PER_BUCKET,
      function: `Enterprise bucket ${bucket}: ${ENTERPRISE_FILES_PER_BUCKET} menu feature files`,
    }));
    const enterpriseBucketMatch = path.match(/^system_ext\/enterprise\/e(\d{3})$/);
    if (enterpriseBucketMatch) return Array.from({ length: ENTERPRISE_FILES_PER_BUCKET }, (_, offset) => {
      const index = Number(enterpriseBucketMatch[1]) * ENTERPRISE_FILES_PER_BUCKET + offset;
      const domain = ENTERPRISE_DOMAINS[index % ENTERPRISE_DOMAINS.length];
      const extension = GENERATED_EXTENSIONS[index % GENERATED_EXTENSIONS.length];
      const file = `${domain}-menu-${String(index).padStart(4, '0')}.${extension}`;
      return { path: `${path}/${file}`, type: 'file', mode: '0100644', size: generatedFeatureCode(domain, extension, 30000 + index).length, sizeKnown: true, function: `Enterprise menu feature ${index}: ${domain}`, codeContent: generatedFeatureCode(domain, extension, 30000 + index) };
    });
    if (path === 'system_ext/modules') return GENERATED_MODULES.map((module) => ({
      path: `system_ext/modules/${module}`, type: 'directory', mode: '040755', items: GENERATED_FILES_PER_BUCKET,
      function: `Submenu modul ${module}: kode, dokumentasi, pipeline, CRUD, AI dan preview`,
    }));
    const moduleMatch = path.match(/^system_ext\/modules\/([a-z]+)$/);
    if (moduleMatch && GENERATED_MODULES.includes(moduleMatch[1])) return Array.from({ length: GENERATED_FILES_PER_BUCKET }, (_, offset) => {
      const module = moduleMatch[1]; const index = GENERATED_MODULES.indexOf(module) * GENERATED_FILES_PER_BUCKET + offset;
      const extension = GENERATED_EXTENSIONS[offset % GENERATED_EXTENSIONS.length];
      const file = `${module}-${String(offset).padStart(2, '0')}.${extension}`;
      return { path: `${path}/${file}`, type: 'file', mode: '0100644', size: generatedCode(file, extension, index).length, sizeKnown: true, function: `${module} ${extension.toUpperCase()} feature module`, codeContent: generatedCode(file, extension, index) };
    });
    return [];
  }
  function isVirtualRootName(name) { return VIRTUAL_SHORTCUTS.includes(name) && name !== 'data'; }
  function virtualRootEntry(name) {
    const meta = VIRTUAL_ROOT_META[name] || { desc: 'Folder virtual root — manajemen terpusat struktur sistem', items: 0 };
    return {
      path: name, type: 'directory', mode: '040755', sha: '', size: 0, sizeKnown: true,
      title: `/${name}`, desc: meta.desc, items: meta.items,
      function: `Folder virtual root /${name} — sub URL File Manager dengan pengaturan terpusat`,
      subUrl: `#fileManager/${name}`, virtualRoot: true,
    };
  }
  function localWorkspaceEntries() {
    let items = [];
    try { items = JSON.parse(localStorage.getItem('planetbintang.file-manager.workspace.v1') || '[]'); } catch { items = []; }
    const local = Array.isArray(items) ? items.filter((item) => item?.name).map((item) => ({
      path: `workspace/${String(item.name).replaceAll('/', '-')}`, type: 'file', mode: '0100644',
      size: String(item.content || '').length, sizeKnown: true, function: 'File workspace lokal — tersimpan di browser ini',
      localWorkspace: true, codeContent: String(item.content || ''),
    })) : [];
    local.push({ path: 'workspace/aireber', type: 'directory', mode: '040700', size: 0, sizeKnown: true, function: 'IndexedDB lokal AI Reber · prompts, projects, dan workspace' });
    return local;
  }
  function virtualChildren(path) {
    const generated = generatedSystemEntries(path);
    if (generated.length) return generated;
    const children = {
      proc: [
        { path: 'proc/self', type: 'directory', mode: '041777', function: 'Symlink proses saat ini' },
        { path: 'proc/stat', type: 'file', mode: '0100444', size: 0, sizeKnown: false, codeContent: 'cpu  864210 21930 152110 5210480 30210 4180 2990 0 0 0\ncpu0 108210 2710 19010 651310 3790 520 370 0 0 0\nintr 184122330 42 0 0 ...\nctxt 92114832\nbtime 1761200000\nprocesses 31245\nprocs_running 3\nprocs_blocked 0' },
        { path: 'proc/version', type: 'file', mode: '0100444', size: 84, sizeKnown: true, codeContent: 'Linux version 5.15.149-android13-8-00001 (build@android-build) #1 SMP PREEMPT' },
      ],
      sys: [
        { path: 'sys/class', type: 'directory', mode: '040755', function: 'Kelas perangkat (net, power_supply, usb)' },
        { path: 'sys/bus', type: 'directory', mode: '040755', function: 'Bus perangkat (platform, i2c, usb)' },
        { path: 'sys/kernel', type: 'directory', mode: '040755', function: 'Parameter kernel (mm, sched)' },
        { path: 'sys/system_ext', type: 'directory', mode: '040755', function: 'Mirror system_ext Planetbintang: catalog, features, modules, etc' },
        { path: 'sys/planetbintang', type: 'directory', mode: '040755', function: 'Registry fitur lanjutan Planetbintang' },
        { path: 'sys/enterprise', type: 'directory', mode: '040755', items: 10020, function: 'Enterprise Map List · Hyper-Enterprise Master Registry — 20 arsitektur × 500 menu (system_menus)' },
      ],
      media: [
        { path: 'media/README.md', type: 'file', mode: '0100644', size: 1300, sizeKnown: true, function: 'Dokumentasi folder media nyata yang tersimpan di Git', fetchPath: 'media/README.md' },
        { path: 'media/index.html', type: 'file', mode: '0100644', size: 2300, sizeKnown: true, function: 'Halaman publik Media Root dengan logo resmi Planetbintang', fetchPath: 'media/index.html' },
        { path: 'media/planetbintang-system.json', type: 'file', mode: '0100644', size: 1500, sizeKnown: true, function: 'Manifest identitas pusat dan kebijakan integritas sistem', fetchPath: 'media/planetbintang-system.json' },
        { path: 'media/brand', type: 'directory', mode: '040755', items: 1, function: 'Kebijakan logo dan identitas resmi Planetbintang' },
        { path: 'media/repositories', type: 'directory', mode: '040755', items: 1, function: 'Katalog rujukan seluruh repositori yang tercatat pada snapshot' },
        { path: 'media/emulated', type: 'directory', mode: '040770', function: 'Storage emulated pengguna (0..N); namespace kompatibilitas' },
        { path: 'media/asec', type: 'directory', mode: '040770', function: 'Container aplikasi terenkripsi; namespace kompatibilitas' },
      ],
      acct: [
        { path: 'acct/current', type: 'file', mode: '0100644', size: 28, sizeKnown: true, codeContent: '/uid_10123/pid_4567/apps' },
        { path: 'acct/debug', type: 'file', mode: '0100644', size: 0, sizeKnown: false, codeContent: '# cgroup accounting debug (tidak tersedia saat runtime)' },
      ],
      pro: [
        { path: 'pro/profiles', type: 'directory', mode: '040755', function: 'Profil perangkat & kebijakan' },
        { path: 'pro/pro.conf', type: 'file', mode: '0100644', size: 96, sizeKnown: true, codeContent: '[profile]\ndefault = base\nfallback = safe\nmode = managed' },
      ],
      config: [
        { path: 'config/services', type: 'directory', mode: '040755', function: 'Konfigurasi layanan sistem' },
        { path: 'config/system.conf', type: 'file', mode: '0100644', size: 120, sizeKnown: true, codeContent: 'manager centralized=true\nroot=/\nauto-mount=proc,sys\nlog-level=info' },
      ],
      cache: [
        { path: 'cache/recovery', type: 'directory', mode: '040770', function: 'Antrean perintah recovery (update_engine)' },
        { path: 'cache/global.config', type: 'file', mode: '0100644', size: 64, sizeKnown: true, codeContent: 'wipe_on_boot=false\nverbose_log=false' },
      ],
      system_ext: [
        { path: 'system_ext/etc', type: 'directory', mode: '040755', function: 'Konfigurasi partisi system_ext kompatibilitas' },
        { path: 'system_ext/compatibility_matrix.xml', type: 'file', mode: '0100644', size: 210, sizeKnown: true, codeContent: '<compatibility-matrix version="202404" type="framework">\n  <hal format="aidl" optional="false"><name>gatekeeper</name><version>1</version></hal>\n</compatibility-matrix>' },
      ],
      systsm_ext: [
        { path: 'systsm_ext/device-snapshots', type: 'directory', mode: '040700', function: 'Snapshot metadata perangkat yang terdeteksi; simpan metadata minimum, jangan salin rahasia' },
        { path: 'systsm_ext/system-catalog', type: 'directory', mode: '040700', function: 'Katalog modul staging yang siap divalidasi sebelum masuk sys' },
        { path: 'systsm_ext/reconstruction-queue.json', type: 'file', mode: '0100600', size: 0, sizeKnown: true, codeContent: '{\n  "schemaVersion": 1,\n  "source": "systsm_ext",\n  "target": "sys",\n  "state": "staging-only",\n  "requiresValidation": true,\n  "neverCopySecrets": true\n}' },
      ],
      'acct': [
        { path: 'acct/current', type: 'directory', mode: '040755', function: 'Accounting untuk sesi pengguna aktif' },
        { path: 'acct/uid_10123', type: 'directory', mode: '040755', function: 'Metadata namespace UID contoh' },
        { path: 'acct/README.md', type: 'file', mode: '0100644', size: 420, sizeKnown: true, codeContent: '# acct/\nNamespace accounting virtual File Manager. Bukan cgroup perangkat aktif.' },
      ],
      'acct/current': [
        { path: 'acct/current/apps', type: 'directory', mode: '040755', function: 'Accounting aplikasi pada sesi contoh' },
        { path: 'acct/current/README.md', type: 'file', mode: '0100644', size: 220, sizeKnown: true, codeContent: 'Snapshot accounting contoh; tidak membaca proses perangkat.' },
      ],
      'sys/class': [
        { path: 'sys/class/net', type: 'directory', mode: '040755', function: 'Kelas antarmuka jaringan virtual' },
        { path: 'sys/class/power_supply', type: 'directory', mode: '040755', function: 'Kelas status daya virtual' },
        { path: 'sys/class/usb', type: 'directory', mode: '040755', function: 'Kelas perangkat USB virtual' },
      ],
      'sys/bus': [
        { path: 'sys/bus/platform', type: 'directory', mode: '040755', function: 'Bus platform virtual' },
        { path: 'sys/bus/i2c', type: 'directory', mode: '040755', function: 'Bus I2C virtual' },
        { path: 'sys/bus/usb', type: 'directory', mode: '040755', function: 'Bus USB virtual' },
      ],
      'sys/kernel': [
        { path: 'sys/kernel/mm', type: 'directory', mode: '040755', function: 'Metadata pengelolaan memori virtual' },
        { path: 'sys/kernel/sched', type: 'directory', mode: '040755', function: 'Metadata penjadwalan virtual' },
        { path: 'sys/kernel/README.md', type: 'file', mode: '0100644', size: 180, sizeKnown: true, codeContent: 'Parameter kernel ilustratif; tidak terhubung ke kernel perangkat.' },
      ],
      'system_ext': [
        { path: 'system_ext/etc', type: 'directory', mode: '040755', function: 'Konfigurasi partisi system_ext kompatibilitas' },
        { path: 'system_ext/framework', type: 'directory', mode: '040755', function: 'Metadata framework ekstensi sistem' },
        { path: 'system_ext/priv-app', type: 'directory', mode: '040755', function: 'Inventaris aplikasi sistem berhak istimewa (metadata)' },
        { path: 'system_ext/permissions', type: 'directory', mode: '040755', function: 'Kebijakan izin dan allowlist (metadata)' },
        { path: 'system_ext/compatibility_matrix.xml', type: 'file', mode: '0100644', size: 210, sizeKnown: true, codeContent: '<compatibility-matrix version="202404" type="framework"><hal format="aidl" optional="false"><name>gatekeeper</name><version>1</version></hal></compatibility-matrix>' },
        { path: 'system_ext/README.md', type: 'file', mode: '0100644', size: 280, sizeKnown: true, codeContent: '# system_ext/\nStruktur virtual kompatibilitas; bukan salinan partisi Android asli.' },
      ],
      'system_ext/etc': [
        { path: 'system_ext/etc/permissions', type: 'directory', mode: '040755', function: 'Metadata izin system_ext' },
        { path: 'system_ext/etc/init', type: 'directory', mode: '040755', function: 'Metadata konfigurasi init system_ext' },
      ],
      'media': [
        { path: 'media/README.md', type: 'file', mode: '0100644', size: 1300, sizeKnown: true, function: 'Dokumentasi media', fetchPath: 'media/README.md' },
        { path: 'media/index.html', type: 'file', mode: '0100644', size: 2300, sizeKnown: true, function: 'Indeks media', fetchPath: 'media/index.html' },
        { path: 'media/brand', type: 'directory', mode: '040755', function: 'Aset identitas dan branding' },
        { path: 'media/repositories', type: 'directory', mode: '040755', function: 'Metadata repositori' },
        { path: 'media/emulated', type: 'directory', mode: '040770', function: 'Namespace penyimpanan emulasi virtual' },
        { path: 'media/asec', type: 'directory', mode: '040770', function: 'Namespace container aplikasi virtual' },
      ],
      'config': [
        { path: 'config/services', type: 'directory', mode: '040755', function: 'Konfigurasi layanan sistem' },
        { path: 'config/permissions', type: 'directory', mode: '040755', function: 'Kebijakan izin sistem' },
        { path: 'config/system.conf', type: 'file', mode: '0100644', size: 120, sizeKnown: true, codeContent: 'manager centralized=true\nroot=/\nauto-mount=proc,sys\nlog-level=info' },
        { path: 'config/README.md', type: 'file', mode: '0100644', size: 220, sizeKnown: true, codeContent: '# config/\nKonfigurasi virtual yang aman untuk demonstrasi; tidak mengubah perangkat.' },
      ],
      'config/services': [
        { path: 'config/services/services.json', type: 'file', mode: '0100644', size: 120, sizeKnown: true, codeContent: '{ "schemaVersion": 1, "services": [], "source": "virtual-file-manager" }' },
      ],
      'cache': [
        { path: 'cache/recovery', type: 'directory', mode: '040770', function: 'Metadata antrean recovery virtual' },
        { path: 'cache/tmp', type: 'directory', mode: '040700', function: 'Area temporer virtual' },
        { path: 'cache/global.config', type: 'file', mode: '0100644', size: 64, sizeKnown: true, codeContent: 'wipe_on_boot=false\nverbose_log=false' },
      ],
      'cache/recovery': [
        { path: 'cache/recovery/README.md', type: 'file', mode: '0100644', size: 180, sizeKnown: true, codeContent: 'Metadata recovery virtual; tidak menjalankan update_engine.' },
        { path: 'cache/recovery/commands.txt', type: 'file', mode: '0100600', size: 0, sizeKnown: true, codeContent: '# Tidak ada perintah recovery aktif.' },
      ],
      'acct/uid_10123': [
        { path: 'acct/uid_10123/apps', type: 'directory', mode: '040755', function: 'Accounting aplikasi UID contoh' },
        { path: 'acct/uid_10123/README.md', type: 'file', mode: '0100644', size: 160, sizeKnown: true, codeContent: 'UID ini ilustratif; tidak membaca akun atau proses perangkat.' },
      ],
      'sys/class/net': [
        { path: 'sys/class/net/README.md', type: 'file', mode: '0100444', size: 120, sizeKnown: true, codeContent: 'Antarmuka jaringan virtual; tidak terhubung ke perangkat.' },
      ],
      'sys/class/power_supply': [
        { path: 'sys/class/power_supply/README.md', type: 'file', mode: '0100444', size: 120, sizeKnown: true, codeContent: 'Metadata baterai virtual; tidak membaca sensor perangkat.' },
      ],
      'sys/class/usb': [
        { path: 'sys/class/usb/README.md', type: 'file', mode: '0100444', size: 120, sizeKnown: true, codeContent: 'Inventaris USB virtual; tidak membaca bus perangkat.' },
      ],
      'sys/bus/platform': [
        { path: 'sys/bus/platform/README.md', type: 'file', mode: '0100444', size: 120, sizeKnown: true, codeContent: 'Bus platform ilustratif.' },
      ],
      'sys/bus/i2c': [
        { path: 'sys/bus/i2c/README.md', type: 'file', mode: '0100444', size: 120, sizeKnown: true, codeContent: 'Bus I2C ilustratif.' },
      ],
      'sys/bus/usb': [
        { path: 'sys/bus/usb/README.md', type: 'file', mode: '0100444', size: 120, sizeKnown: true, codeContent: 'Bus USB ilustratif.' },
      ],
      'sys/kernel/mm': [
        { path: 'sys/kernel/mm/README.md', type: 'file', mode: '0100444', size: 120, sizeKnown: true, codeContent: 'Metadata manajemen memori virtual.' },
      ],
      'sys/kernel/sched': [
        { path: 'sys/kernel/sched/README.md', type: 'file', mode: '0100444', size: 120, sizeKnown: true, codeContent: 'Metadata penjadwalan virtual.' },
      ],
      'system_ext/framework': [
        { path: 'system_ext/framework/README.md', type: 'file', mode: '0100644', size: 180, sizeKnown: true, codeContent: 'Inventaris framework ekstensi sistem (metadata virtual).' },
      ],
      'system_ext/priv-app': [
        { path: 'system_ext/priv-app/README.md', type: 'file', mode: '0100644', size: 180, sizeKnown: true, codeContent: 'Inventaris aplikasi sistem (metadata saja; tidak ada APK perangkat).' },
      ],
      'system_ext/permissions': [
        { path: 'system_ext/permissions/README.md', type: 'file', mode: '0100644', size: 180, sizeKnown: true, codeContent: 'Metadata kebijakan izin system_ext.' },
      ],
      'system_ext/etc/permissions': [
        { path: 'system_ext/etc/permissions/README.md', type: 'file', mode: '0100644', size: 160, sizeKnown: true, codeContent: 'Metadata izin virtual.' },
      ],
      'system_ext/etc/init': [
        { path: 'system_ext/etc/init/README.md', type: 'file', mode: '0100644', size: 160, sizeKnown: true, codeContent: 'Metadata init virtual; tidak menjalankan layanan perangkat.' },
      ],
      'media/emulated': [
        { path: 'media/emulated/0', type: 'directory', mode: '040770', function: 'Storage pengguna contoh' },
        { path: 'media/emulated/README.md', type: 'file', mode: '0100644', size: 160, sizeKnown: true, codeContent: 'Namespace emulasi virtual; bukan storage perangkat.' },
      ],
      'media/emulated/0': [
        { path: 'media/emulated/0/Download', type: 'directory', mode: '040770', function: 'Folder Download contoh' },
        { path: 'media/emulated/0/Documents', type: 'directory', mode: '040770', function: 'Folder Documents contoh' },
        { path: 'media/emulated/0/README.md', type: 'file', mode: '0100644', size: 150, sizeKnown: true, codeContent: 'Folder pengguna virtual.' },
      ],
      'media/emulated/0/Download': [
        { path: 'media/emulated/0/Download/README.md', type: 'file', mode: '0100644', size: 120, sizeKnown: true, codeContent: 'Tidak ada file unduhan perangkat yang disalin.' },
      ],
      'media/emulated/0/Documents': [
        { path: 'media/emulated/0/Documents/README.md', type: 'file', mode: '0100644', size: 120, sizeKnown: true, codeContent: 'Tidak ada dokumen perangkat yang disalin.' },
      ],
      'media/asec': [
        { path: 'media/asec/README.md', type: 'file', mode: '0100644', size: 160, sizeKnown: true, codeContent: 'Container aplikasi virtual; tidak berisi data aplikasi asli.' },
      ],
      'config/permissions': [
        { path: 'config/permissions/README.md', type: 'file', mode: '0100644', size: 140, sizeKnown: true, codeContent: 'Kebijakan izin demonstrasi; tidak diterapkan pada perangkat.' },
      ],
      'cache/tmp': [
        { path: 'cache/tmp/README.md', type: 'file', mode: '0100600', size: 120, sizeKnown: true, codeContent: 'Area temporer virtual; tidak berisi cache perangkat.' },
      ],
    };
    if (path === 'media/brand') return [
      { path: 'media/brand/IDENTITY.md', type: 'file', mode: '0100644', function: 'Kebijakan identitas resmi; logo sumber tetap aset kanonis pada root', fetchPath: 'media/brand/IDENTITY.md' },
    ];
    if (path === 'media/repositories') return [
      { path: 'media/repositories/README.md', type: 'file', mode: '0100644', function: 'Penjelasan katalog metadata dan batas mirror repo privat', fetchPath: 'media/repositories/README.md' },
    ];
    if (path === 'systsm_ext') return children.systsm_ext;
    if (path.startsWith('systsm_ext/')) return [];
    if (path === 'system_ext') return children.system_ext;
    if (path === 'workspace') return localWorkspaceEntries();
    return children[path] || [];
  }
  const EXT_FUNCTION = {
    APK: 'Paket aplikasi Android (Java/Kotlin terdex)', SO: 'Pustaka bersama native ELF (C/C++)', JAR: 'Pustaka/framework Java',
    XML: 'Konfigurasi/manifest berbasis teks', HTML: 'Dokumen struktur halaman web', CSS: 'Style sheet antarmuka web', JS: 'Kode JavaScript dan perilaku antarmuka', NZ: 'Format kode Planetbintang (.nz)', RC: 'Skrip init service (Android init language)', PROP: 'Pasangan kunci=nilai properti',
    TXT: 'Teks biasa (log/laporan)', DB: 'Database SQLite', CONF: 'File konfigurasi teks', BIN: 'Data biner mentah',
    IMG: 'Image partisi/filesystem', ODEX: 'Hasil AOT dex teroptimasi', VDEX: 'Verifikasi dex compact', MP4: 'Video (H.264/HEVC)',
    MKV: 'Kontainer video Matroska', JPG: 'Foto terkompresi', PNG: 'Gambar lossless', WEBP: 'Gambar web modern', MP3: 'Audio terkompresi',
    FLAC: 'Audio lossless', OGG: 'Audio Vorbis (nada dering/notifikasi)', PDF: 'Dokumen portabel', DOCX: 'Dokumen Word Office Open XML',
    KO: 'Modul kernel loadable', LIST: 'Daftar teks baris-per-item', ZIP: 'Arsip terkompresi', DAT: 'Data terstruktur biner/teks',
    LOG: 'Log teks historis', UEVENT: 'Event uevent perangkat', PROC: 'Daftar PID cgroup (teks)', SIZE: 'Ukuran sektor perangkat (teks)',
  };
  function isVirtualRepo() { return state.repo === VIRTUAL_REPO || (state.repo === L_REPO && state.manifest?.virtual === true); }
  // Repo `.L` selalu memakai indeks pohon nyata (folder & file repositori),
  // termasuk saat dibuka dari File Manager di menu utama.
  function isLRepo() { return state.repo === L_REPO; }
  // Root .L = gabungan pohon nyata repositori + folder sistem virtual tingkat root.
  function lRootVirtualNames() {
    const existing = new Set(Object.keys(state.manifest?.directories || {}));
    return VIRTUAL_SHORTCUTS.filter((name) => !existing.has(name));
  }
  function isLVirtualPath(path) {
    if (!isLRepo()) return false;
    const top = String(path || '').split('/')[0];
    if (!top || !isVirtualRootName(top)) return false;
    // Prefer the actual indexed repository directory whenever it exists.
    // In particular, /data is a real .L directory and must not be shadowed
    // by a same-named virtual Android namespace.
    const actualDirectories = state.manifest?.directories || {};
    if (Object.prototype.hasOwnProperty.call(actualDirectories, top)) return false;
    return true;
  }
  function syncUrlPath() {
    if (!isVirtualRepo()) return;
    const target = `#fileManager${state.path ? `/${state.path}` : ''}`;
    if (window.location.hash !== target) window.history.replaceState({ systemRoute: 'file-manager' }, '', target);
  }
  function extensionFunction(path) {
    const e = ext(path);
    if (e && EXT_FUNCTION[e]) return EXT_FUNCTION[e];
    const dot = String(path).lastIndexOf('.');
    return dot > 0 ? `File berekstensi .${path.slice(dot + 1)}` : 'File sistem tanpa ekstensi (node/procs/teks)';
  }

  function el(tag, value, className) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (value !== undefined && value !== null) item.textContent = String(value);
    return item;
  }
  function repoNow() { return state.data?.repositories?.find((item) => item.fullName === state.repo) || null; }
  function basename(path) { return String(path || '').split('/').pop() || '/'; }
  function normalizePath(value) {
    const parts = String(value || '').replaceAll('\\', '/').split('/').filter(Boolean);
    return parts.some((part) => part === '.' || part === '..') ? null : parts.join('/');
  }
  function humanSize(value) {
    const size = Number(value) || 0;
    if (size < 1024) return `${fmt.format(size)} B`;
    if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 ** 2).toFixed(2)} MB`;
  }
  function sizeText(item) { return item?.sizeKnown === false ? 'tidak tersedia' : humanSize(item?.size); }
  function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
  }
  async function verifyHash(payload) {
    if (!payload?.dataSha256 || !window.crypto?.subtle) return;
    const body = { ...payload }; const expected = body.dataSha256; delete body.dataSha256;
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(body)));
    const actual = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    if (actual !== expected) throw new Error('SHA-256 shard tidak cocok');
  }
  async function parseResponse(response) {
    const bytes = await response.arrayBuffer();
    let stream = new Blob([bytes]).stream();
    const header = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 2));
    if (header[0] === 0x1f && header[1] === 0x8b) {
      if (!('DecompressionStream' in window)) throw new Error('Browser ini belum mendukung dekompresi gzip');
      stream = stream.pipeThrough(new DecompressionStream('gzip'));
    }
    const payload = JSON.parse(await new Response(stream).text());
    await verifyHash(payload);
    return payload;
  }
  function fmtDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date) + ' UTC';
  }
  function ext(path) {
    const name = basename(path); const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(dot + 1).toUpperCase().slice(0, 4) : '';
  }
  function isHiddenRepository(repo) {
    const name = String(repo?.name ?? '').trim();
    return /^[0-9]$/.test(name);
  }
  function matchesExtension(item) {
    return item.type === 'directory' || state.extension === 'all' || ext(item.path).toLowerCase() === state.extension;
  }
  function kind(entry) { return entry.type === 'directory' ? 'DIR' : entry.type === 'submodule' ? 'SUB' : ext(entry.path) || 'FILE'; }
  function treeStateLabel(tree) { return tree?.state === 'complete' ? 'LENGKAP' : tree?.state === 'partial' ? 'PARSIAL' : tree?.state === 'empty' ? 'KOSONG' : 'TIDAK TERSEDIA'; }
  function currentDirectory() { return state.manifest?.directories?.[state.path] || { entryCount: 0, pages: [] }; }
  function isDirectory(path) {
    if (Boolean(state.manifest?.directories && Object.hasOwn(state.manifest.directories, path))) return true;
    // Folder sistem virtual tingkat root .L juga dianggap direktori valid.
    return isLVirtualPath(path);
  }

  function lVirtualEntriesFor(prefix) {
    const top = String(prefix || '').split('/')[0];
    if (!top) return VIRTUAL_SHORTCUTS.filter((name) => isVirtualRootName(name) && !Object.prototype.hasOwnProperty.call(state.manifest?.directories || {}, name)).map(virtualRootEntry);
    if (!isLVirtualPath(prefix)) return [];
    if (prefix === top) return virtualChildren(top);
    const generated = generatedSystemEntries(prefix);
    if (generated.length) return generated;
    // Ask for the selected directory's own children, not its root's immediate
    // children; otherwise folders such as acct/current always appeared empty.
    return virtualChildren(prefix).filter((item) => item.path.startsWith(`${prefix}/`) && !item.path.slice(prefix.length + 1).includes('/'));
  }

  // ---- Pengaturan & tampilan terpusat per folder (localStorage) ----
  const SETTINGS_STORE = 'planetbintang.fm.virtual-settings.v1';
  function readAllSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_STORE) || '{}') || {}; } catch { return {}; }
  }
  function readFolderSettings(path) {
    const all = readAllSettings();
    return { sort: 'dir-first', folderIcon: true, dense: false, ...(all[path] || {}) };
  }
  function saveFolderSettings(path, patch) {
    try {
      const all = readAllSettings();
      all[path] = { ...readFolderSettings(path), ...patch };
      localStorage.setItem(SETTINGS_STORE, JSON.stringify(all));
    } catch { /* penyimpanan penuh/diblokir — pengaturan tetap di memori */ }
    renderTiles();
  }
  function sortItems(items) {
    const settings = isVirtualRepo() ? readFolderSettings(state.path) : null;
    if (settings) {
      const list = [...items];
      if (settings.sort === 'size') {
        return list.sort((a, b) => Number(b.type === 'directory') - Number(a.type === 'directory')
          || (Number(b.size || 0) - Number(a.size || 0)) || basename(a.path).localeCompare(basename(b.path), 'id'));
      }
      if (settings.sort === 'name') {
        return list.sort((a, b) => basename(a.path).localeCompare(basename(b.path), 'id', { sensitivity: 'base' }));
      }
    }
    return [...items].sort((a, b) => Number(b.type === 'directory') - Number(a.type === 'directory') || basename(a.path).localeCompare(basename(b.path), 'id', { sensitivity: 'base' }));
  }

  function addInfo(parent, label, value, mono = false) {
    const row = el('div', undefined, 'fm-info-row');
    row.append(el('span', label, 'fm-info-label'), el('span', value || '—', mono ? 'fm-info-value mono' : 'fm-info-value'));
    parent.append(row);
  }
  function githubPathUrl() {
    // File Manager hanya memakai metadata snapshot lokal; tidak membuat URL provider.
    return '';
  }

  function renderAssessment(repo) {
    if (isLRepo() && (state.path === 'workspace/aireber' || state.path.startsWith('workspace/aireber/'))) {
      const files = state.entries.filter((item) => item.type === 'file').length;
      const folders = state.entries.filter((item) => item.type === 'directory').length;
      $('#fileTreeStatus').textContent = `WORKSPACE REBER · ${fmt.format(files)} file · ${fmt.format(folders)} folder · IndexedDB perangkat ini`;
      $('#fileIntegrityStatus').textContent = 'Penyimpanan lokal browser · bukan isi source GitHub';
      $('#fileActivityStatus').textContent = 'Dapat dibaca dan diedit dari AI Reber · tidak tersinkron antarperangkat';
      $('#fileSelectionTitle').textContent = 'Workspace lokal AI Reber';
      const panel = $('#fileSelectionData'); panel.replaceChildren();
      addInfo(panel, 'Namespace', '/aireber/', true);
      addInfo(panel, 'Path aktif', `/${state.path}`, true);
      addInfo(panel, 'Isi langsung', `${fmt.format(files)} file · ${fmt.format(folders)} folder`);
      addInfo(panel, 'Runtime', 'GitHub Pages statis · file tidak dieksekusi');
      panel.append(el('p', 'Data berasal dari IndexedDB browser pada perangkat ini. Kuota dan persistensi mengikuti kebijakan browser.', 'fm-inspector-disclaimer'));
      $('#fileOpenGitHub').hidden = true;
      $('#fileOpenEditorButton').hidden = true;
      return;
    }
    if (isVirtualRepo()) {
      const manifest = state.manifest || {};
      const directory = currentDirectory();
      $('#fileTreeStatus').textContent = `SUB URL /.L · ROOT SISTEM · ${fmt.format(manifest.fileCount || 0)} file · ${fmt.format(manifest.directoryCount || 0)} folder · ${humanSize(manifest.totalBytes || 0)} metadata`;
      $('#fileIntegrityStatus').textContent = 'Struktur virtual: LENGKAP · shard SHA-256 terverifikasi · bukan pohon Git';
      $('#fileActivityStatus').textContent = 'Manajemen terpusat: /data /proc /sys /media /acct /pro /config /cache /system_ext';
      if (state.selected) return;
      $('#fileSelectionTitle').textContent = 'Pusat Manajemen Folder Sistem (.L)';
      const panel = $('#fileSelectionData'); panel.replaceChildren();
      addInfo(panel, 'Jenis sistem', 'Sub URL repository `.L` — root virtual File Manager');
      addInfo(panel, 'Basis sub URL', 'planetbintang.snapshot lokal `.L`/ → path `/`');
      addInfo(panel, 'Folder tingkat root', VIRTUAL_SHORTCUTS.map((name) => `/${name}`).join(' · '));
      const managedDirs = new Set(Object.keys(manifest.directories || {}));
      lRootVirtualNames().forEach((name) => managedDirs.add(name));
      addInfo(panel, 'Total entri terkelola', `${fmt.format((manifest.entryCount || 0) + virtualChildren('__root__').length)} path`);
      addInfo(panel, 'Folder terkelola', fmt.format(Math.max(0, managedDirs.size - 1)));
      addInfo(panel, 'Isi path aktif', `${fmt.format((directory.entryCount || 0) + (state.path ? 0 : lRootVirtualNames().length))} item${state.path ? ` · /${state.path}` : ' · /'}`);
      addInfo(panel, 'URL aktif saat ini', `${window.location.origin}${window.location.pathname}#fileManager${state.path ? `/${state.path}` : ''}`, true);
      const block = el('div', undefined, 'fm-candidate-list');
      block.append(el('span', 'Fungsi tiap folder root (klik judul untuk membuka)', 'fm-info-label'));
      const list = el('ul');
      // Folder root = daftar shortcut sistem (VIRTUAL_SHORTCUTS) + folder nyata repositori.
      const realDirNames = Object.keys(manifest.directories || {}).filter((name) => name && !name.includes('/'));
      const rootOrder = [...new Set([...VIRTUAL_SHORTCUTS, ...realDirNames])];
      const roots = rootOrder.map((name) => {
        if (isVirtualRootName(name)) return virtualRootEntry(name);
        const fromManifest = Array.isArray(manifest.roots) ? manifest.roots.find((item) => basename(item.path) === name) : null;
        if (fromManifest) return fromManifest;
        const dir = manifest.directories?.[name];
        return { path: name, title: `/${name}`, desc: 'Folder nyata repositori .L — pohon Git terverifikasi', items: dir?.entryCount || 0 };
      });
      roots.forEach((root) => {
        const li = el('li');
        const link = el('button', `${root.title} (${fmt.format(root.items || 0)} item)`, 'fm-root-link');
        link.type = 'button';
        link.addEventListener('click', () => goTo(root.path));
        li.append(link, el('span', ` ${root.desc || ''}`));
        list.append(li);
      });
      block.append(list);
      panel.append(block, el('p', 'Setiap folder memakai ikon folder File Manager yang sama untuk semua jenis nama folder. Isi file berupa kode contoh sesuai nama/fungsi folder; blob repo nyata tidak dipublikasikan.', 'fm-inspector-disclaimer'));
      $('#fileOpenGitHub').hidden = true;
      return;
    }
    const tree = repo?.tree || {}; const assessment = repo?.staticAssessment || {};
    const label = treeStateLabel(tree);
    $('#fileTreeStatus').textContent = `${label} · ${fmt.format(tree.fileCount || 0)} file · ${fmt.format(tree.directoryCount || 0)} folder · ${humanSize(tree.totalBytes || 0)} tercatat${tree.sizeUnknownCount ? ` · ${fmt.format(tree.sizeUnknownCount)} size N/A` : ''}`;
    $('#fileIntegrityStatus').textContent = `Integritas struktur: ${assessment.integrityCoverage || 'tree-unavailable'} · Git tree ${tree.treeSha ? tree.treeSha.slice(0, 12) : '—'}${tree.redactedCount ? ` · ${fmt.format(tree.redactedCount)} path disaring` : ''}`;
    $('#fileActivityStatus').textContent = `Aktivitas: ${repo?.branch || '—'} · commit ${fmtDate(repo?.lastCommitAt)}`;
    if (state.selected) return;
    $('#fileSelectionTitle').textContent = repo?.fullName || 'Pilih repository';
    const panel = $('#fileSelectionData'); panel.replaceChildren();
    addInfo(panel, 'Jenis sistem', repo?.appType || '—');
    addInfo(panel, 'Pohon Git', `${label} · ${fmt.format(tree.entryCount || 0)} path`);
    addInfo(panel, 'Git tree SHA', tree.treeSha ? tree.treeSha.slice(0, 12) : '—', true);
    addInfo(panel, 'File executable bit', fmt.format(assessment.executableFileCount || 0));
    addInfo(panel, 'Eksekusi kode', 'TIDAK DIJALANKAN');
    const candidates = Array.isArray(assessment.runnableCandidates) ? assessment.runnableCandidates : [];
    const block = el('div', undefined, 'fm-candidate-list');
    block.append(el('span', 'Kandidat entry point / manifest', 'fm-info-label'));
    if (candidates.length) {
      const list = el('ul');
      candidates.slice(0, 8).forEach((item) => list.append(el('li', `${item.path} · ${item.label}`)));
      block.append(list);
    } else block.append(el('p', 'Belum terdeteksi dari nama file.'));
    panel.append(block, el('p', 'Metadata struktur saja; bukan audit keamanan atau bukti kode aman dijalankan.', 'fm-inspector-disclaimer'));
    $('#fileOpenGitHub').hidden = true;
  }


  const SITE_ENTRY_NAMES = ['index.html', 'index.php', 'index.ts', 'index.tsx', 'index.js', 'index.jsx'];
  function rawFileUrl(path) {
    const repo = repoNow();
    if (!repo?.fullName || !repo?.branch || repo.fullName.includes(' ')) return '';
    const encodedPath = String(path).split('/').map((part) => encodeURIComponent(part)).join('/');
    return `https://raw.githubusercontent.com/${repo.fullName}/${encodeURIComponent(repo.branch)}/${encodedPath}`;
  }
  async function findFolderIndex(path) {
    const directory = state.manifest?.directories?.[path];
    if (!directory) return null;
    const candidates = [];
    for (const page of (directory.pages || [])) {
      if (!page?.url || !/^(?:data\/trees\/[a-f0-9]{16}\/pages\/|[a-f0-9]{16}\/pages\/)[a-f0-9]{32}\.json\.gz$/.test(page.url)) continue;
      const response = await fetch(`./${page.url}`, { cache: 'force-cache', credentials: 'omit' });
      if (!response.ok) continue;
      const payload = await parseResponse(response);
      if (payload.repository !== state.repo || payload.path !== path || !Array.isArray(payload.entries)) continue;
      candidates.push(...payload.entries.filter((entry) => entry.type === 'file' && SITE_ENTRY_NAMES.includes(basename(entry.path).toLowerCase())));
    }
    // Prioritas: index.html, index.php, index.ts, index.tsx, index.js, index.jsx.
    candidates.sort((a, b) => SITE_ENTRY_NAMES.indexOf(basename(a.path).toLowerCase()) - SITE_ENTRY_NAMES.indexOf(basename(b.path).toLowerCase()));
    return candidates[0] || null;
  }
  async function openFolderOrIndex(path) {
    const requestRepo = state.repo;
    try {
      const entry = await findFolderIndex(path);
      if (requestRepo !== state.repo) return;
      if (entry) {
        state.path = path;
        state.selected = entry.path;
        renderBreadcrumbs();
        renderAssessment(repoNow());
        renderTiles();
        renderSelection(entry);
        $('#fileTreeStatus').textContent = `Membuka tampilan situs dari /${entry.path}`;
        return;
      }
    } catch (error) {
      $('#fileTreeStatus').textContent = `Index folder tidak dapat diperiksa: ${error.message}`;
    }
    goTo(path);
  }
  function sitePreviewFrame(parent, title) {
    const wrap = el('section', undefined, 'fm-static-preview');
    wrap.style.cssText = 'margin:14px 0;border:1px solid rgba(120,180,230,.35);background:#fff;color:#111;min-width:0;';
    const bar = el('div', undefined, 'fm-static-preview-bar');
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;background:#10223b;color:#eaf4ff;font:12px/1.4 system-ui,sans-serif;';
    bar.append(el('strong', `Pratinjau situs · ${title}`));
    const open = el('button', 'Buka tab baru ↗');
    open.type = 'button'; open.style.cssText = 'padding:5px 8px;border:1px solid #6b9ac8;background:#173b5f;color:white;cursor:pointer;';
    bar.append(open);
    const frame = document.createElement('iframe');
    frame.title = `Pratinjau statis ${title}`;
    frame.sandbox = 'allow-scripts allow-forms allow-popups';
    frame.referrerPolicy = 'no-referrer';
    frame.style.cssText = 'display:block;width:100%;height:min(70vh,720px);min-height:360px;border:0;background:white;';
    open.addEventListener('click', () => {
      const doc = frame.srcdoc;
      const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
    wrap.append(bar, frame);
    parent.append(wrap);
    return frame;
  }
  async function renderStaticSite(entry, panel) {
    const extension = ext(entry.path).toLowerCase();
    if (!['html', 'php', 'ts', 'tsx', 'js', 'jsx'].includes(extension)) return;
    const sourceUrl = rawFileUrl(entry.path);
    if (!sourceUrl) return;
    const block = el('div', undefined, 'fm-candidate-list');
    block.append(el('span', 'RENDER SITUS STATIS · isi file dan aset relatif dari repositori', 'fm-info-label'));
    const frame = sitePreviewFrame(block, basename(entry.path));
    const note = el('p', undefined, 'fm-inspector-disclaimer');
    note.textContent = extension === 'php'
      ? 'Mode statis: kode PHP tidak dieksekusi; bagian HTML di luar tag PHP ditampilkan saja.'
      : (extension === 'ts' || extension === 'tsx')
        ? 'TypeScript/TSX ditranspilasi di browser untuk pratinjau. Fitur server, API, dan paket yang tidak tersedia di browser tidak dijalankan.'
        : 'Pratinjau terisolasi di iframe; navigasi dan aset relatif diarahkan ke file pada repositori.';
    block.append(note);
    panel.append(block);
    try {
      const response = await fetch(sourceUrl, { cache: 'no-cache', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let source = await response.text();
      const baseUrl = sourceUrl.slice(0, sourceUrl.lastIndexOf('/') + 1);
      let html = '';
      if (extension === 'html') {
        html = source.replace(/<head(\s[^>]*)?>/i, (tag) => `${tag}<base href="${baseUrl}">`);
        if (!/<head(?:\s[^>]*)?>/i.test(source)) html = `<!doctype html><html><head><meta charset="utf-8"><base href="${baseUrl}"></head><body>${source}</body></html>`;
      } else if (extension === 'php') {
        // Tidak ada runtime PHP pada GitHub Pages; keluarkan markup statis di luar blok PHP.
        source = source.replace(/<\?(?:php|=)?[\s\S]*?\?>/gi, '');
        html = `<!doctype html><html><head><meta charset="utf-8"><base href="${baseUrl}"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${source}</body></html>`;
      } else if (extension === 'js') {
        html = `<!doctype html><html><head><meta charset="utf-8"><base href="${baseUrl}"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="app"></main><script>try{(new Function(${JSON.stringify(source)}))()}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="white-space:pre-wrap;color:#a00"></pre>');document.querySelector('pre').textContent=e.stack||e.message}</script></body></html>`;
      } else if (extension === 'jsx' || extension === 'tsx') {
        html = `<!doctype html><html><head><meta charset="utf-8"><base href="${baseUrl}"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script></head><body><main id="app"></main><script type="text/babel" data-presets="env,react,typescript"> ${source.replace(/<\/script/gi, '<\\/script')} </script></body></html>`;
      } else {
        // TypeScript tanpa bundler: transpile minimal untuk konstruksi umum, lalu jalankan terisolasi.
        const js = source.replace(/^\s*import\s+type\b[^;]*;?/gm, '')
          .replace(/^\s*export\s+type\b[^;]*;?/gm, '')
          .replace(/^\s*interface\s+\w+[\s\S]*?^}\s*;?/gm, '')
          .replace(/^\s*type\s+\w+\s*=.*;?\s*$/gm, '')
          .replace(/:\s*(string|number|boolean|any|unknown|void|never)(\[\])?(?=\s*[,)=;{])/g, '')
          .replace(/\s+as\s+(string|number|boolean|any|unknown|\w+)(\[\])?/g, '');
        html = `<!doctype html><html><head><meta charset="utf-8"><base href="${baseUrl}"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="app"></main><script>try{(new Function(${JSON.stringify(js)}))()}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="white-space:pre-wrap;color:#a00"></pre>');document.querySelector('pre').textContent='Pratinjau TS terbatas: '+(e.stack||e.message)}</script></body></html>`;
      }
      frame.srcdoc = html;
    } catch (error) {
      frame.srcdoc = `<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;padding:24px"><h2>Pratinjau tidak tersedia</h2><p>${String(error.message).replace(/[&<>"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))}</p><p>Pastikan file dapat dibaca dari repositori publik.</p></body>`;
    }
  }

  function renderSelection(entry) {
    const repo = repoNow(); state.selected = entry?.path || null;
    $('#fileSelectionTitle').textContent = entry ? basename(entry.path) : repo?.fullName || 'Pilih file atau folder';
    const panel = $('#fileSelectionData'); panel.replaceChildren();
    if (!entry) { renderAssessment(repo); return; }
    addInfo(panel, 'Path', `/${entry.path}`, true);
    addInfo(panel, 'Jenis', entry.type === 'directory' ? 'Folder' : entry.type === 'submodule' ? 'Git submodule' : 'File');
    if (isVirtualRepo()) {
      addInfo(panel, 'Fungsi', entry.function || (entry.type === 'directory' ? 'Folder manajemen terpusat sistem' : extensionFunction(entry.path)));
      addInfo(panel, 'Ekstensi', entry.type === 'directory' ? '— (folder)' : ext(entry.path) || 'tanpa ekstensi');
      if (entry.type === 'directory') {
        const sub = state.manifest?.directories?.[entry.path];
        addInfo(panel, 'Isi folder', sub ? `${fmt.format(sub.entryCount)} item · manajemen terpusat aktif` : 'belum termuat');
        addInfo(panel, 'Sub URL folder', entry.subUrl || `#fileManager/${entry.path}`, true);
      } else {
        addInfo(panel, 'Ukuran metadata', sizeText(entry));
      }
      addInfo(panel, 'Mode', entry.mode || '—', true);
      addInfo(panel, 'Root virtual', `/${String(entry.path).split('/')[0]}`);
      // Pengaturan & tampilan terpusat per folder: preferensi lokal tersimpan di localStorage.
      if (entry.type === 'directory') {
        const settings = readFolderSettings(entry.path);
        const heading = el('div', undefined, 'fm-candidate-list');
        heading.append(el('span', 'PENGATURAN TERPUSAT FOLDER', 'fm-info-label'));
        const controls = el('div', undefined, 'fm-folder-settings');
        const sortLabel = el('label', undefined, 'fm-setting-row');
        const sortSelect = document.createElement('select');
        [['name', 'Urut: nama'], ['dir-first', 'Urut: folder dulu'], ['size', 'Urut: ukuran']]
          .forEach(([value, text]) => sortSelect.add(new Option(text, value)));
        sortSelect.value = settings.sort;
        sortSelect.addEventListener('change', () => saveFolderSettings(entry.path, { sort: sortSelect.value }));
        sortLabel.append(el('span', 'Urutan tampilan'), sortSelect);
        const iconRow = el('label', undefined, 'fm-setting-row');
        const iconToggle = document.createElement('input');
        iconToggle.type = 'checkbox'; iconToggle.checked = settings.folderIcon !== false;
        iconToggle.addEventListener('change', () => saveFolderSettings(entry.path, { folderIcon: iconToggle.checked }));
        iconRow.append(el('span', 'Ikon folder File Manager'), iconToggle);
        const denseRow = el('label', undefined, 'fm-setting-row');
        const denseToggle = document.createElement('input');
        denseToggle.type = 'checkbox'; denseToggle.checked = Boolean(settings.dense);
        denseToggle.addEventListener('change', () => { saveFolderSettings(entry.path, { dense: denseToggle.checked }); renderTiles(); });
        denseRow.append(el('span', 'Tampilan padat'), denseToggle);
        const openButton = el('button', 'Buka sebagai sub URL ↗', 'text-button fm-suburl-open');
        openButton.type = 'button';
        openButton.addEventListener('click', () => goTo(entry.path));
        controls.append(sortLabel, iconRow, denseRow, openButton);
        heading.append(controls);
        panel.append(heading);
      } else if (entry.fetchPath && !entry.codeContent) {
        const block = el('div', undefined, 'fm-candidate-list');
        block.append(el('span', 'REGISTRY ROW · dimuat dari shard JSON statis', 'fm-info-label'));
        const pre = el('pre', 'Memuat isi registry…', 'fm-code-preview');
        block.append(pre);
        panel.append(block);
        fetch(`./${entry.fetchPath}`, { cache: 'no-cache', credentials: 'omit' })
          .then((response) => (response.ok ? response.text() : Promise.reject(new Error(`HTTP ${response.status}`))))
          .then((text) => { entry.codeContent = text; pre.textContent = text; })
          .catch(() => { pre.textContent = '[Registry shard belum termaterialisasi di perangkat ini — jalankan scripts/generate_enterprise_map.py]'; });
      } else if (entry.codeContent) {
        const block = el('div', undefined, 'fm-candidate-list');
        block.append(el('span', 'ISI KODE CONTOH (sesuai nama/fungsi file)', 'fm-info-label'));
        const pre = el('pre', entry.codeContent, 'fm-code-preview');
        const copy = el('button', 'Salin isi kode', 'text-button');
        copy.type = 'button';
        copy.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(entry.codeContent); copy.textContent = 'Tersalin ✓'; }
          catch { copy.textContent = 'Gagal menyalin'; }
          setTimeout(() => { copy.textContent = 'Salin isi kode'; }, 1600);
        });
        block.append(pre, copy);
        panel.append(block);
      }
      panel.append(el('p', 'Struktur virtual repository `.L`: folder = sub URL dengan pengaturan terpusat; file memiliki nama, ekstensi, fungsi, dan isi kode contoh.', 'fm-inspector-disclaimer'));
      $('#fileOpenGitHub').hidden = true;
      $('#fileOpenEditorButton').hidden = true;
      syncUrlPath();
      return;
    }
    // Folder sistem virtual pada ROOT .L (di luar pohon Git nyata): tampilkan
    // inspector gaya manajemen terpusat — fungsi, sub URL, & pengaturan folder.
    if (isLRepo() && isLVirtualPath(entry.path)) {
      const vEntry = entry.virtualRoot ? entry : (() => {
        const top = String(entry.path).split('/')[0];
        const child = virtualChildren(top).find((item) => item.path === entry.path);
        return child || { ...entry, function: `Item dalam folder virtual /${top}` };
      })();
      const merged = { ...vEntry, path: entry.path, type: entry.type || vEntry.type };
      addInfo(panel, 'Fungsi', merged.function || extensionFunction(merged.path));
      addInfo(panel, 'Ekstensi', merged.type === 'directory' ? '— (folder)' : ext(merged.path) || 'tanpa ekstensi');
      if (merged.type === 'directory') {
        const kids = virtualChildren(merged.path);
        addInfo(panel, 'Isi folder', `${fmt.format(kids.length)} item · manajemen terpusat aktif`);
        addInfo(panel, 'Sub URL folder', merged.subUrl || `#fileManager/${merged.path}`, true);
      } else {
        addInfo(panel, 'Ukuran metadata', sizeText(merged));
      }
      addInfo(panel, 'Mode', merged.mode || '—', true);
      addInfo(panel, 'Root virtual', `/${String(merged.path).split('/')[0]}`);
      if (merged.type === 'directory') {
        const heading = el('div', undefined, 'fm-candidate-list');
        heading.append(el('span', 'PENGATURAN TERPUSAT FOLDER', 'fm-info-label'));
        const controls = el('div', undefined, 'fm-folder-settings');
        const openButton = el('button', 'Buka sebagai sub URL ↗', 'text-button fm-suburl-open');
        openButton.type = 'button';
        openButton.addEventListener('click', () => goTo(merged.path));
        controls.append(openButton);
        heading.append(controls);
        panel.append(heading);
      } else if (merged.codeContent) {
        const block = el('div', undefined, 'fm-candidate-list');
        block.append(el('span', 'ISI KODE CONTOH (sesuai nama/fungsi file)', 'fm-info-label'));
        block.append(el('pre', merged.codeContent, 'fm-code-preview'));
        panel.append(block);
      }
      panel.append(el('p', 'Folder sistem virtual tingkat root `.L`: bukan bagian pohon Git repositori; ditampilkan terpusat di File Manager menu utama.', 'fm-inspector-disclaimer'));
      $('#fileOpenGitHub').hidden = true;
      $('#fileOpenEditorButton').hidden = true;
      return;
    }
    if (entry.type === 'file') void renderStaticSite(entry, panel);
    if (entry.type !== 'directory') addInfo(panel, 'Ukuran metadata Git', sizeText(entry));
    addInfo(panel, 'Mode Git', entry.mode || '—', true);
    addInfo(panel, 'Git object SHA', entry.sha || '—', true);
    panel.append(el('p', 'Hash adalah identitas objek Git dari metadata tree; isi file tidak diunduh.', 'fm-inspector-disclaimer'));
    const link = $('#fileOpenGitHub'); const url = githubPathUrl(repo, entry);
    link.hidden = !url; if (url) link.href = url;
    const editorButton = $('#fileOpenEditorButton');
    editorButton.hidden = entry.type !== 'file';
    if (entry.type === 'file') document.dispatchEvent(new CustomEvent('planetbintang:file-selected', { detail: {
      fullName: repo?.fullName || '', visibility: repo?.visibility || '', branch: repo?.branch || '', path: entry.path,
      sha: entry.sha || '', url, size: entry.size, sizeKnown: entry.sizeKnown !== false,
    } }));
  }

  function renderBreadcrumbs() {
    const container = $('#fileBreadcrumbs'); container.replaceChildren();
    const root = el('button', '/', 'fm-crumb'); root.type = 'button'; root.addEventListener('click', () => goTo(''));
    container.append(root);
    if (state.path) {
      let prefix = '';
      for (const part of state.path.split('/')) {
        prefix = prefix ? `${prefix}/${part}` : part;
        container.append(el('span', '/', 'fm-crumb-separator'));
        const crumb = el('button', part, 'fm-crumb'); crumb.type = 'button';
        const target = prefix; crumb.addEventListener('click', () => goTo(target)); container.append(crumb);
      }
    }
    $('#filePathInput').value = `/${state.path}`;
    $('#fileUpButton').disabled = !state.path;
  }

  function renderShortcuts(items) {
    const list = $('#fileFolderShortcuts'); list.replaceChildren();
    let folders = items.filter((item) => item.type === 'directory').slice(0, 80);
    if (isVirtualRepo() && !state.path) {
      const byName = new Map(folders.map((item) => [basename(item.path), item]));
      const ordered = VIRTUAL_SHORTCUTS.map((name) => byName.get(name)).filter(Boolean);
      folders = [...ordered, ...folders.filter((item) => !VIRTUAL_SHORTCUTS.includes(basename(item.path)))];
    }
    if (!folders.length) { list.append(el('p', 'Tidak ada subfolder pada path ini.', 'fm-shortcuts-empty')); return; }
    folders.forEach((item) => {
      const button = el('button', undefined, 'fm-shortcut'); button.type = 'button'; button.title = `Buka /${item.path}`;
      if (item.type === 'directory') {
        const img = document.createElement('img'); img.src = './folder-3d-icon.jpg'; img.alt = ''; img.className = 'fm-shortcut-icon';
        button.append(img, el('span', basename(item.path)));
      } else button.textContent = basename(item.path);
      button.addEventListener('click', () => goTo(item.path)); list.append(button);
    });
  }

  // Sidebar File Manager menampilkan SELURUH repositori pada snapshot sebagai
  // pintasan; klik sebuah repositori memuat root-nya (sama seperti pemilih repo).
  function renderRepoShortcuts() {
    const list = $('#fileRepoShortcuts'); if (!list) return;
    list.replaceChildren();
    const repositories = state.data?.repositories || [];
    if (!repositories.length) { list.append(el('p', 'Tidak ada repositori pada snapshot.', 'fm-shortcuts-empty')); return; }
    for (const repo of repositories) {
      const button = el('button', undefined, `fm-shortcut fm-repo-shortcut${repo.fullName === state.repo ? ' is-active' : ''}`);
      button.type = 'button';
      button.title = `Buka ${repo.fullName === L_REPO ? '.L · root system' : repo.fullName} — / root`;
      const icon = document.createElement('img'); icon.src = './folder-3d-icon.jpg'; icon.alt = ''; icon.className = 'fm-shortcut-icon';
      button.append(icon, el('span', repo.fullName === L_REPO ? '.L · root system' : repo.name || repo.fullName));
      button.addEventListener('click', () => {
        if (repo.fullName === state.repo) { goTo(''); return; }
        state.repo = repo.fullName; state.query = ''; $('#fileSearchInput').value = '';
        const select = $('#fileRepoSelect'); if (select) select.value = repo.fullName;
        void loadManifest('');
      });
      list.append(button);
    }
  }

  function renderTiles() {
    const pane = $('#fileTiles'); pane.replaceChildren();
    renderRepoShortcuts();
    const viewSettings = isVirtualRepo() ? readFolderSettings(state.path) : { dense: false, folderIcon: true };
    pane.classList.toggle('is-dense', Boolean(viewSettings.dense));
    const query = state.query.toLocaleLowerCase('id');
    // Root .L: sisipkan folder sistem virtual di samping entri pohon nyata.
    const lRootVirtual = (isLRepo() && !state.path) ? lVirtualEntriesFor('') : [];
    const allItems = [...state.entries, ...lRootVirtual];
    const items = sortItems(allItems.filter((item) => matchesExtension(item) && (!query || item.path.toLocaleLowerCase('id').includes(query))));
    renderShortcuts(allItems);
    $('#fileEmpty').hidden = items.length > 0;
    $('#fileEmpty').textContent = state.extension !== 'all' ? `Tidak ada file .${state.extension} pada folder ini.` : state.query ? 'Tidak ada kecocokan pada halaman folder yang sudah dimuat.' : 'Folder ini kosong atau semua nama sensitif disaring.';
    for (const item of items) {
      const tile = el('button', undefined, `file-tile${state.selected === item.path ? ' is-selected' : ''}${item.type === 'directory' ? ' is-directory' : ''}${viewSettings.dense ? ' is-dense' : ''}`);
      tile.type = 'button'; tile.setAttribute('role', 'listitem'); tile.title = `/${item.path}${item.type === 'directory' ? '/' : ''}`;
      tile.setAttribute('aria-label', `${item.type === 'directory' ? 'Folder' : 'File'} ${item.path}`);
      const icon = el('span', undefined, 'file-tile-icon');
      if (item.type === 'directory') {
        if (viewSettings.folderIcon !== false) { const img = document.createElement('img'); img.src = './folder-3d-icon.jpg'; img.alt = ''; icon.append(img); }
        else icon.append(el('span', 'DIR', 'file-type-mark'));
      }
      else icon.append(el('span', kind(item), 'file-type-mark'));
      tile.append(icon, el('span', basename(item.path), 'file-tile-name'), el('span', item.type === 'directory' ? 'FOLDER' : `${kind(item)} · ${sizeText(item)}`, 'file-tile-meta'));
      tile.addEventListener('click', () => {
        if (item.type === 'directory') void openFolderOrIndex(item.path);
        else { state.selected = item.path; renderTiles(); renderSelection(item); }
      });
      pane.append(tile);
    }
    const more = $('#fileLoadMoreButton');
    const hasMore = state.pageIndex < state.pageCount;
    more.hidden = !hasMore;
    more.disabled = state.loading;
    more.textContent = state.loading ? 'Memuat…' : `Muat halaman berikutnya (${fmt.format(state.entries.length)} / ${fmt.format(currentDirectory().entryCount || 0)})`;
  }

  async function loadNextPage() {
    if (state.loading || state.pageIndex >= state.pageCount) return;
    const requestId = state.requestId;
    const requestedRepo = state.repo;
    const requestedPath = state.path;
    const directory = currentDirectory(); const page = directory.pages?.[state.pageIndex];
    if (!page?.url || !/^(?:data\/trees\/[a-f0-9]{16}\/pages\/|[a-f0-9]{16}\/pages\/)[a-f0-9]{32}\.json\.gz$/.test(page.url)) return;
    state.loading = true; renderTiles();
    try {
      const response = await fetch(`./${page.url}?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await parseResponse(response);
      if (requestId !== state.requestId || requestedRepo !== state.repo || requestedPath !== state.path) return;
      if (payload.repository !== state.repo || payload.path !== state.path || !Array.isArray(payload.entries)) throw new Error('Shard pohon tidak sesuai manifest');
      state.entries.push(...payload.entries);
      state.pageIndex += 1;
      if (state.selected && !state.entries.some((item) => item.path === state.selected)) state.selected = null;
    } catch (error) {
      if (requestId === state.requestId) $('#fileTreeStatus').textContent = `Shard gagal dimuat: ${error.message}`;
    } finally {
      if (requestId === state.requestId) {
        state.loading = false; renderTiles();
        $('#fileSearchInput').placeholder = `Cari di ${fmt.format(state.entries.length)} item termuat`;
      }
    }
  }

  async function loadDirectory(path) {
    if (isLRepo() && isLVirtualPath(path)) {
      // Folder sistem virtual: isi statis dari definisi root .L.
      state.requestId += 1; state.loading = false;
      state.path = path; state.query = ''; state.selected = null;
      const top = String(path).split('/')[0];
      if ((path === 'workspace/aireber' || path.startsWith('workspace/aireber/')) && window.PBLocalFiles) {
        const localPath = path.slice('workspace/'.length);
        try {
          const rows = await window.PBLocalFiles.list(localPath);
          state.entries = await Promise.all(rows.map(async (row) => {
            const entry = { path: `workspace/${row.path}`, type: row.type === 'directory' ? 'directory' : 'file', mode: row.type === 'directory' ? '040700' : '0100600', size: Number(row.size) || 0, sizeKnown: true, function: 'File Reber lokal · IndexedDB perangkat ini', localWorkspace: true };
            if (row.type !== 'directory' && Number(row.size) <= 1_000_000) {
              try { entry.codeContent = (await window.PBLocalFiles.readFile(row.path)).text; } catch { entry.codeContent = '[Tidak dapat membaca isi file lokal]'; }
            }
            return entry;
          }));
        } catch (error) { state.entries = []; $('#fileTreeStatus').textContent = `Workspace Reber tidak dapat dibaca: ${error.message}`; }
      } else state.entries = path === top ? virtualChildren(top) : lVirtualEntriesFor(path);
      state.pageIndex = 0; state.pageCount = 0;
      $('#fileSearchInput').value = '';
      renderBreadcrumbs(); renderAssessment(repoNow()); renderTiles();
      return;
    }
    if (!isDirectory(path)) { $('#fileTreeStatus').textContent = `Path tidak ditemukan: /${path}`; return; }
    state.requestId += 1; state.loading = false;
    state.path = path; state.query = ''; state.selected = null; state.entries = []; state.pageIndex = 0;
    const directory = currentDirectory(); state.pageCount = directory.pages?.length || 0;
    $('#fileSearchInput').value = '';
    renderBreadcrumbs(); renderAssessment(repoNow()); renderTiles(); syncUrlPath();
    // Saat File Manager pertama dibuka, root `.L` harus menampilkan seluruh
    // folder dan file langsung di `/`, bukan berhenti pada halaman shard pertama.
    // Folder di bawah root tetap lazy-load agar repositori besar tetap ringan.
    if (state.pageCount) {
      const eagerRoot = isLRepo() && !path;
      do {
        const pageBefore = state.pageIndex;
        await loadNextPage();
        if (state.pageIndex === pageBefore) break;
      } while (eagerRoot && state.pageIndex < state.pageCount && !state.loading);
    }
    else renderTiles();
  }

  function goTo(path) {
    const normalized = normalizePath(path);
    if (normalized === null) { $('#fileTreeStatus').textContent = 'Path relatif `.` atau `..` tidak diizinkan.'; return; }
    void loadDirectory(normalized);
  }

  async function loadManifest(targetPath = '') {
    state.requestId += 1; const requestId = state.requestId; const requestedRepo = state.repo; state.loading = false;
    const repo = repoNow(); state.manifest = null; state.entries = []; state.pageIndex = 0; state.pageCount = 0; state.path = ''; state.selected = null;
    renderBreadcrumbs(); renderAssessment(repo); renderTiles();
    let source = String(repo?.tree?.indexUrl || '');
    // `.L` memakai indeks pohon nyata (folder & file repositori), bukan shard virtual.
    if (!source && repo?.fullName === L_REPO) source = 'data/trees/3cf0c9cf3dddc379/index.json';
    if (!/^data\/trees\/[a-f0-9]{16}\/index\.json$/.test(source)) {
      $('#fileTreeStatus').textContent = 'Indeks pohon belum tersedia pada snapshot.';
      return;
    }
    try {
      const response = await fetch(`./${source}?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await parseResponse(response);
      if (requestId !== state.requestId || requestedRepo !== state.repo) return;
      if (manifest.repository !== state.repo && !(state.repo === L_REPO && manifest.repository === L_REPO)) throw new Error('Manifest tidak valid');
      state.manifest = manifest;
      const normalized = normalizePath(targetPath);
      await loadDirectory(normalized && isDirectory(normalized) ? normalized : '');
    } catch (error) {
      if (requestId === state.requestId) $('#fileTreeStatus').textContent = `Manifest pohon gagal dimuat: ${error.message}`;
    }
  }

  let handlersBound = false;
  function virtualRepoEntry() {
    return {
      name: '.L', fullName: L_REPO, url: '', branch: 'io', visibility: 'public',
      appType: 'Repositori .L — folder & file pohon nyata di File Manager menu utama', lastCommitAt: null,
      tree: { state: 'complete', indexUrl: 'data/trees/3cf0c9cf3dddc379/index.json', entryCount: 0, fileCount: 0, directoryCount: 0, totalBytes: 0 },
      staticAssessment: {},
    };
  }

  function pathFromLocationHash() {
    try {
      const hash = decodeURIComponent(window.location.hash || '').replace(/^#/, '');
      if (!hash.startsWith('fileManager/')) return '';
      return normalizePath(hash.slice('fileManager/'.length)) || '';
    } catch { return ''; }
  }
  async function init(data, preserveLocation = true) {
    const previousRepo = state.repo; const previousPath = state.path;
    let searchRepo = ''; let searchPath = '';
    try {
      searchRepo = sessionStorage.getItem('pb-search-repo') || '';
      searchPath = sessionStorage.getItem('pb-search-path') || '';
      sessionStorage.removeItem('pb-search-repo');
      sessionStorage.removeItem('pb-search-path');
    } catch {}
    const initialPath = searchPath || (previousRepo ? previousPath : pathFromLocationHash());
    const list = [...(data.repositories || [])].filter((repo) => !isHiddenRepository(repo));
    const virtualEntry = virtualRepoEntry();
    const existingIndex = list.findIndex((repo) => repo.fullName === L_REPO);
    if (existingIndex >= 0) {
      // Pertahankan indeks pohon nyata repo `.L` dari snapshot; isi hanya metadata cadangan.
      list[existingIndex] = { ...virtualEntry, ...list[existingIndex], tree: list[existingIndex].tree || virtualEntry.tree };
    } else list.unshift(virtualEntry);
    // File Manager menampilkan seluruh repositori pada snapshot; `.L` tetap menjadi root default.
    const repositories = list.filter((repo) => repo && repo.fullName);
    state.data = { ...data, repositories };
    const select = $('#fileRepoSelect'); select.replaceChildren();
    repositories.forEach((repo) => select.add(new Option(repo.fullName === L_REPO ? '.L · root system' : repo.fullName, repo.fullName)));
    const preferredRepo = repositories.some((repo) => repo.fullName === searchRepo) ? searchRepo : (repositories.some((repo) => repo.fullName === previousRepo) ? previousRepo : L_REPO);
    state.repo = repositories.find((repo) => repo.fullName === preferredRepo)?.fullName || repositories[0]?.fullName || '';
    select.value = state.repo;
    if (!handlersBound) {
      select.addEventListener('change', () => { state.repo = select.value; state.query = ''; $('#fileSearchInput').value = ''; void loadManifest(); });
      $('#fileRootButton').addEventListener('click', () => goTo(''));
      $('#fileUpButton').addEventListener('click', () => goTo(state.path.split('/').slice(0, -1).join('/')));
      $('#filePathForm').addEventListener('submit', (event) => { event.preventDefault(); goTo($('#filePathInput').value); });
      $('#fileSearchInput').addEventListener('input', (event) => { state.query = event.target.value.trim(); renderTiles(); });
      $('#fileExtensionFilter').addEventListener('change', (event) => { state.extension = event.target.value; state.selected = null; renderTiles(); });
      $('#fileLoadMoreButton').addEventListener('click', () => void loadNextPage());
      handlersBound = true;
    }
    const targetPath = searchPath || (preserveLocation && previousRepo === L_REPO ? previousPath : initialPath);
    await loadManifest(targetPath);
  }

  async function loadTreeIndex() {
    try {
      const response = await fetch(`./data/repositories.json?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await parseResponse(response);
      if (!Array.isArray(data.repositories)) throw new Error('Snapshot tidak valid');
      await init(data, false);
    } catch (error) {
      $('#fileTreeStatus').textContent = `Gagal memuat pohon: ${error.message}`;
      $('#fileEmpty').hidden = false; $('#fileEmpty').textContent = 'File Manager tidak dapat membaca snapshot saat ini.';
    }
  }

  window.PBFileManager = { applySnapshot: (data) => init(data, true), setPath: (path) => {
    let searchRepo = ''; let searchPath = '';
    try {
      searchRepo = sessionStorage.getItem('pb-search-repo') || '';
      searchPath = sessionStorage.getItem('pb-search-path') || '';
      sessionStorage.removeItem('pb-search-repo');
      sessionStorage.removeItem('pb-search-path');
    } catch {}
    if (searchRepo && state.data?.repositories?.some((repo) => repo.fullName === searchRepo)) {
      state.repo = searchRepo;
      const select = $('#fileRepoSelect'); if (select) select.value = searchRepo;
      void loadManifest(searchPath || path || '');
    } else goTo(searchPath || path || '');
  }, refreshWorkspace: () => {
    if (isLRepo() && (state.path === '' || state.path === 'workspace' || state.path.startsWith('workspace/aireber'))) void loadDirectory(state.path);
  } };
  window.addEventListener('planetbintang:workspace-files-changed', () => window.PBFileManager?.refreshWorkspace());
  if (window.PBSystemSnapshot?.subscribe) window.PBSystemSnapshot.subscribe('file-manager', (data) => init(data, true));
  else loadTreeIndex();
})();
