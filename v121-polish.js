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
