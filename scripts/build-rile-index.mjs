import { mkdir, writeFile } from "node:fs/promises";

const owner = process.env.GITHUB_OWNER || "planetbintang";
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
};
const started = Date.now();
const api = "https://api.github.com";
const errors = [];
const requestMs = [];
async function get(path) {
  const t = Date.now();
  const response = await fetch(api + path, { headers });
  requestMs.push(Date.now() - t);
  if (!response.ok) throw new Error(`HTTP ${response.status} ${path}`);
  return response.json();
}
async function pages(path) {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const batch = await get(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try { out[i] = await fn(items[i]); }
      catch (error) { errors.push(String(error.message || error)); out[i] = null; }
    }
  }));
  return out.filter(Boolean);
}
const allRepos = await pages(`/users/${owner}/repos?type=all&sort=full_name`);
const publicRepos = allRepos.filter(r => !r.private && !r.archived);
const privateExcluded = Math.max(allRepos.filter(r => r.private).length, Number(process.env.KNOWN_PRIVATE_REPOSITORIES || 0));
const repoResults = await pool(publicRepos, 5, async repo => {
  const [wf, rr] = await Promise.all([
    get(`/repos/${owner}/${repo.name}/actions/workflows?per_page=100`),
    get(`/repos/${owner}/${repo.name}/actions/runs?per_page=100`)
  ]);
  const runs = rr.workflow_runs || [];
  const byWorkflow = new Map();
  for (const run of runs) if (!byWorkflow.has(run.workflow_id)) byWorkflow.set(run.workflow_id, run);
  return {
    name: repo.name,
    url: repo.html_url,
    defaultBranch: repo.default_branch,
    workflowCount: wf.total_count ?? (wf.workflows || []).length,
    workflows: (wf.workflows || []).map(w => {
      const latest = byWorkflow.get(w.id);
      return {
        id: w.id, name: w.name, path: w.path, state: w.state,
        url: w.html_url, badgeUrl: w.badge_url,
        latestRun: latest ? {
          id: latest.id, number: latest.run_number, status: latest.status,
          conclusion: latest.conclusion, event: latest.event,
          branch: latest.head_branch, sha: latest.head_sha,
          createdAt: latest.created_at, updatedAt: latest.updated_at,
          url: latest.html_url
        } : null
      };
    }),
    runs: runs.map(r => ({
      id: r.id, workflowId: r.workflow_id, name: r.name,
      status: r.status, conclusion: r.conclusion, event: r.event,
      branch: r.head_branch, sha: r.head_sha,
      createdAt: r.created_at, updatedAt: r.updated_at, url: r.html_url
    }))
  };
});
const workflows = repoResults.flatMap(repo => repo.workflows.map(w => ({ ...w, repository: repo.name, repositoryUrl: repo.url })));
const runs = repoResults.flatMap(repo => repo.runs.map(r => ({ ...r, repository: repo.name })))
  .sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
const now = new Date();
const windows = {
  minute: 60_000, hour: 3_600_000, day: 86_400_000,
  week: 604_800_000, year: 31_557_600_000, quarter: 4 * 31_557_600_000
};
const series = {};
for (const [key, span] of Object.entries(windows)) {
  const buckets = 48;
  const step = span / buckets;
  const input = Array(buckets).fill(0), output = Array(buckets).fill(0);
  for (const run of runs) {
    const age = now.getTime() - Date.parse(run.createdAt);
    const i = buckets - 1 - Math.floor(age / step);
    if (i >= 0 && i < buckets) {
      input[i]++;
      if (run.status === "completed") output[i]++;
    }
  }
  series[key] = { input, output, bucketMs: step };
}
const totalWorkflows = workflows.length;
const success = runs.filter(r => r.conclusion === "success").length;
const failure = runs.filter(r => r.conclusion === "failure").length;
const inProgress = runs.filter(r => r.status === "in_progress" || r.status === "queued" || r.status === "waiting").length;
const payload = {
  schemaVersion: 1, generatedAt: now.toISOString(), source: "GitHub Actions REST API",
  owner, scope: "public repositories only",
  summary: {
    repositoriesScanned: repoResults.length, repositoriesExcludedPrivate: privateExcluded,
    repositoriesFailed: errors.length, workflows: totalWorkflows, runsFetched: runs.length,
    successfulRuns: success, failedRuns: failure, inProgressRuns: inProgress,
    targetWorkflows: 2100, targetReached: totalWorkflows >= 2100,
    inputEvents: runs.length, outputEvents: runs.filter(r => r.status === "completed").length,
    dotInputCount: runs.length, dotOutputCount: runs.filter(r => r.status === "completed").length
  },
  api: { durationMs: Date.now() - started, averageRequestMs: requestMs.length ? Math.round(requestMs.reduce((a,b)=>a+b,0)/requestMs.length) : 0, requests: requestMs.length, latencySamplesMs: requestMs },
  series,
  repositories: repoResults.map(({name,url,defaultBranch,workflowCount})=>({name,url,defaultBranch,workflowCount})),
  workflows, runs: runs.slice(0, 1000),
  errors: errors.slice(0, 20)
};
await mkdir("rile/data", { recursive: true });
await writeFile("rile/data/index.json", JSON.stringify(payload, null, 2) + "\n");
console.log(JSON.stringify({ repositories: repoResults.length, workflows: totalWorkflows, runs: runs.length, privateExcluded, errors: errors.length, durationMs: payload.api.durationMs }));
