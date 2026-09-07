(()=>{
  'use strict';
  const VERSION='1.0.0';
  const LABEL='V1.0';
  const RELEASE={
    version:VERSION,
    label:LABEL,
    name:'Central Eleitoral Colméia 2026',
    channel:'stable'
  };
  try{window.CENTRAL_ELEITORAL_RELEASE=Object.freeze(RELEASE)}catch{}

  function applyVersion(){
    document.documentElement.dataset.appVersion=VERSION;
    document.querySelectorAll('.v022-version,[data-app-version]').forEach(el=>{
      if(el.hasAttribute('data-app-version')) el.textContent=VERSION;
      else el.textContent=LABEL;
    });
    const path=location.pathname.replace(/\/+$/,'')||'/';
    if(path==='/'||path==='/index.html'){
      const note=document.querySelector('.central-note');
      if(note) note.innerHTML='<b>V1.0 · Versão estável:</b> apuração local, comparação com dados oficiais do TSE, transparência pública, auditoria, modo de simulação e fotos dos candidatos consolidados para operação. Os dados oficiais da Justiça Eleitoral continuam sendo a referência definitiva.';
    }
  }

  async function verifyBackendVersion(){
    try{
      const r=await fetch('/api/health',{cache:'no-store'});
      if(!r.ok) return;
      const data=await r.json();
      const backend=String(data.version||data.appVersion||'');
      if(backend && backend!==VERSION) console.warn(`Central Eleitoral: interface ${VERSION}, servidor ${backend}. Atualize o aplicativo.`);
    }catch{}
  }

  function install(){
    applyVersion();
    verifyBackendVersion();
    setTimeout(applyVersion,250);
    setTimeout(applyVersion,1200);
    window.addEventListener('pageshow',applyVersion);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
