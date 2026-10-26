#!/usr/bin/env python3
"""Generate the Hyper-Enterprise Map Registry for Planetbintang Root System.

Membangun Master Registry List 5000 menu/fitur enterprise secara deterministik:
- 10 Arsitektur Inti (DevOps & Git Platform)  -> index 0..4999   (DEVOPS-xxx)
- 10 Arsitektur Hyper-Enterprise (Domain/DNS/Hosting/Monitoring/WAF/CMS/
  Alerting/IAM/Storage/Billing/Marketplace)    -> index 5000..9999 (HYPER-Axx-nnn)

Output:
  data/enterprise-map-manifest.json      (manifest ringkas untuk UI)
  data/enterprise-menus/menu-XXXXX.json  (satu file per menu, 10.000 file)
  sys/enterprise/**                      (mirror filesystem virtual, lihat system_vfs.py)

Skema mengikuti kontrak SQL `system_menus` + `system_menu_descriptions`.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path


def slugify(text: str) -> str:
    """Identik dengan scripts/rename_and_compact_menus.py — kontrak penamaan file batch-rename."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:80]

TOTAL_MENUS = 10000
MENUS_PER_ARCH = 500
ARCH_COUNT = 20  # 10 DevOps + 10 Hyper-Enterprise

# ---------------------------------------------------------------------------
# 10 ARSITEKTUR INTI — DEVOPS & GIT PLATFORM (index 0 .. 4999)
# ---------------------------------------------------------------------------
DEVOPS_ARCHITECTURES = [
    ("core-code", "Core Code Management & Repositories", "Manajemen kode sumber, riwayat commit, cabang, dan tata kelola repositori", [
        ("Code > Files", "Penjelajah pohon kode sumber, pengelolaan commit, blame, dan riwayat modifikasi berkode warna."),
        ("Code > Commits", "Registri riwayat perubahan, tanda tangan kriptografi GPG, peninjauan diferensial."),
        ("Code > Branches", "Matriks cabang kode, otomatisasi penghapusan stale branch, pelacakan deviasi ahead/behind."),
        ("Code > Tags & Releases", "Manajemen versi semantik SemVer, pengarsipan kode sumber otomatis, pembuatan changelog."),
        ("Code > Forks", "Tata kelola repositori turunan, sinkronisasi hulu upstream sync, pelacakan kontribusi eksternal."),
        ("Pull Requests > Open", "Dasbor tinjauan kode masuk, komentar berbasis baris kode, penugasan reviewers."),
        ("Pull Requests > Drafts", "Ruang kerja pengerjaan fitur awal tanpa memicu notifikasi pengujian otomatis global."),
        ("Pull Requests > Merged & Closed", "Arsip historis penggabungan kode, analisis konflik, pelacakan integrasi fitur."),
        ("Pull Requests > Review Requests", "Antrean tugas peninjauan kode personal berdasarkan kepemilikan Code Owners."),
        ("Branch Protection Rules", "Kebijakan wajib persetujuan peninjauan, persyaratan kelulusan CI/CD, blokade force push."),
        ("Code Owners", "Konfigurasi otomatis penugasan peninjau berdasarkan pola direktori dan ekstensi berkas."),
        ("Repository Templates", "Cetak biru repositori organisasi untuk standarisasi struktur proyek baru."),
    ]),
    ("project-management", "Project Management & Issue Tracking", "Pelacakan tugas, isu, papan agile, dan forum diskusi", [
        ("Issues > Active", "Pelacakan bug terbuka, permintaan fitur, penugasan kolaborator, label prioritas tinggi."),
        ("Issues > Templates", "Pembuat formulir laporan bug terstruktur dengan validasi kolom otomatis."),
        ("Issues > Custom Fields", "Metadata khusus (Impacted Version, Customer Tier) pada tiket isu."),
        ("Projects > Kanban Boards", "Visualisasi alur kerja multi-kolom dengan otomatisasi perpindahan status kartu."),
        ("Projects > Sprints & Backlogs", "Manajemen story points, alokasi beban kerja tim, perencanaan iterasi."),
        ("Projects > Milestones", "Pengelompokan isu dan pull request berdasarkan target tanggal rilis produk."),
        ("Projects > Roadmaps", "Tampilan linier waktu Gantt Chart untuk memantau dependensi proyek lintas tim."),
        ("Discussions > General", "Forum komunitas terbuka untuk tanya jawab, pengumuman, dan jajak pendapat."),
        ("Discussions > Ideas", "Modul pengumpulan proposal fitur baru dengan sistem pemungutan suara upvoting."),
    ]),
    ("cicd-deployment", "CI/CD Automation & Deployment Pipelines", "Orkestrasi workflow, runner, dan kontrol lingkungan rilis", [
        ("Actions > Workflow Runs", "Riwayat eksekusi pipa otomasi, visualisasi DAG, log konsol real-time."),
        ("Actions > Workflow Builders", "Editor visual berbasis GUI dan YAML untuk merancang alur integrasi berkelanjutan."),
        ("Actions > Schedules", "Konfigurasi pemicu alur kerja berdasarkan waktu berkala cron jobs."),
        ("Runners > Self-Hosted", "Manajemen klaster mesin eksternal milik organisasi yang terhubung ke platform."),
        ("Runners > Hosted Pools", "Konfigurasi spesifikasi perangkat keras mesin virtual otomatis dari platform."),
        ("Runners > Autoscaling Groups", "Aturan penskalaan otomatis jumlah mesin berdasarkan kepadatan antrean tugas."),
        ("Environments > Staging", "Gerbang persetujuan manual, konfigurasi variabel rahasia khusus server uji coba."),
        ("Environments > Production", "Proteksi deployment tingkat tinggi, pembatasan akses eksekusi, peninjauan ganda."),
        ("Environments > Deployments History", "Registri pelacakan versi aplikasi terpasang lengkap dengan one-click rollback."),
    ]),
    ("security-compliance", "Security, Compliance & Privacy", "Pemindaian otomatis, manajemen kunci, dan tata kelola kepatuhan", [
        ("Security > Code Scanning", "Analisis statis SAST terhadap celah keamanan pola penulisan kode sumber."),
        ("Security > Dependabot Alerts", "Pemberitahuan kerentanan komponen pihak ketiga beserta saran pembaruan."),
        ("Security > Secret Scanning", "Pemindaian otomatis pencegahan kebocoran kunci API, token, kata sandi ke publik."),
        ("Security > GPG Keys", "Registri kunci publik verifikasi keaslian tanda tangan digital pada setiap commit."),
        ("Security > SSH Keys", "Pengelolaan kredensial akses enkripsi jarak jauh untuk operasi repositori aman."),
        ("Security > Personal Access Tokens", "Token akses berlingkup terbatas untuk integrasi skrip pihak ketiga."),
        ("Compliance > Security Policies", "Standarisasi aturan keamanan wajib untuk seluruh repositori organisasi."),
        ("Compliance > Advisory Database", "Repositori internal ancaman keamanan yang ditemukan dan cara mitigasinya."),
    ]),
    ("artifacts-packages", "Artifacts & Package Registry", "Penyimpanan artefak kompilasi dan optimasi ruang", [
        ("Packages > Container Registry", "Host penyimpanan aman Docker images dan OCI-compliant artifacts."),
        ("Packages > npm/Yarn Registry", "Registri internal distribusi pustaka JavaScript/TypeScript organisasi."),
        ("Packages > Maven/NuGet/Python", "Ruang penyimpanan paket Java, .NET, dan Python."),
        ("Storage > Retention Policies", "Penghapusan otomatis paket lawas atau tidak terpakai demi efisiensi ruang."),
        ("Storage > Artifact Downloads", "Pelacakan log unduhan aset biner produk oleh pengguna atau sistem eksternal."),
    ]),
    ("data-insights", "Data Analytics & Insights", "Metrik produktivitas dan operasional sistem", [
        ("Insights > Contribution Graph", "Visualisasi matriks intensitas aktivitas kontribusi kode harian pengembang."),
        ("Insights > Code Velocity", "Metrik waktu rata-rata dari pembuatan kode hingga rilis ke produksi."),
        ("Insights > Dependency Graph", "Peta visual hubungan keterkaitan antar pustaka perangkat lunak."),
        ("Insights > Traffic", "Statistik kunjungan halaman repositori, klon kode, dan referensi tautan teratas."),
        ("Insights > Network", "Visualisasi percabangan garis waktu pengembangan Git graph lintas forks."),
    ]),
    ("organization-access", "Organization & Access Control", "Keanggotaan, tim, peran, dan integrasi direktori enterprise", [
        ("Organization > Members", "Daftar pengguna organisasi, status undangan, dan konfigurasi 2FA."),
        ("Organization > Teams", "Pengelompokan struktur tim untuk mempermudah penugasan massal."),
        ("Organization > Roles & Permissions", "Kustomisasi tingkat lanjut peran pengguna di luar Admin/Write/Read."),
        ("Access > SAML/SSO", "Sinkronisasi masuk tunggal dengan direktori eksternal (Azure AD, Okta)."),
        ("Access > SCIM Provisioning", "Otomatisasi pembuatan dan penghapusan akun berdasarkan data kepegawaian."),
    ]),
    ("settings-integrations", "System Settings & Integrations", "Ekstensi aplikasi dan kustomisasi sistem", [
        ("Settings > Marketplaces", "Galeri aplikasi pihak ketiga terverifikasi untuk memperluas fungsionalitas."),
        ("Settings > Installed Apps", "Manajemen izin dan akses data aplikasi yang telah terintegrasi."),
        ("Settings > Webhooks", "Pengiriman notifikasi peristiwa berbasis HTTP POST ke server eksternal."),
        ("Settings > General", "Nama organisasi, domain khusus terverifikasi, dan profil publik."),
        ("Settings > Interaction Limits", "Pembatasan sementara aktivitas komentar pengguna luar anti-spam."),
    ]),
    ("audit-monitoring", "Auditing, Logging & Monitoring", "Jejak ketertelusuran dan pemantauan sistem", [
        ("Audit Logs > Security Events", "Catatan riwayat login, perubahan kata sandi, eskalasi hak akses admin."),
        ("Audit Logs > Data Export", "Pengunduhan log aktivitas format CSV/JSON untuk audit eksternal."),
        ("Audit Logs > Streaming", "Pengiriman log aktivitas langsung ke SIEM (Splunk, Datadog)."),
    ]),
    ("billing-quotas", "Billing & Resource Quotas", "Langganan, pusat biaya, dan pemantauan sumber daya", [
        ("Billing > Subscriptions", "Lisensi berbayar per pengguna, peningkatan paket, siklus penagihan."),
        ("Billing > Cost Analysis", "Rincian pengeluaran dana berdasarkan alokasi proyek atau tim kerja."),
        ("Quotas > Storage", "Batas penggunaan ruang penyimpanan repositori kode dan artefak paket."),
        ("Quotas > Compute Minutes", "Sisa kuota waktu eksekusi bulanan untuk pipa CI/CD."),
        ("Quotas > API Rate Limits", "Monitoring ambang batas panggilan API per jam anti kelebihan beban."),
    ]),
]

