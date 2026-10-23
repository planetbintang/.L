#!/usr/bin/env python3
"""Data struktur root virtual sistem untuk File Manager repository `.L`.

Root virtual: /data /proc /sys /media /acct /pro /config /cache
Setiap folder = sub-URL File Manager (hash route `#fileManager/<folder>`).
Entri file berbentuk tuple: (nama, jenis, ukuran_byte, mode, fungsi, isi_kode)
`isi_kode` adalah source snippet ringkas sesuai nama/fungsi/ekstensi file —
dipublikasikan sebagai metadata edukatif di inspector File Manager.
"""
from __future__ import annotations

ROOT_ORDER = ["data", "proc", "sys", "media", "acct", "pro", "config", "cache"]

ROOT_META: dict[str, dict] = {
    "data": {
        "title": "/data — Data Aplikasi & Sistem Persisten",
        "desc": "Manajemen terpusat partisi data pengguna: profil per-UID, database sistem, log persisten.",
        "sub_url": "#fileManager/data",
    },
    "proc": {
        "title": "/proc — Procfs Proses Kernel",
        "desc": "Tampilan virtual proses/CPU/memori; node dibaca langsung dari kernel saat runtime.",
        "sub_url": "#fileManager/proc",
    },
    "sys": {
        "title": "/sys — Sysfs Perangkat & Kernel",
        "desc": "Pohon perangkat keras, kelas driver, modul kernel, dan firmware dalam bentuk node sysfs.",
        "sub_url": "#fileManager/sys",
    },
    "media": {
        "title": "/media — Penyimpanan Pengguna",
        "desc": "Folder media standar (DCIM, Documents, Music, Pictures, Video) dengan file contoh tiap ekstensi.",
        "sub_url": "#fileManager/media",
    },
    "acct": {
        "title": "/acct — Cgroup Akun Proses",
        "desc": "Kontrol kelompok per-UID (task_profiles, cgroup.procs) untuk pembatasan resource aplikasi.",
        "sub_url": "#fileManager/acct",
    },
    "pro": {
        "title": "/pro — Partisi Proprietary Vendor",
        "desc": "Biner, pustaka .so, aplikasi, framework, dan overlay bawaan vendor/OEM.",
        "sub_url": "#fileManager/pro",
    },
    "config": {
        "title": "/config — Konfigurasi Sistem",
        "desc": "Skrip init, jaringan, sound, bluetooth, dan fstab dalam format konfigurasi teks.",
        "sub_url": "#fileManager/config",
    },
    "cache": {
        "title": "/cache — Cache Sistem & AOT",
        "desc": "Dalvik-cache hasil kompilasi dex, marker recovery OTA, dan statistik pemakaian.",
        "sub_url": "#fileManager/cache",
    },
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
    "WEBP": "Gambar web modern",
    "MP3": "Audio terkompresi",
    "FLAC": "Audio lossless",
    "OGG": "Audio Vorbis (nada dering)",
    "PDF": "Dokumen portabel",
    "DOCX": "Dokumen Word Office Open XML",
    "KO": "Modul kernel loadable",
    "LIST": "Daftar teks baris-per-item",
    "ZIP": "Arsip terkompresi",
    "DAT": "Data terstruktur biner/teks",
    "LOG": "Log teks historis",
    "SH": "Skrip shell POSIX",
    "MAP": "Peta memori proses (hex maps)",
    "STATUS": "Status proses /proc (key: value)",
    "CMDLINE": "Baris perintah eksekusi proses",
    "STAT": "Statistik scheduler proses",
    "LIMITS": "Batas resource ulimit proses",
    "CPUINFO": "Informasi CPU (arsitektur, core, MHz)",
    "MEMINFO": "Statistik memori fisik kernel",
    "MTIME": "Timestamp modifikasi (epoch)",
    "DRIVERS": "Daftar driver aktif per bus",
    "ENABLED": "Flag enable/disable device tree",
    "UEVENT": "Event uevent perangkat",
    "PROCS": "Daftar PID dalam cgroup",
    "PROFILE": "Profil task/cgroup (cpuset/cpu/io)",
    "CTL": "Kontrol atribut IPC kernel (sysctl)",
    "HOSTS": "Pemetaan IP ↔ hostname",
    "RESOLV": "Resolusi nameserver DNS",
    "FSTAB": "Tabel titik mount filesystem",
    "TEAPOT": "Ekspansi init .rc",
    "E": "Marker placeholder repositori",
}

