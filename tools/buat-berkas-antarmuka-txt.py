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

if __name__ == "__main__":
    main()
    generate_infrastructure_150()
    generate_infrastructure_1500()

# Generator revisi: nama berkas berdasarkan nama menu dan total definisi tepat 25.000.
