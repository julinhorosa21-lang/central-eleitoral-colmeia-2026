(()=>{
  'use strict';
  const MARK='v121-polish';

  function normalize(s){return String(s||'').replace(/\s+/g,' ').trim().toLocaleUpperCase('pt-BR')}

  function markIntro(){
    if(location.pathname.includes('transparencia'))return;
    for(const card of document.querySelectorAll('.card')){
      if(card.dataset.v121Intro)continue;
      const text=normalize(card.textContent);
      if(!text.includes('FEITO PARA NOSSA POPULAÇÃO ACOMPANHAR'))continue;
      card.dataset.v121Intro='1';
      card.classList.add('ui-intro-card');
      for(const el of card.querySelectorAll('span,small,b,strong,div')){
        const t=normalize(el.textContent);
        if(t.includes('VERDE')&&t.includes('AMARELO')&&t.includes('AZUL'))el.classList.add('ui-palette-note');
      }
    }
  }

  function compactPanels(){
    document.querySelectorAll('.tse-status,.pwa-panel').forEach(el=>el.classList.add('ui-compact-panel'));
  }

  function polishCandidates(){
    document.querySelectorAll('.candidate-grid').forEach(el=>el.dataset.v121='1');
  }

  function apply(){
    if(!document.body)return;
    document.body.dataset.uiPolish=MARK;
    markIntro();
    compactPanels();
    polishCandidates();
  }

  function install(){
    apply();
    setTimeout(apply,250);
    setTimeout(apply,900);
    const obs=new MutationObserver(()=>requestAnimationFrame(apply));
    obs.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('pageshow',apply);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

/* V1.7.0 — música ambiente exclusiva da área pública. */
(()=>{
  'use strict';
  const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
  if(!PUBLIC.has(location.pathname))return;
  if(window.__cePublicMusic170)return;window.__cePublicMusic170=true;
  const KEY='ce-public-music-muted';
  const REV='e345d7a56a71485358bfc34a6c27c994cddff814';
  const PARTS=Array.from({length:7},(_,i)=>`https://raw.githubusercontent.com/julinhorosa21-lang/central-eleitoral-colmeia-2026/${REV}/musicloop-b64/part${String(i+1).padStart(2,'0')}.txt`);
  const VOL=.22;
  let audio=null,loading=null,objectUrl='',started=false;
  let muted=localStorage.getItem(KEY)==='1';

  function bytesFromBase64(value){
    const s=String(value||'').replace(/\s+/g,'');
    const bin=atob(s),out=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);
    return out;
  }
  async function source(){
    if(objectUrl)return objectUrl;
    if(loading)return loading;
    loading=(async()=>{
      const texts=await Promise.all(PARTS.map(async url=>{const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text()}));
      const chunks=texts.map(bytesFromBase64);const size=chunks.reduce((n,c)=>n+c.length,0);const merged=new Uint8Array(size);let off=0;
      for(const chunk of chunks){merged.set(chunk,off);off+=chunk.length}
      objectUrl=URL.createObjectURL(new Blob([merged],{type:'audio/mpeg'}));return objectUrl;
    })();
    try{return await loading}finally{loading=null}
  }
  function state(){
    if(muted)return ['🔇','Silenciado','Ativar música de fundo'];
    if(started&&audio&&!audio.paused)return ['🔊','Música','Silenciar música de fundo'];
    return ['▶','Música','Reproduzir música de fundo'];
  }
  function sync(){
    const b=document.getElementById('ce170-music-toggle');if(!b)return;const [icon,text,aria]=state();
    b.querySelector('.ce170-music-icon').textContent=icon;b.querySelector('.ce170-music-text').textContent=text;b.setAttribute('aria-label',aria);b.title=aria;b.dataset.muted=muted?'1':'0';
  }
  async function ensure(){
    if(audio)return audio;const src=await source();audio=new Audio(src);audio.loop=true;audio.volume=VOL;audio.muted=muted;audio.preload='auto';audio.setAttribute('playsinline','');
    audio.addEventListener('play',()=>{started=true;sync()});audio.addEventListener('pause',sync);return audio;
  }
  async function play(){if(muted)return false;try{const a=await ensure();a.muted=false;await a.play();started=true;sync();return true}catch{sync();return false}}
  async function toggle(){
    if(muted){muted=false;localStorage.setItem(KEY,'0');await play();return}
    muted=true;localStorage.setItem(KEY,'1');if(audio){audio.muted=true;audio.pause()}sync();
  }
  function style(){
    if(document.getElementById('ce170-music-style'))return;const s=document.createElement('style');s.id='ce170-music-style';s.textContent='#ce170-music-toggle{position:fixed;right:14px;bottom:calc(78px + env(safe-area-inset-bottom));z-index:1200;display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:9px 13px;border:1px solid rgba(255,255,255,.34);border-radius:999px;background:linear-gradient(135deg,#08783f 0%,#145f98 58%,#173d78 100%);color:#fff;box-shadow:0 7px 22px rgba(18,63,92,.24);font:800 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}#ce170-music-toggle[data-muted="1"]{background:rgba(42,58,69,.92)}#ce170-music-toggle:focus-visible{outline:3px solid #FFDF00;outline-offset:2px}.ce170-music-icon{font-size:15px}@media(max-width:520px){#ce170-music-toggle{right:10px;bottom:calc(76px + env(safe-area-inset-bottom));padding:9px 11px}.ce170-music-text{display:none}}';document.head.appendChild(s);
  }
  function button(){
    if(document.getElementById('ce170-music-toggle'))return;const b=document.createElement('button');b.id='ce170-music-toggle';b.type='button';b.innerHTML='<span class="ce170-music-icon" aria-hidden="true">▶</span><span class="ce170-music-text">Música</span>';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle()});document.body.appendChild(b);sync();
  }
  function install(){
    style();button();
    if(!muted){play();const first=()=>{play();['pointerdown','touchstart','keydown'].forEach(ev=>document.removeEventListener(ev,first,true))};['pointerdown','touchstart','keydown'].forEach(ev=>document.addEventListener(ev,first,{capture:true,passive:true}))}
    document.addEventListener('visibilitychange',()=>{if(!audio)return;if(document.hidden){if(!audio.paused)audio.pause()}else if(!muted&&started)play()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
