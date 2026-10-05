(()=>{'use strict';
const PAGES=new Set(['/','/index.html','/transparencia.html']);
if(!PAGES.has(location.pathname))return;
const ROOT='https://resultados.tse.jus.br/oficial/ele2026';
const MUNICIPIO='95290',UF='to',EXPECTED=29;
const CARGOS={
 presidente:{code:'0001',ele:6257,label:'Presidente'},
 governador:{code:'0003',ele:6259,label:'Governador'},
 senador:{code:'0005',ele:6259,label:'Senador'},
 depFederal:{code:'0006',ele:6259,label:'Deputado Federal'},
 depEstadual:{code:'0007',ele:6259,label:'Deputado Estadual'}
};
let state={available:false,cargos:{},source:'TSE',lastCheck:null,lastError:null};
let loading=false,lastFingerprint='',selected='presidente',paintGuard=false,rerenderTimer=null;
const fmt=n=>new Intl.NumberFormat('pt-BR').format(Number(n||0));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%':'—';
const fileFor=(cargo,cfg)=>ROOT+'/'+cfg.ele+'/dados/'+UF+'/'+UF+MUNICIPIO+'-c'+cfg.code+'-e'+String(cfg.ele).padStart(6,'0')+'-u.json';
function parse(data,cargo,cfg){
 if(!data||Number(data.ele)!==cfg.ele||Number(data.t)!==1||data.f!=='o'||data.dv!=='s')throw new Error('arquivo_nao_oficial');
 if(data.tpabr!=='mu'||String(data.cdabr)!==String(Number(MUNICIPIO)))throw new Error('municipio_incorreto');
 const group=(data.carg||[]).find(x=>Number(x.cd)===Number(cfg.code));if(!group)throw new Error('cargo_ausente');
 const candidates=[];
 for(const ag of group.agr||[])for(const party of ag.par||[])for(const c of party.cand||[]){
   const votos=Number(c.vap||0);if(!Number.isSafeInteger(votos)||votos<0)continue;
   candidates.push({numero:String(c.n??''),sqCandidato:String(c.sqcand??''),nome:String(c.nmu||c.nm||''),partido:String(party.sg||''),destinacao:String(c.dvt||''),situacao:String(c.st||''),votos,percentual:c.pvap==null?null:Number(c.pvap)});
 }
 const safe=n=>{const x=Number(n||0);return Number.isSafeInteger(x)&&x>=0?x:0};
 const s=data.s||{},v=data.v||{};
 let generatedAt=null;const dm=String(data.dg||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/),hm=String(data.hg||'').match(/^(\d{2}):(\d{2}):(\d{2})$/);
 if(dm&&hm){const dt=new Date(dm[3]+'-'+dm[2]+'-'+dm[1]+'T'+hm[1]+':'+hm[2]+':'+hm[3]+'-03:00');if(Number.isFinite(dt.getTime()))generatedAt=dt.toISOString()}
 return {cargo,ele:cfg.ele,municipio:Number(MUNICIPIO),idg:String(data.idg??''),generatedAt,andamento:String(data.and||''),totalizacaoFinal:data.tf==='s',
   sections:{total:safe(s.ts),totalizadas:safe(s.st),naoTotalizadas:safe(s.snt)},
   votos:{total:safe(v.tv),validos:safe(v.vv),nominais:safe(v.vnom),legenda:safe(v.vl),anulados:safe(v.van),anuladosSubJudice:safe(v.vansj),brancos:safe(v.vb),nulos:safe(v.vn),nulosTecnicos:safe(v.vnt)},candidates};
}
async function json(url,timeout=9000){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
 try{const r=await fetch(url,{signal:ctl.signal,cache:'no-store',mode:'cors',headers:{accept:'application/json'}});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}
 finally{clearTimeout(timer)}
}
async function directTse(){
 const cargos={},errors=[];
 await Promise.all(Object.entries(CARGOS).map(async([cargo,cfg])=>{try{cargos[cargo]=parse(await json(fileFor(cargo,cfg)),cargo,cfg)}catch(e){errors.push(cargo+':'+String(e?.message||e))}}));
 if(Object.keys(cargos).length)return{available:true,cargos,source:'TSE direto',lastCheck:new Date().toISOString(),lastError:errors.length?errors.join(' | '):null};
 throw new Error(errors.join(' | ')||'sem_arquivos');
}
async function serverFallback(){
 const r=await fetch('/api/official/ea20',{cache:'no-store'});if(!r.ok)throw new Error('fallback_http_'+r.status);
 const j=await r.json();if(!j?.available||!Object.keys(j.cargos||{}).length)throw new Error('fallback_sem_dados');return{...j,source:'Servidor da Central'};
}
function currentCargo(){return document.querySelector('#cargoTabs button.active[data-cargo]')?.dataset.cargo||selected||'presidente'}
function fingerprint(next){return JSON.stringify(Object.entries(next.cargos||{}).map(([k,v])=>[k,v.idg,v.sections?.totalizadas,v.candidates?.reduce((s,c)=>s+Number(c.votos||0),0)]))}
function ensureOfficialBox(){
 let box=document.getElementById('ce217Official');if(box)return box;
 const ref=document.getElementById('publicApuracao')||document.getElementById('leaders');if(!ref)return null;
 box=document.createElement('section');box.id='ce217Official';box.className='ce210-official ce217-official';
 box.innerHTML='<div class="ce210-header"><div><small>FONTE OFICIAL · TSE</small><h2>Resultados oficiais de Colméia</h2><p>Consulta direta aos arquivos de totalização do TSE. Os BUs locais continuam preservados separadamente.</p></div><span id="ce217Updated">Carregando dados oficiais…</span></div><div class="ce210-tabs" id="ce217Tabs"></div><div id="ce217Body"></div><p class="ce210-disclaimer">Fonte: Tribunal Superior Eleitoral · arquivos EA20. Central independente da Justiça Eleitoral.</p>';
 ref.insertAdjacentElement('beforebegin',box);return box;
}
function officialStatus(now){
 if(now.totalizacaoFinal||now.andamento==='f'||now.sections?.naoTotalizadas===0)return'Totalização final';
 if(now.sections?.totalizadas>0)return'Totalização parcial';return'Aguardando totalização';
}
function renderOfficialPanel(){
 const box=ensureOfficialBox();if(!box||!state.available)return;box.hidden=false;
 const keys=Object.keys(state.cargos||{});if(!state.cargos[selected])selected=keys[0]||'presidente';
 const tabs=box.querySelector('#ce217Tabs');
 tabs.innerHTML=keys.map(k=>'<button type="button" data-cargo="'+k+'" class="'+(k===selected?'active':'')+'">'+esc(CARGOS[k]?.label||k)+'</button>').join('');
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.cargo;renderOfficialPanel()});
 const now=state.cargos[selected];if(!now)return;
 const generated=now.generatedAt?new Date(now.generatedAt).toLocaleString('pt-BR'):'horário não informado';
 box.querySelector('#ce217Updated').textContent=officialStatus(now)+' · '+generated;
 const rows=[...(now.candidates||[])].sort((a,b)=>b.votos-a.votos||Number(a.numero)-Number(b.numero));
 box.querySelector('#ce217Body').innerHTML='<div class="ce210-metrics">'+[
   ['Seções totalizadas',fmt(now.sections.totalizadas)+' / '+fmt(now.sections.total)],['Votos válidos',fmt(now.votos.validos)],['Brancos',fmt(now.votos.brancos)],['Nulos',fmt(now.votos.nulos)],['Anulados',fmt(now.votos.anulados)],['Sub judice',fmt(now.votos.anuladosSubJudice)],['Nulos técnicos',fmt(now.votos.nulosTecnicos)]
  ].map(([k,v])=>'<div><small>'+k+'</small><strong>'+v+'</strong></div>').join('')+'</div>'+
  '<div class="ce210-candidates">'+rows.map(c=>'<div class="ce210-candidate"><div><b>'+esc(c.nome)+'</b><small>'+esc(c.numero)+' · '+esc(c.partido)+'</small><small>'+esc(c.destinacao||c.situacao||'Resultado publicado pelo TSE')+'</small></div><div class="ce210-votes"><b>'+fmt(c.votos)+'</b><small>'+pct(c.percentual)+'</small></div></div>').join('')+'</div>';
}
function renderMainRanking(){
 if(!state.available)return;const cargo=currentCargo(),now=state.cargos[cargo],root=document.getElementById('leaders');if(!now||!root)return;selected=cargo;
 const rows=[...(now.candidates||[])].sort((a,b)=>b.votos-a.votos||Number(a.numero)-Number(b.numero)).slice(0,10);
 paintGuard=true;root.innerHTML=rows.map((c,i)=>'<div class="leader ce217-official-row" data-ce161-number="'+esc(c.numero)+'" data-ce217-rank="'+(i+1)+'"><div class="num"><span class="ce162-number-text">'+esc(c.numero)+'</span></div><div class="who"><b>'+esc(c.nome)+'</b><small>'+esc(c.partido)+' · Fonte TSE</small></div><div class="votes"><b>'+fmt(c.votos)+'</b><small>'+pct(c.percentual)+'</small></div></div>').join('');root.dataset.ce217Official=cargo+'|'+String(now.idg||'');paintGuard=false;
 const done=Number(now.sections?.totalizadas||0),total=Number(now.sections?.total||EXPECTED)||EXPECTED,progress=total?Math.min(100,done/total*100):0;
 const set=(id,value)=>{const e=document.getElementById(id);if(e)e.textContent=value};
 set('cargoProgressText',done+' / '+total);set('cargoProgressLabel',done+' / '+total+' seções');set('publicPercent',progress.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%');set('publicCount',done+' de '+total+' seções');set('publicState',officialStatus(now)+' · fonte TSE');set('publicPhase','TSE OFICIAL');set('publicUpdated',now.generatedAt?new Date(now.generatedAt).toLocaleString('pt-BR'):'Atualização do TSE');
 const bar=document.getElementById('publicProgress');if(bar)bar.style.width=progress+'%';const wrap=bar?.parentElement;if(wrap)wrap.setAttribute('aria-valuenow',String(Math.round(progress)));
 document.body.classList.add('ce217-tse-live');document.dispatchEvent(new CustomEvent('ce217:official',{detail:{cargo,now}}));
}
function renderAll(){renderOfficialPanel();renderMainRanking()}
function scheduleRender(ms=70){clearTimeout(rerenderTimer);rerenderTimer=setTimeout(renderAll,ms)}
async function load(){
 if(loading)return;loading=true;
 try{
   let next;
   try{next=await directTse()}
   catch(primaryError){try{next=await serverFallback();next.lastError='TSE direto indisponível: '+String(primaryError?.message||primaryError)}catch(fallbackError){state={...state,lastCheck:new Date().toISOString(),lastError:String(primaryError?.message||primaryError)+' | '+String(fallbackError?.message||fallbackError)};return}}
   const fp=fingerprint(next);state=next;window.__CE217_OFFICIAL__=state;if(fp!==lastFingerprint){lastFingerprint=fp;renderAll()}else scheduleRender(20);
 }finally{loading=false}
}
function start(){
 ensureOfficialBox();document.getElementById('cargoTabs')?.addEventListener('click',()=>scheduleRender(100),true);
 const leaders=document.getElementById('leaders');if(leaders)new MutationObserver(()=>{if(!paintGuard&&state.available)scheduleRender(90)}).observe(leaders,{childList:true,subtree:true});
 load();setInterval(()=>{if(!document.hidden)load()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});window.addEventListener('pageshow',()=>load());
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();