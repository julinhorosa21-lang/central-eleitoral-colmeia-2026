import fs from 'node:fs';
import {promises as fsp} from 'node:fs';
import path from 'node:path';

const ROOT='https://resultados.tse.jus.br/oficial/ele2026';
const STORE='/data/official-ea20-colmeia.json';
const OPEN_AT=Date.parse('2026-10-04T17:05:00-03:00');
const CARGOS={presidente:{code:'0001',ele:6257},governador:{code:'0003',ele:6259},senador:{code:'0005',ele:6259},depFederal:{code:'0006',ele:6259},depEstadual:{code:'0007',ele:6259}};

export function parseEA20(data,cargo,ele,municipio){
 if(!data || Number(data.ele)!==ele || Number(data.t)!==1 || data.f!=='o' || data.dv!=='s')throw new Error('ea20_not_official_or_not_released');
 if(data.tpabr!=='mu'||Number(data.cdabr)!==Number(municipio))throw new Error('ea20_wrong_municipality');
 const expected=Number(CARGOS[cargo]?.code);
 const group=(data.carg||[]).find(x=>Number(x.cd)===expected);
 if(!group)throw new Error('ea20_cargo_missing');
 const candidates=[];
 for(const ag of group.agr||[])for(const party of ag.par||[])for(const c of party.cand||[]){
  const votes=Number(c.vap);
  if(!Number.isSafeInteger(votes)||votes<0)throw new Error('ea20_invalid_candidate_votes');
  candidates.push({
   numero:String(c.n??''),sqCandidato:String(c.sqcand??''),nome:String(c.nmu||c.nm||''),
   partido:String(party.sg||''),destinacao:String(c.dvt||''),
   votos:votes,percentual:c.pvap==null?null:Number(c.pvap),situacao:String(c.st||'')
  });
 }
 const safe=n=>{const x=Number(n||0);if(!Number.isSafeInteger(x)||x<0)throw new Error('ea20_invalid_total');return x};
 const v=data.v||{},s=data.s||{};
 return {cargo,ele,municipio:Number(municipio),idg:String(data.idg??''),geradoEm:String(data.dg||'')+' '+String(data.hg||''),
  generatedAt:parseOfficialTime(data.dg,data.hg),
  andamento:String(data.and||''),totalizacaoFinal:data.tf==='s',
  sections:{total:safe(s.ts),totalizadas:safe(s.st),naoTotalizadas:safe(s.snt)},
  votos:{total:safe(v.tv),validos:safe(v.vv),nominais:safe(v.vnom),legenda:safe(v.vl),
     anulados:safe(v.van),anuladosSubJudice:safe(v.vansj),
     brancos:safe(v.vb),nulos:safe(v.vn),nulosTecnicos:safe(v.vnt)},
  candidates
 };
}
function parseOfficialTime(d,h){
 const m=String(d||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/),t=String(h||'').match(/^(\d{2}):(\d{2}):(\d{2})$/);
 if(!m||!t)return null;
 const dt=new Date(m[3]+'-'+m[2]+'-'+m[1]+'T'+h+'-03:00');
 return Number.isFinite(dt.getTime())?dt.toISOString():null;
}
async function officialJson(url){
 if(!url.startsWith(ROOT+'/'))throw new Error('ea20_invalid_host');
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),14000);
 try{
  const r=await fetch(url,{signal:ctl.signal,headers:{accept:'application/json'}});
  if(!r.ok)throw new Error('TSE HTTP '+r.status);
  if(Number(r.headers.get('content-length')||0)>4*1024*1024)throw new Error('ea20_file_too_large');
  const text=await r.text();
  if(text.length>4*1024*1024)throw new Error('ea20_file_too_large');
  return JSON.parse(text);
 }finally{clearTimeout(timer)}
}
function normalize(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim()}
async function discoverMunicipio(){
 const config=await officialJson(ROOT+'/comum/config/ele-c.json');
 const ids=JSON.stringify(config);
 if(!ids.includes('6257')||!ids.includes('6259'))throw new Error('ea11_elections_not_published');
 const mun=await officialJson(ROOT+'/6259/config/mun-e006259-cm.json');
 if(mun.f!=='o')throw new Error('ea12_not_official');
 const uf=(mun.abr||[]).find(a=>normalize(a.cd)==='TO');
 const city=uf?.mu?.find(m=>normalize(m.nm)==='COLMEIA');
 const code=String(city?.cd||'').replace(/\D/g,'').padStart(5,'0');
 if(!city||!/^[0-9]{5}$/.test(code))throw new Error('ea12_colmeia_not_found');
 return code;
}
export function createEA20Sync(){
 let state={available:false,phase:'aguardando_divulgacao',lastCheck:null,lastError:null,cargos:{},municipio:null};
 let running=false,municipio=null,timer=null,nextAt=OPEN_AT;
 try{const saved=JSON.parse(fs.readFileSync(STORE,'utf8'));if(saved?.cargos&&saved?.municipio)state={...state,...saved,phase:'copia_anterior'};if(saved?.municipio)municipio=String(saved.municipio)}catch{}
 const publicView=()=>({available:Object.keys(state.cargos||{}).length>0,phase:state.phase,
   lastCheck:state.lastCheck,lastError:state.lastError,
   municipio:state.municipio,source:ROOT,signatureVerified:false,cargos:state.cargos});
 async function tick(){
  if(running||Date.now()<OPEN_AT||Date.now()<nextAt)return;
  running=true;
  try{
   if(!municipio)municipio=await discoverMunicipio();
   let obtained=0;
   const updated={...state.cargos};
   for(const [cargo,cfg] of Object.entries(CARGOS)){
    const file='to'+municipio+'-c'+cfg.code+'-e'+String(cfg.ele).padStart(6,'0')+'-u.json';
    const url=ROOT+'/'+cfg.ele+'/dados/to/'+file;
    try{
     const parsed=parseEA20(await officialJson(url),cargo,cfg.ele,municipio);
     const prev=updated[cargo];
     if(!prev||!prev.generatedAt||!parsed.generatedAt||parsed.generatedAt>=prev.generatedAt)updated[cargo]=parsed;
     obtained++;
    }catch(err){
     const msg=String(err?.message||err);
     if(!/^TSE HTTP 404$/.test(msg))console.warn('EA20 '+cargo+': '+msg);
    }
   }
   if(obtained===0&&Object.keys(updated).length===0)throw new Error('ea20_not_available_yet');
   state={available:Object.keys(updated).length>0,phase:'oficial_parcial_ou_final',lastCheck:new Date().toISOString(),
     lastError:null,municipio,cargos:updated};
   await fsp.mkdir(path.dirname(STORE),{recursive:true});
   const tmp=STORE+'.tmp';
   await fsp.writeFile(tmp,JSON.stringify(state));await fsp.rename(tmp,STORE);
   nextAt=Date.now()+90*1000;
  }catch(err){
   const reason=String(err?.message||err).slice(0,160);
   state={...state,lastCheck:new Date().toISOString(),lastError:reason,
      phase:state.available?'copia_anterior':'aguardando_arquivos_oficiais'};
   nextAt=Date.now()+(/404|not_available|not_published/.test(reason)?15:7)*60*1000;
   console.warn('CE210 EA20: último arquivo mantido; '+reason);
  }finally{running=false}
 }
 return {get:publicView,start(){if(timer)return;timer=setInterval(()=>{tick().catch(e=>console.warn('CE210 EA20',e))},45000);timer.unref();tick().catch(e=>console.warn('CE210 EA20',e))},refresh:tick};
}
