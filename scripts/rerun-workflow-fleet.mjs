import fs from "node:fs";
import path from "node:path";

const repo = process.env.GH_REPOSITORY;
const token = process.env.GH_TOKEN;
const branch = process.env.TARGET_BRANCH || "io";
const mode = process.env.MODE || "dry-run";
const maxRuns = Number(process.env.MAX_RUNS || 2500);
const includeSuccess = process.env.INCLUDE_SUCCESS === "true";
const confirm = process.env.CONFIRM_EXECUTE === "true";
const currentRunId = Number(process.env.CURRENT_RUN_ID || 0);

if (!repo || !token) throw new Error("GH_REPOSITORY dan GH_TOKEN wajib tersedia.");
if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.includes("..")) throw new Error("Nama branch tidak valid.");
if (!Number.isInteger(maxRuns) || maxRuns < 1 || maxRuns > 2500) throw new Error("MAX_RUNS harus 1–2500.");
if (!["dry-run", "execute"].includes(mode)) throw new Error("MODE tidak dikenal.");
if (mode === "execute" && !confirm) throw new Error("Eksekusi dibatalkan: confirm_execute harus dicentang.");

const api = `https://api.github.com/repos/${repo}`;
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} ${response.statusText}: ${body.slice(0, 700)}`);
  }
  return response.status === 204 ? null : response.json();
}
const all = [];
for (let page = 1; page <= 25; page++) {
  const url = new URL(`${api}/actions/runs`);
  url.searchParams.set("branch", branch);
  url.searchParams.set("per_page", "100");
  url.searchParams.set("page", String(page));
  const payload = await request(url);
  const runs = payload.workflow_runs || [];
  all.push(...runs);
  if (runs.length < 100 || all.length >= 2500) break;
}
const eligible = all.filter(run => {
  if (run.id === currentRunId) return false;
  if (run.head_branch !== branch) return false;
  if (run.status !== "completed") return false;
  if (run.event === "schedule" && !run.workflow_id) return false;
  if (!includeSuccess && run.conclusion === "success") return false;
  return ["success", "failure", "cancelled", "timed_out", "action_required", "startup_failure", "stale"].includes(run.conclusion);
}).slice(0, maxRuns);

const counts = eligible.reduce((acc, run) => {
  acc[run.conclusion] = (acc[run.conclusion] || 0) + 1;
  return acc;
}, {});
const inventory = {
  generated_at: new Date().toISOString(),
  repository: repo,
  branch,
  mode,
  include_success: includeSuccess,
  maximum_requested: maxRuns,
  runs_scanned: all.length,
  eligible_count: eligible.length,
  eligible_by_conclusion: counts,
  truncated: all.length >= 2500 || eligible.length >= maxRuns,
  runs: eligible.map(run => ({
    id: run.id,
    name: run.name,
    workflow_id: run.workflow_id,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    head_sha: run.head_sha,
    created_at: run.created_at,
    html_url: run.html_url,
  })),
};
const outDir = path.join("automation", "records");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "workflow-fleet-inventory.json"), JSON.stringify(inventory, null, 2) + "\n");

let triggered = 0;
const errors = [];
if (mode === "execute") {
  for (const run of eligible) {
    try {
      await request(`${api}/actions/runs/${run.id}/rerun`, { method: "POST" });
      triggered++;
      console.log(`RERUN ${run.id} ${run.name} ${run.conclusion}`);
      // Gentle pacing; GitHub still enforces its own rate/concurrency limits.
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (error) {
      errors.push({ run_id: run.id, message: String(error) });
      console.error(`FAILED ${run.id}: ${error}`);
    }
  }
}
const summary = [
  "# PlanetBintang Workflow Fleet",
  "",
  `- Repository: \`${repo}\``,
  `- Branch: \`${branch}\``,
  `- Mode: **${mode}**`,
  `- Historical runs scanned: **${all.length}**`,
  `- Eligible runs: **${eligible.length}**`,
  `- Rerun requests accepted: **${triggered}**`,
  `- Failed rerun requests: **${errors.length}**`,
  `- Previous conclusions: \`${JSON.stringify(counts)}\``,
  `- Inventory truncated/limit reached: **${inventory.truncated ? "yes" : "no"}**`,
  "",
  mode === "dry-run"
    ? "No workflow run was restarted. Review the inventory artifact, then start again with mode=execute and confirm_execute=true."
    : "A successful API response means GitHub accepted the rerun request; it does not mean the workflow completed successfully. Monitor each run URL.",
  ...errors.map(item => `- ERROR run ${item.run_id}: ${item.message}`),
].join("\n");
fs.writeFileSync(path.join(outDir, "workflow-fleet-summary.md"), summary + "\n");
console.log(summary);
if (errors.length) process.exitCode = 1;
