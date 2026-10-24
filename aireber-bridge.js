(() => {
  'use strict';

  const STORE = 'planetbintang.file-manager.workspace.v1';
  const readFiles = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORE) || '[]');
      return Array.isArray(value) ? value.filter((file) => file && file.name).map((file) => ({
        ...file,
        name: String(file.name).replaceAll('/', '-'),
        content: String(file.content || ''),
      })) : [];
    } catch { return []; }
  };
  const saveFiles = (files) => {
    try {
      localStorage.setItem(STORE, JSON.stringify(files));
      const event = new CustomEvent('planetbintang:workspace-files-changed');
      window.dispatchEvent(event);
      document.dispatchEvent(event);
      return true;
    } catch { return false; }
  };
  const normalize = (value) => String(value || '').trim().replace(/^\/workspace\//, '').replace(/^\//, '').replaceAll('/', '-').slice(0, 120);
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

  const status = document.querySelector('#reberWorkspaceStatus');
  const messages = document.querySelector('#reberEmbeddedMessages');
  const form = document.querySelector('#reberEmbeddedForm');
  const input = document.querySelector('#reberEmbeddedInput');
  if (!status || !messages || !form || !input) return;

  function updateStatus() {
    const files = readFiles();
    status.textContent = files.length ? `${files.length} file di /workspace siap dibaca` : 'Workspace /workspace masih kosong';
  }

  function appendMessage(role, text) {
    const article = document.createElement('article');
    article.className = `reber-embedded-message ${role}`;
    article.innerHTML = `<b>${role === 'assistant' ? 'AI Reber' : 'Anda'}</b><p>${escape(text).replaceAll('\n', '<br>')}</p>`;
    messages.append(article);
    messages.scrollTop = messages.scrollHeight;
  }

  function respond(text) {
    const raw = text.trim();
    const lower = raw.toLocaleLowerCase('id-ID');
    const files = readFiles();
    if (/^(daftar|list)(\s+file|\s+workspace)?$/.test(lower) || lower === 'kelola file') {
      return files.length ? `File Manager berisi ${files.length} file:\n${files.map((file) => `- /workspace/${file.name} (${file.content.length} karakter)`).join('\n')}` : 'File Manager /workspace masih kosong.';
    }
    const readMatch = raw.match(/^(?:baca|read)(?:\s+file)?\s+(.+)$/i);
    if (readMatch) {
      const name = normalize(readMatch[1]);
      const file = files.find((entry) => entry.name === name);
      return file ? `Isi /workspace/${file.name}:\n\n${file.content || '(file kosong)'}` : `File /workspace/${name} tidak ditemukan.`;
    }
    const deleteMatch = raw.match(/^(?:hapus|delete)(?:\s+file)?\s+(.+)$/i);
    if (deleteMatch) {
      const name = normalize(deleteMatch[1]);
      if (!files.some((file) => file.name === name)) return `File /workspace/${name} tidak ditemukan.`;
      saveFiles(files.filter((file) => file.name !== name));
      updateStatus();
      return `File /workspace/${name} dihapus dari File Manager.`;
    }
    const writeMatch = raw.match(/^(?:buat|tulis|simpan)(?:\s+file)?\s+([^\n:]+)(?::|\n)([\s\S]*)$/i);
    if (writeMatch) {
      const name = normalize(writeMatch[1]);
      const now = new Date().toISOString();
      const existing = files.find((file) => file.name === name);
      const next = { id: existing?.id || `file-${Date.now().toString(36)}`, name, content: writeMatch[2], createdAt: existing?.createdAt || now, updatedAt: now };
      saveFiles(existing ? files.map((file) => file.name === name ? next : file) : [next, ...files]);
      updateStatus();
      return `File /workspace/${name} ${existing ? 'diperbarui' : 'disimpan'} melalui File Manager.`;
    }
    const context = files.length ? `Saya melihat ${files.length} file di /workspace. Gunakan “daftar file”, “baca file <nama>”, “tulis file <nama>: <isi>”, atau “hapus file <nama>” untuk mengelolanya.` : 'Workspace masih kosong. Gunakan “tulis file catatan.txt: isi” untuk membuat file pertama.';
    return `Mode AI Reber lokal aktif. Saya menerima: “${raw}”. ${context} Untuk jawaban model streaming, buka AI Studio lengkap.`;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendMessage('user', text);
    input.value = '';
    window.setTimeout(() => appendMessage('assistant', respond(text)), 80);
  });
  document.querySelectorAll('[data-reber-prompt]').forEach((button) => button.addEventListener('click', () => {
    input.value = button.dataset.reberPrompt || '';
    input.focus();
  }));
  window.addEventListener('planetbintang:workspace-files-changed', updateStatus);
  document.addEventListener('planetbintang:workspace-files-changed', updateStatus);
  updateStatus();
})();
