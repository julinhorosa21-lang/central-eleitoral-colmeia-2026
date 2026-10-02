import fs from 'node:fs';
const pub='/app/public',serverFile='/app/server.mjs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
write(pub+'/v209-admin-audit.js',read('/src/v209-admin-audit.js'));
write(pub+'/v209-admin-audit.css',read('/src/v209-admin-audit.css'));
let s=read(serverFile);
const anchor="function adminOverview() {";
const helpers="/* CE209_OFFICIAL_DESTINATION_AUDIT: classifications come only from explicit TSE fields. */\nfunction ce209Norm(s){return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}\nfunction ce209Destination(raw){\n const s=ce209Norm(raw);\n if(!s)return 'nao_informada';\n if(s.includes('ANULADO')&&s.includes('SUB JUDICE'))return 'anulado_sub_judice';\n if(s.includes('ANULADO'))return 'anulado';\n if(s.includes('VALIDO')&&s.includes('LEGENDA'))return 'valido_legenda';\n if(s==='VALIDO'||s.startsWith('VALIDO '))return 'valido';\n return 'nao_informada';\n}\nfunction ce209CandidatePending(c){\n const all=ce209Norm([c.situacaoJulgamentoPleito,c.situacaoJulgamento,c.situacaoPleito,c.situacaoCassacao].filter(Boolean).join('|'));\n return Boolean(c.subJudice||/(RECURSO|PRAZO RECURSAL|PENDENTE|AGUARDANDO)/.test(all));\n}\nfunction ce209Audit(snap){\n const totals={valido:0,valido_legenda:0,anulado:0,anulado_sub_judice:0,nao_informada:0};\n const rows=[],counts={},judicialPending=0;\n for(const cargo of ['presidente','governador','senador','depFederal','depEstadual']){\n  const group=Array.isArray(snap?.candidates?.[cargo])?snap.candidates[cargo]:[];\n  counts[cargo]=group.length;\n  for(const c of group){\n   const destino=ce209Destination(c.destinacaoVotos);\n   totals[destino]++;\n   const pending=ce209CandidatePending(c);\n   if(pending)judicialPending++;\n   rows.push({\n    cargo,numero:String(c.numero||''),nome:String(c.nomeUrna||c.nome||''),\n    partido:String(c.partido||''),sqCandidato:String(c.sqCandidato||''),\n    situacao:String(c.situacao||''),situacaoUrna:String(c.situacaoUrna||''),\n    situacaoTotalizacao:String(c.situacaoTotalizacao||''),\n    destino,destinacaoOriginal:String(c.destinacaoVotos||''),\n    judicialPending:pending,substituido:c.substituido===true,\n    fonte:'TSE - consulta_cand_complementar_2026'\n   });\n  }\n }\n return {ok:true,total:rows.length,totals,judicialPending,counts,rows,\n         generatedAt:snap?.generatedAt||snap?.storedAt||null,\n         missingComplement:rows.filter(c=>!c.situacaoUrna&&!c.situacaoTotalizacao&&!c.destinacaoOriginal).length,\n         source:snap?.source||null};\n}\n";
if(!s.includes('CE209_OFFICIAL_DESTINATION_AUDIT')){
 if(!s.includes(anchor))throw new Error('V209 server helper anchor missing');
 s=s.replace(anchor,helpers+'\n'+anchor);
}
const route="    if (p === '/api/admin/candidate-audit' && req.method === 'GET') {\n      const user=auth(req);\n      if(!user || user.role!=='admin') return json(res,403,{ok:false,error:'admin_required'});\n      const snap=storedCandidateSnapshot();\n      if(!snap)return json(res,503,{ok:false,error:'candidate_catalog_not_ready'});\n      return json(res,200,ce209Audit(snap));\n    }\n\n";
const routeAnchor="    if (p === '/api/admin/security-summary') {";
if(!s.includes("p === '/api/admin/candidate-audit'")){
 if(!s.includes(routeAnchor))throw new Error('V209 admin route anchor missing');
 s=s.replace(routeAnchor,route+routeAnchor);
}

/* Update hourly on the election Sunday; every 3h on other days.
   Scheduling code never rewrites local raw BU results. */
const schedOld="setTimeout(ce187Refresh,12000);setInterval(ce187Refresh,12*60*60*1000);";
const schedNew="setTimeout(ce187Refresh,12000);let ce209LastSync=Date.now();setInterval(()=>{const inBrazil=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const period=inBrazil==='2026-10-04'?60*60*1000:3*60*60*1000;if(Date.now()-ce209LastSync<period)return;ce209LastSync=Date.now();ce187Refresh()},15*60*1000);";
if(s.includes(schedOld))s=s.replace(schedOld,schedNew);
if(!s.includes('ce209LastSync'))throw new Error('V209 official scheduler missing');
write(serverFile,s);

