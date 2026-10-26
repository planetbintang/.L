#!/usr/bin/env python3
"""Katalog data Air Cloud — struktur menu & filesystem sistem mirip IBM Cloud.

Digunakan oleh:
  * scripts/air_cloud_vfs.py   → materialisasi fisik airz/airsistem (hundreds of
                                 folders, thousands of system files) + shard
                                 index untuk File Manager (#fileManager/airz...)
  * scripts/build_air_cloud_menus.py → 500 halaman JSON menu utama + indeks JS
                                 untuk sidebar Air Cloud (ratusan menu, ribuan
                                 sub submenu)
Skema mengikuti kontrak tabel SQL: air_cloud_menus + air_cloud_menu_descriptions
(id berjenjang, parent_id, level, path_label "Parent > Child", route_path).
"""
from __future__ import annotations

import re

# ---------------------------------------------------------------------------
# 26 MENU UTAMA AIR CLOUD (tier komputasi awan enterprise, gaya IBM Cloud)
# Setiap menu: (slug, emoji, judul, deskripsi, warna aksen)
# ---------------------------------------------------------------------------
AIR_CLOUD_MENUS: list[tuple[str, str, str, str, str]] = [
    ("compute", "🖥️", "Compute & Virtual Servers",
     "Virtual server instance, bare metal, power systems, dan autoscale cluster", "#1d5bea"),
    ("vpc-infrastructure", "🌐", "VPC & Network Infrastructure",
     "Virtual Private Cloud, subnet, load balancer, VPN gateway, transit gateway", "#0aa2c0"),
    ("storage", "🗄️", "Storage & Data Volumes",
     "Object storage, block volume, file storage, backup archive, vault encryption", "#7c5cff"),
    ("database", "🛢️", "Databases",
     "PostgreSQL, MySQL, MongoDB, Cassandra, Db2, Elastic, dan caching Redis", "#e8912a"),
    ("containers-kubernetes", "📦", "Containers & Kubernetes",
     "Klaster Kubernetes, image registry, serverless runtime, container build", "#00b39f"),
    ("ai-ml", "🤖", "AI & Machine Learning",
     "watson AI suite, model pipeline, MLOps, vector search, LLM governance", "#ff5c8a"),
    ("analytics-data", "📊", "Data Analytics",
     "Data warehouse, streaming events, ETL flow, business intelligence, catalog", "#3d7cff"),
    ("security-compliance", "🔐", "Security & Compliance",
     "Key protect, secrets manager, IAM access, threat detection, compliance posture", "#d3384b"),
    ("iam-access", "👥", "Identity & Access Management",
     "SAML/SSO federasi, API bridge, SCIM provisioning, serviceid, trust zone", "#2fb8a6"),
    ("serverless-functions", "⚡", "Serverless & Functions",
     "Cloud functions, event stream, web action, cron trigger, runtime node/python", "#f2b134"),
    ("devops-toolchain", "🔧", "DevOps Toolchain",
     "Pipelines CI/CD, artifact repo, continuous deploy, sprint planning board", "#5c7cfa"),
    ("monitoring-observability", "📡", "Monitoring & Observability",
     "Metrics monitor, log analysis, activity tracker, APM trace, alert routing", "#20c997"),
    ("network-edge-cdn", "🛰️", "Network Services & CDN",
     "Direct link, DNS simple/transit, CDN edge cache, global health load balance", "#845ef7"),
    ("migration-hybrid", "🔁", "Migration & Hybrid Cloud",
     "Satellite agent, z/OS connector, lift-shift planner, on-prem bridge", "#e07a5f"),
    ("iot-device", "📶", "IoT Platform",
     "Device manager, IoT gateway, fleet telemetry, firmware OTA update", "#4cc9f0"),
    ("quantum-computing", "⚛️", "Quantum Computing",
     "Quantum processor, circuit composer, Qiskit runtime, quantum safe crypto", "#b5179e"),
    ("blockchain", "⛓️", "Blockchain Platforms",
     "Ledger network, smart contract studio, consensus validator, asset token", "#f77f00"),
    ("billing-account", "💳", "Billing & Account",
     "Pay-per-use metering, subscription, invoice, budget alert, resource group", "#06d6a0"),
    ("support-tickets", "🎫", "Support & Incident",
     "Ticket plan, severity escalation, SLA response, war room, RCA report", "#ffd166"),
    ("marketplace-partners", "🏪", "Marketplace & Partners",
     "Solution catalog, partner program, resale offer, certified integration", "#ef476f"),
    ("developer-tools", "🧰", "Developer Tools & SDK",
     "Cloud CLI, Terraform provider, API playground, SDK library, webhook engine", "#118ab2"),
    ("media-content", "🎬", "Media & Content Delivery",
     "Transcode video, live stream packager, DRM key, asset library", "#073b4c"),
    ("game-cloud", "🎮", "Game Cloud & Realtime",
     "Matchmaker lobby, game server scale, realtime websocket, leaderboard", "#7209b7"),
    ("disaster-recovery", "🛡️", "Disaster Recovery & Continuity",
     "Replication policy, failover drill, RPO/RTO matrix, immutable snapshot", "#3a86ff"),
    ("sustainability", "🌿", "Sustainability & Carbon",
     "Carbon footprint meter, green region advisor, energy report, offset credit", "#57cc99"),
    ("datacenter-regions", "🏢", "Datacenter & Global Regions",
     "Region availability zone, POP map, capacity reservation, colo interconnect", "#8d99ae"),
]

