import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const startLogin = () => {
  const config = window.__MANUS_CONFIG__;
  const oauthPortalUrl = config?.oauthPortalUrl;
  const appId = config?.projectId;
  const apiBase = (config?.apiUrl || window.location.origin).replace(/\/$/, "");
  if (!oauthPortalUrl || !appId) {
    window.alert("Layanan login GALERI belum dikonfigurasi. Hubungi administrator REIC Server PlanetBintang.");
    return;
  }

  const redirectUri = `${apiBase}/api/oauth/callback`;
  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("responseType", "code");
  window.location.href = url.toString();
};
