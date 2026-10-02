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

echo "V2.0.11: consolidando histórico de patches..."

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

node --check "$APP/server.mjs"
node --check "$APP/v210-ea20.mjs"
node --check "$PUB/v210-official-panel.js"
node --check "$PUB/v211-reconciliation.js"
node --check "$APP/tse-sync.mjs"
node --check "$PUB/service-worker.js"
node --check "$PUB/bu-parser.js"
node --check "$PUB/v130-public.js"
node --check "$PUB/v0241-photos.js"
node --check "$PUB/v174-bu-validation.js"
node --check "$PUB/v175-section-lock.js"
node --check "$PUB/v176-integrity.js"
node --check "$PUB/v178-backup.js"
node --check "$PUB/v179-restore.js"
node --check "$PUB/v185-icons.js"
node --check "$PUB/v186-visual-qa.js"
node --check "$PUB/v187-ui.js"
node --check "$PUB/v189-identity.js"
node --check "$PUB/v191-share.js"
node --check "$PUB/v192-sections.js"
node --check "$PUB/v193-operations.js"
node --check "$PUB/v194-fastpath.js"
node --check "$PUB/v195-display.js"
node --check "$PUB/v198-remove-banner.js"
node --check "$PUB/v200-resultados-public.js"
node --check "$PUB/v208-analytics.js"
node --check "$PUB/v208-admin-analytics.js"
node --check "$PUB/v209-admin-audit.js"
node --check "$PUB/v201-workspace.js"
node --check "$PUB/v202-contrast.js"
node --check "$PUB/v203-modal-scroll.js"
node --check "$PUB/v204-bu-form-scroll.js"
node --check "$PUB/v205-bu-modal.js"
node --check "$PUB/v202-contrast.js"
node --check "$PUB/v200-resultados-public.js"

test -f "$PUB/index.html"
test -f "$PUB/transparencia.html"
test -f "$PUB/operacao.html"
test -f "$PUB/admin/index.html"
test -f "$PUB/apuracao.html"
test -f "$PUB/data/candidate-catalog.json"
test -f "$PUB/data/candidate-photo-map.json"
test -f "$PUB/teste-bu.html"
test -f "$PUB/teste-bu/qr-1.png"
test -f "$PUB/teste-bu/qr-2.png"
test -f "$PUB/teste-29-bus.html"
test -f "$PUB/teste-29-bus/manifest.json"
test -f "$PUB/v185-interface.css"
test -f "$PUB/v185-icons.js"
test -f "$PUB/v186-visual-qa.css"
test -f "$PUB/v186-visual-qa.js"
test -f "$PUB/v187-ui.css"
test -f "$PUB/v187-ui.js"
test -f "$PUB/v189-identity.css"
test -f "$PUB/v189-identity.js"
test -f "$PUB/v191-share.css"
test -f "$PUB/v191-share.js"
test -f "$PUB/v192-sections.css"
test -f "$PUB/v192-sections.js"
test -f "$PUB/v193-operations.css"
test -f "$PUB/v193-operations.js"
test -f "$PUB/v194-fastpath.js"
test -f "$PUB/v194-performance.css"
test -f "$PUB/v195-display.css"
test -f "$PUB/v195-display.js"
test -f "$PUB/v198-remove-banner.css"
test -f "$PUB/v198-remove-banner.js"
test -f "$PUB/teste-qrbu-9.html"
test -f "$PUB/teste-qrbu-9/manifest.json"
test -f "$PUB/teste-qrbu-9/qr-9.png"
test -f "$PUB/v200-resultados-public.css"
test -f "$PUB/v200-resultados-public.js"
test -f "$PUB/v201-workspace.css"
test -f "$PUB/v201-workspace.js"
test -f "$PUB/v202-contrast.css"
test -f "$PUB/v202-contrast.js"
test -f "$PUB/v203-modal-scroll.css"
test -f "$PUB/v203-modal-scroll.js"
test -f "$PUB/v204-bu-form-scroll.css"
test -f "$PUB/v204-bu-form-scroll.js"
test -f "$PUB/v205-bu-modal.css"
test -f "$PUB/v205-bu-modal.js"
test -f "$PUB/v206-register-bu.css"
test -f "$PUB/v207-speed.css"
test -f "$PUB/v208-analytics.js"
test -f "$PUB/v208-admin-analytics.js"
test -f "$PUB/v208-analytics.css"
test -f "$PUB/v209-admin-audit.js"
test -f "$PUB/v209-admin-audit.css"
test -f "$PUB/v210-official-panel.css"
test -f "$PUB/v211-reconciliation.js"
test -f "$PUB/v211-reconciliation.css"
test -f "$PUB/v210-official-panel.js"

