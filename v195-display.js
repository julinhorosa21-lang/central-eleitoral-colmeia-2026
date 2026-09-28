(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;

const EXPECTED=29;
const CARGOS=[
  ['presidente','Presidente'],
  ['governador','Governador'],
  ['senador','Senador'],
  ['depFederal','Deputado Federal'],
  ['depEstadual','Deputado Estadual']
];
let tvTimer=null,tvPaused=false,latestSnapshot=null;
const fmt=n=>new Intl.NumberFormat('pt-BR').format(Number(n||0));
const esc=v=>String(v??'').replace(/[&<>"]/g,m=>m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':'&quot;');
const cargoLabel=k=>CARGOS.find(x=>x[0]===k)?.[1]||k;

function isTest(){
  return document.documentElement.classList.contains('ce187-pre-election')||
         !!document.getElementById('ce187TestNotice');
}
function activeCargo(){
  return document.querySelector('#cargoTabs button.active[data-cargo]')?.dataset.cargo||CARGOS[0][0];
}
function cargoDone(){
  const raw=document.getElementById('cargoProgressText')?.textContent||document.getElementById('cargoProgressLabel')?.textContent||'';
  const m=String(raw).match(/(\d+)\s*(?:de|\/)?\s*29/i);
  return Math.min(EXPECTED,m?Number(m[1]):Number(String(raw).match(/\d+/)?.[0]||0));
}
function updated(){
  const p=document.getElementById('publicUpdated')?.textContent?.trim();
  if(p&&p!=='Aguardando dados')return p;
  return latestSnapshot?.updatedAt?new Date(latestSnapshot.updatedAt).toLocaleString('pt-BR'):'Aguardando dados';
}
function tvStatus(){
  const bar=document.getElementById('ce195TvStatus');if(!bar)return;
  const done=cargoDone();
  bar.classList.toggle('complete',done>=EXPECTED);
  bar.innerHTML='<i></i><span>'+esc(cargoLabel(activeCargo()))+' · '+done+'/'+EXPECTED+' seções · '+esc(updated())+'</span>';
}
function nextCargo(){
  const tabs=[...document.querySelectorAll('#cargoTabs button[data-cargo]')];
  if(!tabs.length)return;
  let i=tabs.findIndex(b=>b.classList.contains('active'));
  i=(i+1)%tabs.length;
  tabs[i].click();
  setTimeout(()=>{tvStatus();document.getElementById('publicCandidatos')?.scrollIntoView({block:'start'})},100);
}
function startRotation(){
  clearInterval(tvTimer);
  if(tvPaused)return;
  tvTimer=setInterval(()=>{if(!document.hidden)nextCargo()},12000);
}
function togglePause(btn){
  tvPaused=!tvPaused;
  btn.textContent=tvPaused?'Retomar rotação':'Pausar rotação';
  startRotation();
}
async function toggleFullscreen(btn){
  try{
    if(!document.fullscreenElement){await document.documentElement.requestFullscreen?.();btn.textContent='Sair da tela cheia'}
    else{await document.exitFullscreen?.();btn.textContent='Tela cheia'}
  }catch{}
}
function leaveTv(){
  const u=new URL(location.href);u.searchParams.delete('mode');location.href=u.toString();
}
function mountTvBar(){
  if(!document.body.classList.contains('ce195-tv')||document.getElementById('ce195TvBar'))return;
  const bar=document.createElement('div');bar.id='ce195TvBar';bar.className='ce195-tvbar';
  bar.innerHTML='<div class="ce195-tvbrand"><b>Central Eleitoral Colméia 2026</b><span>Modo divulgação · atualização automática</span></div><div id="ce195TvStatus" class="ce195-tvstatus"><i></i><span>Carregando…</span></div><div class="ce195-tvcontrols"><button type="button" data-ce195-pause>Pausar rotação</button><button type="button" data-ce195-next class="primary">Próximo cargo</button><button type="button" data-ce195-full>Tela cheia</button><button type="button" data-ce195-exit>Sair</button></div>';
  document.body.prepend(bar);
  bar.querySelector('[data-ce195-pause]').onclick=e=>togglePause(e.currentTarget);
  bar.querySelector('[data-ce195-next]').onclick=()=>{nextCargo();startRotation()};
  bar.querySelector('[data-ce195-full]').onclick=e=>toggleFullscreen(e.currentTarget);
  bar.querySelector('[data-ce195-exit]').onclick=leaveTv;
  tvStatus();startRotation();
  document.getElementById('cargoTabs')?.addEventListener('click',()=>setTimeout(tvStatus,80),true);
}
function enterTv(){
  const u=new URL(location.href);u.searchParams.set('mode','tv');location.href=u.toString();
}
function mountEntry(){
  if(document.body.classList.contains('ce195-tv')||document.getElementById('ce195Entry'))return;
  const host=document.querySelector('.hero-actions')||document.getElementById('ce191ShareActions')||document.getElementById('publicApuracao');
  if(!host)return;
  const b=document.createElement('button');b.id='ce195Entry';b.type='button';b.className='ce195-entry';b.textContent='Modo divulgação';
  b.onclick=enterTv;
  host.appendChild(b);
}

/* ---------------- Transparência ---------------- */
function parsePayload(v){return v?.payload&&typeof v.payload==='object'?v.payload:v||{}}
function totalsForCargo(snapshot,cargo){
  const results=snapshot?.results||{},sections=new Set();
  let nominal=0,legenda=0,brancos=0,nulos=0,comparecimento=0;
  for(const [key,value] of Object.entries(results)){
    const cut=key.indexOf(':');if(cut<1||key.slice(cut+1)!==cargo)continue;
    const section=Number(key.slice(0,cut));if(Number.isFinite(section))sections.add(section);
    const p=parsePayload(value);
    for(const c of p.candidatos||[])nominal+=Number(c?.votos||0);
    for(const l of p.legendas||[])legenda+=Number(l?.votos||0);
    brancos+=Number(p.brancos||0);nulos+=Number(p.nulos||0);comparecimento+=Number(p.comparecimento||0);
  }
  return{sections:sections.size,nominal,legenda,brancos,nulos,comparecimento};
}
function overall(snapshot){
  const sections=new Set();
  for(const key of Object.keys(snapshot?.results||{})){
    const n=Number(key.split(':')[0]);if(Number.isFinite(n))sections.add(n);
  }
  return{sections:sections.size,records:Object.keys(snapshot?.results||{}).length};
}
function statusHtml(done){
  const cls=done>=EXPECTED?'complete':done>0?'partial':'';
  const label=done>=EXPECTED?'Concluído':done>0?'Parcial':'Aguardando';
  return'<span class="ce195-state '+cls+'">'+label+'</span>';
}
function renderTransparency(snapshot){
  const root=document.getElementById('ce195Transparency');if(!root)return;
  latestSnapshot=snapshot;
  const all=overall(snapshot),rows=CARGOS.map(([k,label])=>({k,label,...totalsForCargo(snapshot,k)}));
  root.querySelector('[data-ce195-meta]').innerHTML=
    '<div><small>Seções recebidas</small><b>'+all.sections+' / '+EXPECTED+'</b></div>'+
    '<div><small>Registros de cargo</small><b>'+fmt(all.records)+'</b></div>'+
    '<div><small>Última atualização</small><b>'+esc(snapshot?.updatedAt?new Date(snapshot.updatedAt).toLocaleString('pt-BR'):'Aguardando dados')+'</b></div>';
  root.querySelector('tbody').innerHTML=rows.map(x=>
    '<tr><td>'+esc(x.label)+'</td><td>'+statusHtml(x.sections)+'</td><td>'+x.sections+'/'+EXPECTED+'</td><td>'+fmt(x.nominal)+'</td><td>'+fmt(x.legenda)+'</td><td>'+fmt(x.brancos)+'</td><td>'+fmt(x.nulos)+'</td><td>'+fmt(x.comparecimento)+'</td></tr>'
  ).join('');
  const test=root.querySelector('[data-ce195-test]');
  if(test)test.hidden=!isTest();
}
async function loadSnapshot(){
  try{
    const r=await fetch('/api/snapshot',{cache:'no-store'});
    if(!r.ok)throw new Error('snapshot');
    const s=await r.json();latestSnapshot=s;renderTransparency(s);tvStatus();return s;
  }catch{return null}
}
function download(content,type,name){
  const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function exportJson(){
  const s=latestSnapshot||await loadSnapshot();if(!s)return;
  download(JSON.stringify(s,null,2),'application/json;charset=utf-8','central-eleitoral-colmeia-resultados.json');
}
function csvCell(v){const s=String(v??'');return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
async function exportCsv(){
  const s=latestSnapshot||await loadSnapshot();if(!s)return;
  const lines=[['seção','cargo','tipo','número','nome','partido','votos','brancos','nulos','comparecimento'].join(';')];
  for(const [key,value] of Object.entries(s.results||{})){
    const cut=key.indexOf(':');if(cut<1)continue;
    const section=key.slice(0,cut),cargo=key.slice(cut+1),p=parsePayload(value);
    const base=[section,cargo];
    const cand=Array.isArray(p.candidatos)?p.candidatos:[];
    if(cand.length){
      for(const c of cand)lines.push([...base,'candidato',c.numero||'',c.nome||'',c.partido||'',Number(c.votos||0),p.brancos||0,p.nulos||0,p.comparecimento||0].map(csvCell).join(';'));
    }else{
      lines.push([...base,'totais','','','',0,p.brancos||0,p.nulos||0,p.comparecimento||0].map(csvCell).join(';'));
    }
  }
  download('\ufeff'+lines.join('\n'),'text/csv;charset=utf-8','central-eleitoral-colmeia-resultados.csv');
}
async function copyPublicLink(){
  const u=new URL(location.origin+'/');u.searchParams.set('v','195');
  try{await navigator.clipboard.writeText(u.toString());const b=document.querySelector('[data-ce195-link]');const old=b.textContent;b.textContent='Link copiado';setTimeout(()=>b.textContent=old,1800)}catch{}
}
function mountTransparency(){
  if(location.pathname!=='/transparencia.html'||document.getElementById('ce195Transparency'))return;
  const anchor=document.getElementById('publicOverview')||document.querySelector('.metrics')||document.querySelector('main .wrap')?.firstElementChild;
  if(!anchor)return;
  const root=document.createElement('section');root.id='ce195Transparency';root.className='ce195-transparency';
  root.innerHTML='<div class="ce195-transparency-head"><div><span class="kicker">TRANSPARÊNCIA DOS DADOS</span><h2>Resumo técnico da apuração</h2><p>Totais derivados do mesmo snapshot público utilizado pela Central. Os números mudam conforme novos boletins são registrados.</p></div><div class="ce195-transparency-actions"><button type="button" data-ce195-csv class="primary">Exportar CSV</button><button type="button" data-ce195-json>Exportar JSON</button><button type="button" data-ce195-link>Copiar link público</button></div></div><div class="ce195-transparency-meta" data-ce195-meta><div><small>Dados</small><b>Carregando…</b></div></div><div class="ce195-cargo-table"><table><thead><tr><th>Cargo</th><th>Status</th><th>Seções</th><th>Nominais</th><th>Legenda</th><th>Brancos</th><th>Nulos</th><th>Comparecimento*</th></tr></thead><tbody></tbody></table></div><p data-ce195-test hidden class="ce195-transparency-note"><b>DADOS DE TESTE · NÃO OFICIAIS.</b></p><p class="ce195-transparency-note">* Comparecimento é apresentado conforme os campos registrados nos boletins. A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.</p>';
  anchor.insertAdjacentElement('afterend',root);
  root.querySelector('[data-ce195-csv]').onclick=exportCsv;
  root.querySelector('[data-ce195-json]').onclick=exportJson;
  root.querySelector('[data-ce195-link]').onclick=copyPublicLink;
  loadSnapshot();
}

function setupTvClass(){
  const tv=new URL(location.href).searchParams.get('mode')==='tv';
  document.body.classList.toggle('ce195-tv',tv);
}
function start(){
  setupTvClass();
  mountEntry();
  mountTransparency();
  mountTvBar();
  if(document.body.classList.contains('ce195-tv'))loadSnapshot();
  window.addEventListener('pageshow',()=>{mountEntry();mountTvBar();if(location.pathname==='/transparencia.html')loadSnapshot()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();