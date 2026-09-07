import {readFileSync,existsSync,readdirSync} from 'node:fs';
const serverPath='/app/server.mjs';
const publicDir='/app/public';
const server=readFileSync(serverPath,'utf8');

function need(haystack,token,label=token){if(!haystack.includes(token)) throw new Error(`V1.0 preflight: missing ${label}`)}
function needFile(file){if(!existsSync(file)) throw new Error(`V1.0 preflight: missing file ${file}`)}

need(server,"version:'1.0.0'",'server version 1.0.0');
const routes=[
  '/api/health','/api/snapshot','/api/whoami','/api/stream',
  '/api/tse/status','/api/tse/section','/api/tse/comparison','/api/tse/refresh',
  '/api/admin/overview','/api/admin/section-detail','/api/admin/export','/api/audit',
  '/api/admin/security-summary','/api/admin/security-events','/api/admin/security-export',
  '/api/results','/api/sim/meta','/api/sim/snapshot','/api/sim/results','/api/sim/reset','/api/sim/export'
];
for(const route of routes) need(server,route,route);
for(const cargo of ['presidente','governador','senador','depFederal','depEstadual']) need(server,cargo,`cargo ${cargo}`);
for(const token of [
  'CREATE TABLE IF NOT EXISTS security_events','verifySecurityChain()','takeRateLimit(',
  "event:'auth_failure'","event:'forbidden_section'","event:'rate_limited'",
  "'result_correction'","'result_write'",
  "new DatabaseSync(path.join(RUNTIME, 'simulation.sqlite'))",'CREATE TABLE IF NOT EXISTS simulation_results',
  'simInsertRow.run','simUpdateRow.run','simulationSnapshot()'
]) need(server,token);

const simStart=server.indexOf("if (p === '/api/sim/results' && req.method === 'POST')");
const simEnd=server.indexOf("if (p === '/api/sim/reset'",simStart);
if(simStart<0||simEnd<0) throw new Error('V1.0 preflight: simulation route boundaries missing');
const simRoute=server.slice(simStart,simEnd);
for(const forbidden of ['insertRow.run(','updateRow.run(','deleteRow.run(']) if(simRoute.includes(forbidden)) throw new Error(`V1.0 preflight: simulation route touches real results via ${forbidden}`);
need(simRoute,'simInsertRow.run','isolated simulation insert');
need(simRoute,'simUpdateRow.run','isolated simulation update');

const snapStart=server.indexOf('function snapshot()');
const snapEnd=server.indexOf('function simulationSnapshot()',snapStart);
if(snapStart<0||snapEnd<0) throw new Error('V1.0 preflight: real snapshot boundary missing');
const realSnapshot=server.slice(snapStart,snapEnd);
need(realSnapshot,'listRows.all()','real snapshot result source');
if(realSnapshot.includes('simListRows')) throw new Error('V1.0 preflight: real snapshot contaminated by simulation data');

const requiredFiles=[
  'index.html','transparencia.html','seguranca.html','simulacao.html','manifest.webmanifest','bu-parser.js',
  'v021-main.js','v022-main.js','v022-visual.css','v0221-civic.js','v0221-civic.css','v0222-contrast.css',
  'v023-main.js','v024-main.js','v0241-photos.js','v0241-photos.css','v100-main.js','service-worker.js',
  'data/candidate-photo-map.json','icons/icon-192.png','icons/icon-512.png'
];
for(const rel of requiredFiles) needFile(`${publicDir}/${rel}`);

for(const page of ['index.html','transparencia.html','seguranca.html','simulacao.html']){
  const html=readFileSync(`${publicDir}/${page}`,'utf8');
  need(html,'/v100-main.js',`${page} stable release script`);
  if(!html.includes('</html>')&&!html.includes('</body>')) throw new Error(`V1.0 preflight: malformed ${page}`);
  for(const forbidden of ['ADMIN_TOKEN','OPERATOR_TOKENS']) if(html.includes(forbidden)) throw new Error(`V1.0 preflight: environment token name leaked into ${page}`);
}

const sw=readFileSync(`${publicDir}/service-worker.js`,'utf8');
need(sw,"VERSION='v1.0.0'",'service worker 1.0.0');
for(const asset of ["'/index.html'","'/transparencia.html'","'/seguranca.html'","'/simulacao.html'","'/v100-main.js'","'/data/candidate-photo-map.json'"]) need(sw,asset,`PWA core ${asset}`);
need(sw,"'/candidate-photos/'",'progressive candidate photo cache');

const map=JSON.parse(readFileSync(`${publicDir}/data/candidate-photo-map.json`,'utf8'));
const federal=Object.values(map.byCargo?.depFederal||{}),estadual=Object.values(map.byCargo?.depEstadual||{});
if(federal.length<90||estadual.length<190) throw new Error(`V1.0 preflight: candidate photo coverage too low ${federal.length}/${estadual.length}`);
for(const item of [...federal,...estadual]) needFile(`${publicDir}${item.foto}`);
const photoCount=readdirSync(`${publicDir}/candidate-photos`).filter(n=>/^\d+\.jpg$/.test(n)).length;
if(photoCount<300) throw new Error(`V1.0 preflight: only ${photoCount} candidate photos packaged`);

const pkg=JSON.parse(readFileSync('/app/package.json','utf8'));
if(pkg.version!=='1.0.0') throw new Error(`V1.0 preflight: package version ${pkg.version}`);
const v100=readFileSync(`${publicDir}/v100-main.js`,'utf8');
need(v100,"const VERSION='1.0.0'",'client release version');
const photoUi=readFileSync(`${publicDir}/v0241-photos.js`,'utf8');
if(photoUi.includes('decorateGenericResults();updateVersion()')) throw new Error('V1.0 preflight: legacy photo UI still overrides stable version label');

console.log(`V1.0 preflight OK: core routes, auth/audit guards, TSE integration, isolated simulation, PWA shell and ${photoCount} candidate photos verified (${federal.length} federal + ${estadual.length} estadual).`);
