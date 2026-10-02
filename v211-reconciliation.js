(()=>{'use strict';
if(!location.pathname.startsWith('/admin/'))return;
const TITLES={presidente:'Presidente',governador:'Governador',senador:'Senador',depFederal:'Deputado federal',depEstadual:'Deputado estadual'};
const STATUS={divergente:'Divergência',conferido:'Conferido',sem_bu_local:'TSE recebido · sem BU local',aguardando_tse:'Aguardando arquivo oficial',aguardando_decodificacao:'Arquivo recebido · aguardando leitura',nao_comparavel:'Verificação técnica pendente',aguardando_ambos:'Aguardando ambos'};
const fmt=n=>new Intl.NumberFormat('pt-BR').format(Number(n||0));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let report=null,busy=false;
const root=()=>document.getElementById('ce211Reconciliation');
const token=()=>sessionStorage.getItem('ce_admin_token')||'';
function mount(){
 let el=root();if(el)return el;
 el=document.createElement('article');el.id='ce211Reconciliation';el.className='ce211-card';
 el.innerHTML='<div class="ce211-head"><div><small>CONFERÊNCIA AUTOMÁTICA · TSE</small><h2>Central de divergências dos BUs</h2><p>Compara votos por seção e cargo quando ambos os arquivos estão disponíveis e podem ser interpretados.</p></div><div class="ce211-buttons"><button type="button" id="ce211Reload">Atualizar</button><button type="button" id="ce211Export">Exportar CSV</button></div></div>'+
 '<div id="ce211Message" role="status">Aguardando informações…</div>'+
 '<div class="ce211-stats" id="ce211Stats"></div>'+
 '<div class="ce211-filters"><label>Exibir<select id="ce211Filter"><option value="all">Todos os estados</option><option value="divergente">Somente divergências</option><option value="conferido">Conferidos</option><option value="sem_bu_local">Só arquivo oficial</option><option value="aguardando_tse">Aguardando TSE</option><option value="aguardando_decodificacao">Aguardando leitura do arquivo</option><option value="nao_comparavel">Verificação técnica pendente</option><option value="aguardando_ambos">Sem BUs</option></select></label><label>Buscar seção<input id="ce211Search" type="search" inputmode="numeric" placeholder="Número da seção"></label></div>'+
 '<div id="ce211Items" class="ce211-items"></div>'+
 '<p class="ce211-note">Uma diferença só aparece como divergência quando os votos locais e o arquivo oficial estão disponíveis e são comparáveis. Ausência, indisponibilidade ou formato ainda não interpretado nunca são tratados como erro de votação. Nenhum BU é alterado por este painel.</p>';
 const anchor=document.getElementById('ce176Integrity')||document.getElementById('ce209Audit')||document.querySelector('#secoes')||document.querySelector('main');
 if(anchor)anchor.insertAdjacentElement('afterend',el);else document.body.appendChild(el);
 el.querySelector('#ce211Reload').addEventListener('click',load);
 el.querySelector('#ce211Export').addEventListener('click',exportCsv);
 el.querySelector('#ce211Filter').addEventListener('change',render);
 el.querySelector('#ce211Search').addEventListener('input',render);
 return el;
}
function fieldText(d){
 if(typeof d==='string')return d;
 if(d==null)return '';
 if(typeof d==='number'||typeof d==='boolean')return String(d);
 if(Array.isArray(d))return d.map(fieldText).join(' | ');
 return JSON.stringify(d);
}
function detail(item){
 if(item.state==='divergente'){
   const info=item.differences||[];
   const rows=info.length?info.map(d=>'<li>'+esc(fieldText(d))+'</li>').join(''):'<li>Consulte os registros para detalhes da diferença.</li>';
   return '<div class="ce211-difference"><b>Diferenças calculadas</b><ul>'+rows+'</ul>'+(item.summary?'<pre>'+esc(fieldText(item.summary))+'</pre>':'')+'</div>';
 }
 if(item.state==='conferido')return '<p>Os votos comparáveis deste cargo correspondem ao documento oficial decodificado.</p>';
 if(item.state==='aguardando_decodificacao')return '<p>Há arquivo oficial recebido, mas os dados ainda não estão disponíveis para uma comparação confiável.</p>';
 if(item.state==='nao_comparavel')return '<p>Os dois registros existem, porém falta um formato compatível para conferir os valores. Não foi possível determinar se há divergência.</p>';
 if(item.state==='sem_bu_local')return '<p>O arquivo do TSE chegou; aguarda-se o registro do operador para comparação.</p>';
 if(item.state==='aguardando_tse')return '<p>O BU local está salvo e a conferência aguarda os dados estruturados da Justiça Eleitoral.</p>';
 return '<p>Aguardando o BU local e o arquivo oficial.</p>';
}
function render(){
 const el=root();if(!el||!report)return;
 const s=report.summary||{};
 el.querySelector('#ce211Stats').innerHTML=[
 ['Divergências',s.divergente,'divergente'],['Conferidos',s.conferido,'conferido'],
 ['Aguardando TSE',s.aguardando_tse,'aguardando_tse'],['Arquivo sem leitura',s.aguardando_decodificacao,'aguardando_decodificacao'],
 ['Só TSE',s.sem_bu_local,'sem_bu_local'],['Verificação pendente',s.nao_comparavel,'nao_comparavel']
 ].map(([title,n,key])=>'<button type="button" data-state="'+key+'"><span>'+title+'</span><strong>'+fmt(n)+'</strong></button>').join('');
 el.querySelectorAll('#ce211Stats button').forEach(btn=>btn.onclick=()=>{el.querySelector('#ce211Filter').value=btn.dataset.state;render()});
 const filter=el.querySelector('#ce211Filter').value,term=el.querySelector('#ce211Search').value.trim();
 const priority=['divergente','nao_comparavel','aguardando_decodificacao','aguardando_tse','sem_bu_local','conferido','aguardando_ambos'];
 const items=(report.items||[]).filter(x=>(filter==='all'||filter===x.state)&&(!term||String(x.section).includes(term)))
 .sort((a,b)=>priority.indexOf(a.state)-priority.indexOf(b.state)||a.section-b.section||Object.keys(TITLES).indexOf(a.cargo)-Object.keys(TITLES).indexOf(b.cargo));
 const frag=document.createDocumentFragment();
 for(const x of items){
  const node=document.createElement('details');node.className='ce211-row';node.dataset.state=x.state;
  node.innerHTML='<summary><span class="ce211-label"><b>Seção '+esc(String(x.section).padStart(2,'0'))+' · '+esc(TITLES[x.cargo]||x.cargo)+'</b><small>'+esc(x.placeName)+'</small></span><span class="ce211-pill">'+esc(STATUS[x.state]||x.state)+'</span></summary><div class="ce211-content">'+detail(x)+(x.updatedAt?'<small>Registro atualizado: '+esc(new Date(x.updatedAt).toLocaleString('pt-BR'))+'</small>':'')+'</div>';
  frag.appendChild(node);
 }
 const out=el.querySelector('#ce211Items');out.replaceChildren(frag);
 if(!items.length){const p=document.createElement('p');p.className='ce211-empty';p.textContent='Nenhuma seção corresponde ao filtro escolhido.';out.append(p)}
}
function cell(x){let v=String(x??'');if(/^[=+@\-]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'}
function exportCsv(){
 if(!report)return;const heads=['Seção','Local','Cargo','Status','BU local','Arquivo TSE','Resumo'];
 const lines=[heads.map(cell).join(';'),...(report.items||[]).map(i=>[i.section,i.placeName,TITLES[i.cargo]||i.cargo,STATUS[i.state]||i.state,i.localAvailable?'sim':'não',i.officialAvailable?'sim':'não',fieldText(i.summary)].map(cell).join(';'))];
 const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
 const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='auditoria-bus-colmeia.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),2000);
}
async function load(){
 const el=mount(),key=token();if(!key){el.querySelector('#ce211Message').textContent='Entre na coordenação para visualizar as conferências.';return}
 if(busy)return;busy=true;
 el.querySelector('#ce211Reload').disabled=true;
 try{
  const r=await fetch('/api/admin/reconciliation',{cache:'no-store',headers:{Authorization:'Bearer '+key}});
  const j=await r.json().catch(()=>null);
  if(!r.ok||!j?.ok)throw new Error('HTTP '+r.status);
  report=j;
  el.querySelector('#ce211Message').textContent='Última conferência: '+new Date(j.generatedAt).toLocaleTimeString('pt-BR')+' · '+fmt(j.summary?.secoesComDivergencia)+' seção(ões) com diferenças confirmadas';
  render();
 }catch{el.querySelector('#ce211Message').textContent='Não foi possível buscar a conferência agora. Os registros oficiais e locais não foram alterados.'}
 finally{busy=false;el.querySelector('#ce211Reload').disabled=false}
}
function start(){mount();load();setTimeout(mount,500);setInterval(()=>{if(!document.hidden&&token())load()},15000);window.addEventListener('pageshow',()=>{if(token())load()})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();