MENU_COUNT = len(AIR_CLOUD_MENUS)          # 26 menu utama
SUB_PER_MENU = 12                            # 312 submenu tingkat-2
LEAF_PER_SUB = 13                            # 4.056 sub-sub menu (ribuan)

# Submenu generik per domain (mengikuti pola IBM Cloud console navigation)
SUB_TEMPLATES = [
    ("Overview", "Halaman ringkasan layanan: status regional, pemakaian, dan tautan cepat"),
    ("Instances", "Daftar seluruh instance aktif dengan filter region, tag, dan status"),
    ("Create Instance", "Formulir provisioning instance baru dengan pratinjau biaya langsung"),
    ("Templates", "Cetak biru konfigurasi tersimpan untuk replikasi lingkungan"),
    ("Clusters", "Grup klaster terkelola dengan kebijakan penjadwalan otomatis"),
    ("Networking", "Aturan jaringan, firewall, peering, dan rute trafik layanan"),
    ("Security Groups", "Kelompok keamanan inbound/outbound berbasis peran kerja"),
    ("Access (IAM)", "Binding akses, service role, dan kebijakan sumber daya"),
    ("Encryption Keys", "Manajemen kunci KMS, rotasi terjadwal, dan audit pemakaian"),
    ("Logs & Activity", "Jejak aktivitas, event stream, dan retensi log layanan"),
    ("Metrics & Monitoring", "Dashboard metrik, ambang batas, dan integrasi alerting"),
    ("Billing & Usage", "Metering konsumsi, alokasi biaya, dan ekspor tagihan CSV"),
]

# Sub-sub menu (leaf) generik — digabung dengan frasa khas domain lewat slug
LEAF_TEMPLATES = [
    ("Dashboard", "Panel kontrol real-time dengan grafik penggunaan dan kesehatan"),
    ("Console Terminal", "Terminal web aman menuju resource terpilih tanpa SSH lokal"),
    ("API Explorer", "Coba endpoint REST langsung dari browser dengan token sementara"),
    ("SDK Snippets", "Cuplikan kode SDK Python/Node/Go siap salin per bahasa"),
    ("Terraform Module", "Modul IaC resmi untuk deklarasi sumber daya yang sama"),
    ("CLI Commands", "Referensi perintah cloud CLI beserta flag umum"),
    ("Webhook Events", "Konfigurasi notifikasi HTTP POST per jenis kejadian"),
    ("Tags & Labels", "Taksonomi label biaya, tim, dan lingkungan produksi"),
    ("Cost Breakdown", "Rincian biaya harian/bulanan per komponen layanan"),
    ("Quota & Limits", "Batas kuota akun, permohonan kenaikan, dan status approval"),
    ("Region Availability", "Matriks ketersediaan fitur per region global"),
    ("Compliance Report", "Laporan kepatuhan SOC2/ISO 27001 dapat diunduh"),
    ("Audit Trail", "Registri perubahan konfigurasi dengan identitas aktor"),
    ("Backup Schedule", "Jadwal pencadangan otomatis plus retensi versi"),
    ("Restore Point", "Titik pemulihan granular dengan validasi integritas"),
    ("High Availability", "Mode HA multi-zone dengan failover otomatis"),
    ("Auto Scaling Policy", "Kebijakan penskalaan berdasarkan metrik ambang"),
    ("Private Endpoint", "Akses privat via VPC tanpa keluar ke internet publik"),
    ("Service Bindings", "Pengikatan kredensial antar-layanan dalam toolchain"),
    ("Feature Flags", "Gerbang rilis bertahap per segmen akun atau region"),
]


def menu_slug_title(slug: str) -> str:
    return slug.replace("-", " ").title()


def build_master_registry() -> list[dict]:
    """Susun hierarki lengkap: 26 menu utama → 312 submenu → 4.056 leaf."""
    rows: list[dict] = []
    mid = 0
    for m_idx, (slug, icon, title, desc, accent) in enumerate(AIR_CLOUD_MENUS):
        mid += 1
        menu_id = f"AC-M{mid:03d}"
        rows.append({
            "id": menu_id, "parent_id": "", "level": 1,
            "menu_code": f"AIR-{1000 + m_idx * 100}",
            "group_slug": slug, "icon": icon, "menu_name": title,
            "path_label": title, "short_description": desc,
            "route_path": f"/aircloud/{slug}",
        })
        for s_idx, (sub_title, sub_desc) in enumerate(SUB_TEMPLATES):
            sub_id = f"AC-S{mid:03d}{s_idx + 1:02d}"
            full_sub = f"{title} > {sub_title}"
            rows.append({
                "id": sub_id, "parent_id": menu_id, "level": 2,
                "menu_code": f"AIR-{1000 + m_idx * 100 + s_idx + 1}",
                "group_slug": slug, "icon": "", "menu_name": sub_title,
                "path_label": full_sub, "short_description": sub_desc,
                "route_path": f"/aircloud/{slug}/{sub_title.lower().replace(' ', '-').replace('&', 'and')}",
            })
            for l_idx, (leaf_title, leaf_desc) in enumerate(LEAF_TEMPLATES[:LEAF_PER_SUB]):
                leaf_id = f"AC-L{mid:03d}{s_idx + 1:02d}{l_idx + 1:02d}"
                rows.append({
                    "id": leaf_id, "parent_id": sub_id, "level": 3,
                    "menu_code": f"AIR-{1000 + m_idx * 100 + s_idx + 1:0>2}{0}-{l_idx + 1:02d}".replace("-0-", "-"),
                    "group_slug": slug, "icon": "", "menu_name": f"{leaf_title} · {sub_title}",
                    "path_label": f"{full_sub} > {leaf_title}", "short_description": leaf_desc,
                    "route_path": f"/aircloud/{slug}/{s_idx + 1:02d}/{leaf_title.lower().replace(' ', '-')}",
                })
    return rows


