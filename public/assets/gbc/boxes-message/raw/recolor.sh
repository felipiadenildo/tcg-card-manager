#!/usr/bin/env bash
# Same idea as boxes/raw/recolor.sh, for the simple message box style
# (box_messages.png, pret/poketcg). No cream highlight gap in this one,
# just a groove line: black, light, black, dark, light, cream.
#
# Usage: ./recolor.sh <outline> <light> <dark> <cream>

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

recolor raw-corner.png  "$OUT_DIR/gbc-msgbox-corner-tl.png"
convert "$OUT_DIR/gbc-msgbox-corner-tl.png" -rotate 90  "$OUT_DIR/gbc-msgbox-corner-tr.png"
convert "$OUT_DIR/gbc-msgbox-corner-tl.png" -rotate 180 "$OUT_DIR/gbc-msgbox-corner-br.png"
convert "$OUT_DIR/gbc-msgbox-corner-tl.png" -rotate 270 "$OUT_DIR/gbc-msgbox-corner-bl.png"

recolor raw-edge-h.png "$OUT_DIR/gbc-msgbox-edge-top.png"
convert "$OUT_DIR/gbc-msgbox-edge-top.png" -flip "$OUT_DIR/gbc-msgbox-edge-bottom.png"

recolor raw-edge-v.png "$OUT_DIR/gbc-msgbox-edge-left.png"
convert "$OUT_DIR/gbc-msgbox-edge-left.png" -flop "$OUT_DIR/gbc-msgbox-edge-right.png"

echo "Done. Regenerated 8 files in $OUT_DIR."
