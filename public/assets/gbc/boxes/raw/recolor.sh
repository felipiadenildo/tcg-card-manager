#!/usr/bin/env bash
# Regenerates the 8 colored box border tiles (4 corners, 4 edges) from the
# 3 raw grayscale sources in this folder. Run this any time you want to
# try different colors, instead of redoing the extraction by hand.
#
# Usage:
#   ./recolor.sh <outline> <light> <dark> <cream>
#
# Example (the current default):
#   ./recolor.sh "#4A1414" "#C24545" "#8A2828" "#E6E6C5"

set -euo pipefail

OUTLINE="${1:?outline color required, e.g. #4A1414}"
LIGHT="${2:?light color required, e.g. #C24545}"
DARK="${3:?dark color required, e.g. #8A2828}"
CREAM="${4:?cream/fill color required, e.g. #E6E6C5}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$SCRIPT_DIR/.."

recolor() {
  convert "$SCRIPT_DIR/$1" \
    -fill "$OUTLINE" -opaque "#000000" \
    -fill "$LIGHT"   -opaque "#AAAAAA" \
    -fill "$DARK"    -opaque "#555555" \
    -fill "$CREAM"   -opaque "#FFFFFF" \
    "$2"
}

recolor raw-corner.png  "$OUT_DIR/gbc-box-corner-tl.png"
convert "$OUT_DIR/gbc-box-corner-tl.png" -rotate 90  "$OUT_DIR/gbc-box-corner-tr.png"
convert "$OUT_DIR/gbc-box-corner-tl.png" -rotate 180 "$OUT_DIR/gbc-box-corner-br.png"
convert "$OUT_DIR/gbc-box-corner-tl.png" -rotate 270 "$OUT_DIR/gbc-box-corner-bl.png"

recolor raw-edge-h.png "$OUT_DIR/gbc-box-edge-top.png"
convert "$OUT_DIR/gbc-box-edge-top.png" -flip "$OUT_DIR/gbc-box-edge-bottom.png"

recolor raw-edge-v.png "$OUT_DIR/gbc-box-edge-left.png"
convert "$OUT_DIR/gbc-box-edge-left.png" -flop "$OUT_DIR/gbc-box-edge-right.png"

echo "Done. Regenerated 8 files in $OUT_DIR."
