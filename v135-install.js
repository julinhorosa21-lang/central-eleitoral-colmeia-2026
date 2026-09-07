(()=>{
'use strict';
const PATHS=new Set(['/','/index.html','/transparencia.html']);
if(!PATHS.has(location.pathname))return;
let deferredPrompt=null;
const STYLE=`
.public-install-wrap{display:flex;align-items:center;gap:7px;margin-top:7px}
.public-install-btn{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.38);border-radius:9px;background:#fff;color:#174f7a;padding:7px 10px;font:inherit;font-size:10.5px;font-weight:800;line-height:1;cursor:pointer;box-shadow:0 1px 2px rgba(15,42,61,.12)}
.public-install-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.public-install-btn:focus-visible{outline:3px solid #f2c94c;outline-offset:2px}
.public-install-btn[hidden]{display:none!important}
.public-install-toast{position:fixed;left:50%;bottom:76px;z-index:1400;transform:translateX(-50%);width:min(92vw,520px);padding:10px 12px;border-radius:10px;background:#173f5b;color:#fff;font-size:11px;line-height:1.4;text-align:center;box-shadow:0 8px 28px rgba(0,0,0,.2)}
@media(max-width:439px){.public-install-btn{padding:7px 9px;font-size:10px}.public-install-toast{bottom:72px}}
`;
const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches===true||window.navigator.standalone===true;
function ensureStyle(){if(document.getElementById('v135-install-style'))return;const s=document.createElement('style');s.id='v135-install-style';s.textContent=STYLE;document.head.appendChild(s)}
let toastTimer=null;
function toast(message){let el=document.getElementById('v135InstallToast');if(!el){el=document.createElement('div');el.id='v135InstallToast';el.className='public-install-toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true},4200)}
function installButton(){const hero=document.querySelector('.hero.public-main-hero')||document.querySelector('.hero');if(!hero)return null;let wrap=document.getElementById('v135InstallWrap');if(!wrap){wrap=document.createElement('div');wrap.id='v135InstallWrap';wrap.className='public-install-wrap';wrap.innerHTML='<button type="button" class="public-install-btn" id="v135InstallBtn" aria-label="Instalar Central Eleitoral Colméia 2026"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg><span>Instalar app</span></button>';const live=hero.querySelector('.live');if(live)live.after(wrap);else hero.appendChild(wrap);wrap.querySelector('button').addEventListener('click',requestInstall)}const btn=wrap.querySelector('#v135InstallBtn');if(btn)btn.hidden=isStandalone();return btn}
async function requestInstall(){if(isStandalone()){toast('O aplicativo já está instalado neste dispositivo.');installButton();return}if(deferredPrompt){const p=deferredPrompt;deferredPrompt=null;try{await p.prompt();const choice=await p.userChoice;if(choice?.outcome==='accepted')toast('Instalação iniciada.');else toast('Instalação cancelada. Você pode tentar novamente quando quiser.')}catch{toast('Não foi possível abrir a instalação automática. Use o menu do navegador para instalar.')}installButton();return}const ua=navigator.userAgent||'';if(/iPhone|iPad|iPod/i.test(ua))toast('No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.');else toast('No menu ⋮ do navegador, toque em “Instalar app” ou “Adicionar à tela inicial”.')}
function refresh(){ensureStyle();installButton()}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;refresh()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;refresh();toast('Central Eleitoral instalada com sucesso.')});
function boot(){refresh();setTimeout(refresh,250);setTimeout(refresh,900);let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}).observe(document.body,{childList:true,subtree:true});window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',refresh);window.addEventListener('pageshow',refresh)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
