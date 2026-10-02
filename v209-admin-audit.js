(()=>{'use strict';
if(!['/admin/','/admin/index.html'].includes(location.pathname))return;
const q=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x])),fmt=n=>new Intl.NumberFormat('pt-BR').format(n||0);
const labels={valido:'Válido',valido_legenda:'Válido (legenda)',anulado:'Anulado',anulado_sub_judice:'Anulado sub judice',nao_informada:'Sem destinação confirmada'};
const cargos={presidente:'Presidente',governador:'Governador',senador:'Senador',depFederal:'Dep. federal',depEstadual:'Dep. estadual'};
let audit=null,active='all';
function token(){return sessionStorage.getItem('ce_admin_token')||''}
function mount(){
 if(q('#ce209Audit'))return;
 const box=document.createElement('section');box.id='ce209Audit';box.className='ce209-audit';
 box.innerHTML='<div class="ce209-head"><div><small>DADOS OFICIAIS · TSE</small><h2>Auditoria das candidaturas 2026</h2><p>Situação judicial e destinação dos votos são campos distintos. Dados brutos dos BUs não são alterados.</p></div><div class="ce209-actions"><button type="button" id="ce209Load">Conferir</button><button type="button" id="ce209Refresh">Sincronizar TSE</button></div></div><div id="ce209Status" role="status">Aguardando consulta…</div><div id="ce209Totals" class="ce209-totals"></div><div class="ce209-controls"><label>Filtrar <select id="ce209Filter"><option value="all">Todas as candidaturas</option><option value="valido">Válido</option><option value="valido_legenda">Válido (legenda)</option><option value="anulado">Anulado</option><option value="anulado_sub_judice">Anulado sub judice</option><option value="nao_informada">Sem destinação confirmada</option><option value="judicial">Judicialmente pendentes</option><option value="substituida">Substituídas</option></select></label><label>Buscar <input id="ce209Search" type="search" placeholder="Nome, número, cargo"></label></div><div id="ce209Rows" class="ce209-rows"></div><p class="ce209-foot">A classificação acima é baseada exclusivamente no campo de destinação do TSE. Não determina, por inferência, que um candidato com processo pendente já terá os votos anulados. Somente os arquivos oficiais de resultados definirão a totalização divulgada.</p>';
 const host=q('#ce208Analytics')||q('.ce176-integrity')||q('main')||document.body;
 host.insertAdjacentElement?.('afterend',box) || document.body.appendChild(box);
 q('#ce209Load').onclick=load;
 q('#ce209Refresh').onclick=refresh;
 q('#ce209Filter').onchange=e=>{active=e.target.value;render()};
 q('#ce209Search').oninput=render;
}
function render(){
 if(!audit)return;
 const t=audit.totals||{},counts=audit.counts||{},rows=audit.rows||[];
 q('#ce209Totals').innerHTML=[
  ['Candidaturas',audit.total],['Destino válido',t.valido],['Válido legenda',t.valido_legenda],
  ['Anulado',t.anulado],['Anulado sub judice',t.anulado_sub_judice],['A confirmar',t.nao_informada],
  ['Situação judicial pendente',audit.judicialPending]
 ].map(([title,n])=>'<article><span>'+title+'</span><b>'+fmt(n)+'</b></article>').join('');
 const needle=(q('#ce209Search')?.value||'').trim().toLocaleLowerCase('pt-BR');
 const selected=rows.filter(c=>{
   if(active==='judicial'&&!c.judicialPending)return false;
   if(active==='substituida'&&!c.substituido)return false;
   if(!['all','judicial','substituida'].includes(active)&&c.destino!==active)return false;
   return !needle||(c.nome+' '+c.numero+' '+(cargos[c.cargo]||c.cargo)).toLocaleLowerCase('pt-BR').includes(needle);
 });
 q('#ce209Rows').innerHTML='<div class="ce209-count">'+selected.length+' de '+rows.length+' candidaturas</div>'+
 selected.slice(0,400).map(c=>'<article class="ce209-row"><div><b>'+esc(c.nome)+'</b><small>'+esc(cargos[c.cargo]||c.cargo)+' · '+esc(c.numero)+' · '+esc(c.partido)+'</small><small>Situação: '+esc(c.situacao||'Não informada')+(c.substituido?' · Substituída':'')+'</small></div><span data-kind="'+esc(c.destino)+'">'+esc(labels[c.destino]||'A confirmar')+'</span></article>').join('')+
 (selected.length>400?'<p>Exibindo 400 candidaturas. Use os filtros.</p>':'');
}
async function load(){
 mount();
 const auth=token();
 if(!auth){q('#ce209Status').textContent='Acesse como administrador para consultar.';return}
 q('#ce209Status').textContent='Carregando auditoria…';
 try{
  const r=await fetch('/api/admin/candidate-audit',{cache:'no-store',headers:{Authorization:'Bearer '+auth}});
  const j=await r.json().catch(()=>null);
  if(!r.ok)throw new Error(j?.error||'HTTP '+r.status);
  audit=j;
  const when=j.generatedAt?new Date(j.generatedAt).toLocaleString('pt-BR'):'não registrada';
  q('#ce209Status').textContent='Último catálogo oficial importado: '+when+' · Origem: Portal de Dados Abertos do TSE · '+(j.missingComplement||0)+' sem registro complementar encontrado';
  render();
 }catch{q('#ce209Status').textContent='Não foi possível consultar a auditoria. O catálogo anterior permanece preservado.'}
}
async function refresh(){
 const t=token();if(!t){await load();return}
 const btn=q('#ce209Refresh');btn.disabled=true;q('#ce209Status').textContent='Importando arquivo oficial e conferindo situações…';
 try{
  const r=await fetch('/api/admin/candidates/refresh',{method:'POST',cache:'no-store',headers:{Authorization:'Bearer '+t,'content-type':'application/json'},body:'{}'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  await load();
 }catch{q('#ce209Status').textContent='A atualização falhou ou excedeu o limite de consultas. O último catálogo íntegro foi preservado.'}
 finally{btn.disabled=false}
}
function start(){mount();load();window.addEventListener('pageshow',()=>{if(token())load()});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&token())load()})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();