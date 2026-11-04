#!/usr/bin/env node
/**
 * Four-task REIC generator: 500,000 files per task, 2,000,000 total.
 * Each run generates one deterministic shard of up to 10,000 independent .reic files.
 * Files are packaged by GitHub Actions as artifacts; they are not committed
 * individually to Git history.
 */
import fs from 'node:fs';
import path from 'node:path';

const CATALOG_PATH = 'data/git-feature-catalog.json';
const TASK_COUNT = 4;
const FILES_PER_TASK = 500_000;
const TOTAL_FILES = TASK_COUNT * FILES_PER_TASK;
const TASK_INDEX = Number(process.env.REIC_TASK_INDEX || 0);
const FILES_PER_FEATURE = Math.ceil(TOTAL_FILES / 1500);
const SHARD_SIZE = Number(process.env.REIC_SHARD_SIZE || 10_000);
const SHARD_INDEX = Number(process.env.REIC_SHARD_INDEX || 0);
const OUT = process.env.REIC_OUTPUT_DIR || 'dist/reic-mass';
const MIN_LINES = 110;

function assert(ok, message) { if (!ok) throw new Error(message); }
function clean(value) { return String(value ?? '').replace(/[\r\n"]/g, ' ').trim(); }
function slug(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'modul';
}
function makeSource(feature, globalIndex) {
  const localIndex = globalIndex % FILES_PER_FEATURE;
  const taskId = 'TASK-' + String(Math.floor(globalIndex / FILES_PER_TASK) + 1) + '-REIC-' + String(globalIndex + 1).padStart(7, '0');
  const lines = [
    '#!REIC/1.0',
    '# PlanetBintang mass-generated system unit',
    '# Deterministic task instance; generated from the Git feature catalog.',
    'SYSTEM PlanetBintang.CODE',
    'FORMAT REIC',
    'VERSION 1.0.0',
    'EXECUTION disabled-by-default',
    'SECURITY deny-by-default',
    'AUDIT enabled',
    'TASK {',
    '  id: "' + taskId + '"',
    '  sequence: ' + (globalIndex + 1),
    '  source_feature: "' + clean(feature.id) + '"',
    '  title: "' + clean(feature.title) + '"',
    '  module: "' + clean(feature.module) + '"',
    '  action: "' + clean(feature.action) + '"',
    '  instance: ' + (localIndex + 1),
    '  instance_count: ' + FILES_PER_FEATURE,
    '  generated: true',
    '  status: "scaffolded-safe"',
    '}',
    'CONTRACT {',
    '  input: "FeatureContext"',
    '  output: "FeatureResult"',
    '  idempotency_key: required-for-write',
    '  timeout_ms: 15000',
    '  retries: 0',
    '}',
    'SCHEMA FeatureContext {',
    '  request_id: string required',
    '  actor_id: string optional',
    '  workspace_id: string optional',
    '  locale: string default "id-ID"',
    '  payload: object default {}',
    '  permissions: array default []',
    '  dry_run: boolean default true',
    '}',
    'SCHEMA FeatureResult {',
    '  ok: boolean',
    '  task_id: string',
    '  status: string',
    '  message: string',
    '  data: object',
    '  errors: array',
    '  timestamp: datetime',
    '}',
    'STATE {',
    '  phase: "idle"',
    '  request_id: null',
    '  result: null',
    '  busy: false',
    '  error_count: 0',
    '  success_count: 0',
    '}',
    'POLICY {',
    '  authentication_required: true',
    '  permission_required_for_mutation: true',
    '  reject_unknown_input: true',
    '  redact_secrets: true',
    '  expose_credentials: false',
    '  external_network: disabled-until-adapter-configured',
    '  destructive_action: explicit-approval-required',
    '}',
    'VALIDATE context {',
    '  require context.request_id',
    '  assert context.payload is object',
    '  assert context.permissions is array',
    '  reject secret-like payload keys',
    '  return validation_result',
    '}',
    'AUTHORIZE context {',
    '  allow dry_run preview without mutation',
    '  require authenticated actor for execution',
    '  require task-scoped permission for writes',
    '  deny when policy cannot be evaluated',
    '  return authorization_result',
    '}',
    'HANDLER preview(context) {',
    '  validate context',
    '  return safe_preview(TASK.id, context.payload)',
    '}',
    'HANDLER execute(context) {',
    '  validate context',
    '  authorize context',
    '  require configured_service_adapter',
    '  begin audit_span(TASK.id, context.request_id)',
    '  set STATE.phase = "running"',
    '  let response = adapter.invoke(TASK.id, context.payload)',
    '  validate response against FeatureResult',
    '  store sanitized response in STATE.result',
    '  commit audit_span with redacted(response)',
    '  return response',
    '}',
    'HANDLER recover(error, context) {',
    '  classify error as VALIDATION | FORBIDDEN | UNAVAILABLE | CONFLICT',
    '  do not retry non-idempotent mutations',
    '  preserve request_id for traceability',
    '  store sanitized diagnostic metadata',
    '  set STATE.phase = "idle"',
    '  return safe_error_result(error)',
    '}',
    'EVENT on_open(context) {',
    '  validate context',
    '  set STATE.phase = "ready"',
    '  emit "reic.ready" with TASK.id',
    '}',
    'EVENT on_close(context) {',
    '  clear transient state',
    '  preserve audit history',
    '  set STATE.phase = "idle"',
    '}',
    'EVENT on_cancel(context) {',
    '  cancel local preview',
    '  do not claim remote cancellation without provider confirmation',
    '  emit "reic.cancelled" with context.request_id',
    '}',
    'VIEW {',
    '  shell: "VMDESKTOPREIC"',
    '  module: "' + clean(feature.module) + '"',
    '  title: "' + clean(feature.title) + '"',
    '  description: "' + clean(feature.action) + '"',
    '  responsive: true',
    '  keyboard_accessible: true',
    '  theme: "OsMediaVm-compatible"',
    '}',
    'STYLE {',
    '  layout: "grid"',
    '  surface: "dark-translucent"',
    '  border_radius: 0',
    '  focus_visible: true',
    '  reduced_motion: true',
    '  scope: TASK.id',
    '}',
    'DATA {',
    '  persistence: "adapter-defined"',
    '  schema_version: 1',
    '  encryption_at_rest: required_for_sensitive_data',
    '  retention: "workspace-policy"',
    '  export: "permission-gated"',
    '}',
    'INTEGRATION {',
    '  provider: "reviewed-backend-adapter"',
    '  credentials: "server-side-secret-store-only"',
    '  rate_limit: "respect-provider-headers"',
    '  pagination: "cursor-based"',
    '  webhook: "verify-signature"',
    '  fallback: "read-only-preview"',
    '}',
    'OBSERVABILITY {',
    '  metrics: ["duration_ms", "success_count", "error_count"]',
    '  traces: ["request_id", "task_id", "actor_scope"]',
    '  logs: "structured-redacted"',
    '}',
    'TESTS {',
    '  unit: ["valid-input", "invalid-input", "secret-redaction"]',
    '  security: ["anonymous-denied", "unauthorized-write-denied"]',
    '  runtime: ["preview-safe", "adapter-unavailable"]',
    '  recovery: ["timeout", "provider-error", "malformed-response"]',
    '}',
    'DOCUMENTATION {',
    '  source_catalog: "data/git-feature-catalog.json"',
    '  source_feature: "' + clean(feature.id) + '"',
    '  generated_task: "' + taskId + '"',
    '  note: "Connect and review a backend adapter before enabling writes."',
    '}',
    'EXPORT preview(context) -> preview(context)',
    'EXPORT execute(context) -> execute(context)',
    'EXPORT recover(error, context) -> recover(error, context)',
    'END TASK'
  ];
  while (lines.length < MIN_LINES) lines.push('# Reserved extension point ' + String(lines.length + 1).padStart(3, '0'));
  return lines.join('\n') + '\n';
}

function main() {
  assert(fs.existsSync(CATALOG_PATH), 'Missing ' + CATALOG_PATH);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  assert(Array.isArray(catalog.features) && catalog.features.length === 1500, 'Expected exactly 1,500 catalog features.');
  assert(Number.isInteger(SHARD_INDEX) && SHARD_INDEX >= 0, 'Invalid REIC_SHARD_INDEX.');
  assert(Number.isInteger(SHARD_SIZE) && SHARD_SIZE > 0, 'Invalid REIC_SHARD_SIZE.');
  assert(Number.isInteger(TASK_INDEX) && TASK_INDEX >= 0 && TASK_INDEX < TASK_COUNT, 'REIC_TASK_INDEX must be 0, 1, 2, or 3.');
  const shardCount = Math.ceil(FILES_PER_TASK / SHARD_SIZE);
  assert(SHARD_INDEX < shardCount, 'Shard index is outside task range.');
  const taskStart = TASK_INDEX * FILES_PER_TASK;
  const start = taskStart + SHARD_INDEX * SHARD_SIZE;
  const end = Math.min(taskStart + FILES_PER_TASK, start + SHARD_SIZE);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = [];
  for (let index = start; index < end; index++) {
    const feature = catalog.features[index % catalog.features.length];
    assert(feature, 'No source feature for global index ' + index);
    const moduleDir = slug(feature.module);
    const name = 'task-' + String(index + 1).padStart(7, '0') + '.reic';
    const relative = path.join(moduleDir, name);
    const source = makeSource(feature, index);
    const lineCount = source.trimEnd().split(/\r?\n/).length;
    assert(lineCount >= 100, relative + ' has only ' + lineCount + ' lines.');
    const destination = path.join(OUT, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, source, 'utf8');
    manifest.push({ id: 'REIC-' + String(index + 1).padStart(7, '0'), path: relative.split(path.sep).join('/'), lines: lineCount, sourceFeature: feature.id });
  }
  const report = {
    schemaVersion: 1,
    taskNumber: TASK_INDEX + 1,
    taskCount: TASK_COUNT,
    filesPerTask: FILES_PER_TASK,
    taskTargetFiles: FILES_PER_TASK,
    targetFiles: TOTAL_FILES,
    shardIndex: SHARD_INDEX,
    shardCount,
    shardSize: manifest.length,
    firstSequence: start + 1,
    lastSequence: end,
    minimumLinesPerFile: MIN_LINES,
    verifiedFiles: manifest.length,
    status: 'generated-and-line-count-verified',
    files: manifest
  };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ task: TASK_INDEX + 1, taskCount: TASK_COUNT, taskTargetFiles: FILES_PER_TASK, targetFiles: TOTAL_FILES, shardIndex: SHARD_INDEX, shardCount, generated: manifest.length, minimumLinesPerFile: MIN_LINES }));
}
main();
