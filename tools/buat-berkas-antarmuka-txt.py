#!/usr/bin/env python3
"""Generate 1,500 menu-named TXT files containing exactly 25,000 UI definitions.

Run from repository root:
  python3 tools/buat-berkas-antarmuka-txt.py

Output:
  osmediavm/pusat_registri/berkas-txt/
Each TXT file corresponds to one registered modal/menu. File names use the menu
name (normalized to a filesystem-safe Indonesian slug); duplicate names receive
a numeric suffix. Definitions describe menu, button, layout, position, and size.
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "osmediavm/pusat_registri/daftar-menu.json"
OUT = ROOT / "osmediavm/pusat_registri/berkas-txt"
TARGET_DEFINITIONS = 25_000
KINDS = [
    "Menu", "Tombol", "Layout", "Posisi", "Ukuran", "Dialog", "Panel",
    "Toolbar", "Navigasi", "Kartu", "Kontrol", "Jendela", "Ikon",
    "Formulir", "Tab", "Notifikasi", "Aksesibilitas",
]
LAYOUTS = [
    "grid responsif", "flex horizontal", "flex vertikal", "sidebar kiri",
    "sidebar kanan", "toolbar atas", "toolbar bawah", "panel terpusat",
    "dua kolom", "tiga kolom", "kanvas penuh", "daftar bertingkat",
    "kartu adaptif", "dock mengambang", "dialog terpusat", "lembar samping",
    "panel bertumpuk",
]
POSITIONS = [
    "atas-kiri", "atas-tengah", "atas-kanan", "tengah-kiri", "tengah",
    "tengah-kanan", "bawah-kiri", "bawah-tengah", "bawah-kanan",
    "mengikuti-alur", "tetap", "mengambang", "menempel-atas",
    "menempel-bawah", "modal-terpusat", "panel-samping", "di-dalam-konten",
]
SIZES = [
    "xs", "sm", "md", "lg", "xl", "penuh", "otomatis", "responsif",
    "kompak", "normal", "luas", "ikon", "teks", "sentuh", "adaptif",
    "maksimum", "minimum",
]

def slug(value):
    value = unicodedata.normalize("NFKD", str(value))
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "menu"

def main():
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    menus = data.get("menu", [])
    if len(menus) != 1500:
        raise SystemExit(f"Registri diharapkan berisi 1500 menu; ditemukan {len(menus)}")
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.txt"):
        old.unlink()

    manifest = []
    definition_count = 0
    used_names = set()
    for i, menu in enumerate(menus, 1):
        title = menu.get("namaFitur") or menu.get("judul") or menu.get("slug") or f"Menu {i}"
        base = slug(title)
        filename = base + ".txt"
        duplicate = 2
        while filename.casefold() in used_names:
            filename = f"{base}-{duplicate}.txt"
            duplicate += 1
        used_names.add(filename.casefold())

        remaining = TARGET_DEFINITIONS - definition_count
        component_count = min(len(KINDS), max(0, remaining))
        lines = [
            "OS MEDIA VM — BERKAS DEFINISI ANTARMUKA",
            "=" * 46,
            f"ID REGISTRI : {menu.get('id', str(i).zfill(4))}",
            f"NAMA MENU  : {menu.get('judul', title)}",
            f"FITUR      : {title}",
            f"SLUG       : {menu.get('slug', '')}",
            f"URL MODAL  : {menu.get('url', '')}",
            f"DESKRIPSI  : {menu.get('deskripsi', '')}",
            f"PETUNJUK   : {menu.get('petunjuk', '')}",
            "",
            "DEFINISI KOMPONEN",
            "-" * 46,
        ]
        for j, kind in enumerate(KINDS[:component_count]):
            number = definition_count + 1
            lines.extend([
                "",
                f"[{number:05d}] {kind.upper()}",
                f"Nama       : {title} — {kind}",
                f"Tombol     : {('Buka ' + title) if kind == 'Tombol' else 'Pilih / buka / tutup sesuai konteks'}",
                f"Layout     : {LAYOUTS[(i + j) % len(LAYOUTS)]}",
                f"Posisi     : {POSITIONS[(i * 2 + j) % len(POSITIONS)]}",
                f"Ukuran     : {SIZES[(i + j * 2) % len(SIZES)]}",
                "Responsif  : ya",
                "Aksesibilitas: label jelas, fokus keyboard, kontras memadai",
                "Penutupan  : tombol tutup dan Escape bila berupa dialog",
                f"Ringkasan  : {menu.get('ringkasan', title)}",
            ])
            definition_count += 1
        lines.extend([
            "",
            "CATATAN RUNTIME",
            "Berkas ini mendeskripsikan antarmuka web. Aksi OS host membutuhkan adapter",
            "runtime dengan izin sesuai; definisi TXT tidak menjalankan aksi sendiri.",
            "",
        ])
        (OUT / filename).write_text("\n".join(lines), encoding="utf-8")
        manifest.append({
            "file": filename,
            "menu": menu.get("judul", title),
            "id": menu.get("id", str(i).zfill(4)),
            "definitions": component_count,
        })

    (OUT / "INDEKS-BERKAS.txt").write_text(
        "INDEKS BERKAS TXT OS MEDIA VM\n"
        f"Jumlah berkas menu: {len(manifest)}\n"
        f"Jumlah definisi komponen: {definition_count}\n\n"
        + "\n".join(f"{x['id']} | {x['menu']} | {x['file']} | {x['definitions']} definisi" for x in manifest)
        + "\n",
        encoding="utf-8",
    )
    print(f"Selesai: {len(manifest)} file menu + 1 indeks; {definition_count:,} definisi komponen.")
    print(f"Lokasi: {OUT.relative_to(ROOT)}")


def generate_infrastructure_150():
    """Generate 150 infrastructure specifications, one TXT per component."""
    from html import escape
    out = ROOT / "osmediavm" / "infrastruktur-150"
    out.mkdir(parents=True, exist_ok=True)
    groups = [
      ("Identitas dan desain", ["Identitas Merek","Sistem Desain Global","Palet Warna Premium","Tipografi Profesional","Ikonografi Terpadu","Tata Letak Adaptif","Tema Terang Gelap","Efek Kaca Transparan","Animasi Antarmuka","Sistem Grid Presisi","Komponen UI Reusable","Desain Responsif","Aksesibilitas WCAG","Dukungan Resolusi","Konsistensi Visual"]),
      ("Desktop dan navigasi", ["Desktop Utama","Bilah Menu Utama","Dock Aplikasi","Taskbar","Peluncur Aplikasi","Pencarian Universal","Pusat Notifikasi","Pengaturan Cepat","Pengelola Jendela","Sistem Multiwindow","Desktop Virtual","Pintasan Keyboard","Menu Konteks","Modal Dialog Standar","Registri Menu Desktop"]),
      ("File manager dan filesystem", ["File Manager","Pohon Direktori","Folder Bertingkat","Pratinjau Berkas","Editor Teks","Editor Kode","Pengelola Gambar","Pengelola Audio Video","Pencarian Berkas","Filter Pengurutan","Salin Pindahkan Berkas","Pengelola Arsip","Tempat Sampah","Riwayat Versi","Indeks Berkas"]),
      ("Server hosting dan cloud", ["Infrastruktur Hosting","Server Aplikasi","Server Web","Reverse Proxy","Load Balancer","CDN","Edge Computing","Runtime Container","Orkestrasi Container","Infrastruktur Cloud","Multi Region","Autoscaling","Manajemen Resource","Penyimpanan Objek","Pemantauan Kapasitas"]),
      ("Keamanan dan privasi", ["HTTPS TLS","Firewall Aplikasi Web","Proteksi DDoS","Sistem Identitas","Autentikasi Multifaktor","Single Sign On","Kontrol Akses Peran","Manajemen Sesi","Enkripsi Data","Manajemen Secret","Pemindaian Kerentanan","Proteksi Dependensi","Audit Keamanan","Persetujuan Privasi","Log Keamanan"]),
      ("Pengembangan dan API", ["Runtime Aplikasi","Backend Modular","Gateway API","REST API","GraphQL","Antrean Pesan","Pekerjaan Latar","Scheduler Tugas","Webhook","Konfigurasi Aplikasi","Feature Flags","Lingkungan Pengembangan","Lingkungan Staging","Pengujian Otomatis","Dokumentasi API"]),
      ("Database dan data", ["Database Relasional","Database Dokumen","Cache Aplikasi","Replikasi Database","Migrasi Skema","Validasi Data","Pipeline ETL ELT","Data Warehouse","Pencarian Teks","Indeks Semantik","Metadata","Deduplicasi Data","Retensi Data","Backup Database","Pemulihan Data"]),
      ("AI dan otomasi", ["Asisten AI","Integrasi Model Bahasa","Antarmuka Chat","Pencarian AI","RAG Basis Pengetahuan","Indeks Embedding","Evaluasi AI","Pengelolaan Prompt","Izin Akses AI","Otomasi Alur Kerja","Agen Tugas Terbatas","Pemrosesan Dokumen","OCR Dokumen","Ringkasan Otomatis","Pemantauan Biaya AI"]),
      ("DevOps dan observabilitas", ["Repositori Git","Pipeline CI CD","Build Otomatis","Pengujian Pra Rilis","Deployment Otomatis","GitHub Pages","Pengelolaan Domain","Pengaturan DNS","Sertifikat TLS","Deployment Preview","Rollback Versi","Log Terpusat","Metrik Sistem","Distributed Tracing","Peringatan Insiden"]),
      ("Ketahanan dan tata kelola", ["High Availability","Disaster Recovery","Kesinambungan Layanan","Uji Pemulihan","Target SLA SLO","Core Web Vitals","Optimasi Gambar","Strategi Caching","SEO Teknis","Sitemap Robots","Multibahasa","Analitik Penggunaan","Manajemen Lisensi","Dokumentasi Arsitektur","Dashboard Tata Kelola"])
    ]
    def safe_slug(value):
        value = unicodedata.normalize("NFKD", value)
        value = "".join(c for c in value if not unicodedata.combining(c))
        return re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower() or "komponen"
    cards, records = [], []
    number = 0
    for group_name, titles in groups:
        for title in titles:
            number += 1
            filename = f"{number:03d}-{safe_slug(title)}.txt"
            body = f"""OS MEDIA VM — SPESIFIKASI INFRASTRUKTUR
