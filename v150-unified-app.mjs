import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

// 1) Um único manifesto para Público + Operação + Administração.
const manifestPath=`${pub}/manifest.webmanifest`;
const manifest=JSON.parse(read(manifestPath));
manifest.id='/';
manifest.name='Central Eleitoral Colméia 2026';
manifest.short_name='Central Eleitoral';
manifest.start_url='/?source=pwa';
manifest.scope='/';
manifest.display='standalone';
manifest.background_color=manifest.background_color||'#f3f6f8';
manifest.theme_color=manifest.theme_color||'#123f62';
manifest.shortcuts=[
  {name:'Apuração pública',short_name:'Apuração',description:'Acompanhar a apuração local',url:'/?atalho=apuracao',icons:[{src:'/icons/icon-192.png',sizes:'192x192',type:'image/png'}]},
  {name:'Área operacional',short_name:'Operadores',description:'Registrar e conferir boletins de urna',url:'/operacao.html?atalho=operacao',icons:[{src:'/icons/icon-192.png',sizes:'192x192',type:'image/png'}]},
  {name:'Central Administrativa',short_name:'Administração',description:'Coordenação das 29 seções e conferência',url:'/admin/index.html?atalho=admin',icons:[{src:'/icons/icon-192.png',sizes:'192x192',type:'image/png'}]}
];
write(manifestPath,JSON.stringify(manifest,null,2));

// 2) Acesso aos três módulos a partir da tela pública do mesmo app.
const unifiedCss=`
/* V1.5.0 — um único app, três módulos */
.unified-team-entry{display:inline-flex;align-items:center;gap:6px;margin-top:7px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.09);color:#fff;border-radius:999px;padding:6px 10px;font:inherit;font-size:10.5px;font-weight:800;cursor:pointer}.unified-team-entry svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.unified-sheet-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(8,24,35,.48);display:flex;align-items:flex-end;justify-content:center;padding:12px}.unified-sheet{width:min(520px,100%);background:#fff;border-radius:18px 18px 14px 14px;padding:16px;box-shadow:0 -18px 50px rgba(0,0,0,.2);color:#193246}.unified-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.unified-sheet-head h2{font-size:18px;margin:0 0 3px}.unified-sheet-head p{font-size:11px;color:#6b7a85;margin:0}.unified-sheet-close{border:0;background:#eef3f6;color:#294b63;width:36px;height:36px;border-radius:10px;font-size:20px;cursor:pointer}.unified-module-grid{display:grid;gap:9px}.unified-module{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid #dce5ea;background:#fff;border-radius:13px;padding:11px;color:#193d57;text-decoration:none;cursor:pointer}.unified-module:hover,.unified-module:focus{border-color:#83abc3;box-shadow:0 0 0 3px rgba(38,100,141,.08)}.unified-module-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:11px;background:#edf5f9;font-size:19px}.unified-module b{display:block;font-size:13px}.unified-module small{display:block;margin-top:2px;color:#72818b;font-size:10px;line-height:1.3}.unified-module-arrow{font-size:20px;color:#6f8797}.public-about-body .public-admin-link{display:block;margin-top:5px;color:#315b78;text-decoration:none;font-weight:700;padding:3px 0}.unified-mode-badge{display:inline-flex;align-items:center;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.24);color:#fff;font-size:11px;font-weight:800}
@media(min-width:700px){.unified-sheet-backdrop{align-items:center}.unified-sheet{border-radius:18px;padding:18px}}
`;
write(`${pub}/v150-unified.css`,unifiedCss);

