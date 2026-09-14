#!/bin/sh
set -eu

SRC=/src
APP=/app
PUB=/app/public

copy_file() {
  src="$1"
  dst="$2"
  mkdir -p "$(dirname "$dst")"
  cp "$SRC/$src" "$dst"
}

run_patch() {
  file="$1"
  copy_file "$file" "$APP/$file"
  node "$APP/$file"
  rm -f "$APP/$file"
}

echo "V1.8.3: consolidando histórico de patches..."

copy_file transparencia-v021.html "$PUB/transparencia.html"
copy_file v021-main.js "$PUB/v021-main.js"
run_patch v021-patch.mjs

copy_file v022-visual.css "$PUB/v022-visual.css"
copy_file v022-main.js "$PUB/v022-main.js"
copy_file service-worker-v022.js "$PUB/service-worker.js"
run_patch v022-patch.mjs

copy_file v0221-civic.css "$PUB/v0221-civic.css"
copy_file v0221-civic.js "$PUB/v0221-civic.js"
copy_file service-worker-v0221.js "$PUB/service-worker.js"
run_patch v0221-patch.mjs

copy_file v0222-contrast.css "$PUB/v0222-contrast.css"
copy_file service-worker-v0222.js "$PUB/service-worker.js"
run_patch v0222-patch.mjs

copy_file seguranca-v023.html "$PUB/seguranca.html"
copy_file v023-main.js "$PUB/v023-main.js"
copy_file service-worker-v023.js "$PUB/service-worker.js"
run_patch v023-patch.mjs

copy_file simulacao-v024.html "$PUB/simulacao.html"
copy_file v024-main.js "$PUB/v024-main.js"
copy_file service-worker-v024.js "$PUB/service-worker.js"
run_patch v024-patch.mjs

run_patch v0241-assets.mjs
copy_file v0241-photos.css "$PUB/v0241-photos.css"
copy_file v0241-photos.js "$PUB/v0241-photos.js"
copy_file service-worker-v0241.js "$PUB/service-worker.js"
run_patch v0241-patch.mjs

copy_file v100-main.js "$PUB/v100-main.js"
copy_file service-worker-v100.js "$PUB/service-worker.js"
run_patch v100-patch.mjs

copy_file v102-candidates.js "$PUB/v102-candidates.js"
copy_file v102-main.js "$PUB/v102-main.js"
copy_file service-worker-v102.js "$PUB/service-worker.js"
run_patch v102-patch.mjs

copy_file ensaio-v110.html "$PUB/ensaio.html"
copy_file v110-main.js "$PUB/v110-main.js"
copy_file service-worker-v110.js "$PUB/service-worker.js"
run_patch v110-patch.mjs

copy_file v111-cleanup.css "$PUB/v111-cleanup.css"
copy_file v111-main.js "$PUB/v111-main.js"
copy_file service-worker-v111.js "$PUB/service-worker.js"
run_patch v111-patch.mjs
run_patch v111-map-points.mjs

copy_file v121-polish.css "$PUB/v121-polish.css"
copy_file v121-polish.js "$PUB/v121-polish.js"
copy_file service-worker-v121.js "$PUB/service-worker.js"
run_patch v121-patch.mjs

copy_file v130-public.css "$PUB/v130-public.css"
copy_file v130-public.js "$PUB/v130-public.js"
copy_file service-worker-v130.js "$PUB/service-worker.js"
run_patch v130-patch.mjs

copy_file v131-refine-runtime.js "$PUB/v131-refine-runtime.js"
copy_file service-worker-v131.js "$PUB/service-worker.js"
run_patch v131-patch.mjs

copy_file v135-install.js "$PUB/v135-install.js"
run_patch v135-patch.mjs

copy_file admin-v140.html "$PUB/admin.html"
copy_file admin-v140.css "$PUB/admin.css"
copy_file admin-v140.js "$PUB/admin.js"
copy_file admin-v140.webmanifest "$PUB/admin.webmanifest"
run_patch admin-v142-patch.mjs

run_patch v150-unified-app.mjs
run_patch v151-access-photo.mjs
run_patch v153-regional-theme.mjs
run_patch v157-polish.mjs
run_patch v160-flow.mjs
run_patch v162-clean-photo.mjs
run_patch v165-party-label-fix.mjs
run_patch v174-bu-validation.mjs
run_patch v175-section-lock.mjs
run_patch v176-integrity.mjs
run_patch v177-friendly-routes.mjs
run_patch v178-backup.mjs
run_patch v179-emergency-restore.mjs
run_patch v180-performance.mjs
run_patch v181-smart-refresh.mjs

# O shell consolidado parte da identificação V1.8.2; a V1.8.3 endurece o leitor de BU.
sed -i "s/const VERSION='v1.8.1-unified';/const VERSION='v1.8.2-unified';/" "$PUB/service-worker.js"
run_patch v183-bu-scanner.mjs

# Preflight final consolidado substitui dezenas de checks intermediários.
node --check "$APP/server.mjs"
node --check "$PUB/service-worker.js"
node --check "$PUB/bu-parser.js"
node --check "$PUB/v130-public.js"
node --check "$PUB/v0241-photos.js"
node --check "$PUB/v174-bu-validation.js"
node --check "$PUB/v175-section-lock.js"
node --check "$PUB/v176-integrity.js"
node --check "$PUB/v178-backup.js"
node --check "$PUB/v179-restore.js"

test -f "$PUB/index.html"
test -f "$PUB/transparencia.html"
test -f "$PUB/operacao.html"
test -f "$PUB/admin/index.html"
test -f "$PUB/apuracao.html"
test -f "$PUB/data/candidate-catalog.json"
test -f "$PUB/data/candidate-photo-map.json"

grep -q 'CE180_MAX_PHOTO_LOADS' "$PUB/v130-public.js"
grep -q 'CE181 snapshot request' "$PUB/index.html"
grep -q 'CE181 snapshot request' "$PUB/transparencia.html"
grep -q 'CE183 — leitor robusto' "$PUB/bu-parser.js"
grep -q 'BUParser.verifyHashChain(qrSession.parts)' "$PUB/operacao.html"
grep -q 'hashChainVerified' "$PUB/operacao.html"
grep -q "event:'section_locked_write_denied'" "$APP/server.mjs"
grep -q "p === '/api/admin/backups/restore'" "$APP/server.mjs"
grep -q "const VERSION='v1.8.3-unified'" "$PUB/service-worker.js"

echo "V1.8.3: leitor de BU e build consolidados concluídos e validados."
