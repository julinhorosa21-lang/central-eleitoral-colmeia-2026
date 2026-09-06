import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const serverPath='/app/server.mjs';
const packagePath='/app/package.json';
const indexPath='/app/public/index.html';
if(!existsSync(serverPath)) throw new Error('V0.24 patch: server.mjs not found');
let server=readFileSync(serverPath,'utf8');

function replaceOnce(label,from,to){
  if(server.includes(to)) return;
  if(!server.includes(from)) throw new Error(`V0.24 patch: anchor missing: ${label}`);
  server=server.replace(from,to);
}

const resultStmtAnchor=`const getRow = db.prepare('SELECT * FROM results WHERE section=? AND cargo=?');`;
const simDbBlock=`const simDb = new DatabaseSync(path.join(RUNTIME, 'simulation.sqlite'));
simDb.exec(\`
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
CREATE TABLE IF NOT EXISTS simulation_results (
  section INTEGER NOT NULL,
  cargo TEXT NOT NULL,
  place_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(section, cargo)
);
CREATE TABLE IF NOT EXISTS simulation_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  section INTEGER,
  cargo TEXT,
  actor TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL
);
\`);

${resultStmtAnchor}`;
replaceOnce('separate simulation database',resultStmtAnchor,simDbBlock);

const securityStmtAnchor=`const securityChainRows = db.prepare('SELECT * FROM security_events ORDER BY id ASC');`;
const simStmtBlock=`${securityStmtAnchor}
const simGetRow = simDb.prepare('SELECT * FROM simulation_results WHERE section=? AND cargo=?');
const simListRows = simDb.prepare('SELECT * FROM simulation_results ORDER BY section,cargo');
const simInsertRow = simDb.prepare('INSERT INTO simulation_results(section,cargo,place_id,payload_json,updated_at,updated_by,version) VALUES(?,?,?,?,?,?,1)');
const simUpdateRow = simDb.prepare('UPDATE simulation_results SET place_id=?,payload_json=?,updated_at=?,updated_by=?,version=version+1 WHERE section=? AND cargo=?');
const simDeleteAll = simDb.prepare('DELETE FROM simulation_results');
const simInsertAudit = simDb.prepare('INSERT INTO simulation_audit(action,section,cargo,actor,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?)');
const simAuditRows = simDb.prepare('SELECT * FROM simulation_audit ORDER BY id DESC LIMIT ?');
const simClearAudit = simDb.prepare('DELETE FROM simulation_audit');`;
replaceOnce('simulation prepared statements',securityStmtAnchor,simStmtBlock);

const adminOverviewAnchor=`function adminOverview() {`;
const simHelpers=`function simRowToPublic(row) {
  return {section:Number(row.section),cargo:row.cargo,placeId:row.place_id,payload:safeJson(row.payload_json),updatedAt:row.updated_at,updatedBy:displayActor(row.updated_by),version:Number(row.version||1),simulation:true};
}
function simulationSnapshot() {
  const results={}; let latest=null;
  for(const row of simListRows.all()) {
    const item=simRowToPublic(row);
    results[\`${'${'}row.section}:${'${'}row.cargo}\`]=item;
    if(!latest || row.updated_at>latest) latest=row.updated_at;
  }
  return {simulation:true,database:'simulation.sqlite',results,updatedAt:latest,total:Object.keys(results).length};
}
function simulationMeta() {
  const sections=[...sectionToPlace.entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([section,placeId])=>{
    const place=locations.locais.find(x=>x.id===placeId);
    return {section:Number(section),placeId,placeName:place?.nome||placeId,region:place?.regiao||'',aggregatedSections:Number(section)===49?[113]:[]};
  });
  return {simulation:true,database:'simulation.sqlite',cargos:[...allowedCargos],sections};
}

${adminOverviewAnchor}`;
replaceOnce('simulation helpers',adminOverviewAnchor,simHelpers);

replaceOnce('version',"version:'0.23.0'","version:'0.24.0'");

