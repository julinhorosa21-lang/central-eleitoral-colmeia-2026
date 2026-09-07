import fs from 'node:fs';

const pub = '/app/public';
const adminDir = `${pub}/admin`;
fs.mkdirSync(adminDir, { recursive: true });

let html = fs.readFileSync(`${pub}/admin.html`, 'utf8');
html = html
  .replace('href="/admin.webmanifest"', 'href="/admin/admin.webmanifest?v=142"')
  .replace('href="/admin.css"', 'href="/admin/admin.css?v=142"')
  .replace('src="/admin.js"', 'src="/admin/admin.js?v=142"');

const sectionSelect = '<select id="sectionFilter" class="select"><option value="all">Todas</option><option value="waiting">Aguardando</option><option value="partial">Parciais</option><option value="pending">Em conferência</option><option value="verified">Conferidas</option><option value="divergent">Divergentes</option></select>';
if (!html.includes(sectionSelect)) throw new Error('section filter markup not found');
html = html.replace(sectionSelect, `<div class="section-tools"><input id="sectionSearch" class="section-search" type="search" inputmode="search" placeholder="Buscar seção ou local" aria-label="Buscar seção ou local">${sectionSelect}</div>`);
html = html.replace('<div><small>Negados</small><b id="secDenied">—</b></div>', '<div><small>Acessos/ações negadas</small><b id="secDenied">—</b></div>');
html = html.replace('<button id="installBtn" class="btn light" type="button">Instalar app</button>', '<button id="installBtn" class="btn light" type="button">Preparar instalação</button>');
fs.writeFileSync(`${adminDir}/index.html`, html);

const redirect = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#123f62"><title>Central Administrativa</title></head><body><script>location.replace('/admin/index.html'+location.search+location.hash)</script><p><a href="/admin/index.html">Abrir Central Administrativa</a></p></body></html>`;
fs.writeFileSync(`${pub}/admin.html`, redirect);

let css = fs.readFileSync(`${pub}/admin.css`, 'utf8');
css += `
/* V1.4.2 — central administrativa isolada e refinada */
.section-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.section-search{min-width:240px;flex:1;border:1px solid var(--line);background:#fff;padding:10px 12px;border-radius:12px;color:var(--ink);font-weight:700;outline:none}.section-search:focus{border-color:#77a9c7;box-shadow:0 0 0 3px rgba(33,101,143,.12)}
.section-progress{position:absolute;left:13px;right:13px;bottom:8px;height:4px;border-radius:99px;background:#edf1f4;overflow:hidden}.section-progress span{display:block;height:100%;background:#8ba1b1;transition:width .2s}.section-card:has(.status-pill.partial) .section-progress span,.section-card:has(.status-pill.pending) .section-progress span{background:#d7a20f}.section-card:has(.status-pill.verified) .section-progress span{background:#1ca06c}.section-card:has(.status-pill.divergent) .section-progress span{background:#d4453c}.section-card .cargo-count{bottom:17px}.agg-note{display:block;margin-top:6px;color:#6d5a00;font-size:11px;font-weight:800}.metric.warn:not(.alert-on),.metric.bad:not(.alert-on){border-bottom-color:var(--line)}.metric.warn.alert-on{border-bottom-color:#d99d19}.metric.bad.alert-on{border-bottom-color:#d94b42}.pending-side{display:grid;justify-items:end;gap:5px}.pending-open{font-size:11px;color:var(--brand);font-weight:850}.btn.install-ready{box-shadow:0 0 0 3px rgba(65,217,143,.22)}.btn:disabled{opacity:.65;cursor:wait}
.admin-hero.compact{padding-top:12px;padding-bottom:12px;position:sticky;top:0;z-index:25;border-radius:0;max-width:none;margin-left:0;margin-right:0}.admin-hero.compact .brand-line p,.admin-hero.compact .eyebrow{display:none}.admin-hero.compact .app-icon{width:42px;height:42px}.admin-hero.compact h1{font-size:24px}.admin-hero.compact .hero-status{margin-top:5px}.admin-hero.compact .hero-actions{align-self:center}
@media(max-width:720px){.section-tools{width:100%}.section-search{min-width:0;width:100%}.section-tools .select{flex:1}.admin-hero.compact{padding:10px 12px}.admin-hero.compact .hero-actions{display:none}.admin-hero.compact .brand-line{gap:9px}.admin-hero.compact h1{font-size:20px}}
`;
fs.writeFileSync(`${adminDir}/admin.css`, css);

let js = fs.readFileSync(`${pub}/admin.js`, 'utf8');

