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
for(const [name,html] of [['index',index],['transparencia',trans],['seguranca',sec]]){
  if(html.includes('/v024-main.js'))throw new Error(`V1.1.1 preflight: ${name} still loads simulation UI script`);
  if(html.includes('/v110-main.js'))throw new Error(`V1.1.1 preflight: ${name} still loads rehearsal UI script`);
  if(/href=["']\/(?:simulacao|ensaio)\.html["']/i.test(html))throw new Error(`V1.1.1 preflight: ${name} still links training pages`);
  if(!html.includes('/v111-main.js')||!html.includes('/v111-cleanup.css'))throw new Error(`V1.1.1 preflight: ${name} missing cleanup assets`);
}
if(!main.includes('keepMapInPageFlow')||!main.includes('removeTrainingUi'))throw new Error('V1.1.1 preflight: runtime cleanup missing');
if(!css.includes('.mapbox')||!css.includes('position:relative!important'))throw new Error('V1.1.1 preflight: map flow CSS missing');
if(sw.includes('/simulacao.html')||sw.includes('/ensaio.html'))throw new Error('V1.1.1 preflight: service worker still caches training pages');
if(sw.includes('/v024-main.js')||sw.includes('/v110-main.js'))throw new Error('V1.1.1 preflight: service worker still caches training UI scripts');
if(!sw.includes('/v111-main.js')||!sw.includes('/v111-cleanup.css'))throw new Error('V1.1.1 preflight: service worker cleanup assets missing');
if(pkg.version!=='1.1.1')throw new Error('V1.1.1 preflight: package version mismatch');
console.log('V1.1.1 preflight OK: simulation/rehearsal removed and map forced into normal page flow.');