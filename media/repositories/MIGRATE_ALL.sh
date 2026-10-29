#!/usr/bin/env bash
set -Eeuo pipefail

# PlanetBintang repository migration runner.
# Run locally in a secure workspace with Git + GitHub CLI installed.
# This script does NOT push private source contents into .L or GitHub Pages.
# It creates complete mirror bundles in a local output directory; these preserve
# Git refs/history but do not replace a file-by-file working-tree export.
#
# Usage:
#   gh auth status
#   bash media/repositories/MIGRATE_ALL.sh [output-directory]
#
# Protect the output directory as private data. Do not upload bundles to a public repo.

ORG="planetbintang"
OUT="${1:-$PWD/planetbintang-migration-output}"
mkdir -p "$OUT"
chmod 700 "$OUT"
command -v git >/dev/null || { echo "ERROR: git is required" >&2; exit 2; }
command -v gh >/dev/null || { echo "ERROR: GitHub CLI (gh) is required" >&2; exit 2; }
gh auth status >/dev/null

# Read catalog directly from the current checkout. Requires jq.
command -v jq >/dev/null || { echo "ERROR: jq is required" >&2; exit 2; }
CATALOG="media/repositories/index.json"
[[ -f "$CATALOG" ]] || { echo "ERROR: run from the .L repository root; $CATALOG missing" >&2; exit 2; }

MANIFEST="$OUT/migration-results.tsv"
printf 'repository\tvisibility\tbranch\tstatus\tcommit\tmessage\n' > "$MANIFEST"

# Catalog schema is intentionally parsed dynamically. Each entry must contain a name,
# visibility and default branch; unsupported shapes are skipped rather than guessed.
jq -e 'type == "array" or type == "object"' "$CATALOG" >/dev/null
jq -r '
  (if type == "array" then . else (.repositories // .items // []) end)
  | .[]
  | [(.name // .full_name // ""), (.visibility // ""), (.default_branch // .branch // "")]
  | @tsv
' "$CATALOG" | while IFS=$'\t' read -r name visibility branch; do
  [[ -n "$name" ]] || continue
  # Only accept repository names, not arbitrary paths.
  if [[ "$name" == */* ]]; then name="${name##*/}"; fi
  if [[ ! "$name" =~ ^[A-Za-z0-9._-]+$ ]]; then
    printf '%s\t%s\t%s\tskipped\t\tinvalid repository name\n' "$name" "$visibility" "$branch" >> "$MANIFEST"
    continue
  fi
  url="https://github.com/$ORG/$name.git"
  dest="$OUT/$name.git"
  echo "==> Mirroring $ORG/$name ($visibility)"
  if [[ -d "$dest" ]]; then
    if git -C "$dest" remote update --prune; then
      status="updated"
    else
      printf '%s\t%s\t%s\tfailed\t\tremote update failed\n' "$name" "$visibility" "$branch" >> "$MANIFEST"
      continue
    fi
  else
    if ! git clone --mirror "$url" "$dest"; then
      printf '%s\t%s\t%s\tfailed\t\tclone failed; verify access and repo availability\n' "$name" "$visibility" "$branch" >> "$MANIFEST"
      continue
    fi
    status="mirrored"
  fi
  if ! git -C "$dest" fsck --full >/dev/null 2>&1; then
    printf '%s\t%s\t%s\tfailed\t\tgit fsck failed\n' "$name" "$visibility" "$branch" >> "$MANIFEST"
    continue
  fi
  bundle="$OUT/$name.bundle"
  if git -C "$dest" bundle create "$bundle" --all && git bundle verify "$bundle" >/dev/null 2>&1; then
    commit="$(git -C "$dest" rev-parse --verify HEAD 2>/dev/null || echo no-HEAD)"
    printf '%s\t%s\t%s\t%s\t%s\tverified mirror bundle\n' "$name" "$visibility" "$branch" "$status" "$commit" >> "$MANIFEST"
  else
    printf '%s\t%s\t%s\tfailed\t\tbundle creation/verification failed\n' "$name" "$visibility" "$branch" >> "$MANIFEST"
  fi
done

echo
echo "Finished processing catalog entries. Review: $MANIFEST"
echo "This creates local mirror bundles; it does not claim a destination import or Pages deployment."
echo "For each repo, import the bundle into a correctly permissioned destination, then verify file counts/checksums."