js = js.replace("$('mWaiting').textContent=s.waiting;const attention=", "$('mWaiting').textContent=s.waiting;const pendingMetric=$('mPending')?.closest('.metric'),divergentMetric=$('mDivergent')?.closest('.metric');pendingMetric?.classList.toggle('alert-on',s.pending>0);divergentMetric?.classList.toggle('alert-on',s.divergent>0);const attention=");

const sectionsRe = /function renderSections\(\)\{[\s\S]*?\}\nfunction renderCargoTabs/;
if (!sectionsRe.test(js)) throw new Error('renderSections not found');
js = js.replace(sectionsRe, `function renderSections(){const filter=$('sectionFilter').value;const q=String($('sectionSearch')?.value||'').trim().toLocaleLowerCase('pt-BR');const infos=stats().infos.filter(x=>{if(filter!=='all'&&x.state!==filter)return false;if(!q)return true;const text=\`\${x.section} seção \${String(x.section).padStart(2,'0')} \${x.place?.nome||''} \${x.place?.endereco||''}\`.toLocaleLowerCase('pt-BR');return text.includes(q)});$('sectionsGrid').innerHTML=infos.length?infos.map(x=>{const aggregate=x.section===49?'<span class="agg-note">Inclui a seção 113 agregada</span>':'';const pct=Math.round(x.count/CARGO_KEYS.length*100);return \`<button class="section-card" data-section="\${x.section}"><span class="sec-number">Seção \${String(x.section).padStart(2,'0')}</span><span class="place-name">\${esc(x.place?.nome||'Local não identificado')}</span>\${aggregate}<span class="status-pill \${x.state}">\${sectionLabel(x.state)}</span><span class="cargo-count">\${x.count}/5</span><span class="section-progress" aria-hidden="true"><span style="width:\${pct}%"></span></span></button>\`}).join(''):'<div class="empty">Nenhuma seção encontrada.</div>';bindSectionButtons($('sectionsGrid'))}
function renderCargoTabs`);

const pendingRe = /function renderPending\(\)\{[\s\S]*?\}\nfunction renderSecurity/;
if (!pendingRe.test(js)) throw new Error('renderPending not found');
js = js.replace(pendingRe, `function renderPending(){const s=stats();const urgent=s.infos.filter(x=>x.state==='divergent'||x.state==='partial'||x.state==='pending');$('pendingBoard').innerHTML=urgent.length?urgent.map(x=>{const missing=CARGO_KEYS.filter(k=>!x.by.has(k)).map(cargoLabel);const desc=x.state==='divergent'?'Há divergência entre dados locais e a conferência oficial.':x.state==='partial'?\`Faltam: \${missing.join(', ')||'cargos'}.\`:'Os cinco cargos chegaram, mas a conferência ainda não terminou.';return \`<button class="pending-row \${x.state==='divergent'?'bad':'warn'}" data-section="\${x.section}"><span><h3>Seção \${String(x.section).padStart(2,'0')} · \${esc(x.place?.nome||'Local')}</h3><p>\${esc(desc)}</p></span><span class="pending-side"><span class="status-pill \${x.state}">\${sectionLabel(x.state)}</span><small class="pending-open">Abrir seção →</small></span></button>\`}).join(''):'<div class="card empty">Nenhuma pendência identificada.</div>';bindSectionButtons($('pendingBoard'))}
function renderSecurity`);

js = js.replace("<p class=\"muted\">${esc(x.place?.nome||'Local não identificado')} · ${esc(x.place?.endereco||'')}</p>", "<p class=\"muted\">${esc(x.place?.nome||'Local não identificado')} · ${esc(x.place?.endereco||'')}${section===49?' · Inclui a seção 113 agregada':''}</p>");

