(()=>{
  'use strict';
  const VERSION='1.0.1';
  const LABEL='V1.0.1';
  const RELEASE={
    version:VERSION,
    label:LABEL,
    name:'Central Eleitoral Colméia 2026',
    channel:'stable'
  };
  try{window.CENTRAL_ELEITORAL_RELEASE=Object.freeze(RELEASE)}catch{}

  function applyVersion(){
    // O atributo no <html> serve apenas como metadado para diagnóstico/CSS.
    // Nunca selecionar [data-app-version] para alterar textContent: isso apagaria o documento inteiro.
    document.documentElement.dataset.appVersion=VERSION;
    document.querySelectorAll('.v022-version').forEach(el=>{el.textContent=LABEL});
    document.querySelectorAll('[data-release-version]').forEach(el=>{el.textContent=VERSION});
    const path=location.pathname.replace(/\/+$/,'')||'/';
    if(path==='/'||path==='/index.html'){
      const note=document.querySelector('.central-note');
      if(note) note.innerHTML='<b>V1.0.1 · Versão estável:</b> correção de abertura da interface após a V1.0, mantendo apuração local, comparação com dados oficiais do TSE, transparência pública, auditoria, simulação e fotos dos candidatos.';
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
