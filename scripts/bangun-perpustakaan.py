#!/usr/bin/env python3
"""Bangun pustaka statis 15.000 menu dengan folder bernama kata Indonesia."""
from pathlib import Path
import json
import html
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "leksikon" / "modul"
TOTAL = 15000
CATEGORIES = [
    ("sistem-perangkat", "Sistem & perangkat", "perangkat, proses, sumber daya, dan informasi perangkat"),
    ("file-penyimpanan", "File & penyimpanan", "berkas, folder, pencarian, metadata, dan penyimpanan"),
    ("jaringan-internet", "Jaringan & internet", "jaringan, koneksi, DNS, host, dan konektivitas"),
    ("aplikasi-utilitas", "Aplikasi & utilitas", "aplikasi, utilitas, pembuka, dan preferensi"),
    ("keamanan-akses", "Keamanan & akses", "privasi, izin, sesi, dan pemeriksaan keamanan"),
    ("pengembangan", "Pengembangan", "repositori, penyunting kode, proyek, pembangunan, dan dokumentasi"),
    ("data-analitik", "Data & analitik", "himpunan data, tabel, laporan, grafik, dan ekspor"),
    ("media-kreativitas", "Media & kreativitas", "gambar, audio, video, koleksi, dan pratinjau"),
    ("produktivitas", "Produktivitas", "catatan, tugas, kalender, papan kerja, dan aktivitas"),
    ("administrasi", "Administrasi", "log, konfigurasi, pemantauan, kebijakan, dan audit"),
    ("aksesibilitas", "Aksesibilitas", "tampilan, navigasi, masukan, pembaca, dan preferensi akses"),
    ("bantuan-pemulihan", "Bantuan & pemulihan", "panduan, diagnostik, pemulihan, dan informasi sistem"),
]
NOUNS = [
    "Ringkasan", "Pengelola", "Penampil", "Pencarian", "Konfigurasi",
    "Riwayat", "Pemantau", "Diagnostik", "Impor", "Ekspor", "Pustaka",
    "Pusat-Kendali", "Pemeriksa", "Penyusun", "Sinkronisasi", "Jadwal",
    "Pemberitahuan", "Pintasan", "Preferensi", "Laporan", "Indeks",
    "Antrean", "Status", "Koleksi", "Arsip", "Pemulihan", "Validasi",
    "Integrasi", "Panel", "Konsol",
]
def slug(value):
    return value.lower().replace("&", "dan").replace(" ", "-").replace("/", "-")

def esc(value):
    return html.escape(str(value), quote=True)

def binary_utf8(value):
    return " ".join(f"{byte:08b}" for byte in value.encode("utf-8"))

