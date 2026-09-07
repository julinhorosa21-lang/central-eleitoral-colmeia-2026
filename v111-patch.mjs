import {readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';

const serverPath='/app/server.mjs';
const packagePath='/app/package.json';
const pages=['/app/public/index.html','/app/public/transparencia.html','/app/public/seguranca.html'];
for(const f of [serverPath,packagePath,'/app/public/index.html','/app/public/v111-main.js','/app/public/v111-cleanup.css'])if(!existsSync(f))throw new Error(`V1.1.1 patch: missing ${f}`);

let server=readFileSync(serverPath,'utf8');
if(!server.includes("version:'1.1.1'")){
  if(!server.includes("version:'1.1.0'"))throw new Error('V1.1.1 patch: server version anchor missing');
  server=server.replace("version:'1.1.0'","version:'1.1.1'");
}
const simAnchor="    if (p === '/api/sim/meta') return json(res,200,{ok:true,...simulationMeta()});";
const simGuard="    if (p === '/api/sim' || p.startsWith('/api/sim/')) return json(res,404,{ok:false,error:'not_found'});";
if(!server.includes(simGuard)){
  if(!server.includes(simAnchor))throw new Error('V1.1.1 patch: simulation route anchor missing');
  server=server.replace(simAnchor,`${simGuard}\n${simAnchor}`);
}
server=server.replace("  console.log('Simulação V0.24: banco simulation.sqlite separado, chaves por seção, reset independente e ambiente de treinamento ativos.');\n",'');
server=server.replace("  console.log('V1.1.0: Ensaio Geral com BUs sintéticos em QR e banco simulation.sqlite isolado ativo.');\n",'');
const catalogLog="  console.log('V1.0.2: catálogo de candidaturas TSE sincronizável com snapshot persistente ativo.');";
const cleanupLog="  console.log('V1.1.1: simulação e ensaio removidos da interface; mapa mantido no fluxo normal da página.');";
if(!server.includes(cleanupLog)){
  if(!server.includes(catalogLog))throw new Error('V1.1.1 patch: startup log anchor missing');
  server=server.replace(catalogLog,`${catalogLog}\n${cleanupLog}`);
}

/* Limpeza única, autorizada pelo usuário, de um lançamento de teste feito antes da eleição.
   O prazo impede que esta rotina possa apagar um BU real posteriormente. */
const maintenanceMarker='cleanup-2026-09-07-sec10-senador-test';
if(!server.includes(maintenanceMarker)){
  if(!server.includes(cleanupLog))throw new Error('V1.1.1 patch: maintenance anchor missing');
  const maintenance=`  try {\n    db.exec(\`CREATE TABLE IF NOT EXISTS maintenance_migrations (\n      id TEXT PRIMARY KEY,\n      applied_at TEXT NOT NULL,\n      details_json TEXT\n    )\`);\n    const migrationId='${maintenanceMarker}';\n    const already=db.prepare('SELECT id FROM maintenance_migrations WHERE id=?').get(migrationId);\n    const deadline=Date.parse('2026-10-01T00:00:00-03:00');\n    if(!already && Date.now()<deadline){\n      const rows=db.prepare('SELECT * FROM results WHERE section=? AND lower(cargo)=?').all(10,'senador');\n      const now=new Date().toISOString();\n      if(rows.length){\n        db.prepare('DELETE FROM results WHERE section=? AND lower(cargo)=?').run(10,'senador');\n        for(const before of rows){\n          insertAudit.run('maintenance_delete',10,String(before.cargo||'senador'),before.place_id||null,'system#maintenance',JSON.stringify(before),null,now);\n        }\n        broadcast('delete',{section:10,cargo:'senador',updatedAt:now});\n        console.log('V1.1.1 manutenção: lançamentos de teste de Senador da seção 10 removidos.');\n      } else {\n        console.log('V1.1.1 manutenção: seção 10/Senador já estava sem lançamento persistente.');\n      }\n      db.prepare('INSERT INTO maintenance_migrations(id,applied_at,details_json) VALUES(?,?,?)').run(migrationId,now,JSON.stringify({section:10,cargo:'senador',deletedRows:rows.length}));\n    }\n  } catch(err) { console.error('V1.1.1 maintenance cleanup failed',err?.message||err); }\n${cleanupLog}`;
  server=server.replace(cleanupLog,maintenance);
}
writeFileSync(serverPath,server);

const presentationCss=String.raw`
/* Ajustes V1.1.1b — votos e identificação partidária */
.natural-v120 .leader,.natural-v120 .leader-row{--candidate-color:var(--ui-blue)}
.natural-v120 .leader .bar i,.natural-v120 .leader-row .bar i,.natural-v120 .leader .vote-bar i,.natural-v120 .leader-row .vote-bar i{background:var(--candidate-color)!important}
.natural-v120 .leader .bar,.natural-v120 .leader-row .bar{height:8px!important;background:#e8edf1!important}
.natural-v120 .votes b{font-variant-numeric:tabular-nums;font-weight:720!important;white-space:nowrap}
.party-identity-v112{display:inline-flex!important;align-items:center!important;gap:6px!important;min-width:0}
.party-mark-v112{--party-color:#174f7a;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:24px;height:24px;padding:2px;border-radius:6px;background:var(--party-color);color:#fff;border:1px solid rgba(0,0,0,.05);overflow:hidden;font-size:7px;font-weight:800;line-height:1;letter-spacing:-.02em}
.party-mark-v112 img{display:none;width:100%;height:100%;object-fit:contain;background:#fff;border-radius:4px}
.party-mark-v112.has-logo-v112 img{display:block}.party-mark-v112.has-logo-v112 .party-mark-fallback-v112{display:none}
.party-mark-fallback-v112{max-width:20px;text-align:center;overflow:hidden}
.natural-v120 .candidate-card{border-left:3px solid var(--candidate-color,transparent)!important}
.natural-v120 .candidate-card .party-mark-v112{width:21px;height:21px;border-radius:5px;font-size:6px}
.natural-v120 .who small.party-identity-v112{margin-top:4px!important}
.natural-v120 .v022-top{width:36px!important;height:36px!important;right:14px!important;bottom:78px!important;border-radius:10px!important;font-size:15px!important;box-shadow:0 4px 12px rgba(15,23,42,.16)!important}
.natural-v120 .v022-top.show{opacity:.84!important}
@media(max-width:760px){.natural-v120 .leader .bar,.natural-v120 .leader-row .bar{height:7px!important}.party-mark-v112{width:22px;height:22px}}
`;

const presentationJs=String.raw`
(()=>{
'use strict';
const P={MDB:['#2f7d55','mdb.org.br'],PDT:['#1356a2','pdt.org.br'],PT:['#c61f2b','pt.org.br'],PCDOB:['#c62828','pcdob.org.br'],PSB:['#d94836','psb40.org.br'],PSDB:['#1565a8','psdb.org.br'],AGIR:['#e36f1e','agir36.com.br'],MOBILIZA:['#1769a8','mobiliza33.com.br'],CIDADANIA:['#d6453a','cidadania23.org.br'],PV:['#2e7d32','pv.org.br'],AVANTE:['#1680b8','avante70.org.br'],PP:['#1469a8','progressistas.org.br'],PSTU:['#c51f25','pstu.org.br'],PCB:['#ad1f24','pcb.org.br'],PRTB:['#2f6b3a','prtb.org.br'],DC:['#177246','democraciacrista.org.br'],PCO:['#9f1d20','pco.org.br'],PODE:['#168d91','podemos.org.br'],REPUBLICANOS:['#1e527c','republicanos10.org.br'],PSOL:['#d88b00','psol50.org.br'],PL:['#175a96','partidoliberal.org.br'],PSD:['#d77822','psd.org.br'],SOLIDARIEDADE:['#df7220','solidariedade.org.br'],NOVO:['#e8751a','novo.org.br'],REDE:['#23875a','redesustentabilidade.org.br'],DEMOCRATA:['#6b4b8a',''],UP:['#8e2d2f','unidadepopular.org.br'],UNIAO:['#1763a7','uniaobrasil.org.br'],PRD:['#354f88',''],MISSAO:['#34516d','']};
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const show=k=>({PCDOB:'PCdoB',UNIAO:'UNIÃO',MISSAO:'MISSÃO'}[k]||k);
function keyFrom(text){const t=norm(text);const keys=Object.keys(P).sort((a,b)=>b.length-a.length);for(const k of keys){const vals=k==='PCDOB'?['PCDOB','PC DO B']:k==='UNIAO'?['UNIAO']:k==='MISSAO'?['MISSAO']:[k];if(vals.some(x=>new RegExp('(^|\\s)'+x+'(\\s|$)').test(t)))return k}return''}
function mark(k){if(!P[k])return null;const m=document.createElement('span');m.className='party-mark-v112';m.style.setProperty('--party-color',P[k][0]);m.setAttribute('aria-label','Partido '+show(k));const f=document.createElement('span');f.className='party-mark-fallback-v112';f.textContent=show(k);m.appendChild(f);if(P[k][1]){const img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.src='https://'+P[k][1]+'/favicon.ico';img.onload=()=>m.classList.add('has-logo-v112');img.onerror=()=>img.remove();m.prepend(img)}return m}
function addMark(node,k){if(!node||!k||node.querySelector('.party-mark-v112'))return;const m=mark(k);if(!m)return;node.classList.add('party-identity-v112');node.prepend(m)}
function voteLabel(el){if(!el||el.dataset.v112VoteLabel)return;const t=(el.textContent||'').trim();if(/^\d{1,3}(?:\.\d{3})*$/.test(t)||/^\d+$/.test(t)){el.textContent=t+' votos';el.dataset.v112VoteLabel='1'}}
function results(){document.querySelectorAll('.leader,.leader-row').forEach(row=>{const pn=row.querySelector('.party-tag,.who small,[data-party],[data-partido]');const k=keyFrom((pn&&((pn.dataset&& (pn.dataset.party||pn.dataset.partido))||pn.textContent))||row.textContent||'');if(k){row.style.setProperty('--candidate-color',P[k][0]);row.querySelectorAll('.bar i,.vote-bar i,.candidate-bar i,.result-bar i').forEach(b=>b.style.setProperty('background',P[k][0],'important'));if(pn)addMark(pn,k)}row.querySelectorAll('.votes b,.vote-count,.candidate-votes,[data-votes]').forEach(voteLabel)})}
function catalog(){const root=document.getElementById('candidateCatalog');if(!root)return;root.querySelectorAll('.candidate-card').forEach(card=>{if(card.dataset.v112Party)return;const k=keyFrom(card.textContent||'');if(!k)return;const nodes=[...card.querySelectorAll('.party-tag,small,span,div,p')].filter(n=>!n.querySelector('.party-mark-v112'));const target=nodes.find(n=>keyFrom(n.textContent||'')===k&&(n.textContent||'').trim().length<190);if(target)addMark(target,k);card.style.setProperty('--candidate-color',P[k][0]);card.dataset.v112Party=k})}
function run(){results();catalog()}
function install(){run();setTimeout(run,300);setTimeout(run,1200);const mo=new MutationObserver(()=>requestAnimationFrame(run));mo.observe(document.body,{childList:true,subtree:true});document.addEventListener('click',()=>setTimeout(run,80),true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
`;

for(const page of pages){
  if(!existsSync(page))continue;
  let html=readFileSync(page,'utf8');
  html=html.replace(/<script\s+src=["']\/v024-main\.js["']><\/script>\s*/g,'');
  html=html.replace(/<script\s+src=["']\/v110-main\.js["']><\/script>\s*/g,'');
  html=html.replace(/<a\b[^>]*href=["']\/(?:simulacao|ensaio)\.html["'][^>]*>[\s\S]*?<\/a>/gi,'');
  if(!html.includes('/v111-cleanup.css')){
    if(!html.includes('</head>'))throw new Error(`V1.1.1 patch: ${page} has no </head>`);
    html=html.replace('</head>','<link rel="stylesheet" href="/v111-cleanup.css">\n</head>');
  }
  if(!html.includes('id="v112-presentation-style"'))html=html.replace('</head>',`<style id="v112-presentation-style">${presentationCss}</style>\n</head>`);
  if(!html.includes('/v111-main.js')){
    if(!html.includes('</body>'))throw new Error(`V1.1.1 patch: ${page} has no </body>`);
    html=html.replace('</body>','<script src="/v111-main.js"></script>\n</body>');
  }
  if(!html.includes('id="v112-presentation-script"'))html=html.replace('</body>',`<script id="v112-presentation-script">${presentationJs}</script>\n</body>`);
  writeFileSync(page,html);
}

rmSync('/app/public/simulacao.html',{force:true});
rmSync('/app/public/ensaio.html',{force:true});

const pkg=JSON.parse(readFileSync(packagePath,'utf8'));
pkg.version='1.1.1';
writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
console.log('V1.1.1 cleanup/presentation patch applied.');