# ---------------------------------------------------------------------------
# 10 ARSITEKTUR HYPER-ENTERPRISE (index 5000 .. 9999)
# ---------------------------------------------------------------------------
HYPER_ARCHITECTURES = [
    ("domain-dns-engine", "Domain Lifecycle & DNS Engine", "Registrasi domain aktif, engine DNS Anycast, dan routing policies", [
        ("Domain > Availability", "Mesin pencari ketersediaan TLD otomatis, bulk check hingga 500 domain sekaligus."),
        ("Domain > Premium Brokerage", "Sistem negosiasi, escrow, dan pembelian domain premium pihak ketiga."),
        ("Domain > Auto-Renewal Matrix", "Prioritas kartu kredit, masa tenggang grace period, proteksi redemption."),
        ("Domain > Privacy & WHOIS Proxy", "Aktivasi masking data kepemilikan, generator kontak WHOIS anonim legal."),
        ("Domain > Registrar Lock & Transfer", "Modul otentikasi EPP code, persetujuan jabat tangan transfer masuk/keluar."),
        ("DNS > Zone File Editor", "CRUD record standar A, AAAA, CNAME, MX, TXT, SRV, CAA."),
        ("DNS > GeoDNS", "Pengalihan lalu lintas berdasarkan lokasi geografis pengunjung benua/negara/kota."),
        ("DNS > Latency-Based Routing", "Pengalihan otomatis ke server dengan respons ping tercepat."),
        ("DNS > Failover", "Pengalihan DNS otomatis jika IP host utama mengalami downtime."),
        ("DNS > DNSSEC", "Pembuatan kunci KSK/ZSK, publikasi otomatis record DS ke registri pusat."),
        ("DNS > TTL Customization", "Waktu propagasi dari ultra-cepat 30 detik hingga standar."),
        ("DNS > Dynamic DNS DDNS", "API endpoint pembaruan IP dinamis dari router atau server lokal client."),
    ]),
    ("hosting-ip-infra", "Hosting & IP Infrastructure Provisioning", "Provisioning VM/bare metal, IPAM, dan konfigurasi web server", [
        ("Compute > Instances", "Otomatisasi pembuatan VM Ubuntu, CentOS, Debian, Windows Server."),
        ("Compute > Bare Metal", "Penyewaan server fisik tanpa hypervisor dengan RAID hardware jarak jauh."),
        ("Compute > Auto-Scaling", "Horizontal scaling berdasarkan utilisasi CPU, RAM, atau jumlah request."),
        ("Compute > Snapshots & Backups", "Pencadangan level blok, enkripsi AES-256, replikasi lintas region."),
        ("IPAM > IPv4/IPv6 Subnets", "Alokasi blok IP /24 /28 /48 /64 dan deteksi konflik IP."),
        ("IPAM > Floating IPs", "Pengalihan IP publik antar instance dalam hitungan detik tanpa downtime."),
        ("IPAM > Reverse DNS rDNS", "Konfigurasi PTR Record untuk validasi reputasi pengiriman email server."),
        ("IPAM > BGP Anycast", "Penyiaran blok IP mandiri organisasi ke beberapa pusat data global serentak."),
        ("Host > Nginx/Apache/Caddy", "GUI reverse proxy dan konfigurasi virtual host otomatis."),
        ("Host > PHP/Node.js/Python Manager", "Pemilih versi runtime, manajemen ekstensi, alokasi memory_limit."),
        ("Host > Database Clusters", "Deployment MySQL, PostgreSQL, MongoDB arsitektur master-slave replication."),
    ]),
    ("hyper-monitoring", "Hyper-Monitoring & Observability Engine", "Uptime, metrik infrastruktur, dan APM", [
        ("Monitoring > Ping/ICMP", "Pemantauan respons jaringan dari 50+ lokasi checkpoint global berkala."),
        ("Monitoring > HTTP/HTTPS Status", "Deteksi kode respons 200/4xx/5xx dan validasi string teks konten."),
        ("Monitoring > SSL/TLS Expiry", "Peringatan dini sebelum sertifikat SSL kadaluarsa H-30, H-7, H-1."),
        ("Monitoring > Port Scanner", "Status port kritis 22/80/443/3306 untuk deteksi pembukaan port ilegal."),
        ("Metrics > OS Telemetry", "Grafik CPU user/system/iowait, RAM used/cached/free, dan Swap."),
        ("Metrics > Disk I/O & Inodes", "Kecepatan baca/tulis disk, peringatan kapasitas inode habis."),
        ("Metrics > Network Throughput", "Analisis bandwidth ingress/egress dan deteksi lonjakan paket."),
        ("APM > Distributed Tracing", "Pelacakan perjalanan request HTTP melewati arsitektur microservices."),
        ("APM > Database Query Profiling", "Deteksi kueri SQL lambat yang membebani kinerja server."),
        ("APM > Error Exception Log", "Pengelompokan error aplikasi berdasarkan stack trace dan keparahan."),
    ]),
    ("edge-security-waf", "Content Control & Edge Security WAF/CDN", "CDN edge, Web Application Firewall, dan mitigasi DDoS", [
        ("CDN > Edge Caching", "Aturan cache berdasarkan ekstensi berkas, header HTTP, atau cookie."),
        ("CDN > Cache Purging", "Penghapusan cache instan global Purge All atau berdasarkan URL/Tag."),
        ("CDN > Asset Optimization", "Kompresi gambar WebP/Avif dan minifikasi JS/CSS otomatis di level edge."),
        ("WAF > OWASP Top 10 Core Rules", "Proteksi SQL Injection, XSS, dan Remote Code Execution bawaan."),
        ("WAF > Custom Rules Engine", "Aturan kustom, misal blokir User-Agent ScraperBot dari negara X."),
        ("WAF > Rate Limiting", "Batasan request per IP per menit anti brute force dan eksploitasi API."),
        ("DDoS > Layer 3/4 Scrubbing", "Pengalihan banjir paket ke Scrubbing Center global."),
        ("DDoS > Layer 7 Challenge", "Verifikasi JavaScript sandblasting atau CAPTCHA saat deteksi HTTP Flood."),
    ]),
    ("content-moderation-cms", "Content Moderation & Granular CMS Inspection", "Filter konten otomatis, kontrol UGC, dan SEO", [
        ("Moderation > Keyword Blacklist", "Sensor kata terlarang dan regex pattern matching data sensitif KTP/kartu kredit."),
        ("Moderation > AI Image Recognition", "Pemindaian gambar otomatis untuk konten eksplisit, kekerasan, hak cipta."),
        ("Moderation > Video Stream Audit", "Analisis frame-by-frame konten video publikasi pengguna real-time."),
        ("UGC > File Upload Sanitize", "Karantina unggahan, hapus metadata EXIF, pemindaian virus/malware."),
        ("UGC > Comment & Review Moderation", "Persetujuan komentar bertingkat auto-approve, hold for review, spam delete."),
        ("SEO > Robots.txt Generator", "Pengaturan hak akses bot Googlebot/Bingbot ke direktori situs."),
        ("SEO > Sitemap Orchestrator", "Pembaruan XML sitemap otomatis setiap konten baru diterbitkan."),
    ]),
    ("alerting-incident", "Alerting, Incident Response & Notifications", "Matriks rute alert dan manajemen insiden", [
        ("Alerts > Channels", "Notifikasi via Webhook, Telegram, Slack, WhatsApp, SMS, Panggilan Suara AI."),
        ("Alerts > Escalation Policies", "Eskalasi jika tim tingkat pertama tidak merespons insiden dalam 15 menit."),
        ("Alerts > On-Call Scheduling", "Kalender giliran jaga shift tim insinyur backend dan DevOps."),
        ("Incident > War Room Creation", "Pembuatan kanal komunikasi darurat dan metrik Time to Resolve."),
        ("Incident > Post-Mortem Templates", "Dokumentasi analisis akar masalah RCA pasca-insiden."),
    ]),
    ("iam-enterprise", "Identity & Access Management Enterprise", "Tata kelola multi-tenant, RBAC, dan autentikasi SSO", [
        ("IAM > RBAC", "Peran khusus DNS Manager, Billing Admin, Content Auditor."),
        ("IAM > Policy Simulator", "Uji coba skrip kebijakan izin sebelum diterapkan ke pengguna/tim."),
        ("Auth > Multi-Factor MFA", "Kewajiban TOTP, Hardware Key YubiKey, atau Passkeys."),
        ("Auth > Directory Sync", "Sinkronisasi akun via SAML 2.0, OpenID Connect, Okta, Active Directory."),
        ("Auth > Session Hijack Protection", "Deteksi login abnormal via rotasi browser fingerprinting."),
    ]),
    ("storage-compliance", "Data Storage & Compliance Logging", "Object/block storage dan jejak audit immutable", [
        ("Storage > S3-Compatible Buckets", "Penyimpanan berkas statis dengan enkripsi server-side aktif."),
        ("Storage > Lifecycle Policies", "Pemindahan berkas lama ke cold storage Glacier mode hemat biaya."),
        ("Audit > Immutable Logs", "Log Write-Once-Read-Many tak dapat diubah bahkan oleh akun Root."),
        ("Audit > Log Streaming", "Ekspor log real-time ke Splunk, Elasticsearch, atau Datadog organisasi."),
    ]),
    ("billing-metering", "Billing, Metering & Resource Provisioning", "Metering granular dan kontrol biaya", [
        ("Billing > Pay-As-You-Go Tracker", "Biaya per jam/detik untuk RAM, bandwidth CDN, kueri DNS."),
        ("Billing > Invoicing & Tax Ledger", "Faktur pajak otomatis lokal PPN dan internasional multi-mata uang."),
        ("Billing > Budget Threshold Alerts", "Penghentian sementara otomatis jika pengeluaran lewat anggaran."),
    ]),
    ("developer-marketplace", "Extension Marketplace & Developer Ecosystem", "Engine API/webhook dan portal plugin", [
        ("Developer > API Reference & Keys", "Generator API token dengan read/write scopes dan throttling rate."),
        ("Developer > Webhook Event Streams", "Registri webhook 200+ event, misal domain.expired, host.cpu.high."),
        ("Marketplace > Plugin Management", "Portal instalasi ekstensi pihak ketiga modul CMS/alat optimasi gambar."),
    ]),
]

