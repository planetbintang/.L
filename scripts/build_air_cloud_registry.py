#!/usr/bin/env python3
"""Inline registry Air Cloud (4.394 baris menu) menjadi JS untuk browser, plus
patch kecil ke sistem yang ada:

  1. data/air-cloud-registry.js        — window.PB_AIR_CLOUD_REGISTRY (sidebar)
  2. file-manager.js                   — root virtual /airz (repo planetbintang/.AIRZ)
  3. feature-catalog.js                — domain & bucket fitur turunan menu Air Cloud
  4. system-navigation.js              — fallback hub URL /airz + trigger render
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(ROOT, "scripts")))

import air_cloud_data as data  # noqa: E402

ACCENT = {slug: accent for slug, _i, _t, _d, accent in data.AIR_CLOUD_MENUS}
ICON_BY_MENU = {f"AC-M{i + 1:03d}": ACCENT[m[0]] for i, m in enumerate(data.AIR_CLOUD_MENUS)}


def slim(row: dict) -> dict:
    return {
        "id": row["id"],
        "parent_id": row["parent_id"],
        "level": row["level"],
        "menu_code": row["menu_code"],
        "group_slug": row["group_slug"],
        "icon": row["icon"],
        "accent": ICON_BY_MENU.get(row["id"], "") or ACCENT.get(row["group_slug"], "#1d5bea"),
        "menu_name": row["menu_name"],
        "path_label": row["path_label"],
        "route_path": row["route_path"],
        "desc": row["short_description"],
        "fileName": f"{row['id']}.json",
        "instruction": (f"Halaman konsol '{row['path_label']}' tersimpan langsung ke filemanajer "
                        f"folder airz/ dan dimirror ke partisi sistem airz/airsistem."),
    }


def build_registry_js() -> None:
    menus = [slim(r) for r in data.MASTER_ROWS if r["level"] == 1]
    subs = [slim(r) for r in data.MASTER_ROWS if r["level"] == 2]
    leafs = [slim(r) for r in data.MASTER_ROWS if r["level"] == 3]
    payload = {
        "version": "2026.10",
        "product": "Air Cloud",
        "total": len(data.MASTER_ROWS),
        "mainMenus": len(menus),
        "subMenus": len(subs),
        "leafMenus": len(leafs),
        "folders": data.tree_stats()["folders"],
        "files": data.tree_stats()["files"],
        "pages": 338,
        "storageRoot": "airz/",
        "systemRoot": "airz/airsistem",
        "treeId": "6c16f20482a78201",
        "menus": menus,
        "subs": subs,
        "leafs": leafs,
    }
    header = ("// Dihasilkan scripts/build_air_cloud_registry.py — registry sidebar Air Cloud.\n"
              "// 26 menu utama · 312 submenu · 4.056 sub-sub menu; halaman JSON per menu ada di\n"
              "// data/air-cloud-menus/ (indeks: data/air-cloud-menus-index.js).\n")
    out = ROOT / "data" / "air-cloud-registry.js"
    out.write_text(header + "window.PB_AIR_CLOUD_REGISTRY = "
                   + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"registry js: {out.stat().st_size // 1024} KB · total menu {payload['total']}")


# ---------------------------------------------------------------------------
# Patch file runtime (idempoten — cek marker sebelum menulis)
# ---------------------------------------------------------------------------

def patch_file_manager() -> None:
    path = ROOT / "file-manager.js"
    src = path.read_text(encoding="utf-8")
    if "planetbintang/.AIRZ" in src:
        print("file-manager.js sudah memiliki root .AIRZ — lewati")
        return
    # 1) manifest generator: root virtual /airz saat repo === planetbintang/.AIRZ
    old_root_block = '''  function generatedSystemEntries(manifest) {
    const entries = [];
    for (const [rootPath, definition] of Object.entries(SYSTEM_ROOTS)) {'''
    new_root_block = '''  function airCloudManifest(manifest) {
    if (!manifest || manifest.repository !== 'planetbintang/.AIRZ') return null;
    return {
      repository: 'planetbintang/.AIRZ',
      branch: manifest.branch || 'main',
      headSha: manifest.headSha || 'aircloud-local-tree',
      treeSha: manifest.treeSha || 'aircloud-local-tree',
      state: 'complete',
      entryCount: manifest.entryCount || 0,
      fileCount: manifest.fileCount || 0,
      directoryCount: manifest.directoryCount || 0,
      submoduleCount: 0,
      totalBytes: manifest.totalBytes || 0,
      executableFileCount: 0,
      sizeUnknownCount: 0,
      redactedCount: 0,
      fallbackUsed: false,
      gitFallbackUsed: false,
      virtual: true,
      airCloud: true,
      rootVirtual: '/airz — penyimpanan langsung sistem Air Cloud',
      roots: [{ path: 'airz', title: '/airz', desc: 'Penyimpanan langsung sistem Air Cloud (folder airz/)', subUrl: '#fileManager/airz', items: manifest.entryCount || 0 }],
      summary: manifest.summary || {},
      directories: manifest.directories || {},
    };
  }

  function generatedSystemEntries(manifest) {
    const entries = [];
    for (const [rootPath, definition] of Object.entries(SYSTEM_ROOTS)) {'''
    assert old_root_block in src, "blok generatedSystemEntries tidak ditemukan"
    src = src.replace(old_root_block, new_root_block, 1)

    # 2) isVirtualRepo ikut mengenali .AIRZ
    old_check = "return Boolean(manifest?.virtual && manifest.repository === SYSTEM_VIRTUAL_REPO);"
    new_check = "return Boolean(manifest?.virtual && (manifest.repository === SYSTEM_VIRTUAL_REPO || manifest.repository === 'planetbintang/.AIRZ'));"
    assert old_check in src, "pola isVirtualRepo tidak ditemukan"
    src = src.replace(old_check, new_check, 1)

    # 3) manifestForSelected memakai airCloudManifest bila cocok
    old_manifest = '''  function manifestForSelected() {
    if (!state.manifest) return null;
    if (isVirtualRepo(state.manifest)) return generatedSystemManifest(state.manifest);'''
    new_manifest = '''  function manifestForSelected() {
    if (!state.manifest) return null;
    const airCloud = airCloudManifest(state.manifest);
    if (airCloud) return airCloud;
    if (isVirtualRepo(state.manifest)) return generatedSystemManifest(state.manifest);'''
    assert old_manifest in src, "pola manifestForSelected tidak ditemukan"
    src = src.replace(old_manifest, new_manifest, 1)

    # 4) loadTree memuat index shard .AIRZ dari data/trees/<treeId>
    old_load = '''    const response = await fetch(`${VIRTUAL_INDEX_URL}?at=${Date.now()}`, { cache: 'no-store' });'''
    new_load = '''    const airCloudIndex = String(localStorage.getItem('planetbintang.aircloud.indexUrl') || '').trim();
    const indexUrl = (selectedRepo?.fullName === 'planetbintang/.AIRZ' && airCloudIndex) ? airCloudIndex : VIRTUAL_INDEX_URL;
    const response = await fetch(`${indexUrl}?at=${Date.now()}`, { cache: 'no-store' });'''
    assert old_load in src, "pola loadTree tidak ditemukan"
    src = src.replace(old_load, new_load, 1)

    # 5) baca folder airz/ fisik dari IndexedDB sebagai direktori bayangan agar
    #    jumlah item selalu sama dengan isi folder nyata airz/ pada repositori.
    old_shadow = '''  async function loadTree(path, force = false) {
    const key = normalize(path);
    const manifest = manifestForSelected();
    if (!manifest) return { items: [], truncated: false };'''
    new_shadow = '''  async function localAirzShadow(key) {
    if (!window.PBLocalFiles?.list) return null;
    try {
      const records = await window.PBLocalFiles.list(key ? `airz/${key}` : 'airz', { includeDirectories: true });
      if (!records.length) return null;
      const byName = new Map();
      for (const record of records) {
        const relative = String(record.path || '').slice(key ? key.length + 5 : 4);
        if (!relative || relative.includes('/')) continue;
        byName.set(relative, {
          name: relative,
          path: key ? `${key}/${relative}` : relative,
          type: record.type === 'directory' ? 'directory' : 'file',
          mode: record.type === 'directory' ? '040755' : '0100644',
          sha: '',
          size: Number(record.size || 0),
          sizeKnown: true,
          function: 'Entri langsung dari folder airz/ (penyimpanan lokal browser)',
        });
      }
      return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'id'));
    } catch { return null; }
  }

  async function loadTree(path, force = false) {
    const key = normalize(path);
    const manifest = manifestForSelected();
    if (!manifest) return { items: [], truncated: false };
    if (isVirtualRepo(manifest) && manifest.airCloud) {
      const shadow = await localAirzShadow(key);
      if (shadow) {
        const cached = cacheGet(manifest, key);
        cacheSet(manifest, key, { items: shadow, truncated: false, pageUrls: cached?.pageUrls || [] });
      }
    }'''
    assert old_shadow in src, "pola loadTree tidak ditemukan"
    src = src.replace(old_shadow, new_shadow, 1)

    path.write_text(src, encoding="utf-8")
    print("file-manager.js dipatch: root /airz (.AIRZ) + shadow IndexedDB")


def patch_feature_catalog() -> None:
    path = ROOT / "feature-catalog.js"
    src = path.read_text(encoding="utf-8")
    if "PB_AIR_CLOUD_REGISTRY" in src:
        print("feature-catalog.js sudah mengenal Air Cloud — lewati")
        return
    old = "  const enterpriseDomains = () => ['core-code', 'project-management', 'cicd-deployment', 'security-compliance', 'artifacts-packages', 'data-insights', 'organization-access', 'settings-integrations', 'audit-monitoring', 'billing-quotas'];"
    new = old + """
  const airCloudDomains = () => (window.PB_AIR_CLOUD_REGISTRY?.menus || []).map((menu) => menu.group_slug);
  const AIR_FEATURES_PER_MENU = 156; // 26 menu × 156 = 4.056 fitur turunan struktur menu Air Cloud"""
    assert old in src
    src = src.replace(old, new, 1)
    old_all = "  const allDomains = () => [...domains(), ...enterpriseDomains()];"
    new_all = "  const allDomains = () => [...domains(), ...enterpriseDomains(), ...airCloudDomains()];"
    assert old_all in src
    src = src.replace(old_all, new_all, 1)
    old_total = "  const total = () => Number(state.manifest?.totalFeatureCount || ((state.manifest?.featureCount || 12288) + (state.manifest?.enterpriseFeatureCount || 4096)));"
    new_total = """  const airCount = () => (window.PB_AIR_CLOUD_REGISTRY?.menus || []).length * AIR_FEATURES_PER_MENU;
  const baseCount = () => Number(state.manifest?.featureCount || 12288);
  const entCount = () => Number(state.manifest?.enterpriseFeatureCount || 4096);
  const total = () => Number(state.manifest?.totalFeatureCount || (baseCount() + entCount() + airCount()));"""
    assert old_total in src
    src = src.replace(old_total, new_total, 1)
    old_at = "  const featureAt = (index) => {\n    if (index >= Number(state.manifest?.featureCount || 12288)) {"
    new_at = """  const featureAt = (index) => {
    const airStart = baseCount() + entCount();
    if (index >= airStart && airCount()) {
      const airIndex = index - airStart;
      const menus = window.PB_AIR_CLOUD_REGISTRY.menus;
      const menu = menus[Math.floor(airIndex / AIR_FEATURES_PER_MENU) % menus.length];
      const sub = (window.PB_AIR_CLOUD_REGISTRY.subs || []).filter((s) => s.parent_id === menu.id);
      const subRow = sub.length ? sub[Math.floor(airIndex / Math.max(1, Math.ceil(AIR_FEATURES_PER_MENU / sub.length))) % sub.length] : null;
      const extension = EXTENSIONS[airIndex % EXTENSIONS.length];
      const bucket = Math.floor(airIndex / 32);
      const file = `${menu.group_slug}-${(subRow ? subRow.menu_name.split(' ')[0] : 'overview').toLowerCase()}-f${String(airIndex).padStart(4, '0')}.${extension}`;
      return { index, id: `aircloud_${String(airIndex).padStart(4, '0')}`, domain: menu.group_slug, extension, bucket, file, path: `airz/airsistem/console/menus/${menu.group_slug}/${file}`, source: 'aircloud' };
    }
    if (index >= Number(state.manifest?.featureCount || 12288)) {"""
    assert old_at in src
    src = src.replace(old_at, new_at, 1)
    path.write_text(src, encoding="utf-8")
    print("feature-catalog.js dipatch: domain & ribuan fitur turunan Air Cloud")