def page_html(number, category, noun, title, folder_path):
    category_name, description = category[1], category[2]
    title_e, cat_e = esc(title), esc(category_name)
    bin_e = esc(binary_utf8(noun.replace("-", " ")))
    path_e = esc(folder_path)
    bits = (number - 1) % 8
    return f'''<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#061527"><meta name="description" content="{title_e}: modul Perpustakaan sistem Planetbintang.">
<title>{title_e} · Kamus Sistem Planetbintang</title>
<style>
:root{{color-scheme:dark;--bg:#06111f;--panel:#0b2033;--line:#2b4c66;--ink:#edf7ff;--muted:#b2c8db;--cyan:#6de1ff;--gold:#ffd28b}}
*{{box-sizing:border-box}}body{{margin:0;background:radial-gradient(ellipse at 80% 0,#163e60,transparent 45%),var(--bg);color:var(--ink);font:16px/1.7 system-ui,sans-serif}}main{{width:min(1000px,100%);margin:auto;padding:clamp(16px,4vw,44px)}}a{{color:var(--cyan)}}.eyebrow{{font-size:11px;letter-spacing:.17em;color:var(--cyan);font-weight:800}}h1{{font-size:clamp(28px,5vw,52px);line-height:1.12;margin:.4em 0}}p{{color:var(--muted)}}.panel{{border:1px solid var(--line);background:linear-gradient(145deg,#0d253a,#071522);padding:clamp(16px,3vw,28px);margin:16px 0}}.chip{{float:right;width:112px;height:112px;border:2px solid var(--cyan);display:grid;place-items:center;color:var(--cyan);font-size:30px;font-weight:900;background:repeating-linear-gradient(0deg,#0a1d2e 0 8px,#16405c 8px 10px);margin:0 0 18px 18px}}dt{{color:var(--cyan);font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-top:14px}}dd{{margin:3px 0;color:var(--ink);overflow-wrap:anywhere}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;background:#030d17;border:1px solid var(--line);padding:14px;color:var(--gold);font-size:12px}}.actions{{display:flex;gap:12px;flex-wrap:wrap}}.actions a{{border:1px solid var(--line);padding:9px 12px;text-decoration:none}}.small{{font-size:12px}}.clear{{clear:both}}
</style></head><body><main>
<p class="eyebrow">PERPUSTAKAAN · MODUL SISTEM {number:05d}</p><div class="chip" aria-label="Logo konseptual rangkaian IC">IC</div>
<h1>{title_e}</h1><p><b>{cat_e}</b> · Entri {number:05d} dari 15.000</p>
<section class="panel"><h2>Deskripsi dan penjelasan terperinci</h2>
<p>Modul <b>{title_e}</b> merupakan bagian dari katalog sistem Planetbintang yang mengatur alur informasi untuk {esc(description)}. Halaman ini menyajikan tujuan modul, identitas data, jalur navigasi, dan representasi tekstual yang dapat dibaca melalui peramban.</p>
<p>Dalam mode situs statis, modul ini berfungsi sebagai dokumentasi, penampil informasi, dan titik navigasi. Operasi yang membutuhkan perangkat sistem operasi, akses perangkat keras, perubahan DNS, layanan jarak jauh, atau penyimpanan bersama harus disediakan oleh layanan terpisah dan tidak dianggap aktif hanya karena halaman ini tersedia.</p>
<dl><dt>Nama modul</dt><dd>{title_e}</dd><dt>Kategori</dt><dd>{cat_e}</dd><dt>Jalur pustaka</dt><dd><code>{path_e}</code></dd><dt>Peran sistem</dt><dd>Mengatur, menampilkan, memeriksa, atau mendokumentasikan {esc(description)}.</dd><dt>Integrasi</dt><dd>Perpustakaan → registri → penampil → data lokal → komponen antarmuka.</dd><dt>Status</dt><dd>Halaman dokumentasi statis siap dibuka.</dd></dl></section>
<section class="panel"><h2>Representasi biner dan kode hubungan</h2><p>Representasi biner UTF-8 untuk istilah dasar <b>{esc(noun.replace("-", " "))}</b>:</p><pre>{bin_e}</pre><pre>KATA := "{esc(noun.replace("-", " "))}"
TEKS → NORMALISASI → REGISTRI → PENAMPIL
DATA → [ IC / LOGO ] → KOMPONEN ANTARMUKA
MODUL := "{esc(slug(title))}"
STATUS := "TERDAFTAR"
TAUTAN := "/aktif/kamus-digital-modern/"</pre><p>Notasi di atas merupakan rumus konseptual aliran data dan visualisasi identitas modul. Notasi ini bukan instruksi prosesor atau simulasi rangkaian magnetik/elektrik.</p><div class="clear"></div></section>
<nav class="actions"><a href="../../../index.html">Buka Kamus Digital Modern</a><a href="../../../index.html#query">Cari kata</a><a href="../../../../index.html">Kembali ke halaman utama</a></nav>
<p class="small">Pustaka kata bahasa Indonesia · ikon dunia 🌐 · komponen IC konseptual · dokumen {number:05d}</p>
</main></body></html>'''

