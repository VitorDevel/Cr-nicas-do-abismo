#!/bin/bash
# concatena as partes em um único closure
cd "$(dirname "$0")"
{ echo "(() => {"; echo "'use strict';"; for f in src/*.js; do echo "/* ===== $f ===== */"; cat "$f"; echo; done; echo "})();"; } > js/open-world.js
cat src/*.css > css/open-world.css 2>/dev/null || true
node --check js/open-world.js && echo "OK $(wc -l < js/open-world.js) linhas JS, $(wc -c < css/open-world.css) bytes CSS"
