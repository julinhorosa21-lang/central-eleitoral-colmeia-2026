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

/* V1.7.1 — música ambiente pública: correção de autoplay/primeiro toque. */
(()=>{
  'use strict';
  const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
  if(!PUBLIC.has(location.pathname))return;
  if(window.__cePublicMusic171)return;window.__cePublicMusic171=true;
  const KEY='ce-public-music-muted';
  const REV='e345d7a56a71485358bfc34a6c27c994cddff814';
  const PARTS=Array.from({length:7},(_,i)=>`https://raw.githubusercontent.com/julinhorosa21-lang/central-eleitoral-colmeia-2026/${REV}/musicloop-b64/part${String(i+1).padStart(2,'0')}.txt`);
  const VOL=.24;
  let audio=null,loading=null,objectUrl='',started=false,failed=false;
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
      const chunks=texts.map(bytesFromBase64),size=chunks.reduce((n,c)=>n+c.length,0),merged=new Uint8Array(size);let off=0;
      for(const chunk of chunks){merged.set(chunk,off);off+=chunk.length}
      objectUrl=URL.createObjectURL(new Blob([merged],{type:'audio/mpeg'}));
      return objectUrl;
    })();
    try{return await loading}finally{loading=null}
  }
  function isPlaying(){return !!(audio&&!audio.paused&&!audio.ended)}
  function state(){
    if(failed)return ['⚠','Áudio','Não foi possível carregar a música. Toque para tentar novamente'];
    if(muted)return ['🔇','Silenciado','Ativar música de fundo'];
    if(isPlaying())return ['🔊','Música','Silenciar música de fundo'];
    return ['▶','Música','Reproduzir música de fundo'];
  }
  function sync(){
    const b=document.getElementById('ce171-music-toggle');if(!b)return;const [icon,text,aria]=state();
    b.querySelector('.ce171-music-icon').textContent=icon;b.querySelector('.ce171-music-text').textContent=text;b.setAttribute('aria-label',aria);b.title=aria;b.dataset.muted=muted?'1':'0';b.dataset.failed=failed?'1':'0';
  }
  async function ensure(){
    if(audio)return audio;
    const src=await source();
    audio=new Audio(src);audio.loop=true;audio.volume=VOL;audio.muted=false;audio.preload='auto';audio.setAttribute('playsinline','');
    audio.addEventListener('play',()=>{started=true;failed=false;sync()});audio.addEventListener('pause',sync);audio.addEventListener('error',()=>{failed=true;sync()});
    return audio;
  }
  async function play(){
    try{
      failed=false;muted=false;localStorage.setItem(KEY,'0');
      const a=await ensure();a.muted=false;a.volume=VOL;await a.play();started=true;sync();return true;
    }catch{failed=true;sync();return false}
  }
  async function toggle(){
    if(muted||failed||!isPlaying()){await play();return}
    muted=true;localStorage.setItem(KEY,'1');if(audio){audio.muted=true;audio.pause()}sync();
  }
  function style(){
    if(document.getElementById('ce171-music-style'))return;const s=document.createElement('style');s.id='ce171-music-style';s.textContent='#ce171-music-toggle{position:fixed;right:14px;bottom:calc(78px + env(safe-area-inset-bottom));z-index:1200;display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:9px 13px;border:1px solid rgba(255,255,255,.34);border-radius:999px;background:linear-gradient(135deg,#08783f 0%,#145f98 58%,#173d78 100%);color:#fff;box-shadow:0 7px 22px rgba(18,63,92,.24);font:800 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}#ce171-music-toggle[data-muted="1"]{background:rgba(42,58,69,.92)}#ce171-music-toggle[data-failed="1"]{background:#8a4d16}#ce171-music-toggle:focus-visible{outline:3px solid #FFDF00;outline-offset:2px}.ce171-music-icon{font-size:15px}@media(max-width:520px){#ce171-music-toggle{right:10px;bottom:calc(76px + env(safe-area-inset-bottom));padding:9px 11px}.ce171-music-text{display:none}}';document.head.appendChild(s);
  }
  function button(){
    document.getElementById('ce170-music-toggle')?.remove();
    if(document.getElementById('ce171-music-toggle'))return;
    const b=document.createElement('button');b.id='ce171-music-toggle';b.type='button';b.innerHTML='<span class="ce171-music-icon" aria-hidden="true">▶</span><span class="ce171-music-text">Música</span>';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle()});document.body.appendChild(b);sync();
  }
  function install(){
    style();button();
    if(!muted)play();
    const first=e=>{if(muted||e.target?.closest?.('#ce171-music-toggle'))return;play();['pointerdown','touchstart','keydown'].forEach(ev=>document.removeEventListener(ev,first,true))};
    ['pointerdown','touchstart','keydown'].forEach(ev=>document.addEventListener(ev,first,{capture:true,passive:true}));
    document.addEventListener('visibilitychange',()=>{if(!audio)return;if(document.hidden){if(isPlaying())audio.pause()}else if(!muted&&started)play()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

/* V1.7.1 — instalação: captura o prompt e oferece abertura no Chrome em abas internas. */
(()=>{
  'use strict';
  const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
  if(!PUBLIC.has(location.pathname))return;
  let promptEvent=null,busy=false;
  const standalone=()=>matchMedia?.('(display-mode: standalone)').matches===true||navigator.standalone===true;
  const android=()=>/Android/i.test(navigator.userAgent||'');
  const help=html=>{const el=document.getElementById('pwaInstallHelp');if(!el)return;el.innerHTML=html;el.hidden=false};
  const state=text=>{const el=document.getElementById('pwaInstallState');if(el)el.textContent=text};
  const chromeIntent=()=>`intent://${location.host}${location.pathname}${location.search||''}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(location.href)};end`;

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;state('Pronto para instalar neste dispositivo');const h=document.getElementById('pwaInstallHelp');if(h){h.hidden=true;h.textContent=''}});
  window.addEventListener('appinstalled',()=>{promptEvent=null;document.getElementById('pwaInstallCard')?.remove()});

  async function ensure(){
    if(!('serviceWorker' in navigator))return false;
    try{await navigator.serviceWorker.register('/service-worker.js?v=171',{scope:'/'});await navigator.serviceWorker.ready;const m=document.querySelector('link[rel="manifest"]');if(m&&!/v=171/.test(m.href))m.href='/manifest.webmanifest?v=171';return true}catch{return false}
  }
  async function installNow(btn){
    if(busy||standalone())return;busy=true;btn.disabled=true;btn.textContent='Preparando…';
    await ensure();if(!promptEvent)await new Promise(r=>setTimeout(r,900));
    if(promptEvent){
      const p=promptEvent;promptEvent=null;
      try{await p.prompt();const choice=await p.userChoice;if(choice?.outcome==='accepted'){state('Instalação iniciada');help('A Central será adicionada à sua tela inicial.')}else{state('Instalação disponível');help('Instalação cancelada. Toque novamente quando quiser.')}}catch{help('O navegador não conseguiu abrir a instalação. Tente a opção abaixo para abrir no Chrome.')}
    }else if(android()){
      state('Abra no Chrome para instalar');
      help(`<b>Seu navegador atual não libera a instalação direta.</b><br><a id="pwaChrome171" href="${chromeIntent()}" style="display:inline-block;margin-top:8px;padding:9px 12px;border-radius:9px;background:#1d638f;color:#fff;text-decoration:none;font-weight:800">Abrir no Chrome</a><br><span style="display:block;margin-top:7px">No Chrome, use ⋮ → <b>Adicionar à tela inicial</b> ou <b>Instalar app</b>.</span>`);
    }else help('Use o menu do navegador e escolha “Adicionar à tela inicial” ou “Instalar app”.');
    busy=false;btn.disabled=false;btn.textContent='Instalar app';
  }
  document.addEventListener('click',e=>{const btn=e.target?.closest?.('#pwaInstallBtn');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();installNow(btn)},true);
})();
