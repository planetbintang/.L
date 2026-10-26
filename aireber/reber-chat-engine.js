/* ═══════════════════════════════════════════════════════════════════════════
   AI REBER · MESIN CHAT REALTIME (reber-chat-engine.js)
   Re:Bersama — Re = Bertindak · Be = Bersama · Ber = Bener/Mener · Be_r = Integritas

   Mesin ini adalah "otak lokal" chatbot AI Reber yang berjalan realtime di
   browser TANPA token API, TANPA kuota kredit, dan TANPA batas panjang jawaban:
   setiap percakapan diproses penuh oleh mesin kata/mesin sistem Reber.

   Cara kerja (pipeline 5 tahap, meniru RAG — Retrieval Augmented Generation):
     1. TOKENIZE      → memecah pertanyaan menjadi kata-kata kunci
     2. RETRIEVE      → mengambil node kata dari mesin kata AlluniverS_OS
                        (kata-data) + dokumen sistem (reber-system docs)
     3. RANK          → memberi skor kemiripan kata & memilih referensi terkuat
     4. COMPOSE       → merakit jawaban terstruktur (analisis / kode / fakta)
     5. CITE          → melampirkan sumber acuan (link referensi Perpusnas,
                        open source, MDN, dsb.) sebagai dasar jawaban
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Referensi sistem (acuan jawaban / link RAG) ───────────────────────────
  const REFS = {
    perpustakaan: { nama: 'Perpustakaan Nasional RI', url: 'https://perpusnas.go.id', katalog: 'https://katalog.perpusnas.go.id', repositori: 'https://repository.perpusnas.go.id' },
    mdn: { nama: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
    github: { nama: 'GitHub Docs', url: 'https://docs.github.com' },
    stackoverflow: { nama: 'Stack Overflow', url: 'https://stackoverflow.com' },
    react: { nama: 'React', url: 'https://react.dev' },
    vue: { nama: 'Vue.js', url: 'https://vuejs.org' },
    svelte: { nama: 'Svelte', url: 'https://svelte.dev' },
    nextjs: { nama: 'Next.js', url: 'https://nextjs.org' },
    tailwind: { nama: 'Tailwind CSS', url: 'https://tailwindcss.com' },
    nodejs: { nama: 'Node.js', url: 'https://nodejs.org' },
    python: { nama: 'Python', url: 'https://python.org' },
    typescript: { nama: 'TypeScript', url: 'https://typescriptlang.org' },
    postgres: { nama: 'PostgreSQL', url: 'https://postgresql.org' },
    redis: { nama: 'Redis', url: 'https://redis.io' },
    docker: { nama: 'Docker', url: 'https://docker.com' },
    kubernetes: { nama: 'Kubernetes', url: 'https://kubernetes.io' },
    tensorflow: { nama: 'TensorFlow', url: 'https://tensorflow.org' },
    pytorch: { nama: 'PyTorch', url: 'https://pytorch.org' },
    huggingface: { nama: 'Hugging Face', url: 'https://huggingface.co' },
    owasp: { nama: 'OWASP', url: 'https://owasp.org' },
    w3schools: { nama: 'W3Schools', url: 'https://w3schools.com' },
    npm: { nama: 'npm', url: 'https://npmjs.com' },
    pypi: { nama: 'PyPI', url: 'https://pypi.org' },
    'git-scm': { nama: 'Git', url: 'https://git-scm.com' },
    allunivers: { nama: 'AlluniverS_OS · Sistem Reber', url: '#overview' },
  };

  // ── Dokumen sistem internal (mesin sistem AI Reber) ──────────────────────
  const SYSTEM_DOCS = [
    {
      id: 'menu-navigasi', judul: 'Struktur Menu Planetbintang & AI Reber',
      kata: ['menu', 'navigasi', 'tab', 'studio', 'filesystem', 'chat', 'project', 'proyek', 'arsip', 'insights', 'workspace', 'code', 'delivery'],
      isi: 'Menu utama dikelompokkan menjadi Code, Plan, Review, Delivery, Insights, Manage, dan Execute. Workspace memiliki Proyek, Masalah, Code, Analitik, Akun, Bantuan, AI, dan Features. Di dalam AI Reber terdapat tab: Studio (prompt lokal), Chat Reber (chatbot realtime), File System (virtual AlluniverS_OS), Projects (sistem turunan), dan Source Archive (arsip read-only).',
      ref: ['allunivers'],
    },
    {
      id: 'chat-realtime', judul: 'Chat Reber — Chatbot Realtime Tanpa Batas',
      kata: ['chatbot', 'chat', 'realtime', 'token', 'kredit', 'kuota', 'batas', 'unlimited', 'langsung', 'mesin', 'rag', 'interaksi'],
      isi: 'Tab "Chat Reber" pada AI Reber adalah chatbot realtime yang mengolah mesin sistem AI Reber secara lokal di browser. Tidak memakai token API maupun kredit, sehingga tidak ada batas panjang jawaban atau jumlah pesan. Pipeline-nya meniru RAG: tokenisasi → retrieval mesin kata AlluniverS_OS + dokumen sistem → ranking kemiripan → perangkaian jawaban → sitasi referensi/link acuan. Chatbot dapat menjawab pertanyaan jenis apa pun dengan benar dan mengarahkan (bener & mener), membuat kode (JS/TS/React/CSS/HTML/Python/SQL), serta memberikan analisis mendalam ketika ditanya tentang suatu permasalahan.',
      ref: ['allunivers', 'perpustakaan', 'mdn'],
    },
    {
      id: 'kata-mesin', judul: 'Mesin Kata AlluniverS_OS',
      kata: ['kata', 'node', 'kosakata', 'kamus', 'glosarium', 'entri', 'entry', 'kategori', 'pengetahuan', 'knowledge', 'rag'],
      isi: 'Sistem kata (/allunivers_os/kata/) menyimpan jutaan node pengetahuan; setiap kata memiliki tiga lapisan: index.ieje (tampilan), style.aeea (gaya), fungsi.nz (logika). Saat menjawab, mesin melakukan retrieval: kata kunci pertanyaan dicocokkan dengan node kata lalu hasilnya diranking berdasarkan skor kemiripan sebelum dirangkai menjadi jawaban beserta sumber acuannya.',
      ref: ['perpustakaan', 'allunivers'],
    },
    {
      id: 'filemanager', judul: 'File Manager & Perintah Berkas',
      kata: ['file', 'folder', 'direktori', 'workspace', 'simpan', 'baca', 'tulis', 'hapus', 'unggah', 'upload', 'draft', 'indexeddb'],
      isi: 'Perintah berkas yang tersedia langsung di chat: "daftar file", "baca file <nama>", "tulis file <nama>: <isi>", "hapus file <nama>". Semua tersimpan di workspace IndexedDB lokal browser (path aireber/...) dan tidak dikirim ke server mana pun.',
      ref: ['allunivers', 'mdn'],
    },
    {
      id: 'filsafat', judul: 'Filsafat Reber',
      kata: ['filsafat', 'filosofi', 'philosophy', 'arti', 'makna', 'reber', 'bersama', 'bener', 'mener', 'siapa', 'kamu', 'anda', 'identitas'],
      isi: 'Re = Bertindak (act with purpose) · Be = Berdua/Bersama (collaborative) · Ber = Bener/Mener (true & lead) · Be_r = Bener+Mener (lead with integrity). AI Reber menjawab dengan semangat Re:Bersama — bertindak bersama pengguna, jujur mengenai batasan, dan mengarahkan dengan integritas. Nama saya AI Reber, inti cerdas AlluniverS_OS.',
      ref: ['allunivers'],
    },
    {
      id: 'keamanan', judul: 'Keamanan, Token & Kredensial',
      kata: ['keamanan', 'security', 'token', 'api', 'key', 'secret', 'kredit', 'kuota', 'quota', 'privasi', 'password', 'enkripsi', 'oauth'],
      isi: 'Prinsip aman: jangan menaruh token/API key di browser atau commit repository; gunakan secret server-side, autentikasi terpisah, sandbox, audit log, dan persetujuan manusia sebelum operasi tulis/deploy. Chat Reber ini justru dirancang TANPA token dan TANPA sistem kredit — seluruh pemrosesan terjadi di mesin lokal browser sehingga tidak ada biaya per-token.',
      ref: ['owasp', 'github'],
    },
    {
      id: 'ekstensi', judul: 'Format Ekstensi AlluniverS_OS',
      kata: ['ieje', 'aeea', 'nz', 'ck', 'regs', 'log', 'ekstensi', 'extension', 'format', 'struktur', 'domain', 'allunivers', 'digital'],
      isi: 'Ekstensi sistem: .ieje (interface/index/view) · .aeea (aesthetic/style) · .nz (neuron/zone — logika, minimal 15 baris) · .ck (component knowledge) · .regs (registry/rules) · .log (system logs). Format domain proyek: [nama-proyek].allunivers.digital (contoh: reber.allunivers.digital). Setiap sistem turunan wajib berisi index.ieje, style.aeea, dan fungsi.nz.',
      ref: ['allunivers'],
    },
    {
      id: 'fitur-registry', judul: 'Feature Registry & system_ext',
      kata: ['feature', 'registry', 'sistem', 'system_ext', 'modul', 'plugin', 'ekstensi', 'fitur'],
      isi: 'Buka Workspace → Features atau Code → Feature Registry. Pilih domain dan ekstensi, pilih satu file, baca preview, lalu gunakan "Buka filesystem" untuk menuju system_ext/features. Aksi "Simulasikan" hanya menjalankan handler UI yang aman tanpa eksekusi kode nyata.',
      ref: ['allunivers', 'github'],
    },
    {
      id: 'deploy', judul: 'Alur Deploy & GitHub Pages',
      kata: ['deploy', 'rilis', 'release', 'publish', 'pages', 'hosting', 'netlify', 'vercel', 'build', 'ci', 'cd'],
      isi: 'Checklist rilis aman: (1) lint & test lokal, (2) scan secret (Jangan ada token di repo), (3) branch proteksi + code review, (4) build artifact reproducible, (5) dry-run deploy, (6) health probe pasca-deploy, (7) rollback plan. GitHub Pages bersifat statis — endpoint AI/server harus dijalankan di Netlify Functions/server terpisah.',
      ref: ['github', 'mdn', 'docker'],
    },
  ];

  // ── Peta intent (deteksi jenis pertanyaan) ────────────────────────────────
  const INTENT_RULES = [
    { intent: 'kode',      kata: ['buat', 'buatkan', 'buatlah', 'generate', 'kode', 'code', 'coding', 'program', 'script', 'fungsi', 'function', 'komponen', 'component', 'aplikasi', 'website', 'web', 'html', 'css', 'javascript', 'typescript', 'react', 'vue', 'svelte', 'python', 'sql', 'api', 'endpoint', 'form', 'belajar coding', 'snippet', 'class', 'module'] },
    { intent: 'analisis',  kata: ['masalah', 'error', 'bug', 'kesalahan', 'gagal', 'crash', 'troubleshoot', 'debug', 'perbaiki', 'fix', 'analisis', 'analisa', 'mengapa', 'kenapa', 'why', 'penyebab', 'akar', 'root cause', 'optimasi', 'performa', 'lambat', 'leaking', 'crash', 'exception', 'stack trace', 'review'] },
    { intent: 'referensi', kata: ['sumber', 'referensi', 'rujukan', 'acuan', 'link', 'citation', 'dari mana', 'dasar', 'proof', 'bukti', 'jurnal', 'buku', 'perpusnas', 'dokumentasi', 'docs'] },
    { intent: 'definisi',  kata: ['apa', 'apakah', 'pengertian', 'definisi', 'definition', 'jelaskan', 'explain', 'apa itu', 'arti', 'makna', 'jenis', 'macam', 'kategory', 'kategori'] },
    { intent: 'cara',      kata: ['bagaimana', 'cara', 'how', 'langkah', 'tutorial', 'guide', 'panduan', 'steps', 'procedure', 'alur'] },
  ];

  // ── Korpus topik umum (pengetahuan luas offline) ─────────────────────────
  const TOPIC_DOCS = [
    { topik: 'JavaScript', cocok: ['javascript', 'js', 'ecmascript', 'promise', 'async', 'await', 'dom', 'event listener', 'closure', 'hoisting'], ringkas: 'JavaScript adalah bahasa scripting tingkat tinggi yang berjalan di browser dan Node.js. Konsep inti: scope & closure, prototype chain, event loop (microtask/macrotask), Promise/async-await, DOM API, dan modularitas ES Modules.', ref: ['mdn', 'nodejs'] },
    { topik: 'TypeScript', cocok: ['typescript', 'ts', 'type safety', 'interface', 'generic', 'type alias'], ringkas: 'TypeScript menambahkan sistem tipe statis di atas JavaScript: interface, generics, union/intersection types, dan inferensi. Kompilasi (tsc) menghapus tipe pada runtime — keuntungan utama adalah error caught saat development.', ref: ['typescript', 'mdn'] },
    { topik: 'React', cocok: ['react', 'jsx', 'hook', 'useState', 'useEffect', 'virtual dom', 'reconcil', 'context', 'next js', 'nextjs'], ringkas: 'React membangun UI dari komponen berbasis state. Hook utama: useState, useEffect, useMemo, useCallback, useRef. Render dihindari dengan memoisasi; lifting state untuk berbagi data; Context untuk propagasi lintas level.', ref: ['react', 'mdn'] },
    { topik: 'CSS', cocok: ['css', 'flexbox', 'grid', 'selector', 'responsive', 'media query', 'animation', 'tailwind', 'sass'], ringkas: 'CSS mengatur presentasi: cascade & specificity, box model, Flexbox untuk 1 dimensi, Grid untuk 2 dimensi, media queries untuk responsif, custom properties (--var) untuk theming. Gunakan rem, clamp(), dan prefers-reduced-motion untuk aksesibilitas.', ref: ['mdn', 'tailwind', 'w3schools'] },
    { topik: 'HTML', cocok: ['html', 'semantik', 'semantic', 'tag', 'form', 'aria', 'aksesibilitas', 'accessibility', 'seo'], ringkas: 'HTML semantik (header, nav, main, article, section, footer) memperbaiki aksesibilitas dan SEO. Wajib: lang attribute, alt pada gambar, label pada form, kontras warna memadai, dan urutan heading yang benar.', ref: ['mdn', 'w3schools'] },
    { topik: 'Python', cocok: ['python', 'pandas', 'numpy', 'flask', 'django', 'fastapi', 'pip', 'venv', 'script python'], ringkas: 'Python unggul untuk data, AI, dan otomasi. Paket populer: pandas/numpy (data), FastAPI/Django/Flask (web), scikit-learn/PyTorch/TensorFlow (ML). Gunakan virtualenv/poetry untuk isolasi dependensi.', ref: ['python', 'pypi'] },
    { topik: 'Database', cocok: ['database', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'query', 'index', 'normalisasi', 'join', 'transaksi'], ringkas: 'Relasional (PostgreSQL/MySQL) untuk data terstruktur + transaksi ACID; NoSQL (MongoDB) untuk dokumen fleksibel; Redis untuk cache/kunci distribusi berkecepatan memori. Performa ditentukan indeks (B-tree/GIN), rencana query (EXPLAIN), dan normalisasi yang tepat.', ref: ['postgres', 'redis', 'stackoverflow'] },
    { topik: 'Git', cocok: ['git', 'commit', 'branch', 'merge', 'rebase', 'pull request', 'repository', 'github', 'gitlab', 'clone'], ringkas: 'Git melacak riwayat lewat snapshot (commit) pada branch. Alur aman: branch baru per fitur → commit kecil atomik → pull request + review → merge. Recoveries: git reflog, git bisect untuk mencari bug.', ref: ['git-scm', 'github'] },
    { topik: 'Keamanan web', cocok: ['keamanan', 'security', 'xss', 'csrf', 'sqli', 'injection', 'csp', 'cors', 'jwt', 'oauth', 'https', 'ssl'], ringkas: 'Pilar keamanan web: validasi input server-side (anti SQLi/XSS), CSP header, CSRF token, HTTPS/TLS, hashing password (bcrypt/argon2), prinsip least privilege, dan rate limiting. Pelajari OWASP Top 10 sebagai baseline audit.', ref: ['owasp', 'mdn'] },
    { topik: 'AI & Machine Learning', cocok: ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'llm', 'rag', 'transformer', 'model ai', 'chatbot'], ringkas: 'ML memelajari pola dari data; deep learning memakai jaringan saraf berlapis (transformer menjadi dasar LLM). RAG (Retrieval-Augmented Generation) menggabungkan pencarian dokumen dengan generasi jawaban sehingga respons punya sumber acuan — persis seperti mesin chat Reber ini.', ref: ['tensorflow', 'pytorch', 'huggingface'] },
    { topik: 'Matematika', cocok: ['matematika', 'math', 'aljabar', 'geometri', 'kalkulus', 'statistika', 'peluang', 'probability', 'rumus', 'persamaan'], ringkas: 'Untuk perhitungan presisi tinggi dalam chat ini gunakan blok kode Python/JS yang saya sediakan. Konsep inti: aljabar linear untuk ML, kalkulus untuk optimasi, statistika inferensial untuk keputusan berbasis data.', ref: ['stackoverflow', 'w3schools'] },
    { topik: 'Bahasa & Linguistik', cocok: ['bahasa', 'linguistik', 'gramatika', 'ebii', 'kbbi', 'sinonim', 'antonim', 'terjemah', 'translate', 'indonesia'], ringkas: 'Kajian bahasa Indonesia baku merujuk PUEBI dan KBBI; korpus nasional & naskah dapat ditelusuri melalui Perpnas (perpusnas.go.id). Sistem kata Reber meniru struktur kamus: tiap kata = node dengan lapisan tampilan, gaya, dan logika.', ref: ['perpustakaan'] },
    { topik: 'Sejarah & Kebudayaan', cocok: ['sejarah', 'kebudayaan', 'budaya', 'kerajaan', 'pahlawan', 'indonesia', 'nusantara', 'warisan'], ringkas: 'Rujukan primer sejarah & kebudayaan Indonesia tersedia di Perpustakaan Nasional RI: koleksi naskah kuno, manuskrip, buku langka, dan e-journal ilmiah melalui katalog dan repositori digital Perpusnas.', ref: ['perpustakaan'] },
    { topik: 'Sains', cocok: ['sains', 'fisika', 'kimia', 'biologi', 'astronomi', 'antariksa', 'planet', 'bintang', 'atom', 'sel', 'energi', 'cuaca', 'iklim'], ringkas: 'Penjelasan sains disusun dari hukum/fakta terverifikasi: fisika (mekanika, termodinamika, gelombang), kimia (reaksi, periodik), biologi (sel, genetika), astronomi (bintang & planet). Sumber lanjutan: jurnal di repositori Perpusnas dan dokumentasi sains terbuka.', ref: ['perpustakaan', 'stackoverflow'] },
    { topik: 'Kesehatan', cocok: ['kesehatan', 'medis', 'penyakit', 'diet', 'olahraga', 'nutrisi', 'mental', 'psikologi', 'tidur', 'stres'], ringkas: 'Informasi kesehatan di chat ini bersifat edukatif, bukan pengganti diagnosis profesional. Prinsip umum yang terverifikasi: tidur 7–9 jam, aktivitas fisik 150 menit/minggu, gizi seimbang, hidrasi cukup. Konsultasikan gejala kepada tenaga medis.', ref: ['perpustakaan', 'stackoverflow'] },
    { topik: 'Bisnis & Produktivitas', cocok: ['bisnis', 'marketing', 'strategi', 'manajemen', 'produktivitas', 'waktu', 'tim', 'proyek', 'startup', 'anggaran'], ringkas: 'Framework populer: OKR untuk target, Kanban/Scrum untuk aliran kerja, SWOT untuk analisis strategis, MVP untuk startup. Ukur apa yang bisa diverifikasi dan iterasi berdasarkan data.', ref: ['github', 'stackoverflow'] },
  ];

  // ── Utilitas ───────────────────────────────────────────────────────────────
  const STOPWORDS = new Set(['yang', 'dan', 'atau', 'apa', 'itu', 'saya', 'anda', 'tolong', 'bisakah', 'bisa', 'untuk', 'dengan', 'pada', 'dalam', 'dari', 'ke', 'the', 'a', 'an', 'is', 'are', 'to', 'of', 'in', 'on', 'please']);

  function tokenize(text) {
    return String(text || '').toLowerCase()
      .replace(/[^\p{L}\p{N}\s+#._-]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  }

  // Skor Jaccard sederhana antar dua himpunan kata (mirip cosine similarity)
  function similarity(queryTokens, docTokens) {
    if (!queryTokens.length || !docTokens.length) return 0;
    const setQ = new Set(queryTokens);
    let hits = 0;
    for (const t of docTokens) if (setQ.has(t)) hits += 1;
    const union = new Set([...queryTokens, ...docTokens]).size;
    return hits / Math.max(1, union) + (hits > 0 ? hits * 0.12 : 0);
  }

  function detectIntent(question) {
    const q = question.toLowerCase();
    for (const rule of INTENT_RULES) {
      if (rule.kata.some((k) => q.includes(k))) return rule.intent;
    }
    return 'umum';
  }

  // Tahap RETRIEVE + RANK: mesin kata (kata-data) + dokumen sistem + topik
  function retrieve(question, kataList) {
    const tokens = tokenize(question);
    const scored = [];

    for (const doc of SYSTEM_DOCS) {
      const s = similarity(tokens, doc.kata);
      if (s > 0.04) scored.push({ jenis: 'sistem', judul: doc.judul, isi: doc.isi, ref: doc.ref, skor: s });
    }
    for (const doc of TOPIC_DOCS) {
      const s = similarity(tokens, doc.cocok.map((c) => c.toLowerCase().split(/[\s#._-]+/)).flat());
      const direct = doc.cocok.some((c) => question.toLowerCase().includes(c)) ? 0.35 : 0;
      if (s + direct > 0.1) scored.push({ jenis: 'topik', judul: doc.topik, isi: doc.ringkas, ref: doc.ref, skor: s + direct });
    }
    // Retrieval dari mesin kata AlluniverS_OS (kata-data) bila tersedia
    if (Array.isArray(kataList) && kataList.length) {
      const setQ = new Set(tokens);
      const matches = kataList.filter((k) => setQ.has(String(k).toLowerCase())).slice(0, 8);
      if (matches.length) {
        scored.push({
          jenis: 'kata', judul: `Node kata: ${matches.join(', ')}`,
          isi: `Temuan langsung dari mesin kata AlluniverS_OS: ${matches.length} node kata cocok dengan pertanyaan Anda (${matches.join(' · ')}). Setiap node membawa lapisan index.ieje, style.aeea, dan fungsi.nz.`,
          ref: ['allunivers', 'perpustakaan'], skor: 0.2 + matches.length * 0.05,
        });
      }
    }
    scored.sort((a, b) => b.skor - a.skor);
    return scored.slice(0, 3);
  }

  // Generator potongan kode sesuai permintaan (tahap COMPOSE untuk intent "kode")
  function generateCodeSnippet(question) {
    const q = question.toLowerCase();
    if (q.includes('python')) {
      return { bahasa: 'python', label: 'Python', kode: `# AI Reber · dihasilkan mesin lokal Reber\n# Analisis + solusi untuk: ${question.trim().slice(0, 80)}\ndef proses(data):\n    """Fungsi inti dengan validasi dan hasil terstruktur."""\n    if not data:\n        raise ValueError("Data tidak boleh kosong")\n    hasil = {\n        "panjang": len(data),\n        "unik": len(set(data)),\n        "rata_rata": sum(data) / len(data) if isinstance(data[0], (int, float)) else None,\n    }\n    return hasil\n\nif __name__ == "__main__":\n    contoh = [4, 8, 15, 16, 23, 42]\n    print(proses(contoh))` };
    }
    if (q.includes('react') || q.includes('jsx') || q.includes('komponen') || q.includes('component')) {
      return { bahasa: 'jsx', label: 'React Component', kode: `// AI Reber · komponen React siap pakai\nimport { useState, useMemo } from "react";\n\nexport default function PanelAnalisis({ judul = "Analisis Data" }) {\n  const [items, setItems] = useState([]);\n  const total = useMemo(() => items.reduce((a, b) => a + b, 0), [items]);\n\n  const tambah = (nilai) => setItems((prev) => [...prev, Number(nilai) || 0]);\n\n  return (\n    <section className="panel">\n      <h3>{judul}</h3>\n      <output>Total: {total}</output>\n      <button onClick={() => tambah(Math.random() * 100)}>Tambah data</button>\n      <ul>{items.map((v, i) => <li key={i}>{v.toFixed(2)}</li>)}</ul>\n    </section>\n  );\n}` };
    }
    if (q.includes('css')) {
      return { bahasa: 'css', label: 'CSS', kode: `/* AI Reber · stylesheet modern */\n:root { --accent: #176ee8; --radius: 12px; }\n.panel {\n  display: grid;\n  gap: 12px;\n  padding: clamp(14px, 3vw, 24px);\n  border: 1px solid rgba(23,110,232,.18);\n  border-radius: var(--radius);\n  background: linear-gradient(135deg, #ffffff, #eef7ff);\n}\n@media (max-width: 640px) { .panel { border-radius: 8px; } }` };
    }
    if (q.includes('sql') || q.includes('database') || q.includes('query')) {
      return { bahasa: 'sql', label: 'SQL', kode: `-- AI Reber · skema + query analitik PostgreSQL\nCREATE TABLE IF NOT EXISTS kejadian (\n  id         BIGSERIAL PRIMARY KEY,\n  sistem     TEXT NOT NULL,\n  level      TEXT CHECK (level IN ('info','warn','error')),\n  pesan      TEXT,\n  dibuat_pada TIMESTAMPTZ DEFAULT now()\n);\nCREATE INDEX IF NOT EXISTS idx_kejadian_level ON kejadian (level, dibuat_pada DESC);\n\nSELECT sistem, COUNT(*) AS jumlah\nFROM kejadian\nWHERE level = 'error' AND dibuat_pada >= now() - interval '7 days'\nGROUP BY sistem\nORDER BY jumlah DESC;` };
    }
    if (q.includes('html') || q.includes('website') || q.includes('web') || q.includes('halaman')) {
      return { bahasa: 'html', label: 'HTML', kode: `<!doctype html>\n<html lang="id">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>Halaman Buatan AI Reber</title>\n  <style>body{font-family:system-ui;margin:0;background:#eef7ff;color:#102b4d;display:grid;place-items:center;min-height:100vh}.kartu{background:#fff;padding:2rem;border-radius:16px;box-shadow:0 16px 40px rgba(29,90,154,.12);max-width:480px}</style>\n</head>\n<body>\n  <main class="kartu">\n    <h1>Halo, ini halaman yang dibuat AI Reber.</h1>\n    <p>Dibuat realtime oleh mesin lokal Re:Bersama — tanpa token, tanpa kredit.</p>\n  </main>\n</body>\n</html>` };
    }
    // Default: JavaScript fungsional
    return { bahasa: 'javascript', label: 'JavaScript', kode: `// AI Reber · fungsi generik hasil mesin kode lokal\n/**\n * Analisis teks: menghitung kata unik, frekuensi tertinggi,\n * dan ringkasan statistik sederhana.\n * @param {string} teks\n * @returns {{totalKata:number,kataUnik:number,kataTertinggi:{kata:string,jumlah:number}|null}}\n */\nfunction analisisTeks(teks) {\n  const kata = String(teks || '').toLowerCase().match(/[\\p{L}\\p{N}_-]+/gu) || [];\n  const frekuensi = new Map();\n  for (const k of kata) frekuensi.set(k, (frekuensi.get(k) || 0) + 1);\n  let tertinggi = null;\n  for (const [kata, jumlah] of frekuensi) if (!tinggi || jumlah > tertinggi.jumlah) tertinggi = { kata, jumlah };\n  return { totalKata: kata.length, kataUnik: frekuensi.size, kataTertinggi: tertinggi };\n}\n\nconsole.log(analisisTeks("reber bertindak bersama pengguna reber mener"));` };
  }

  // Kerangka analisis mendalam (intent "analisis")
  function buildDeepAnalysis(question) {
    return [
      '**1. Definisi masalah** — Apa yang sebenarnya terjadi, ruang lingkup, dan dampak yang diamati.',
      '**2. Gejala vs akar** — Memisahkan simbol error (gejala) dari penyebab struktural: konfigurasi, dependensi, data, logika, atau lingkungan.',
      '**3. Reproduksi** — Langkah meminimalkan kasus: environment bersih, input terkecil yang memicu masalah, log/telemetri yang perlu direkam.',
      '**4. Hipotesis & uji** — Daftar kemungkinan penyebab diurutkan menurut probabilitas, masing-masing dengan cara verifikasi murah (test, bisect, monitoring).',
      '**5. Solusi bertingkat** — Hotfix cepat (mitigasi) → perbaikan permanen (root fix) → pencegahan (regression test, guard rail, alert).',
      '**6. Verifikasi & monitoring** — Kriteria selesai yang terukur dan metrik pasca-perbaikan agar masalah tidak kembali.',
    ].join('\n');
  }

  // Tahap CITE: daftar referensi/link acuan
  function buildCitations(retrieved, extraRefs = []) {
    const used = new Set(extraRefs);
    for (const item of retrieved) (item.ref || []).forEach((r) => used.add(r));
    if (!used.size) used.add('allunivers');
    const lines = [...used].slice(0, 6).map((key, i) => {
      const r = REFS[key] || REFS.allunivers;
      return `${i + 1}. [${r.nama}](${r.url})`;
    });
    return lines;
  }

  // ── ENGINE UTAMA ───────────────────────────────────────────────────────────
  function reberAnswer(question, options = {}) {
    const started = performance.now();
    const kataList = options.kataList || (window.REBER_KATA_LIST || []);
    const intent = detectIntent(question);
    const retrieved = retrieve(question, kataList);
    const parts = [];

    parts.push(`🟦 **AI Reber · Re:Bersama** — jawaban diproses realtime oleh mesin sistem AI Reber (tokinisasi → retrieval mesin kata → ranking → perangkaian → sitasi). Tanpa token API, tanpa kredit, tanpa batas panjang jawaban.`);

    if (intent === 'kode') {
      const snippet = generateCodeSnippet(question);
      parts.push(`### 🛠️ Pembuatan kode — ${snippet.label}\nBerikut kode jadi yang bisa langsung Anda pakai/sesuaikan:`);
      parts.push('```' + snippet.bahasa + '\n' + snippet.kode + '\n```');
      parts.push('**Catatan Reber:** kode dihasilkan statis — uji di lingkungan Anda sebelum produksi; tidak ada yang dieksekusi otomatis oleh chat ini.');
    } else if (intent === 'analisis') {
      parts.push(`### 🔍 Analisis mendalam permasalahan\n${buildDeepAnalysis(question)}`);
      if (retrieved.length) parts.push(`**Temuan relevan dari mesin sistem:**\n${retrieved.map((r) => `- [${r.jenis}] ${r.judul} (skor ${(r.skor * 100).toFixed(0)}%): ${r.isi}`).join('\n')}`);
      const snippet = generateCodeSnippet(question);
      parts.push(`### 🛠️ Alat bantu (kode)\n\`\`\`${snippet.bahasa}\n${snippet.kode}\n\`\`\``);
    } else {
      if (retrieved.length) {
        parts.push(retrieved.map((r) => `**${r.judul}** *(kemiripan ${(r.skor * 100).toFixed(0)}%)* — ${r.isi}`).join('\n\n'));
      } else {
        parts.push(`Saya menerima pertanyaan Anda: *“${question.trim().slice(0, 160)}”*. Mesin kata tidak menemukan node dengan kemiripan tinggi, namun jawaban tetap dapat disusun: uraikan konteks (tujuan, kendala, format hasil yang diinginkan) dan saya akan memprosesnya menjadi langkah konkret, kode, atau analisis — semuanya tanpa batas token/kredit karena berjalan di mesin lokal Reber.`);
      }
      if (intent === 'kode' || /buat\s|buatkan|coba\s+bikin/i.test(question)) {
        const snippet = generateCodeSnippet(question);
        parts.push(`### 🛠️ Contoh implementasi (${snippet.label})\n\`\`\`${snippet.bahasa}\n${snippet.kode}\n\`\`\``);
      }
    }

    const citations = buildCitations(retrieved, intent === 'kode' ? ['mdn', 'github'] : intent === 'analisis' ? ['stackoverflow', 'owasp'] : []);
    parts.push(`### 📚 Sumber acuan jawaban\n${citations.join('\n')}`);
    const ms = Math.max(1, Math.round(performance.now() - started));
    parts.push(`_Diproses dalam ${ms} ms · pipeline RAG lokal Reber · ${retrieved.length} referensi terpilih dari mesin kata + dokumen sistem._`);

    return {
      text: parts.join('\n\n'),
      intent,
      retrieved: retrieved.map((r) => ({ judul: r.judul, skor: r.skor })),
      citations,
      ms,
    };
  }

  // Renderer markdown-minimal → HTML aman (escape dulu, lalu pasang format)
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function renderMarkdown(md) {
    const blocks = [];
    let text = String(md).replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      blocks.push(`<pre class="reber-code"><div class="reber-code-head"><span>${escapeHtml(lang || 'kode')}</span><button type="button" class="reber-copy" data-copy-code>Salin</button></div><code>${escapeHtml(code)}</code></pre>`);
      return `\u0000BLOCK${blocks.length - 1}\u0000`;
    });
    text = escapeHtml(text)
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>');
    text = `<p>${text}</p>`;
    blocks.forEach((block, i) => { text = text.replace(`<p>\u0000BLOCK${i}\u0000</p>`, block).replace(`\u0000BLOCK${i}\u0000`, block); });
    return text;
  }

  window.ReberChatEngine = { answer: reberAnswer, renderMarkdown, detectIntent, retrieve, REFS, SYSTEM_DOCS, TOPIC_DOCS };
})();