def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    manifest = []
    for i in range(TOTAL):
        category = CATEGORIES[i % len(CATEGORIES)]
        noun = NOUNS[(i // len(CATEGORIES)) % len(NOUNS)]
        variant = i // (len(CATEGORIES) * len(NOUNS))
        title = f"{noun} {category[1]}" + (f" Varian {variant + 1:03d}" if variant else "")
        folder = slug(noun) + "-" + category[0] + (f"-varian-{variant + 1:03d}" if variant else "")
        folder_path = f"/aktif/modul/{category[0]}/{folder}/index.html"
        destination = OUT / category[0] / folder / "index.html"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(page_html(i + 1, category, noun, title, folder_path), encoding="utf-8")
        manifest.append({"nomor": i + 1, "nama": title, "kategori": category[1], "folder": folder_path})
    (OUT / "daftar-modul.json").write_text(json.dumps({
        "nama": "Perpustakaan Sistem Planetbintang",
        "bahasa": "Indonesia",
        "jumlah": TOTAL,
        "berkasPerModul": 1,
        "modul": manifest
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    catalog = """<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Katalog 15.000 Modul · Perpustakaan</title><style>body{margin:0;background:#06111f;color:#edf7ff;font:15px/1.6 system-ui;padding:clamp(14px,3vw,32px)}main{max-width:1100px;margin:auto}a{color:#6de1ff}input,select,button{font:inherit;padding:10px;background:#071a2b;color:#edf7ff;border:1px solid #31536d;border-radius:0}input{width:min(100%,520px)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:8px;margin:16px 0}.item{display:block;padding:12px;border:1px solid #29465e;background:#0b2033;text-decoration:none}.item small{display:block;color:#a9c1d8}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.note{color:#a9c1d8;font-size:12px}</style></head><body><main><p>🌐 PERPUSTAKAAN PLANETBINTANG</p><h1>Katalog 15.000 Modul Sistem</h1><p>Setiap entri memiliki satu halaman HTML dengan nama folder berbasis kata bahasa Indonesia, deskripsi, representasi biner, dan diagram konseptual IC.</p><div class="row"><input id="q" type="search" placeholder="Cari nama modul atau kategori"><select id="cat"><option value="">Semua kategori</option></select><span id="count">Memuat katalog…</span></div><div id="list" class="grid"></div><div class="row"><button id="prev">Sebelumnya</button><span id="page">Halaman 1</span><button id="next">Berikutnya</button></div><p class="note">Katalog ditampilkan bertahap agar halaman tetap ringan. Status modul adalah dokumentasi website statis.</p><p><a href="../index.html">Kembali ke Kamus Digital Modern</a> · <a href="../../index.html">Halaman utama</a></p></main><script>
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let all=[],filtered=[],page=0;const size=100;const $=id=>document.getElementById(id);
fetch('daftar-modul.json').then(r=>r.json()).then(data=>{all=data.modul;$('count').textContent=all.length.toLocaleString('id-ID')+' entri';[...new Set(all.map(x=>x.kategori))].forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;$('cat').append(o)});draw()}).catch(()=>$('count').textContent='Katalog tidak dapat dimuat');
function draw(){const q=$('q').value.toLocaleLowerCase('id').trim(),c=$('cat').value;filtered=all.filter(x=>(!c||x.kategori===c)&&(!q||(x.nama+' '+x.kategori).toLocaleLowerCase('id').includes(q)));const pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages-1);$('list').innerHTML=filtered.slice(page*size,(page+1)*size).map(x=>'<a class="item" href=".'+x.folder.replace('/aktif/modul','')+'"><b>'+esc(x.nama)+'</b><small>'+esc(x.kategori)+' · entri '+String(x.nomor).padStart(5,'0')+'</small></a>').join('')||'<p>Tidak ada hasil.</p>';$('page').textContent='Halaman '+(page+1)+' / '+pages;$('count').textContent=filtered.length.toLocaleString('id-ID')+' hasil';$('prev').disabled=page===0;$('next').disabled=page>=pages-1}
$('q').addEventListener('input',()=>{page=0;draw()});$('cat').addEventListener('change',()=>{page=0;draw()});$('prev').addEventListener('click',()=>{page=Math.max(0,page-1);draw()});$('next').addEventListener('click',()=>{page++;draw()});
</script></body></html>"""
    (OUT / "index.html").write_text(catalog, encoding="utf-8")
    # Ganti katalog lama pada hasil publikasi dengan pustaka /aktif/.
    # Sisakan satu alamat kompatibilitas yang mengarahkan URL lama ke Kamus Digital Modern.
    legacy = ROOT / "system-menus"
    alias = legacy / "sistem-perangkat" / "menu-00001" / "index.html"
    if legacy.exists():
        for child in list(legacy.iterdir()):
            if child.name != "sistem-perangkat":
                shutil.rmtree(child) if child.is_dir() else child.unlink()
        category_dir = legacy / "sistem-perangkat"
        if category_dir.exists():
            for child in list(category_dir.iterdir()):
                if child.name != "menu-00001":
                    shutil.rmtree(child) if child.is_dir() else child.unlink()
            alias_dir = category_dir / "menu-00001"
            if alias_dir.exists():
                for child in list(alias_dir.iterdir()):
                    if child.name != "index.html":
                        shutil.rmtree(child) if child.is_dir() else child.unlink()
    print(f"Perpustakaan dibangun: {TOTAL} halaman, {len(manifest)} entri.")


def build_code_feature_pages():
    """Bangun halaman individual untuk seluruh spesifikasi katalog Code."""
    source = ROOT / "data" / "git-feature-catalog.json"
    output = ROOT / "pusat-pengembangan" / "fitur"
    if not source.is_file():
        raise SystemExit("Katalog fitur Code tidak ditemukan: data/git-feature-catalog.json")
    payload = json.loads(source.read_text(encoding="utf-8"))
    features = payload.get("features", [])
    if not features:
        raise SystemExit("Katalog fitur Code kosong; halaman fitur tidak dibangun.")
    output.mkdir(parents=True, exist_ok=True)
    template = """<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#071321"><meta name="description" content="{description}">
<title>{title} · Pusat Pengembangan Planetbintang</title>
<style>
:root{{color-scheme:dark;--bg:#071321;--panel:#0b2033;--line:#284760;--ink:#edf7ff;--muted:#a9c1d8;--cyan:#6de1ff;--gold:#ffd28b}}
*{{box-sizing:border-box}}body{{margin:0;background:radial-gradient(ellipse at 85% 0,#163e60,transparent 42%),var(--bg);color:var(--ink);font:15px/1.7 system-ui,sans-serif}}main{{max-width:1000px;margin:auto;padding:clamp(16px,4vw,42px)}}a{{color:var(--cyan)}}.eyebrow{{font:11px ui-monospace,monospace;letter-spacing:.16em;color:var(--cyan)}}h1{{font-size:clamp(30px,5vw,54px);line-height:1.1;letter-spacing:-.04em}}.panel{{border:1px solid var(--line);background:linear-gradient(145deg,#0d253a,#071522);padding:clamp(16px,3vw,28px);margin:14px 0}}.muted{{color:var(--muted)}}.id{{color:var(--gold);font:12px ui-monospace,monospace}}li{{margin:.7em 0}}.actions{{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}}.actions a{{border:1px solid var(--line);padding:9px 12px;text-decoration:none}}.pill{{display:inline-block;border:1px solid var(--line);padding:4px 8px;font:11px ui-monospace,monospace;color:var(--gold)}}code{{overflow-wrap:anywhere}}
</style></head><body><main>
<p class="eyebrow">PLANETBINTANG · SPESIFIKASI FITUR</p><h1>{title}</h1>
<p class="id">{id} · {module}</p><p><span class="pill">Status katalog: {status}</span></p>
<section class="panel"><h2>Tujuan dan ruang lingkup</h2><p>Fitur <b>{title}</b> menyediakan alur kerja {action_lower} dalam modul <b>{module}</b>. Halaman ini merupakan spesifikasi implementasi individual yang terhubung ke katalog pusat; status implementasi harus diperbarui hanya setelah perubahan kode dan verifikasi nyata selesai.</p><p class="muted">Ruang lingkup data: identitas fitur, masukan, keluaran, status proses, penanganan kesalahan, dan navigasi kembali ke modul induk.</p></section>
<section class="panel"><h2>Rancangan tampilan</h2><ul><li>Header dengan nama fitur, ID unik, breadcrumb, dan tautan kembali ke Pusat Pengembangan.</li><li>Area kerja responsif dengan panel ringkasan, kontrol yang sesuai untuk {action_lower}, hasil, serta keadaan memuat, kosong, berhasil, dan gagal.</li><li>Validasi masukan, pesan kesalahan yang jelas, dukungan keyboard, dan label aksesibel.</li><li>Gaya REIC gelap dengan permukaan berlapis, aksen sian, batas halus, dan tata letak yang menyesuaikan layar.</li></ul></section>
<section class="panel"><h2>Integrasi dan verifikasi</h2><ul><li>Gunakan ID <code>{id}</code> sebagai kunci stabil dan pisahkan tampilan dari lapisan data/service.</li><li>Hubungkan API atau penyimpanan hanya melalui adapter yang benar-benar tersedia; GitHub Pages tidak menyediakan backend privat.</li><li>Uji alur sukses, data kosong, input tidak valid, kegagalan jaringan, izin akses, serta tampilan ponsel.</li><li>Jangan menandai fitur aktif/terverifikasi sebelum kode operasional dan hasil pengujian tersedia.</li></ul><p class="muted">Halaman ini adalah spesifikasi fitur yang dibangun dari data katalog. Halaman ini tidak dengan sendirinya mengaktifkan API, layanan eksternal, atau backend.</p></section>
<div class="actions"><a href="../index.html">Kembali ke Pusat Pengembangan</a><a href="../../git-feature-catalog.html">Katalog Fitur Git</a><a href="../../feature-workbench.html?feature={id}">Ruang Kerja Implementasi</a><a href="../../index.html">Beranda Planetbintang</a></div>
</main></body></html>"""
    written = 0
    for item in features:
        feature_id = str(item.get("id", ""))
        if not feature_id or any(ch not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" for ch in feature_id):
            raise SystemExit(f"ID fitur tidak valid: {feature_id!r}")
        title = str(item.get("title") or feature_id)
        module = str(item.get("module") or "Modul umum")
        action = str(item.get("action") or "operasi fitur")
        status = str(item.get("status") or "planned")
        values = {
            "id": html.escape(feature_id, quote=True),
            "title": html.escape(title, quote=True),
            "module": html.escape(module, quote=True),
            "action_lower": html.escape(action.lower(), quote=True),
            "status": html.escape(status, quote=True),
            "description": html.escape(f"{title}: spesifikasi fitur {module}.", quote=True),
        }
        (output / f"{feature_id}.html").write_text(template.format(**values), encoding="utf-8")
        written += 1
    print(f"Pusat Pengembangan dibangun: {written} halaman fitur individual dari katalog sumber.")

if __name__ == "__main__":
    main()
    build_code_feature_pages()
