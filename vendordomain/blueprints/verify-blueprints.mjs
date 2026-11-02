import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
const root = new URL("./", import.meta.url);
const entries = (await readdir(root)).filter(x => /^\d{2}-.*\.md$/.test(x)).sort();
assert.equal(entries.length, 51, "expected exactly 51 blueprint documents");
for (const name of entries) {
 const stem = name.replace(/\.md$/, "");
 const md = await readFile(new URL(name, root), "utf8");
 const reic = JSON.parse(await readFile(new URL(stem + ".reic", root), "utf8"));
 const rows = md.match(/^r\d{2}: .*$/gm) ?? [];
 assert.equal(rows.length, 51, name + " must contain 51 formula rows");
 assert.equal(reic.evaluation.formula_rows.length, 51, stem + " REIC formula count");
 assert.equal(reic.status, "specification-only");
 assert.equal(reic.owner, "OWNER"); assert.equal(reic.platform, "PLANETBINTANG"); assert.equal(reic.policy_authority, "SNAPS");
 assert.equal(reic.evaluation.approval_gate.includes("owner_approved"), true);
}
console.log("PASS: 51 documents, 51 REIC contracts, 2,601 formula rows; owner/SNAPS gates present.");
