(()=>{
'use strict';
const PATHS=new Set(['/','/index.html','/transparencia.html']);
if(!PATHS.has(location.pathname))return;
let deferredPrompt=null;
let installing=false;

const STYLE=`
.pwa-install-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;margin:12px 0;padding:12px 14px;border:1px solid #d9e4ea;border-radius:14px;background:#f8fbfc;color:#17324a;box-shadow:0 1px 2px rgba(15,42,61,.05)}
.pwa-install-icon{width:48px;height:48px;border-radius:12px;display:block;object-fit:cover;box-shadow:0 2px 8px rgba(15,42,61,.14)}
.pwa-install-copy{min-width:0}.pwa-install-title{display:flex;align-items:center;gap:7px;margin:0;font-size:14px;font-weight:850;color:#245b42}.pwa-install-text{margin:3px 0 0;color:#66727d;font-size:11.5px;line-height:1.35}.pwa-install-state{display:flex;align-items:center;gap:6px;margin-top:5px;color:#52606d;font-size:10.5px;font-weight:700}.pwa-install-state:before{content:"";width:7px;height:7px;border-radius:50%;background:#16a34a}
.pwa-install-btn{border:0;border-radius:10px;background:#1d638f;color:#fff;padding:10px 13px;font:inherit;font-size:11.5px;font-weight:850;line-height:1;white-space:nowrap;cursor:pointer;box-shadow:0 2px 6px rgba(29,99,143,.18)}
.pwa-install-btn:active{transform:translateY(1px)}.pwa-install-btn:focus-visible{outline:3px solid #f2c94c;outline-offset:2px}.pwa-install-btn[disabled]{opacity:.6;cursor:wait}
.pwa-install-help{grid-column:2/4;margin-top:-3px;padding-top:7px;border-top:1px solid #e5ecef;color:#52606d;font-size:10.5px;line-height:1.4}.pwa-install-help[hidden]{display:none!important}
@media(max-width:560px){.pwa-install-card{grid-template-columns:auto 1fr;gap:10px}.pwa-install-btn{grid-column:1/3;width:100%;padding:11px 12px}.pwa-install-help{grid-column:1/3}.pwa-install-icon{width:44px;height:44px}}
`;

const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches===true||window.navigator.standalone===true;
function ensureStyle(){if(document.getElementById('pwa-install-style'))return;const s=document.createElement('style');s.id='pwa-install-style';s.textContent=STYLE;document.head.appendChild(s)}

function card(){
  if(isStandalone()){document.getElementById('pwaInstallCard')?.remove();return null}
  let el=document.getElementById('pwaInstallCard');
  if(el)return el;
  const hero=document.querySelector('.hero.public-main-hero')||document.querySelector('.hero');
  if(!hero)return null;
  el=document.createElement('section');
  el.id='pwaInstallCard';
  el.className='pwa-install-card';
  el.setAttribute('aria-label','Instalar Central Eleitoral');
  el.innerHTML=`
    <img class="pwa-install-icon" src="/icons/icon-192.png" alt="" width="48" height="48">
    <div class="pwa-install-copy">
      <p class="pwa-install-title">Central pronta para celular</p>
      <p class="pwa-install-text">Instale a Central Eleitoral e abra direto pela tela inicial, com o ícone do aplicativo.</p>
      <div class="pwa-install-state" id="pwaInstallState">Aplicativo disponível para instalação</div>
    </div>
    <button type="button" class="pwa-install-btn" id="pwaInstallBtn">Instalar app</button>
    <div class="pwa-install-help" id="pwaInstallHelp" hidden></div>`;
  hero.insertAdjacentElement('afterend',el);
  el.querySelector('#pwaInstallBtn').addEventListener('click',requestInstall);
  return el;
}

function setHelp(message){const el=card();if(!el)return;const help=el.querySelector('#pwaInstallHelp');help.textContent=message;help.hidden=!message}
function setState(message){const el=card();if(!el)return;const state=el.querySelector('#pwaInstallState');if(state)state.textContent=message}

async function ensurePwa(){
  if(!('serviceWorker' in navigator))return false;
  try{
    await navigator.serviceWorker.register('/service-worker.js',{scope:'/'});
    await navigator.serviceWorker.ready;
    return true;
  }catch{return false}
}

async function requestInstall(){
  if(isStandalone()){card();return}
  const el=card();if(!el)return;
  const btn=el.querySelector('#pwaInstallBtn');
  if(installing)return;
  installing=true;btn.disabled=true;btn.textContent='Preparando…';setHelp('');
  await ensurePwa();
  // Em alguns navegadores o evento chega logo após o service worker ficar pronto.
  if(!deferredPrompt)await new Promise(r=>setTimeout(r,700));
  if(deferredPrompt){
    const p=deferredPrompt;deferredPrompt=null;
    try{
      await p.prompt();
      const choice=await p.userChoice;
      if(choice?.outcome==='accepted'){
        setState('Instalação iniciada');
        setHelp('Quando concluir, a Central aparecerá na sua tela inicial com o ícone do aplicativo.');
      }else{
        setState('Aplicativo disponível para instalação');
        setHelp('Instalação cancelada. Você pode tocar em “Instalar app” novamente quando quiser.');
      }
    }catch{
      setHelp('O navegador não abriu a janela de instalação desta vez. Aguarde alguns segundos e tente novamente.');
    }
  }else{
    const ua=navigator.userAgent||'';
    if(/iPhone|iPad|iPod/i.test(ua))setHelp('Neste navegador a instalação não pode ser aberta automaticamente. No Safari, use Compartilhar → Adicionar à Tela de Início.');
    else setHelp('A Central está configurada como aplicativo. Se a janela não abrir automaticamente, atualize a página uma vez e toque novamente em “Instalar app”.');
  }
  installing=false;btn.disabled=false;btn.textContent='Instalar app';
}

function refresh(){ensureStyle();card()}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;setState('Pronto para instalar neste dispositivo');setHelp('');refresh()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;document.getElementById('pwaInstallCard')?.remove()});

