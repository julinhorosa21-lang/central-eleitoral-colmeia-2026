import fs from 'node:fs';
const pub='/app/public';
const serverPath='/app/server.mjs';
const opPath=`${pub}/operacao.html`;
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(serverPath);

// Validação defensiva no servidor: rejeita apenas inconsistências objetivas.
const resultChangedAnchor="function resultChanged(a,b) { return JSON.stringify(resultCore(a))!==JSON.stringify(resultCore(b)); }";
if(!server.includes('function buValidationIssues(')){
  if(!server.includes(resultChangedAnchor))throw new Error('V1.7.4: helper resultChanged não localizado');
  const helpers=`function buNumberish(v) {
  if(typeof v==='number') return v;
  const s=String(v??'').trim();
  if(!s) return 0;
  if(/^\\d{1,3}(?:\\.\\d{3})+$/.test(s)) return Number(s.replace(/\\./g,''));
  return Number(s.replace(',','.'));
}
function buValidationIssues(input,cargo) {
  const p=(input&&typeof input==='object'&&input.payload&&typeof input.payload==='object')?input.payload:(input||{});
  const errors=[],warnings=[];
  const seen=new Set();
  const readCount=(v,label,{optional=true}={})=>{
    if((v===undefined||v===null||v==='')&&optional)return 0;
    const n=buNumberish(v);
    if(!Number.isFinite(n)||!Number.isInteger(n)||n<0){errors.push(label+' deve ser um número inteiro igual ou maior que zero.');return 0;}
    return n;
  };
  let nominal=0,legenda=0;
  if(p.candidatos!==undefined&&!Array.isArray(p.candidatos))errors.push('A lista de candidatos é inválida.');
  for(const [i,c] of (Array.isArray(p.candidatos)?p.candidatos:[]).entries()){
    const numero=String(c?.numero??'').replace(/\\D/g,'');
    if(numero){if(seen.has(numero))errors.push('O candidato nº '+numero+' aparece mais de uma vez.');seen.add(numero);}
    nominal+=readCount(c?.votos,'Votos do candidato '+(numero||('#'+(i+1))));
  }
  if(p.legendas!==undefined&&!Array.isArray(p.legendas))errors.push('A lista de votos de legenda é inválida.');
  for(const [i,l] of (Array.isArray(p.legendas)?p.legendas:[]).entries())legenda+=readCount(l?.votos,'Votos de legenda '+(l?.numero||('#'+(i+1))));
  const brancos=readCount(p.brancos,'Votos em branco');
  const nulos=readCount(p.nulos,'Votos nulos');
  const comparecimento=readCount(p.comparecimento,'Comparecimento');
  const total=nominal+legenda+brancos+nulos;
  if(comparecimento>0){
    const multiplicador=String(cargo)==='senador'?2:1;
    const max=comparecimento*multiplicador;
    if(total>max)errors.push('O total informado ('+total+') supera o máximo compatível com o comparecimento ('+max+').');
    if(total===0)warnings.push('Há comparecimento informado, mas nenhum voto foi registrado para este cargo.');
  }else if(total>0)warnings.push('Há votos registrados sem comparecimento informado. Confira o BU antes de concluir.');
  if(total===0)warnings.push('Todos os totais deste cargo estão zerados.');
  return {ok:errors.length===0,errors,warnings,totals:{nominal,legenda,brancos,nulos,comparecimento,total}};
}
${resultChangedAnchor}`;
  server=server.replace(resultChangedAnchor,helpers);
}

const postMarker="if (p === '/api/results' && req.method === 'POST') {";
const deleteMarker="if (p === '/api/results' && req.method === 'DELETE') {";
const postStart=server.indexOf(postMarker);
const postEnd=server.indexOf(deleteMarker,postStart);
if(postStart<0||postEnd<0)throw new Error('V1.7.4: rota POST /api/results não localizada');
let post=server.slice(postStart,postEnd);
if(!post.includes("event:'bu_validation_failed'")){
  const sectionRe=/const section=Number\(body\.section\),\s*cargo=String\(body\.cargo\|\|''\),\s*placeId=sectionToPlace\.get\(section\);/;
  const match=post.match(sectionRe);
  if(!match)throw new Error('V1.7.4: leitura de section/cargo não localizada na rota de resultados');
  const block=`${match[0]}
      const buCheck=buValidationIssues(body,cargo);
      if(!buCheck.ok){
        securityEvent({event:'bu_validation_failed',outcome:'denied',section:Number.isFinite(section)?section:null,cargo,actor:user.name,tokenHint,sourceHash,requestId,details:{errors:buCheck.errors.slice(0,8),totals:buCheck.totals}});
        return json(res,422,{ok:false,error:'validation_failed',message:'O BU contém dados inconsistentes. Revise antes de enviar.',issues:buCheck.errors,warnings:buCheck.warnings,totals:buCheck.totals});
      }`;
  post=post.replace(match[0],block);
  server=server.slice(0,postStart)+post+server.slice(postEnd);
}
write(serverPath,server);

