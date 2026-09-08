import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const css=`
/* V1.6.0 — andamento geral das 29 seções */
:root{--ce160-blue:#2450B2;--ce160-green:#16864F;--ce160-gold:#C79212;--ce160-ink:#17324A;--ce160-muted:#687985;--ce160-line:#D7E4EA}
.ce160-flow{--flow-accent:var(--ce160-blue);margin:12px 0 14px;padding:14px;border:1px solid var(--ce160-line);border-radius:15px;background:linear-gradient(135deg,#FFFFFF 0%,#F8FBFC 66%,#FFFDF3 100%);box-shadow:0 4px 15px rgba(22,65,93,.06);color:var(--ce160-ink)}
.ce160-flow.ce160-inline{margin:10px 0 0;padding:11px 0 0;border:0;border-top:1px solid #E1E9ED;border-radius:0;background:transparent;box-shadow:none}
.ce160-flow-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.ce160-flow-kicker{display:flex;align-items:center;gap:6px;font-size:9px;font-weight:900;letter-spacing:.085em;text-transform:uppercase;color:#537080}.ce160-flow-kicker i{width:8px;height:8px;border-radius:50%;background:var(--flow-accent);box-shadow:0 0 0 4px rgba(36,80,178,.08)}.ce160-flow-title{margin-top:3px;font-size:15px;font-weight:900;letter-spacing:-.015em;color:#17324A;line-height:1.2}.ce160-flow-sub{margin-top:3px;font-size:10px;color:var(--ce160-muted);line-height:1.35}.ce160-flow-percent{flex:0 0 auto;font-size:27px;line-height:1;font-weight:950;letter-spacing:-.04em;color:#173F62;font-variant-numeric:tabular-nums}
.ce160-flow-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:11px}.ce160-stat{min-width:0;padding:8px 9px;border:1px solid #E0E8EC;border-radius:10px;background:rgba(255,255,255,.78)}.ce160-stat small{display:block;color:#73828C;font-size:8px;font-weight:850;letter-spacing:.04em;text-transform:uppercase}.ce160-stat b{display:block;margin-top:2px;font-size:16px;line-height:1.1;color:#1B3548;font-variant-numeric:tabular-nums}.ce160-stat.received b{color:var(--ce160-blue)}.ce160-stat.complete b{color:#1D7B4E}.ce160-stat.waiting b{color:#687985}
.ce160-segments{display:grid;grid-template-columns:repeat(29,minmax(2px,1fr));gap:2px;margin-top:10px;padding:2px 0}.ce160-seg{height:9px;border-radius:99px;background:#DFE7EB;border:1px solid #D5E0E5;transition:background .2s ease,border-color .2s ease,transform .2s ease}.ce160-seg.received{background:#8FB3E8;border-color:#78A1DA}.ce160-seg.complete{background:#35A66B;border-color:#28935C}.ce160-seg:hover{transform:translateY(-1px)}
.ce160-flow-legend{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin-top:6px;font-size:8.5px;color:#73818A}.ce160-flow-legend span{display:inline-flex;align-items:center;gap:4px}.ce160-flow-legend i{width:6px;height:6px;border-radius:50%;background:#DFE7EB}.ce160-flow-legend .r i{background:#8FB3E8}.ce160-flow-legend .c i{background:#35A66B}
.ce160-phases{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:10px}.ce160-phase{position:relative;padding-top:7px;border-top:3px solid #DFE7EB;color:#8A969E;font-size:8px;font-weight:800;line-height:1.2}.ce160-phase.done{border-top-color:#56A878;color:#527162}.ce160-phase.active{border-top-color:var(--flow-accent);color:#315A70}
.ce160-flow[data-state="waiting"]{--flow-accent:var(--ce160-gold)}.ce160-flow[data-state="waiting"] .ce160-flow-kicker i{box-shadow:0 0 0 4px rgba(199,146,18,.10)}.ce160-flow[data-state="running"]{--flow-accent:var(--ce160-blue)}.ce160-flow[data-state="checking"]{--flow-accent:#1B8661}.ce160-flow[data-state="done"]{--flow-accent:var(--ce160-green)}.ce160-flow[data-state="done"] .ce160-flow-percent{color:#17683F}.ce160-flow-loading{padding:5px 0;color:#74838D;font-size:10px}
#publicOverview.ce160-enhanced .public-summary-chips{display:none!important}
@media(max-width:620px){.ce160-flow{padding:12px;margin:10px 0 12px}.ce160-flow.ce160-inline{padding:9px 0 0;margin-top:8px}.ce160-flow-title{font-size:13px}.ce160-flow-sub{font-size:9.3px}.ce160-flow-percent{font-size:24px}.ce160-flow-stats{gap:4px;margin-top:9px}.ce160-stat{padding:7px 6px}.ce160-stat small{font-size:7.4px}.ce160-stat b{font-size:14px}.ce160-segments{gap:1.5px}.ce160-seg{height:8px}.ce160-flow-legend{gap:7px;font-size:7.8px}.ce160-phases{gap:3px}.ce160-phase{font-size:7.2px;padding-top:6px}}
`;

