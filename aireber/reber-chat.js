/* ═══════════════════════════════════════════════════════════════════════════
   AI REBER · CHAT REALTIME UI (reber-chat.js)
   Menghubungkan tab "Chat Reber" dengan mesin reber-chat-engine.js.
   - Chatbot realtime: menjawab pertanyaan apa pun, tanpa token/kredit
   - Menampilkan referensi/link acuan setiap jawaban (ragkasan RAG lokal)
   - Bisa membuat kode (blok kode + tombol salin) dan analisis mendalam
   - Perintah File Manager aktif: daftar/baca/tulis/hapus file
   - Riwayat percakapan disimpan permanen di workspace IndexedDB lokal
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const HISTORY_ROOT = 'aireber/chat';
  const engine = window.ReberChatEngine;
  const messagesHost = $('#reberChatMessages');
  const form = $('#reberChatForm');
  const input = $('#reberChatInput');
  if (!messagesHost || !form || !input) return;

  // ── Penyimpanan riwayat (dibagi dengan File Manager utama bila tersedia) ──
  let store = null;
  try { store = window.PBLocalFiles || null; } catch { store = null; }
  const LOCAL_KEY = 'planetbintang.aireber.chat.v1';
  const readLocalHistory = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; } };
  const writeLocalHistory = (rows) => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(-200))); return true; } catch { return false; } };
  let cloudState = 'memeriksa';
  let gatewayAccessToken = '';
  async function askCloudModel() {
    const history = readLocalHistory().slice(-20)
      .filter((row) => row && ['user', 'assistant'].includes(row.role) && typeof row.text === 'string')
      .map((row) => ({ role: row.role, content: row.text.slice(0, 8000) }));
    if (!history.length || history[history.length - 1].role !== 'user') return null;
    const response = await fetch('/api/reber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-reber-access': gatewayAccessToken },
      body: JSON.stringify({ messages: history }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(50000) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      cloudState = response.status === 503 ? 'belum dikonfigurasi' : 'gangguan provider';
      const status = $('#reberChatStatus');
      if (status) status.textContent = `Backend AI ${cloudState}; beralih ke mesin lokal.`;
      return null;
    }
    if (typeof data.answer !== 'string' || !data.answer.trim()) return null;
    cloudState = 'terhubung';
    const status = $('#reberChatStatus');
    if (status) status.textContent = `AI model terhubung · ${data.model || 'model aktif'}.`;
    return data.answer.trim();
  }

  async function checkCloudGateway() {
    try {
      const response = await fetch('/api/reber', { headers: { 'Accept': 'application/json' } });
      const data = await response.json();
      cloudState = data.status === 'configured' ? 'siap · kode akses diperlukan' : 'belum dikonfigurasi';
    } catch { cloudState = 'mode lokal'; }
    const badge = $('#reberRuntimeMode');
    if (badge) badge.textContent = cloudState === 'siap' ? 'BACKEND AI SIAP' : 'MESIN LOKAL · ' + cloudState.toUpperCase();
  }


  async function persistTurn(role, text) {
    const rows = readLocalHistory();
    rows.push({ role, text, at: new Date().toISOString() });
    writeLocalHistory(rows);
    if (store && typeof store.saveFile === 'function') {
      try {
        const stamp = new Date().toISOString().replaceAll(':', '-').slice(0, 19);
        await store.saveFile(`${HISTORY_ROOT}/${stamp}-${role}.md`, `# ${role === 'user' ? 'Pengguna' : 'AI Reber'}\n${text}\n`, 'text/markdown;charset=utf-8');
      } catch { /* riwayat lokal tetap aman walau IndexedDB gagal */ }
    }
  }

  // ── Render pesan ───────────────────────────────────────────────────────────
  function appendMessage(role, markdownOrText) {
    const article = document.createElement('article');
    article.className = `reber-chat-message ${role}`;
    const head = document.createElement('div');
    head.className = 'reber-chat-head';
    head.innerHTML = `<span class="reber-chat-avatar">${role === 'assistant' ? 'Re' : 'An'}</span><b>${role === 'assistant' ? 'AI Reber · Mesin Realtime' : 'Anda'}</b><small>${new Date().toLocaleTimeString('id-ID')}</small>`;
    const body = document.createElement('div');
    body.className = 'reber-chat-body';
    if (role === 'assistant' && engine) body.innerHTML = engine.renderMarkdown(markdownOrText);
    else body.textContent = markdownOrText;
    article.append(head, body);
    messagesHost.append(article);
    messagesHost.scrollTop = messagesHost.scrollHeight;
    return article;
  }

  // Tombol "Salin" pada blok kode (delegasi event)
  messagesHost.addEventListener('click', (event) => {
    const button = event.target.closest('[data-copy-code]');
    if (!button) return;
    const code = button.closest('.reber-code')?.querySelector('code')?.textContent || '';
    const done = () => { button.textContent = 'Tersalin ✓'; setTimeout(() => { button.textContent = 'Salin'; }, 1600); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(done).catch(done);
    else done();
  });

  // ── Penanganan perintah File Manager langsung dari chat ───────────────────
  const normalize = (value) => String(value || '').trim().replace(/^\/workspace\//, '').replace(/^\//, '').replaceAll('/', '-').slice(0, 120);
  const FM_STORE = 'planetbintang.file-manager.workspace.v1';
  const readFmFiles = () => { try { const v = JSON.parse(localStorage.getItem(FM_STORE) || '[]'); return Array.isArray(v) ? v.filter((f) => f && f.name) : []; } catch { return []; } };
  const saveFmFiles = (files) => { try { localStorage.setItem(FM_STORE, JSON.stringify(files)); const ev = new CustomEvent('planetbintang:workspace-files-changed'); window.dispatchEvent(ev); document.dispatchEvent(ev); return true; } catch { return false; } };

  function fileCommand(text) {
    const lower = text.trim().toLowerCase();
    const files = readFmFiles();
    if (/^(daftar|list)(\s+file|\s+workspace)?$/.test(lower)) {
      return files.length ? `### 📂 Daftar File Manager (${files.length} file)\n${files.map((f) => `- \`/workspace/${f.name}\` (${String(f.content || '').length} karakter)`).join('\n')}` : 'File Manager /workspace masih kosong.';
    }
    const readMatch = text.match(/^(?:baca|read)(?:\s+file)?\s+(.+)$/i);
    if (readMatch) { const name = normalize(readMatch[1]); const f = files.find((x) => x.name === name); return f ? `### 📄 /workspace/${f.name}\n\`\`\`\n${f.content || '(file kosong)'}\n\`\`\`` : `File /workspace/${name} tidak ditemukan.`; }
    const delMatch = text.match(/^(?:hapus|delete)(?:\s+file)?\s+(.+)$/i);
    if (delMatch) { const name = normalize(delMatch[1]); if (!files.some((f) => f.name === name)) return `File /workspace/${name} tidak ditemukan.`; saveFmFiles(files.filter((f) => f.name !== name)); return `✅ File /workspace/${name} dihapus dari File Manager.`; }
    const writeMatch = text.match(/^(?:buat|tulis|simpan)(?:\s+file)?\s+([^\n:]+)(?::|\n)([\s\S]*)$/i);
    if (writeMatch) {
      const name = normalize(writeMatch[1]); const now = new Date().toISOString();
      const existing = files.find((f) => f.name === name);
      const next = { id: existing?.id || `file-${Date.now().toString(36)}`, name, content: writeMatch[2], createdAt: existing?.createdAt || now, updatedAt: now };
      saveFmFiles(existing ? files.map((f) => (f.name === name ? next : f)) : [next, ...files]);
      return `✅ File /workspace/${name} ${existing ? 'diperbarui' : 'disimpan'} melalui File Manager (${next.content.length} karakter).`;
    }
    return null;
  }

  // ── Umpan kata dari mesin kata AlluniverS_OS (untuk retrieval) ─────────────
  async function loadKataList() {
    if (window.REBER_KATA_LIST?.length) return window.REBER_KATA_LIST;
    const collect = (mod) => {
      const lists = Object.values(mod).filter((v) => Array.isArray(v));
      return [...new Set(lists.flat().map((w) => String(w).toLowerCase()))];
    };
    let words = [];
    // Prioritas: modul ES yang sama sekali dipakai File System AI Reber
    try { words = collect(await import('./assets/kata-data.js')); } catch { /* fallback ke namespace global */ }
    // Fallback: salinan namespace dari halaman utama (aireber-bridge.js / app.js)
    if (!words.length && window.AlluniversOS?.kata?.list instanceof Map) {
      words = [...new Set([...window.AlluniversOS.kata.list.keys()].map((k) => String(k).toLowerCase()))];
    }
    window.REBER_KATA_LIST = words;
    const badge = $('#reberKataBadge');
    if (badge) badge.textContent = words.length ? `${words.length.toLocaleString('id-ID')} kata dimuat ke mesin` : 'dokumen sistem saja';
    return words;
  }

  // ── Kirimi pesan → proses realtime oleh mesin ──────────────────────────────
  let busy = false;
  async function sendText(raw) {
    const text = String(raw || '').trim();
    if (!text || busy) return;
    busy = true;
    input.value = '';
    appendMessage('user', text);
    void persistTurn('user', text);
    const status = $('#reberChatStatus');
    if (status) status.textContent = '⚙️ Mesin Reber memproses: tokenisasi → retrieval → ranking → compose → sitasi…';

    await new Promise((resolve) => setTimeout(resolve, 40)); // jeda satu frame agar terasa realtime

    let answerText = '';
    try {
      const fm = fileCommand(text);
      if (fm !== null) {
        answerText = fm;
      } else {
        const cloudAnswer = await askCloudModel();
        if (cloudAnswer) {
          answerText = cloudAnswer;
          const meta = $('#reberChatMeta');
          if (meta) meta.textContent = 'model AI backend · konteks percakapan terakhir · jawaban generatif';
        } else if (engine) {
          const kataList = await loadKataList();
          const result = engine.answer(text, { kataList });
          answerText = result.text;
          const meta = $('#reberChatMeta');
          if (meta) meta.textContent = `mesin lokal · intent: ${result.intent} · ${result.retrieved.length} referensi · ${result.ms} ms`;
        } else {
          answerText = 'Mesin chat belum termuat (reber-chat-engine.js). Muat ulang halaman untuk mengaktifkan chat lokal.';
        }
      }
    } catch (error) {
      answerText = `Mesin Reber menemui kendala internal: ${error.message}. Silakan ulangi — pemrosesan lokal tidak memakai kuota apa pun.`;
    }
    appendMessage('assistant', answerText);
    void persistTurn('assistant', answerText);
    if (status) status.textContent = 'Siap. Tanyakan apa pun — tanpa batas token atau kredit.';
    busy = false;
    input.focus();
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); void sendText(input.value); });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendText(input.value); }
  });
  $$('[data-reber-chat-prompt]').forEach((button) => button.addEventListener('click', () => {
    input.value = button.dataset.reberChatPrompt || '';
    input.focus();
    if (String(button.dataset.reberChatPrompt || '').trim()) void sendText(button.dataset.reberChatPrompt);
  }));
  $('#reberChatClear')?.addEventListener('click', () => {
    writeLocalHistory([]);
    messagesHost.replaceChildren();
    bootWelcome(false);
    const status = $('#reberChatStatus');
    if (status) status.textContent = 'Riwayat chat dibersihkan dari perangkat ini.';
  });

  // ── Boot: sapaan + restore riwayat ─────────────────────────────────────────
  function bootWelcome(restore = true) {
    const rows = restore ? readLocalHistory() : [];
    if (rows.length) {
      for (const row of rows) appendMessage(row.role === 'user' ? 'user' : 'assistant', row.text);
    } else {
      appendMessage('assistant', '👋 **Halo, saya AI Reber.**\n\nSaya chatbot realtime yang ditenagai **mesin sistem AI Reber** — memproses pertanyaan dengan pipeline *tokenisasi → retrieval mesin kata → ranking → perangkaian jawaban → sitasi sumber*.\n\n✅ Jawab pertanyaan **apa pun** (bener & mener — benar dan mengarahkan)\n✅ **Tanpa token API, tanpa kredit, tanpa batas panjang percakapan**\n✅ Bisa **membuat kode** (JS/TS/React/CSS/HTML/Python/SQL)\n✅ Memberi **analisis mendalam** saat Anda menanyakan suatu masalah\n✅ Setiap jawaban mencantumkan **referensi/link acuan** (Perpusnas, MDN, GitHub, dsb.)\n\nPerintah berkas juga aktif: coba ketik `daftar file`.\n\nSilakan tanya apa pun — Re:Bersama! 🚀');
    }
  }
  bootWelcome(true);
  $('#reberGatewaySave')?.addEventListener('click', () => {
    gatewayAccessToken = $('#reberGatewayToken')?.value.trim() || '';
    const note = $('#reberGatewayStatus');
    if (note) note.textContent = gatewayAccessToken ? 'Kode akses disimpan sementara di memori halaman. Kirim pesan untuk menguji koneksi.' : 'Masukkan kode akses gateway terlebih dahulu.';
    if ($('#reberGatewayToken')) $('#reberGatewayToken').value = '';
  });
  void loadKataList();
  void checkCloudGateway();
})();
