#!/usr/bin/env bash
set -Eeuo pipefail

# Build and publish 500 public PlanetBintang repositories as installable
# VMDESKTOPREIC-compatible application packages.
OWNER="planetbintang"
LOG_FILE="integratedpackages.log"
CATALOG_FILE="packages.json"
WORK_ROOT="${TMPDIR:-/tmp}/planetbintang-integrated-packages"

command -v gh >/dev/null || { echo "Install GitHub CLI: https://cli.github.com/" >&2; exit 1; }
command -v git >/dev/null || { echo "Git is required." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Run: gh auth login" >&2; exit 1; }
mkdir -p "$WORK_ROOT"
: > "$LOG_FILE"
printf '[\n' > "$CATALOG_FILE"

created=0
skipped=0
failed=0
first=1

publish_package() {
  local name="$1"
  local dir="$WORK_ROOT/$name"
  local repo="$OWNER/$name"
  rm -rf "$dir"
  mkdir -p "$dir/src" "$dir/assets/icons" "$dir/docs" "$dir/tests"

  cat > "$dir/package.json" <<EOF
{
  "name": "$name",
  "version": "1.0.0",
  "private": false,
  "type": "module",
  "description": "PlanetBintang desktop package for VMDESKTOPREIC",
  "exports": "./src/index.js",
  "files": ["src", "assets", "manifest.json", "README.md", "docs"],
  "scripts": { "test": "node --test", "check": "node --check src/index.js" },
  "keywords": ["planetbintang", "vmdesktopreic", "desktop-package", "reic"]
}
EOF

  cat > "$dir/manifest.json" <<EOF
{
  "id": "$name",
  "name": "$name",
  "version": "1.0.0",
  "type": "desktop-app",
  "platform": "VMDESKTOPREIC",
  "apiVersion": "1",
  "entry": "./src/index.js",
  "styles": ["./src/styles.css"],
  "icon": "./assets/icons/app.svg",
  "permissions": [],
  "capabilities": ["mount", "unmount", "settings", "events"],
  "integration": {
    "protocol": "planetbintang-desktop-package",
    "manifest": "./manifest.json",
    "module": "./src/index.js",
    "lifecycle": ["mount", "unmount"],
    "events": ["package:ready", "package:error"]
  }
}
EOF

  cat > "$dir/src/index.js" <<'EOF'
/** VMDESKTOPREIC package entry point. No privileged permissions by default. */
export const manifestUrl = new URL("../manifest.json", import.meta.url);

export function createApp(context = {}) {
  let root;
  return {
    mount(container) {
      if (!container) throw new TypeError("A desktop container is required");
      root = document.createElement("section");
      root.className = "pb-package";
      root.setAttribute("data-package", "PACKAGE_ID");
      const heading = document.createElement("h2");
      heading.textContent = context.title || "PACKAGE_TITLE";
      const status = document.createElement("p");
      status.textContent = "Paket siap dijalankan di VMDESKTOPREIC.";
      root.append(heading, status);
      container.append(root);
      context.events?.emit?.("package:ready", { id: "PACKAGE_ID" });
      return root;
    },
    unmount() {
      root?.remove();
      root = undefined;
    },
    getState() {
      return { id: "PACKAGE_ID", mounted: Boolean(root) };
    }
  };
}

export default { manifestUrl, createApp };
EOF
  sed -i "s/PACKAGE_ID/$name/g; s/PACKAGE_TITLE/$name/g" "$dir/src/index.js"

  cat > "$dir/src/styles.css" <<'EOF'
.pb-package {
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  padding: 1rem;
  color: var(--pb-text, #183344);
  background: var(--pb-surface, rgba(255,255,255,.88));
  font: inherit;
}
.pb-package h2 { margin: 0 0 .75rem; font-size: 1.1rem; }
EOF

  cat > "$dir/assets/icons/app.svg" <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="4" y="4" width="56" height="56" rx="12" fill="#167da5"/>
  <path d="M16 20h32M16 30h22M16 40h28" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
</svg>
EOF

  cat > "$dir/README.md" <<EOF
# $name

Paket aplikasi PlanetBintang untuk integrasi ke VMDESKTOPREIC.

## Integrasi
1. Baca `manifest.json` dan validasi `id`, `version`, `apiVersion`, `entry`, dan `permissions`.
2. Muat modul ES dari `src/index.js` melalui package loader desktop.
3. Panggil `createApp(context).mount(container)` saat jendela dibuka.
4. Panggil `unmount()` saat jendela ditutup.
5. Muat `src/styles.css` dalam ruang lingkup jendela paket.
6. Berikan hanya API/event bridge yang diizinkan. Paket ini tidak meminta izin istimewa secara default.

## Pengembangan
- `npm test`
- `npm run check`

Kontrak integrasi: `docs/integration.md`.
EOF

  cat > "$dir/docs/integration.md" <<'EOF'
# VMDESKTOPREIC integration contract

The desktop host should:
- validate the manifest and package origin before loading;
- enforce permissions and isolate package execution;
- provide a scoped container, theme tokens, settings and event bridge;
- call mount(container) on open and unmount() on close;
- reject undeclared capabilities and permissions;
- handle package errors without affecting other desktop windows.

This starter package uses browser DOM APIs and an ES module entry point.
A host adapter may be required if VMDESKTOPREIC uses a different runtime.
EOF

  cat > "$dir/tests/package.test.js" <<EOF
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/index.js";

test("package exports a lifecycle factory", () => {
  assert.equal(typeof createApp, "function");
  const app = createApp();
  assert.equal(typeof app.mount, "function");
  assert.equal(typeof app.unmount, "function");
});
EOF

  git -C "$dir" init -q
  git -C "$dir" checkout -q -b main
  git -C "$dir" add .
  git -C "$dir" -c user.name="PlanetBintang Automation" -c user.email="automation@users.noreply.github.com" commit -qm "Initialize VMDESKTOPREIC desktop package"

  if gh repo view "$repo" >/dev/null 2>&1; then
    printf 'SKIP existing %s (not overwritten)\n' "$repo" | tee -a "$LOG_FILE"
    skipped=$((skipped + 1))
    return 0
  fi

  if gh repo create "$repo" --public --source="$dir" --remote=origin --push --description "PlanetBintang VMDESKTOPREIC integrated desktop package"; then
    printf 'CREATED public package %s\n' "$repo" | tee -a "$LOG_FILE"
    created=$((created + 1))
    if (( first == 0 )); then printf ',\n' >> "$CATALOG_FILE"; fi
    first=0
    printf '  {"id":"%s","repository":"https://github.com/%s","manifest":"https://raw.githubusercontent.com/%s/main/manifest.json"}' "$name" "$repo" "$repo" >> "$CATALOG_FILE"
  else
    printf 'FAILED %s\n' "$repo" | tee -a "$LOG_FILE"
    failed=$((failed + 1))
  fi
  sleep 2
}

publish_package "pbdesktopworkspace"
publish_package "pbdesktoplauncher"
publish_package "pbdesktopwindow"
publish_package "pbdesktoppanel"
publish_package "pbdesktopshell"
publish_package "pbdesktopsession"
publish_package "pbdesktopdisplay"
publish_package "pbdesktopdesktopcore"
publish_package "pbdesktopdesktopui"
publish_package "pbdesktopdesktoptheme"
publish_package "pbdesktopmanager"
publish_package "pbdesktopbrowser"
publish_package "pbdesktopexplorer"
publish_package "pbdesktopstorage"
publish_package "pbdesktoparchive"
publish_package "pbdesktopbackup"
publish_package "pbdesktopsearch"
publish_package "pbdesktopindex"
publish_package "pbdesktopfilesystem"
publish_package "pbdesktoppermissions"
publish_package "pbdesktopeditor"
publish_package "pbdesktopcompiler"
publish_package "pbdesktopbuilder"
publish_package "pbdesktopdebugger"
publish_package "pbdesktopterminal"
publish_package "pbdesktopruntime"
publish_package "pbdesktoppackage"
publish_package "pbdesktoplibrary"
publish_package "pbdesktoptemplate"
publish_package "pbdesktopdeveloperkit"
publish_package "pbdesktopassistant"
publish_package "pbdesktopengine"
publish_package "pbdesktopagent"
publish_package "pbdesktopprompt"
publish_package "pbdesktopmodel"
publish_package "pbdesktopvision"
publish_package "pbdesktopspeech"
publish_package "pbdesktopknowledge"
publish_package "pbdesktopautomation"
publish_package "pbdesktopinference"
publish_package "pbdesktopgateway"
publish_package "pbdesktoprouter"
publish_package "pbdesktopresolver"
publish_package "pbdesktopdns"
publish_package "pbdesktopproxy"
publish_package "pbdesktopfirewall"
publish_package "pbdesktopmonitor"
publish_package "pbdesktopprotocol"
publish_package "pbdesktopconnection"
publish_package "pbdesktopnetworkcore"
publish_package "pbfilesworkspace"
publish_package "pbfileslauncher"
publish_package "pbfileswindow"
publish_package "pbfilespanel"
publish_package "pbfilesshell"
publish_package "pbfilessession"
publish_package "pbfilesdisplay"
publish_package "pbfilesdesktopcore"
publish_package "pbfilesdesktopui"
publish_package "pbfilesdesktoptheme"
publish_package "pbfilesmanager"
publish_package "pbfilesbrowser"
publish_package "pbfilesexplorer"
publish_package "pbfilesstorage"
publish_package "pbfilesarchive"
publish_package "pbfilesbackup"
publish_package "pbfilessearch"
publish_package "pbfilesindex"
publish_package "pbfilesfilesystem"
publish_package "pbfilespermissions"
publish_package "pbfileseditor"
publish_package "pbfilescompiler"
publish_package "pbfilesbuilder"
publish_package "pbfilesdebugger"
publish_package "pbfilesterminal"
publish_package "pbfilesruntime"
publish_package "pbfilespackage"
publish_package "pbfileslibrary"
publish_package "pbfilestemplate"
publish_package "pbfilesdeveloperkit"
publish_package "pbfilesassistant"
publish_package "pbfilesengine"
publish_package "pbfilesagent"
publish_package "pbfilesprompt"
publish_package "pbfilesmodel"
publish_package "pbfilesvision"
publish_package "pbfilesspeech"
publish_package "pbfilesknowledge"
publish_package "pbfilesautomation"
publish_package "pbfilesinference"
publish_package "pbfilesgateway"
publish_package "pbfilesrouter"
publish_package "pbfilesresolver"
publish_package "pbfilesdns"
publish_package "pbfilesproxy"
publish_package "pbfilesfirewall"
publish_package "pbfilesmonitor"
publish_package "pbfilesprotocol"
publish_package "pbfilesconnection"
publish_package "pbfilesnetworkcore"
publish_package "pbdeveloperworkspace"
publish_package "pbdeveloperlauncher"
publish_package "pbdeveloperwindow"
publish_package "pbdeveloperpanel"
publish_package "pbdevelopershell"
publish_package "pbdevelopersession"
publish_package "pbdeveloperdisplay"
publish_package "pbdeveloperdesktopcore"
publish_package "pbdeveloperdesktopui"
publish_package "pbdeveloperdesktoptheme"
publish_package "pbdevelopermanager"
publish_package "pbdeveloperbrowser"
publish_package "pbdeveloperexplorer"
publish_package "pbdeveloperstorage"
publish_package "pbdeveloperarchive"
publish_package "pbdeveloperbackup"
publish_package "pbdevelopersearch"
publish_package "pbdeveloperindex"
publish_package "pbdeveloperfilesystem"
publish_package "pbdeveloperpermissions"
publish_package "pbdevelopereditor"
publish_package "pbdevelopercompiler"
publish_package "pbdeveloperbuilder"
publish_package "pbdeveloperdebugger"
publish_package "pbdeveloperterminal"
publish_package "pbdeveloperruntime"
publish_package "pbdeveloperpackage"
publish_package "pbdeveloperlibrary"
publish_package "pbdevelopertemplate"
publish_package "pbdeveloperdeveloperkit"
publish_package "pbdeveloperassistant"
publish_package "pbdeveloperengine"
publish_package "pbdeveloperagent"
publish_package "pbdeveloperprompt"
publish_package "pbdevelopermodel"
publish_package "pbdevelopervision"
publish_package "pbdeveloperspeech"
publish_package "pbdeveloperknowledge"
publish_package "pbdeveloperautomation"
publish_package "pbdeveloperinference"
publish_package "pbdevelopergateway"
publish_package "pbdeveloperrouter"
publish_package "pbdeveloperresolver"
publish_package "pbdeveloperdns"
publish_package "pbdeveloperproxy"
publish_package "pbdeveloperfirewall"
publish_package "pbdevelopermonitor"
publish_package "pbdeveloperprotocol"
publish_package "pbdeveloperconnection"
publish_package "pbdevelopernetworkcore"
publish_package "pbaiworkspace"
publish_package "pbailauncher"
publish_package "pbaiwindow"
publish_package "pbaipanel"
publish_package "pbaishell"
publish_package "pbaisession"
publish_package "pbaidisplay"
publish_package "pbaidesktopcore"
publish_package "pbaidesktopui"
publish_package "pbaidesktoptheme"
publish_package "pbaimanager"
publish_package "pbaibrowser"
publish_package "pbaiexplorer"
publish_package "pbaistorage"
publish_package "pbaiarchive"
publish_package "pbaibackup"
publish_package "pbaisearch"
publish_package "pbaiindex"
publish_package "pbaifilesystem"
publish_package "pbaipermissions"
publish_package "pbaieditor"
publish_package "pbaicompiler"
publish_package "pbaibuilder"
publish_package "pbaidebugger"
publish_package "pbaiterminal"
publish_package "pbairuntime"
publish_package "pbaipackage"
publish_package "pbailibrary"
publish_package "pbaitemplate"
publish_package "pbaideveloperkit"
publish_package "pbaiassistant"
publish_package "pbaiengine"
publish_package "pbaiagent"
publish_package "pbaiprompt"
publish_package "pbaimodel"
publish_package "pbaivision"
publish_package "pbaispeech"
publish_package "pbaiknowledge"
publish_package "pbaiautomation"
publish_package "pbaiinference"
publish_package "pbaigateway"
publish_package "pbairouter"
publish_package "pbairesolver"
publish_package "pbaidns"
publish_package "pbaiproxy"
publish_package "pbaifirewall"
publish_package "pbaimonitor"
publish_package "pbaiprotocol"
publish_package "pbaiconnection"
publish_package "pbainetworkcore"
publish_package "pbnetworkworkspace"
publish_package "pbnetworklauncher"
publish_package "pbnetworkwindow"
publish_package "pbnetworkpanel"
publish_package "pbnetworkshell"
publish_package "pbnetworksession"
publish_package "pbnetworkdisplay"
publish_package "pbnetworkdesktopcore"
publish_package "pbnetworkdesktopui"
publish_package "pbnetworkdesktoptheme"
publish_package "pbnetworkmanager"
publish_package "pbnetworkbrowser"
publish_package "pbnetworkexplorer"
publish_package "pbnetworkstorage"
publish_package "pbnetworkarchive"
publish_package "pbnetworkbackup"
publish_package "pbnetworksearch"
publish_package "pbnetworkindex"
publish_package "pbnetworkfilesystem"
publish_package "pbnetworkpermissions"
publish_package "pbnetworkeditor"
publish_package "pbnetworkcompiler"
publish_package "pbnetworkbuilder"
publish_package "pbnetworkdebugger"
publish_package "pbnetworkterminal"
publish_package "pbnetworkruntime"
publish_package "pbnetworkpackage"
publish_package "pbnetworklibrary"
publish_package "pbnetworktemplate"
publish_package "pbnetworkdeveloperkit"
publish_package "pbnetworkassistant"
publish_package "pbnetworkengine"
publish_package "pbnetworkagent"
publish_package "pbnetworkprompt"
publish_package "pbnetworkmodel"
publish_package "pbnetworkvision"
publish_package "pbnetworkspeech"
publish_package "pbnetworkknowledge"
publish_package "pbnetworkautomation"
publish_package "pbnetworkinference"
publish_package "pbnetworkgateway"
publish_package "pbnetworkrouter"
publish_package "pbnetworkresolver"
publish_package "pbnetworkdns"
publish_package "pbnetworkproxy"
publish_package "pbnetworkfirewall"
publish_package "pbnetworkmonitor"
publish_package "pbnetworkprotocol"
publish_package "pbnetworkconnection"
publish_package "pbnetworknetworkcore"
publish_package "pbdataworkspace"
publish_package "pbdatalauncher"
publish_package "pbdatawindow"
publish_package "pbdatapanel"
publish_package "pbdatashell"
publish_package "pbdatasession"
publish_package "pbdatadisplay"
publish_package "pbdatadesktopcore"
publish_package "pbdatadesktopui"
publish_package "pbdatadesktoptheme"
publish_package "pbdatamanager"
publish_package "pbdatabrowser"
publish_package "pbdataexplorer"
publish_package "pbdatastorage"
publish_package "pbdataarchive"
publish_package "pbdatabackup"
publish_package "pbdatasearch"
publish_package "pbdataindex"
publish_package "pbdatafilesystem"
publish_package "pbdatapermissions"
publish_package "pbdataeditor"
publish_package "pbdatacompiler"
publish_package "pbdatabuilder"
publish_package "pbdatadebugger"
publish_package "pbdataterminal"
publish_package "pbdataruntime"
publish_package "pbdatapackage"
publish_package "pbdatalibrary"
publish_package "pbdatatemplate"
publish_package "pbdatadeveloperkit"
publish_package "pbdataassistant"
publish_package "pbdataengine"
publish_package "pbdataagent"
publish_package "pbdataprompt"
publish_package "pbdatamodel"
publish_package "pbdatavision"
publish_package "pbdataspeech"
publish_package "pbdataknowledge"
publish_package "pbdataautomation"
publish_package "pbdatainference"
publish_package "pbdatagateway"
publish_package "pbdatarouter"
publish_package "pbdataresolver"
publish_package "pbdatadns"
publish_package "pbdataproxy"
publish_package "pbdatafirewall"
publish_package "pbdatamonitor"
publish_package "pbdataprotocol"
publish_package "pbdataconnection"
publish_package "pbdatanetworkcore"
publish_package "pbmediaworkspace"
publish_package "pbmedialauncher"
publish_package "pbmediawindow"
publish_package "pbmediapanel"
publish_package "pbmediashell"
publish_package "pbmediasession"
publish_package "pbmediadisplay"
publish_package "pbmediadesktopcore"
publish_package "pbmediadesktopui"
publish_package "pbmediadesktoptheme"
publish_package "pbmediamanager"
publish_package "pbmediabrowser"
publish_package "pbmediaexplorer"
publish_package "pbmediastorage"
publish_package "pbmediaarchive"
publish_package "pbmediabackup"
publish_package "pbmediasearch"
publish_package "pbmediaindex"
publish_package "pbmediafilesystem"
publish_package "pbmediapermissions"
publish_package "pbmediaeditor"
publish_package "pbmediacompiler"
publish_package "pbmediabuilder"
publish_package "pbmediadebugger"
publish_package "pbmediaterminal"
publish_package "pbmediaruntime"
publish_package "pbmediapackage"
publish_package "pbmedialibrary"
publish_package "pbmediatemplate"
publish_package "pbmediadeveloperkit"
publish_package "pbmediaassistant"
publish_package "pbmediaengine"
publish_package "pbmediaagent"
publish_package "pbmediaprompt"
publish_package "pbmediamodel"
publish_package "pbmediavision"
publish_package "pbmediaspeech"
publish_package "pbmediaknowledge"
publish_package "pbmediaautomation"
publish_package "pbmediainference"
publish_package "pbmediagateway"
publish_package "pbmediarouter"
publish_package "pbmediaresolver"
publish_package "pbmediadns"
publish_package "pbmediaproxy"
publish_package "pbmediafirewall"
publish_package "pbmediamonitor"
publish_package "pbmediaprotocol"
publish_package "pbmediaconnection"
publish_package "pbmedianetworkcore"
publish_package "pbbusinessworkspace"
publish_package "pbbusinesslauncher"
publish_package "pbbusinesswindow"
publish_package "pbbusinesspanel"
publish_package "pbbusinessshell"
publish_package "pbbusinesssession"
publish_package "pbbusinessdisplay"
publish_package "pbbusinessdesktopcore"
publish_package "pbbusinessdesktopui"
publish_package "pbbusinessdesktoptheme"
publish_package "pbbusinessmanager"
publish_package "pbbusinessbrowser"
publish_package "pbbusinessexplorer"
publish_package "pbbusinessstorage"
publish_package "pbbusinessarchive"
publish_package "pbbusinessbackup"
publish_package "pbbusinesssearch"
publish_package "pbbusinessindex"
publish_package "pbbusinessfilesystem"
publish_package "pbbusinesspermissions"
publish_package "pbbusinesseditor"
publish_package "pbbusinesscompiler"
publish_package "pbbusinessbuilder"
publish_package "pbbusinessdebugger"
publish_package "pbbusinessterminal"
publish_package "pbbusinessruntime"
publish_package "pbbusinesspackage"
publish_package "pbbusinesslibrary"
publish_package "pbbusinesstemplate"
publish_package "pbbusinessdeveloperkit"
publish_package "pbbusinessassistant"
publish_package "pbbusinessengine"
publish_package "pbbusinessagent"
publish_package "pbbusinessprompt"
publish_package "pbbusinessmodel"
publish_package "pbbusinessvision"
publish_package "pbbusinessspeech"
publish_package "pbbusinessknowledge"
publish_package "pbbusinessautomation"
publish_package "pbbusinessinference"
publish_package "pbbusinessgateway"
publish_package "pbbusinessrouter"
publish_package "pbbusinessresolver"
publish_package "pbbusinessdns"
publish_package "pbbusinessproxy"
publish_package "pbbusinessfirewall"
publish_package "pbbusinessmonitor"
publish_package "pbbusinessprotocol"
publish_package "pbbusinessconnection"
publish_package "pbbusinessnetworkcore"
publish_package "pbsecurityworkspace"
publish_package "pbsecuritylauncher"
publish_package "pbsecuritywindow"
publish_package "pbsecuritypanel"
publish_package "pbsecurityshell"
publish_package "pbsecuritysession"
publish_package "pbsecuritydisplay"
publish_package "pbsecuritydesktopcore"
publish_package "pbsecuritydesktopui"
publish_package "pbsecuritydesktoptheme"
publish_package "pbsecuritymanager"
publish_package "pbsecuritybrowser"
publish_package "pbsecurityexplorer"
publish_package "pbsecuritystorage"
publish_package "pbsecurityarchive"
publish_package "pbsecuritybackup"
publish_package "pbsecuritysearch"
publish_package "pbsecurityindex"
publish_package "pbsecurityfilesystem"
publish_package "pbsecuritypermissions"
publish_package "pbsecurityeditor"
publish_package "pbsecuritycompiler"
publish_package "pbsecuritybuilder"
publish_package "pbsecuritydebugger"
publish_package "pbsecurityterminal"
publish_package "pbsecurityruntime"
publish_package "pbsecuritypackage"
publish_package "pbsecuritylibrary"
publish_package "pbsecuritytemplate"
publish_package "pbsecuritydeveloperkit"
publish_package "pbsecurityassistant"
publish_package "pbsecurityengine"
publish_package "pbsecurityagent"
publish_package "pbsecurityprompt"
publish_package "pbsecuritymodel"
publish_package "pbsecurityvision"
publish_package "pbsecurityspeech"
publish_package "pbsecurityknowledge"
publish_package "pbsecurityautomation"
publish_package "pbsecurityinference"
publish_package "pbsecuritygateway"
publish_package "pbsecurityrouter"
publish_package "pbsecurityresolver"
publish_package "pbsecuritydns"
publish_package "pbsecurityproxy"
publish_package "pbsecurityfirewall"
publish_package "pbsecuritymonitor"
publish_package "pbsecurityprotocol"
publish_package "pbsecurityconnection"
publish_package "pbsecuritynetworkcore"
publish_package "pbintegrationworkspace"
publish_package "pbintegrationlauncher"
publish_package "pbintegrationwindow"
publish_package "pbintegrationpanel"
publish_package "pbintegrationshell"
publish_package "pbintegrationsession"
publish_package "pbintegrationdisplay"
publish_package "pbintegrationdesktopcore"
publish_package "pbintegrationdesktopui"
publish_package "pbintegrationdesktoptheme"
publish_package "pbintegrationmanager"
publish_package "pbintegrationbrowser"
publish_package "pbintegrationexplorer"
publish_package "pbintegrationstorage"
publish_package "pbintegrationarchive"
publish_package "pbintegrationbackup"
publish_package "pbintegrationsearch"
publish_package "pbintegrationindex"
publish_package "pbintegrationfilesystem"
publish_package "pbintegrationpermissions"
publish_package "pbintegrationeditor"
publish_package "pbintegrationcompiler"
publish_package "pbintegrationbuilder"
publish_package "pbintegrationdebugger"
publish_package "pbintegrationterminal"
publish_package "pbintegrationruntime"
publish_package "pbintegrationpackage"
publish_package "pbintegrationlibrary"
publish_package "pbintegrationtemplate"
publish_package "pbintegrationdeveloperkit"
publish_package "pbintegrationassistant"
publish_package "pbintegrationengine"
publish_package "pbintegrationagent"
publish_package "pbintegrationprompt"
publish_package "pbintegrationmodel"
publish_package "pbintegrationvision"
publish_package "pbintegrationspeech"
publish_package "pbintegrationknowledge"
publish_package "pbintegrationautomation"
publish_package "pbintegrationinference"
publish_package "pbintegrationgateway"
publish_package "pbintegrationrouter"
publish_package "pbintegrationresolver"
publish_package "pbintegrationdns"
publish_package "pbintegrationproxy"
publish_package "pbintegrationfirewall"
publish_package "pbintegrationmonitor"
publish_package "pbintegrationprotocol"
publish_package "pbintegrationconnection"
publish_package "pbintegrationnetworkcore"

printf '\n]\n' >> "$CATALOG_FILE"
printf '\nSummary: created=%s skipped=%s failed=%s\n' "$created" "$skipped" "$failed"
printf 'Catalog: %s\nLog: %s\n' "$CATALOG_FILE" "$LOG_FILE"
if (( failed > 0 )); then exit 1; fi
