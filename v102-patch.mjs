import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
const serverPath='/app/server.mjs';
const packagePath='/app/package.json';
const indexPath='/app/public/index.html';
const catalogPath='/app/public/data/candidate-catalog.json';
for(const f of [serverPath,packagePath,indexPath]) if(!existsSync(f)) throw new Error(`V1.0.2 patch: missing ${f}`);
let server=readFileSync(serverPath,'utf8');
function replaceOnce(label,from,to){if(server.includes(to))return;if(!server.includes(from))throw new Error(`V1.0.2 patch: anchor missing: ${label}`);server=server.replace(from,to)}

replaceOnce('server version',"version:'1.0.1'","version:'1.0.2'");

const resultStmt=`const getRow = db.prepare('SELECT * FROM results WHERE section=? AND cargo=?');`;
const catalogSchema=`db.exec(\`
CREATE TABLE IF NOT EXISTS candidate_catalog_snapshot (
  id INTEGER PRIMARY KEY CHECK(id=1),
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source TEXT NOT NULL
);
\`);
${resultStmt}`;
replaceOnce('candidate catalog table',resultStmt,catalogSchema);

const securityStmt=`const securityChainRows = db.prepare('SELECT * FROM security_events ORDER BY id ASC');`;
const catalogStmts=`${securityStmt}
const candidateSnapshotGet = db.prepare('SELECT payload_json,updated_at,source FROM candidate_catalog_snapshot WHERE id=1');
const candidateSnapshotUpsert = db.prepare(\`INSERT INTO candidate_catalog_snapshot(id,payload_json,updated_at,source) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET payload_json=excluded.payload_json,updated_at=excluded.updated_at,source=excluded.source\`);`;
replaceOnce('candidate catalog statements',securityStmt,catalogStmts);

