(()=>{'use strict';
const PAGES=new Set(['/','/index.html','/transparencia.html']);
if(!PAGES.has(location.pathname))return;
const LABELS={presidente:'Presidente',governador:'Governador',senador:'Senador',depFederal:'Deputado federal',depEstadual:'Deputado estadual'};
const fmt=n=>new Intl.NumberFormat('pt-BR').format(Number(n||0));
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
let data=null,selected='presidente',lastId='';
function mount(){
 let box=document.getElementById('ce210Official');
 if(box)return box;
 const ref=document.getElementById('publicApuracao')||document.getElementById('leaders');
 if(!ref)return null;
 box=document.createElement('section');box.id='ce210Official';box.className='ce210-official';
 box.innerHTML='<div class="ce210-header"><div><small>TOTALIZAÇÃO PUBLICADA PELO TSE</small><h2>Resultados oficiais de Colméia</h2><p>Apurados pela Justiça Eleitoral e separados da leitura local dos BUs.</p></div><span id="ce210Updated">Aguardando dados oficiais</span></div><div class="ce210-tabs" id="ce210Tabs"></div><div id="ce210Body"></div><p class="ce210-disclaimer">Fonte: arquivos oficiais EA20 disponibilizados pelo TSE. Os votos consignados podem incluir votos anulados ou sub judice conforme a situação publicada pelo Tribunal. A Central é independente da Justiça Eleitoral.</p>';
 box.hidden=true;
 ref.insertAdjacentElement('beforebegin',box);
 return box;
}
function current(){
 if(data?.cargos?.[selected])return data.cargos[selected];
 const first=Object.keys(data?.cargos||{})[0];
 if(first){selected=first;return data.cargos[first]}
 return null;
}
function render(){
 const box=mount(),now=current();if(!box||!now)return;
 box.hidden=false;
 const keys=Object.keys(data.cargos||{}),tabs=box.querySelector('#ce210Tabs');
 tabs.innerHTML=keys.map(k=>'<button type="button" data-cargo="'+k+'" class="'+(k===selected?'active':'')+'">'+(LABELS[k]||k)+'</button>').join('');
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.cargo;render()});
 const status=now.andamento==='f'?'Totalização final':now.andamento==='p'?'Totalização parcial':'Aguardando totalização';
 const generated=now.generatedAt?new Date(now.generatedAt).toLocaleString('pt-BR'):'sem horário publicado';
 box.querySelector('#ce210Updated').textContent=status+' · '+generated;
 const rows=[...(now.candidates||[])].sort((a,b)=>b.votos-a.votos||Number(a.numero)-Number(b.numero));
 box.querySelector('#ce210Body').innerHTML=
  '<div class="ce210-metrics">'+[
   ['Seções totalizadas',fmt(now.sections.totalizadas)+' / '+fmt(now.sections.total)],
   ['Votos válidos',fmt(now.votos.validos)],
   ['Anulados',fmt(now.votos.anulados)],
   ['Anulados sub judice',fmt(now.votos.anuladosSubJudice)],
   ['Brancos',fmt(now.votos.brancos)],
   ['Nulos',fmt(now.votos.nulos)],
   ['Nulos técnicos',fmt(now.votos.nulosTecnicos)]
  ].map(([k,v])=>'<div><small>'+k+'</small><strong>'+v+'</strong></div>').join('')+'</div>'+
  '<div class="ce210-candidates">'+rows.map(c=>'<div class="ce210-candidate"><div><b>'+escapeHtml(c.nome)+'</b><small>'+escapeHtml(c.numero)+' · '+escapeHtml(c.partido)+'</small><small>'+escapeHtml(c.destinacao||'Destinação ainda não publicada')+'</small></div><div class="ce210-votes"><b>'+fmt(c.votos)+'</b><small>'+(Number.isFinite(c.percentual)?Number(c.percentual).toLocaleString('pt-BR',{maximumFractionDigits:2})+'%':'—')+'</small></div></div>').join('')+'</div>';
}
async function load(){
 try{
  const r=await fetch('/api/official/ea20',{cache:'no-store'});
  if(!r.ok)return;
  const j=await r.json();
  if(!j?.available||!Object.keys(j.cargos||{}).length)return;
  const id=JSON.stringify(Object.entries(j.cargos).map(([k,v])=>[k,v.idg]));
  if(id===lastId)return;
  data=j;lastId=id;render();
 }catch{}
}
function start(){
 mount();
 load();
 setInterval(()=>{if(!document.hidden)load()},45000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();