def patch_navigation() -> None:
    path = ROOT / "system-navigation.js"
    src = path.read_text(encoding="utf-8")
    if "planetbintang/.AIRZ" in src:
        print("system-navigation.js sudah mengenal .AIRZ — lewati")
        return
    old = "      const url = `#fileManager/${slug}`;"
    new = "      const url = repo?.name === '.AIRZ' ? '#fileManager/airz' : `#fileManager/${slug}`;"
    assert old in src
    src = src.replace(old, new, 1)
    old_ready = "if (detail.phase === 'ready') {\n      setHubState('Snapshot dan menu tersinkron', 'ready'); updateHub();"
    new_ready = "if (detail.phase === 'ready') {\n      setHubState('Snapshot dan menu tersinkron', 'ready'); updateHub();\n      window.PBAirCloud?.render?.();"
    assert old_ready in src
    src = src.replace(old_ready, new_ready, 1)
    path.write_text(src, encoding="utf-8")
    print("system-navigation.js dipatch: URL hub /airz + render Air Cloud saat snapshot siap")


def patch_dashboard() -> None:
    path = ROOT / "dashboard.js"
    src = path.read_text(encoding="utf-8")
    if "planetbintang/.AIRZ" in src:
        print("dashboard.js sudah menyuntik .AIRZ — lewati")
        return
    old = "    const repositories = (snapshot.repositories || [])"
    new = """    const airCloudEntry = window.PB_AIR_CLOUD_REGISTRY ? {
      id: 'aircloud-root', name: '.AIRZ', fullName: 'planetbintang/.AIRZ', description: 'Repositori sistem Air Cloud — penyimpanan langsung folder airz/ (airsistem: ratusan folder, ribuan file).', language: 'TypeScript', visibility: 'private', appType: 'Webapp', pagesUrl: '', homepage: '', defaultBranch: 'main', lastSync: snapshot.updatedAt || '', stars: 0, forks: 0, watchers: 0, openIssues: 0, sizeKb: 0, score: 0,
    } : null;
    const withAir = airCloudEntry && !(snapshot.repositories || []).some((r) => r?.fullName === 'planetbintang/.AIRZ')
      ? [airCloudEntry, ...(snapshot.repositories || [])]
      : (snapshot.repositories || []);
    snapshot = { ...snapshot, repositories: withAir, repositoryCount: withAir.length };
    const repositories = (snapshot.repositories || [])"""
    assert old in src
    src = src.replace(old, new, 1)
    path.write_text(src, encoding="utf-8")
    print("dashboard.js dipatch: repositori virtual .AIRZ disuntik ke snapshot")


def bump_versions() -> None:
    path = ROOT / "index.html"
    src = path.read_text(encoding="utf-8")
    replacements = [
        ('./dashboard.js?v=20261023-system-vfs-v1', './dashboard.js?v=20261026-aircloud-snapshot-v1'),
        ('./file-manager.js?v=20261024-folder-reference-v1', './file-manager.js?v=20261026-aircloud-root-v1'),
        ('./feature-catalog.js?v=20261025-feature-registry-v1', './feature-catalog.js?v=20261026-aircloud-domains-v1'),
        ('./system-navigation.js?v=20261024-seven-menus-v1', './system-navigation.js?v=20261026-aircloud-nav-v1'),
    ]
    for old, new in replacements:
        assert old in src, f"versi lama tidak ditemukan: {old}"
        src = src.replace(old, new)
    path.write_text(src, encoding="utf-8")
    print("index.html: versi query dipbarui")


if __name__ == "__main__":
    build_registry_js()
    patch_file_manager()
    patch_feature_catalog()
    patch_navigation()
    patch_dashboard()
    bump_versions()
