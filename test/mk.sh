#!/bin/bash
# uso: ./test/mk.sh [nome]   -> gera test/<nome>/bundle.js e test/<nome>/test.html (escopo global, sem IIFE)
# arquivos de src com erro de sintaxe são ignorados (aviso), para não quebrar quem trabalha em paralelo.
cd "$(dirname "$0")/.."
N="${1:-main}"; D="test/$N"; mkdir -p "$D"
: > "$D/bundle.js"
for f in src/*.js; do
  if node -e "new Function(require('fs').readFileSync('$f','utf8'))" 2>/dev/null; then echo "/* ===== $f ===== */" >> "$D/bundle.js"; cat "$f" >> "$D/bundle.js"; echo >> "$D/bundle.js";
  else echo "AVISO: $f ignorado (erro de sintaxe)"; fi
done
sed -e 's#js/open-world.js#bundle.js#' -e 's#href="css/#href="../../css/#' open-world.html > "$D/test.html"
echo "bundle $D OK ($(wc -l < $D/bundle.js) linhas)"
