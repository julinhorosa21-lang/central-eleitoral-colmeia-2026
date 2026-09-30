(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;

function mountBar(){
  if(document.getElementById('ce200AppBar'))return;
  const bar=document.createElement('header');
  bar.id='ce200AppBar';
  bar.className='ce200-appbar';
  bar.innerHTML=
    '<div class="ce200-appmark" aria-hidden="true">CE</div>'+
    '<div class="ce200-appbrand"><b>Central Eleitoral Colméia 2026</b><span>Acompanhamento local de resultados</span></div>'+
    '<div class="ce200-locality" aria-label="Localidade acompanhada"><i></i><div><small>Localidade</small><strong>Colméia · TO</strong></div></div>';
  document.body.prepend(bar);
}

function mountContext(){
  if(document.getElementById('ce200Context'))return;
  const hero=document.querySelector('.hero.public-main-hero,.hero');
  if(!hero)return;
  const box=document.createElement('section');
  box.id='ce200Context';
  box.className='ce200-context';
  box.innerHTML=
    '<div class="ce200-context-item"><small>Eleição</small><strong>Eleições Gerais 2026</strong><span>Acompanhamento municipal</span></div>'+
    '<div class="ce200-context-item"><small>Área acompanhada</small><strong>Colméia · Tocantins</strong><span>29 seções locais</span></div>';
  hero.insertAdjacentElement('afterend',box);
}

function tuneHero(){
  const hero=document.querySelector('.hero');
  if(!hero)return;
  const eyebrow=hero.querySelector('.eyebrow');
  const h1=hero.querySelector('h1');
  const p=hero.querySelector('p');
  if(eyebrow)eyebrow.textContent='RESULTADOS · COLMÉIA/TO';
  if(h1)h1.textContent='Acompanhe a apuração';
  if(p)p.textContent='Resultados locais organizados por cargo, seção e local de votação.';
}

function independentNote(){
  if(document.getElementById('ce200Independent'))return;
  const notice=document.querySelector('.notice,#publicSobre');
  if(!notice)return;
  const n=document.createElement('div');
  n.id='ce200Independent';
  n.className='ce200-independent';
  n.innerHTML='<b>Central independente.</b> Esta interface não é um aplicativo oficial da Justiça Eleitoral. A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.';
  notice.insertAdjacentElement('afterend',n);
}

function shortCargoLabels(){
  const map={depFederal:'Deputado federal',depEstadual:'Deputado estadual'};
  document.querySelectorAll('#cargoTabs button[data-cargo]').forEach(b=>{
    const k=b.dataset.cargo;
    if(map[k]&&b.textContent.trim()!==map[k])b.textContent=map[k];
  });
}

function apply(){
  document.body.classList.add('ce200-resultados');
  mountBar();
  tuneHero();
  mountContext();
  independentNote();
  shortCargoLabels();
}
function start(){
  apply();
  [100,350,900,1800].forEach(ms=>setTimeout(apply,ms));
  const tabs=document.getElementById('cargoTabs');
  if(tabs)new MutationObserver(shortCargoLabels).observe(tabs,{childList:true,subtree:true,characterData:true});
  window.addEventListener('pageshow',apply);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();