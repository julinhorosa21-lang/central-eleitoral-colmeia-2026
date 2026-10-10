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

echo "V2.2.9: consolidando histórico de patches..."

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

sed -i "s/const VERSION='v1.8.1-unified';/const VERSION='v1.8.2-unified';/" "$PUB/service-worker.js"
run_patch v183-bu-scanner.mjs
copy_file ce184-verify.py "$APP/ce184-verify.py"
run_patch v184-bu-signature.mjs
run_patch v1842-test-bu.mjs
run_patch v187-candidate-integrity.mjs
run_patch v186-test-suite.mjs
run_patch v185-interface.mjs
run_patch v186-visual-qa.mjs
run_patch v187-interface.mjs
run_patch v188-clean-qrbu-test-data.mjs
run_patch v189-identity.mjs
run_patch v190-performance.mjs
run_patch v191-share.mjs
run_patch v192-sections.mjs
run_patch v193-operations.mjs
run_patch v194-performance.mjs
run_patch v195-display.mjs
run_patch v196-fixes.mjs
run_patch v197-remove-test-banner.mjs
run_patch v198-remove-banner.mjs
run_patch v199-qrbu-stress.mjs
run_patch v200-resultados-public.mjs
run_patch v201-workspace.mjs
run_patch v202-contrast.mjs
run_patch v203-modal-scroll.mjs
run_patch v204-bu-form-scroll.mjs
run_patch v205-bu-modal.mjs
run_patch v206-register-bu.mjs
run_patch v207-speed.mjs
run_patch v208-analytics.mjs
run_patch v209-candidate-audit.mjs
run_patch v210-ea20-patch.mjs
run_patch v211-reconciliation-patch.mjs
run_patch v212-candidate-fixes.mjs
run_patch v214-bu-fluid.mjs
run_patch v215-form-stability.mjs
run_patch v216-share-top3.mjs
node /src/v216-share-tests.mjs
run_patch v217-official-live.mjs
node /src/v217-official-tests.mjs
run_patch v218-share-official.mjs
node /src/v218-share-tests.mjs
run_patch v219-manual-bu-only.mjs
run_patch v220-second-turn.mjs
run_patch v221-auto-update.mjs
run_patch v222-runoff-polish.mjs
run_patch v223-runoff-safety.mjs
run_patch v224-runoff-audit.mjs
run_patch v225-runoff-minimal-assets.mjs
run_patch v226-first-turn-purge.mjs
run_patch v227-ballot-names.mjs
run_patch v228-operator-all-sections.mjs
run_patch v229-tse-interface.mjs
run_patch v230-admin-only.mjs
run_patch v231-persistent-sqlite.mjs
run_patch v232-secure-fast-operation.mjs
run_patch v233-ready-sections.mjs
run_patch v234-section-context.mjs
run_patch v237-operation-header-offset.mjs
run_patch v238-manual-only.mjs
run_patch v239-share-photos-no-rank.mjs
run_patch v240-public-map-winners.mjs

echo "V2.2.9: executando preflight final do segundo turno..."

node --check "$APP/server.mjs"
node --check "$PUB/v220-second-turn.js"
node --check "$PUB/bu-parser.js"
node --check "$PUB/service-worker.js"

grep -q "CE220_SECOND_TURN_2026" "$APP/server.mjs"
grep -q "CE220_QR_SECOND_TURN_GUARD" "$PUB/operacao.html"
grep -q "CE225_RUNOFF_ONLY_CANDIDATES" "$PUB/v220-second-turn.js"
grep -q "CE226_FIRST_TURN_PURGE" "$APP/server.mjs"
grep -q "2026-10-25T17:00:00-03:00" "$PUB/v187-ui.js"
grep -q "v2.2.9-public-map-winners" "$PUB/service-worker.js"
grep -q "v135-install.js?v=240" "$PUB/index.html"
grep -q "v135-install.js?v=240" "$PUB/transparencia.html"

test ! -f "$PUB/v0241-photos.js"
test ! -f "$PUB/v0241-photos.css"
test ! -f "$PUB/data/candidate-photo-map.json"

for f in \
  "$PUB/candidate-photos/2t-presidente-13.jpg" \
  "$PUB/candidate-photos/2t-presidente-22.jpg" \
  "$PUB/candidate-photos/2t-governador-44.jpg" \
  "$PUB/candidate-photos/2t-governador-45.jpg"
do
  test -s "$f"
done

test "$(find "$PUB/candidate-photos" -maxdepth 1 -type f | wc -l | tr -d ' ')" = "4"

node - <<'NODE'
const fs=require('fs');
const p='/app/public/data/candidate-catalog.json';
const c=JSON.parse(fs.readFileSync(p,'utf8'));
const keys=Object.keys(c.candidates||{}).sort();
if(keys.join(',')!=='governador,presidente') throw new Error('catalog cargos mismatch: '+keys.join(','));
if(c.version!=='2.1.7-ballot-names') throw new Error('catalog version mismatch: '+c.version);
if(Number(c.turno)!==2) throw new Error('catalog turno mismatch');
if(c.electionDate!=='2026-10-25') throw new Error('catalog date mismatch');
const nums=(cargo)=>(c.candidates?.[cargo]||[]).map(x=>String(x.numero)).sort();
if(nums('presidente').join(',')!=='13,22') throw new Error('president finalists mismatch: '+nums('presidente'));
if(nums('governador').join(',')!=='44,45') throw new Error('governor finalists mismatch: '+nums('governador'));
const gov=Object.fromEntries((c.candidates?.governador||[]).map(x=>[String(x.numero),String(x.nome||'')]));
if(gov['44']!=='PROFESSORA DORINHA') throw new Error('governor 44 ballot name mismatch: '+gov['44']);
if(gov['45']!=='VICENTINHO JÚNIOR') throw new Error('governor 45 ballot name mismatch: '+gov['45']);
console.log('V2.1.7 catalog preflight: presidente 13/22; governador 44 PROFESSORA DORINHA / 45 VICENTINHO JÚNIOR.');
NODE

