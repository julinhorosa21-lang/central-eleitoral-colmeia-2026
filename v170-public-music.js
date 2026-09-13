(()=>{
'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;

const STORAGE_KEY='ce-public-music-muted';
const SRC='/central-eleitoral-bg.mp3?v=170';
const VOLUME=0.22;
let audio=null;
let started=false;
let userMuted=localStorage.getItem(STORAGE_KEY)==='1';
let gestureBound=false;

function ensureAudio(){
  if(audio)return audio;
  audio=new Audio();
  audio.src=SRC;
  audio.loop=true;
  audio.preload='none';
  audio.volume=VOLUME;
  audio.muted=userMuted;
  audio.setAttribute('playsinline','');
  audio.addEventListener('play',()=>{started=true;syncButton()});
  audio.addEventListener('pause',syncButton);
  audio.addEventListener('volumechange',syncButton);
  audio.addEventListener('error',()=>{
    const b=document.getElementById('ce170-music-toggle');
    if(b){b.dataset.state='error';b.title='Não foi possível carregar a música';b.setAttribute('aria-label','Música indisponível');}
  });
  return audio;
}

function buttonLabel(){
  if(userMuted)return {icon:'🔇',text:'Silenciado',aria:'Ativar música de fundo'};
  if(started && audio && !audio.paused)return {icon:'🔊',text:'Música',aria:'Silenciar música de fundo'};
  return {icon:'▶',text:'Música',aria:'Reproduzir música de fundo'};
}

function syncButton(){
  const b=document.getElementById('ce170-music-toggle');
  if(!b)return;
  const s=buttonLabel();
  b.querySelector('.ce170-music-icon').textContent=s.icon;
  b.querySelector('.ce170-music-text').textContent=s.text;
  b.setAttribute('aria-label',s.aria);
  b.title=s.aria;
  b.dataset.muted=userMuted?'1':'0';
  b.dataset.playing=(!userMuted && started && audio && !audio.paused)?'1':'0';
}

async function tryPlay(){
  if(userMuted)return false;
  const a=ensureAudio();
  a.muted=false;
  try{await a.play();started=true;syncButton();return true}catch{syncButton();return false}
}

function bindFirstGesture(){
  if(gestureBound)return;
  gestureBound=true;
  const start=async()=>{
    if(!userMuted && (!started || audio?.paused))await tryPlay();
    ['pointerdown','touchstart','keydown'].forEach(ev=>document.removeEventListener(ev,start,true));
  };
  ['pointerdown','touchstart','keydown'].forEach(ev=>document.addEventListener(ev,start,{capture:true,passive:true,once:false}));
}

function toggle(){
  const a=ensureAudio();
  if(userMuted){
    userMuted=false;
    localStorage.setItem(STORAGE_KEY,'0');
    a.muted=false;
    tryPlay();
  }else{
    userMuted=true;
    localStorage.setItem(STORAGE_KEY,'1');
    a.muted=true;
    a.pause();
    syncButton();
  }
}

function injectStyle(){
  if(document.getElementById('ce170-music-style'))return;
  const style=document.createElement('style');
  style.id='ce170-music-style';
  style.textContent=`
#ce170-music-toggle{position:fixed;right:14px;bottom:calc(78px + env(safe-area-inset-bottom));z-index:1200;display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:9px 13px;border:1px solid rgba(255,255,255,.34);border-radius:999px;background:linear-gradient(135deg,#08783f 0%,#145f98 58%,#173d78 100%);color:#fff;box-shadow:0 7px 22px rgba(18,63,92,.24);font:800 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease}
#ce170-music-toggle:hover{transform:translateY(-1px);box-shadow:0 9px 26px rgba(18,63,92,.29)}
#ce170-music-toggle:active{transform:translateY(0) scale(.98)}
#ce170-music-toggle[data-muted="1"]{background:rgba(42,58,69,.92);border-color:rgba(255,255,255,.18)}
#ce170-music-toggle[data-state="error"]{opacity:.62;pointer-events:none}
#ce170-music-toggle .ce170-music-icon{font-size:15px;line-height:1}
#ce170-music-toggle:focus-visible{outline:3px solid #FFDF00;outline-offset:2px}
@media(max-width:520px){#ce170-music-toggle{right:10px;bottom:calc(76px + env(safe-area-inset-bottom));min-width:42px;padding:9px 11px}#ce170-music-toggle .ce170-music-text{display:none}}
@media(prefers-reduced-motion:reduce){#ce170-music-toggle{transition:none}}
`;
  document.head.appendChild(style);
}

function injectButton(){
  if(document.getElementById('ce170-music-toggle'))return;
  const b=document.createElement('button');
  b.id='ce170-music-toggle';
  b.type='button';
  b.innerHTML='<span class="ce170-music-icon" aria-hidden="true">▶</span><span class="ce170-music-text">Música</span>';
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle()});
  document.body.appendChild(b);
  syncButton();
}

function onVisibility(){
  if(!audio)return;
  if(document.hidden){
    if(!audio.paused)audio.pause();
  }else if(!userMuted && started){
    tryPlay();
  }
}

function start(){
  injectStyle();
  injectButton();
  bindFirstGesture();
  if(!userMuted)tryPlay();
  document.addEventListener('visibilitychange',onVisibility);
  window.addEventListener('pageshow',()=>{if(!userMuted)tryPlay()});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
