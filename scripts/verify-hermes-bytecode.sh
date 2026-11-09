#!/usr/bin/env bash
# Fails if the release JS bundle is plain text instead of Hermes bytecode.
# usage: scripts/verify-hermes-bytecode.sh <path/to/app.aab|app.apk|main.jsbundle>
set -euo pipefail
target="${1:?path to .aab/.apk/.jsbundle required}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
case "$target" in
  *.aab|*.apk) unzip -q -o "$target" -d "$tmp"; bundle="$(find "$tmp" -name 'index.android.bundle' | head -n1)";;
  *) bundle="$target";;
esac
[ -n "${bundle:-}" ] && [ -f "$bundle" ] || { echo "bundle not found"; exit 1; }
if file "$bundle" | grep -qi 'Hermes'; then echo "OK: Hermes bytecode"; else
  echo "FAIL: bundle is not Hermes bytecode"; exit 1; fi
if grep -aq "console.log" "$bundle"; then echo "FAIL: console.log string present in bundle"; exit 1; fi
