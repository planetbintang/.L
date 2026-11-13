(() => {
  'use strict';
  const config = window.PB_IRC_CONFIG || {};
  const byId = (id) => document.getElementById(id);
  const set = (id, value, fallback) => { const el = byId(id); if (el) el.textContent = value || fallback; };
  set('serverValue', config.server, 'Belum dikonfigurasi');
  set('hostValue', config.host, 'Belum dikonfigurasi');
  set('portValue', config.port, '—');
  set('ipValue', config.ip, 'Tidak tersedia');
  set('adminValue', config.administrator, 'Belum ditetapkan');
  set('developerValue', config.developer, 'Belum ditetapkan');
  const ua = navigator.userAgent || '';
  const device = /tablet|ipad/i.test(ua) ? 'Tablet' : /mobi|android|iphone/i.test(ua) ? 'Ponsel' : 'Desktop / Laptop';
  set('deviceValue', device, 'Tidak diketahui');
  const form = byId('chatForm'), input = byId('chatInput'), log = byId('chatLog');
  const stamp = () => new Intl.DateTimeFormat('id-ID', {hour:'2-digit',minute:'2-digit'}).format(new Date());
  function addMessage(kind, label, text) {
    const article = document.createElement('article');
    article.className = 'message ' + (kind === 'user' ? 'user-message' : 'system-message');
    const meta = document.createElement('span'); meta.className = 'message-meta'; meta.textContent = label;
    const body = document.createElement('p'); body.textContent = text;
    const time = document.createElement('time'); time.textContent = stamp();
    article.append(meta, body, time); log.append(article); log.scrollTop = log.scrollHeight;
  }
  function responseFor(message) {
    const text = message.trim();
    if (/^\/(help|bantuan)$/i.test(text)) return 'Perintah lokal: /help untuk bantuan, /status untuk status antarmuka. Mode ini belum terhubung ke server IRC.';
    if (/^\/(status)$/i.test(text)) return 'Status: antarmuka aktif di browser ini; koneksi server belum dikonfigurasi; pesan hanya tersimpan selama halaman terbuka.';
    if (/^\/(connect|join|server)\b/i.test(text)) return 'Koneksi belum tersedia. Administrator perlu mengatur endpoint backend, host, port, autentikasi, dan layanan IRC sebelum sesi jaringan dapat dibuka.';
    return 'Pesan diterima oleh antarmuka lokal. Layanan IRC belum terhubung, sehingga pesan ini belum dikirim ke server atau pengguna lain.';
  }
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    addMessage('user', 'ANDA · ' + stamp(), message);
    input.value = '';
    window.setTimeout(() => addMessage('system', 'IRC LOCAL RESPONSE', responseFor(message)), 180);
    input.focus();
  });
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
})();