ID: OSM-{number:03d}
NAMA: {title}
KELOMPOK: {group_name}
STATUS: Rancangan; verifikasi implementasi secara terpisah.

TUJUAN
Menetapkan tanggung jawab dan kriteria penerimaan komponen {title} untuk desktop OS MEDIA VM yang modular, responsif, aman, dan dapat dipelihara.

FUNGSI
- Menyediakan kemampuan {title.lower()} melalui kontrak terdokumentasi.
- Memisahkan konfigurasi, tampilan, data, dan logika.
- Menangani keadaan berhasil, kosong, memuat, dan gagal bila relevan.
- Menghindari tombol dekoratif tanpa aksi nyata.

ANTARMUKA, TATA LETAK, DAN UKURAN
- Gunakan hierarki visual konsisten, label jelas, serta layout responsif.
- Modal: judul, deskripsi, isi, aksi utama, tombol tutup; dukung Escape dan fokus keyboard.
- Modal standar maksimal 720px; layar kecil lebar viewport dikurangi 24px dan tinggi maksimal 90vh.
- Dukung keyboard, pembaca layar, kontras memadai, dan zoom.

INTEGRASI GITHUB PAGES
- Lokasi: osmediavm/infrastruktur-150/{filename}
- Target: https://planetbintang.github.io/.L/osmediavm/
- GitHub Pages menyajikan aset statis. Database, autentikasi server, pekerjaan latar, container, dan AI memerlukan backend eksternal.
- Gunakan tautan relatif untuk aset. Jangan simpan token atau kredensial di kode frontend.

