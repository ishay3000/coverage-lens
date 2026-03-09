#!/usr/bin/env bash
# Package the extension for Firefox (MV2).
# Chrome MV3 support coming later.
#
# Usage: ./build.sh [firefox]

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
    echo "Chrome MV3 support not yet implemented." >&2
    echo "Use Firefox for now." >&2
    exit 1
    ;;
  *)
    echo "Usage: $0 [firefox]" >&2
    exit 1
    ;;
esac
