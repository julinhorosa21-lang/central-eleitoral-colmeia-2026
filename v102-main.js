(()=>{
  'use strict';
  const VERSION='1.0.2';
  const LABEL='V1.0.2';
  try{window.CENTRAL_ELEITORAL_RELEASE=Object.freeze({version:VERSION,label:LABEL,name:'Central Eleitoral Colméia 2026',channel:'stable'})}catch{}
  function apply(){
    document.documentElement.dataset.appVersion=VERSION;
    document.querySelectorAll('.v022-version').forEach(el=>{el.textContent=LABEL});
    document.querySelectorAll('[data-release-version]').forEach(el=>{el.textContent=VERSION});
    const path=location.pathname.replace(/\/+$/,'')||'/';
    if(path==='/'||path==='/index.html'){
      const note=document.querySelector('.central-note');
      if(note) note.innerHTML='<b>V1.0.2 · Catálogo eleitoral sincronizável:</b> candidaturas podem ser atualizadas pela coordenação a partir do Portal de Dados Abertos do TSE, mantendo um snapshot local e preservando a apuração, BUs, chaves e modo de simulação.';
    }
  }
  async function verify(){
    try{const r=await fetch('/api/health',{cache:'no-store'});if(!r.ok)return;const j=await r.json();if(String(j.version||'')!==VERSION)console.warn(`Central Eleitoral: interface ${VERSION}, servidor ${j.version||'desconhecido'}.`)}catch{}
  }
  function install(){apply();verify();setTimeout(apply,250);window.addEventListener('pageshow',apply)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();