KEAMANAN DAN KETAHANAN
Validasi input; terapkan hak akses minimum; tangani kegagalan jaringan dan data tidak valid. Jangan mengklaim enkripsi, HA, proteksi DDoS, atau backend aktif tanpa konfigurasi dan bukti pengujian.

KRITERIA PENERIMAAN
[ ] Nama dan ID cocok dengan katalog.
[ ] Jalur file dan tautan valid.
[ ] Tampilan responsif dan aksesibel.
[ ] Interaksi utama diuji.
[ ] Kesalahan ditangani dan tidak ada rahasia di frontend.
[ ] Status TERVERIFIKASI hanya diberikan setelah uji nyata.

Catatan: berkas ini adalah spesifikasi, bukan bukti bahwa layanan telah aktif.
"""
            (out / filename).write_text(body, encoding="utf-8")
            records.append((number, title, group_name, filename))
            cards.append('<a class="item" data-search="' + escape((title+" "+group_name).lower(), quote=True) + '" href="./' + filename + '"><small>OSM-' + f"{number:03d}" + ' · ' + escape(group_name) + '</small><strong>' + escape(title) + '</strong><code>' + filename + '</code></a>')
    page = """<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OS MEDIA VM — 150 Komponen Infrastruktur</title><style>
:root{color-scheme:dark;--panel:#101e31;--line:#263a53;--text:#eef5ff;--muted:#a9bad0;--accent:#8dd8ff}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at top,#17314e,#07111f 55%);color:var(--text);font:16px/1.5 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:28px 18px 64px}header{padding:26px;border:1px solid var(--line);border-radius:22px;background:#101e31cc}h1{margin:.2em 0;font-size:clamp(1.7rem,4vw,2.6rem)}p,small,code{color:var(--muted)}input{width:100%;padding:13px 15px;border-radius:12px;border:1px solid var(--line);background:#081423;color:var(--text);margin:20px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.item{display:flex;flex-direction:column;gap:5px;padding:14px;border:1px solid var(--line);border-radius:13px;background:var(--panel);color:var(--text);text-decoration:none}.item:hover,.item:focus{border-color:var(--accent);outline:none}code{font-size:.75rem;overflow-wrap:anywhere}</style></head><body><main><header><small>OS MEDIA VM / INFRASTRUKTUR</small><h1>150 Komponen Infrastruktur</h1><p>150 spesifikasi TXT, satu komponen per berkas. Cari berdasarkan nama atau kelompok. Dokumen adalah rancangan, bukan bukti layanan aktif.</p><input id="q" type="search" placeholder="Cari komponen…" aria-label="Cari komponen"><strong>150 berkas TXT · 10 kelompok</strong></header><p id="count"></p><div class="grid" id="grid">""" + "".join(cards) + """</div><p>GitHub Pages menyajikan konten statis; layanan server membutuhkan backend eksternal.</p></main><script>const q=document.querySelector('#q'),items=[...document.querySelectorAll('.item')];function filter(){let s=q.value.toLocaleLowerCase('id'),n=0;items.forEach(a=>{let ok=(a.textContent+' '+a.dataset.search).toLocaleLowerCase('id').includes(s);a.hidden=!ok;if(ok)n++});document.querySelector('#count').textContent=n+' komponen ditampilkan'}q.addEventListener('input',filter);filter()</script></body></html>"""
    (out / "index.html").write_text(page, encoding="utf-8")
    (out / "README.md").write_text("# OS MEDIA VM — 150 Komponen Infrastruktur\n\nBerisi 150 spesifikasi TXT bernomor, satu komponen per berkas, serta katalog pencarian index.html.\n\nTarget publik: https://planetbintang.github.io/.L/osmediavm/infrastruktur-150/\n\nSpesifikasi bukan bukti bahwa layanan backend telah aktif. GitHub Pages hanya menyajikan aset statis.\n", encoding="utf-8")
    print(f"Infrastruktur selesai: {number} berkas TXT + katalog HTML dan README.")


def generate_infrastructure_1500():
    """Generate 1,500 distinct component TXT specifications and a searchable catalog."""
    import html
    out = ROOT / "osmediavm/infrastruktur-1500"
    out.mkdir(parents=True, exist_ok=True)
    groups = [
        ("antarmuka-desain", "Antarmuka dan desain"), ("desktop-navigasi", "Desktop dan navigasi"),
        ("modal-dialog", "Modal dan dialog"), ("file-manager", "Pengelola berkas"),
        ("filesystem", "Sistem berkas"), ("hosting-server", "Hosting dan server"),
        ("cloud-edge", "Cloud dan edge"), ("keamanan-privasi", "Keamanan dan privasi"),
        ("identitas-akses", "Identitas dan akses"), ("runtime-api", "Runtime dan API"),
        ("backend-jobs", "Backend dan pekerjaan latar"), ("database-data", "Database dan data"),
        ("pencarian-indeks", "Pencarian dan indeks"), ("ai-asisten", "AI dan asisten"),
        ("otomasi-alur", "Otomasi alur kerja"), ("devops-ci", "DevOps dan CI"),
        ("deployment-pages", "Deployment dan Pages"), ("domain-dns-tls", "Domain DNS dan TLS"),
        ("observabilitas", "Observabilitas"), ("backup-pemulihan", "Backup dan pemulihan"),
        ("performa-cache", "Performa dan cache"), ("aksesibilitas", "Aksesibilitas"),
        ("lokalisasi", "Bahasa dan lokalisasi"), ("analitik", "Analitik dan telemetri"),
        ("konten-media", "Konten dan media"), ("kolaborasi", "Kolaborasi"),
        ("notifikasi", "Notifikasi dan pesan"), ("konfigurasi", "Konfigurasi sistem"),
        ("pengujian", "Pengujian dan kualitas"), ("tata-kelola", "Tata kelola dan dokumentasi"),
    ]
    concepts = [
        "Registri", "Konfigurasi", "Preferensi", "Status", "Validasi", "Pemrosesan", "Penyimpanan",
        "Pemulihan", "Pencarian", "Penyaringan", "Pengurutan", "Pratinjau", "Editor", "Riwayat",
        "Versi", "Izin", "Autentikasi", "Otorisasi", "Audit", "Notifikasi", "Dialog konfirmasi",
        "Dialog formulir", "Dialog peringatan", "Dialog progres", "Panel samping", "Pintasan keyboard",
        "Tata letak responsif", "Tema", "Aksesibilitas", "Telemetri", "Pencatatan", "Metrik", "Alarm",
        "Penjadwalan", "Antrean", "Percobaan ulang", "Batas waktu", "Cache", "Sinkronisasi", "Ekspor",
        "Impor", "Backup", "Enkripsi", "Sanitasi", "Rate limit", "Health check", "Dokumentasi",
        "Pengujian", "Integrasi", "Pemantauan",
    ]
    records = []
    number = 0
    for group_slug, group_name in groups:
        for concept in concepts:
            number += 1
            title = concept + " — " + group_name
            filename = f"{number:04d}-{slug(group_slug)}-{slug(concept)}.txt"
            body = f"""OS MEDIA VM — SPESIFIKASI KOMPONEN INFRASTRUKTUR
ID: OSM-INF-{number:04d}
Nama: {title}
Kelompok: {group_name}
Fungsi: {concept} untuk domain {group_name} pada OS MEDIA VM desktop dan modal dialog.

TUJUAN
Mendefinisikan satu komponen yang dapat ditinjau, diimplementasikan, dan diuji secara terpisah. Dokumen ini adalah spesifikasi, bukan bukti layanan sudah aktif.

PERILAKU DAN KONTRAK
- Validasi masukan; bedakan status idle, loading, success, empty, dan error.
- Input: konfigurasi tervalidasi dan konteks minimum. Output: status, hasil, dan diagnostik tanpa rahasia.
- Tangani kegagalan secara aman; hindari aksi ganda dan perubahan destruktif tanpa konfirmasi.
- Gunakan tautan relatif yang kompatibel dengan subpath GitHub Pages / .L/.
- Untuk dialog: judul terhubung, role=dialog, aria-modal=true, fokus awal, Escape, tombol tutup, dan pemulihan fokus.
- Dialog harus responsif, memiliki batas tinggi, dan mendukung gulir konten pada layar kecil.

KEAMANAN DAN AKSESIBILITAS
Terapkan hak akses minimum, sanitasi keluaran, perlindungan injeksi, label kontrol, fokus terlihat, navigasi keyboard, kontras memadai, dan prefers-reduced-motion. Antarmuka bukan pengganti otorisasi server. Jangan simpan kredensial di repositori atau browser.

INTEGRASI
GitHub Pages menyajikan aset statis. Database, autentikasi server, antrean, container, pekerjaan latar, dan AI membutuhkan layanan eksternal. Jangan menyatakan integrasi aktif tanpa konfigurasi dan pengujian nyata.

UJI PENERIMAAN
1. Jalur sukses menghasilkan keluaran sesuai kontrak.
2. Input kosong, salah format, dan batas ukuran diuji.
3. Kegagalan ditangani tanpa membocorkan data sensitif.
4. Kontrol dapat digunakan dengan keyboard dan pembaca layar.
5. Nama file, ID, tautan, dan katalog konsisten.
"""
            (out / filename).write_text(body, encoding="utf-8")
            records.append((filename, title, group_name))
    cards = []
    for filename, title, group_name in records:
        cards.append('<a class="item" data-search="' + html.escape((title + " " + group_name).lower(), quote=True) + '" href="./' + filename + '"><small>' + html.escape(group_name) + '</small><strong>' + html.escape(title) + '</strong><code>' + filename + '</code></a>')
    page = """<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OS MEDIA VM — 1500 Komponen</title><style>body{font:16px/1.55 system-ui;margin:0;background:#08152d;color:#edf5ff}main{max-width:1100px;margin:auto;padding:26px}input{box-sizing:border-box;width:100%;padding:13px;border:1px solid #365273;border-radius:12px;background:#102447;color:white;margin:16px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:9px}a{display:flex;flex-direction:column;gap:5px;padding:12px;border:1px solid #29466c;border-radius:10px;color:#bfe8ff;text-decoration:none}a:hover{background:#17345c}small,code,p{color:#9db6d7}code{font-size:11px;overflow-wrap:anywhere}</style></head><body><main><p>OS MEDIA VM / KATALOG INFRASTRUKTUR</p><h1>1500 komponen infrastruktur</h1><p>Satu spesifikasi TXT untuk setiap komponen. Isi adalah rancangan dan kriteria penerimaan, bukan bukti layanan backend aktif.</p><input id="q" type="search" placeholder="Cari komponen…" aria-label="Cari komponen"><p id="count"></p><div class="grid" id="grid">""" + "".join(cards) + """</div><p>GitHub Pages menyajikan aset statis; layanan backend memerlukan integrasi eksternal.</p></main><script>const q=document.querySelector('#q'),items=[...document.querySelectorAll('.item')];function filter(){const s=q.value.toLocaleLowerCase('id');let n=0;items.forEach(a=>{const ok=(a.textContent+' '+a.dataset.search).toLocaleLowerCase('id').includes(s);a.hidden=!ok;if(ok)n++});document.querySelector('#count').textContent=n+' dari '+items.length+' komponen'}q.addEventListener('input',filter);filter()</script></body></html>"""
    (out / "index.html").write_text(page, encoding="utf-8")
    (out / "README.md").write_text("# OS MEDIA VM — 1500 Komponen Infrastruktur\n\nBerisi 1500 berkas TXT komponen, satu spesifikasi per berkas, dan katalog pencarian index.html.\n\nGitHub Pages menyajikan aset statis; backend dan layanan server membutuhkan integrasi eksternal.\n", encoding="utf-8")
    if number != 1500:
        raise SystemExit(f"Jumlah komponen tidak sesuai: {number}")
    print(f"Infrastruktur 1500 selesai: {number} TXT + katalog HTML dan README.")


def generate_infrastructure_15000():
    """Generate exactly 15,000 individual TXT infrastructure component specifications."""
    import html
    out = ROOT / "osmediavm/infrastruktur-15000"
    out.mkdir(parents=True, exist_ok=True)
    groups = [
        ("antarmuka-desain", "Antarmuka dan desain"), ("desktop-navigasi", "Desktop dan navigasi"),
        ("modal-dialog", "Modal dan dialog"), ("file-manager", "Pengelola berkas"),
        ("filesystem", "Sistem berkas"), ("hosting-server", "Hosting dan server"),
        ("cloud-edge", "Cloud dan edge"), ("keamanan-privasi", "Keamanan dan privasi"),
        ("identitas-akses", "Identitas dan akses"), ("runtime-api", "Runtime dan API"),
        ("backend-jobs", "Backend dan pekerjaan latar"), ("database-data", "Database dan data"),
        ("pencarian-indeks", "Pencarian dan indeks"), ("ai-asisten", "AI dan asisten"),
        ("otomasi-alur", "Otomasi alur kerja"), ("devops-ci", "DevOps dan CI"),
        ("deployment-pages", "Deployment dan Pages"), ("domain-dns-tls", "Domain DNS dan TLS"),
        ("observabilitas", "Observabilitas"), ("backup-pemulihan", "Backup dan pemulihan"),
        ("performa-cache", "Performa dan cache"), ("aksesibilitas", "Aksesibilitas"),
        ("lokalisasi", "Bahasa dan lokalisasi"), ("analitik", "Analitik dan telemetri"),
        ("konten-media", "Konten dan media"), ("kolaborasi", "Kolaborasi"),
        ("notifikasi", "Notifikasi dan pesan"), ("konfigurasi", "Konfigurasi sistem"),
        ("pengujian", "Pengujian dan kualitas"), ("tata-kelola", "Tata kelola dan dokumentasi"),
    ]
    concepts = [
        "identitas", "palet-warna", "tipografi", "ikonografi", "grid", "tata-letak", "tema",
        "animasi", "komponen", "responsivitas", "desktop", "taskbar", "dock", "peluncur",
        "pencarian", "notifikasi", "jendela", "desktop-virtual", "pintasan", "menu-konteks",
        "dialog-konfirmasi", "dialog-peringatan", "dialog-formulir", "dialog-progres",
        "dialog-pemilih", "dialog-bantuan", "dialog-kesalahan", "panel-samping", "fokus-modal",
        "pengelolaan-fokus", "daftar-berkas", "pohon-direktori", "pratinjau-berkas", "editor-teks",
        "editor-kode", "salin-berkas", "pindah-berkas", "arsip", "tempat-sampah", "riwayat-versi",
        "metadata", "izin-berkas", "indeks-berkas", "filter-berkas", "pengurutan-berkas",
        "checksum", "validasi-berkas", "sinkronisasi-berkas", "retensi-berkas", "server-web",
    ]
    modifiers = ["registri", "konfigurasi", "preferensi", "status", "validasi", "pemrosesan",
                 "penyimpanan", "pemulihan", "pencarian", "penyaringan"]
    records = []
    number = 0
    for group_slug, group_name in groups:
        for concept in concepts:
            for modifier in modifiers:
                number += 1
                title = modifier.replace("-", " ").title() + " " + concept.replace("-", " ")
                filename = f"{number:05d}-{group_slug}-{modifier}-{concept}.txt"
                body = f"""OS MEDIA VM — SPESIFIKASI KOMPONEN INFRASTRUKTUR
ID: OSM-INF-{number:05d}
Nama: {title}
Kelompok: {group_name}
Konsep: {concept.replace('-', ' ')}
Tipe: {modifier.replace('-', ' ')}

TUJUAN
Menentukan kontrak komponen yang dapat diimplementasikan, ditinjau, dan diuji secara terpisah untuk OS MEDIA VM desktop dan modal dialog.

PERILAKU DAN STATUS
- Definisikan input, output, validasi, dan pemilik keadaan secara eksplisit.
- Bedakan status idle, loading, success, empty, dan error.
- Cegah pengiriman ganda dan konfirmasi perubahan yang destruktif.
- Sediakan pesan kesalahan yang jelas dan jalur pemulihan.
- Gunakan tautan relatif yang bekerja pada subpath GitHub Pages / .L/.

KONTRAK ANTARMUKA
- ID stabil: osm-inf-{number:05d}; nama dan jalur harus konsisten dengan katalog.
- Kontrol interaktif memiliki label yang dapat diakses, fokus terlihat, dan navigasi keyboard.
- Dialog menggunakan judul terhubung, role=dialog, aria-modal=true, Escape, tombol tutup, fokus awal, dan pemulihan fokus.
- Dialog responsif, tinggi dibatasi, dan konten dapat digulir pada viewport kecil.
- Hormati prefers-reduced-motion dan zoom browser.

DATA DAN KEAMANAN
- Validasi tipe, rentang, dan ukuran input; sanitasi output yang ditampilkan.
- Terapkan prinsip hak akses minimum; UI tidak menggantikan otorisasi server.
- Jangan menaruh token, kata sandi, atau rahasia dalam TXT, HTML, JavaScript, atau repositori.
- Kegagalan harus aman dan tidak boleh membocorkan data sensitif.

DEPLOYMENT DAN INTEGRASI
GitHub Pages hanya meng-host aset statis. Database, autentikasi server, pekerjaan latar, antrean, container, AI, dan operasi infrastruktur membutuhkan layanan eksternal dan konfigurasi tersendiri. Jangan menyatakan layanan aktif hanya karena spesifikasi tersedia.

UJI PENERIMAAN
1. Jalur sukses dan hasil cocok dengan kontrak.
2. Input kosong, salah format, dan batas ukuran diuji.
3. Kegagalan ditangani tanpa membocorkan data sensitif.
4. Kontrol dapat dipakai dengan keyboard dan pembaca layar.
5. Tautan berkas, ID, katalog, dan subpath Pages valid.

STATUS
Spesifikasi rancangan; bukan bukti bahwa layanan atau backend terkait telah berjalan.
"""
                (out / filename).write_text(body, encoding="utf-8")
                records.append({"file": filename, "title": title, "group": group_name, "id": f"OSM-INF-{number:05d}"})
    page_data = json.dumps(records, ensure_ascii=False).replace("</", "<\\/")
    page = """<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Katalog 15.000 spesifikasi komponen infrastruktur OS MEDIA VM"><title>OS MEDIA VM — 15.000 Komponen</title><style>body{font:16px/1.55 system-ui;margin:0;background:#08152d;color:#edf5ff}main{max-width:1100px;margin:auto;padding:26px}input{box-sizing:border-box;width:100%;padding:13px;border:1px solid #365273;border-radius:12px;background:#102447;color:white;margin:16px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:9px}a{display:flex;flex-direction:column;gap:5px;padding:12px;border:1px solid #29466c;border-radius:10px;color:#bfe8ff;text-decoration:none;overflow-wrap:anywhere}a:hover,a:focus{background:#17345c;outline:2px solid #8dd8ff}small,code,p{color:#9db6d7}code{font-size:11px;overflow-wrap:anywhere}</style></head><body><main><p>OS MEDIA VM / KATALOG INFRASTRUKTUR</p><h1>15.000 komponen infrastruktur</h1><p>Satu komponen per berkas TXT. Ini spesifikasi dan kriteria penerimaan, bukan bukti backend aktif.</p><input id="q" type="search" placeholder="Cari ID, komponen, atau domain…" aria-label="Cari komponen"><p id="count"></p><div class="grid" id="grid"></div><p>GitHub Pages hanya menyajikan aset statis. Backend memerlukan integrasi eksternal.</p></main><script>const data=__DATA__;const q=document.querySelector('#q'),grid=document.querySelector('#grid'),count=document.querySelector('#count');function draw(){const s=q.value.toLocaleLowerCase('id');const found=data.filter(x=>(x.file+' '+x.title+' '+x.group+' '+x.id).toLocaleLowerCase('id').includes(s));count.textContent=found.length.toLocaleString('id')+' dari '+data.length.toLocaleString('id')+' komponen';grid.replaceChildren(...found.map(x=>{const a=document.createElement('a');a.href='./'+x.file;const small=document.createElement('small');small.textContent=x.id+' · '+x.group;const strong=document.createElement('strong');strong.textContent=x.title;const code=document.createElement('code');code.textContent=x.file;a.append(small,strong,code);return a}))}q.addEventListener('input',draw);draw()</script></body></html>""".replace("__DATA__", page_data)
    (out / "index.html").write_text(page, encoding="utf-8")
    (out / "README.md").write_text("# OS MEDIA VM — Infrastruktur 15.000 Komponen\n\nBerisi tepat 15.000 berkas TXT, satu komponen per berkas, serta katalog pencarian index.html.\n\nGitHub Pages hanya menyajikan aset statis; layanan server membutuhkan integrasi eksternal.\n", encoding="utf-8")
    if number != 15000 or len(records) != 15000:
        raise SystemExit(f"Jumlah komponen salah: {number}")
    print(f"Infrastruktur selesai: {number} berkas TXT unik.")

# Generator revisi: nama berkas berdasarkan nama menu dan total definisi tepat 25.000.

def migrate_recordin():
    """Move infrastructure TXT files to a .reic catalog and install a static viewer."""
    import json
    root = ROOT / "osmediavm" / "recordin"
    root.mkdir(parents=True, exist_ok=True)
    sources = [ROOT / "osmediavm" / n for n in
               ("infrastruktur-15000", "infrastruktur-1500", "infrastruktur-150")]
    entries, used, moved = [], set(), 0
    for source in sources:
        if not source.exists():
            continue
        prefix = source.name.replace("infrastruktur-", "infra-")
        for old in sorted(source.rglob("*.txt")):
            if not old.is_file():
                continue
            base = old.stem
            name = f"{prefix}-{base}.reic"
            n = 2
            while name.casefold() in used or (root / name).exists():
                name = f"{prefix}-{base}-{n}.reic"
                n += 1
            used.add(name.casefold())
            body = old.read_text(encoding="utf-8", errors="replace")
            (root / name).write_text(
                "--- REIC/1 ---\ntitle: " + base.replace("-", " ") +
                "\nsource: " + source.name + "/" + old.relative_to(source).as_posix() +
                "\nrender: text\n--- END REIC HEADER ---\n\n" + body, encoding="utf-8")
            old.unlink()
            entries.append({"file": name, "title": base.replace("-", " "), "source": source.name})
            moved += 1
    css = """*{box-sizing:border-box}body{margin:0;background:#07111f;color:#eef5ff;font:16px/1.6 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:24px}header,.panel{background:#101e31;border:1px solid #2b405a;border-radius:16px;padding:18px}input{width:100%;padding:13px;margin:16px 0;background:#081423;color:inherit;border:1px solid #38516d;border-radius:10px}#list{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:9px}.item{display:flex;flex-direction:column;gap:5px;padding:12px;border:1px solid #2b405a;border-radius:10px;color:#c9eaff;text-decoration:none;overflow-wrap:anywhere}small,code,.muted{color:#a9bad0}code{font-size:.78rem;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.6 ui-monospace,monospace;background:#081423;padding:18px;border-radius:12px;max-height:65vh;overflow:auto}button{padding:10px 14px;border:1px solid #38516d;border-radius:9px;background:#17314c;color:#fff;cursor:pointer}.hidden{display:none!important}:focus{outline:2px solid #8dd8ff;outline-offset:2px}"""
    js = """(()=>{'use strict';const q=s=>document.querySelector(s),list=q('#list'),search=q('#search'),view=q('#viewer'),source=q('#source'),back=q('#back'),count=q('#count');let entries=[];function el(t,c,v){const n=document.createElement(t);if(c)n.className=c;if(v!==undefined)n.textContent=v;return n}async function openFile(file){try{const r=await fetch('./'+encodeURIComponent(file));if(!r.ok)throw Error('HTTP '+r.status);source.textContent=await r.text();q('#viewTitle').textContent=file;view.classList.remove('hidden');list.parentElement.classList.add('hidden');history.replaceState(null,'','#'+encodeURIComponent(file))}catch(e){source.textContent='Gagal membuka berkas: '+e.message;view.classList.remove('hidden')}}function draw(){const s=search.value.toLocaleLowerCase('id'),found=entries.filter(x=>(x.file+' '+x.title+' '+x.source).toLocaleLowerCase('id').includes(s));list.replaceChildren(...found.map(x=>{const a=el('a','item');a.href='./'+encodeURIComponent(x.file);a.append(el('strong','',x.title),el('small','',x.source),el('code','',x.file));a.addEventListener('click',e=>{e.preventDefault();openFile(x.file)});return a}));count.textContent=found.length.toLocaleString('id')+' berkas REIC'}search.addEventListener('input',draw);back.addEventListener('click',()=>{view.classList.add('hidden');list.parentElement.classList.remove('hidden');history.replaceState(null,'',location.pathname)});fetch('./manifest.json').then(r=>{if(!r.ok)throw Error('manifest tidak tersedia');return r.json()}).then(d=>{entries=d;draw();const f=decodeURIComponent(location.hash.slice(1));if(f&&entries.some(x=>x.file===f))openFile(f)}).catch(e=>count.textContent='Gagal memuat katalog: '+e.message)})();"""
    (root / "recordin.css").write_text(css, encoding="utf-8")
    (root / "recordin.js").write_text(js, encoding="utf-8")
    (root / "manifest.json").write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    page = """<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OS MEDIA VM — Recordin REIC</title><link rel="stylesheet" href="./recordin.css"></head><body><main><header><small>OS MEDIA VM / RECORDIN</small><h1>Runtime berkas .reic</h1><p class="muted">Berkas REIC dibaca oleh runtime JavaScript statis. Konten ditampilkan sebagai teks aman, bukan dieksekusi sebagai kode arbitrer.</p><input id="search" type="search" placeholder="Cari nama atau sumber berkas" aria-label="Cari berkas REIC"><p id="count">Memuat katalog…</p></header><section class="panel" style="margin-top:16px"><div id="list"></div></section><section id="viewer" class="panel hidden" style="margin-top:16px"><button id="back" type="button">Kembali ke katalog</button><h2 id="viewTitle">Berkas REIC</h2><pre id="source" tabindex="0"></pre></section><p class="muted">Ekstensi .reic bukan standar browser dan memerlukan runtime ini. PHP memerlukan server PHP; GitHub Pages hanya menyajikan aset statis.</p></main><script src="./recordin.js" defer></script></body></html>"""
    (root / "index.html").write_text(page, encoding="utf-8")
    (root / "README.md").write_text(
        "# OS MEDIA VM — Recordin / REIC\n\n"
        "Spesifikasi dari tiga folder infrastruktur dikumpulkan ke sini dan diubah dari TXT menjadi REIC.\n\n"
        "Runtime statis: index.html, recordin.css, recordin.js, manifest.json. REIC adalah format khusus proyek; browser tidak menjalankannya secara native. Runtime saat ini menampilkan sumber dengan aman sebagai teks. PHP memerlukan server PHP dan tidak berjalan pada GitHub Pages.\n",
        encoding="utf-8")
    print(f"Recordin: {moved} TXT dipindahkan dan diubah menjadi REIC.")

if __name__ == "__main__":
    main()
    generate_infrastructure_150()
    generate_infrastructure_1500()
    generate_infrastructure_15000()
    migrate_recordin()