const adminAnchor='function adminOverview() {';
const helpers=`function candidateCsvLine(line){
  const out=[];let cur='',quoted=false;
  for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++}else quoted=!quoted}else if(ch===';'&&!quoted){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out;
}
function candidateNorm(v){return String(v??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function candidatePrettyStatus(v){const s=String(v||'').trim();if(!s)return'';return s.toLocaleLowerCase('pt-BR').replace(/(^|[\\s/-])([a-záàâãéêíóôõúç])/g,(m,a,b)=>a+b.toLocaleUpperCase('pt-BR'))}
function candidateStatusRank(v){const s=candidateNorm(v);if(s.includes('RENUNC')||s.includes('INAPTO')||s.includes('CANCELADO'))return 1;if(s.includes('DEFERIDO'))return 5;if(s.includes('AGUARDANDO')||s.includes('PEDIDO'))return 4;return 3}
function storedCandidateSnapshot(){const row=candidateSnapshotGet.get();if(!row)return null;const snap=safeJson(row.payload_json);if(!snap||typeof snap!=='object')return null;return {...snap,storedAt:row.updated_at}}
async function refreshCandidateCatalogFromTse(){
  const URL='https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip';
  const {mkdtempSync,writeFileSync:fsWrite,readFileSync:fsRead,rmSync,readdirSync,statSync,mkdirSync:fsMkdir}=await import('node:fs');
  const {tmpdir}=await import('node:os');
  const {join,basename}=await import('node:path');
  const {execFileSync}=await import('node:child_process');
  const {createHash}=await import('node:crypto');
  const tmp=mkdtempSync(join(tmpdir(),'central-cand-')),zip=join(tmp,'cand.zip'),out=join(tmp,'out');fsMkdir(out,{recursive:true});
  function walk(dir){const a=[];for(const n of readdirSync(dir)){const p=join(dir,n),st=statSync(p);if(st.isDirectory())a.push(...walk(p));else a.push(p)}return a}
  function parse(file,scope,candidates){
    const text=fsRead(file,'latin1').replace(/^\\uFEFF/,'');const lines=text.split(/\\r?\\n/).filter(Boolean);const header=candidateCsvLine(lines.shift());const idx=Object.fromEntries(header.map((h,i)=>[h,i]));
    for(const k of ['SG_UF','DS_CARGO','SQ_CANDIDATO','NR_CANDIDATO','NM_CANDIDATO','NM_URNA_CANDIDATO','SG_PARTIDO'])if(!(k in idx))throw new Error('candidate csv missing '+k);
    const statusKey=['DS_SITUACAO_CANDIDATURA','DS_SITUACAO_CANDIDATO_PLEITO','DS_SITUACAO_CANDIDATO_URNA','DS_SITUACAO'].find(k=>k in idx);
    for(const line of lines){const r=candidateCsvLine(line);const uf=String(r[idx.SG_UF]||'').toUpperCase();if(scope==='TO'&&uf!=='TO')continue;if(scope==='BR'&&uf!=='BR')continue;const cargo=candidateNorm(r[idx.DS_CARGO]);const key=cargo==='PRESIDENTE'?'presidente':cargo==='GOVERNADOR'?'governador':cargo==='SENADOR'?'senador':cargo==='DEPUTADO FEDERAL'?'depFederal':cargo==='DEPUTADO ESTADUAL'?'depEstadual':null;if(!key)continue;if(key==='presidente'&&scope!=='BR')continue;if(key!=='presidente'&&scope!=='TO')continue;
      const numero=String(r[idx.NR_CANDIDATO]||'').replace(/\\D/g,''),sq=String(r[idx.SQ_CANDIDATO]||'').replace(/\\D/g,'');if(!numero||!sq)continue;const situacao=candidatePrettyStatus(statusKey?r[idx[statusKey]]:'');const item={nome:String(r[idx.NM_CANDIDATO]||'').trim(),nomeUrna:String(r[idx.NM_URNA_CANDIDATO]||'').trim(),numero,partido:String(r[idx.SG_PARTIDO]||'').trim(),situacao,sqCandidato:sq,foto:\`https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/${'${'}sq}/${'${'}key==='presidente'?'BR':'TO'}\`,fotoFonte:'TSE · DivulgaCandContas'};const prev=candidates[key].get(numero);if(!prev||candidateStatusRank(item.situacao)>candidateStatusRank(prev.situacao))candidates[key].set(numero,item);
    }
  }
  try{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),120000);let response;
    try{response=await fetch(URL,{signal:ctl.signal,headers:{'user-agent':'Central-Eleitoral-Colmeia/1.0.2'}})}finally{clearTimeout(timer)}
    if(!response.ok)throw new Error('TSE HTTP '+response.status);const buf=Buffer.from(await response.arrayBuffer());if(buf.length<10000)throw new Error('TSE candidate archive too small');fsWrite(zip,buf);execFileSync('unzip',['-q','-o',zip,'-d',out],{timeout:120000,stdio:'ignore'});
    const files=walk(out),toCsv=files.find(p=>/^consulta_cand_2026_TO\\.csv$/i.test(basename(p))),brCsv=files.find(p=>/^consulta_cand_2026_(?:BR|BRASIL)\\.csv$/i.test(basename(p)));if(!toCsv||!brCsv)throw new Error('TSE candidate CSV TO/BRASIL not found');
    const maps=Object.fromEntries(['presidente','governador','senador','depFederal','depEstadual'].map(k=>[k,new Map()]));parse(brCsv,'BR',maps);parse(toCsv,'TO',maps);const candidates=Object.fromEntries(Object.entries(maps).map(([k,m])=>[k,[...m.values()].sort((a,b)=>Number(a.numero)-Number(b.numero))]));const counts=Object.fromEntries(Object.entries(candidates).map(([k,a])=>[k,a.length]));
    if(counts.presidente<5||counts.governador<4||counts.senador<6||counts.depFederal<80||counts.depEstadual<170)throw new Error('suspicious candidate counts '+JSON.stringify(counts));
    const generatedAt=new Date().toISOString();const payload={version:'1.0.2',generatedAt,source:{name:'Portal de Dados Abertos do TSE',url:URL},counts,candidates};payload.sha256=createHash('sha256').update(JSON.stringify(payload)).digest('hex');candidateSnapshotUpsert.run(JSON.stringify(payload),generatedAt,URL);return payload;
  } finally {rmSync(tmp,{recursive:true,force:true})}
}

${adminAnchor}`;
replaceOnce('candidate catalog helpers',adminAnchor,helpers);

