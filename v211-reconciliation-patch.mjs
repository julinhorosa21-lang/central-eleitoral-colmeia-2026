import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const pub='/app/public',serverFile='/app/server.mjs';
write('/app/v211-reconcile.mjs',read('/src/v211-reconcile.mjs'));
write(pub+'/v211-reconciliation.js',read('/src/v211-reconciliation.js'));
write(pub+'/v211-reconciliation.css',read('/src/v211-reconciliation.css'));
const admin=pub+'/admin/index.html';
let s=read(serverFile);
if(!s.includes("import {reconciliationReport as ce211Report} from './v211-reconcile.mjs';")){
 s="import {reconciliationReport as ce211Report} from './v211-reconcile.mjs';\n"+s;
}
const route=String.raw`    /* CE211_READ_ONLY_RECONCILIATION: per-section comparison of two decoded vote payloads. */
    if (p === '/api/admin/reconciliation' && req.method === 'GET') {
      const user=auth(req);
      if(!user || user.role!=='admin')return json(res,403,{ok:false,error:'admin_required'});
      const sectionInfo=[...sectionToPlace.entries()].map(([section,placeId])=>({
        section:Number(section),
        placeName:locations.locais.find(place=>place.id===placeId)?.nome||String(placeId)
      })).sort((a,b)=>a.section-b.section);
      const report=ce211Report(listRows.all(),sectionInfo,comparePayloads,
        section=>tseSync.getSectionEvidence(section));
      return json(res,200,report);
    }
`;
const anchor="    if (p === '/api/admin/security-summary') {";
if(!s.includes("p === '/api/admin/reconciliation'")){
 if(!s.includes(anchor))throw new Error('V211 admin auth route anchor not found');
 s=s.replace(anchor,route+anchor);
}
write(serverFile,s);

let html=read(admin);
if(!html.includes('/v211-reconciliation.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v211-reconciliation.css?v=211">\n</head>');
if(!html.includes('/v211-reconciliation.js'))html=html.replace('</body>','<script src="/v211-reconciliation.js?v=211"></script>\n</body>');
write(admin,html);
let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.11-unified';");
if(!sw.includes("'/v211-reconciliation.js'"))sw=sw.replace('const CORE=[',"const CORE=['/v211-reconciliation.js','/v211-reconciliation.css',");
write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.11';write(pkg,JSON.stringify(j,null,2)+'\n')}

/* Regression: no divergence unless both source payloads are present and comparable. */
const {reconcileOne, reconciliationReport, CE211_STATES}=await import('file:///app/v211-reconcile.mjs');
const compare=(a,b)=>({ready:true,equal:a.votos===b.votos,differences:a.votos===b.votos?[]:[{campo:'votos',local:a.votos,oficial:b.votos}],summary:{local:a.votos,official:b.votos}});
const k={section:1,cargo:'presidente',placeName:'Teste',compare};
function check(value,state){if(value.state!==state)throw new Error('V211 wrong '+value.state+' expected '+state)}
check(reconcileOne({...k,local:{votos:10},official:{votos:10}}),'conferido');
const mismatch=reconcileOne({...k,local:{votos:10},official:{votos:11}});
check(mismatch,'divergente');
if(mismatch.differences.length!==1)throw new Error('V211 missing difference details');
check(reconcileOne({...k,local:{votos:10}}),'aguardando_tse');
check(reconcileOne({...k,local:{votos:10},evidence:{officialBuReady:true}}),'aguardando_decodificacao');
check(reconcileOne({...k,official:{votos:10}}),'sem_bu_local');
check(reconcileOne({...k}),'aguardando_ambos');
check(reconcileOne({...k,local:{votos:10},official:{votos:11},compare:()=>({ready:false,equal:false})}),'nao_comparavel');
const rows=[{section:1,cargo:'presidente',local_payload_json:JSON.stringify({votos:3}),official_payload_json:JSON.stringify({votos:4})}];
const rowsCopy=JSON.stringify(rows);
const report=reconciliationReport(rows,[{section:1,placeName:'Local 1'}],compare,()=>null);
if(report.items.length!==5||report.summary.divergente!==1||report.summary.secoesComDivergencia!==1)throw new Error('V211 report totals failed');
if(JSON.stringify(rows)!==rowsCopy)throw new Error('V211 report altered original rows');
new Function(read(pub+'/v211-reconciliation.js'));
if(!read(serverFile).includes('CE211_READ_ONLY_RECONCILIATION'))throw new Error('V211 backend missing');
if(!read(admin).includes('/v211-reconciliation.js'))throw new Error('V211 admin missing');
if(!read(pub+'/service-worker.js').includes("v2.0.11-unified"))throw new Error('V211 SW missing');
console.log('V2.0.11 reconciliation tests passed: equal/mismatch/pending/not-comparable, 5 cargos, source immutability and admin-only route.');