MASTER_ROWS = build_master_registry()
MAIN_MENU_COUNT = sum(1 for r in MASTER_ROWS if r["level"] == 1)
SUB_MENU_COUNT = sum(1 for r in MASTER_ROWS if r["level"] == 2)
LEAF_MENU_COUNT = sum(1 for r in MASTER_ROWS if r["level"] == 3)
TOTAL_MENU_COUNT = len(MASTER_ROWS)

# ---------------------------------------------------------------------------
# FILESYSTEM SISTEM airz/airsistem — ratusan folder, ribuan file sistem
# Struktur: (nama, jenis DIR/FILE, fungsi, [isi]) — nested seperti SYSTEM_TREE
# ---------------------------------------------------------------------------
CONF_TEMPLATE = """# Air Cloud System Configuration
# Generated by scripts/air_cloud_vfs.py — do not edit manually on production.
component = {comp}
region    = id-jkt-1
zone      = multizone-a,b,c
mode      = managed-centralized
log_level = info
retention = 90d
checksum  = sha256
sync      = airz://airsistem/{comp}
"""

SERVICE_TEMPLATE = """[Unit]
Description=Air Cloud {name} service ({desc})
After=network.target airz-core.target

[Service]
Type=simple
ExecStart=/usr/airz/bin/{name}d --config /etc/airz/{name}.conf
Restart=on-failure
MemoryLimit=512M

[Install]
WantedBy=multi-user.target
"""

SCRIPT_TEMPLATE = """#!/bin/sh
# Air Cloud maintenance script: {name}
set -eu
echo "[airz] menjalankan {name} ..."
airzctl status --all | grep -E 'degraded|failed' || echo "[airz] semua komponen sehat"
exit 0
"""

LOG_LINE = "2026-10-26T0{h}:15:0{m}Z airz-node-{n} {svc}[{pid}]: heartbeat ok region=id-jkt-1 latency={lat}ms\n"

REGIONS = ["id-jkt-1", "id-sby-1", "sg-sin-2", "jp-tyo-3", "us-east-5", "eu-de-2", "au-syd-1", "br-gru-1", "in-che-1", "kr-seo-1"]

# Folder inti airsystem: (slug-folder, fungsi, daftar isi)
CORE_FOLDERS: list[tuple[str, str, list[tuple]]] = [
    ("bin", "Binary cloud CLI & agen sistem Air Cloud", [
        ("airzctl", "FILE", "Perintah manajemen utama Air Cloud (status, deploy, scale)", "#!/usr/bin/env airz\n# airzctl entrypoint\nexec airz.core.cli main \"$@\"\n"),
        ("airz-agent", "FILE", "Agen node pada setiap instance virtual", "# airz-agent v2026.10 — node supervisor\n"),
        ("airz-metrics", "FILE", "Collector metrik kinerja ke monitoring plane", "# airz-metrics — push to /var/log/airz/metrics\n"),
        ("airz-deploy", "FILE", "Pipeline deployment satu-perintah", "# airz-deploy — blue/green orchestrator\n"),
        ("airz-backup", "FILE", "Utilitas pencadangan terjadwal", "# airz-backup — incremental snapshot\n"),
        ("airz-shell", "FILE", "Terminal web backend shell aman", "# airz-shell — allowlist exec proxy\n"),
    ]),
    ("etc", "Konfigurasi terpusat seluruh layanan Air Cloud", []),
    ("services", "Registry 26 layanan cloud inti (unit-file systemd)", []),
    ("modules", "Modul compute, network, storage, database, AI, security", []),
    ("regions", "Matriks ketersediaan 10 region global", []),
    ("zones", "Availability zone & placement group tiap region", []),
    ("cluster", "Topologi klaster, quorum, dan health state", []),
    ("network", "Subnet, route table, DNS resolver, dan firewall rule", []),
    ("storage", "Volume block, bucket object, dan mount point file", []),
    ("database", "Config DB terkelola, replica topology, dan query insight", []),
    ("security", "Kebijakan IAM, sertifikat TLS, dan rotation policy", []),
    ("keys", "Registry kunci enkripsi KMS (metadata saja, bukan material)", []),
    ("certificates", "Sertifikat x509 publik & chain verifikasi", []),
    ("logs", "Log sistem historis per komponen", []),
    ("metrics", "Snapshot metrik kinerja & kapasitas", []),
    ("backup", "Indeks titik pemulihan & retensi", []),
    ("cache", "Cache global & eviction policy", []),
    ("tmp", "Antrean temporer pekerjaan runtime", []),
    ("jobs", "Definisi cron job dan workflow terjadwal", []),
    ("api", "Spesifikasi API gateway per layanan", []),
    ("webhooks", "Registrasi endpoint notifikasi eksternal", []),
    ("alerts", "Aturan alerting & eskalasi insiden", []),
    ("billing", "Metering pemakaian & draf tagihan", []),
    ("quotas", "Batas kuota akun & permohonan kenaikan", []),
    ("tags", "Tagsonomi biaya, lingkungan, dan kepemilikan", []),
    ("templates", "Cetak biru instance & katalog arsitektur", []),
    ("images", "Registry image OS & container base layer", []),
    ("snapshots", "Snapshot disk & machine image privat", []),
    ("registry", "Index katalog fitur + manifest shard JSON", []),
    ("manifest", "Manifest integritas SHA-256 seluruh partisi", []),
    ("provision", "State mesin provisioning & idempotency key", []),
    ("audit", "Audit trail perubahan konfigurasi", []),
    ("compliance", "Bukti kepatuhan SOC2/ISO per kuartal", []),
    ("dr", "Runbook disaster recovery & hasil failover drill", []),
    ("iot", "Fleet device shadow & firmware channel", []),
    ("quantum", "Queue eksekusi sirkuit quantum & shot result", []),
    ("blockchain", "Salinan blok head & kanal ledger", []),
    ("media", "Job transcode & HLS packaging state", []),
    ("games", "Lobby matchmaker & realtime room state", []),
    ("sustainability", "Telemetri karbon per region & offset", []),
    ("marketplace", "Katalog penawaran mitra & lisensi", []),
    ("support", "Antrean tiket, SLA clock, dan RCA", []),
    ("featureflags", "Gerbang rilis bertahap per segmen", []),
    ("terraform", "Provider registry & modul IaC resmi", []),
    ("sdk", "Metadata paket SDK Python/Node/Go/Java", []),
    ("docs", "Bundel dokumentasi internal per layanan", []),
]