# Modul turunan untuk memperluas hierarki sub-menu tiap arsitektur
SUBMODULE_SUFFIXES = [
    "Console", "Matrix", "Ledger", "Scheduler", "Policy Engine", "Dashboard",
    "API Bridge", "Audit Trail", "Health Probe", "Config Drift Guard", "Replication Mesh",
]


def build_registry() -> list[dict]:
    menus: list[dict] = []
    for arch_index in range(ARCH_COUNT):
        is_hyper = arch_index >= 10
        group = (HYPER_ARCHITECTURES if is_hyper else DEVOPS_ARCHITECTURES)[arch_index % 10]
        slug, name, description, features = group
        base = arch_index * MENUS_PER_ARCH
        for slot in range(MENUS_PER_ARCH):
            index = base + slot
            feature_name, short_desc = features[slot % len(features)]
            generation = slot // len(features)
            if generation == 0:
                menu_name = f"{name.split(' & ')[0]} · {feature_name}"
                instruction = f"Mengaktifkan modul '{feature_name}' pada arsitektur {name}; pipeline pemrosesan berjalan pada worker cluster regional."
                sub = False
            else:
                module = SUBMODULE_SUFFIXES[(generation - 1) % len(SUBMODULE_SUFFIXES)]
                variant = (generation - 1) // len(SUBMODULE_SUFFIXES) + 1
                menu_name = f"{feature_name} · {module} #{variant:02d}"
                instruction = (f"Sub-modul '{module}' turunan dari '{feature_name}'. "
                               f"Instruksi: sinkronkan state melalui event bus internal dan validasi terhadap policy organization.")
                sub = True
            if is_hyper:
                code = f"HYPER-A{arch_index - 9:02d}-{slot + 1:03d}"
                route = f"/hyper/{slug}/{(feature_name.split(' > ')[-1] if ' > ' in feature_name else feature_name).lower().replace(' ', '-').replace('/', '-')}-{slot + 1:03d}"
            else:
                code = f"DEVOPS-{index:04d}"
                route = f"/enterprise/{slug}/{slot + 1:03d}"
            menus.append({
                "id": index + 1,
                "menu_code": code,
                "architecture_group": name,
                "architecture_slug": slug,
                "architecture_index": arch_index + 1,
                "parent_id": base if sub else None,
                "menu_name": menu_name,
                "route_path": route,
                "is_active": True,
                "language_code": "id",
                "short_description": short_desc,
                "system_instruction": instruction,
                "fileName": f"{slugify(menu_name)}-{code}.json",
            })
    return menus


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    menus = build_registry()
    assert len(menus) == TOTAL_MENUS, len(menus)

    out_dir = root / "data" / "enterprise-menus"
    out_dir.mkdir(parents=True, exist_ok=True)
    index_map = {}
    for menu in menus:
        # Batch rename sesuai nama menu; jalankan rename_and_compact_menus.py
        # setelahnya untuk memadatkan isi tiap file hingga >=150 baris fitur.
        path = out_dir / menu["fileName"]
        path.write_text(json.dumps(menu, ensure_ascii=False, indent=1), encoding="utf-8")
        index_map[f"{menu['id']:05d}"] = menu["fileName"]
    index_body = ("// Dihasilkan scripts/generate_enterprise_map.py - peta ID menu -> nama file.\n"
                  "// Padatkan ulang dengan scripts/rename_and_compact_menus.py untuk isi >=150 baris.\n"
                  "window.PB_ENTERPRISE_MENU_INDEX = " + json.dumps(index_map, separators=(",", ":")) + ";\n")
    (root / "data" / "enterprise-menus-index.js").write_text(index_body, encoding="utf-8")

    architectures = []
    for arch_index in range(ARCH_COUNT):
        group = (HYPER_ARCHITECTURES if arch_index >= 10 else DEVOPS_ARCHITECTURES)[arch_index % 10]
        slug, name, description, features = group
        architectures.append({
            "index": arch_index + 1,
            "slug": slug,
            "name": name,
            "description": description,
            "tier": "hyper-enterprise" if arch_index >= 10 else "devops-core",
            "rangeStart": arch_index * MENUS_PER_ARCH,
            "rangeEnd": arch_index * MENUS_PER_ARCH + MENUS_PER_ARCH - 1,
            "menuCount": MENUS_PER_ARCH,
            "featureCount": len(features),
        })

    manifest = {
        "schemaVersion": 1,
        "system": "planetbintang",
        "source": "scripts/generate_enterprise_map.py deterministic registry",
        "registryTable": "system_menus + system_menu_descriptions",
        "totalMenuCount": TOTAL_MENUS,
        "menusPerArchitecture": MENUS_PER_ARCH,
        "architectureCount": ARCH_COUNT,
        "devopsMenuCount": 5000,
        "hyperMenuCount": 5000,
        "loading": "lazy-by-architecture-shard",
        "execution": "disabled-by-default",
        "fileStoreRoot": "data/enterprise-menus",
        "virtualFsRoot": "sys/enterprise",
        "fileNamePattern": "<slugified-menu-name>-<MENU-CODE>.json",
        "indexFile": "data/enterprise-menus-index.js",
        "compactionScript": "scripts/rename_and_compact_menus.py",
        "minFileLines": 150,
        "architectures": architectures,
    }
    (root / "data" / "enterprise-map-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK: {len(menus)} menu files -> {out_dir}")


if __name__ == "__main__":
    main()