! grep -q "CE223_SAFE_SECOND_TURN_ARCHIVE" "$APP/server.mjs"
grep -q "firstTurnPreserved:false" "$APP/server.mjs"

grep -q "CE228_OPERATOR_ALL_SECTIONS" "$APP/server.mjs"
grep -q "CE228_GLOBAL_OPERATOR_WRITE" "$APP/server.mjs"
grep -q "/v228-operator-all-sections.js" "$PUB/operacao.html"
node --check "$PUB/v228-operator-all-sections.js"

grep -q "/v229-tse-interface.css" "$PUB/index.html"
grep -q "/v229-tse-interface.js" "$PUB/index.html"
grep -q "ce229-summary" "$PUB/v229-tse-interface.js"
grep -q "ce229-round-badge" "$PUB/v229-tse-interface.js"
grep -q -- "--ce229-yellow:#e9b800" "$PUB/v229-tse-interface.css"
node --check "$PUB/v229-tse-interface.js"

grep -q "CE230_ADMIN_ONLY_AUTH" "$APP/server.mjs"
grep -q "function ce230LegacyAuth(req)" "$APP/server.mjs"
grep -q "/v230-admin-only.js" "$PUB/operacao.html"
node --check "$PUB/v230-admin-only.js"

grep -q "CE231_PERSISTENT_SQLITE_RESTORE" "$APP/server.mjs"
grep -q "CE231_PERSISTENT_SQLITE_SNAPSHOT" "$APP/server.mjs"
grep -q "CE231_RUNOFF_META" "$APP/server.mjs"
grep -q "p === '/api/admin/persistence'" "$APP/server.mjs"
grep -q '"pg"' "$APP/package.json"

grep -q "/v232-operational-gate.js" "$PUB/operacao.html"
grep -q "/v232-public-access.js" "$PUB/index.html"
grep -q "CE232_LIGHT_ADMIN_SECTIONS" "$PUB/v230-admin-only.js"
grep -q "CE232_OPERATION_STATIC_CONTRAST" "$PUB/v202-contrast.js"
node --check "$PUB/v232-operational-gate.js"
node --check "$PUB/v232-public-access.js"
node --check "$PUB/v230-admin-only.js"
test "$(grep -c "new MutationObserver(()=>{if(adminOk)requestAnimationFrame(expand)" "$PUB/v230-admin-only.js" || true)" = "0"

grep -q "data-mode=\"manual\"" "$PUB/v232-operational-gate.js"
grep -q "ce232LaunchSelected" "$PUB/v232-operational-gate.js"
grep -q "ce232-section-actions" "$PUB/v232-access.css"
node --check "$PUB/v232-operational-gate.js"

grep -q "CE235_ROOT_SECTION" "$PUB/operacao.html"
grep -q "openPlace(id,preferredSection=null)" "$PUB/operacao.html"
grep -q "else secs=allSections" "$PUB/operacao.html"
grep -q "adminSection.onchange=()=>" "$PUB/operacao.html"
grep -q "const CARGOS={presidente:'Presidente',governador:'Governador'}" "$PUB/operacao.html"
grep -q "/v232-operational-gate.js?v=238" "$PUB/operacao.html"
node --check "$PUB/v232-operational-gate.js"

grep -q "CE237_OPERATION_HEADER_OFFSET" "$PUB/v232-access.css"
grep -q "v232-access.css?v=238" "$PUB/operacao.html"
grep -q "position:sticky!important" "$PUB/v232-access.css"

grep -q "CE238_MANUAL_ONLY" "$PUB/v232-operational-gate.js"
! grep -q 'data-mode="qr"' "$PUB/v232-operational-gate.js"
grep -q 'data-mode="manual"' "$PUB/v232-operational-gate.js"
grep -q "ce238RemoveQrUi" "$PUB/v232-operational-gate.js"
grep -q "CE238_MANUAL_ONLY_UI" "$PUB/v232-access.css"
grep -q "/v232-operational-gate.js?v=238" "$PUB/operacao.html"
node --check "$PUB/v232-operational-gate.js"

grep -q "CE239_NO_CANDIDATE_RANK_BADGES" "$PUB/v157-polish.js"
! grep -q "s.textContent=(i+1)+'º'" "$PUB/v157-polish.js"
grep -q "/candidate-photos/2t-" "$PUB/v191-share.js"
grep -q "foto_indisponivel" "$PUB/v191-share.js"
! grep -q "ctx.fillText(c.posicao+'º'" "$PUB/v191-share.js"
grep -q "v191-share.js?v=239" "$PUB/index.html"
grep -q "v229-tse-interface.js?v=239" "$PUB/index.html"

grep -q "CE240_PUBLIC_PLACE_WINNERS" "$APP/server.mjs"
grep -q "p === '/api/public/place-winners'" "$APP/server.mjs"
grep -q "source:'manual_local_results'" "$APP/server.mjs"
grep -q "n===113?49:n" "$APP/server.mjs"
grep -q "/v240-public-map-winners.js?v=240" "$PUB/index.html"
grep -q "CE240_NO_OPERATION_MAP" "$PUB/v232-access.css"
node --check "$PUB/v240-public-map-winners.js"

echo "V2.2.9 FINAL PREFLIGHT PASSED: mapa público, operação sem mapa e vencedores por colégio após conclusão local."
