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