def etc_entries() -> list[tuple]:
    items: list[tuple] = []
    for slug, _icon, title, desc, _accent in AIR_CLOUD_MENUS:
        items.append((f"{slug}.conf", "FILE", f"Konfigurasi layanan {title}", CONF_TEMPLATE.format(comp=slug)))
    items.append(("airz-global.conf", "FILE", "Konfigurasi global root airsystem", CONF_TEMPLATE.format(comp="global")))
    items.append(("regions.list", "FILE", "Daftar region aktif", "\n".join(REGIONS) + "\n"))
    items.append(("maintenance.window", "FILE", "Jendela pemeliharaan mingguan", "day=sunday\nstart=02:00\nend=04:00\ntimezone=Asia/Jakarta\n"))
    return items


def services_entries() -> list[tuple]:
    return [(f"{slug}.service", "FILE", f"Unit systemd layanan {menu_slug_title(slug)}",
             SERVICE_TEMPLATE.format(name=slug.replace("-", "_"), desc=slug))
            for slug, _i, _t, _d, _a in AIR_CLOUD_MENUS]


def modules_entries() -> list[tuple]:
    mods = ["compute", "network", "storage", "database", "container", "ai", "security",
            "analytics", "serverless", "iot", "quantum", "blockchain", "media", "gaming", "billing"]
    out: list[tuple] = []
    for mod in mods:
        out.append((mod, "DIR", f"Modul kernel ruang pengguna '{mod}'", None))
    return out


def module_children(mod: str) -> list[tuple]:
    return [
        (f"{mod}.ko", "FILE", f"Objek loadable modul {mod}", f"# airz module {mod}\nversion=2026.10\nabi=stable\n"),
        (f"{mod}.conf", "FILE", f"Parameter runtime modul {mod}", CONF_TEMPLATE.format(comp=f"modules/{mod}")),
        (f"{mod}.map", "FILE", f"Peta simbol debug modul {mod}", f"0x1000 init_{mod}_module\n0x2040 {mod}_probe\n"),
        (f"{mod}.sysctl", "FILE", f"Tuning sysctl modul {mod}", f"net.airz.{mod}.enabled=1\nnet.airz.{mod}.threads=8\n"),
    ]


def regions_entries() -> list[tuple]:
    return [(r, "DIR", f"Partisi konfigurasi region {r}", None) for r in REGIONS]


def region_children(region: str) -> list[tuple]:
    return [
        ("region.conf", "FILE", f"Profil region {region}", CONF_TEMPLATE.format(comp=f"regions/{region}")),
        ("capacity.json", "FILE", f"Kapasitas compute per zona {region}",
         '{"region":"%s","zones":[{"name":"multizone-a","cpu":98200,"gpu":1440,"memTB":412},{"name":"multizone-b","cpu":87300,"gpu":1210,"memTB":368}]}' % region),
        ("latency.txt", "FILE", f"Baseline latensi jaringan {region}",
         "edge-pop-01 4.2ms\nedge-pop-02 6.8ms\nbackbone-id 11.5ms\n"),
        ("health.log", "FILE", f"Log kesehatan region {region}",
         "".join(LOG_LINE.format(h=i % 9 + 1, m=i % 60, n=i % 40 + 1, svc="airz-health", pid=1000 + i, lat=3 + i % 9) for i in range(12))),
    ]