const css=`
/* V1.7.4 — revisão e validação do BU */
.ce174-backdrop{position:fixed;inset:0;z-index:22000;background:rgba(5,20,31,.62);display:flex;align-items:flex-end;justify-content:center;padding:12px}.ce174-sheet{width:min(620px,100%);max-height:min(86vh,760px);overflow:auto;background:#fff;color:#17324a;border-radius:20px 20px 14px 14px;padding:17px;box-shadow:0 -20px 58px rgba(0,0,0,.28)}.ce174-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ce174-kicker{font-size:9px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#557586}.ce174-head h2{margin:3px 0 4px;font-size:19px;line-height:1.15}.ce174-head p{margin:0;color:#687984;font-size:10.5px;line-height:1.4}.ce174-status{flex:0 0 auto;padding:6px 9px;border-radius:999px;background:#eaf7ef;color:#247249;font-size:9px;font-weight:900}.ce174-status.error{background:#fff0f0;color:#a52d2d}.ce174-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:13px 0}.ce174-cell{padding:9px;border:1px solid #dde7ec;border-radius:11px;background:#f9fbfc}.ce174-cell small{display:block;color:#71818a;font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.04em}.ce174-cell b{display:block;margin-top:3px;color:#18364b;font-size:14px;font-variant-numeric:tabular-nums}.ce174-list{margin:10px 0;padding:0;list-style:none;border:1px solid #e0e8ec;border-radius:12px;overflow:hidden}.ce174-list li{display:flex;justify-content:space-between;gap:12px;padding:8px 10px;border-top:1px solid #edf1f3;font-size:10.5px}.ce174-list li:first-child{border-top:0}.ce174-list span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ce174-list b{font-variant-numeric:tabular-nums}.ce174-alerts{display:grid;gap:6px;margin:10px 0}.ce174-alert{padding:9px 10px;border-radius:10px;background:#fff7df;border:1px solid #f0d991;color:#6f5915;font-size:10px;line-height:1.4}.ce174-alert.error{background:#fff0f0;border-color:#efcaca;color:#8d2828}.ce174-check{display:flex;align-items:flex-start;gap:8px;margin:11px 0;padding:10px;border-radius:11px;background:#f3f8fb;color:#38566a;font-size:10.5px;line-height:1.4}.ce174-check input{margin-top:2px;accent-color:#176b49}.ce174-actions{display:grid;grid-template-columns:1fr 1.25fr;gap:8px;margin-top:12px}.ce174-btn{border:1px solid #cad9e1;border-radius:11px;background:#fff;color:#31566e;padding:11px 12px;font:inherit;font-size:11px;font-weight:850;cursor:pointer}.ce174-btn.primary{border-color:transparent;background:#176b49;color:#fff}.ce174-btn.primary:disabled{opacity:.45;cursor:not-allowed}.ce174-toast{position:fixed;z-index:23000;left:50%;bottom:18px;transform:translateX(-50%);width:min(92vw,480px);padding:11px 13px;border-radius:11px;background:#802929;color:#fff;font-size:11px;font-weight:750;box-shadow:0 8px 28px rgba(0,0,0,.22)}
@media(min-width:700px){.ce174-backdrop{align-items:center}.ce174-sheet{border-radius:18px}.ce174-summary{grid-template-columns:repeat(6,1fr)}}
`;
write(`${pub}/v174-bu-validation.css`,css);

