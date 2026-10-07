import fs from 'node:fs';

const PUB='/app/public';
const SERVER='/app/server.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const ACTIVE=['presidente','governador'];
const RETIRED=['senador','depFederal','depEstadual'];
const NUMBERS={presidente:new Set(['13','22']),governador:new Set(['44','45'])};

function filterSnapshot(input){
  if(!input||typeof input!=='object')return input;
  const out=JSON.parse(JSON.stringify(input));
  const candidates={presidente:[],governador:[]};
  for(const cargo of ACTIVE){
    candidates[cargo]=(Array.isArray(out.candidates?.[cargo])?out.candidates[cargo]:[])
      .filter(c=>NUMBERS[cargo].has(String(c.numero||'')));
  }
  if(candidates.presidente.length!==2||candidates.governador.length!==2){
    throw new Error('V220: runoff candidates not found '+JSON.stringify({
      presidente:candidates.presidente.map(c=>c.numero),
      governador:candidates.governador.map(c=>c.numero)
    }));
  }
  out.candidates=candidates;
  out.counts={presidente:2,governador:2};
  out.substituicoes=(Array.isArray(out.substituicoes)?out.substituicoes:[])
    .filter(x=>ACTIVE.includes(x.cargo)&&NUMBERS[x.cargo].has(String(x.numero||'')));
  const status={ativos:0,subJudice:0,inativos:0,pendentes:0,porGrupo:{}};
  for(const rows of Object.values(candidates))for(const c of rows){
    const g=c.statusGrupo||'outros';
    status.porGrupo[g]=(status.porGrupo[g]||0)+1;
    if(c.subJudice)status.subJudice++;
    if(c.ativo===false)status.inativos++;
    else{status.ativos++;if(g==='pendente')status.pendentes++}
  }
  out.statusSummary=status;
  out.version='2.1.0-2turno';
  out.turno=2;
  out.electionDate='2026-10-25';
  out.activeCargos=[...ACTIVE];
  return out;
}

const catalogFile=PUB+'/data/candidate-catalog.json';
const filtered=filterSnapshot(JSON.parse(read(catalogFile)));
for(const cargo of ACTIVE)for(const c of filtered.candidates[cargo]){
  const numero=String(c.numero||''),sq=String(c.sqCandidato||'').replace(/\D/g,'');
  const stable='/candidate-photos/2t-'+cargo+'-'+numero+'.jpg';
  const stableAbs=PUB+stable;
  const local=String(c.foto||'').startsWith('/candidate-photos/')?PUB+String(c.foto):'';
  if(local&&fs.existsSync(local)){fs.copyFileSync(local,stableAbs);c.foto=stable}
  else if(sq&&fs.existsSync(PUB+'/candidate-photos/'+sq+'.jpg')){fs.copyFileSync(PUB+'/candidate-photos/'+sq+'.jpg',stableAbs);c.foto=stable}
}
write(catalogFile,JSON.stringify(filtered));

function patchClientText(s){
  const literals=[
    ["['presidente','governador','senador','depFederal','depEstadual']","['presidente','governador']"],
    ["[['presidente','Presidente'],['governador','Governador'],['senador','Senador'],['depFederal','Deputado Federal'],['depEstadual','Deputado Estadual']]","[['presidente','Presidente'],['governador','Governador']]"]
  ];
  for(const [a,b] of literals)s=s.split(a).join(b);
  s=s.replace(/cinco cargos/gi,'dois cargos');
  s=s.replace(/\b5 cargos\b/gi,'2 cargos');
  return s;
}
function walk(dir){
  const out=[];
  for(const name of fs.readdirSync(dir)){
    const p=dir+'/'+name,st=fs.statSync(p);
    if(st.isDirectory())out.push(...walk(p));else out.push(p);
  }
  return out;
}
for(const file of walk(PUB)){
  if(!/\.(?:html|js)$/i.test(file))continue;
  const s=read(file),n=patchClientText(s);if(n!==s)write(file,n);
}

