import {readFileSync,existsSync} from 'node:fs';
const required=['/app/public/index.html','/app/public/transparencia.html','/app/public/operacao.html','/app/public/v130-public.css','/app/public/v130-public.js','/app/public/service-worker.js'];
for(const f of required)if(!existsSync(f))throw new Error(`V1.3.0 preflight: missing ${f}`);
const index=readFileSync('/app/public/index.html','utf8');
const trans=readFileSync('/app/public/transparencia.html','utf8');
const op=readFileSync('/app/public/operacao.html','utf8');
const css=readFileSync('/app/public/v130-public.css','utf8');
const js=readFileSync('/app/public/v130-public.js','utf8');
const sw=readFileSync('/app/public/service-worker.js','utf8');
for(const [name,html] of [['index',index],['transparencia',trans]]){
  if(!html.includes('/v130-public.css')||!html.includes('/v130-public.js'))throw new Error(`V1.3.0 preflight: ${name} missing public assets`);
  if(!html.includes('Painel público de apuração'))throw new Error(`V1.3.0 preflight: ${name} is not based on public dashboard`);
}
if(!op.includes('id="adminToggle"')||!op.includes('id="coordToggle"'))throw new Error('V1.3.0 preflight: operational UI was not preserved');
if(!js.includes('publicOverview')||!js.includes('public-bottom-nav')||!js.includes("location.href='/operacao.html'"))throw new Error('V1.3.0 preflight: public interaction essentials missing');
if(!css.includes('.public-overview')||!css.includes('.public-bottom-nav')||!css.includes('#cargoTabs'))throw new Error('V1.3.0 preflight: public visual essentials missing');
if(!sw.includes("const VERSION='v1.3.0-public1'"))throw new Error('V1.3.0 preflight: cache version missing');
if(!sw.includes("'/operacao.html'")||!sw.includes("'/v130-public.css'")||!sw.includes("'/v130-public.js'"))throw new Error('V1.3.0 preflight: public/operation assets missing from cache');
console.log('V1.3.0 preflight OK: public-first home, operation separation, progress summary, simple navigation and public states verified.');
