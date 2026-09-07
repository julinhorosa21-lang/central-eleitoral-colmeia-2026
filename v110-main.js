(()=>{
  'use strict';
  const VERSION='1.1.0',LABEL='V1.1.0';
  try{window.CENTRAL_ELEITORAL_RELEASE=Object.freeze({version:VERSION,label:LABEL,name:'Central Eleitoral Colméia 2026',channel:'stable'})}catch{}
  function apply(){
    document.documentElement.dataset.appVersion=VERSION;
    document.querySelectorAll('.v022-version').forEach(el=>{el.textContent=LABEL});
    document.querySelectorAll('[data-release-version]').forEach(el=>{el.textContent=VERSION});
    const path=location.pathname.replace(/\/+$/,'')||'/';
    if(path==='/'||path==='/index.html'){
      const note=document.querySelector('.central-note');
      if(note)note.innerHTML='<b>V1.1.0 · Ensaio Geral:</b> treinamento completo com BUs sintéticos em QR, candidatos do catálogo da Central e gravação exclusiva no banco de simulação. A apuração real e a Transparência continuam isoladas.';
    }
  }
  async function verify(){try{const r=await fetch('/api/health',{cache:'no-store'});if(!r.ok)return;const j=await r.json();if(String(j.version||'')!==VERSION)console.warn(`Central Eleitoral: interface ${VERSION}, servidor ${j.version||'desconhecido'}.`)}catch{}}
  function install(){apply();verify();setTimeout(apply,250);window.addEventListener('pageshow',apply)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();