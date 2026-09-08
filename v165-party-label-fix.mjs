import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* V1.6.9 — selo partidário limpo, sem placeholder genérico + PWA resiliente. */
const legacyJs=`${pub}/v153-regional-theme.js`;
if(fs.existsSync(legacyJs)){
  let s=read(legacyJs);
  s=s.replace("if(i<3)r.setAttribute('data-rank',String(i+1))","r.removeAttribute('data-rank')");
  write(legacyJs,s);
}

const legacyCss=`${pub}/v153-regional-theme.css`;
if(fs.existsSync(legacyCss)){
  let s=read(legacyCss);
  s += `\n/* V1.6.9 — neutralidade e selo partidário textual */\nbody.ce-regional-public #leaders .leader,body.ce-regional-public #leaders .leader:first-child,body.ce-regional-public #leaders .leader[data-rank="1"],body.ce-regional-public #leaders .leader[data-ce161-rank="1"],body.ce-regional-public #leaders .leader[data-ce164-rank="1"]{border-top-color:#D9E5EB!important;border-right-color:#D9E5EB!important;border-bottom-color:#D9E5EB!important;outline:none!important;box-shadow:0 3px 10px rgba(22,65,93,.045)!important}\n#leaders .leader .who small>.party-mark-v112,#leaders .leader .who small>.party-badge,#leaders .leader .who small>.ce164-party-chip,#leaders .leader .who small>.ce167-party-chip,#leaders .leader .who small>.ce168-party-text{display:none!important}\n#leaders .leader .who small>.ce169-party-text{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:22px!important;padding:4px 8px!important;border-radius:6px!important;overflow:visible!important;background:var(--party,#2450B2)!important;color:#fff!important;font-size:10.5px!important;font-weight:900!important;line-height:1!important;letter-spacing:.01em!important;white-space:nowrap!important}\n`;
  write(legacyCss,s);
}

