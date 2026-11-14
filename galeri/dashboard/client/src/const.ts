export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const startLogin = () => {
  const apiBase = (window.__MANUS_CONFIG__?.apiUrl || "").replace(/\\/+$/, "");
  if (!apiBase) {
    window.alert("URL API GALERI belum dikonfigurasi. Administrator perlu mengisi secret GALERI_API_URL pada GitHub Actions.");
    return;
  }
  window.location.href = `${apiBase}/api/oauth/start`;
};