const c102=PUB+'/v102-candidates.js';
if(fs.existsSync(c102)){
  let s=read(c102);
  s=s.replace("const cargos=['presidente','governador','senador','depFederal','depEstadual'];","const cargos=['presidente','governador'];");
  const anchor="function applySnapshot(snapshot){\n    if(!snapshot?.candidates || typeof CANDIDATOS==='undefined')return false;";
  if(s.includes(anchor)&&!s.includes('CE220_CLEAR_RETIRED_CANDIDATES')){
    s=s.replace(anchor,anchor+"\n    /* CE220_CLEAR_RETIRED_CANDIDATES */\n    for(const old of ['senador','depFederal','depEstadual'])if(Array.isArray(CANDIDATOS[old]))CANDIDATOS[old].splice(0);");
  }
  s=s.replace(/alert\(\`Catálogo atualizado pelo TSE\.[\s\S]*?Deputado Estadual: \$\{c\.depEstadual\|\|0\}\`\);/,
    "alert('Catálogo do 2º turno atualizado pelo TSE.\\nPresidente: '+(c.presidente||0)+'\\nGovernador: '+(c.governador||0));");
  new Function(s);write(c102,s);
}

let server=read(SERVER);
if(!server.includes("import * as ce220fs from 'node:fs';"))server="import * as ce220fs from 'node:fs';\n"+server;
const helperAnchor='async function refreshCandidateCatalogFromTse(){';
if(!server.includes('function ce220FilterCandidateSnapshot(')){
  if(!server.includes(helperAnchor))throw new Error('V220: candidate helper anchor missing');
  const helper=String.raw`
/* CE220_SECOND_TURN_2026 */
const CE220_ACTIVE_CARGOS=new Set(['presidente','governador']);
const CE220_ACTIVE_NUMBERS={presidente:new Set(['13','22']),governador:new Set(['44','45'])};
function ce220FilterCandidateSnapshot(input){
  if(!input||typeof input!=='object')return input;
  const out=JSON.parse(JSON.stringify(input)),candidates={presidente:[],governador:[]};
  for(const cargo of CE220_ACTIVE_CARGOS){
    candidates[cargo]=(Array.isArray(out.candidates?.[cargo])?out.candidates[cargo]:[])
      .filter(c=>CE220_ACTIVE_NUMBERS[cargo].has(String(c.numero||'')));
    for(const c of candidates[cargo]){
      const local='/candidate-photos/2t-'+cargo+'-'+String(c.numero||'')+'.jpg';
      if(ce220fs.existsSync('/app/public'+local))c.foto=local;
    }
  }
  out.candidates=candidates;
  out.counts={presidente:candidates.presidente.length,governador:candidates.governador.length};
  out.substituicoes=(Array.isArray(out.substituicoes)?out.substituicoes:[])
    .filter(x=>CE220_ACTIVE_CARGOS.has(x.cargo)&&CE220_ACTIVE_NUMBERS[x.cargo]?.has(String(x.numero||'')));
  out.statusSummary={ativos:0,subJudice:0,inativos:0,pendentes:0,porGrupo:{}};
  for(const rows of Object.values(candidates))for(const c of rows){
    const g=c.statusGrupo||'outros';out.statusSummary.porGrupo[g]=(out.statusSummary.porGrupo[g]||0)+1;
    if(c.subJudice)out.statusSummary.subJudice++;
    if(c.ativo===false)out.statusSummary.inativos++;else{out.statusSummary.ativos++;if(g==='pendente')out.statusSummary.pendentes++}
  }
  out.version='2.1.0-2turno';out.turno=2;out.electionDate='2026-10-25';out.activeCargos=['presidente','governador'];
  return out;
}
`;
  server=server.replace(helperAnchor,helper+'\n'+helperAnchor);
}
server=server.replace(
  "function storedCandidateSnapshot(){const row=candidateSnapshotGet.get();if(!row)return null;const snap=safeJson(row.payload_json);if(!snap||typeof snap!=='object')return null;return {...snap,storedAt:row.updated_at}}",
  "function storedCandidateSnapshot(){const row=candidateSnapshotGet.get();if(!row)return null;const snap=safeJson(row.payload_json);if(!snap||typeof snap!=='object')return null;return ce220FilterCandidateSnapshot({...snap,storedAt:row.updated_at})}"
);
server=server.replaceAll(
  "candidateSnapshotUpsert.run(JSON.stringify(snapshot),snapshot.generatedAt,URL);return snapshot;",
  "snapshot=ce220FilterCandidateSnapshot(snapshot);candidateSnapshotUpsert.run(JSON.stringify(snapshot),snapshot.generatedAt,URL);return snapshot;"
);
server=patchClientText(server);

const cargoLine="const section=Number(body.section), cargo=String(body.cargo||''), placeId=sectionToPlace.get(section);";
if(!server.includes("error:'second_turn_required'")){
  if(!server.includes(cargoLine))throw new Error('V220: POST /api/results cargo anchor missing');
  server=server.replace(cargoLine,cargoLine+String.raw`
      if(!CE220_ACTIVE_CARGOS.has(cargo))return json(res,409,{ok:false,error:'cargo_not_active_second_round',cargo,activeCargos:['presidente','governador']});
      const ce220Round=Number(body.turno||req.headers['x-ce-election-round']||0);
      if(ce220Round!==2)return json(res,409,{ok:false,error:'second_turn_required',expectedRound:2});
`);
}

const startup="console.log('V1.0.2: catálogo de candidaturas TSE sincronizável com snapshot persistente ativo.');";
if(!server.includes('CE220_FIRST_TURN_ARCHIVE')){
  if(!server.includes(startup))throw new Error('V220: startup anchor missing');
  const migration=String.raw`
  /* CE220_FIRST_TURN_ARCHIVE */
  const ce220Marker='/data/.ce220-second-turn-2026';
  if(!ce220fs.existsSync(ce220Marker)){
    const ce220Now=new Date().toISOString();
    try{
      try{db.exec('PRAGMA wal_checkpoint(FULL)')}catch{}
      const ce220Rows=db.prepare('SELECT * FROM results').all();
      ce220fs.mkdirSync('/data/archive',{recursive:true});
      ce220fs.writeFileSync('/data/archive/primeiro-turno-resultados-2026-10-04.json',JSON.stringify({archivedAt:ce220Now,rows:ce220Rows},null,2));
      if(ce220fs.existsSync('/data/central.sqlite'))ce220fs.copyFileSync('/data/central.sqlite','/data/archive/central-primeiro-turno-2026-10-04.sqlite');
      if(ce220fs.existsSync('/data/official-ea20-colmeia.json'))ce220fs.copyFileSync('/data/official-ea20-colmeia.json','/data/archive/official-ea20-primeiro-turno-2026-10-04.json');
      db.exec('BEGIN IMMEDIATE; DELETE FROM results; COMMIT;');
      try{db.exec('DELETE FROM section_reopenings')}catch{}
      const snap=storedCandidateSnapshot();
      if(snap)candidateSnapshotUpsert.run(JSON.stringify(ce220FilterCandidateSnapshot(snap)),ce220Now,'CE220 second-turn active catalog');
      ce220fs.writeFileSync(ce220Marker,JSON.stringify({mode:'segundo_turno',turno:2,electionDate:'2026-10-25',archivedAt:ce220Now,archivedResults:ce220Rows.length}));
      console.log('CE220_SECOND_TURN_RESET',JSON.stringify({archivedResults:ce220Rows.length,electionDate:'2026-10-25'}));
    }catch(e){console.error('CE220_SECOND_TURN_RESET_FAILED',String(e?.message||e));throw e}
  }
`;
  server=server.replace(startup,migration+'\n  '+startup);
}
write(SERVER,server);

const parser=PUB+'/bu-parser.js';
if(fs.existsSync(parser)){
  let s=read(parser);
  s=s.replace("const CARGO_MAP={1:'presidente',3:'governador',5:'senador',6:'depFederal',7:'depEstadual'};",
              "const CARGO_MAP={1:'presidente',3:'governador'};");
  write(parser,s);
}

const op=PUB+'/operacao.html';
if(fs.existsSync(op)){
  let h=read(op);
  if(!h.includes('CE220_QR_SECOND_TURN_GUARD')){
    const info="  const info=BUParser?.fragmentInfo(text);\n  if(!info){";
    if(!h.includes(info))throw new Error('V220: QR fragment guard anchor missing');
    h=h.replace(info,"  const info=BUParser?.fragmentInfo(text);\n  /* CE220_QR_SECOND_TURN_GUARD */\n  if(info&&info.identity?.TURN!==undefined&&Number(info.identity.TURN)!==2){setQrStatus('bad','Este QR pertence ao <b>1º turno</b>. A Central aceita somente BUs do 2º turno de 25 de outubro.');return}\n  if(!info){");
    const assembled="const assembled=BUParser.assemble(qrSession.parts);qrSession.parsed=BUParser.parse(assembled);qrSession.fingerprint=await sha256Hex(assembled);";
    if(!h.includes(assembled))throw new Error('V220: assembled QR anchor missing');
    h=h.replace(assembled,"const assembled=BUParser.assemble(qrSession.parts);qrSession.parsed=BUParser.parse(assembled);if(Number(qrSession.parsed?.meta?.TURN)!==2){qrSession.parsed=null;setQrStatus('bad','Boletim recusado: não é do <b>2º turno</b>. Nenhum dado foi aplicado.');return}qrSession.fingerprint=await sha256Hex(assembled);");
  }
  write(op,h);
}

const ea='/app/v210-ea20.mjs';
if(fs.existsSync(ea)){
  let s=read(ea);
  s=s.replace("const STORE='/data/official-ea20-colmeia.json';","const STORE='/data/official-ea20-colmeia-2turno.json';");
  s=s.replace("const OPEN_AT=Date.parse('2026-10-04T17:05:00-03:00');","const OPEN_AT=Date.parse('2026-10-25T17:05:00-03:00');");
  s=s.replace(/const CARGOS=\{presidente:\{code:'0001',ele:6257\},governador:\{code:'0003',ele:6259\},senador:[^;]+;/,
              "const CARGOS={presidente:{code:'0001',ele:6257},governador:{code:'0003',ele:6259}};");
  s=s.replace("Number(data.t)!==1","Number(data.t)!==2");
  write(ea,s);
}
const rec='/app/v211-reconcile.mjs';
if(fs.existsSync(rec)){
  let s=read(rec);
  s=s.replace("export const CE211_CARGOS=['presidente','governador','senador','depFederal','depEstadual'];","export const CE211_CARGOS=['presidente','governador'];");
  write(rec,s);
}

const ui=String.raw`(()=>{'use strict';
const ACTIVE=new Set(['presidente','governador']);
const RETIRED=new Set(['senador','depFederal','depEstadual']);
window.__CE_SECOND_TURN__={turno:2,date:'2026-10-25',cargos:['presidente','governador'],candidatos:{presidente:['13','22'],governador:['44','45']}};
function clean(){
 document.documentElement.dataset.ceTurno='2';
 try{if(typeof CANDIDATOS!=='undefined'){CANDIDATOS.senador=[];CANDIDATOS.depFederal=[];CANDIDATOS.depEstadual=[]}}catch{}
 document.querySelectorAll('[data-cargo],[data-ce161-cargo]').forEach(el=>{const k=el.dataset.cargo||el.dataset.ce161Cargo;if(RETIRED.has(k))el.remove()});
 document.querySelectorAll('select option').forEach(o=>{const v=String(o.value||'');const t=String(o.textContent||'').toLocaleLowerCase('pt-BR');if(RETIRED.has(v)||/senador|deputado federal|deputado estadual/.test(t))o.remove()});
 const e=document.querySelector('.hero .eyebrow');if(e)e.textContent='2º TURNO · COLMÉIA/TO · 25 DE OUTUBRO';
 const p=document.querySelector('.hero p');if(p)p.textContent='Acompanhe Presidente e Governador do Tocantins nas 29 seções de Colméia.';
 document.querySelectorAll('.ce161-op-head p').forEach(x=>x.textContent='Presidente e Governador · candidatos do 2º turno.');
}
const original=window.fetch.bind(window);
window.fetch=async function(input,init={}){
 let u;try{u=new URL(input instanceof Request?input.url:input,location.href)}catch{return original(input,init)}
 const method=String(init.method||(input instanceof Request?input.method:'GET')).toUpperCase();
 if(u.origin!==location.origin||u.pathname!=='/api/results'||method!=='POST')return original(input,init);
 let body=null;try{body=input instanceof Request?await input.clone().json():JSON.parse(String(init.body||'{}'))}catch{}
 if(!body)return original(input,init);
 if(!ACTIVE.has(String(body.cargo||'')))return new Response(JSON.stringify({ok:false,error:'cargo_not_active_second_round'}),{status:409,headers:{'content-type':'application/json'}});
 body.turno=2;
 const headers=new Headers(input instanceof Request?input.headers:undefined);new Headers(init.headers||{}).forEach((v,k)=>headers.set(k,v));
 headers.set('content-type','application/json');headers.set('x-ce-election-round','2');
 if(input instanceof Request)return original(new Request(input,{...init,headers,body:JSON.stringify(body)}),{});
 return original(input,{...init,headers,body:JSON.stringify(body)});
};
function start(){clean();setTimeout(clean,250);setTimeout(clean,1100);document.addEventListener('click',()=>setTimeout(clean,80),true)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();`;
write(PUB+'/v220-second-turn.js',ui);
const css=String.raw`
html[data-ce-turno="2"] [data-cargo="senador"],
html[data-ce-turno="2"] [data-cargo="depFederal"],
html[data-ce-turno="2"] [data-cargo="depEstadual"],
html[data-ce-turno="2"] [data-ce161-cargo="senador"],
html[data-ce-turno="2"] [data-ce161-cargo="depFederal"],
html[data-ce-turno="2"] [data-ce161-cargo="depEstadual"]{display:none!important}
`;
write(PUB+'/v220-second-turn.css',css);
for(const rel of ['index.html','transparencia.html','operacao.html','admin/index.html','admin.html']){
  const p=PUB+'/'+rel;if(!fs.existsSync(p))continue;let h=read(p);
  if(!h.includes('/v220-second-turn.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v220-second-turn.css?v=220">\n</head>');
  if(!h.includes('/v220-second-turn.js'))h=h.replace('</body>','<script src="/v220-second-turn.js?v=220"></script>\n</body>');
  write(p,h);
}

const manifest=PUB+'/manifest.webmanifest';
if(fs.existsSync(manifest)){const j=JSON.parse(read(manifest));j.name='Central Eleitoral Colméia 2026 · 2º Turno';j.short_name='Central 2º Turno';write(manifest,JSON.stringify(j,null,2))}
const sw=PUB+'/service-worker.js';
let sws=read(sw).replace(/const VERSION='[^']+';/,"const VERSION='v2.1.0-runoff';");
if(!sws.includes("'/v220-second-turn.js'"))sws=sws.replace('const CORE=[',"const CORE=['/v220-second-turn.js','/v220-second-turn.css',");
write(sw,sws);
const pkg='/app/package.json';if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.1.0';write(pkg,JSON.stringify(j,null,2)+'\n')}

new Function(read(PUB+'/v220-second-turn.js'));
new Function(read(PUB+'/bu-parser.js'));
if(!read(SERVER).includes('CE220_FIRST_TURN_ARCHIVE'))throw new Error('V220 archive migration missing');
if(!read(SERVER).includes("error:'second_turn_required'"))throw new Error('V220 round write guard missing');
if(!read(PUB+'/operacao.html').includes('CE220_QR_SECOND_TURN_GUARD'))throw new Error('V220 QR round guard missing');
if(!read(PUB+'/bu-parser.js').includes("const CARGO_MAP={1:'presidente',3:'governador'}"))throw new Error('V220 parser offices mismatch');
const finalCatalog=JSON.parse(read(catalogFile));
if(Object.keys(finalCatalog.candidates).sort().join(',')!=='governador,presidente')throw new Error('V220 catalog has retired offices');
if(finalCatalog.candidates.presidente.length!==2||finalCatalog.candidates.governador.length!==2)throw new Error('V220 runoff candidate count mismatch');
if(!read(sw).includes('v2.1.0-runoff'))throw new Error('V220 service-worker mismatch');
console.log('V2.1.0 runoff build passed: 2 offices, 4 candidates, first-turn results archived/reset, round-2 QR/write guards, separate official cache.');
