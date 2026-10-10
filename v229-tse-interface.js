(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;
let queued=false;

function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function rowNumber(row){
  return String(
    row.querySelector('.public-number-badge')?.textContent||
    row.dataset.ce161Number||
    row.querySelector('.num')?.textContent||''
  ).match(/\d{1,5}/)?.[0]||'';
}

function header(){
  const bar=document.getElementById('ce200AppBar');
  if(!bar)return;
  if(bar.dataset.ce229==='1')return;
  bar.dataset.ce229='1';
  bar.innerHTML=
    '<div class="ce229-election-copy"><strong>Eleições 2026</strong><span>Geral ordinária · acompanhamento local</span></div>'+
    '<div class="ce229-round"><small>Turno</small><b>2º</b></div>';

  if(!document.getElementById('ce229Placebar')){
    const p=document.createElement('div');
    p.id='ce229Placebar';
    p.className='ce229-placebar';
    p.innerHTML='<span class="ce229-pin" aria-hidden="true">●</span><strong>Colméia · Tocantins</strong><span aria-hidden="true">⌄</span>';
    bar.insertAdjacentElement('afterend',p);
  }
}

function summary(){
  if(document.getElementById('ce229Summary'))return;
  const hero=document.querySelector('.hero.public-main-hero,.hero');
  const overview=document.getElementById('publicOverview');
  const anchor=overview||hero;
  if(!anchor)return;
  const s=document.createElement('section');
  s.id='ce229Summary';
  s.className='ce229-summary';
  s.setAttribute('aria-live','polite');
  s.innerHTML=
    '<div class="ce229-summary-head"><b>Dados Gerais</b><span aria-hidden="true">›</span></div>'+
    '<div class="ce229-summary-update">Última atualização <strong data-ce229-updated>Aguardando dados</strong></div>'+
    '<div class="ce229-summary-row"><span>Seções recebidas</span><strong data-ce229-count>0 de 29 seções</strong></div>'+
    '<div class="ce229-progress" role="progressbar" aria-label="Progresso da apuração" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i data-ce229-fill></i><b data-ce229-percent>0%</b></div>'+
    '<div class="ce229-summary-state" data-ce229-state>Aguardando o início da apuração</div>';
  anchor.insertAdjacentElement('afterend',s);
}

function syncSummary(){
  const s=document.getElementById('ce229Summary');
  if(!s)return;
  const percent=String(document.getElementById('publicPercent')?.textContent||'0%').trim();
  const count=String(document.getElementById('publicCount')?.textContent||'0 de 29 seções').trim();
  const updated=String(document.getElementById('publicUpdated')?.textContent||'Aguardando dados').trim();
  const state=String(document.getElementById('publicState')?.textContent||'Aguardando o início da apuração').trim();
  const value=Math.max(0,Math.min(100,Number(percent.replace('%','').replace(',','.'))||0));
  const pct=s.querySelector('[data-ce229-percent]');
  const fill=s.querySelector('[data-ce229-fill]');
  const cnt=s.querySelector('[data-ce229-count]');
  const upd=s.querySelector('[data-ce229-updated]');
  const st=s.querySelector('[data-ce229-state]');
  if(pct&&pct.textContent!==percent)pct.textContent=percent;
  if(fill)fill.style.width=value+'%';
  if(cnt&&cnt.textContent!==count)cnt.textContent=count;
  if(upd&&upd.textContent!==updated)upd.textContent=updated;
  if(st&&st.textContent!==state)st.textContent=state;
  const progress=s.querySelector('.ce229-progress');
  if(progress)progress.setAttribute('aria-valuenow',String(value));
}

function resultSection(){
  const ap=document.getElementById('publicApuracao');
  const cand=document.getElementById('publicCandidatos');
  const h=ap?.querySelector('.section-title h2');
  if(h&&h.textContent!=='Resultados')h.textContent='Resultados';

  if(cand&&!cand.querySelector('.ce229-nominal')){
    const n=document.createElement('div');
    n.className='ce229-nominal';
    n.textContent='NOMINAL';
    const leaders=cand.querySelector('#leaders');
    if(leaders)leaders.insertAdjacentElement('beforebegin',n);
  }

  document.querySelectorAll('#leaders .leader').forEach(row=>{
    row.querySelectorAll('.ce161-rank,.rank-badge,.position-badge,[data-rank-badge]').forEach(x=>x.remove());
    row.removeAttribute('data-ce161-rank');
    const who=row.querySelector('.who');
    if(!who)return;
    if(!who.querySelector('.ce229-round-badge')){
      const b=document.createElement('span');
      b.className='ce229-round-badge';
      b.textContent='2º Turno';
      who.appendChild(b);
    }
    const small=who.querySelector('small');
    const n=rowNumber(row);
    if(small&&n&&!new RegExp('(?:^|\\D)'+n+'(?:\\D|$)').test(small.textContent||'')){
      small.textContent=String(small.textContent||'').trim()+' – '+n;
    }
  });
}

function actions(){
  const refresh=document.getElementById('refreshBtn');
  if(refresh&&refresh.textContent.trim()!=='↻ Atualizar')refresh.textContent='↻ Atualizar';
}

function bottomNav(){
  const nav=document.querySelector('.public-bottom-nav');
  if(!nav||nav.dataset.ce229==='1')return;
  nav.dataset.ce229='1';
  nav.innerHTML=
    '<button type="button" class="active" data-target="publicApuracao"><span aria-hidden="true">▥</span><b>Resultados</b></button>'+
    '<button type="button" data-target="publicLocais"><span aria-hidden="true">⌖</span><b>Seções</b></button>'+
    '<button type="button" data-target="publicCandidatos"><span aria-hidden="true">☷</span><b>Resumo</b></button>'+
    '<button type="button" data-ce229-href="/operacao.html"><span aria-hidden="true">▣</span><b>Registrar BU</b></button>'+
    '<button type="button" data-target="publicSobre"><span aria-hidden="true">i</span><b>Informações</b></button>';
  nav.addEventListener('click',e=>{
    const b=e.target.closest('button');
    if(!b)return;
    nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));
    if(b.dataset.ce229Href)location.href=b.dataset.ce229Href;
  });
}

function cleanup(){
  document.body.classList.add('ce229-tse-inspired');
  const ctx=document.getElementById('ce200Context');
  if(ctx)ctx.setAttribute('aria-hidden','true');
}

function apply(){
  cleanup();
  header();
  summary();
  resultSection();
  actions();
  bottomNav();
  syncSummary();
}

function run(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
}

function start(){
  apply();
  [120,400,1000,2200].forEach(ms=>setTimeout(apply,ms));
  const obs=new MutationObserver(run);
  obs.observe(document.body,{subtree:true,childList:true,characterData:true});
  window.addEventListener('pageshow',apply);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();