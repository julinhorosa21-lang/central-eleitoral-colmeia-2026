(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
const ADMIN=location.pathname==='/admin/index.html'||location.pathname==='/admin.html';
if(!PUBLIC.has(location.pathname)&&!ADMIN)return;

const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const numFrom=v=>String(v??'').match(/\b\d{1,3}\b/)?.[0]||'';
let placeBySection=new Map();

async function loadPlaces(){
  try{
    const r=await fetch('/data/locais-colmeia.json',{cache:'force-cache'});
    if(!r.ok)return;
    const j=await r.json();
    const rows=Array.isArray(j)?j:(j.locais||j.places||j.items||[]);
    const map=new Map();
    for(const p of rows){
      const name=String(p?.nome||p?.name||p?.local||p?.titulo||p?.title||p?.id||'').trim();
      const secs=Array.isArray(p?.secoes)?p.secoes:Array.isArray(p?.sections)?p.sections:[];
      for(const s of secs){
        const n=Number(typeof s==='object'?(s.numero??s.section??s.secao):s);
        if(Number.isFinite(n))map.set(n,name);
      }
    }
    placeBySection=map;
  }catch{}
}

function button(label,value,active=false){
  const b=document.createElement('button');
  b.type='button';b.className='ce192-filter'+(active?' active':'');b.dataset.ce192Filter=value;b.textContent=label;
  return b;
}
function highlight(el){
  if(!el)return;
  el.classList.remove('ce192-highlight');
  void el.offsetWidth;
  el.classList.add('ce192-highlight');
  setTimeout(()=>el.classList.remove('ce192-highlight'),1500);
}

/* =========================================================
   Público — buscar seção/local e filtrar andamento
   ========================================================= */
function publicSecNumber(sec){
  return Number(sec.dataset.section||sec.dataset.secao||sec.dataset.ceSection||numFrom(sec.textContent));
}
function publicState(sec){
  const c=sec.classList,t=norm(sec.textContent+' '+sec.getAttribute('aria-label')+' '+sec.getAttribute('title'));
  if(c.contains('done')||c.contains('complete')||c.contains('completed')||/completa|concluida|concluido/.test(t))return'complete';
  if(c.contains('partial')||c.contains('received')||c.contains('recebida')||/parcial|recebida/.test(t))return'partial';
  return'pending';
}
function tagPublicSections(){
  document.querySelectorAll('#places .sec').forEach(sec=>{
    const n=publicSecNumber(sec),state=publicState(sec);
    if(Number.isFinite(n))sec.dataset.ce192Section=String(n);
    sec.dataset.ce192State=state;
    sec.classList.toggle('ce192-complete',state==='complete');
    sec.classList.toggle('ce192-partial',state==='partial');
    sec.classList.toggle('ce192-pending',state==='pending');
  });
}
function publicFilter(){
  const root=document.getElementById('ce192PublicToolbar'),places=document.getElementById('places');
  if(!root||!places)return;
  tagPublicSections();
  const q=norm(root.querySelector('input')?.value),filter=root.dataset.filter||'all';
  let visible=0;
  places.querySelectorAll('.place').forEach(place=>{
    const placeText=norm(place.querySelector('.place-head')?.textContent||place.textContent);
    let any=false;
    place.querySelectorAll('.sec').forEach(sec=>{
      const n=Number(sec.dataset.ce192Section),state=sec.dataset.ce192State||'pending';
      const searchText=norm((Number.isFinite(n)?'secao '+n+' ':'')+(placeBySection.get(n)||'')+' '+placeText+' '+sec.textContent);
      const okQ=!q||searchText.includes(q)||String(n)===q;
      const okF=filter==='all'||state===filter;
      const show=okQ&&okF;
      sec.hidden=!show;
      if(show){any=true;visible++}
    });
    place.hidden=!any;
  });
  const empty=document.getElementById('ce192PublicEmpty');
  empty?.classList.toggle('show',visible===0);
}
function nextPublicPending(){
  tagPublicSections();
  const secs=[...document.querySelectorAll('#places .sec')];
  const target=secs.find(s=>s.dataset.ce192State==='pending')||secs.find(s=>s.dataset.ce192State==='partial');
  if(!target)return;
  const n=Number(target.dataset.ce192Section);
  const toolbar=document.getElementById('ce192PublicToolbar');
  if(toolbar){
    toolbar.dataset.filter='all';
    toolbar.querySelectorAll('[data-ce192-filter]').forEach(b=>b.classList.toggle('active',b.dataset.ce192Filter==='all'));
    const input=toolbar.querySelector('input');if(input)input.value='';
    publicFilter();
  }
  target.closest('.place')?.removeAttribute('hidden');target.removeAttribute('hidden');
  target.scrollIntoView({behavior:'smooth',block:'center'});highlight(target);
}
function mountPublic(){
  if(!PUBLIC.has(location.pathname)||document.getElementById('ce192PublicToolbar'))return;
  const places=document.getElementById('places'),section=places?.closest('section');
  if(!places||!section)return;
  const bar=document.createElement('div');
  bar.id='ce192PublicToolbar';bar.className='ce192-toolbar';bar.dataset.filter='all';
  bar.innerHTML='<div class="ce192-search"><input type="search" inputmode="search" autocomplete="off" placeholder="Buscar seção ou local de votação" aria-label="Buscar seção ou local"><button type="button" aria-label="Limpar busca" title="Limpar">×</button></div><button type="button" class="ce192-next">Próxima seção aguardando</button><div class="ce192-filters" aria-label="Filtrar seções"></div>';
  const filters=bar.querySelector('.ce192-filters');
  [['Todas','all'],['Aguardando','pending'],['Parciais','partial'],['Completas','complete']].forEach(([l,v],i)=>filters.appendChild(button(l,v,i===0)));
  places.before(bar);
  const empty=document.createElement('div');empty.id='ce192PublicEmpty';empty.className='ce192-empty';empty.textContent='Nenhuma seção corresponde à busca ou ao filtro selecionado.';places.before(empty);
  const input=bar.querySelector('input');
  input.addEventListener('input',publicFilter);
  bar.querySelector('.ce192-search button').onclick=()=>{input.value='';publicFilter();input.focus()};
  filters.onclick=e=>{const b=e.target.closest('[data-ce192-filter]');if(!b)return;bar.dataset.filter=b.dataset.ce192Filter;filters.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));publicFilter()};
  bar.querySelector('.ce192-next').onclick=nextPublicPending;
  tagPublicSections();publicFilter();
}

