(()=>{
  'use strict';
  const MAP_URL='/data/candidate-photo-map.json';
  let photoMap=null, scheduled=false;
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
  const cargoFromNumber=n=>String(n).length===4?'depFederal':String(n).length===5?'depEstadual':null;
  const entryFor=(numero,cargoHint)=>{
    if(!photoMap)return null;
    const n=String(numero||'').trim();
    const cargo=cargoHint||cargoFromNumber(n);
    return cargo&&photoMap.byCargo?.[cargo]?.[n]||null;
  };
  const makeImg=e=>{
    const img=document.createElement('img');
    img.className='candidate-photo-v0241';
    img.src=e.foto;
    img.alt=`Foto de ${e.nome||e.nomeCompleto||'candidato'}`;
    img.loading='lazy'; img.decoding='async';
    img.onerror=()=>{img.style.display='none'};
    return img;
  };
  function decorateTransparency(){
    const root=document.getElementById('leaders'); if(!root)return;
    const active=document.querySelector('#cargoTabs button.active');
    const cargo=active?.dataset?.cargo;
    if(cargo!=='depFederal'&&cargo!=='depEstadual')return;
    root.querySelectorAll('.leader').forEach(row=>{
      const box=row.querySelector('.num'); if(!box||box.dataset.v0241)return;
      const numero=box.textContent.trim(); const e=entryFor(numero,cargo); if(!e)return;
      box.dataset.v0241='1'; box.classList.add('v0241-photo-num'); box.textContent='';
      box.appendChild(makeImg(e));
      const badge=document.createElement('span'); badge.className='v0241-number-badge'; badge.textContent=numero; box.appendChild(badge);
    });
  }
  function candidateCardFor(numberNode,e,root){
    const names=[norm(e.nome),norm(e.nomeCompleto)].filter(Boolean);
    let node=numberNode;
    for(let i=0;i<6&&node&&node!==root;i++,node=node.parentElement){
      const text=norm(node.textContent); if(text.length>900)continue;
      if(names.some(n=>n&&text.includes(n)))return node;
    }
    node=numberNode;
    for(let i=0;i<4&&node?.parentElement&&node.parentElement!==root;i++,node=node.parentElement){
      const p=node.parentElement, t=(p.textContent||'').trim();
      if(t.length<500&&t.length>String(e.numero).length+2)return p;
    }
    return numberNode.parentElement;
  }
  function decorateCatalog(){
    const root=document.getElementById('candidateCatalog'); if(!root)return;
    const leaves=[...root.querySelectorAll('*')].filter(el=>el.children.length===0&&/^\d{4,5}$/.test((el.textContent||'').trim()));
    for(const leaf of leaves){
      if(leaf.dataset.v0241Probe)return; leaf.dataset.v0241Probe='1';
      const numero=leaf.textContent.trim(), cargo=cargoFromNumber(numero), e=entryFor(numero,cargo); if(!e)continue;
      const card=candidateCardFor(leaf,e,root); if(!card||card===root||card.dataset.v0241Photo)return;
      card.dataset.v0241Photo='1'; card.classList.add('v0241-photo-card'); card.appendChild(makeImg(e));
    }
  }
  function decorateGenericResults(){
    document.querySelectorAll('[data-candidate-number],[data-numero-candidato]').forEach(el=>{
      if(el.dataset.v0241Photo)return;
      const numero=el.dataset.candidateNumber||el.dataset.numeroCandidato||'';
      const e=entryFor(numero); if(!e)return;
      const host=el.closest('.candidate,.candidate-card,.result-row,.result-item,.card')||el.parentElement;
      if(!host||host.dataset.v0241Photo)return;
      host.dataset.v0241Photo='1'; host.classList.add('v0241-photo-card'); host.appendChild(makeImg(e));
    });
  }
  function updateVersion(){
    document.querySelectorAll('.v022-version').forEach(el=>el.textContent='V0.24.1');
    const note=document.querySelector('.central-note');
    if(note) note.innerHTML='<b>V0.24.1 · Fotos dos candidatos:</b> catálogo proporcional atualizado com fotografias oficiais para Deputado Federal e Deputado Estadual, com carregamento otimizado e cache progressivo. Segurança, simulação, TSE e apuração permanecem inalterados.';
  }
  function run(){scheduled=false;decorateTransparency();decorateCatalog();decorateGenericResults();updateVersion()}
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(run,80)}
  async function install(){
    try{const r=await fetch(MAP_URL,{cache:'no-store'}); if(!r.ok)throw new Error('photo_map'); photoMap=await r.json();}
    catch(e){console.warn('candidate photos unavailable',e);return}
    run();
    const mo=new MutationObserver(schedule); mo.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',schedule,true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
