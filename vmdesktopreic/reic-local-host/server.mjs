import http from "node:http";
import path from "node:path";
import { mkdir, readdir, stat, readFile } from "node:fs/promises";

const PORT = Number(process.env.REIC_PORT || 8787);
const OWNER = process.env.GITHUB_OWNER || "planetbintang";
const TOKEN = process.env.GITHUB_TOKEN || "";
const ROOT = path.resolve(process.env.REIC_STORAGE_ROOT || "./data");
const ORIGINS = (process.env.REIC_ALLOWED_ORIGINS || "http://127.0.0.1:8787,http://localhost:8787,https://planetbintang.github.io")
  .split(",").map(x => x.trim()).filter(Boolean);

const send = (res, code, data) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(data));
};
const safePath = value => {
  const target = path.resolve(ROOT, String(value || "."));
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) throw new Error("Jalur penyimpanan di luar akar REIC ditolak.");
  return target;
};
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  if (ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  }
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (req.method !== "GET") return send(res, 405, { error: "Metode tidak diizinkan." });
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (url.pathname === "/health") return send(res, 200, { status: "aktif", service: "REIC Local Host", version: "1.0" });
    if (url.pathname === "/api/reic/storage") {
      await mkdir(ROOT, { recursive: true });
      const rel = url.searchParams.get("path") || ".";
      const dir = safePath(rel);
      const entries = await readdir(dir, { withFileTypes: true });
      const result = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        const info = await stat(full);
        result.push({ name: entry.name, type: entry.isDirectory() ? "directory" : "file", size: info.size, modified: info.mtime.toISOString() });
      }
      return send(res, 200, { root: ROOT, path: rel, entries: result });
    }
    if (url.pathname === "/api/reic/github/repos") {
      if (!TOKEN) return send(res, 503, { error: "GITHUB_TOKEN belum dikonfigurasi pada host lokal." });
      const all = [];
      for (let page = 1; page <= 10; page++) {
        const upstream = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member&page=${page}`, {
          headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }
        });
        if (!upstream.ok) return send(res, upstream.status, { error: `GitHub API menolak permintaan: HTTP ${upstream.status}` });
        const batch = await upstream.json();
        all.push(...batch);
        if (batch.length < 100) break;
      }
      const repositories = all.filter(r => r.owner?.login === OWNER).map(r => ({
        id: r.id, name: r.name, full_name: r.full_name, private: r.private,
        description: r.description, html_url: r.html_url, homepage: r.homepage,
        default_branch: r.default_branch, language: r.language, updated_at: r.updated_at
      }));
      return send(res, 200, { source: "github-authenticated", owner: OWNER, total: repositories.length,
        public: repositories.filter(r => !r.private).length,
        private: repositories.filter(r => r.private).length, repositories });
    }
    if (url.pathname === "/api/reic/github/tree") {
      if (!TOKEN) return send(res, 503, { error: "GITHUB_TOKEN belum dikonfigurasi pada host lokal." });
      const name = url.searchParams.get("repo") || "";
      const ref = url.searchParams.get("ref") || "HEAD";
      const dir = url.searchParams.get("path") || "";
      if (!/^[A-Za-z0-9._-]+$/.test(name) || dir.split("/").includes("..")) return send(res, 400, { error: "Parameter repositori atau jalur tidak valid." });
      const endpoint = `https://api.github.com/repos/${OWNER}/${encodeURIComponent(name)}/contents/${dir.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`;
      const upstream = await fetch(endpoint, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } });
      const body = await upstream.json();
      return send(res, upstream.status, body);
    }
    return send(res, 404, { error: "Endpoint tidak ditemukan." });
  } catch (error) {
    return send(res, 400, { error: error.message || "Permintaan gagal." });
  }
});
await mkdir(ROOT, { recursive: true });
server.listen(PORT, "127.0.0.1", () => console.log(`REIC Local Host aktif pada http://127.0.0.1:${PORT}`));
