import fs from 'node:fs';import assert from 'node:assert/strict';
const src=fs.readFileSync('/app/public/v217-official-live.js','utf8');
assert.ok(src.includes("MUNICIPIO='95290'"));assert.ok(src.includes('6257')&&src.includes('6259'));assert.ok(src.includes("window.__CE217_OFFICIAL__"));assert.ok(src.includes('Fonte TSE'));assert.ok(!src.includes("/api/results"));new Function(src);
const html=fs.readFileSync('/app/public/index.html','utf8');assert.ok(html.includes('v217-official-live.js?v=217'));assert.ok(!html.includes('/v210-official-panel.js'));
const share=fs.readFileSync('/app/public/v191-share.js','utf8');assert.ok(share.includes('CE216_TOP3_OFFICIAL_PHOTOS'));
console.log('V2.0.17 integration checks passed: official feed is read-only and photo sharing remains enabled.');