#!/usr/bin/env python3
"""Bangun shard statis untuk folder virtual sistem (root /) pada File Manager.

Folder virtual: /data /pro /media /acct /config /sys /system_ext /cache
Setiap folder berisi subfolder khas sistem, lengkap dengan file contoh yang
mempunyai nama, ekstensi, dan fungsi (metadata). Konten blob tidak pernah
diterbitkan; hanya struktur metadata. Struktur mengikuti skema shard yang sama
dengan pohon Git (index.json + pages/*.json.gz) sehingga file-manager.js dapat
membacanya tanpa perubahan format.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TREE_ROOT = ROOT / "data" / "trees"
VFS_ID = "0000000000000000"
PAGE_SIZE = 500

# (nama, jenis, ukuran byte atau None, mode, fungsi)
SYSTEM_TREE: dict[str, list[tuple]] = {
    "data": [
        ("local", "DIR", None, "040775", "Data aplikasi per-pengguna (Android-style: files, cache shared)"),
        ("misc", "DIR", None, "040775", "Data campuran layanan sistem: keystore, vold, profil"),
        ("system", "DIR", None, "040775", "Database sistem: package.xml, userlist, dropbox"),
        ("anr", "DIR", None, "040775", "Laporan Application Not Responding (trace.txt)"),
        ("tombstones", "DIR", None, "040775", "Dump memori saat crash native (crash-* tombstone)"),
        ("log", "DIR", None, "040775", "Log persisten sistem dan radio"),
        ("package.xml", "FILE", 8192, "100644", "Manifest daftar paket terpasang (XML)"),
        ("userlist.xml", "FILE", 512, "100644", "Daftar pengguna sistem (XML)"),
    ],
    "pro": [
        ("bin", "DIR", None, "040775", "Utilitas proprietary vendor (binary executable)"),
        ("lib", "DIR", None, "040775", "Pustaka bersama proprietary (.so)"),
        ("app", "DIR", None, "040775", "Aplikasi sistem bawaan vendor (.apk)"),
        ("framework", "DIR", None, "040775", "Framework Java/Kotlin proprietary (.jar)"),
        ("overlay", "DIR", None, "040775", "Overlay RRO ganti resource sistem (.apk)"),
        ("build.prop", "FILE", 4096, "100644", "Properti build vendor (key=value)"),
        ("version.txt", "FILE", 64, "100644", "Versi firmware/ROM (teks)"),
    ],
    "media": [
        ("DCIM", "DIR", None, "040775", "Kamera: foto & video hasil tangkapan (jpg, mp4)"),
        ("Documents", "DIR", None, "040775", "Dokumen pengguna (pdf, docx)"),
        ("Download", "DIR", None, "040775", "Hasil unduhan peramban/aplikasi"),
        ("Music", "DIR", None, "040775", "Koleksi audio (mp3, flac)"),
        ("Pictures", "DIR", None, "040775", "Gambar/screenshot (png, webp)"),
        ("Video", "DIR", None, "040775", "Rekaman video (mkv, mp4)"),
        ("Ringtones", "DIR", None, "040775", "Nada dering sistem (ogg)"),
        ("Notifications", "DIR", None, "040775", "Suara notifikasi (ogg)"),
        ("Audiobooks", "DIR", None, "040775", "Buku audio (mp3)"),
    ],
    "acct": [
        ("u0_a89", "DIR", None, "040751", "Akun aplikasi UID 10089 (cgroup task per-app)"),
        ("u0_a112", "DIR", None, "040751", "Akun aplikasi UID 10112 (cgroup task per-app)"),
        ("system", "DIR", None, "040751", "Cgroup proses milik akun system"),
        ("root", "DIR", None, "040751", "Cgroup proses milik root"),
        ("readahead", "DIR", None, "040755", "Data prefetch boot (file biner readahead)"),
    ],
    "config": [
        ("network", "DIR", None, "040755", "Konfigurasi interface jaringan (interfaces, hosts)"),
        ("init", "DIR", None, "040755", "Skrip init stage awal (rc, teapot)"),
        ("sound", "DIR", None, "040755", "Konfigurasi mixer ALSA (conf)"),
        ("bluetooth", "DIR", None, "040755", "Pairing & cache bluetooth (db, conf)"),
        ("hosts", "FILE", 256, "100644", "Pemetaan nama host statis (teks)"),
        ("resolv.conf", "FILE", 128, "100644", "Resolver DNS (nameserver)"),
        ("fstab", "FILE", 1024, "100644", "Tabel mount filesystem (teks)"),
        ("locale.nod", "FILE", 64, "100644", "Setelan bahasa/lokal sistem (nod)"),
    ],
    "sys": [
        ("block", "DIR", None, "040755", "Perangkat blok: mmcblk/sda, size, queue"),
        ("class", "DIR", None, "040755", "Kelas driver perangkat (usb, net, power_supply)"),
        ("devices", "DIR", None, "040755", "Pohon perangkat keras tertanam (uevent)"),
        ("kernel", "DIR", None, "040755", "Info kernel: debug, mm, sched"),
        ("power", "DIR", None, "040755", "State suspend & wake (state, wakeup)"),
        ("fs", "DIR", None, "040755", "Statistik filesystem per mount"),
        ("module", "DIR", None, "040755", "Modul kernel termuat (ko, parameters)"),
        ("firmware", "DIR", None, "040755", "Firmware perangkat (bin)"),
        ("android", "DIR", None, "040755", "Node properti Android (debuggerd, rpc)"),
        ("busy", "FILE", 2, "100644", "Flag busy CPU (0/1)"),
        ("kernel_version", "FILE", 64, "100644", "Versi kernel Linux (teks)"),
    ],
    "system_ext": [
        ("bin", "DIR", None, "040775", "Executable tambahan OEM (ELF)"),
        ("etc", "DIR", None, "040755", "Konfigurasi sistem OEM (xml, rc)"),
        ("framework", "DIR", None, "040775", "Framework jar OEM"),
        ("lib", "DIR", None, "040775", "Pustaka 32-bit (.so)"),
        ("lib64", "DIR", None, "040775", "Pustaka 64-bit (.so)"),
        ("media", "DIR", None, "040755", "Aset media boot OEM"),
        ("priv-app", "DIR", None, "040775", "Aplikasi privat sistem OEM (.apk)"),
        ("build.prop", "FILE", 2048, "100644", "Properti partisi system_ext"),
        ("compatibility_matrix.xml", "FILE", 3072, "100644", "Matriks kompatibilitas VINTF (XML)"),
    ],
    "cache": [
        ("recovery", "DIR", None, "040775", "Log & marker OTA recovery (last_log)"),
        ("dalvik-cache", "DIR", None, "040775", "Hasil kompilasi dex → odex/vdex"),
        ("downloads", "DIR", None, "040775", "Cache unduhan sistem"),
        ("clockstats", "DIR", None, "040775", "Statistik waktu antar-boot"),
        ("usagestat.xml", "FILE", 1024, "100644", "Statistik pemakaian app (XML)"),
        ("packages.list", "FILE", 512, "100644", "Daftar paket + uid (TSV)"),
        ("bootprof", "FILE", 256, "100644", "Profil waktu boot (atrace)"),
    ],
}

EXTENSION_FUNCTION = {
    "APK": "Paket aplikasi Android (Java/Kotlin terdex)",
    "SO": "Pustaka bersama native ELF (C/C++)",
    "JAR": "Pustaka/framework Java",
    "XML": "Konfigurasi/manifest berbasis teks",
    "RC": "Skrip init service (Android init language)",
    "PROP": "Pasangan kunci=nilai properti",
    "TXT": "Teks biasa (log/laporan)",
    "DB": "Database SQLite",
    "CONF": "File konfigurasi teks",
    "BIN": "Data biner mentah",
    "IMG": "Image partisi/filesystem",
    "ODEX": "Hasil AOT dex teroptimasi",
    "VDEX": "Verifikasi dex compact",
    "MP4": "Video (H.264/HEVC)",
    "MKV": "Kontainer video Matroska",
    "JPG": "Foto terkompresi",
    "PNG": "Gambar lossless",
    "WEBP": "Gambar modern dari Google",
    "MP3": "Audio terkompresi",
    "FLAC": "Audio lossless",
    "OGG": "Audio Vorbis (nada dering)",
    "PDF": "Dokumen portabel",
    "DOCX": "Dokumen Word Office Open XML",
    "KO": "Modul kernel loadable",
    "LIST": "Daftar teks baris-per-item",
    "NODE": "Node setelan (ID-LOCALE)",
    "HOSTS": "Pemetaan IP ↔ hostname",
    "RESOLV": "Resolusi nameserver DNS",
    "FSTAB": "Tabel titik mount filesystem",
    "PROF": "Profil tracing/atrace",
    "LOG": "Log teks historis",
    "STATS": "Statistik biner",
    "TEAPOT": "Ekspansi init .rc",
    "UCONF": "Config micro-init",
    "E": "Marker placeholder repositori",
}


def ext_of(name: str) -> str:
    dot = name.rfind(".")
    return name[dot + 1 :].upper() if dot > 0 else ""


def function_for(name: str, fallback: str) -> str:
    e = ext_of(name)
    if e and e in EXTENSION_FUNCTION:
        return EXTENSION_FUNCTION[e]
    return fallback


# Isi sub-folder tingkat kedua: (nama, jenis, ukuran_byte, mode, fungsi)
SAMPLE_FILES: dict[str, list[tuple]] = {
    "local": [
        ("app_data.db", "FILE", 4096, "100644", "Database SQLite data aplikasi (.db)"),
        ("files.txt", "FILE", 128, "100644", "Indeks berkas pengguna (.txt)"),
        ("shared_prefs", "DIR", None, "040775", "Preferensi aplikasi XML per-pengguna"),
    ],
    "misc": [
        ("keystore.db", "FILE", 2048, "100644", "Keybox keystore (.db)"),
        ("profiles.dat", "FILE", 512, "100644", "Profil hardware (.dat)"),
    ],
    "system": [
        ("package.list", "FILE", 1024, "100644", "Daftar paket aktif (.list)"),
        ("uid_system.conf", "FILE", 256, "100644", "Konfigurasi UID sistem (.conf)"),
    ],
    "anr": [("trace.txt", "FILE", 8192, "100644", "Stack trace ANR (.txt)")],
    "tombstones": [("tombstone_00.bin", "FILE", 16384, "100644", "Crash dump native (.bin)")],
    "log": [
        ("system.log", "FILE", 4096, "100644", "Log sistem persisten (.log)"),
        ("radio.log", "FILE", 2048, "100644", "Log modem/radio (.log)"),
    ],
    "bin": [
        ("vendorcli.rc", "FILE", 512, "100644", "Definisi service vendor init (.rc)"),
        ("adsprpcd", "FILE", 32768, "100755", "Daemon ADSP RPC — executable ELF tanpa ekstensi"),
    ],
    "lib": [
        ("libvendor.so", "FILE", 65536, "100644", "Pustaka vendor (.so)"),
        ("libcamera.so", "FILE", 131072, "100644", "HAL kamera (.so)"),
    ],
    "app": [("VendorSettings.apk", "FILE", 2097152, "100644", "Aplikasi pengaturan vendor (.apk)")],
    "framework": [("vendor-framework.jar", "FILE", 524288, "100644", "API framework OEM (.jar)")],
    "overlay": [("ThemeOverlay.apk", "FILE", 65536, "100644", "Overlay tema RRO (.apk)")],
    "DCIM": [
        ("Camera", "DIR", None, "040775", "Folder hasil tangkapan kamera"),
        ("IMG_20261023.jpg", "FILE", 204800, "100644", "Foto kamera (.jpg)"),
        ("VID_20261023.mp4", "FILE", 1048576, "100644", "Video kamera (.mp4)"),
    ],
    "Documents": [
        ("laporan.pdf", "FILE", 81920, "100644", "Dokumen laporan (.pdf)"),
        ("catatan.docx", "FILE", 20480, "100644", "Dokumen Word (.docx)"),
    ],
    "Download": [("update.zip", "FILE", 4194304, "100644", "Paket unduhan arsip (.zip)")],
    "Music": [
        ("lagu.mp3", "FILE", 3145728, "100644", "Audio musik (.mp3)"),
        ("album.flac", "FILE", 8388608, "100644", "Audio lossless (.flac)"),
    ],
    "Pictures": [
        ("screenshot.png", "FILE", 102400, "100644", "Tangkapan layar (.png)"),
        ("banner.webp", "FILE", 40960, "100644", "Gambar web (.webp)"),
    ],
    "Video": [("film.mkv", "FILE", 8388608, "100644", "Video film (.mkv)")],
    "Ringtones": [("default.ogg", "FILE", 51200, "100644", "Nada dering (.ogg)")],
    "Notifications": [("notify.ogg", "FILE", 10240, "100644", "Suara notifikasi (.ogg)")],
    "Audiobooks": [("novel.mp3", "FILE", 5242880, "100644", "Buku audio (.mp3)")],
    "u0_a89": [("cgroup.procs", "FILE", 32, "100644", "Daftar PID proses akun (tanpa ekstensi, teks)")],
    "u0_a112": [("cgroup.procs", "FILE", 32, "100644", "Daftar PID proses akun (tanpa ekstensi, teks)")],
    "readahead": [("metadata.bin", "FILE", 8192, "100644", "Data prefetch boot (.bin)")],
    "network": [
        ("interfaces.conf", "FILE", 256, "100644", "Konfigurasi interface (.conf)"),
        ("wpa_supplicant.conf", "FILE", 512, "100644", "Konfigurasi WiFi (.conf)"),
    ],
    "init": [
        ("init.rc", "FILE", 4096, "100644", "Skrip init utama (.rc)"),
        ("ueventd.rc", "FILE", 1024, "100644", "Aturan node perangkat (.rc)"),
    ],
    "sound": [("alsa.conf", "FILE", 512, "100644", "Konfigurasi ALSA (.conf)")],
    "bluetooth": [("bluetooth.db", "FILE", 4096, "100644", "Perangkat paired (.db)")],
    "block": [("mmcblk0.size", "FILE", 8, "100644", "Ukuran eMMC dalam sektor (teks)")],
    "class": [("usb.uevent", "FILE", 64, "100644", "Event uevent perangkat USB (.uevent)")],
    "devices": [("cpu.uevent", "FILE", 128, "100644", "Identitas perangkat cpu (.uevent)")],
    "kernel": [("debug_mask", "FILE", 16, "100644", "Mask debug kernel (hex, tanpa ekstensi)")],
    "power": [("state", "FILE", 8, "100644", "Status suspend: mem/disk/on (tanpa ekstensi)")],
    "fs": [("filesystems", "FILE", 64, "100644", "Daftar filesystem terdukung (teks)")],
    "module": [("wl.ko", "FILE", 262144, "100644", "Modul kernel loadable (.ko)")],
    "firmware": [("fw_bcm4356.bin", "FILE", 65536, "100644", "Firmware WiFi (.bin)")],
    "android": [("rpc_control", "FILE", 16, "100644", "Node binder/rpc Android (tanpa ekstensi)")],
    "etc": [
        ("permissions.xml", "FILE", 2048, "100644", "Grant permission grup (.xml)"),
        ("vintf_fragments.xml", "FILE", 1024, "100644", "Fragmen VINTF (.xml)"),
    ],
    "media": [("bootanimation.zip", "FILE", 1048576, "100644", "Animasi boot (.zip)")],
    "lib64": [("libstagefright.so", "FILE", 1048576, "100644", "Media framework 64-bit (.so)")],
    "priv-app": [("SystemUI.apk", "FILE", 8388608, "100644", "UI sistem privat (.apk)")],
    "recovery": [("last_log.txt", "FILE", 4096, "100644", "Log recovery terakhir (.txt)")],
    "dalvik-cache": [
        ("services.jar@classes.odex", "FILE", 2097152, "100644", "Hasil AOT dex (.odex)"),
        ("services.jar@classes.vdex", "FILE", 524288, "100644", "Verifikasi dex (.vdex)"),
    ],
    "downloads": [("pending.dat", "FILE", 1024, "100644", "Unduhan tertunda (.dat)")],
    "clockstats": [("time_stats.bin", "FILE", 512, "100644", "Statistik waktu biner (.bin)")],
}


def walk(prefix: str, items: list[tuple], out: list[dict]) -> None:
    """Rekursif: setiap folder virtual/subfolder punya entri + fungsi; file punya ekstensi + fungsi."""
    for name, kind, size, mode, func in items:
        path = f"{prefix}/{name}" if prefix else name
        if kind == "DIR":
            out.append({"path": path, "type": "directory", "sha": "", "mode": mode or "040755",
                        "size": 0, "sizeKnown": True, "function": func})
            nested = SAMPLE_FILES.get(name)
            if nested:
                walk(path, nested, out)
        else:
            out.append({"path": path, "type": "file", "sha": "", "mode": mode or "100644",
                        "size": int(size or 0), "sizeKnown": True,
                        "function": func or function_for(name, "File sistem")})


def build_entries() -> list[dict]:
    entries: list[dict] = []
    for top, children in SYSTEM_TREE.items():
        entries.append({"path": top, "type": "directory", "sha": "", "mode": "040755",
                        "size": 0, "sizeKnown": True,
                        "function": f"Folder virtual root /{top} — manajemen terpusat struktur sistem"})
        walk(top, children, entries)
    entries.sort(key=lambda item: (item["type"] != "directory", item["path"].rsplit("/", 1)[-1].casefold(), item["path"]))
    return entries


def canonical_sha(payload: dict) -> str:
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def write_json(path: Path, payload: dict) -> str:
    import gzip
    payload["dataSha256"] = canonical_sha(payload)
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = (json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
    if path.suffix == ".gz":
        path.write_bytes(gzip.compress(raw, compresslevel=6, mtime=0))
    else:
        path.write_bytes(raw)
    return payload["dataSha256"]


def publish() -> dict:
    entries = build_entries()
    local_dir = TREE_ROOT / VFS_ID
    if local_dir.exists():
        shutil.rmtree(local_dir)
    local_dir.mkdir(parents=True, exist_ok=True)
    base_url = f"data/trees/{VFS_ID}"

    children: dict[str, list[dict]] = {"": []}
    for entry in entries:
        parent = entry["path"].rsplit("/", 1)[0] if "/" in entry["path"] else ""
        children.setdefault(parent, []).append(entry)
        if entry["type"] == "directory":
            children.setdefault(entry["path"], [])

    directories: dict[str, dict] = {}
    total_pages = 0
    for directory in sorted(children, key=lambda p: (p.count("/"), p.casefold(), p)):
        values = children[directory]
        page_refs = []
        for page_no, start in enumerate(range(0, len(values), PAGE_SIZE)):
            page_items = values[start:start + PAGE_SIZE]
            key = hashlib.sha256(f"vfs\0{directory}\0{page_no}".encode("utf-8")).hexdigest()[:32]
            relative = f"pages/{key}.json.gz"
            payload = {
                "schemaVersion": 1,
                "repository": "planetbintang/.SYSTEM",
                "path": directory,
                "page": page_no,
                "pageSize": PAGE_SIZE,
                "entryCount": len(page_items),
                "entries": page_items,
            }
            sha = write_json(local_dir / relative, payload)
            page_refs.append({"url": f"{base_url}/{relative}", "count": len(page_items), "sha256": sha})
            total_pages += 1
        directories[directory] = {"entryCount": len(values), "pages": page_refs}

    index_payload = {
        "schemaVersion": 1,
        "repository": "planetbintang/.SYSTEM",
        "branch": "main",
        "headSha": "",
        "treeSha": "",
        "state": "complete",
        "entryCount": len(entries),
        "fileCount": sum(1 for e in entries if e["type"] == "file"),
        "directoryCount": sum(1 for e in entries if e["type"] == "directory"),
        "submoduleCount": 0,
        "totalBytes": sum(int(e.get("size") or 0) for e in entries if e["type"] == "file"),
        "executableFileCount": 0,
        "sizeUnknownCount": 0,
        "redactedCount": 0,
        "fallbackUsed": False,
        "gitFallbackUsed": False,
        "virtual": True,
        "directories": directories,
    }
    index_sha = write_json(local_dir / "index.json", index_payload)
    return {"entries": len(entries), "pages": total_pages, "indexUrl": f"{base_url}/index.json", "indexSha256": index_sha}


if __name__ == "__main__":
    result = publish()
    print(json.dumps(result, indent=2))
    sys.exit(0)
