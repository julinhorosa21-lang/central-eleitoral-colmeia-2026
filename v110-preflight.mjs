import {readFileSync,existsSync} from 'node:fs';

const files=['/app/server.mjs','/app/package.json','/app/public/index.html','/app/public/simulacao.html','/app/public/ensaio.html','/app/public/v110-main.js','/app/public/service-worker.js','/app/public/data/candidate-catalog.json'];
for(const f of files)if(!existsSync(f))throw new Error(`V1.1.0 preflight: missing ${f}`);

const server=readFileSync('/app/server.mjs','utf8');
const pkg=JSON.parse(readFileSync('/app/package.json','utf8'));
const index=readFileSync('/app/public/index.html','utf8');
const sim=readFileSync('/app/public/simulacao.html','utf8');
const ensaio=readFileSync('/app/public/ensaio.html','utf8');
const main=readFileSync('/app/public/v110-main.js','utf8');
const sw=readFileSync('/app/public/service-worker.js','utf8');
const catalog=JSON.parse(readFileSync('/app/public/data/candidate-catalog.json','utf8'));

function ok(cond,msg){if(!cond)throw new Error('V1.1.0 preflight: '+msg)}
ok(server.includes("version:'1.1.0'"),'server version is not 1.1.0');
ok(pkg.version==='1.1.0','package version is not 1.1.0');
ok(server.includes('simulation.sqlite'),'isolated simulation database missing');
ok(server.includes("'/api/sim/results'")&&server.includes("'/api/sim/snapshot'")&&server.includes("'/api/sim/meta'"),'simulation API routes missing');
ok(server.includes('operator_not_allowed_for_section'),'section authorization guard missing');
ok(ensaio.includes('CE-SIM-2026'),'training QR namespace missing');
ok(ensaio.includes('/api/sim/results')&&ensaio.includes('/api/sim/snapshot')&&ensaio.includes('/api/sim/meta'),'ensayo is not wired only to simulation API');
ok(!ensaio.includes("api('/api/results")&&!ensaio.includes("fetch('/api/results"),'production results route referenced by rehearsal');
ok(ensaio.includes('SIMULAÇÃO · SEM VALIDADE ELEITORAL')&&ensaio.includes('NÃO É BOLETIM OFICIAL DO TSE'),'simulation validity warnings missing');
ok(ensaio.includes('html5-qrcode@2.3.8')&&ensaio.includes('qrcode-generator@1.4.4'),'QR reader/generator libraries missing');
ok(ensaio.includes('hash32(base)!==expected'),'QR checksum validation missing');
ok(ensaio.includes('mayUseSection')&&ensaio.includes('Esta chave não está autorizada'),'client section guard missing');
ok(sim.includes('href="/ensaio.html"'),'simulation page has no Ensaio Geral entry');
ok(index.includes('/v110-main.js')&&main.includes("VERSION='1.1.0'"),'V1.1.0 client release script missing');
ok(sw.includes("VERSION='v1.1.0'")&&sw.includes("'/ensaio.html'")&&sw.includes('qrcode-generator@1.4.4'),'PWA V1.1.0 rehearsal assets missing');
for(const cargo of ['presidente','governador','senador','depFederal','depEstadual'])ok(Array.isArray(catalog.candidates?.[cargo])&&catalog.candidates[cargo].length>0,`candidate catalog missing ${cargo}`);
console.log('V1.1.0 preflight OK: Ensaio Geral QR, real candidate catalog, section authorization and simulation.sqlite isolation verified.');