const snapshotAnchor=`    if (p === '/api/snapshot') return json(res,200,{ok:true,...snapshot()});`;
const simRoutes=`    if (p === '/api/sim/meta') return json(res,200,{ok:true,...simulationMeta()});
    if (p === '/api/sim/snapshot') return json(res,200,{ok:true,...simulationSnapshot()});
    if (p === '/api/sim/results' && req.method === 'POST') {
      const rl=takeRateLimit('sim-results:'+sourceHash+':'+(tokenHint||'none'),90,60000);
      if(!rl.ok){ securityEvent({event:'simulation_rate_limited',outcome:'training_denied',tokenHint,sourceHash,requestId,details:{route:'/api/sim/results'}}); res.setHeader('retry-after',String(rl.retryAfter)); return json(res,429,{ok:false,error:'rate_limited',retryAfter:rl.retryAfter,simulation:true}); }
      const user=auth(req);
      if(!user){ securityEvent({event:'simulation_auth_failure',outcome:'training_denied',tokenHint,sourceHash,requestId,details:{route:'/api/sim/results'}}); return json(res,401,{ok:false,error:'unauthorized',simulation:true}); }
      const body=await readBody(req);
      const section=Number(body.section),cargo=String(body.cargo||''),placeId=sectionToPlace.get(section);
      if(!placeId || !allowedCargos.has(cargo)){ securityEvent({event:'simulation_invalid_submission',outcome:'training_denied',section:Number.isFinite(section)?section:null,cargo,actor:user.name,tokenHint,sourceHash,requestId,details:{reason:'invalid_section_or_cargo'}}); return json(res,400,{ok:false,error:'invalid_section_or_cargo',simulation:true}); }
      if(!canWrite(user,section)){ securityEvent({event:'simulation_forbidden',outcome:'training_denied',section,cargo,actor:user.name,tokenHint,sourceHash,requestId,details:{allowedSections:user.sections}}); return json(res,403,{ok:false,error:'operator_not_allowed_for_section',section,simulation:true}); }
      const payload=cleanPayload({...body,fonte:'SIMULAÇÃO · Dados fictícios'},user.name,'simulation');
      payload.simulation=true;
      const now=new Date().toISOString();
      const before=simGetRow.get(section,cargo)||null;
      const payloadJson=JSON.stringify(payload);
      if(before) simUpdateRow.run(placeId,payloadJson,now,user.name,section,cargo);
      else simInsertRow.run(section,cargo,placeId,payloadJson,now,user.name);
      const after=simGetRow.get(section,cargo);
      const action=before && resultChanged(before.payload_json,payloadJson)?'correction':before?'update':'create';
      simInsertAudit.run(action,section,cargo,user.name,before?JSON.stringify(before):null,JSON.stringify(after),now);
      securityEvent({event:'simulation_write',outcome:'training',section,cargo,actor:user.name,tokenHint,sourceHash,requestId,details:{action,version:after.version,database:'simulation.sqlite'}});
      return json(res,200,{ok:true,simulation:true,result:simRowToPublic(after)});
    }
    if (p === '/api/sim/reset' && req.method === 'DELETE') {
      const user=auth(req);
      if(!user || user.role!=='admin'){ securityEvent({event:'simulation_admin_denied',outcome:'training_denied',actor:user?.name||null,tokenHint,sourceHash,requestId,details:{route:'/api/sim/reset'}}); return json(res,403,{ok:false,error:'admin_required',simulation:true}); }
      const beforeCount=simListRows.all().length;
      simDeleteAll.run(); simClearAudit.run();
      const now=new Date().toISOString();
      simInsertAudit.run('reset',null,null,user.name,JSON.stringify({rows:beforeCount}),null,now);
      securityEvent({event:'simulation_reset',outcome:'training',actor:user.name,tokenHint,sourceHash,requestId,details:{deletedRows:beforeCount,database:'simulation.sqlite'}});
      return json(res,200,{ok:true,simulation:true,deleted:beforeCount});
    }
    if (p === '/api/sim/export') {
      const user=auth(req);
      if(!user || user.role!=='admin') return json(res,403,{ok:false,error:'admin_required',simulation:true});
      securityEvent({event:'simulation_export',outcome:'training',actor:user.name,tokenHint,sourceHash,requestId,details:{database:'simulation.sqlite'}});
      return json(res,200,{ok:true,simulation:true,generatedAt:new Date().toISOString(),snapshot:simulationSnapshot(),audit:simAuditRows.all(500).map(x=>({id:x.id,action:x.action,section:x.section,cargo:x.cargo,actor:displayActor(x.actor),createdAt:x.created_at}))});
    }
${snapshotAnchor}`;
replaceOnce('simulation routes',snapshotAnchor,simRoutes);

const logAnchor=`  console.log('Segurança V0.23: rate limiting, tentativas inválidas, correções classificadas e trilha de integridade ativos.');`;
const logReplacement=`${logAnchor}
  console.log('Simulação V0.24: banco simulation.sqlite separado, chaves por seção, reset independente e ambiente de treinamento ativos.');`;
replaceOnce('simulation startup log',logAnchor,logReplacement);

writeFileSync(serverPath,server);

if(existsSync(indexPath)){
  let html=readFileSync(indexPath,'utf8');
  if(!html.includes('/v024-main.js')){
    if(!html.includes('</body>')) throw new Error('V0.24 patch: index has no </body>');
    html=html.replace('</body>','<script src="/v024-main.js"></script>\n</body>');
    writeFileSync(indexPath,html);
  }
}

if(existsSync(packagePath)){
  const pkg=JSON.parse(readFileSync(packagePath,'utf8'));
  pkg.version='0.24.0';
  writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
}
console.log('V0.24 isolated simulation patch applied successfully.');