const installRe = /function setupInstall\(\)\{[\s\S]*?\}\nfunction setupNav/;
if (!installRe.test(js)) throw new Error('setupInstall not found');
js = js.replace(installRe, `function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true}
async function setupInstall(){const btn=$('installBtn');if(!btn)return;const hide=()=>{btn.hidden=true};const ready=()=>{btn.hidden=false;btn.disabled=false;btn.textContent='Instalar app';btn.classList.add('install-ready')};if(isStandalone()){hide();return}window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;ready()});window.addEventListener('appinstalled',()=>{deferredPrompt=null;hide();toast('Central Administrativa instalada.')});btn.hidden=false;btn.disabled=false;btn.textContent='Preparar instalação';if('serviceWorker'in navigator){try{const reg=await navigator.serviceWorker.register('/admin/admin-sw.js?v=142',{scope:'/admin/'});await reg.update().catch(()=>{});await navigator.serviceWorker.ready;const controller=navigator.serviceWorker.controller?.scriptURL||'';if(!controller.includes('/admin/admin-sw.js')&&!sessionStorage.getItem('ce_admin_sw142_reload')){sessionStorage.setItem('ce_admin_sw142_reload','1');btn.disabled=true;btn.textContent='Preparando app…';setTimeout(()=>location.replace('/admin/index.html?ui=admin142'),300);return}sessionStorage.removeItem('ce_admin_sw142_reload')}catch(e){console.warn('admin PWA registration failed',e)}}btn.onclick=async()=>{if(isStandalone()){hide();return}if(deferredPrompt){const prompt=deferredPrompt;deferredPrompt=null;btn.disabled=true;prompt.prompt();const choice=await prompt.userChoice.catch(()=>({outcome:'dismissed'}));btn.disabled=false;if(choice.outcome==='accepted'){hide();return}btn.textContent='Instalar app';return}btn.disabled=true;btn.textContent='Preparando instalação…';try{const reg=await navigator.serviceWorker.getRegistration('/admin/');await reg?.update()}catch{}setTimeout(()=>{btn.disabled=false;if(deferredPrompt){ready()}else{btn.textContent='Tentar instalar';toast('O navegador ainda está preparando a instalação. Feche esta aba e abra novamente a Central Administrativa pelo link novo.')}},1400)}}
function setupNav`);

const navRe = /function setupNav\(\)\{[\s\S]*?\}\nfunction init/;
if (!navRe.test(js)) throw new Error('setupNav not found');
js = js.replace(navRe, `function setupNav(){const buttons=[...document.querySelectorAll('.bottom-nav button')],sections=[...document.querySelectorAll('.panel-section')],hero=document.querySelector('.admin-hero');buttons.forEach(b=>b.onclick=()=>{const t=$(b.dataset.target);if(t)t.scrollIntoView({behavior:'smooth',block:'start'})});let ticking=false;const update=()=>{ticking=false;const marker=Math.max(150,window.innerHeight*.34);let active=sections[0];for(const s of sections){if(s.getBoundingClientRect().top<=marker)active=s;else break}buttons.forEach(b=>b.classList.toggle('active',b.dataset.target===active?.id));hero?.classList.toggle('compact',window.scrollY>220)};window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});window.addEventListener('resize',update,{passive:true});update()}
function init`);

js = js.replace("$('sectionFilter').onchange=renderSections;", "$('sectionFilter').onchange=renderSections;if($('sectionSearch'))$('sectionSearch').oninput=renderSections;");
js = js.replace("$('tseRefreshBtn').onclick=()=>postAction('/api/tse/refresh','Consulta ao TSE solicitada.');", "$('tseRefreshBtn').onclick=()=>{if(confirm('Atualizar agora a consulta aos dados oficiais do TSE?'))postAction('/api/tse/refresh','Atualização do TSE solicitada.');};");

fs.writeFileSync(`${adminDir}/admin.js`, js);

const manifest = {
  id: '/admin/',
  name: 'Central Administrativa Colméia 2026',
  short_name: 'Central Admin',
  description: 'Coordenação, recebimento e conferência da Central Eleitoral Colméia 2026.',
  start_url: '/admin/index.html?source=pwa',
  scope: '/admin/',
  display: 'standalone',
  background_color: '#f3f6f8',
  theme_color: '#123f62',
  orientation: 'any',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};
fs.writeFileSync(`${adminDir}/admin.webmanifest`, JSON.stringify(manifest, null, 2));

const sw = `const VERSION='v1.4.2-admin';\nconst CACHE='colmeia-admin-'+VERSION;\nconst CORE=['/admin/index.html','/admin/admin.css','/admin/admin.js','/admin/admin.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/data/locais-colmeia.json'];\nself.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});\nself.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('colmeia-admin-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})())});\nasync function adminNavigate(req){try{return await fetch(req)}catch{return(await caches.match('/admin/index.html'))||Response.error()}}\nasync function adminAsset(req){const c=await caches.open(CACHE);const hit=await c.match(req,{ignoreSearch:true});if(hit)return hit;try{const r=await fetch(req);if(r&&r.ok)await c.put(req,r.clone());return r}catch{return Response.error()}}\nself.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==self.location.origin)return;if(u.pathname.startsWith('/api/'))return;if(req.mode==='navigate'){e.respondWith(adminNavigate(req));return}e.respondWith(adminAsset(req))});\nself.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});\n`;
fs.writeFileSync(`${adminDir}/admin-sw.js`, sw);

console.log('V1.4.2 admin applied: isolated /admin/ PWA scope, install flow and tablet refinements.');
