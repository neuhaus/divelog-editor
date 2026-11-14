#!/bin/sh
#
# Assemble a clean, deployable copy of the site in dist/: the files a web
# server needs to serve the editor from https://neuhaus.github.io/divelog-editor/.
#
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DIST="$ROOT/dist"

# Everything that goes into the deployment, relative to the project root.
SITE="
index.html
LICENCE.md
divelog-editor.svg
css
js
"

rm -rf "$DIST"
for f in $SITE; do
    dest="$DIST/$(dirname -- "$f")"
    mkdir -p "$dest"
    cp -R "$ROOT/$f" "$dest/"
done

echo "wrote $DIST"
