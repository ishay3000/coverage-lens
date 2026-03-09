#!/usr/bin/env bash
# Package the extension for Firefox (MV2) or Chrome (MV3).
#
# Usage: ./build.sh [firefox|chrome]

set -euo pipefail
cd "$(dirname "$0")"

TARGET="${1:-firefox}"

LIB_FILES="lib/jszip.min.js lib/cobertura-parser.js lib/coverage-loader.js lib/github-api.js lib/cache.js lib/path-matcher.js lib/diagnostics.js lib/indicators.js"
SHARED_FILES="content.js content.css popup.html popup.js"

case "$TARGET" in
  firefox)
    OUTDIR="dist/firefox"
    rm -rf "$OUTDIR" && mkdir -p "$OUTDIR/lib"
    cp manifest.json "$OUTDIR/"
    cp background.js "$OUTDIR/"
    for f in $LIB_FILES; do cp "$f" "$OUTDIR/$f"; done
    for f in $SHARED_FILES; do cp "$f" "$OUTDIR/"; done
    echo "Packaged Firefox extension in $OUTDIR/"
    echo "Load as temporary add-on from about:debugging"
    ;;
  chrome)
    OUTDIR="dist/chrome"
    rm -rf "$OUTDIR" && mkdir -p "$OUTDIR/lib"
    cp manifest.chrome.json "$OUTDIR/manifest.json"
    cp background-sw.js "$OUTDIR/"
    for f in $LIB_FILES; do cp "$f" "$OUTDIR/$f"; done
    for f in $SHARED_FILES; do cp "$f" "$OUTDIR/"; done
    echo "Packaged Chrome extension in $OUTDIR/"
    echo "Load from chrome://extensions > Developer mode > Load unpacked"
    ;;
  *)
    echo "Usage: $0 [firefox|chrome]" >&2
    exit 1
    ;;
esac