grep -q 'CE180_MAX_PHOTO_LOADS' "$PUB/v130-public.js"
grep -q 'CE181 snapshot request' "$PUB/index.html"
grep -q 'CE181 snapshot request' "$PUB/transparencia.html"
grep -q 'CE183 — leitor robusto' "$PUB/bu-parser.js"
grep -q "p === '/api/bu/verify-signature'" "$APP/server.mjs"
grep -q "version:'1.8.4.3'" "$PUB/bu-parser.js"
grep -q 'certificateFragmentInfo' "$PUB/bu-parser.js"
grep -q 'assembleCertificate' "$PUB/bu-parser.js"
grep -q 'QRCE' "$PUB/operacao.html"
grep -q 'signatureVerified' "$PUB/operacao.html"
grep -q 'testMode' "$PUB/operacao.html"
grep -q 'Ed521' "$APP/ce184-verify.py"
grep -q 'secp521r1' "$APP/ce184-verify.py"
grep -q 'TESTE:1' "$PUB/teste-bu/qr-1.txt"
grep -q '"count": 29' "$PUB/teste-29-bus/manifest.json"
grep -q "event:'section_locked_write_denied'" "$APP/server.mjs"
grep -q "p === '/api/admin/backups/restore'" "$APP/server.mjs"
grep -q "/v185-interface.css" "$PUB/index.html"
grep -q "/v185-icons.js" "$PUB/operacao.html"
grep -q "/v185-interface.css" "$PUB/admin/index.html"
grep -q "/v186-visual-qa.css" "$PUB/index.html"
grep -q "/v186-visual-qa.js" "$PUB/operacao.html"
grep -q "/v186-visual-qa.css" "$PUB/admin/index.html"
grep -q "const VERSION='v2.0.11-unified'" "$PUB/service-worker.js"
grep -q '"version":"1.8.7"' "$PUB/data/candidate-catalog.json"
grep -q 'candidatePrefer(item,prev)' "$APP/server.mjs"
grep -q 'CE187_AUTO_CANDIDATE_REFRESH' "$APP/server.mjs"
grep -q "/v187-ui.css" "$PUB/index.html"
grep -q "/v187-ui.js" "$PUB/operacao.html"
grep -q 'CE188_QRBU_TEST_CLEANUP' "$APP/server.mjs"
grep -q "/v189-identity.css" "$PUB/index.html"
grep -q "/v189-identity.js" "$PUB/transparencia.html"
grep -q -- "--ce-primary-900:#123D60" "$PUB/v189-identity.css"
grep -q 'CE190_ASYNC_SIGNATURE_VERIFY' "$APP/server.mjs"
grep -q 'CE190_DEFERRED_RESULT_BACKUP' "$APP/server.mjs"
grep -q 'ce190ObserveRoots' "$PUB/v187-ui.js"
grep -q "/v191-share.css" "$PUB/index.html"
grep -q "/v191-share.js" "$PUB/transparencia.html"
grep -q "Compartilhar resultado" "$PUB/v191-share.js"
grep -q "1080" "$PUB/v191-share.js"
grep -q "/v192-sections.css" "$PUB/index.html"
grep -q "/v192-sections.js" "$PUB/admin/index.html"
grep -q "Próxima pendência" "$PUB/v192-sections.js"
grep -q "Buscar seção ou local" "$PUB/v192-sections.js"
grep -q "/v193-operations.js" "$PUB/operacao.html"
grep -q "/v193-operations.js" "$PUB/admin/index.html"
grep -q "p === '/api/results/undo-delete'" "$APP/server.mjs"
grep -q "undoWindowMs:15000" "$APP/server.mjs"
grep -q "/v194-fastpath.js" "$PUB/index.html"
grep -q "/v194-fastpath.js" "$PUB/admin/index.html"
grep -q "CE194_AGGREGATE_CACHE" "$PUB/admin/admin-v150.js"
grep -q "v1.9.4-unified" "$PUB/service-worker.js" || true
grep -q "/v195-display.js" "$PUB/index.html"
grep -q "/v195-display.js" "$PUB/transparencia.html"
grep -q "Modo divulgação" "$PUB/v195-display.js"
grep -q "Exportar CSV" "$PUB/v195-display.js"
grep -q "v1.9.5-unified" "$PUB/service-worker.js" || true
grep -q "CE196_PUBLIC_NEXT_CONTRAST" "$PUB/v192-sections.css"
grep -q "Nenhum voto computado até o momento" "$PUB/v191-share.js"
grep -q "emptyState=!top.length" "$PUB/v191-share.js"
grep -q "v1.9.6-unified" "$PUB/service-worker.js" || true
! grep -q "AMBIENTE DE TESTE · DADOS NÃO OFICIAIS" "$PUB/v187-ui.js"
grep -q "ce187-pre-election" "$PUB/v187-ui.js"
grep -q "v1.9.7-unified" "$PUB/service-worker.js" || true
grep -q "/v187-ui.js?v=198" "$PUB/index.html"
grep -q "/v198-remove-banner.js" "$PUB/index.html"
grep -q "/v198-remove-banner.css" "$PUB/transparencia.html"
! grep -q "AMBIENTE DE TESTE · DADOS NÃO OFICIAIS" "$PUB/v187-ui.js"
grep -q "v1.9.8-unified" "$PUB/service-worker.js" || true
grep -q '"totalQrbu": 9' "$PUB/teste-qrbu-9/manifest.json"
grep -q "Teste de estresse · QRBU 9 partes" "$PUB/teste-qrbu-9.html"
grep -q "v1.9.9-unified" "$PUB/service-worker.js" || true
grep -q "/v200-resultados-public.css" "$PUB/index.html"
grep -q "/v200-resultados-public.js" "$PUB/transparencia.html"
grep -q "Central independente." "$PUB/v200-resultados-public.js"
grep -q "v2.0.0-unified" "$PUB/service-worker.js" || true
grep -q "/v201-workspace.css" "$PUB/operacao.html"
grep -q "/v201-workspace.js" "$PUB/admin/index.html"
grep -q "Central independente." "$PUB/v201-workspace.js"
grep -q "v2.0.1-unified" "$PUB/service-worker.js" || true
grep -q "/v202-contrast.css" "$PUB/operacao.html"
grep -q "/v202-contrast.js" "$PUB/admin/index.html"
grep -q "Correção prioritária: cabeçalho operacional" "$PUB/v202-contrast.css"
grep -q "v2.0.2-unified" "$PUB/service-worker.js" || true
grep -q "max-height:calc(100dvh" "$PUB/v203-modal-scroll.css"
grep -q "Ler Boletim de Urna pelo QR Code" "$PUB/v204-bu-form-scroll.js"
grep -q "v2.0.4-unified" "$PUB/service-worker.js" || true
! grep -q "/v203-modal-scroll.js" "$PUB/operacao.html"
! grep -q "/v204-bu-form-scroll.js" "$PUB/operacao.html"
grep -q "v2.0.5-unified" "$PUB/service-worker.js" || true
! grep -q "/v203-modal-scroll." "$PUB/operacao.html"
! grep -q "/v204-bu-form-scroll." "$PUB/operacao.html"
! grep -q "/v205-bu-modal." "$PUB/operacao.html"
grep -q "/v206-register-bu.css" "$PUB/operacao.html"
grep -q "Revisar e confirmar resultado" "$PUB/operacao.html"
grep -q "ce206-result-actions" "$PUB/operacao.html"
grep -q "v2.0.6-unified" "$PUB/service-worker.js" || true
grep -q "/v207-speed.css" "$PUB/index.html"
grep -q "/v207-speed.css" "$PUB/operacao.html"
grep -q "CE207_TARGETED_CONTRAST_OBSERVER" "$PUB/v202-contrast.js"
grep -q "min-width:34px" "$PUB/v207-speed.css"
! grep -q "v203-modal-scroll.js" "$PUB/service-worker.js"
! grep -q "v204-bu-form-scroll.js" "$PUB/service-worker.js"
! grep -q "v205-bu-modal.js" "$PUB/service-worker.js"
grep -q "v2.0.7-unified" "$PUB/service-worker.js" || true
grep -q "p === '/api/analytics/event'" "$APP/server.mjs"
grep -q "p === '/api/admin/analytics'" "$APP/server.mjs"
grep -q "CREATE TABLE IF NOT EXISTS app_analytics" "$APP/server.mjs"
grep -q "/v208-analytics.js" "$PUB/index.html"
grep -q "/v208-admin-analytics.js" "$PUB/admin/index.html"
grep -q "v2.0.8-unified" "$PUB/service-worker.js" || true

grep -q "/v209-admin-audit.js" "$PUB/admin/index.html"
grep -q "p === '/api/admin/candidate-audit'" "$APP/server.mjs"
grep -q "CE209_OFFICIAL_DESTINATION_AUDIT" "$APP/server.mjs"
grep -q "fetch('/api/candidates'" "$PUB/v187-ui.js"
grep -q "v2.0.9-unified" "$PUB/service-worker.js" || true
grep -q "v2.0.10-unified" "$PUB/service-worker.js" || true
grep -q "CE210_READ_ONLY_EA20" "$APP/server.mjs"
grep -q "p === '/api/official/ea20'" "$APP/server.mjs"
grep -q "/v210-official-panel.js" "$PUB/index.html"
grep -q "p === '/api/admin/reconciliation'" "$APP/server.mjs"
grep -q "v2.0.11-unified" "$PUB/service-worker.js"
grep -q "/v211-reconciliation.js" "$PUB/admin/index.html"
echo "V2.0.11: fila de divergências autenticada, por seção e cargo."
