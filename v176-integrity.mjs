import fs from 'node:fs';

const pub='/app/public';
const serverPath='/app/server.mjs';
const adminHtmlPath=`${pub}/admin/index.html`;
const swPath=`${pub}/service-worker.js`;
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(serverPath);
const anchor="    if (p === '/api/admin/section-lock' && req.method === 'GET') {";
if(!server.includes("p === '/api/admin/integrity'")){
  if(!server.includes(anchor)) throw new Error('V1.7.6: section-lock endpoint anchor not found');
  server=server.replace(anchor,`    if (p === '/api/admin/integrity' && req.method === 'GET') {
      const user=auth(req);
      if(!user || user.role!=='admin') return json(res,403,{ok:false,error:'admin_required'});
      const snap=snapshot();
      const results=snap?.results||{};
      const cargos=['presidente','governador','senador','depFederal','depEstadual'];
      const sections=[...sectionToPlace.keys()].map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
      const items=sections.map(section=>{
        const rows=cargos.map(cargo=>results[String(section)+':'+cargo]).filter(Boolean);
        const count=rows.length;
        const divergent=rows.some(x=>String(x?.verificationStatus||'')==='divergent');
        const reopen=activeSectionReopen(section);
        const complete=count===cargos.length;
        let state='pending';
        if(divergent) state='divergent';
        else if(reopen) state='reopened';
        else if(complete) state='protected';
        else if(count>0) state='partial';
        return {section,placeId:sectionToPlace.get(section)||null,count,state,divergent,complete,locked:complete&&!reopen,reopen:publicSectionReopen(reopen)};
      });
      const summary={pending:0,partial:0,complete:0,protected:0,reopened:0,divergent:0};
      for(const x of items){if(x.complete) summary.complete++;summary[x.state]=(summary[x.state]||0)+1;}
      return json(res,200,{ok:true,updatedAt:snap?.updatedAt||new Date().toISOString(),summary,items});
    }

${anchor}`);
  write(serverPath,server);
}

const css=`
.ce176-integrity{margin-top:18px}.ce176-integrity-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:10px}.ce176-integrity-head h3{margin:2px 0 0;font-size:18px}.ce176-integrity-head p{margin:3px 0 0;color:#6d7d87;font-size:10.5px}.ce176-integrity-summary{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin-bottom:10px}.ce176-stat{border:1px solid #dce5ea;background:#fff;border-radius:11px;padding:9px}.ce176-stat small{display:block;color:#71818a;font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.03em}.ce176-stat b{display:block;margin-top:3px;font-size:17px;color:#193b52}.ce176-integrity-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:7px}.ce176-section{position:relative;text-align:left;border:1px solid #dce5ea;background:#fff;border-radius:12px;padding:10px 11px;color:#193b52;cursor:pointer}.ce176-section:hover,.ce176-section:focus{border-color:#83abc3;box-shadow:0 0 0 3px rgba(38,100,141,.08)}.ce176-section strong{display:block;font-size:12px}.ce176-section small{display:block;margin-top:4px;color:#71818a;font-size:9px}.ce176-pill{display:inline-flex;margin-top:7px;padding:5px 7px;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.03em}.ce176-pill.pending{background:#edf2f5;color:#536b79}.ce176-pill.partial{background:#fff4d6;color:#765c12}.ce176-pill.protected{background:#eaf7ef;color:#26734c}.ce176-pill.reopened{background:#fff0cf;color:#815c00}.ce176-pill.divergent{background:#fff0f0;color:#9b3030}.ce176-legend{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 12px}.ce176-legend span{font-size:9px;color:#607582}.ce176-error{padding:12px;border:1px dashed #d9b4b4;border-radius:11px;color:#8e3333;background:#fff8f8;font-size:10.5px}@media(max-width:760px){.ce176-integrity-summary{grid-template-columns:repeat(3,1fr)}.ce176-integrity-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){.ce176-integrity-summary{grid-template-columns:repeat(2,1fr)}.ce176-integrity-grid{grid-template-columns:1fr}}
`;
write(`${pub}/v176-integrity.css`,css);

