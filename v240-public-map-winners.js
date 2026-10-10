(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;

const CARGOS=['presidente','governador'];
const LABEL={presidente:'Presidente',governador:'Governador'};
let data=null,map=null,markers=[];

function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function photo(cargo,numero){return '/candidate-photos/2t-'+cargo+'-'+String(numero||'').replace(/\D/g,'')+'.jpg'}
function loadCss(url){if([...document.styleSheets].some(s=>s.href===url))return;const l=document.createElement('link');l.rel='stylesheet';l.href=url;document.head.appendChild(l)}
function loadScript(url){return new Promise((resolve,reject)=>{if(window.L)return resolve();const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}

function winnerHtml(cargo,w){
  if(!w?.complete)return '<div class="ce240-wait"><b>'+LABEL[cargo]+'</b><span>Aguardando todas as seções deste local</span></div>';
  if(w.tie)return '<div class="ce240-wait"><b>'+LABEL[cargo]+'</b><span>Empate no local</span></div>';
  if(!w.winner)return '<div class="ce240-wait"><b>'+LABEL[cargo]+'</b><span>Sem votos válidos registrados</span></div>';
  const x=w.winner;
  return '<div class="ce240-winner"><img src="'+photo(cargo,x.numero)+'" alt="Foto de '+esc(x.nome||('candidato '+x.numero))+'"><div><small>Vencedor · '+LABEL[cargo]+'</small><b>'+esc(x.nome||('Nº '+x.numero))+'</b><span>'+esc(x.partido||'')+(x.numero?' · '+esc(x.numero):'')+' · '+Number(x.votos||0).toLocaleString('pt-BR')+' votos</span></div></div>';
}
function placeCard(p){
  const secs=(p.sections||[]).join(', ');
  return '<article class="ce240-place-card" data-place="'+esc(p.id)+'"><header><div><small>LOCAL DE VOTAÇÃO</small><h3>'+esc(p.name)+'</h3><p>Seções '+esc(secs)+'</p></div><span class="ce240-place-state '+(p.complete?'complete':'')+'">'+(p.complete?'Concluído':(p.completedSections+'/'+p.expectedSections))+'</span></header><div class="ce240-place-winners">'+winnerHtml('presidente',p.cargos?.presidente)+winnerHtml('governador',p.cargos?.governador)+'</div></article>';
}
function popupHtml(p){
  return '<div class="ce240-popup"><b>'+esc(p.name)+'</b><small>Seções '+esc((p.sections||[]).join(', '))+'</small>'+winnerHtml('presidente',p.cargos?.presidente)+winnerHtml('governador',p.cargos?.governador)+'</div>';
}
function mountShell(){
  if(document.getElementById('ce240PublicMap'))return;
  const anchor=document.getElementById('publicLocais')||document.getElementById('places')?.closest('section')||document.getElementById('publicCandidatos');
  if(!anchor)return;
  const sec=document.createElement('section');
  sec.id='ce240PublicMap';sec.className='ce240-map-section';
  sec.innerHTML='<div class="ce240-map-head"><div><small>MAPA ELEITORAL</small><h2>Colméia · locais e seções</h2><p>Toque em um ponto para ver as seções e, após a conclusão do local, quem venceu para Presidente e Governador.</p></div><span>2º turno</span></div><div id="ce240Map" class="ce240-map" aria-label="Mapa dos locais de votação de Colméia"></div><div id="ce240PlaceCards" class="ce240-place-cards"></div>';
  anchor.insertAdjacentElement('beforebegin',sec);
}
async function loadData(){
  const r=await fetch('/api/public/place-winners',{cache:'no-store'});
  if(!r.ok)throw new Error('place_winners_unavailable');
  return r.json();
}
async function drawMap(){
  if(!data?.places?.length)return;
  const points=data.places.filter(p=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng)));
  const cards=document.getElementById('ce240PlaceCards');
  if(cards)cards.innerHTML=data.places.map(placeCard).join('');
  if(!points.length){
    document.getElementById('ce240Map')?.classList.add('ce240-map-empty');
    const el=document.getElementById('ce240Map');if(el)el.textContent='As coordenadas dos locais não estão disponíveis para o mapa.';
    return;
  }
  loadCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
  await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
  const root=document.getElementById('ce240Map');if(!root||!window.L)return;
  if(map){map.remove();map=null}
  map=L.map(root,{scrollWheelZoom:false,zoomControl:true});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
  const bounds=[];
  markers=[];
  for(const p of points){
    const marker=L.marker([Number(p.lat),Number(p.lng)]).addTo(map).bindPopup(popupHtml(p),{maxWidth:330});
    markers.push(marker);bounds.push([Number(p.lat),Number(p.lng)]);
  }
  if(bounds.length===1)map.setView(bounds[0],15);else map.fitBounds(bounds,{padding:[24,24]});
  setTimeout(()=>map.invalidateSize(),100);
}
async function refresh(){
  try{data=await loadData();await drawMap()}catch(e){console.error('CE240 map',e)}
}
function start(){
  mountShell();refresh();
  const es=(()=>{try{return new EventSource('/api/events')}catch{return null}})();
  es?.addEventListener('update',()=>setTimeout(refresh,300));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();