def zones_entries() -> list[tuple]:
    return [(f"{r}-z{i}", "DIR", f"Availability zone {i} di region {r}", None)
            for r in REGIONS for i in (1, 2, 3)]


def zone_children(zone: str) -> list[tuple]:
    return [
        ("placement.conf", "FILE", f"Kebijakan penempatan workload {zone}", CONF_TEMPLATE.format(comp=f"zones/{zone}")),
        ("nodes.list", "FILE", "Registri node fisik dalam zona", "\n".join(f"node-{j:03d} up rack=R{j % 12}" for j in range(24)) + "\n"),
        ("quorum.state", "FILE", "Status quorum controller", "role=leader votes=5 term=1042\n"),
    ]


def generic_dir_children(path: str) -> list[tuple]:
    """Isi standar untuk folder infrastruktur (cluster/network/storage/etc.)."""
    slug = path.split("/")[-1]
    per_menu = []
    for m_slug, _i, _t, _d, _a in AIR_CLOUD_MENUS:
        per_menu.append((f"{m_slug}.yaml", "FILE", f"Deklarasi {slug} untuk layanan {menu_slug_title(m_slug)}",
                         f"apiVersion: airz/v1\nkind: {slug.title()}\nmetadata:\n  name: {m_slug}\nspec:\n  managed: true\n  replicas: 3\n  sync: airz://airsistem/{path}/{m_slug}\n"))
    extras = {
        "cluster": [("topology.json", "FILE", "Graf topologi klaster", '{"clusters":[{"id":"c-01","nodes":48,"state":"healthy"},{"id":"c-02","nodes":32,"state":"scaling"}]}\n'),
                    ("quorum.log", "FILE", "Log pemilihan leader", "term=1041 vote=c-01 won\nterm=1042 heartbeat=all\n")],
        "network": [("routes.table", "FILE", "Tabel rute utama", "0.0.0.0/0 via 10.0.0.1 dev eth0\n10.10.0.0/16 via 10.0.0.2 dev bond0\n"),
                    ("dns.resolv", "FILE", "Resolver DNS internal", "nameserver 161.26.0.7\nnameserver 161.26.0.10\n"),
                    ("firewall.rules", "FILE", "Rule firewall default-deny", "inbound deny all\nallow tcp 443 from 0.0.0.0/0\n")],
        "storage": [("buckets.list", "FILE", "Daftar bucket object", "\n".join(f"airz-{m[0]}-bucket" for m in AIR_CLOUD_MENUS) + "\n"),
                    ("volumes.map", "FILE", "Pemetaan block volume", "vol-001 -> i-01 ext4 100GB\nvol-002 -> i-02 xfs 500GB\n")],
        "database": [("replicas.conf", "FILE", "Topologi replika", CONF_TEMPLATE.format(comp="db/replicas")),
                     ("slowqueries.log", "FILE", "Query lambat 24 jam", "seq=1 db=postgres dur=1.9s q=SELECT ... \n" * 6)],
        "security": [("policy.conf", "FILE", "Kebijakan keamanan akun", "mfa=required\nipallow=corporate\nsession=8h\n"),
                     ("scan.report", "FILE", "Hasil pemindaian kerentanan", "critical=0 high=2 medium=11 low=40\n")],
        "keys": [("keyring.manifest", "FILE", "Daftar ID kunci KMS", "\n".join(f"key-{i:04d} rotated=90d" for i in range(64)) + "\n")],
        "certificates": [("chain.pem", "FILE", "Rantai sertifikat publik", "-----BEGIN CERTIFICATE-----\nMIIB...airz-demo...\n-----END CERTIFICATE-----\n"),
                        ("ocsp.status", "FILE", "Status revocation", "serial=0xAA11 good\nserial=0xAA12 good\n")],
        "logs": [("system.log", "FILE", "Log gabungan sistem", "".join(LOG_LINE.format(h=i % 9 + 1, m=i, n=i % 40 + 1, svc="airz-core", pid=400 + i, lat=2 + i % 7) for i in range(60))),
                 ("access.log", "FILE", "Log akses API gateway", "\n".join(f'10.0.0.{i % 250}/api/aircloud/{AIR_CLOUD_MENUS[i % MENU_COUNT][0]} 200 {30 + i}' for i in range(48)) + "\n"),
                 ("error.log", "FILE", "Log error terfilter", "warn quota nearing limit billing-metering\n")],
        "metrics": [("cpu.hist", "FILE", "Histogram CPU cluster", "avg=41 p95=78 max=93\n"),
                    ("mem.hist", "FILE", "Histogram memori", "avg=62 p95=84 max=91\n"),
                    ("net.hist", "FILE", "Throughput jaringan", "egress-gbps=3.2 ingress-gbps=2.8\n")],
        "backup": [("index.json", "FILE", "Indeks backup", '{"points":[{"id":"bk-001","type":"incremental","sizeGB":420},{"id":"bk-002","type":"full","sizeGB":1840}]}\n'),
                   ("retention.conf", "FILE", "Kebijakan retensi", "daily=30 weekly=12 monthly=24\n")],
        "cache": [("eviction.policy", "FILE", "Kebijakan eviksi", "lru=true ttl=3600 maxMB=4096\n"),
                  ("hotkeys.txt", "FILE", "Kunci terpanas", "GET /compute/instances\nGET /vpc/subnets\n")],
        "tmp": [("queue.state", "FILE", "Antrean pekerjaan aktif", "queued=2 running=1 done=184\n")],
        "jobs": [("cron.schedule", "FILE", "Jadwal cron sistem", "0 2 * * 0 airz-backup --full\n*/5 * * * * airz-metrics --flush\n"),
                 ("workflows.yaml", "FILE", "Workflow terjadwal", "workflows:\n  - name: nightly-audit\n    run: audit/collect.sh\n")],
        "api": [("gateway.yaml", "FILE", "Route API gateway", "routes:\n  /v1/compute/* -> compute.svc\n  /v1/storage/* -> storage.svc\n"),
                ("openapi.json", "FILE", "Spesifikasi OpenAPI agregat", '{"openapi":"3.1.0","info":{"title":"Air Cloud API","version":"2026.10"},"paths":{}}\n')],
        "webhooks": [("subscriptions.json", "FILE", "Berlangganan webhook", '[{"url":"https://example.internal/hook","events":["instance.created"]}]\n')],
        "alerts": [("rules.yaml", "FILE", "Aturan alert", "rules:\n  - name: cpu-high\n    threshold: 85\n    channel: slack-ops\n"),
                   ("escalation.conf", "FILE", "Tingkat eskalasi", "sev1=phone sev2=pager sev3=ticket\n")],
        "billing": [("meter.csv", "FILE", "Metering harian", "date,service,units,cost_usd\n2026-10-25,compute,18400,412.5\n2026-10-25,storage,92000,88.1\n"),
                    ("invoice.draft", "FILE", "Draf tagihan bulan berjalan", "subtotal=1042.60 tax=114.69 total=1157.29\n")],
        "quotas": [("limits.conf", "FILE", "Batas default akun", "instances=200 gpus=32 vpc=50 buckets=1000\n"),
                   ("requests.log", "FILE", "Permohonan kenaikan", "req-01 approved req-02 pending\n")],
        "tags": [("taxonomy.yaml", "FILE", "Taksonomi tag", "env:[dev,stg,prd] team:[platform,app,sec] cost-center:[cc-01..cc-12]\n")],
        "templates": ([("catalog.json", "FILE", "Katalog template", '{"templates":[{"name":"ha-web-tier"},{"name":"data-lake-small"}]}\n')]
                      + [(f"{m[0]}-blueprint.yaml", "FILE", f"Cetak biru instance {m[2]}", f"name: {m[0]}-bp\nservice: {m[0]}\nshape: bx2.4x16\nnetwork: vpc-standard\n") for m in AIR_CLOUD_MENUS]),
        "images": ([("base.list", "FILE", "Image dasar OS", "ubuntu-22.04 airz-linux-3 rhel-9 debian-12 windows-2022\n")]
                   + [(f"{m[0]}-golden.json", "FILE", f"Golden image {m[2]}", '{"image":"airz-linux-3","hardened":true,"agent":"2026.10"}\n') for m in AIR_CLOUD_MENUS[:12]]),
        "snapshots": [(f"snap-{i:03d}.meta", "FILE", f"Meta snapshot volume {i}", f"volume=vol-{i:03d} sizeGB={20 + i * 3} created=2026-10-{(i % 25) + 1}\n") for i in range(24)],
        "registry": [("index.json", "FILE", "Indeks katalog fitur air cloud", '{"schemaVersion":1,"source":"scripts/air_cloud_vfs.py"}\n'),
                     ("menus.sha256", "FILE", "Checksum master registry menu", "sha256 tree placeholder — dihitung saat publish\n")],
        "manifest": [("partitions.sha256", "FILE", "Checksum partisi airsystem", "bin etc services modules regions zones cluster network storage database ...\n"),
                     ("integrity.log", "FILE", "Hasil verifikasi integritas", "all partitions verified ok\n")],
        "provision": [("state.db", "FILE", "State machine provisioning", "SQLite header: airz-provision-state v3\n"),
                      ("idempotency.log", "FILE", "Kunci idempoten", "key=prov-881 done key=prov-882 running\n")],
        "audit": [(f"trail-{i:02d}.log", "FILE", f"Jejak audit bagian {i}", "".join(LOG_LINE.format(h=j % 9 + 1, m=j, n=j % 40 + 1, svc="airz-audit", pid=900 + j, lat=1 + j % 5) for j in range(10))) for i in range(12)],
        "compliance": [("soc2.summary", "FILE", "Ringkasan SOC2 Type II", "controls=112 exceptions=0 auditor=demo\n"),
                       ("iso27001.map", "FILE", "Pemetaan ISO 27001", "A.5..A.18 covered\n")],
        "dr": [("runbook.md", "FILE", "Runbook disaster recovery", "# DR Runbook\n1. Deteksi outage\n2. Failover ke region tetangga\n3. Verifikasi RPO/RTO\n"),
                ("failover.test", "FILE", "Hasil drill failover", "test=2026-10-01 rto=8m rpo=30s pass=true\n")],
        "iot": [("fleet.json", "FILE", "Fleet perangkat terdaftar", '{"devices":18400,"online":17211}\n'),
                ("shadow.conf", "FILE", "Device shadow policy", CONF_TEMPLATE.format(comp="iot/shadow"))],
        "quantum": [("queue.state", "FILE", "Antrean sirkuit", "pending=12 running=1 qpu=falcon-156\n"),
                    ("processors.list", "FILE", "Daftar prosesor kuantum", "falcon-156 eagle-127 osprey-88 hummingbird-65\n")],
        "blockchain": [("head.block", "FILE", "Blok head kanal", "number=104220 hash=0x9ac... peers=8\n"),
                       ("channels.yaml", "FILE", "Kanal ledger", "channels:\n  - supply-chain\n  - identity-registry\n")],
        "media": [("transcode.jobs", "FILE", "Job transcode aktif", "job-01 h264-1080p running job-02 hevc-4k queued\n"),
                  ("drm.keys", "FILE", "Rotasi kunci DRM (ID saja)", "kid-01 kid-02 kid-03 rotated=hourly\n")],
        "games": [("lobbies.json", "FILE", "Lobby aktif", '{"lobbies":312,"players":5844}\n'),
                  ("matchmaker.conf", "FILE", "Parameter matchmaker", "tick=50ms pool=skilled regions=id,sg\n")],
        "sustainability": [("carbon.csv", "FILE", "Emisi per region", "region,pue,carbon_kg\nid-jkt-1,1.22,4820\nsg-sin-2,1.18,3910\n"),
                           ("offsets.log", "FILE", "Kredit offset", "offset-01 retired=120t\n")],
        "marketplace": [("offers.json", "FILE", "Penawaran mitra", '[{"partner":"acme","sku":"airz-acme-1","price":"usage"}]\n'),
                        ("certs.list", "FILE", "Integrasi tersertifikasi", "acme-sso certified\nnorthwind-backup certified\n")],
        "support": [("tickets.queue", "FILE", "Antrean tiket", "sev1=0 sev2=2 sev3=9 open=41\n"),
                    ("sla.clock.log", "FILE", "SLA response", "ticket-9001 first-response=12m pass\n")],
        "featureflags": [("flags.yaml", "FILE", "Bendera fitur", "flags:\n  quantum-safe-tls: 25%\n  ai-console: 100%\n")],
        "terraform": [("providers.lock", "FILE", "Kunci provider", 'provider "airz" { version = "~> 2.4" }\n'),
                      ("modules.index", "FILE", "Indeks modul resmi", "vpc ha-cluster object-store cos-encryption\n")],
        "sdk": [("python.ver", "FILE", "Versi SDK Python", "airz-sdk 2.4.1 py>=3.10\n"),
                ("node.ver", "FILE", "Versi SDK Node", "@airz/sdk 2.4.0 node>=20\n"),
                ("go.ver", "FILE", "Versi SDK Go", "github.com/airz/sdk-go v2.3.9\n"),
                ("java.ver", "FILE", "Versi SDK Java", "com.airz:sdk 2.4.1 java>=17\n")],
        "docs": ([("bundle.index", "FILE", "Indeks bundel dokumentasi", "guides api-ref tutorials arch-notes\n")]
                  + [(f"{m[0]}.md", "FILE", f"Panduan layanan {m[2]}", f"# {m[2]}\n\n{m[3]}.\n\nRoute konsol: /aircloud/{m[0]}\n") for m in AIR_CLOUD_MENUS]),
    }
    return extras.get(slug, [])