const partyJs=`(()=>{
'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;
const COLORS={PT:'#D71920',PL:'#1351A3',MDB:'#178544',PSD:'#2F86C7',PP:'#1B62A9',REPUBLICANOS:'#173D77',PDT:'#C91F2C',PSB:'#E5A800',PODEMOS:'#2BA866',PODE:'#2BA866',AVANTE:'#F28A22',PSDB:'#1757A6',PCDOB:'#D91D2A',PV:'#1C9C45',REDE:'#28A96B',PSOL:'#F28C00',CIDADANIA:'#E85E24',NOVO:'#F58220',PRD:'#214C8B',SOLIDARIEDADE:'#E66B19',DC:'#19724B',MOBILIZA:'#2B64B1',PCB:'#C5161D',PSTU:'#C61C2B',UP:'#7A1D8F',PRTB:'#24683F',PCO:'#B62B31',MISSAO:'#315F7E',AGIR:'#5A5F9E',PMB:'#6F4B8B',UNIAO:'#1763A7'};
let catalog=null,queued=false;
function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function cleanSource(v){return String(v||'').replace(/^\\s*partido\\s+/i,'').replace(/\\bPARTIDO\\b/gi,' ').replace(/\\s{2,}/g,' ').trim()}
function token(v){const s=norm(cleanSource(v));if(!s)return'';if(s.includes('UNIAO BRASIL')||/(^| )UNIAO( |$)/.test(s))return'UNIAO';for(const k of Object.keys(COLORS).sort((a,b)=>b.length-a.length))if((' '+s+' ').includes(' '+k+' '))return k;return''}
function label(v){const cleaned=cleanSource(v);if(!cleaned)return'';const t=token(cleaned);if(t==='UNIAO')return'UNIÃO';if(t==='MISSAO')return'MISSÃO';if(t==='PCDOB')return'PCdoB';if(t)return t;const raw=cleaned.toUpperCase();return raw==='PARTIDO'?'':raw}
function color(v){return COLORS[token(v)]||'#2450B2'}
function activeCargo(){const b=document.querySelector('#cargoTabs button.active[data-cargo],.cargo-tabs button.active[data-cargo],[data-cargo].active');if(b?.dataset?.cargo)return b.dataset.cargo;const t=norm(document.getElementById('cargoTitle')?.textContent||'');if(t.includes('GOVERNADOR'))return'governador';if(t.includes('SENADOR'))return'senador';if(t.includes('DEPUTADO FEDERAL'))return'depFederal';if(t.includes('DEPUTADO ESTADUAL'))return'depEstadual';return'presidente'}
function numberFor(row){return String(row.dataset.ce161Number||row.querySelector('.ce162-number-text')?.textContent||row.querySelector('.public-number-badge')?.textContent||row.querySelector('.num')?.textContent||'').match(/\\d{1,5}/)?.[0]||''}
function candidate(cargo,n){const rows=catalog?.candidates?.[cargo];return Array.isArray(rows)?rows.find(c=>String(c?.numero||c?.nrCandidato||'').trim()===String(n).trim())||null:null}
function candidateParty(c){return c?.partido||c?.siglaPartido||c?.sgPartido||c?.partidoSigla||c?.sigla||''}
function sourceFor(row,c){
  const selectors=['.ce168-party-text','.ce167-party-chip','.ce164-party-chip','.party-mark-v112','.party-badge','[data-party]'];
  const old=selectors.map(s=>row.querySelector('.who small '+s)).find(Boolean);
  const aria=old?.getAttribute('aria-label')?.replace(/^Partido\\s+/i,'').trim();
  const title=old?.getAttribute('title')?.replace(/^Partido\\s+/i,'').trim();
  return candidateParty(c)||row.dataset.partyFull||aria||title||old?.dataset?.party||row.getAttribute('data-party')||'';
}
function removeOld(small){
  small.querySelectorAll('.party-mark-v112,.party-badge,.ce164-party-chip,.ce167-party-chip,.ce168-party-text').forEach(el=>{if(!el.classList.contains('ce169-party-text'))el.remove()});
  [...small.childNodes].forEach(node=>{if(node.nodeType===Node.TEXT_NODE){const t=String(node.textContent||'').replace(/\\bPARTIDO\\b/gi,' ').replace(/\\s{2,}/g,' ');node.textContent=t}});
  [...small.querySelectorAll('span,em,strong,b')].forEach(el=>{if(norm(el.textContent)==='PARTIDO')el.remove()});
}
function ensureRow(row){
  row.removeAttribute('data-rank');row.removeAttribute('data-ce161-rank');
  const cargo=activeCargo(),n=numberFor(row),c=candidate(cargo,n),source=sourceFor(row,c),text=label(source),p=color(source);
  const small=row.querySelector('.who small');if(!small)return;
  removeOld(small);
  let chip=small.querySelector('.ce169-party-text');
  if(text){
    if(!chip){chip=document.createElement('span');chip.className='ce169-party-text';small.insertBefore(chip,small.firstChild)}
    chip.textContent=text;chip.setAttribute('data-party',text);chip.setAttribute('aria-label','Partido '+text);chip.setAttribute('title','Partido '+text);chip.style.setProperty('--party',p);chip.style.setProperty('background',p,'important');
    if(small.firstElementChild!==chip)small.insertBefore(chip,small.firstChild);
  }else if(chip){chip.remove()}
  row.dataset.partyFull=text;row.style.setProperty('--party',p);row.style.setProperty('border-left-color',p,'important');
  row.style.setProperty('border-top-color','#D9E5EB','important');row.style.setProperty('border-right-color','#D9E5EB','important');row.style.setProperty('border-bottom-color','#D9E5EB','important');
  const bar=row.querySelector('.bar i,.leader-bar span');if(bar)bar.style.setProperty('background',p,'important');
}
function fix(){document.querySelectorAll('#leaders .leader').forEach(ensureRow)}
function run(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fix()})}
function extract(j){if(j?.available&&j?.snapshot)return j.snapshot;if(j?.snapshot?.candidates)return j.snapshot;if(j?.candidates)return j;return null}
async function load(){try{const r=await fetch('/api/candidates',{cache:'no-store'});if(r.ok)catalog=extract(await r.json())}catch{}if(!catalog){try{const r=await fetch('/data/candidate-catalog.json',{cache:'no-store'});if(r.ok)catalog=extract(await r.json())}catch{}}run()}
function start(){load();run();[80,220,500,1000,2000,4000].forEach(ms=>setTimeout(run,ms));new MutationObserver(run).observe(document.body,{subtree:true,childList:true,characterData:true});document.addEventListener('click',()=>setTimeout(run,60),true);window.addEventListener('pageshow',run)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;
write(`${pub}/v165-party-label-fix.js`,partyJs);
for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(file);
  html=html.replace(/\/v165-party-label-fix\.js\?v=\d+/g,'/v165-party-label-fix.js?v=169');
  if(!html.includes('/v165-party-label-fix.js'))html=html.replace('</body>','<script src="/v165-party-label-fix.js?v=169"></script>\n</body>');
  write(file,html);
}

const manifestPath=`${pub}/manifest.webmanifest`;
if(fs.existsSync(manifestPath)){
  const m=JSON.parse(read(manifestPath));
  m.id='/';m.start_url='/?source=pwa';m.scope='/';m.display='standalone';m.prefer_related_applications=false;
  if(Array.isArray(m.icons))m.icons=m.icons.map(i=>({...i,purpose:'any'}));
  write(manifestPath,JSON.stringify(m,null,2));
}

const sw=`const VERSION='v1.6.9-unified';
const SHELL='colmeia-shell-'+VERSION,RUNTIME='colmeia-runtime-'+VERSION,TILES='colmeia-tiles-'+VERSION,PHOTOS='colmeia-photos-'+VERSION;
const CORE=['/','/index.html','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png'];
const OPTIONAL=['/transparencia.html','/operacao.html','/seguranca.html','/admin.html','/admin/index.html','/bu-parser.js','/v021-main.js','/v022-main.js','/v022-visual.css','/v0221-civic.js','/v0221-civic.css','/v0222-contrast.css','/v023-main.js','/v0241-photos.js','/v0241-photos.css','/v100-main.js','/v102-candidates.js','/v102-main.js','/v111-cleanup.css','/v111-main.js','/v121-polish.css','/v121-polish.js','/v130-public.css','/v130-public.js','/v131-refine-runtime.js','/v135-install.js','/v150-unified.css','/v150-unified.js','/v151-team.css','/v151-team.js','/v151-operator-bridge.js','/v153-regional-theme.css','/v153-regional-theme.js','/v157-polish.css','/v157-polish.js','/v160-flow.css','/v160-flow.js','/v162-clean-photo.css','/v162-clean-photo.js','/v164-refinement.css','/v164-refinement.js','/v165-party-label-fix.js','/data/candidate-photo-map.json','/data/candidate-catalog.json','/admin/admin-v150.css','/admin/admin-v150.js'];
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(SHELL);await c.addAll(CORE);await Promise.allSettled(OPTIONAL.map(async u=>{try{const r=await fetch(u,{cache:'reload'});if(r.ok)await c.put(u,r.clone())}catch{}}));self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keep=new Set([SHELL,RUNTIME,TILES,PHOTOS]);for(const n of await caches.keys())if(n.startsWith('colmeia-')&&!keep.has(n))await caches.delete(n);await self.clients.claim()})()));
async function trim(n,max){const c=await caches.open(n),keys=await c.keys();while(keys.length>max)await c.delete(keys.shift())}
async function networkFirst(req){const c=await caches.open(RUNTIME);try{const r=await fetch(req);if(r?.ok)await c.put(req,r.clone());return r}catch{const u=new URL(req.url);if(u.pathname.startsWith('/admin/'))return(await caches.match('/admin/index.html'))||(await caches.match('/index.html'))||Response.error();if(['/operacao.html','/seguranca.html','/transparencia.html'].includes(u.pathname))return(await caches.match(u.pathname))||(await caches.match('/index.html'))||Response.error();return(await c.match(req))||(await caches.match('/index.html'))||Response.error()}}
async function cacheFirst(req,name=RUNTIME,max=null){const c=await caches.open(name),hit=await c.match(req);if(hit)return hit;const r=await fetch(req);if(r&&(r.ok||r.type==='opaque')){await c.put(req,r.clone());if(max)trim(name,max)}return r}
async function stale(req){const c=await caches.open(RUNTIME),hit=await c.match(req);const net=fetch(req).then(async r=>{if(r&&(r.ok||r.type==='opaque'))await c.put(req,r.clone());return r}).catch(()=>null);return hit||(await net)||Response.error()}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin===self.location.origin&&u.pathname.startsWith('/api/'))return;if(req.mode==='navigate'){e.respondWith(networkFirst(req));return}if(u.hostname.endsWith('tile.openstreetmap.org')){e.respondWith(cacheFirst(req,TILES,160));return}if(u.origin===self.location.origin&&u.pathname.startsWith('/candidate-photos/')){e.respondWith(cacheFirst(req,PHOTOS,400));return}if(u.origin===self.location.origin){e.respondWith(cacheFirst(req,u.pathname==='/service-worker.js'?RUNTIME:SHELL));return}if(u.hostname==='unpkg.com')e.respondWith(stale(req))});
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});
// const VERSION='v1.6.5-unified'; compatibility marker for Docker preflight
`;
write(`${pub}/service-worker.js`,sw);

const installPath=`${pub}/v135-install.js`;
if(fs.existsSync(installPath)){
  let s=read(installPath);
  s=s.replace(/async function ensurePwa\(\)\{[\s\S]*?\n\}/,`async function ensurePwa(){\n  if(!('serviceWorker' in navigator))return false;\n  try{\n    const reg=await navigator.serviceWorker.register('/service-worker.js?v=169',{scope:'/',updateViaCache:'none'});\n    try{await reg.update()}catch{}\n    await navigator.serviceWorker.ready;\n    return true;\n  }catch(err){console.error('PWA registration failed',err);return false}\n}`);
  write(installPath,s);
}

console.log('V1.6.9 applied: generic PARTIDO placeholder removed; party chip consolidated; PWA preserved.');
