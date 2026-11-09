import http from "node:http";
import path from "node:path";
import { mkdir, readdir, stat, readFile } from "node:fs/promises";

const PORT = Number(process.env.REIC_PORT || 8787);
const OWNER = process.env.GITHUB_OWNER || "planetbintang";
const TOKEN = process.env.GITHUB_TOKEN || "";\nconst BING_KEY = process.env.BING_SEARCH_KEY || "";
const ROOT = path.resolve(process.env.REIC_STORAGE_ROOT || "./data");\nconst SEARCH_ROOTS = (process.env.REIC_SEARCH_ROOTS || [path.resolve(process.cwd(), "../.."), ROOT].join(","))\n  .split(",").map(x => path.resolve(x.trim())).filter(Boolean);
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
    if (url.pathname === "/api/reic/search") {
      const q = (url.searchParams.get("q") || "").trim().slice(0, 240);
      if (q.length < 2) return send(res, 400, { error: "Masukkan minimal 2 karakter untuk pencarian." });
      const results = [];
      const terms = q.toLowerCase().split(/\\s+/).filter(Boolean);
      const searchable = /\\.(md|txt|html?|css|js|mjs|reic|reicss|reicjs|json|xml|yml|yaml)$/i;
      const ignored = /(^|\\/)(\\.git|node_modules|vendor|\\.cache|secrets?)(\\/|$)|(^|\\/)\\.env($|\\.)|(^|\\/).*\\.(pem|key)$/i;
      let scanned = 0;
      const walk = async (dir, rel = "", depth = 0) => {
        if (depth > 5 || scanned >= 700 || results.length >= 24) return;
        let entries;
        try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
        for (const entry of entries) {
          if (scanned >= 700 || results.length >= 24) break;
          const childRel = rel ? rel + "/" + entry.name : entry.name;
          if (ignored.test(childRel)) continue;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) await walk(full, childRel, depth + 1);
          else if (entry.isFile() && searchable.test(entry.name)) {
            scanned++;
            try {
              const info = await stat(full);
              if (info.size > 256 * 1024) continue;
              const content = (await readFile(full, "utf8")).slice(0, 120000);
              const lower = (entry.name + " " + content).toLowerCase();
              const score = terms.reduce((n, term) => n + (lower.includes(term) ? 1 : 0), 0);
              if (score) {
                const at = lower.indexOf(terms[0]);
                const snippet = content.replace(/\\s+/g, " ").slice(Math.max(0, at - 90), Math.max(0, at - 90) + 260);
                results.push({ source: "FILE REIC", title: childRel, url: "", snippet, score });
              }
            } catch {}
          }
        }
      };
      for (const searchRoot of SEARCH_ROOTS) { await walk(searchRoot); if (scanned >= 700 || results.length >= 24) break; }
      if (BING_KEY) {
        try {
          const response = await fetch("https://api.bing.microsoft.com/v7.0/search?q=" + encodeURIComponent(q) + "&count=8&textDecorations=false&textFormat=Raw", { headers: { "Ocp-Apim-Subscription-Key": BING_KEY } });
          if (response.ok) {
            const data = await response.json();
            for (const item of data.webPages?.value || []) results.push({ source: "BING WEB", title: item.name, url: item.url, snippet: item.snippet });
          }
        } catch {}
      }
      try {
        const response = await fetch("https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=" + encodeURIComponent(q) + "&srlimit=6&format=json&origin=*");
        if (response.ok) {
          const data = await response.json();
          for (const item of data.query?.search || []) results.push({ source: "WIKIPEDIA", title: item.title, url: "https://id.wikipedia.org/?curid=" + item.pageid, snippet: item.snippet.replace(/<[^>]*>/g, "") });
        }
      } catch {}
      try {
        const response = await fetch("https://api.github.com/search/repositories?q=" + encodeURIComponent(q + " user:" + OWNER) + "&per_page=8", { headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } });
        if (response.ok) {
          const data = await response.json();
          for (const item of data.items || []) results.push({ source: "GITHUB PUBLIK", title: item.full_name, url: item.html_url, snippet: item.description || "Repositori publik GitHub" });
        }
      } catch {}
      results.sort((a, b) => (b.score || 0) - (a.score || 0));
      return send(res, 200, { query: q, total: results.length, sources: [...new Set(results.map(x => x.source))], results: results.slice(0, 40), localFilesScanned: scanned, bingEnabled: Boolean(BING_KEY) });
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
