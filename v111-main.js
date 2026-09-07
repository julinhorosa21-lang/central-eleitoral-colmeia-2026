(()=>{
  'use strict';
  const VERSION='1.1.1',LABEL='V1.1.1';
  try{window.CENTRAL_ELEITORAL_RELEASE=Object.freeze({version:VERSION,label:LABEL,name:'Central Eleitoral Colméia 2026',channel:'stable'})}catch{}

  function removeTrainingUi(){
    document.querySelectorAll('.v024-sim-link,a[href="/simulacao.html"],a[href="/ensaio.html"]').forEach(el=>el.remove());
  }

  function keepMapInPageFlow(){
    const roots=[...new Set([
      ...document.querySelectorAll('#map,.mapbox,.map-wrap,.map-card,[data-map-container]')
    ])];
    for(const root of roots){
      let el=root;
      for(let depth=0;el&&depth<3;depth++,el=el.parentElement){
        const pos=getComputedStyle(el).position;
        if(pos==='fixed'||pos==='sticky'){
          el.style.setProperty('position','relative','important');
          el.style.setProperty('top','auto','important');
          el.style.setProperty('right','auto','important');
          el.style.setProperty('bottom','auto','important');
          el.style.setProperty('left','auto','important');
          el.style.setProperty('transform','none','important');
        }
      }
      root.style.setProperty('position','relative','important');
      root.style.setProperty('top','auto','important');
      root.style.setProperty('bottom','auto','important');
      root.style.setProperty('transform','none','important');
    }
  }

  function applyRelease(){
    document.documentElement.dataset.appVersion=VERSION;
    document.querySelectorAll('.v022-version').forEach(el=>{el.textContent=LABEL});
    document.querySelectorAll('[data-release-version]').forEach(el=>{el.textContent=VERSION});
    const path=location.pathname.replace(/\/+$/,'')||'/';
    if(path==='/'||path==='/index.html'){
      const note=document.querySelector('.central-note');
      if(note)note.innerHTML='<b>V1.1.1 · Interface operacional:</b> simulação e ensaio foram retirados da Central. O mapa permanece disponível, mas acompanha o fluxo normal da página e não fica mais flutuando durante a rolagem.';
    }
  }

  async function verify(){
    try{const r=await fetch('/api/health',{cache:'no-store'});if(!r.ok)return;const j=await r.json();if(String(j.version||'')!==VERSION)console.warn(`Central Eleitoral: interface ${VERSION}, servidor ${j.version||'desconhecido'}.`)}catch{}
  }

  function apply(){removeTrainingUi();keepMapInPageFlow();applyRelease()}
  function install(){
    apply();verify();setTimeout(apply,250);setTimeout(apply,1200);window.addEventListener('pageshow',apply);
    const obs=new MutationObserver(()=>requestAnimationFrame(apply));
    obs.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();