/* =========================================================
   Administração — estados oficiais do /api/admin/integrity
   ========================================================= */
function adminCardState(card){
  const pill=card.querySelector('.ce176-pill');
  for(const s of ['pending','partial','protected','reopened','divergent'])if(pill?.classList.contains(s))return s;
  return'pending';
}
function enrichAdminCards(){
  document.querySelectorAll('#ce176Integrity [data-ce176-section]').forEach(card=>{
    const n=Number(card.dataset.ce176Section),name=placeBySection.get(n)||'';
    card.dataset.ce192State=adminCardState(card);
    card.dataset.ce192Search=norm('secao '+n+' '+name+' '+card.textContent);
    if(name&&!card.querySelector('.ce192-place')){
      const p=document.createElement('span');p.className='ce192-place';p.textContent=name;
      card.querySelector('small')?.insertAdjacentElement('afterend',p);
    }
  });
}
function adminFilter(){
  const bar=document.getElementById('ce192AdminToolbar');if(!bar)return;
  enrichAdminCards();
  const q=norm(bar.querySelector('input')?.value),filter=bar.dataset.filter||'all';
  const cards=[...document.querySelectorAll('#ce176Integrity [data-ce176-section]')];
  let visible=0;
  cards.forEach(card=>{
    const state=card.dataset.ce192State||'pending',hay=card.dataset.ce192Search||norm(card.textContent);
    const show=(!q||hay.includes(q)||String(card.dataset.ce176Section)===q)&&(filter==='all'||state===filter);
    card.hidden=!show;if(show)visible++;
  });
  let count=document.getElementById('ce192AdminMatchCount');
  if(!count){count=document.createElement('div');count.id='ce192AdminMatchCount';count.className='ce192-match-count';document.querySelector('#ce176Integrity [data-ce176-grid]')?.before(count)}
  if(count)count.textContent=visible+' de '+cards.length+' seções exibidas';
  document.getElementById('ce192AdminEmpty')?.classList.toggle('show',visible===0);
}
function nextAdminPending(){
  enrichAdminCards();
  const cards=[...document.querySelectorAll('#ce176Integrity [data-ce176-section]')];
  const priority=['divergent','partial','pending','reopened'];
  let target=null;
  for(const s of priority){target=cards.find(c=>c.dataset.ce192State===s);if(target)break}
  if(!target)return;
  const bar=document.getElementById('ce192AdminToolbar');
  if(bar){
    bar.dataset.filter='all';
    const input=bar.querySelector('input');if(input)input.value='';
    bar.querySelectorAll('[data-ce192-filter]').forEach(b=>b.classList.toggle('active',b.dataset.ce192Filter==='all'));
    adminFilter();
  }
  target.hidden=false;target.scrollIntoView({behavior:'smooth',block:'center'});highlight(target);
  setTimeout(()=>target.click(),450);
}
function mountAdmin(){
  if(!ADMIN)return;
  const root=document.getElementById('ce176Integrity');
  if(!root||document.getElementById('ce192AdminToolbar'))return;
  const head=root.querySelector('.ce176-integrity-head');
  const bar=document.createElement('div');bar.id='ce192AdminToolbar';bar.className='ce192-toolbar ce192-admin-toolbar';bar.dataset.filter='all';
  bar.innerHTML='<div class="ce192-search"><input type="search" inputmode="search" autocomplete="off" placeholder="Buscar seção ou local" aria-label="Buscar seção ou local"><button type="button" aria-label="Limpar busca">×</button></div><button type="button" class="ce192-next">Próxima pendência</button><div class="ce192-filters" aria-label="Filtrar situação das seções"></div>';
  const filters=bar.querySelector('.ce192-filters');
  [['Todas','all'],['Pendentes','pending'],['Parciais','partial'],['Protegidas','protected'],['Reabertas','reopened'],['Divergências','divergent']].forEach(([l,v],i)=>filters.appendChild(button(l,v,i===0)));
  head?.insertAdjacentElement('afterend',bar);
  const empty=document.createElement('div');empty.id='ce192AdminEmpty';empty.className='ce192-empty';empty.textContent='Nenhuma seção corresponde aos filtros atuais.';root.querySelector('[data-ce176-grid]')?.insertAdjacentElement('afterend',empty);
  const input=bar.querySelector('input');input.addEventListener('input',adminFilter);
  bar.querySelector('.ce192-search button').onclick=()=>{input.value='';adminFilter();input.focus()};
  filters.onclick=e=>{const b=e.target.closest('[data-ce192-filter]');if(!b)return;bar.dataset.filter=b.dataset.ce192Filter;filters.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));adminFilter()};
  bar.querySelector('.ce192-next').onclick=nextAdminPending;
  const grid=root.querySelector('[data-ce176-grid]');
  if(grid)new MutationObserver(()=>setTimeout(adminFilter,30)).observe(grid,{childList:true,subtree:true});
  adminFilter();
}

async function start(){
  await loadPlaces();
  if(PUBLIC.has(location.pathname)){
    mountPublic();
    [300,900].forEach(ms=>setTimeout(()=>{mountPublic();tagPublicSections();publicFilter()},ms));
    const places=document.getElementById('places');
    if(places)new MutationObserver(()=>setTimeout(()=>{tagPublicSections();publicFilter()},50)).observe(places,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  if(ADMIN){
    mountAdmin();
    [300,900,1800].forEach(ms=>setTimeout(()=>{mountAdmin();adminFilter()},ms));
  }
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();