# Root virtual: 8 folder yang diminta, tiap folder punya subfolder khas sistem + file berkode.
SYSTEM_TREE: dict[str, list[tuple]] = {
    "data": [
        ("local", "DIR", None, "040775", "Data aplikasi per-pengguna (files, shared_prefs)", ""),
        ("misc", "DIR", None, "040775", "Data campuran layanan: keystore, waktu, profil", ""),
        ("system", "DIR", None, "040775", "Database sistem: packages, users, dropbox", ""),
        ("anr", "DIR", None, "040775", "Laporan Application Not Responding", ""),
        ("tombstones", "DIR", None, "040775", "Dump memori crash native", ""),
        ("log", "DIR", None, "040775", "Log persisten sistem dan radio", ""),
        ("package.xml", "FILE", 8192, "100644", "Manifest daftar paket terpasang (XML)",
         '<?xml version="1.0" encoding="utf-8"?>\n'
         '<packages version="1">\n'
         '  <pkg name="com.android.settings" codePath="/system/priv-app/Settings"\n'
         '      primaryCpuAbi="arm64-v8a" versionCode="34" versionName="14"/>\n'
         '  <pkg name="com.planetbintang.files" codePath="/data/app/PlanetFiles"/>\n'
         '</packages>\n'),
        ("userlist.xml", "FILE", 512, "100644", "Daftar pengguna sistem (XML)",
         '<?xml version="1.0" encoding="utf-8"?>\n'
         '<users nextSerialNumber="11" version="7">\n'
         '  <user id="0" name="System" serialNumber="0" flags="ADMIN"/>  \n'
         '  <user id="10" name="Owner" serialNumber="10" flags="OWNER,ADMIN"/>\n'
         '</users>\n'),
    ],
    "proc": [
        ("1", "DIR", None, "040755", "Direktori proses init (PID 1) — cmdline, status, maps", ""),
        ("2", "DIR", None, "040755", "Thread kernel kthreadd (PID 2)", ""),
        ("bus", "DIR", None, "040755", "Info bus perangkat (usb, pci)", ""),
        ("fs", "DIR", None, "040755", "Statistik filesystem (mounts, filesystems)", ""),
        ("irq", "DIR", None, "040755", "Statistik interupsi per-CPU", ""),
        ("net", "DIR", None, "040755", "Info jaringan: tcp, dev, route", ""),
        ("sysvipc", "DIR", None, "040755", "Semaphore/shm/msgqueue IPC aktif", ""),
        ("cmdline", "FILE", 128, "100644", "Baris perintah boot kernel",
         '/init second_stage androidboot.hardware=qcom androidboot.serialno=PB1024 selinux=1\n'),
        ("cpuinfo", "FILE", 2048, "100644", "Daftar core & arsitektur CPU",
         'Processor       : AArch64 Processor rev 14 (aarch64)\nprocessor 0-3 : Cortex-A55 @ 1800MHz\n'
         'processor 4-6   : Cortex-A76 @ 2400MHz\nprocessor 7       : Cortex-X1 @ 2841MHz\nFeatures        : fp asimd aes sha1 sha2 crc32\n'),
        ("meminfo", "FILE", 1024, "100644", "Statistik penggunaan RAM kernel",
         'MemTotal:       11812340 kB\nMemFree:           921452 kB\nMemAvailable:     5231904 kB\n'
         'Buffers:          131072 kB\nCached:            3145728 kB\nSlab:              512000 kB\n'),
        ("stat", "FILE", 512, "100644", "Ringkasan scheduler & uptime",
         'cpu  12045 230 9841 882310 4120 120 90 0 0 0\nintr 128450230 ...\nctxt 98412345\nbtime 1730000000\nprocesses 41280\n'),
        ("uptime", "FILE", 32, "100644", "Waktu aktif sistem (detik idle)", "12345.67 8901.23\n"),
        ("version", "FILE", 96, "100644", "Versi kernel Linux",
         'Linux version 5.10.198-android12-9 (builder@planetbintang) #1 SMP PREEMPT\n'),
        ("filesystems", "FILE", 128, "100644", "Daemon pemantau fs (fuse, nfsd)",
         '# /proc/filesystems diisi kernel; daemon fuse/nfsd terdaftar bila modul termuat\nnodev\tsysfs\nnodev\tproc\next4\nf2fs\n'),
        ("kmsg", "FILE", 4096, "100644", "Buffer pesan kernel (printk)",
         '[    0.000000] Booting Linux on physical CPU 0x0000000000\n[    0.145000] printk: console [ttyMSM0] enabled\n'),
        ("partitions", "FILE", 256, "100644", "Tabel partisi blok",
         'major minor  #blocks  name\n 179        0 123486208 mmcblk0\n 179        1     65536 mmcblk0p1 boot\n'),
        ("selfstatus", "DIR", None, "040755", "Salinan node /proc/self (exe, cwd)", ""),
    ],
    "sys": [
        ("block", "DIR", None, "040755", "Perangkat blok: mmcblk0/sda, queue, range", ""),
        ("class", "DIR", None, "040755", "Kelas driver: usb, net, power_supply, graphics", ""),
        ("devices", "DIR", None, "040755", "Pohon perangkat tertanam (soc, platform)", ""),
        ("kernel", "DIR", None, "040755", "Info kernel: debug, mm, sched, uidmap", ""),
        ("power", "DIR", None, "040755", "State suspend & wake sources", ""),
        ("fs", "DIR", None, "040755", "Statistik filesystem per mountpoint", ""),
        ("module", "DIR", None, "040755", "Modul kernel termuat + parameters", ""),
        ("firmware", "DIR", None, "040755", "Firmware perangkat (bios, memmap)", ""),
        ("android", "DIR", None, "040755", "Node binder/rpc & property Android", ""),
        ("busy", "FILE", 2, "100644", "Flag busy CPU (0/1)", "0\n"),
        ("kernel_version", "FILE", 64, "100644", "Versi kernel (teks)", "5.10.198-android12-9\n"),
    ],
    "media": [
        ("DCIM", "DIR", None, "040775", "Kamera: foto & video hasil tangkapan", ""),
        ("Documents", "DIR", None, "040775", "Dokumen pengguna (pdf, docx)", ""),
        ("Download", "DIR", None, "040775", "Hasil unduhan peramban/aplikasi", ""),
        ("Music", "DIR", None, "040775", "Koleksi audio (mp3, flac)", ""),
        ("Pictures", "DIR", None, "040775", "Gambar/screenshot (png, webp)", ""),
        ("Video", "DIR", None, "040775", "Rekaman video (mkv, mp4)", ""),
        ("Ringtones", "DIR", None, "040775", "Nada dering sistem (ogg)", ""),
        ("Notifications", "DIR", None, "040775", "Suara notifikasi (ogg)", ""),
        ("Audiobooks", "DIR", None, "040775", "Buku audio (mp3)", ""),
    ],
    "acct": [
        ("u0_a89", "DIR", None, "040751", "Cgroup UID 10089 (com.planetbintang.files)", ""),
        ("u0_a112", "DIR", None, "040751", "Cgroup UID 10112 (com.vendor.camera)", ""),
        ("system", "DIR", None, "040751", "Cgroup proses milik akun system", ""),
        ("root", "DIR", None, "040751", "Cgroup proses milik root", ""),
        ("readahead", "DIR", None, "040755", "Data prefetch boot", ""),
    ],
    "pro": [
        ("bin", "DIR", None, "040775", "Utilitas proprietary vendor (ELF)", ""),
        ("lib", "DIR", None, "040775", "Pustaka bersama proprietary (.so)", ""),
        ("app", "DIR", None, "040775", "Aplikasi sistem bawaan vendor (.apk)", ""),
        ("framework", "DIR", None, "040775", "Framework Java OEM (.jar)", ""),
        ("overlay", "DIR", None, "040775", "Overlay RRO resource sistem (.apk)", ""),
        ("build.prop", "FILE", 4096, "100644", "Properti build vendor (key=value)",
         'ro.product.vendor.brand=Planetbintang\nro.product.vendor.model=PB-Root\n'
         'ro.build.version.sdk=34\nvendor.display.enable_default_color_mode=1\n'),
        ("version.txt", "FILE", 64, "100644", "Versi firmware/ROM", "PB-ROOT v2.1.0 (2026-10-23) release-keys\n"),
    ],
    "config": [
        ("network", "DIR", None, "040755", "Konfigurasi interface jaringan", ""),
        ("init", "DIR", None, "040755", "Skrip init stage awal (rc, teapot)", ""),
        ("sound", "DIR", None, "040755", "Konfigurasi mixer ALSA", ""),
        ("bluetooth", "DIR", None, "040755", "Pairing & cache bluetooth", ""),
        ("hosts", "FILE", 256, "100644", "Pemetaan nama host statis",
         '127.0.0.1\tlocalhost\n::1\tlocalhost\n192.168.4.1\tplanetbintang.ap\n'),
        ("resolv.conf", "FILE", 128, "100644", "Resolver DNS", "nameserver 8.8.8.8\nnameserver 1.1.1.1\noptions timeout:2 attempts:3\n"),
        ("fstab", "FILE", 1024, "100644", "Tabel mount filesystem",
         '/dev/block/by-name/system  /  ext4  ro,barrier=1  0 0\n/dev/block/by-name/data  /data  f2fs  rw,noatime  0 0\n'),
        ("locale.nod", "FILE", 64, "100644", "Setelan bahasa/lokal sistem", "ID-id\nUTF-8\n"),
    ],
    "cache": [
        ("recovery", "DIR", None, "040775", "Log & marker OTA recovery", ""),
        ("dalvik-cache", "DIR", None, "040775", "Hasil kompilasi dex → odex/vdex", ""),
        ("downloads", "DIR", None, "040775", "Cache unduhan sistem", ""),
        ("clockstats", "DIR", None, "040775", "Statistik waktu antar-boot", ""),
        ("usagestat.xml", "FILE", 1024, "100644", "Statistik pemakaian app (XML)",
         '<?xml version="1.0" encoding="utf-8"?>\n<usagestats version="1" endTime="3600">\n'
         '  <container pkg="com.planetbintang.files" lastTimeUsed="3500" totalTimeForeground="120000"/>\n</usagestats>\n'),
        ("packages.list", "FILE", 512, "100644", "Daftar paket + uid (TSV)",
         'com.android.settings|1000|0|/data/system|3003\ncom.planetbintang.files|10089|10089|/data/data/com.planetbintang.files|3003\n'),
        ("bootprof", "FILE", 256, "100644", "Profil waktu boot (atrace)",
         '----- atrace tags: sched freq idle am wm gfx view -----\ntracing_mark_write: B|1|boot\n'),
    ],
}

