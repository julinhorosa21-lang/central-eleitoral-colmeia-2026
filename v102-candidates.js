(()=>{
  'use strict';
  const STATIC_URL='/data/candidate-catalog.json';
  const cargos=['presidente','governador','senador','depFederal','depEstadual'];
  let activeSnapshot=null;

  function prettyStatus(v){
    const s=String(v||'').trim(); if(!s)return'';
    return s.toLocaleLowerCase('pt-BR').replace(/(^|[\s/-])([a-záàâãéêíóôõúç])/g,(m,a,b)=>a+b.toLocaleUpperCase('pt-BR'));
  }
  function applySnapshot(snapshot){
    if(!snapshot?.candidates || typeof CANDIDATOS==='undefined')return false;
    for(const cargo of cargos){
      const incoming=Array.isArray(snapshot.candidates[cargo])?snapshot.candidates[cargo]:[];
      if(!incoming.length)continue;
      const current=Array.isArray(CANDIDATOS[cargo])?CANDIDATOS[cargo]:[];
      const byNum=new Map(current.map(c=>[String(c.numero),c]));
      const merged=incoming.map(row=>{
        const numero=String(row.numero||'').trim(),prev=byNum.get(numero)||{};
        const sameCandidate=prev.sqCandidato && row.sqCandidato && String(prev.sqCandidato)===String(row.sqCandidato);
        return {...prev,...row,numero,situacao:prettyStatus(row.situacao||prev.situacao),foto:(sameCandidate&&prev.foto)?prev.foto:(row.foto||prev.foto||'')};
      });
      current.splice(0,current.length,...merged);
      CANDIDATOS[cargo]=current;
    }
    activeSnapshot=snapshot;
    try{if(typeof renderCandidates==='function')renderCandidates(true)}catch(e){console.warn('catalog render refresh failed',e)}
    renderState();
    return true;
  }
  function ageLabel(iso){
    const t=Date.parse(iso||''); if(!Number.isFinite(t))return'';
    const h=Math.max(0,Math.round((Date.now()-t)/3600000));
    if(h<1)return'agora'; if(h<24)return`há ${h} h`; const d=Math.round(h/24);return`há ${d} dia${d===1?'':'s'}`;
  }
  function renderState(message=''){
    const el=document.getElementById('candidateTseSync'); if(!el)return;
    if(message){el.textContent=message;return}
    if(!activeSnapshot){el.textContent='Catálogo-base local';return}
    const when=ageLabel(activeSnapshot.generatedAt||activeSnapshot.updatedAt);
    const total=Object.values(activeSnapshot.counts||{}).reduce((a,b)=>a+(Number(b)||0),0);
    el.textContent=`TSE sincronizado${when?' · '+when:''}${total?' · '+total+' candidaturas':''}`;
  }
  function ensureUi(){
    const catalog=document.getElementById('candidateCatalog');
    if(catalog&&!document.getElementById('candidateTseSync')){
      const head=catalog.querySelector('.results-head');
      if(head){const s=document.createElement('span');s.id='candidateTseSync';s.className='cand-count';s.textContent='Verificando catálogo TSE…';head.appendChild(s)}
    }
    const actions=document.querySelector('.coord-actions');
    if(actions&&!document.getElementById('candidateRefreshTse')){
      const btn=document.createElement('button');btn.className='btn';btn.id='candidateRefreshTse';btn.type='button';btn.textContent='Atualizar candidaturas TSE';actions.appendChild(btn);
      btn.addEventListener('click',async()=>{
        try{
          if(typeof ensureAdmin!=='function'||!(await ensureAdmin()))return;
          btn.disabled=true;btn.textContent='Consultando TSE…';renderState('Atualizando pelo TSE…');
          const r=typeof api==='function'?await api('/api/admin/candidates/refresh',{method:'POST',body:'{}'}):await fetch('/api/admin/candidates/refresh',{method:'POST'});
          const j=await r.json().catch(()=>({}));
          if(!r.ok)throw new Error(j.error||`HTTP ${r.status}`);
          applySnapshot(j.snapshot);
          const c=j.snapshot?.counts||{};
          alert(`Catálogo atualizado pelo TSE.\nPresidente: ${c.presidente||0}\nGovernador: ${c.governador||0}\nSenador: ${c.senador||0}\nDeputado Federal: ${c.depFederal||0}\nDeputado Estadual: ${c.depEstadual||0}`);
        }catch(e){console.error(e);alert('Não foi possível atualizar as candidaturas agora. O catálogo local anterior foi mantido intacto.');renderState()}
        finally{btn.disabled=false;btn.textContent='Atualizar candidaturas TSE'}
      });
    }
  }
  async function fetchCandidateSnapshot(){
    try{
      const r=await fetch('/api/candidates',{cache:'no-store'});if(r.ok){const j=await r.json();if(j.available&&j.snapshot&&applySnapshot(j.snapshot))return}
    }catch{}
    try{const r=await fetch(STATIC_URL,{cache:'no-store'});if(r.ok)applySnapshot(await r.json())}catch(e){console.warn('candidate static snapshot unavailable',e)}
    renderState();
  }
  function install(){ensureUi();fetchCandidateSnapshot();setTimeout(ensureUi,500);setTimeout(ensureUi,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();