const unifiedJs=`(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
function icon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11V7a4 4 0 0 1 8 0v4"/><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M12 15v2"/></svg>'}
function openSheet(){if(document.querySelector('.unified-sheet-backdrop'))return;const back=document.createElement('div');back.className='unified-sheet-backdrop';back.innerHTML='<section class="unified-sheet" role="dialog" aria-modal="true" aria-labelledby="unifiedTitle"><div class="unified-sheet-head"><div><h2 id="unifiedTitle">Acesso da equipe</h2><p>O mesmo aplicativo reúne acompanhamento público, operação e coordenação.</p></div><button class="unified-sheet-close" type="button" aria-label="Fechar">×</button></div><div class="unified-module-grid"><a class="unified-module" href="/operacao.html"><span class="unified-module-icon">▣</span><span><b>Área operacional</b><small>Ler e registrar o BU da seção com a chave do operador.</small></span><span class="unified-module-arrow">›</span></a><a class="unified-module" href="/admin/index.html"><span class="unified-module-icon">⌘</span><span><b>Central Administrativa</b><small>Acompanhar as 29 seções, pendências, conferência e segurança.</small></span><span class="unified-module-arrow">›</span></a></div></section>';const close=()=>back.remove();back.querySelector('.unified-sheet-close').onclick=close;back.addEventListener('click',e=>{if(e.target===back)close()});document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc)}});document.body.appendChild(back)}
function mount(){if(!PUBLIC.has(location.pathname))return;const hero=document.querySelector('.hero');if(hero&&!hero.querySelector('.unified-team-entry')){const live=hero.querySelector('.live');const b=document.createElement('button');b.type='button';b.className='unified-team-entry';b.innerHTML=icon()+'<span>Acesso da equipe</span>';b.onclick=openSheet;(live||hero.lastElementChild||hero).insertAdjacentElement?.('afterend',b);if(!b.isConnected)hero.appendChild(b)}const body=document.querySelector('.public-about-body');if(body&&!body.querySelector('.public-admin-link')){const a=document.createElement('a');a.className='public-admin-link';a.href='/admin/index.html';a.textContent='Central Administrativa';body.appendChild(a)}}
function start(){mount();setTimeout(mount,250);setTimeout(mount,900)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})();`;
write(`${pub}/v150-unified.js`,unifiedJs);