# Isi sub-folder tingkat kedua (termasuk recursif lewat nama bertingkat):
# (nama, jenis, ukuran_byte, mode, fungsi, isi_kode)
SAMPLE_FILES: dict[str, list[tuple]] = {
    # ---- /data ----
    "local": [
        ("app_data.db", "FILE", 4096, "100644", "Database SQLite data aplikasi (.db)",
         "-- skema tabel app_data (SQLite)\nCREATE TABLE records(id INTEGER PRIMARY KEY, path TEXT, size INTEGER);\n"
         "INSERT INTO records VALUES(1,'/data/local/files.txt',128);\n"),
        ("files.txt", "FILE", 128, "100644", "Indeks berkas pengguna (.txt)",
         "/data/local/tmp/update.zip 4194304 staged\n/sdcard/Download/report.pdf 81920 indexed\n"),
        ("shared_prefs", "DIR", None, "040775", "Preferensi aplikasi XML per-pengguna", ""),
    ],
    "data/local/shared_prefs": [
        ("prefs.xml", "FILE", 256, "100644", "Preferensi aplikasi (SharedPreferences)",
         '<?xml version=\'1.0\' encoding=\'utf-8\' standalone=\'yes\' ?>\n<map>\n'
         '  <boolean name="dark_mode" value="true"/>\n  <int name="launch_count" value="42"/>\n</map>\n'),
    ],
    "misc": [
        ("keystore.db", "FILE", 2048, "100644", "Keybox keystore (.db)",
         "-- SQLite key metadata (materi kunci tidak diterbitkan)\nCREATE TABLE keys(alias TEXT, algorithm TEXT, created INT);\n"),
        ("profiles.dat", "FILE", 512, "100644", "Profil hardware (.dat)",
         'HW_PROFILE=PB-ROOT-A\nCALIBRATION=0x1F4C\nSENSOR_GAIN=1.04\n'),
        ("time", "FILE", 16, "100644", "Epoch waktu terakhir shutdown", "1761220800\n"),
    ],
    "system": [
        ("package.list", "FILE", 1024, "100644", "Daftar paket aktif (.list)",
         'com.android.settings 1000 system\ncom.planetbintang.files 10089 data\n'),
        ("uid_system.conf", "FILE", 256, "100644", "Konfigurasi UID sistem (.conf)",
         'system_uid=1000\nshell_uid=2000\ncache_uid=2001\n'),
    ],
    "anr": [("trace.txt", "FILE", 8192, "100644", "Stack trace ANR (.txt)",
             '"main" prio=5 tid=1 Blocked\n  | held mutexes=\n  at com.planetbintang.files.Index.load(Index.java:84)\n')],
    "tombstones": [("tombstone_00.bin", "FILE", 16384, "100644", "Crash dump native (.bin)",
                    "*** *** *** tombstone *** *** ***\npid: 1234, tid: 1240, name: RenderThread >>> /pro/bin/hwcomposer <<<\nsignal 11 (SIGSEGV), si_addr 0x0\n")],
    "log": [
        ("system.log", "FILE", 4096, "100644", "Log sistem persisten (.log)",
         '10-23 04:17:01.204  1000  1234 I ActivityManager: Start proc com.planetbintang.files\n'),
        ("radio.log", "FILE", 2048, "100644", "Log modem/radio (.log)", 'RIL [UNSLIC]: signalStrength=-95 dBm\n'),
    ],
    # ---- /proc ----
    "proc/1": [
        ("cmdline", "FILE", 64, "100644", "Perintah proses init", "/init\0second_stage\0"),
        ("status", "FILE", 512, "100644", "Status proses (name/Pid/State/VmRSS)",
         "Name:\tinit\nState: S (sleeping)\nTgid: 1\nPid:  1\nUid:\t0\t0\t0\t0\nVmRSS: 8192 kB\nThreads: 4\n"),
        ("maps", "FILE", 2048, "100644", "Peta memori virtual proses",
         "55a0000000-55a0040000 r-xp 00000000 b3:05 131 /system/bin/init\n7f00000000-7f00100000 rw-p 00000000 00:00 0 [stack]\n"),
        ("limits", "FILE", 256, "100644", "Batas resource proses",
         "Limit                     Soft Limit Hard Limit Units\nMax open files            32768    32768     files\n"),
        ("oom_score_adj", "FILE", 4, "100644", "Prioritas OOM killer", "-1000\n"),
    ],
    "proc/2": [
        ("cmdline", "FILE", 16, "100644", "Thread kernel (kosong = kthread)", "\0"),
        ("stat", "FILE", 128, "100644", "Statistik scheduler thread", "2 (kthreadd) S 0 2 0 0 -1 217578240 0 0 0 0 0 0 0 0 20 0 1 0 0\n"),
    ],
    "proc/bus": [("usb/devices", "FILE", 256, "100644", "Perangkat USB terpasang",
                  'T: Bus=01 Lev=00 Prnt=00 Num=01 MxCh=00 D= 2.00 Spd=480 MxPower=0\nI: Vendor=2e04 ProdId=c001 Manufacturer=Planetbintang\n')],
    "proc/fs": [
        ("mounts", "FILE", 512, "100644", "Mount aktif (format fstab dinamis)",
         "/dev/root / erofs ro,seclabel 0 0\n/dev/block/mmcblk0p12 /data f2fs rw 0 0\ntmpfs /tmp tmpfs rw 0 0\n"),
        ("filesystems", "FILE", 128, "100644", "Fs terdukung kernel", "nodev sysfs\nnodev proc\next4\nf2fs\nerofs\n"),
    ],
    "proc/irq": [("default_smp_affinity", "FILE", 16, "100644", "Afinity IRQ default", "ff\n")],
    "proc/net": [
        ("tcp", "FILE", 512, "100644", "Socket TCP aktif (hex)",
         "sl local_address rem_address st tx_queue rx_queue ...\n0: 0100007F:1F90 00000000:0000 0A 00000000:00000000\n"),
        ("dev", "FILE", 256, "100644", "Statistik antarmuka jaringan",
         "Inter-|   Receive ...\n face |bytes packets errs lo fifo ...\n wlan0: 1048576 8192 0 0 0 ...\n"),
        ("route", "FILE", 128, "100644", "Tabel routing IPv4", "default via 192.168.4.1 dev wlan0 proto dhcp src 192.168.4.30\n"),
    ],
    "proc/sysvipc": [("shm", "FILE", 128, "100644", "Shared memory segment", "key shmid perms size cpid lpid natt attach time\n0x00000000 321 660 4096 1000 1000 1 ...")],
    "proc/selfstatus": [
        ("exe", "FILE", 0, "120777", "Symlink binari proses berjalan", "/system/bin/sh\n"),
        ("cwd", "FILE", 0, "120777", "Symlink direktori kerja saat ini", "/\n"),
    ],
    # ---- /sys ----
    "sys/block": [
        ("mmcblk0/range", "FILE", 16, "100644", "Rentang sektor partisi", "0 123486208\n"),
        ("mmcblk0/size", "FILE", 16, "100644", "Ukuran blok dalam sektor", "123486208\n"),
        ("mmcblk0/queue/rotational", "FILE", 2, "100644", "Flag cakram berputar", "0\n"),
    ],
    "sys/class": [
        ("usb/uevent", "FILE", 64, "100644", "Event uevent bus USB", "MAJOR=189\nMINOR=0\nDEVNAME=bus/usb/001\nDEVTYPE=usb_device\n"),
        ("net/wlan0/address", "FILE", 18, "100644", "MAC address interface", "aa:bb:cc:dd:ee:ff\n"),
        ("power_supply/battery/status", "FILE", 8, "100644", "Status charger", "Charging\n"),
    ],
    "sys/devices": [
        ("cpu/uevent", "FILE", 128, "100644", "Identitas perangkat cpu", "OF_NAME=cpu\nOF_FULLNAME=/cpu\ncompatible=arm,cortex-a55\n"),
        ("soc/dt_status", "FILE", 8, "100644", "Status node device-tree", "okay\n"),
    ],
    "sys/kernel": [
        ("debug_mask", "FILE", 16, "100644", "Mask debug kernel (hex)", "0x00000080\n"),
        ("mm/totalram_pages", "FILE", 16, "100644", "Jumlah halaman RAM", "2953085\n"),
        ("sched/sched_debug", "FILE", 1024, "100644", "Debug scheduler per-runqueue", ".nr_running 4 .load 1024 .rt_nr_running 0\n"),
    ],
    "sys/power": [("state", "FILE", 8, "100644", "Mode suspend (mem/disk/on)", "mem\n"),
                   ("wakeup_count", "FILE", 8, "100644", "Penghitung wake source", "12\n")],
    "sys/fs": [("cgroup", "DIR", None, "040755", "Hierarki controller cgroup v2", "")],
    "sys/fs/cgroup": [("cgroup.controllers", "FILE", 64, "100644", "Controller tersedia", "cpuset cpu io memory pids\n")],
    "sys/module": [
        ("wl/parameters/debug", "FILE", 8, "100644", "Parameter debug modul wl", "0\n"),
        ("wl/version", "FILE", 32, "100644", "Versi modul kernel", "7.84.10\n"),
    ],
    "sys/firmware": [("fw_bcm4356.bin", "FILE", 65536, "100644", "Firmware WiFi (.bin)",
                      "\\x02\\x40\\x00\\x00 BCM4356 ag ab ac n i u r c e x X yz 1149 L2 20260101\n")],
    "sys/android": [("rpc_control", "FILE", 16, "100644", "Node binder/rpc Android", "binder\n")],
    # ---- /media ----
    "DCIM": [
        ("Camera", "DIR", None, "040775", "Folder hasil tangkapan kamera", ""),
        ("photo_index.txt", "FILE", 256, "100644", "Indeks media scanner (.txt)",
         "IMG_20261023_041700.jpg 204800 image/jpeg\nVID_20261023_041810.mp4 1048576 video/mp4\n"),
    ],
    "media/DCIM/Camera": [
        ("IMG_20261023.jpg", "FILE", 204800, "100644", "Foto kamera (.jpg)", "Exif JPEG: 4032x3024 Planetbintang PB-Cam ISO100 f/1.8\n"),
        ("VID_20261023.mp4", "FILE", 1048576, "100644", "Video kamera (.mp4)", "ftypisom moov(mvhd timescale=1000 duration=12000) mdat\n"),
    ],
    "Documents": [
        ("laporan.pdf", "FILE", 81920, "100644", "Dokumen laporan (.pdf)", "%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n"),
        ("catatan.docx", "FILE", 20480, "100644", "Dokumen Word (.docx)", "[Content_Types].xml word/document.xml (OOXML zip)"),
    ],
    "Download": [("update.zip", "FILE", 4194304, "100644", "Paket unduhan arsip (.zip)", "PK\x03\x04 META-INF/com/google/android/updater-script\n")],
    "Music": [
        ("lagu.mp3", "FILE", 3145728, "100644", "Audio musik (.mp3)", "ID3v2.4 TIT2=Planet Anthem TPE1=PB Studio\n"),
        ("album.flac", "FILE", 8388608, "100644", "Audio lossless (.flac)", "fLaC STREAMINFO minblk=4096 maxblk=4096 samplerate=44100 channels=2\n"),
    ],
    "Pictures": [
        ("screenshot.png", "FILE", 102400, "100644", "Tangkapan layar (.png)", "\x89PNG IHDR 1080x2400 bitdepth=8 IDAT...\n"),
        ("banner.webp", "FILE", 40960, "100644", "Gambar web (.webp)", "RIFF....WEBPVP8 ....\n"),
    ],
    "Video": [("film.mkv", "FILE", 8388608, "100644", "Video film (.mkv)", "\x1aE\xdf\xa3(EbmlHeader matroska DocTypeVersion=4\n")],
    "Ringtones": [("default.ogg", "FILE", 51200, "100644", "Nada dering (.ogg)", "OggS 0 serial=PB1234 vorbis ident rate=48000\n")],
    "Notifications": [("notify.ogg", "FILE", 10240, "100644", "Suara notifikasi (.ogg)", "OggS 0 vorbis comment title=Ping\n")],
    "Audiobooks": [("novel.mp3", "FILE", 5242880, "100644", "Buku audio (.mp3)", "ID3v2.3 TIT2=Novel Bab 1 TALB=Audiobook PB\n")],
    # ---- /acct ----
    "u0_a89": [
        ("cgroup.procs", "FILE", 32, "100644", "Daftar PID proses akun", "4210\n4211\n4230\n"),
        ("task_profiles", "FILE", 64, "100644", "Profil task per-kelas (cpuset/cpu/io)",
         "WriteRuntimeDefault Foreground CapacityLow MemoryEnabled\n"),
        ("cpuset/cpuset.cpus", "FILE", 16, "100644", "Core CPU yang boleh dipakai", "0-3\n"),
    ],
    "u0_a112": [
        ("cgroup.procs", "FILE", 32, "100644", "Daftar PID proses akun", "3105\n"),
        ("cpu/cpu.cfs_quota_us", "FILE", 8, "100644", "Kuota CPU cfs (us/period)", "200000\n"),
    ],
    "acct/system": [
        ("cgroup.procs", "FILE", 64, "100644", "PID proses akun system", "1200\n1201\n1240\n"),
        ("memory/memory.limit_in_bytes", "FILE", 16, "100644", "Batas memori cgroup", "536870912\n"),
    ],
    "acct/root": [("cgroup.procs", "FILE", 32, "100644", "PID proses root", "1\n2\n")],
    "readahead": [("metadata.bin", "FILE", 8192, "100644", "Data prefetch boot (.bin)", "READAHEAD v1 entries=128 paths=/system/framework/*\n")],
    # ---- /pro ----
    "bin": [
        ("vendorcli.rc", "FILE", 512, "100644", "Definisi service vendor init (.rc)",
         'service vendor.cli /pro/bin/vendorcli\n    class main\n    user vendor\n    group camera\n    seclabel u:r:vendorcli:s0\n'),
        ("adsprpcd", "FILE", 32768, "100755", "Daemon ADSP RPC — executable ELF tanpa ekstensi",
         '\x7fELF 64-bit LSB pie executable ARM aarch64 interpreter /system/bin/linker64\nint main(void){ return adsp_rpc_loop(); }\n'),
    ],
    "lib": [
        ("libvendor.so", "FILE", 65536, "100644", "Pustaka vendor (.so)",
         '// libvendor.c — sumber contoh sesuai nama folder /pro/lib\n#include <dlfcn.h>\nint pb_vendor_init(void){ return 0; }\n'),
        ("libcamera.so", "FILE", 131072, "100644", "HAL kamera (.so)",
         '// camera_hal.c\nstatic const struct hw_module_t HAL_MODULE_INFO_SYM = {\n  .id = CAMERA_HARDWARE_MODULE_ID,\n};\n'),
    ],
    "app": [("VendorSettings.apk", "FILE", 2097152, "100644", "Aplikasi pengaturan vendor (.apk)",
             "AndroidManifest.xml: package=com.vendor.settings uses-permission=CAMERA\nclasses.dex (terdex, tidak diekstrak)\n")],
    "framework": [("vendor-framework.jar", "FILE", 524288, "100644", "API framework OEM (.jar)",
                   "// VendorManager.java\npackage com.vendor;\npublic final class VendorManager {\n  public static int getVersion(){ return 210; }\n}\n")],
    "overlay": [("ThemeOverlay.apk", "FILE", 65536, "100644", "Overlay tema RRO (.apk)",
                 "<!-- RRO AndroidManifest --> <overlay targetPackage=\"android\" priority=\"1\"/> res/values/config.xml\n")],
    # ---- /config ----
    "network": [
        ("interfaces.conf", "FILE", 256, "100644", "Konfigurasi interface (.conf)",
         "auto lo\niface lo inet loopback\nauto wlan0\niface wlan0 inet dhcp\n  dns-nameservers 8.8.8.8 1.1.1.1\n"),
        ("wpa_supplicant.conf", "FILE", 512, "100644", "Konfigurasi WiFi (.conf)",
         'ctrl_interface=/var/run/wpa_supplicant\nnetwork={\n  ssid="planetbintang"\n  key_mgmt=WPA-PSK\n  # psk disembunyikan\n}\n'),
    ],
    "init": [
        ("init.rc", "FILE", 4096, "100644", "Skrip init utama (.rc)",
         'on early-init\n    mount rootfs rootfs / ro relatime\non post-fs-data\n    mkdir /data/local 0771 shell shell\n'),
        ("ueventd.rc", "FILE", 1024, "100644", "Aturan node perangkat (.rc)",
         '/dev/ttyMSM0        0600   system     system\n/dev/block/mmcblk0    0660   root       disk\n'),
    ],
    "sound": [("alsa.conf", "FILE", 512, "100644", "Konfigurasi ALSA (.conf)",
               'defaults.pcm.card 0\ndefs.pcm.device 0\ncmps.pcm.rate_constraint "44100,48000,96000"\n')],
    "bluetooth": [("bluetooth.db", "FILE", 4096, "100644", "Perangkat paired (.db)",
                   'CREATE TABLE devices(addr TEXT PRIMARY KEY, name TEXT, trusted INT);\nINSERT INTO devices VALUES("AA:BB:CC:DD:EE:FF","PB-Buds",1);\n')],
    # ---- /cache ----
    "recovery": [
        ("last_log.txt", "FILE", 4096, "100644", "Log recovery terakhir (.txt)",
         "Starting recovery (2026-10-23)... applying patch PB-2.1.0\nInstall from A/B complete.\n"),
        ("command", "FILE", 32, "100644", "Perintah tahap berikutnya recovery", "--update_package=/cache/update.zip\n"),
    ],
    "dalvik-cache": [
        ("services.jar@classes.odex", "FILE", 2097152, "100644", "Hasil AOT dex (.odex)",
         "ODEX magic: dex\n035 | header_size=0x70 endian=0x6c6ecdc0\n"),
        ("services.jar@classes.vdex", "FILE", 524288, "100644", "Verifikasi dex (.vdex)", "VDEX magic vdex\x06 quickened dex files embedded\n"),
    ],
    "downloads": [("pending.dat", "FILE", 1024, "100644", "Unduhan tertunda (.dat)",
                   'id,url,state,total\n1,https://planetbintang.github.io/.L/update.zip,paused,4194304\n')],
    "clockstats": [("time_stats.bin", "FILE", 512, "100644", "Statistik waktu biner (.bin)",
                    '{"boot_ms":18342,"suspend_ms":90211,"awake_ratio":0.18}\n')],

    # ---- konten tambahan sub-folder tingkat dua ----
    "sys/block": [("mmcblk0", "DIR", None, "040755", "Perangkat eMMC utama (range, size, queue)", "")],
    "sys/class/usb": [("001", "DIR", None, "040755", "Device USB terpasang", "")],
    "sys/devices/cpu": [("online", "FILE", 8, "100644", "Core CPU online", "0-7\n")],
    "sys/kernel/mm": [("swap", "DIR", None, "040755", "Statistik area swap", "")],
    "sys/power/suspend_stats": [("failed", "FILE", 4, "100644", "Gagal suspend terakhir", "0\n")],
    "sys/module/wl": [("parameters", "DIR", None, "040755", "Parameter modul wl", "")],
    "acct/u0_a89/cpuset": [("cpuset.mems", "FILE", 8, "100644", "Node memori yang diizinkan", "0\n")],
    "config/init": [("teapot.rc", "FILE", 256, "100644", "Ekspansi init stage dua (.rc)",
                     'on property:sys.boot_completed=1\n    start vendor.teapot\n')],
    "cache/recovery": [("last_kmsg", "FILE", 2048, "100644", "Kmsg saat recovery (.log-free text)",
                       '[recovery] applying package update...\n')],
}