const js=`(()=>{'use strict';
if(!location.pathname.startsWith('/admin/'))return;
const $=s=>document.querySelector(s),TOKEN_KEY='ce_admin_token',LABEL={pending:'Pendente',partial:'Parcial',protected:'Protegida',reopened:'Reaberta',divergent:'Divergência'};
function token(){return sessionStorage.getItem(TOKEN_KEY)||''}
function fmtTime(iso){const d=new Date(iso||'');return Number.isNaN(d.getTime())?'—':d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
function openSection(section){const filter=$('#sectionFilter');if(filter&&filter.value!=='all'){filter.value='all';filter.dispatchEvent(new Event('change'))}setTimeout(()=>{const b=document.querySelector('.section-card[data-section="'+section+'"], [data-section="'+section+'"]');if(b){b.click();b.scrollIntoView({behavior:'smooth',block:'center'})}},60)}
async function load(){const root=$('#ce176Integrity');if(!root||!token())return;try{const r=await fetch('/api/admin/integrity',{cache:'no-store',headers:{Authorization:'Bearer '+token()}});const j=await r.json().catch(()=>null);if(!r.ok)throw new Error(j?.error||('HTTP '+r.status));const s=j.summary||{};root.querySelector('[data-ce176-time]').textContent='Atualizado '+fmtTime(j.updatedAt);root.querySelector('[data-ce176-summary]').innerHTML=[['Pendentes',s.pending||0],['Parciais',s.partial||0],['Completas',s.complete||0],['Protegidas',s.protected||0],['Reabertas',s.reopened||0],['Divergências',s.divergent||0]].map(x=>'<div class="ce176-stat"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');root.querySelector('[data-ce176-grid]').innerHTML=(j.items||[]).map(x=>{const label=LABEL[x.state]||x.state,extra=x.state==='reopened'&&x.reopen?.expiresAt?' · até '+fmtTime(x.reopen.expiresAt).slice(0,5):'';return '<button class="ce176-section" type="button" data-ce176-section="'+x.section+'"><strong>Seção '+String(x.section).padStart(2,'0')+'</strong><small>'+x.count+'/5 cargos'+extra+'</small><span class="ce176-pill '+x.state+'">'+label+'</span></button>'}).join('');root.querySelectorAll('[data-ce176-section]').forEach(b=>b.onclick=()=>openSection(Number(b.dataset.ce176Section)))}catch(e){root.querySelector('[data-ce176-grid]').innerHTML='<div class="ce176-error">Não foi possível atualizar o painel de integridade agora.</div>'}}
function mount(){if($('#ce176Integrity'))return;const section=$('#secoes');if(!section)return;const card=document.createElement('article');card.id='ce176Integrity';card.className='card pad ce176-integrity';card.innerHTML='<div class="ce176-integrity-head"><div><span class="kicker">INTEGRIDADE OPERACIONAL</span><h3>Status das seções</h3><p>Pendente → Parcial → Protegida, com destaque para reaberturas e divergências.</p></div><span class="count-pill" data-ce176-time>Atualizando…</span></div><div class="ce176-integrity-summary" data-ce176-summary></div><div class="ce176-legend"><span>Protegida = 5/5 cargos e sem autorização de correção</span><span>Reaberta = correção administrativa temporária</span></div><div class="ce176-integrity-grid" data-ce176-grid><div class="empty">Carregando integridade…</div></div>';section.insertAdjacentElement('afterbegin',card);load()}
function start(){mount();setTimeout(mount,300);setTimeout(load,900);setInterval(()=>{if(!document.hidden)load()},5000);window.addEventListener('focus',load)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;
write(`${pub}/v176-integrity.js`,js);
new Function(js);

let html=read(adminHtmlPath);
if(!html.includes('/v176-integrity.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v176-integrity.css?v=176">\n</head>');
if(!html.includes('/v176-integrity.js'))html=html.replace('</body>','<script src="/v176-integrity.js?v=176"></script>\n</body>');
write(adminHtmlPath,html);

let sw=read(swPath);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.7.6-unified';");
if(!sw.includes("'/v176-integrity.js'"))sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v176-integrity.css','/v176-integrity.js'"+b);
write(swPath,sw);

if(!read(adminHtmlPath).includes('/v176-integrity.js'))throw new Error('V1.7.6: admin JS injection failed');
if(!read(serverPath).includes("p === '/api/admin/integrity'"))throw new Error('V1.7.6: integrity endpoint injection failed');
console.log('V1.7.6 applied: administrative section-integrity panel enabled.');
