# Desktop OS Menu Center

Katalog website-mode berisi **15.000 entri menu virtual** yang dibuat dari template deterministik dan di-render bertahap (50 entri per halaman) agar tidak membebani DOM.

Setiap entri mempunyai:
- **Tampilan** — panel situs responsif.
- **Fungsi sistem** — peran menu dalam kategori desktop OS.
- **Integrasi menu** — relasi ke registry, File Manager, navigasi, atau workspace.
- **Data** — lingkup data yang dikelola.
- **Data otomatis tersimpan** — favorit, pin, dan aktivitas disimpan di localStorage browser.
- **Mode aktivitas** — status aktivitas untuk konteks menu.

Data lokal dapat diekspor dari antarmuka. Penyimpanan bersifat per-browser/perangkat dan bukan sinkronisasi server. Fungsi yang memerlukan OS native, backend, DNS, layanan eksternal, atau proses latar tidak dianggap aktif hanya karena menu tercatat. Untuk menambahkan integrasi nyata, hubungkan entri ke rute yang sudah ada dan implementasikan handler pada modul terkait.

API browser: `window.PBDesktopOSMenus.total`, `get(indexZeroBased)`, dan `search(query)`.
