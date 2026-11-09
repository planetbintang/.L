// Cloudflare Worker adapter REIC — template proxy aman.
 // Tambahkan secret GITHUB_TOKEN dan variabel GITHUB_OWNER melalui dashboard Worker.
 // Opsional: ikat bucket R2 sebagai REIC_STORAGE dan database D1 sebagai REIC_DB.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request, env) });
    if (request.method !== "GET") return json({ error: "Metode tidak diizinkan." }, 405, request, env);
    if (url.pathname === "/health") return json({ status: "aktif", service: "REIC Cloudflare Adapter" }, 200, request, env);
    if (url.pathname !== "/api/reic/github/repos") return json({ error: "Endpoint tidak ditemukan." }, 404, request, env);
    if (!env.GITHUB_TOKEN) return json({ error: "Secret GITHUB_TOKEN belum dipasang." }, 503, request, env);
    const owner = env.GITHUB_OWNER || "planetbintang";
    const repos = [];
    for (let page = 1; page <= 10; page++) {
      const response = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member&page=${page}`, {
        headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }
      });
      if (!response.ok) return json({ error: `GitHub API HTTP ${response.status}` }, response.status, request, env);
      const batch = await response.json();
      repos.push(...batch);
      if (batch.length < 100) break;
    }
    const visible = repos.filter(r => r.owner?.login === owner).map(r => ({
      id:r.id,name:r.name,full_name:r.full_name,private:r.private,description:r.description,
      html_url:r.html_url,homepage:r.homepage,default_branch:r.default_branch,language:r.language
    }));
    return json({ source:"github-authenticated",owner,total:visible.length,public:visible.filter(r=>!r.private).length,private:visible.filter(r=>r.private).length,repositories:visible }, 200, request, env);
  }
};
function cors(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "https://planetbintang.github.io").split(",").map(x=>x.trim());
  return { "Access-Control-Allow-Origin":allowed.includes(origin)?origin:"null", "Vary":"Origin",
    "Access-Control-Allow-Methods":"GET, OPTIONS", "Access-Control-Allow-Headers":"Content-Type, Authorization",
    "X-Content-Type-Options":"nosniff" };
}
function json(data,status,request,env) {
  return new Response(JSON.stringify(data), { status, headers:{...cors(request,env),"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"} });
}