const js=`(()=>{
'use strict';
if(location.pathname!=='/operacao.html')return;
const CARGO_LABEL={presidente:'Presidente',governador:'Governador',senador:'Senador',depFederal:'Deputado Federal',depEstadual:'Deputado Estadual'};
const originalFetch=window.fetch.bind(window);
let reviewQueue=Promise.resolve();
function num(v){if(typeof v==='number')return v;const s=String(v??'').trim();if(!s)return 0;if(/^\\d{1,3}(?:\\.\\d{3})+$/.test(s))return Number(s.replace(/\\./g,''));return Number(s.replace(',','.'))}
function fmt(v){return new Intl.NumberFormat('pt-BR').format(Number(v)||0)}
function validate(input){const cargo=String(input?.cargo||''),p=input?.payload&&typeof input.payload==='object'?input.payload:(input||{}),errors=[],warnings=[],seen=new Set();let nominal=0,legenda=0;const count=(v,label)=>{if(v===undefined||v===null||v==='')return 0;const n=num(v);if(!Number.isFinite(n)||!Number.isInteger(n)||n<0){errors.push(label+' deve ser inteiro e não negativo.');return 0}return n};if(p.candidatos!==undefined&&!Array.isArray(p.candidatos))errors.push('Lista de candidatos inválida.');for(const [i,c] of (Array.isArray(p.candidatos)?p.candidatos:[]).entries()){const n=String(c?.numero??'').replace(/\\D/g,'');if(n){if(seen.has(n))errors.push('Candidato nº '+n+' repetido.');seen.add(n)}nominal+=count(c?.votos,'Votos do candidato '+(n||('#'+(i+1))))}if(p.legendas!==undefined&&!Array.isArray(p.legendas))errors.push('Lista de legendas inválida.');for(const [i,l] of (Array.isArray(p.legendas)?p.legendas:[]).entries())legenda+=count(l?.votos,'Votos de legenda '+(l?.numero||('#'+(i+1))));const brancos=count(p.brancos,'Brancos'),nulos=count(p.nulos,'Nulos'),comparecimento=count(p.comparecimento,'Comparecimento'),total=nominal+legenda+brancos+nulos;if(comparecimento>0){const max=comparecimento*(cargo==='senador'?2:1);if(total>max)errors.push('Total de votos ('+fmt(total)+') maior que o máximo permitido pelo comparecimento ('+fmt(max)+').');if(total===0)warnings.push('Há comparecimento, mas todos os votos estão zerados.')}else if(total>0)warnings.push('Há votos lançados sem comparecimento informado.');if(total===0)warnings.push('Este cargo está com todos os totais zerados.');return{cargo,p,errors,warnings,totals:{nominal,legenda,brancos,nulos,comparecimento,total}}}
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':'&quot;')}
function nonzeroRows(p){const out=[];for(const c of (Array.isArray(p.candidatos)?p.candidatos:[])){const v=num(c?.votos);if(v>0)out.push({name:c?.nome||('Candidato '+(c?.numero||'')),detail:'Nº '+(c?.numero||'—'),votes:v})}for(const l of (Array.isArray(p.legendas)?p.legendas:[])){const v=num(l?.votos);if(v>0)out.push({name:'Legenda '+(l?.numero||''),detail:'Voto de legenda',votes:v})}return out.sort((a,b)=>b.votes-a.votes)}
function modal(body,check){return new Promise(resolve=>{document.querySelector('.ce174-backdrop')?.remove();const back=document.createElement('div');back.className='ce174-backdrop';const section=body?.section??'—',cargo=CARGO_LABEL[check.cargo]||check.cargo||'—',rows=nonzeroRows(check.p).slice(0,12),hard=check.errors.length>0;const alerts=[...check.errors.map(x=>'<div class="ce174-alert error">'+esc(x)+'</div>'),...check.warnings.map(x=>'<div class="ce174-alert">'+esc(x)+'</div>')].join('');back.innerHTML='<section class="ce174-sheet" role="dialog" aria-modal="true" aria-labelledby="ce174Title"><div class="ce174-head"><div><div class="ce174-kicker">REVISÃO DO BOLETIM</div><h2 id="ce174Title">'+(hard?'Corrija antes de enviar':'Confirme os dados do BU')+'</h2><p>Seção '+esc(section)+' · '+esc(cargo)+'</p></div><span class="ce174-status '+(hard?'error':'')+'">'+(hard?'INCONSISTENTE':'VALIDADO')+'</span></div><div class="ce174-summary"><div class="ce174-cell"><small>Nominais</small><b>'+fmt(check.totals.nominal)+'</b></div><div class="ce174-cell"><small>Legenda</small><b>'+fmt(check.totals.legenda)+'</b></div><div class="ce174-cell"><small>Brancos</small><b>'+fmt(check.totals.brancos)+'</b></div><div class="ce174-cell"><small>Nulos</small><b>'+fmt(check.totals.nulos)+'</b></div><div class="ce174-cell"><small>Total</small><b>'+fmt(check.totals.total)+'</b></div><div class="ce174-cell"><small>Comparecimento</small><b>'+fmt(check.totals.comparecimento)+'</b></div></div>'+alerts+(rows.length?'<ul class="ce174-list">'+rows.map(r=>'<li><span><b>'+esc(r.name)+'</b> · '+esc(r.detail)+'</span><b>'+fmt(r.votes)+'</b></li>').join('')+'</ul>':'')+(hard?'':'<label class="ce174-check"><input id="ce174Confirm" type="checkbox"> <span>Conferi a seção, o cargo e os totais acima com o boletim de urna.</span></label>')+'<div class="ce174-actions"><button class="ce174-btn" id="ce174Back" type="button">'+(hard?'Fechar':'Voltar e corrigir')+'</button>'+(hard?'':'<button class="ce174-btn primary" id="ce174Send" type="button" disabled>Confirmar e enviar</button>')+'</div></section>';const done=v=>{back.remove();resolve(v)};back.querySelector('#ce174Back').onclick=()=>done(false);if(!hard){const c=back.querySelector('#ce174Confirm'),s=back.querySelector('#ce174Send');c.onchange=()=>s.disabled=!c.checked;s.onclick=()=>done(true)}back.addEventListener('click',e=>{if(e.target===back)done(false)});document.body.appendChild(back)})}
function toast(msg){const old=document.querySelector('.ce174-toast');old?.remove();const t=document.createElement('div');t.className='ce174-toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),4200)}
async function parseBody(input,init){try{if(init?.body&&typeof init.body==='string')return JSON.parse(init.body);if(input instanceof Request){const ct=input.headers.get('content-type')||'';if(ct.includes('application/json'))return await input.clone().json()}}catch{}return null}
function synthetic(status,obj){return new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json;charset=utf-8'}})}
window.fetch=function(input,init={}){let u;try{u=new URL(input instanceof Request?input.url:input,location.href)}catch{return originalFetch(input,init)}const method=String(init.method||(input instanceof Request?input.method:'GET')).toUpperCase();if(u.origin!==location.origin||u.pathname!=='/api/results'||method!=='POST')return originalFetch(input,init);const task=async()=>{const body=await parseBody(input,init);if(!body)return originalFetch(input,init);const check=validate(body);if(check.errors.length){await modal(body,check);toast('Envio bloqueado: revise os dados inconsistentes do BU.');return synthetic(422,{ok:false,error:'validation_failed',issues:check.errors})}const confirmed=await modal(body,check);if(!confirmed)return synthetic(409,{ok:false,error:'submission_cancelled',message:'Envio cancelado para revisão.'});const headers=new Headers(input instanceof Request?input.headers:undefined);new Headers(init.headers||{}).forEach((v,k)=>headers.set(k,v));headers.set('X-CE-BU-Reviewed','1');headers.set('X-CE-BU-Review-Version','174');if(input instanceof Request)return originalFetch(new Request(input,{...init,headers}),{});return originalFetch(input,{...init,headers})};reviewQueue=reviewQueue.then(task,task);return reviewQueue};
})();`;
write(`${pub}/v174-bu-validation.js`,js);

let op=read(opPath);
if(!op.includes('/v174-bu-validation.css'))op=op.replace('</head>','<link rel="stylesheet" href="/v174-bu-validation.css?v=174">\n</head>');
if(!op.includes('/v174-bu-validation.js')){
  const bridge='<script src="/v151-operator-bridge.js?v=151"></script>';
  if(op.includes(bridge))op=op.replace(bridge,bridge+'\n<script src="/v174-bu-validation.js?v=174"></script>');
  else op=op.replace('<head>','<head>\n<script src="/v174-bu-validation.js?v=174"></script>');
}
write(opPath,op);

let sw=read(`${pub}/service-worker.js`);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.7.4-unified';");
if(!sw.includes("'/v174-bu-validation.js'"))sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v174-bu-validation.css','/v174-bu-validation.js'"+b);
write(`${pub}/service-worker.js`,sw);

console.log('V1.7.4 applied: BU server validation, operator review and explicit confirmation enabled.');
