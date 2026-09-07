const VERSION='v1.0.1';
const SHELL=`colmeia-shell-${VERSION}`;
const RUNTIME=`colmeia-runtime-${VERSION}`;
const TILES=`colmeia-tiles-${VERSION}`;
const PHOTOS=`colmeia-photos-${VERSION}`;
const CORE=[
  '/',
  '/index.html',
  '/transparencia.html',
  '/seguranca.html',
  '/simulacao.html',
  '/manifest.webmanifest',
  '/bu-parser.js',
  '/v021-main.js',
  '/v022-main.js',
  '/v022-visual.css',
  '/v0221-civic.js',
  '/v0221-civic.css',
  '/v0222-contrast.css',
  '/v023-main.js',
  '/v024-main.js',
  '/v0241-photos.js',
  '/v0241-photos.css',
  '/v100-main.js',
  '/data/candidate-photo-map.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];
const OPTIONAL=[
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(SHELL);await cache.addAll(CORE);await Promise.allSettled(OPTIONAL.map(async url=>{const r=await fetch(url,{mode:'cors',cache:'reload'});if(r.ok)await cache.put(url,r.clone())}));self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keep=new Set([SHELL,RUNTIME,TILES,PHOTOS]);for(const name of await caches.keys())if(!keep.has(name)&&name.startsWith('colmeia-'))await caches.delete(name);await self.clients.claim()})())});
async function trim(cacheName,max){const cache=await caches.open(cacheName);const keys=await cache.keys();while(keys.length>max)await cache.delete(keys.shift())}
async function networkFirst(req){const cache=await caches.open(RUNTIME);try{const r=await fetch(req);if(r&&r.ok)await cache.put(req,r.clone());return r}catch{const url=new URL(req.url);if(url.pathname==='/transparencia.html')return(await caches.match('/transparencia.html'))||(await caches.match('/index.html'))||Response.error();if(url.pathname==='/seguranca.html')return(await caches.match('/seguranca.html'))||(await caches.match('/index.html'))||Response.error();if(url.pathname==='/simulacao.html')return(await caches.match('/simulacao.html'))||(await caches.match('/index.html'))||Response.error();return(await cache.match(req))||(await caches.match('/index.html'))||Response.error()}}
async function cacheFirst(req,cacheName=RUNTIME,max=null){const cache=await caches.open(cacheName);const hit=await cache.match(req);if(hit)return hit;const r=await fetch(req);if(r&&(r.ok||r.type==='opaque')){await cache.put(req,r.clone());if(max)trim(cacheName,max)}return r}
async function staleWhileRevalidate(req){const cache=await caches.open(RUNTIME);const hit=await cache.match(req);const net=fetch(req).then(async r=>{if(r&&(r.ok||r.type==='opaque'))await cache.put(req,r.clone());return r}).catch(()=>null);return hit||(await net)||Response.error()}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin===self.location.origin&&url.pathname.startsWith('/api/'))return;if(req.mode==='navigate'){event.respondWith(networkFirst(req));return}if(url.hostname.endsWith('tile.openstreetmap.org')){event.respondWith(cacheFirst(req,TILES,160));return}if(url.origin===self.location.origin&&url.pathname.startsWith('/candidate-photos/')){event.respondWith(cacheFirst(req,PHOTOS,400));return}if(url.origin===self.location.origin){event.respondWith(cacheFirst(req,url.pathname==='/service-worker.js'?RUNTIME:SHELL));return}if(url.hostname==='unpkg.com'){event.respondWith(staleWhileRevalidate(req));return}});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
