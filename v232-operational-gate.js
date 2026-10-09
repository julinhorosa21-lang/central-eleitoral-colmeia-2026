(()=>{'use strict';
if(location.pathname!=='/operacao.html')return;
document.documentElement.classList.add('ce232-auth-pending');

const rawFetch=window.fetch.bind(window);
let token=String(sessionStorage.getItem('ce_admin_token')||sessionStorage.getItem('ce_team_token')||'').trim();
let authUser=null;
let placeRows=null;

function apiFetch(input,init={}){
  try{
    const req=input instanceof Request?input:null;
    const url=new URL(req?req.url:input,location.href);
    if(url.origin===location.origin&&url.pathname.startsWith('/api/')&&token){
      const h=new Headers(req?req.headers:undefined);
      new Headers(init.headers||{}).forEach((v,k)=>h.set(k,v));
      if(!h.has('Authorization'))h.set('Authorization','Bearer '+token);
      if(req)return rawFetch(new Request(req,{...init,headers:h}));
      return rawFetch(input,{...init,headers:h});
    }
  }catch{}
  return rawFetch(input,init);
}
window.fetch=apiFetch;

async function verify(k){
  const r=await rawFetch('/api/whoami',{cache:'no-store',headers:{Authorization:'Bearer '+k}});
  let j=null;try{j=await r.json()}catch{}
  const u=j?.user||j||null;
  if(!r.ok||!u||String(u.role||'').toLowerCase()!=='admin'||u.scope!=='all_sections')throw new Error('Chave administrativa inválida.');
  return u;
}
function remember(k,u){
  token=k;authUser=u;
  sessionStorage.setItem('ce_admin_token',k);
  sessionStorage.setItem('ce_team_token',k);
  window.__CE_TEAM_TOKEN=k;
}
function clearAuth(){
  token='';authUser=null;
  sessionStorage.removeItem('ce_admin_token');
  sessionStorage.removeItem('ce_team_token');
  sessionStorage.removeItem('ce232_selected_section');
}
function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function selectedByThisFlow(){
  const q=new URLSearchParams(location.search);
  return q.get('ui')==='232'&&q.get('selected')==='1'&&/^\d{1,3}$/.test(q.get('section')||'');
}
function stripStaleSelection(){
  if(selectedByThisFlow())return;
  const u=new URL(location.href);
  for(const k of ['section','secao','place','local','selected'])u.searchParams.delete(k);
  if(u.href!==location.href)history.replaceState({},'',u.pathname+(u.search?u.search:''));
}
async function loadPlaces(){
  if(placeRows)return placeRows;
  try{
    const r=await rawFetch('/data/locais-colmeia.json',{cache:'force-cache'});
    const j=r.ok?await r.json():[];
    const list=Array.isArray(j)?j:(j.locais||j.places||j.items||[]);
    const out=[];
    for(const p of list){
      const place=String(p?.nome||p?.name||p?.local||p?.titulo||p?.title||p?.id||'').trim();
      const secs=Array.isArray(p?.secoes)?p.secoes:Array.isArray(p?.sections)?p.sections:[];
      for(const s of secs){
        const n=Number(typeof s==='object'?(s.numero??s.section??s.secao):s);
        if(Number.isFinite(n))out.push({section:n,place});
      }
    }
    placeRows=out;
  }catch{placeRows=[]}
  return placeRows;
}
function sections(){
  return [...new Set((Array.isArray(authUser?.sections)?authUser.sections:[]).map(Number).filter(Number.isFinite))].sort((a,b)=>a-b);
}
function removeGate(){document.getElementById('ce232AuthGate')?.remove()}
function showAuth(message=''){
  document.documentElement.classList.add('ce232-auth-pending');
  removeGate();
  const wrap=document.createElement('div');wrap.id='ce232AuthGate';wrap.className='ce232-auth-gate';
  wrap.innerHTML='<section class="ce232-login" role="dialog" aria-modal="true" aria-labelledby="ce232LoginTitle"><div class="ce232-lock">🔒</div><div><div class="ce232-kicker">ÁREA RESTRITA</div><h1 id="ce232LoginTitle">Área Operacional</h1><p>Informe a <b>chave administrativa</b> para registrar boletins de urna.</p></div><form><label for="ce232Key">Chave administrativa</label><div class="ce232-key-row"><input id="ce232Key" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Digite a chave"><button type="button" data-eye>Mostrar</button></div><p class="ce232-error" aria-live="polite">'+esc(message)+'</p><button class="ce232-primary" type="submit">Entrar</button><a class="ce232-back" href="/">Voltar aos resultados públicos</a></form></section>';
  document.body.appendChild(wrap);
  const input=wrap.querySelector('#ce232Key'),err=wrap.querySelector('.ce232-error'),submit=wrap.querySelector('.ce232-primary'),eye=wrap.querySelector('[data-eye]');
  eye.onclick=()=>{const show=input.type==='password';input.type=show?'text':'password';eye.textContent=show?'Ocultar':'Mostrar'};
  wrap.querySelector('form').onsubmit=async e=>{
    e.preventDefault();const k=String(input.value||'').trim();
    if(!k){err.textContent='Informe a chave administrativa.';input.focus();return}
    submit.disabled=true;submit.textContent='Validando…';err.textContent='';
    try{
      const u=await verify(k);remember(k,u);stripStaleSelection();removeGate();
      document.documentElement.classList.remove('ce232-auth-pending');
      await showSectionHub();
    }catch(ex){
      clearAuth();err.textContent=ex?.message||'Não foi possível validar a chave.';submit.disabled=false;submit.textContent='Entrar';input.select();
    }
  };
  setTimeout(()=>input.focus(),60);
}
async function showSectionHub(){
  document.getElementById('ce232SectionHub')?.remove();
  const rows=await loadPlaces();
  const by=new Map(rows.map(x=>[Number(x.section),x]));
  const nums=sections();
  const hub=document.createElement('div');hub.id='ce232SectionHub';hub.className='ce232-section-hub';
  hub.innerHTML='<section class="ce232-section-panel" role="dialog" aria-modal="true" aria-labelledby="ce232SectionTitle"><header><div><div class="ce232-kicker">REGISTRO DE BU</div><h2 id="ce232SectionTitle">Escolha a seção</h2><p>A chave administrativa não está vinculada a nenhuma escola. Selecione a seção que você vai lançar.</p></div><button type="button" class="ce232-exit" title="Sair">Sair</button></header><div class="ce232-section-tools"><input type="search" inputmode="numeric" placeholder="Buscar seção ou local de votação" aria-label="Buscar seção ou local"><span>'+nums.length+' seções</span></div><div class="ce232-section-grid"></div><p class="ce232-section-empty" hidden>Nenhuma seção encontrada.</p></section>';
  const grid=hub.querySelector('.ce232-section-grid');
  for(const n of nums){
    const meta=by.get(n)||{};
    const b=document.createElement('button');b.type='button';b.className='ce232-section-card';
    b.dataset.section=String(n);b.dataset.search=('seção '+n+' '+(meta.place||'')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    b.innerHTML='<span class="ce232-section-number">Seção <b>'+String(n).padStart(2,'0')+'</b></span><span class="ce232-section-place">'+esc(meta.place||'Local de votação')+'</span><span class="ce232-section-action">Lançar BU ›</span>';
    b.onclick=()=>chooseSection(n);
    grid.appendChild(b);
  }
  const search=hub.querySelector('input[type="search"]'),empty=hub.querySelector('.ce232-section-empty');
  search.oninput=()=>{
    const q=String(search.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    let visible=0;
    grid.querySelectorAll('.ce232-section-card').forEach(b=>{const ok=!q||b.dataset.search.includes(q)||b.dataset.section===q;b.hidden=!ok;if(ok)visible++});
    empty.hidden=visible!==0;
  };
  hub.querySelector('.ce232-exit').onclick=()=>{clearAuth();location.href='/'};
  document.body.appendChild(hub);
  requestAnimationFrame(()=>search.focus());
}
function chooseSection(n){
  sessionStorage.setItem('ce232_selected_section',String(n));
  const u=new URL('/operacao.html',location.origin);
  u.searchParams.set('from','team');
  u.searchParams.set('ui','232');
  u.searchParams.set('selected','1');
  u.searchParams.set('section',String(n));
  location.href=u.pathname+u.search;
}
function addSwitcher(n){
  if(document.getElementById('ce232Switcher'))return;
  const b=document.createElement('button');b.id='ce232Switcher';b.type='button';b.className='ce232-switcher';
  b.innerHTML='<span>Seção <b>'+esc(n)+'</b></span><small>Trocar seção</small>';
  b.onclick=()=>{try{window.stopQrScanner?.()}catch{};const u=new URL(location.href);u.searchParams.delete('section');u.searchParams.delete('selected');history.replaceState({},'',u.pathname+'?from=team&ui=232');showSectionHub()};
  document.body.appendChild(b);
}
function applySelectedSection(n){
  const wanted=String(n);
  const setSelects=()=>{
    for(const sel of document.querySelectorAll('select')){
      const meta=(sel.id+' '+sel.name+' '+(sel.getAttribute('aria-label')||'')+' '+(sel.closest('label')?.textContent||'')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      const opt=[...sel.options].find(o=>String(o.value)===wanted||new RegExp('(?:^|\\D)'+wanted+'(?:\\D|$)').test(String(o.textContent||'')));
      if(opt&&(/secao|section/.test(meta)||sel.options.length>=20)){
        if(sel.value!==opt.value){sel.value=opt.value;sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}))}
      }
    }
  };
  [0,120,420,900].forEach(ms=>setTimeout(setSelects,ms));
}
async function boot(){
  if(!document.body)return;
  if(token){
    try{
      const u=await verify(token);remember(token,u);removeGate();document.documentElement.classList.remove('ce232-auth-pending');
      if(selectedByThisFlow()){
        const n=new URLSearchParams(location.search).get('section');
        addSwitcher(n);applySelectedSection(n);
      }else{
        stripStaleSelection();await showSectionHub();
      }
      return;
    }catch{clearAuth()}
  }
  showAuth();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();