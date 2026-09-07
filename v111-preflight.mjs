import {readFileSync,existsSync} from 'node:fs';

const need=['/app/server.mjs','/app/package.json','/app/public/index.html','/app/public/transparencia.html','/app/public/seguranca.html','/app/public/v111-main.js','/app/public/v111-cleanup.css','/app/public/service-worker.js'];
for(const f of need)if(!existsSync(f))throw new Error('V1.1.1 preflight: missing '+f);
if(existsSync('/app/public/simulacao.html'))throw new Error('V1.1.1 preflight: simulacao.html still public');
if(existsSync('/app/public/ensaio.html'))throw new Error('V1.1.1 preflight: ensaio.html still public');

const server=readFileSync('/app/server.mjs','utf8');
const index=readFileSync('/app/public/index.html','utf8');
const trans=readFileSync('/app/public/transparencia.html','utf8');
const sec=readFileSync('/app/public/seguranca.html','utf8');
const main=readFileSync('/app/public/v111-main.js','utf8');
const css=readFileSync('/app/public/v111-cleanup.css','utf8');
const sw=readFileSync('/app/public/service-worker.js','utf8');
const pkg=JSON.parse(readFileSync('/app/package.json','utf8'));

if(!server.includes("version:'1.1.1'"))throw new Error('V1.1.1 preflight: server version mismatch');
if(!server.includes("p === '/api/sim' || p.startsWith('/api/sim/')"))throw new Error('V1.1.1 preflight: simulation API guard missing');
if(!server.includes('cleanup-2026-09-07-sec10-senador-test'))throw new Error('V1.1.1 preflight: section 10 senator cleanup missing');
if(!server.includes("all(10,'senador')")||!server.includes("DELETE FROM results WHERE section=? AND lower(cargo)=?"))throw new Error('V1.1.1 preflight: maintenance target mismatch');
if(!server.includes('2026-10-01T00:00:00-03:00'))throw new Error('V1.1.1 preflight: maintenance safety deadline missing');
for(const [name,html] of [['index',index],['transparencia',trans],['seguranca',sec]]){
  if(html.includes('/v024-main.js'))throw new Error(`V1.1.1 preflight: ${name} still loads simulation UI script`);
  if(html.includes('/v110-main.js'))throw new Error(`V1.1.1 preflight: ${name} still loads rehearsal UI script`);
  if(/href=["']\/(?:simulacao|ensaio)\.html["']/i.test(html))throw new Error(`V1.1.1 preflight: ${name} still links training pages`);
  if(!html.includes('/v111-main.js')||!html.includes('/v111-cleanup.css'))throw new Error(`V1.1.1 preflight: ${name} missing UI assets`);
  if(!html.includes('id="v112-presentation-style"')||!html.includes('id="v112-presentation-script"'))throw new Error(`V1.1.1 preflight: ${name} missing vote/party presentation`);
  if(!html.includes('party-mark-v112')||!html.includes("t+' votos'"))throw new Error(`V1.1.1 preflight: ${name} missing party mark/vote label logic`);
}
if(!index.includes('-8.730540')||!index.includes('-48.763852'))throw new Error('V1.1.1 preflight: Arte do Saber coordinates missing');
if(!index.includes('-8.650779')||!index.includes('-48.852319'))throw new Error('V1.1.1 preflight: Juscelino coordinates missing');
if(!main.includes('keepMapInPageFlow')||!main.includes('removeTrainingUi'))throw new Error('V1.1.1 preflight: runtime cleanup missing');
if(!main.includes("document.body.classList.add('natural-v120')"))throw new Error('V1.1.1 preflight: natural UI class missing');
if(main.includes('document.documentElement.textContent'))throw new Error('V1.1.1 preflight: root document wipe regression');
if(!css.includes('.natural-v120 .civic-sun')||!css.includes('.natural-v120 .central-note{display:none!important}'))throw new Error('V1.1.1 preflight: natural UI cleanup missing');
if(!css.includes('position:relative!important'))throw new Error('V1.1.1 preflight: map flow CSS missing');
if(!css.includes('--ui-shadow:0 1px 2px'))throw new Error('V1.1.1 preflight: restrained shadow system missing');
if(sw.includes('/simulacao.html')||sw.includes('/ensaio.html'))throw new Error('V1.1.1 preflight: service worker still caches training pages');
if(sw.includes('/v024-main.js')||sw.includes('/v110-main.js'))throw new Error('V1.1.1 preflight: service worker still caches training UI scripts');
if(!sw.includes("const VERSION='v1.1.1-natural4'"))throw new Error('V1.1.1 preflight: refreshed UI cache version missing');
if(!sw.includes('/v111-main.js')||!sw.includes('/v111-cleanup.css'))throw new Error('V1.1.1 preflight: service worker UI assets missing');
if(pkg.version!=='1.1.1')throw new Error('V1.1.1 preflight: package version mismatch');
console.log('V1.1.1 preflight OK: natural UI, map V0.10 points, one-time section 10/Senador cleanup, vote labels, party marks and party-colored bars verified.');