for(const path of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(path);
  if(!html.includes('/v150-unified.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v150-unified.css?v=150">\n</head>');
  if(!html.includes('/v150-unified.js'))html=html.replace('</body>','<script src="/v150-unified.js?v=150"></script>\n</body>');
  write(path,html);
}

// 3) Administração passa a ser um módulo do PWA raiz, não outro PWA.
const adminDir=`${pub}/admin`;
let adminHtml=read(`${adminDir}/index.html`);
adminHtml=adminHtml
  .replace(/href="\/admin\/admin\.webmanifest[^\"]*"/,'href="/manifest.webmanifest?v=150"')
  .replace(/href="\/admin\/admin\.css[^\"]*"/,'href="/admin/admin-v150.css?v=150"')
  .replace(/src="\/admin\/admin\.js[^\"]*"/,'src="/admin/admin-v150.js?v=150"');
adminHtml=adminHtml.replace(/<button id="installBtn"[^>]*>[\s\S]*?<\/button>/,'<span class="unified-mode-badge">Módulo administrativo</span>');
write(`${adminDir}/index.html`,adminHtml);

let adminCss=read(`${adminDir}/admin.css`)+`\n.unified-mode-badge{display:inline-flex;align-items:center;padding:8px 11px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.24);color:#fff;font-size:11px;font-weight:800}\n`;
write(`${adminDir}/admin-v150.css`,adminCss);

let adminJs=read(`${adminDir}/admin.js`);
const installRe=/function isStandalone\(\)\{[\s\S]*?\}\nfunction setupNav/;
if(!installRe.test(adminJs))throw new Error('V1.5.0: bloco de instalação administrativa não localizado');
adminJs=adminJs.replace(installRe,`async function setupInstall(){if(!('serviceWorker' in navigator))return;try{const regs=await navigator.serviceWorker.getRegistrations();for(const reg of regs){const scope=new URL(reg.scope).pathname;const script=reg.active?.scriptURL||reg.waiting?.scriptURL||reg.installing?.scriptURL||'';if(scope.startsWith('/admin/')||script.includes('/admin/admin-sw.js'))await reg.unregister()}await navigator.serviceWorker.register('/service-worker.js?v=150',{scope:'/'});}catch(e){console.warn('unified PWA registration failed',e)}}\nfunction setupNav`);
write(`${adminDir}/admin-v150.js`,adminJs);

// 4) Service worker único no escopo raiz, incluindo todos os módulos.
const sw=`const VERSION='v1.5.0-unified';
const SHELL='colmeia-shell-'+VERSION;const RUNTIME='colmeia-runtime-'+VERSION;const TILES='colmeia-tiles-'+VERSION;const PHOTOS='colmeia-photos-'+VERSION;
const CORE=['/','/index.html','/transparencia.html','/operacao.html','/seguranca.html','/admin.html','/admin/index.html','/manifest.webmanifest','/bu-parser.js','/v021-main.js','/v022-main.js','/v022-visual.css','/v0221-civic.js','/v0221-civic.css','/v0222-contrast.css','/v023-main.js','/v0241-photos.js','/v0241-photos.css','/v100-main.js','/v102-candidates.js','/v102-main.js','/v111-cleanup.css','/v111-main.js','/v121-polish.css','/v121-polish.js','/v130-public.css','/v130-public.js','/v131-refine-runtime.js','/v135-install.js','/v150-unified.css','/v150-unified.js','/admin/admin-v150.css','/admin/admin-v150.js','/data/candidate-photo-map.json','/data/candidate-catalog.json','/icons/icon-192.png','/icons/icon-512.png'];
const OPTIONAL=['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'];
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(SHELL);await c.addAll(CORE);await Promise.allSettled(OPTIONAL.map(async u=>{const r=await fetch(u,{mode:'cors',cache:'reload'});if(r.ok)await c.put(u,r.clone())}));self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keep=new Set([SHELL,RUNTIME,TILES,PHOTOS]);for(const n of await caches.keys())if(n.startsWith('colmeia-')&&!keep.has(n))await caches.delete(n);await self.clients.claim()})()));
async function trim(n,max){const c=await caches.open(n);const keys=await c.keys();while(keys.length>max)await c.delete(keys.shift())}
async function networkFirst(req){const c=await caches.open(RUNTIME);try{const r=await fetch(req);if(r&&r.ok)await c.put(req,r.clone());return r}catch{const u=new URL(req.url);if(u.pathname.startsWith('/admin/'))return(await caches.match('/admin/index.html'))||(await caches.match('/index.html'))||Response.error();if(u.pathname==='/operacao.html')return(await caches.match('/operacao.html'))||(await caches.match('/index.html'))||Response.error();if(u.pathname==='/seguranca.html')return(await caches.match('/seguranca.html'))||(await caches.match('/index.html'))||Response.error();if(u.pathname==='/transparencia.html')return(await caches.match('/transparencia.html'))||(await caches.match('/index.html'))||Response.error();return(await c.match(req))||(await caches.match('/index.html'))||Response.error()}}
async function cacheFirst(req,name=RUNTIME,max=null){const c=await caches.open(name);const hit=await c.match(req);if(hit)return hit;const r=await fetch(req);if(r&&(r.ok||r.type==='opaque')){await c.put(req,r.clone());if(max)trim(name,max)}return r}
async function stale(req){const c=await caches.open(RUNTIME);const hit=await c.match(req);const net=fetch(req).then(async r=>{if(r&&(r.ok||r.type==='opaque'))await c.put(req,r.clone());return r}).catch(()=>null);return hit||(await net)||Response.error()}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin===self.location.origin&&u.pathname.startsWith('/api/'))return;if(req.mode==='navigate'){e.respondWith(networkFirst(req));return}if(u.hostname.endsWith('tile.openstreetmap.org')){e.respondWith(cacheFirst(req,TILES,160));return}if(u.origin===self.location.origin&&u.pathname.startsWith('/candidate-photos/')){e.respondWith(cacheFirst(req,PHOTOS,400));return}if(u.origin===self.location.origin){e.respondWith(cacheFirst(req,u.pathname==='/service-worker.js'?RUNTIME:SHELL));return}if(u.hostname==='unpkg.com'){e.respondWith(stale(req));return}});
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});`;
write(`${pub}/service-worker.js`,sw);

console.log('V1.5.0 unified app applied: public, operator and admin are modules of one root PWA.');