def bin_scripts() -> list[tuple]:
    names = [("healthcheck.sh", "Siklus pemeriksaan kesehatan menyeluruh"),
             ("rotate-keys.sh", "Rotasi kunci KMS terjadwal"),
             ("flush-cache.sh", "Pembersihan cache selektif"),
             ("drill-dr.sh", "Simulasi failover disaster recovery"),
             ("report-carbon.sh", "Kompilasi laporan emisi karbon"),
             ("audit-collect.sh", "Pengumpulan jejak audit harian")]
    return [(name, "FILE", desc, SCRIPT_TEMPLATE.format(name=name)) for name, desc in names]


def airsystem_tree() -> dict[str, list[tuple]]:
    """Bangun pohon folder→isi untuk airz/airsistem (ratusan folder, ribuan file)."""
    tree: dict[str, list[tuple]] = {}
    for slug, _fn, items in CORE_FOLDERS:
        children = list(items)
        if slug == "etc":
            children = etc_entries()
        elif slug == "services":
            children = services_entries()
        elif slug == "modules":
            children = modules_entries()
        elif slug == "regions":
            children = regions_entries()
        elif slug == "zones":
            children = zones_entries()
        elif slug == "bin":
            children = list(items) + bin_scripts()
        else:
            children = children + generic_dir_children(slug)
        tree[slug] = children
    # Subfolder dinamis: modules/<mod>, regions/<region>, zones/<zone>
    for mod_entry in modules_entries():
        tree[f"modules/{mod_entry[0]}"] = module_children(mod_entry[0])
    for reg_entry in regions_entries():
        tree[f"regions/{reg_entry[0]}"] = region_children(reg_entry[0])
    for zone_entry in zones_entries():
        tree[f"zones/{zone_entry[0]}"] = zone_children(zone_entry[0])
    # Partisi layanan per-menu di bawah /services — 26 folder × 8 subfolder
    service_partitions = ["config", "runtime", "metrics", "logs", "alerts", "api", "security", "billing"]
    for m_slug, _i, _t, _d, _a in AIR_CLOUD_MENUS:
        tree[f"services/{m_slug}.service.d"] = [
            (part, "DIR", f"Partisi {part} layanan {m_slug}", None) for part in service_partitions
        ]
        for part in service_partitions:
            tree[f"services/{m_slug}.service.d/{part}"] = [
                (f"{part}.conf", "FILE", f"Konfigurasi {part} · layanan {m_slug}", CONF_TEMPLATE.format(comp=f"services/{m_slug}/{part}")),
                (f"{part}.state", "FILE", f"State runtime {part} · layanan {m_slug}", f"component={m_slug}/{part}\nstatus=active\nlast_sync=2026-10-26T03:00:00Z\n"),
                (f"{part}.log", "FILE", f"Log {part} · layanan {m_slug}", "".join(LOG_LINE.format(h=j % 9 + 1, m=j, n=j % 40 + 1, svc=f"airz-{m_slug[:8]}", pid=700 + j, lat=1 + j % 6) for j in range(8))),
            ]

    # ---- Konsol Air Cloud: mirror hierarki menu sebagai pohon sistem ----
    # 26 menu utama → 12 submenu → leaf; setiap node adalah folder nyata berisi
    # file manifest/menu/page sehingga jumlah file mengikuti ribuan menu.
    menu_dir: dict[str, str] = {}    # menu_id → path folder
    sub_dir: dict[str, str] = {}     # submenu id → path folder
    console_menus: dict[str, list[tuple]] = {}
    for row in MASTER_ROWS:
        if row["level"] == 1:
            path = "console/menus/" + row["group_slug"]
            menu_dir[row["id"]] = path
            children = []
            for s_idx, (sub_title, _sd) in enumerate(SUB_TEMPLATES):
                sub_id = row['id'].replace('M', 'S') + f"{s_idx + 1:02d}"
                norm_sub = re.sub(r"[^a-z0-9]+", "-", sub_title.lower()).strip("-")
                sub_dir[sub_id] = f"{path}/{norm_sub}"
                children.append((norm_sub, "DIR",
                                f"Submenu '{sub_title}' · {row['menu_name']}", None))
                children.append((f"{norm_sub}.link", "FILE",
                                f"Tautan registry ke {sub_id}", f"target={sub_dir[sub_id]}\ntitle={sub_title}\n"))
            children.append(("overview.md", "FILE", f"Ringkasan halaman {row['menu_name']}",
                             f"# {row['icon']} {row['menu_name']}\n\n{row['short_description']}\n\nRoute: `{row['route_path']}`\n"))
            console_menus[path] = children
        elif row["level"] == 2:
            path = sub_dir[row["id"]]
            leaf_children = []
            for l_idx, (leaf_title, _ld) in enumerate(LEAF_TEMPLATES[:LEAF_PER_SUB]):
                norm_leaf = re.sub(r"[^a-z0-9]+", "-", leaf_title.lower()).strip("-")
                leaf_children.append((norm_leaf, "DIR",
                                      f"Sub-sub menu '{leaf_title}' · {row['menu_name']}", None))
                leaf_children.append((f"{norm_leaf}.page.json", "FILE",
                                      f"Dokumen halaman {row['path_label']} > {leaf_title}",
                                      '{"menuId":"%s","title":"%s","route":"%s"}\n' % (row["id"], leaf_title, row["route_path"])))
            leaf_children.append(("submenu.conf", "FILE", f"Manifest submenu {row['menu_name']}",
                                  CONF_TEMPLATE.format(comp=row["id"].lower())))
            console_menus[path] = leaf_children
    tree.update(console_menus)
    # Folder leaf tingkat-3: masing-masing berisi 4 file konfigurasi halaman
    for row in MASTER_ROWS:
        if row["level"] != 3:
            continue
        base = sub_dir[row["parent_id"]]
        parts = row["path_label"].split(" > ")
        leaf_dir = f"{base}/" + re.sub(r"[^a-z0-9]+", "-", parts[-1].lower()).strip("-")
        tree[leaf_dir] = [
            ("page.conf", "FILE", f"Konfigurasi halaman {row['path_label']}", CONF_TEMPLATE.format(comp=row["id"].lower())),
            ("content.json", "FILE", "Blok konten halaman (schema air-cloud page)",
             '{"blocks":[{"type":"hero"},{"type":"metrics"},{"type":"table"},{"type":"docs"}]}\n'),
            ("actions.yaml", "FILE", "Aksi toolbar halaman", "actions:\n  - create\n  - refresh\n  - export\n  - delete\n"),
            ("breadcrumbs.txt", "FILE", "Jejak navigasi sidebar", " > ".join(parts) + "\n"),
        ]
    return tree


# Ringkasan ukuran sistem (dihitung deterministik dari pohon di atas)
def tree_stats() -> dict:
    tree = airsystem_tree()
    folders = len(tree) + sum(1 for items in tree.values() for it in items if it[1] == "DIR")
    files = sum(1 for items in tree.values() for it in items if it[1] == "FILE")
    return {"folders": folders, "files": files, "topFolders": len(CORE_FOLDERS)}
