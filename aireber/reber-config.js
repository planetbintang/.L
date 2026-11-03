/**
 * Konfigurasi opsional AI Reber.
 * Setelah Cloudflare Worker di-deploy, isi apiEndpoint dengan URL Worker Anda.
 * Jangan pernah menaruh OPENAI_API_KEY di file browser ini.
 */
window.REBER_AI_CONFIG = window.REBER_AI_CONFIG || {
  apiEndpoint: ""
};