const snapshotAnchor=`    if (p === '/api/snapshot') return json(res,200,{ok:true,...snapshot()});`;
const routes=`    if (p === '/api/candidates' && req.method === 'GET') {const snap=storedCandidateSnapshot();return json(res,200,{ok:true,available:!!snap,snapshot:snap});}
    if (p === '/api/admin/candidates/refresh' && req.method === 'POST') {
      const rl=takeRateLimit('candidate-refresh:'+sourceHash,3,3600000);if(!rl.ok){res.setHeader('retry-after',String(rl.retryAfter));return json(res,429,{ok:false,error:'rate_limited',retryAfter:rl.retryAfter});}
      const user=auth(req);if(!user||user.role!=='admin'){securityEvent({event:'candidate_catalog_refresh_denied',outcome:'denied',actor:user?.name||null,tokenHint,sourceHash,requestId});return json(res,403,{ok:false,error:'admin_required'});}
      try{const snap=await refreshCandidateCatalogFromTse();securityEvent({event:'candidate_catalog_refresh',outcome:'accepted',actor:user.name,tokenHint,sourceHash,requestId,details:{counts:snap.counts,sha256:snap.sha256}});return json(res,200,{ok:true,snapshot:snap});}
      catch(e){securityEvent({event:'candidate_catalog_refresh_error',outcome:'error',actor:user.name,tokenHint,sourceHash,requestId,details:{message:String(e?.message||e).slice(0,220)}});return json(res,502,{ok:false,error:'candidate_refresh_failed',message:'O catálogo anterior foi preservado.'});}
    }
${snapshotAnchor}`;
replaceOnce('candidate catalog routes',snapshotAnchor,routes);

const stableLog="console.log('V1.0.1: versão estável com hotfix de abertura da interface ativo.');";
const syncLog="console.log('V1.0.2: catálogo de candidaturas TSE sincronizável com snapshot persistente ativo.');";
if(!server.includes(syncLog)){if(!server.includes(stableLog))throw new Error('V1.0.2 patch: startup log anchor missing');server=server.replace(stableLog,`${stableLog}\n  ${syncLog}`)}
writeFileSync(serverPath,server);

mkdirSync('/app/public/data',{recursive:true});
if(!existsSync(catalogPath)){
  const html=readFileSync(indexPath,'utf8');const m=html.match(/const CANDIDATOS=(\{[\s\S]*?\});\nconst CARGOS=/);if(!m)throw new Error('V1.0.2 patch: embedded candidate catalog anchor missing');const embedded=JSON.parse(m[1]);const candidates={};for(const cargo of ['presidente','governador','senador','depFederal','depEstadual'])candidates[cargo]=(embedded[cargo]||[]).map(c=>({...c}));const counts=Object.fromEntries(Object.entries(candidates).map(([k,a])=>[k,a.length]));writeFileSync(catalogPath,JSON.stringify({version:'1.0.2-fallback',generatedAt:new Date().toISOString(),source:{name:'Snapshot local incorporado na release'},counts,candidates}));
}
let html=readFileSync(indexPath,'utf8');
for(const asset of ['/v102-candidates.js','/v102-main.js'])if(!html.includes(asset)){if(!html.includes('</body>'))throw new Error('V1.0.2 patch: index has no </body>');html=html.replace('</body>',`<script src="${asset}"></script>\n</body>`)}
writeFileSync(indexPath,html);
const pkg=JSON.parse(readFileSync(packagePath,'utf8'));pkg.version='1.0.2';writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
console.log('V1.0.2 candidate synchronization patch applied.');