(()=>{
  'use strict';
  const MARK='v121-polish';
  function normalize(s){return String(s||'').replace(/\s+/g,' ').trim().toLocaleUpperCase('pt-BR')}
  function markIntro(){if(location.pathname.includes('transparencia'))return;for(const card of document.querySelectorAll('.card')){if(card.dataset.v121Intro)continue;const text=normalize(card.textContent);if(!text.includes('FEITO PARA NOSSA POPULAÇÃO ACOMPANHAR'))continue;card.dataset.v121Intro='1';card.classList.add('ui-intro-card');for(const el of card.querySelectorAll('span,small,b,strong,div')){const t=normalize(el.textContent);if(t.includes('VERDE')&&t.includes('AMARELO')&&t.includes('AZUL'))el.classList.add('ui-palette-note')}}}
  function compactPanels(){document.querySelectorAll('.tse-status,.pwa-panel').forEach(el=>el.classList.add('ui-compact-panel'))}
  function polishCandidates(){document.querySelectorAll('.candidate-grid').forEach(el=>el.dataset.v121='1')}
  function apply(){if(!document.body)return;document.body.dataset.uiPolish=MARK;markIntro();compactPanels();polishCandidates()}
  function install(){apply();setTimeout(apply,250);setTimeout(apply,900);const obs=new MutationObserver(()=>requestAnimationFrame(apply));obs.observe(document.body,{childList:true,subtree:true});window.addEventListener('pageshow',apply)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

(()=>{
  'use strict';
  if(!new Set(['/','/index.html','/transparencia.html']).has(location.pathname))return;
  const KEY='ce-music-muted';
  const BASE='https://raw.githubusercontent.com/julinhorosa21-lang/central-eleitoral-colmeia-2026/e345d7a56a71485358bfc34a6c27c994cddff814/musicloop-b64/';
  let audio=null,url='',loadPromise=null,muted=localStorage.getItem(KEY)==='1';
  const names=['part01.txt','part02.txt','part03.txt','part04.txt','part05.txt','part06.txt','part07.txt'];
  function decode(s){const b=atob(String(s).replace(/\s/g,'')),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
  async function src(){if(url)return url;if(loadPromise)return loadPromise;loadPromise=(async()=>{const txt=await Promise.all(names.map(async n=>{const r=await fetch(BASE+n,{cache:'no-cache'});if(!r.ok)throw Error('audio');return r.text()}));const all=decode(txt.join(''));url=URL.createObjectURL(new Blob([all],{type:'audio/mpeg'}));return url})();return loadPromise}
  function isPlaying(){return audio&&!audio.paused&&!audio.ended}
  function update(){const b=document.getElementById('ceMusic');if(!b)return;if(muted){b.textContent='🔇';b.title='Ativar música'}else if(isPlaying()){b.textContent='🔊';b.title='Silenciar música'}else{b.textContent='▶';b.title='Reproduzir música'}}
  async function play(){try{muted=false;localStorage.setItem(KEY,'0');if(!audio){audio=new Audio(await src());audio.loop=true;audio.volume=.24;audio.addEventListener('play',update);audio.addEventListener('pause',update)}audio.muted=false;await audio.play();update()}catch{const b=document.getElementById('ceMusic');if(b){b.textContent='⚠';b.title='Não foi possível carregar o áudio'}}}
  async function toggle(){if(muted||!isPlaying())return play();muted=true;localStorage.setItem(KEY,'1');audio.pause();audio.muted=true;update()}
  function mount(){if(document.getElementById('ceMusic'))return;const s=document.createElement('style');s.textContent='#ceMusic{position:fixed;right:12px;bottom:calc(78px + env(safe-area-inset-bottom));z-index:1200;width:44px;height:44px;border:0;border-radius:50%;background:#145f98;color:#fff;font-size:18px;box-shadow:0 6px 18px #0003}';document.head.appendChild(s);const b=document.createElement('button');b.id='ceMusic';b.type='button';b.setAttribute('aria-label','Música de fundo');b.onclick=toggle;document.body.appendChild(b);update();if(!muted)play()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

(()=>{
  'use strict';
  if(!new Set(['/','/index.html','/transparencia.html']).has(location.pathname))return;
  let prompt=null,busy=false;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e});
  window.addEventListener('appinstalled',()=>{prompt=null;document.getElementById('pwaInstallCard')?.remove()});
  async function ready(){if(!('serviceWorker' in navigator))return false;try{const r=await navigator.serviceWorker.register('/service-worker.js?v=171',{scope:'/',updateViaCache:'none'});try{await r.update()}catch{}await navigator.serviceWorker.ready;return true}catch{return false}}
  function help(html){const h=document.getElementById('pwaInstallHelp');if(h){h.innerHTML=html;h.hidden=false}}
  async function install(btn){if(busy)return;busy=true;btn.disabled=true;btn.textContent='Preparando…';await ready();if(!prompt)await new Promise(r=>setTimeout(r,800));if(prompt){const p=prompt;prompt=null;try{await p.prompt();await p.userChoice}catch{help('O navegador não abriu a instalação.')}}else if(/Android/i.test(navigator.userAgent||'')){const dest='intent://'+location.host+location.pathname+'#Intent;scheme=https;package=com.android.chrome;end';help('<b>Abra no Chrome para concluir.</b><br><a href="'+dest+'" style="display:inline-block;margin-top:8px;padding:9px 12px;border-radius:9px;background:#1d638f;color:white;text-decoration:none;font-weight:800">Abrir no Chrome</a><br><span style="display:block;margin-top:7px">Depois use ⋮ → Adicionar à tela inicial ou Instalar app.</span>')}else help('Use o menu do navegador e escolha Adicionar à tela inicial ou Instalar app.');busy=false;btn.disabled=false;btn.textContent='Instalar app'}
  document.addEventListener('click',e=>{const b=e.target.closest?.('#pwaInstallBtn');if(!b)return;e.preventDefault();e.stopImmediatePropagation();install(b)},true);
})();