const js=`(()=>{
  'use strict';
  const CARGOS=['presidente','governador','senador','depFederal','depEstadual'];
  const EXPECTED=29;
  let remoteStats=null;
  let statsLoading=false;
  let statsLastFetch=0;
  let queued=false;
  function intValue(v){const m=String(v||'').replace(/\\./g,'').match(/-?\\d+/);return m?Number(m[0]):0;}
  function fmt(n){return new Intl.NumberFormat('pt-BR').format(Math.max(0,Math.round(Number(n)||0)));}
  function parseSnapshot(snapshot,locations){
    const bySection=new Map();
    const results=snapshot&&snapshot.results?snapshot.results:{};
    Object.keys(results).forEach(key=>{const i=key.indexOf(':');if(i<1)return;const section=Number(key.slice(0,i));const cargo=key.slice(i+1);if(!Number.isFinite(section)||!cargo)return;if(!bySection.has(section))bySection.set(section,new Set());bySection.get(section).add(cargo);});
    let sectionNumbers=[];
    const locais=locations&&Array.isArray(locations.locais)?locations.locais:[];
    locais.forEach(p=>(p.secoes||[]).forEach(s=>{const n=Number(s);if(Number.isFinite(n))sectionNumbers.push(n);}));
    sectionNumbers=[...new Set(sectionNumbers)].sort((a,b)=>a-b);
    if(!sectionNumbers.length)sectionNumbers=[...bySection.keys()].sort((a,b)=>a-b);
    const received=[...bySection.values()].filter(set=>set.size>0).length;
    const complete=[...bySection.values()].filter(set=>CARGOS.every(c=>set.has(c))).length;
    const sections=sectionNumbers.map(number=>{const set=bySection.get(number)||new Set();return{number,state:CARGOS.every(c=>set.has(c))?'complete':set.size>0?'received':'waiting'};});
    if(sections.length<EXPECTED){for(let i=sections.length;i<EXPECTED;i++)sections.push({number:null,state:'waiting'});}
    return{received:Math.min(EXPECTED,received),complete:Math.min(EXPECTED,complete),sections:sections.slice(0,EXPECTED),updatedAt:snapshot&&snapshot.updatedAt?snapshot.updatedAt:null,source:'snapshot'};
  }
  function domStats(){
    const any=document.getElementById('mAny');if(!any)return null;
    const raw=String(any.textContent||'').trim();if(!/\\d/.test(raw))return null;
    const received=Math.min(EXPECTED,intValue(raw));
    const completeEl=document.getElementById('mComplete');
    const complete=completeEl&&/\\d/.test(String(completeEl.textContent||''))?Math.min(received,intValue(completeEl.textContent)):0;
    return{received,complete,sections:Array.from({length:EXPECTED},(_,i)=>({number:null,state:i<complete?'complete':i<received?'received':'waiting'})),updatedAt:null,source:'dom'};
  }
  async function loadStats(force){
    if(statsLoading)return;
    const now=Date.now();if(!force&&now-statsLastFetch<12000)return;
    statsLoading=true;statsLastFetch=now;
    try{
      const pair=await Promise.all([
        fetch('/api/snapshot',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('snapshot'))),
        fetch('/data/locais-colmeia.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
      ]);
      remoteStats=parseSnapshot(pair[0],pair[1]);scheduleApply();
    }catch(e){if(!remoteStats){const d=domStats();if(d)remoteStats=d;}}
    finally{statsLoading=false;}
  }
  function flowState(stats){
    const r=stats.received,c=stats.complete;
    if(r<=0)return{key:'waiting',title:'Aguardando os primeiros boletins',sub:'Nenhuma das 29 seções enviou resultado ainda.',phase:0};
    if(r<EXPECTED)return{key:'running',title:'Apuração em andamento',sub:fmt(r)+' de '+EXPECTED+' seções recebidas · faltam '+fmt(EXPECTED-r)+'.',phase:1};
    if(c<EXPECTED)return{key:'checking',title:'Todas as seções já chegaram',sub:'Os 29 boletins foram recebidos. A conclusão dos cinco cargos segue em andamento.',phase:2};
    return{key:'done',title:'Apuração local concluída',sub:'As 29 seções estão completas nos cinco cargos acompanhados.',phase:3};
  }
  function flowHost(){
    let box=document.getElementById('ce160SectionPulse');
    const overview=document.getElementById('publicOverview');
    if(overview){
      overview.classList.add('ce160-enhanced');
      const main=overview.querySelector('.public-overview-main')||overview;
      if(!box){box=document.createElement('section');box.id='ce160SectionPulse';box.className='ce160-flow ce160-inline';box.setAttribute('aria-live','polite');main.appendChild(box);}else if(box.parentElement!==main)main.appendChild(box);
      box.classList.add('ce160-inline');return box;
    }
    const metrics=document.querySelector('.metrics,.metric-grid');if(!metrics)return null;
    if(!box){box=document.createElement('section');box.id='ce160SectionPulse';box.className='ce160-flow';box.setAttribute('aria-live','polite');metrics.insertAdjacentElement('afterend',box);}else if(box.previousElementSibling!==metrics)metrics.insertAdjacentElement('afterend',box);
    box.classList.remove('ce160-inline');return box;
  }
  function renderFlow(){
    const box=flowHost();if(!box)return;
    const stats=remoteStats||domStats();
    if(!stats){if(box.dataset.sig!=='loading'){box.dataset.sig='loading';box.dataset.state='waiting';box.innerHTML='<div class="ce160-flow-loading">Carregando o andamento das 29 seções…</div>';}loadStats(false);return;}
    const state=flowState(stats);const percent=Math.round(stats.received/EXPECTED*100);
    const sig=[stats.received,stats.complete,state.key,stats.updatedAt||'',stats.sections.map(s=>s.state[0]+(s.number||'')).join('|')].join('::');if(box.dataset.sig===sig)return;
    box.dataset.sig=sig;box.dataset.state=state.key;
    const segs=stats.sections.slice(0,EXPECTED).map((s,i)=>{const label=s.number?'Seção '+s.number:'Faixa '+(i+1);const st=s.state==='complete'?'completa':s.state==='received'?'recebida':'aguardando';return '<i class="ce160-seg '+s.state+'" title="'+label+' · '+st+'" aria-label="'+label+' · '+st+'"></i>';}).join('');
    const phases=['Aguardando BUs','Recebendo seções','Fechando cargos','Concluído'].map((label,i)=>'<span class="ce160-phase '+(i<state.phase?'done':i===state.phase?'active':'')+'">'+label+'</span>').join('');
    box.innerHTML='<div class="ce160-flow-top"><div><div class="ce160-flow-kicker"><i></i><span>ANDAMENTO GERAL · 29 SEÇÕES</span></div><div class="ce160-flow-title">'+state.title+'</div><div class="ce160-flow-sub">'+state.sub+'</div></div><strong class="ce160-flow-percent">'+percent+'%</strong></div><div class="ce160-flow-stats"><div class="ce160-stat received"><small>Recebidas</small><b>'+stats.received+' / '+EXPECTED+'</b></div><div class="ce160-stat waiting"><small>Faltam</small><b>'+Math.max(0,EXPECTED-stats.received)+'</b></div><div class="ce160-stat complete"><small>Completas</small><b>'+stats.complete+' / '+EXPECTED+'</b></div></div><div class="ce160-segments" role="img" aria-label="Visão das 29 seções: '+stats.complete+' completas, '+Math.max(0,stats.received-stats.complete)+' recebidas parcialmente e '+Math.max(0,EXPECTED-stats.received)+' aguardando">'+segs+'</div><div class="ce160-flow-legend"><span class="c"><i></i>Completa nos 5 cargos</span><span class="r"><i></i>Recebida parcialmente</span><span><i></i>Aguardando</span></div><div class="ce160-phases">'+phases+'</div>';
  }
  function apply(){document.documentElement.dataset.ceUi='160';renderFlow();}
  function scheduleApply(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  function start(){scheduleApply();loadStats(true);setTimeout(scheduleApply,250);setTimeout(scheduleApply,900);setTimeout(scheduleApply,1600);new MutationObserver(scheduleApply).observe(document.body,{subtree:true,childList:true,characterData:true});window.addEventListener('pageshow',()=>{scheduleApply();loadStats(true);});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadStats(false);});setInterval(()=>loadStats(false),30000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;

write(`${pub}/v160-flow.css`,css);
write(`${pub}/v160-flow.js`,js);
for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`,`${pub}/operacao.html`]){
  let html=read(file);
  if(!html.includes('/v160-flow.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v160-flow.css?v=160">\n</head>');
  if(!html.includes('/v160-flow.js'))html=html.replace('</body>','<script src="/v160-flow.js?v=160"></script>\n</body>');
  write(file,html);
}
let sw=read(`${pub}/service-worker.js`);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.6.0-unified';");
if(!sw.includes("'/v160-flow.css'"))sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v160-flow.css','/v160-flow.js'"+b);
write(`${pub}/service-worker.js`,sw);
console.log('V1.6.0 applied: live 29-section flow with received, missing and complete states.');
