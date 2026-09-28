(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);

function ensureInstitutionalNote(){
  if(!PUBLIC.has(location.pathname))return;
  let el=document.getElementById('ce189InstitutionalNote');
  if(!el){
    el=document.createElement('footer');
    el.id='ce189InstitutionalNote';
    el.className='ce189-institutional-note';
    el.setAttribute('aria-label','Aviso institucional');
    el.textContent='Acompanhamento local das seções da 16ª Zona Eleitoral. A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.';
    const nav=document.querySelector('.public-bottom-nav,.bottom-nav,.footer-nav');
    if(nav&&nav.parentNode)nav.parentNode.insertBefore(el,nav);
    else document.body.appendChild(el);
  }
}

function tagNumerics(){
  document.querySelectorAll('#leaders .votes,.metric b,.mini b,.public-overview-row strong,[data-ce176-time],time').forEach(el=>el.classList.add('numeric'));
}

function normalizeCandidateCards(){
  document.querySelectorAll('#leaders .leader').forEach(row=>{
    row.style.removeProperty('border-left-color');
    row.style.removeProperty('border-left');
    const img=row.querySelector('.num img');
    if(img){
      img.alt=img.alt||('Foto de '+(row.querySelector('.who b')?.textContent?.trim()||'candidato'));
      img.style.objectPosition='50% 25%';
    }
  });
}

function run(){
  document.documentElement.dataset.ceIdentity='189';
  tagNumerics();
  normalizeCandidateCards();
  ensureInstitutionalNote();
}
function start(){
  run();
  [200,700,1600].forEach(ms=>setTimeout(run,ms));
  new MutationObserver(()=>requestAnimationFrame(run)).observe(document.body,{subtree:true,childList:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();