/* Prefer runtime fresh TSE snapshot over build-time static file for public badges. */
const ui=pub+'/v187-ui.js';
let u=read(ui);
const oldStart=u.indexOf('let ce190CatalogLoadedAt=0;async function load(force=false){');
const oldEnd=u.indexOf('function start(){',oldStart);
if(oldStart<0||oldEnd<0)throw new Error('V209 public loader anchor missing');
const newLoader="let ce190CatalogLoadedAt=0;async function load(force=false){if(!force&&catalog&&Date.now()-ce190CatalogLoadedAt<30*60*1000)return;let next=null;try{const r=await fetch('/api/candidates',{cache:'no-store'});if(r.ok){const j=await r.json();if(j.available&&j.snapshot?.candidates)next=j.snapshot}}catch{}if(!next){try{const r=await fetch('/data/candidate-catalog.json?v=209',{cache:'force-cache'});if(r.ok)next=await r.json()}catch{}}if(next?.candidates){const changed=!catalog||catalog.generatedAt!==next.generatedAt||catalog.sha256!==next.sha256;catalog=next;ce190CatalogLoadedAt=Date.now();if(changed){adoptCatalog();run()}}}\n";
u=u.slice(0,oldStart)+newLoader+u.slice(oldEnd);
u=u.replace("window.addEventListener('pageshow',()=>{ce190ObserveRoots();load(false);ce190ScheduleRun()})","window.addEventListener('pageshow',()=>{ce190ObserveRoots();load(true);ce190ScheduleRun()});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-ce190CatalogLoadedAt>30*60*1000)load(true)});setInterval(()=>{if(!document.hidden)load(false)},30*60*1000)");
if(!u.includes("fetch('/api/candidates'"))throw new Error('V209 runtime API loader missing');
write(ui,u);new Function(u);

/* Enrich build-time fallback catalog with the same exact destination logic.
   No inference from pending/indeferido => null votes. */
const staticFile=pub+'/data/candidate-catalog.json';
if(fs.existsSync(staticFile)){
 const obj=JSON.parse(read(staticFile));
 if(obj.candidates){
  const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
  const decide=v=>{const x=normalize(v);if(!x)return'nao_informada';if(x.includes('ANULADO')&&x.includes('SUB JUDICE'))return'anulado_sub_judice';if(x.includes('ANULADO'))return'anulado';if(x.includes('VALIDO')&&x.includes('LEGENDA'))return'valido_legenda';if(x==='VALIDO'||x.startsWith('VALIDO '))return'valido';return'nao_informada'};
  for(const rows of Object.values(obj.candidates))for(const c of rows)c.destinacaoCategoria=decide(c.destinacaoVotos);
  obj.classificacao='Somente destinação explicitamente informada pelo TSE; não equivale à totalização oficial antes dos arquivos EA20';
  write(staticFile,JSON.stringify(obj));
 }
}
for(const p of [pub+'/admin/index.html',pub+'/admin.html']){
 if(!fs.existsSync(p))continue;let h=read(p);
 if(!h.includes('/v209-admin-audit.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v209-admin-audit.css?v=209">\n</head>');
 if(!h.includes('/v209-admin-audit.js'))h=h.replace('</body>','<script src="/v209-admin-audit.js?v=209"></script>\n</body>');
 write(p,h);
}
let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.9-unified';");
if(!sw.includes("'/v209-admin-audit.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v209-admin-audit.css','/v209-admin-audit.js',");
write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.9';write(pkg,JSON.stringify(j,null,2)+'\n')}

/* Pure classification tests: do not infer nullity from judicial status. */
const fn=new Function(helpers+';return {dest:ce209Destination,audit:ce209Audit}')();
for(const [raw,want] of [['Válido','valido'],['Válido (legenda)','valido_legenda'],['Anulado','anulado'],['Anulado sub judice','anulado_sub_judice'],['','nao_informada'],['Indeferido','nao_informada']]){
 if(fn.dest(raw)!==want)throw new Error('V209 classification failed: '+raw+' expected '+want);
}
const example=fn.audit({candidates:{presidente:[{numero:'12',destinacaoVotos:'',situacaoJulgamento:'Indeferido em recurso'}]}});
if(example.totals.anulado!==0||example.totals.nao_informada!==1||example.judicialPending!==1)throw new Error('V209 judicial/ballot separation failed');
if(!read(pub+'/admin/index.html').includes('/v209-admin-audit.js'))throw new Error('V209 admin panel missing');
if(!read(serverFile).includes("p === '/api/admin/candidate-audit'"))throw new Error('V209 admin route missing');
console.log('V2.0.9 audit tests passed: explicit five vote destinations, no inferred annulment, fresh runtime catalog, authorized admin UI.');
