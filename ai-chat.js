(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const STORE = 'planetbintang.ai-reber-chat.v1';
  const messages = $('#aiChatMessages');
  if (!messages) return;
  const read = () => { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch { return []; } };
  const write = (value) => { try { localStorage.setItem(STORE, JSON.stringify(value.slice(-40))); return true; } catch { return false; } };
  const addMessage = (role, text, persist = true) => {
    const item = document.createElement('article'); item.className = `ai-chat-message ${role}`;
    item.innerHTML = `<b>${role === 'user' ? 'Anda' : 'AI Reber · lokal'}</b><p></p>`; item.querySelector('p').textContent = text; messages.append(item);
    if (persist) { const history = read(); history.push({ role, text, at: new Date().toISOString() }); write(history); }
    messages.scrollTop = messages.scrollHeight;
  };
  const answer = (question) => {
    const q = question.toLocaleLowerCase('id');
    if (q.includes('batas') || q.includes('unlimited') || q.includes('benar')) return 'Mode ini berjalan lokal di browser. Percakapan tidak dibatasi oleh aplikasi selain kapasitas browser, tetapi saya tidak dapat menjamin jawaban selalu benar dan tidak boleh dianggap sebagai sumber profesional. Untuk jawaban model AI penuh, hubungkan backend/provider yang diautentikasi secara aman.';
    if (q.includes('feature registry') || q.includes('filesystem') || q.includes('system_ext')) return 'Buka Workspace → Features atau Code → Feature Registry. Pilih domain dan ekstensi, pilih satu file, baca preview, lalu gunakan Buka filesystem untuk menuju system_ext/features. Aksi Simulasikan hanya menjalankan handler UI yang aman.';
    if (q.includes('repository') || q.includes('repo') || q.includes('kode')) return 'Untuk pemeriksaan aman, buka Code → Repositori atau File Manager. Pilih file untuk melihat metadata dan preview. Editor hanya menyimpan draft lokal; tidak ada commit, deploy, atau eksekusi otomatis.';
    if (q.includes('menu') || q.includes('navigasi')) return 'Menu utama dikelompokkan menjadi Code, Plan, Review, Delivery, Insights, Manage, dan Execute. Workspace memiliki Proyek, Masalah, Code, Analitik, Akun, Bantuan, AI, dan Features.';
    if (q.includes('keamanan') || q.includes('security') || q.includes('token')) return 'Jangan menaruh token di browser atau commit. Gunakan secret server-side, autentikasi terpisah, sandbox, audit log, dan persetujuan sebelum operasi tulis atau deploy.';
    if (q.includes('halo') || q.includes('hai')) return 'Halo. Saya AI Reber mode lokal. Saya dapat membantu menjelaskan menu, filesystem, registry fitur, dan alur kerja aman.';
    return 'Saya menerima pertanyaan Anda, tetapi mode AI lokal ini tidak memiliki model penalaran eksternal atau akses live. Saya dapat membantu dengan konteks menu dan filesystem yang ada, atau Anda dapat menyusun pertanyaan lebih spesifik agar jawabannya dapat diverifikasi.';
  };
  function render() { messages.replaceChildren(); const history = read(); if (!history.length) addMessage('assistant', 'Halo. Saya AI Reber mode lokal. Tanyakan tentang menu, filesystem, fitur, kode, atau prosedur aman.', false); else history.forEach((item) => addMessage(item.role, item.text, false)); }
  $('#aiChatForm')?.addEventListener('submit', (event) => { event.preventDefault(); const input = $('#aiChatInput'); const text = input.value.trim(); if (!text) return; addMessage('user', text); addMessage('assistant', answer(text)); input.value = ''; input.focus(); });
  $('#aiChatClear')?.addEventListener('click', () => { write([]); render(); $('#aiChatMode').textContent = 'Mode lokal · chat dibersihkan'; });
  document.querySelectorAll('[data-ai-chat-prompt]').forEach((button) => button.addEventListener('click', () => { const input = $('#aiChatInput'); input.value = button.dataset.aiChatPrompt || ''; input.focus(); }));
  render();
  window.PBAIReber = { answer, clear: () => { write([]); render(); } };
})();
