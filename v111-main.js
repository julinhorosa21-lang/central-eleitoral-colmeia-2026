(()=>{
  'use strict';
  const VERSION='1.1.1',LABEL='V1.1.1';
  try{window.CENTRAL_ELEITORAL_RELEASE=Object.freeze({version:VERSION,label:LABEL,name:'Central Eleitoral Colméia 2026',channel:'stable',ui:'natural'})}catch{}

  function removeTrainingUi(){
    document.querySelectorAll('.v024-sim-link,a[href="/simulacao.html"],a[href="/ensaio.html"]').forEach(el=>el.remove());
  }

  function cleanDecorations(){
    document.body.classList.add('natural-v120');
    document.querySelectorAll('.civic-sun,.civic-ribbon,.civic-horizon,.civic-seal').forEach(el=>el.remove());
  }

  function refineHeader(){
    const kicker=document.querySelector('.civic-kicker');
    if(kicker)kicker.textContent='Acompanhamento eleitoral local';
    const p=document.querySelector('.civic-brand-copy p');
    if(p)p.textContent='Acompanhamento das seções e conferência dos boletins de urna em um único painel.';
    const badge=document.querySelector('.civic-badge');
    if(badge)badge.textContent='2026';
    const context=document.querySelector('.civic-context');
    if(context&&!context.dataset.naturalUi){
      context.dataset.naturalUi='1';
      const labels=['Colméia · TO','16ª Zona Eleitoral','29 seções'];
      [...context.querySelectorAll('span')].forEach((el,i)=>{
        if(labels[i])el.innerHTML=`<i aria-hidden="true"></i>${labels[i]}`;
      });
    }
  }

  function refinePublicHeader(){
    if(!location.pathname.includes('transparencia'))return;
    const hero=document.querySelector('.hero');
    if(!hero)return;
    const eyebrow=hero.querySelector('.eyebrow');
    if(eyebrow)eyebrow.textContent='Central Eleitoral · Colméia 2026';
    const title=hero.querySelector('h1');
    if(title)title.textContent='Transparência da apuração';
    const p=hero.querySelector('p');
    if(p)p.textContent='Acompanhe o andamento das seções, os totais por cargo e a situação de conferência dos dados.';
  }

  function hideTechnicalChangelog(){
    const note=document.querySelector('.central-note');
    if(note)note.hidden=true;
  }

  function keepMapInPageFlow(){
    const roots=[...new Set([...document.querySelectorAll('#map,.mapbox,.map-wrap,.map-card,[data-map-container]')])];
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
      root.style.setProperty('inset','auto','important');
      root.style.setProperty('transform','none','important');
    }
  }

  function normalizeLabels(){
    const labels={centerMapBtn:'Centralizar',publicTransparencyBtn:'Transparência',coordToggle:'Coordenação',adminToggle:'Registrar BU'};
    for(const [id,label] of Object.entries(labels)){
      const el=document.getElementById(id);
      if(!el)continue;
      const icon=el.querySelector('.civic-action-icon');
      if(icon)el.innerHTML=icon.outerHTML+label;
    }
  }

  function applyRelease(){
    document.documentElement.dataset.appVersion=VERSION;
    document.documentElement.dataset.ui='natural';
    document.querySelectorAll('.v022-version').forEach(el=>{el.textContent=LABEL});
    document.querySelectorAll('[data-release-version]').forEach(el=>{el.textContent=VERSION});
  }

  async function verify(){
    try{const r=await fetch('/api/health',{cache:'no-store'});if(!r.ok)return;const j=await r.json();if(String(j.version||'')!==VERSION)console.warn(`Central Eleitoral: interface ${VERSION}, servidor ${j.version||'desconhecido'}.`)}catch{}
  }

  function apply(){
    removeTrainingUi();
    cleanDecorations();
    refineHeader();
    refinePublicHeader();
    hideTechnicalChangelog();
    keepMapInPageFlow();
    normalizeLabels();
    applyRelease();
  }

  function install(){
    apply();verify();setTimeout(apply,250);setTimeout(apply,1000);window.addEventListener('pageshow',apply);
    const obs=new MutationObserver(()=>requestAnimationFrame(apply));
    obs.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
