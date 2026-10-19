#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# The source folder currently contains art/data modules only. Never replace the
# playable bundle until the application entry point and source styles exist.
if [[ ! -f src/08-app.js ]]; then
  echo "Build stopped safely: src/08-app.js (game startup/runtime) is missing. Existing game files were left untouched." >&2
  exit 1
fi
shopt -s nullglob
js_sources=(src/*.js)
css_sources=(src/*.css)
if ((${#css_sources[@]} == 0)); then
  echo "Build stopped safely: no src/*.css files exist. Existing game files were left untouched." >&2
  exit 1
fi

tmp_js=$(mktemp ./js/.open-world.XXXXXX.js)
tmp_css=$(mktemp ./css/.open-world.XXXXXX.css)
trap 'rm -f "$tmp_js" "$tmp_css"' EXIT
{
  echo '(() => {'
  echo "'use strict';"
  for file in "${js_sources[@]}"; do
    printf '/* ===== %s ===== */\n' "$file"
    cat "$file"
    printf '\n'
  done
  echo '})();'
} > "$tmp_js"
cat "${css_sources[@]}" > "$tmp_css"
node --check "$tmp_js"
[[ -s "$tmp_js" && -s "$tmp_css" ]]
mv "$tmp_js" js/open-world.js
mv "$tmp_css" css/open-world.css
trap - EXIT
echo "Build complete: $(wc -l < js/open-world.js) JS lines, $(wc -c < css/open-world.css) CSS bytes"