async function boot(){
  ensureStyle();
  card();
  await ensurePwa();
  setTimeout(refresh,250);
  setTimeout(refresh,1200);
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',refresh);
  window.addEventListener('pageshow',refresh);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* V1.5.2 — refinamento da experiência pública em celular */
(()=>{
'use strict';
const PATHS=new Set(['/','/index.html','/transparencia.html']);
if(!PATHS.has(location.pathname))return;
const POLISH=`
.public-v131 #cargoTabs{scroll-padding-inline:12px;scroll-snap-type:x proximity;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
.public-v131 #cargoTabs button{scroll-snap-align:center;touch-action:manipulation;transition:background-color .16s ease,border-color .16s ease,box-shadow .16s ease,transform .16s ease}
.public-v131 #cargoTabs button.active{box-shadow:0 3px 9px rgba(20,72,108,.16)!important}
.public-v131 #cargoTabs button:active{transform:scale(.985)}
.public-v131 .leader.public-candidate-row{transition:border-color .16s ease,background-color .16s ease,box-shadow .16s ease}
.public-v131 .leader.public-candidate-row:hover{border-color:#c8d8e2!important;background:#fcfdfe!important}
.public-v131 .leader .who{min-width:0}.public-v131 .leader .who b{overflow:hidden;text-overflow:ellipsis}.public-v131 .leader .votes b{font-variant-numeric:tabular-nums}.public-v131 .leader .votes small{font-variant-numeric:tabular-nums}
.public-v131 .public-bottom-nav{padding-bottom:max(env(safe-area-inset-bottom),2px);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.public-v131 .public-bottom-nav button{touch-action:manipulation}
.public-v131 .public-bottom-nav button:active{background:#eef4f7}
.public-v131 .hero .unified-team-entry{touch-action:manipulation}
.public-v131 #cargoProgressText,.public-v131 #cargoProgressLabel{font-variant-numeric:tabular-nums}
@media(max-width:620px){
  .public-v131 #cargoTabs{position:sticky;top:0;z-index:65;margin-left:-11px!important;margin-right:-11px!important;padding:8px 11px 9px!important;background:rgba(255,255,255,.96);border-bottom:1px solid #e0e7ec;box-shadow:0 5px 12px rgba(24,54,75,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
  .public-v131 #cargoTabs button{min-width:118px!important;min-height:42px!important;padding:8px 10px!important;font-size:11px!important}
  .public-v131 .leader.public-candidate-row{grid-template-columns:46px minmax(0,1fr) 78px!important;gap:9px!important;padding:9px!important;border-radius:12px!important}
  .public-v131 .leader .num{width:44px!important;height:50px!important;border-radius:10px!important}
  .public-v131 .leader .who b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal;font-size:12.5px!important;line-height:1.18!important}
  .public-v131 .leader .who small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;display:block}
  .public-v131 .leader .votes{min-width:0!important;width:78px}.public-v131 .leader .votes b{font-size:12.5px!important}.public-v131 .leader .votes small{font-size:9.5px!important}
  .public-v131 .leader .bar{grid-column:2/4!important;margin-top:0!important}
  .public-v131 .hero .unified-team-entry{min-height:39px!important;padding:8px 11px!important}
  .pwa-install-card{margin:9px 0!important;border-radius:12px!important;padding:10px 11px!important}.pwa-install-title{font-size:12.5px!important}.pwa-install-text{font-size:10.5px!important}.pwa-install-state{font-size:9.5px!important}
}
@media(max-width:390px){
  .public-v131 #cargoTabs button{min-width:110px!important}
  .public-v131 .leader.public-candidate-row{grid-template-columns:42px minmax(0,1fr) 70px!important;gap:8px!important;padding:8px!important}
  .public-v131 .leader .num{width:40px!important;height:47px!important}.public-v131 .leader .votes{width:70px}.public-v131 .leader .votes b{font-size:11.5px!important}
  .public-v131 .public-bottom-nav button b{font-size:9px}
}
@media(prefers-reduced-motion:reduce){.public-v131 #cargoTabs button,.public-v131 .leader.public-candidate-row{transition:none!important;scroll-behavior:auto!important}}
`;
function style(){let s=document.getElementById('v152-public-polish');if(!s){s=document.createElement('style');s.id='v152-public-polish';document.head.appendChild(s)}if(s.textContent!==POLISH)s.textContent=POLISH}
function tabs(){const box=document.getElementById('cargoTabs');if(!box)return;box.setAttribute('role','tablist');box.setAttribute('aria-label','Escolher cargo da apuração');const list=[...box.querySelectorAll('button')];for(const b of list){const active=b.classList.contains('active');b.setAttribute('role','tab');b.setAttribute('aria-selected',active?'true':'false');b.tabIndex=active?0:-1;if(!b.dataset.v152){b.dataset.v152='1';b.addEventListener('click',()=>setTimeout(()=>{b.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});sync()},20))}}if(!box.dataset.v152Keys){box.dataset.v152Keys='1';box.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const items=[...box.querySelectorAll('button')];if(!items.length)return;let i=Math.max(0,items.indexOf(document.activeElement));if(e.key==='ArrowLeft')i=(i-1+items.length)%items.length;if(e.key==='ArrowRight')i=(i+1)%items.length;if(e.key==='Home')i=0;if(e.key==='End')i=items.length-1;e.preventDefault();items[i].focus();items[i].click()})}const active=list.find(b=>b.classList.contains('active'));if(active&&box.dataset.v152Centered!==active.textContent){box.dataset.v152Centered=active.textContent||'';setTimeout(()=>active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}),30)}}
function candidates(){document.querySelectorAll('#leaders .leader').forEach((row,i)=>{row.classList.add('public-candidate-row');row.dataset.rank=String(i+1);const name=row.querySelector('.who b')?.textContent?.trim();const votes=row.querySelector('.votes b')?.textContent?.trim();const pct=row.querySelector('.votes small')?.textContent?.trim();if(name)row.setAttribute('aria-label',[name,votes&&`${votes} votos`,pct].filter(Boolean).join(', '))})}
function progress(){const t=document.getElementById('cargoProgressText');if(t){t.setAttribute('aria-live','polite');t.setAttribute('aria-atomic','true')}const leaders=document.getElementById('leaders');if(leaders){leaders.setAttribute('aria-live','polite');leaders.setAttribute('aria-relevant','additions text')}}
function access(){const b=document.querySelector('.unified-team-entry');if(b){b.setAttribute('aria-label','Acesso da equipe por chave');b.setAttribute('title','Entrar com chave de operador ou coordenação')}}
function sync(){style();tabs();candidates();progress();access()}
function boot(){sync();setTimeout(sync,200);setTimeout(sync,800);let queued=false;const mo=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})});mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});window.addEventListener('resize',sync,{passive:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
