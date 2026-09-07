import {readFileSync,existsSync} from 'node:fs';
const need=['/app/public/index.html','/app/public/transparencia.html','/app/public/seguranca.html','/app/public/v121-polish.css','/app/public/v121-polish.js','/app/public/service-worker.js'];
for(const f of need)if(!existsSync(f))throw new Error('V1.2.1 preflight: missing '+f);
const pages=need.slice(0,3).map(f=>[f,readFileSync(f,'utf8')]);
for(const [f,html] of pages){
  if(!html.includes('/v121-polish.css')||!html.includes('/v121-polish.js'))throw new Error('V1.2.1 preflight: polish assets missing in '+f);
  if(html.includes('/simulacao.html')||html.includes('/ensaio.html'))throw new Error('V1.2.1 preflight: training link regression in '+f);
}
const index=pages[0][1];
if(!index.includes('-8.730540')||!index.includes('-48.763852')||!index.includes('-8.650779')||!index.includes('-48.852319'))throw new Error('V1.2.1 preflight: confirmed map points missing');
const css=readFileSync('/app/public/v121-polish.css','utf8');
const js=readFileSync('/app/public/v121-polish.js','utf8');
const sw=readFileSync('/app/public/service-worker.js','utf8');
if(!css.includes('grid-template-columns:repeat(2,minmax(0,1fr))')||!css.includes('.toolbar{')||!css.includes('.v022-version{display:none!important}'))throw new Error('V1.2.1 preflight: tablet polish rules missing');
if(!js.includes('FEITO PARA NOSSA POPULAÇÃO ACOMPANHAR')||!js.includes('ui-compact-panel'))throw new Error('V1.2.1 preflight: compact panel runtime missing');
if(!sw.includes("const VERSION='v1.1.1-natural5'"))throw new Error('V1.2.1 preflight: cache version mismatch');
if(!sw.includes('/v121-polish.css')||!sw.includes('/v121-polish.js'))throw new Error('V1.2.1 preflight: polish assets missing from PWA cache');
console.log('V1.2.1 preflight OK: polished tablet/mobile layout, compact panels, responsive toolbar and two-column candidate catalog verified.');
