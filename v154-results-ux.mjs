import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const css=`
/* V1.5.4 — leitura da disputa e hierarquia dos candidatos */
.public-v154 #publicCandidatos{position:relative}
.public-v154 #publicCandidatos:before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--br-green),var(--br-yellow),var(--to-blue));border-radius:13px 13px 0 0}
.v154-race-summary{position:relative;margin:8px 0 11px;padding:11px 12px 10px;border:1px solid #d8e7ee;border-radius:12px;background:linear-gradient(135deg,#f8fcff 0%,#fff 56%,#fffdf3 100%);box-shadow:0 2px 9px rgba(22,66,94,.05);overflow:hidden}
.v154-race-summary[hidden]{display:none!important}.v154-race-summary:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--br-green),var(--br-yellow),var(--to-blue))}
.v154-race-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.v154-race-copy{min-width:0}.v154-race-kicker{display:block;margin:0 0 2px;color:#638091;font-size:8.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.v154-race-title{display:block;color:#173b53;font-size:13px;font-weight:900;line-height:1.2}.v154-race-note{display:block;margin-top:3px;color:#70828e;font-size:9.5px;line-height:1.3}.v154-race-badge{flex:0 0 auto;display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;border:1px solid #d9e5eb;background:#fff;color:#31566f;font-size:8.5px;font-weight:900;white-space:nowrap}.v154-race-badge.tight{border-color:#ecd77c;background:#fff8d6;color:#725900}.v154-race-badge.tie{border-color:#b9d8ea;background:#eef8fd;color:#225f80}
.v154-race-metrics{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.v154-race-metric{display:inline-flex;align-items:baseline;gap:4px;padding:5px 7px;border-radius:8px;background:#f1f6f9;color:#607684;font-size:9px}.v154-race-metric b{color:#173b53;font-size:10.5px;font-variant-numeric:tabular-nums}.v154-race-strip{display:flex;width:100%;height:9px;margin-top:9px;border-radius:999px;background:#e8eef2;overflow:hidden;box-shadow:inset 0 1px 2px rgba(20,55,75,.06)}.v154-race-strip i{display:block;height:100%;min-width:0;transition:width .35s ease}.v154-race-legend{display:flex;flex-wrap:wrap;gap:5px 9px;margin-top:7px;color:#667b88;font-size:8.5px}.v154-race-legend span{display:inline-flex;align-items:center;gap:4px}.v154-race-legend i{display:inline-block;width:7px;height:7px;border-radius:50%}
.public-v154 #leaders .leader{background:linear-gradient(90deg,color-mix(in srgb,var(--party-color) 5%,#fff) 0%,#fff 28%)!important}
.public-v154 #leaders .leader .num{position:relative}.v154-rank{position:absolute;z-index:5;left:-5px;top:-5px;display:grid;place-items:center;min-width:22px;height:22px;padding:0 5px;border-radius:999px;background:#fff;color:#35576c;border:1px solid #d9e4ea;box-shadow:0 2px 6px rgba(19,58,84,.12);font-size:8px;font-weight:950;line-height:1}.v154-rank.rank-1{background:#fff6c7;color:#6f5700;border-color:#ead36a}.v154-rank.rank-2{background:#f2f6f8;color:#49616f;border-color:#d2dde3}.v154-rank.rank-3{background:#fff0e3;color:#87532c;border-color:#ebccb2}
.public-v154 #leaders .leader.leader-leading{background:linear-gradient(90deg,color-mix(in srgb,var(--party-color) 8%,#fff) 0%,#fff 35%)!important}
.public-v154 #leaders .leader .votes small{font-size:10px!important}.public-v154 #leaders .leader .bar{height:10px!important}
.public-v154 .v154-gap-note{display:block;margin-top:4px;color:#788995;font-size:8.5px;font-weight:700}
@media(max-width:520px){.v154-race-summary{margin-top:7px;padding:10px 10px 9px}.v154-race-head{gap:7px}.v154-race-title{font-size:12px}.v154-race-badge{font-size:8px;padding:4px 7px}.v154-race-metrics{gap:5px}.v154-race-metric{padding:4px 6px}.v154-race-legend{gap:4px 7px}.v154-rank{left:-3px;top:-3px;min-width:20px;height:20px;font-size:7.5px}}
@media(prefers-reduced-motion:reduce){.v154-race-strip i{transition:none!important}}
`;
write(`${pub}/v154-results-ux.css`,css);

const js=`(()=>{'use strict';
const PATHS=new Set(['/','/index.html','/transparencia.html']);if(!PATHS.has(location.pathname))return;
const fmt=n=>new Intl.NumberFormat('pt-BR').format(Math.max(0,Number(n)||0));
function numText(v){const n=Number(String(v||'').replace(/\\./g,'').replace(/[^0-9-]/g,''));return Number.isFinite(n)?n:0}
function pctText(v){const n=Number(String(v||'').replace('%','').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0}
function rows(){return [...document.querySelectorAll('#leaders .leader')].map((row,index)=>({row,index,votes:numText(row.querySelector('.votes b')?.textContent),pct:pctText(row.querySelector('.votes small')?.textContent),name:(row.querySelector('.who b')?.textContent||('Candidato '+(index+1))).trim(),party:(row.querySelector('.who small')?.textContent||'').trim(),color:getComputedStyle(row).getPropertyValue('--party-color').trim()||'#2450B2'}))}
function ensureSummary(){const leaders=document.getElementById('leaders');if(!leaders)return null;let box=document.getElementById('v154RaceSummary');if(!box){box=document.createElement('div');box.id='v154RaceSummary';box.className='v154-race-summary';box.hidden=true;box.setAttribute('aria-live','polite');leaders.before(box)}return box}
function rankBadges(data){document.querySelectorAll('.v154-rank').forEach(x=>x.remove());if(!data.some(x=>x.votes>0))return;data.slice(0,3).forEach((x,i)=>{if(x.votes<=0)return;const num=x.row.querySelector('.num');if(!num)return;const b=document.createElement('span');b.className='v154-rank rank-'+(i+1);b.textContent=(i+1)+'º';b.title=(i+1)+'º colocado no momento';b.setAttribute('aria-label',b.title);num.appendChild(b)})}
function strip(data){const positive=data.filter(x=>x.pct>0);if(!positive.length)return{html:'',legend:''};const top=positive.slice(0,4);const used=top.reduce((s,x)=>s+x.pct,0);const other=Math.max(0,100-used);let html=top.map(x=>`<i style="width:${Math.max(0,x.pct)}%;background:${x.color}" title="${x.name}: ${x.pct.toFixed(1).replace('.',',')}%"></i>`).join('');if(other>.05)html+=`<i style="width:${other}%;background:#b9c6ce" title="Demais: ${other.toFixed(1).replace('.',',')}%"></i>`;let legend=top.slice(0,3).map(x=>`<span><i style="background:${x.color}"></i>${x.name}</span>`).join('');if(positive.length>3)legend+='<span><i style="background:#b9c6ce"></i>Demais</span>';return{html,legend}}
function summary(data){const box=ensureSummary();if(!box)return;const active=data.filter(x=>x.votes>0||x.pct>0);if(active.length<2){box.hidden=true;return}const a=active[0],b=active[1];const gapVotes=Math.max(0,a.votes-b.votes),gapPct=Math.max(0,a.pct-b.pct);const tied=a.votes===b.votes;const tight=!tied&&gapPct<=5;const veryTight=!tied&&gapPct<=2;let badge=tied?'Empate no momento':veryTight?'Diferença muito estreita':tight?'Diferença estreita':'Diferença atual';let cls=tied?' tie':tight?' tight':'';const st=strip(data);box.hidden=false;box.innerHTML=`<div class="v154-race-head"><div class="v154-race-copy"><span class="v154-race-kicker">Leitura da disputa</span><span class="v154-race-title">${tied?'Os dois primeiros estão empatados':'Diferença entre 1º e 2º colocados'}</span><span class="v154-race-note">Parcial — pode mudar conforme novas seções forem recebidas.</span></div><span class="v154-race-badge${cls}">${badge}</span></div><div class="v154-race-metrics"><span class="v154-race-metric"><b>${fmt(gapVotes)}</b> votos de diferença</span><span class="v154-race-metric"><b>${gapPct.toFixed(1).replace('.',',')} p.p.</b> de diferença</span></div><div class="v154-race-strip" role="img" aria-label="Distribuição percentual dos candidatos">${st.html}</div><div class="v154-race-legend">${st.legend}</div>`}
function gapNotes(data){document.querySelectorAll('.v154-gap-note').forEach(x=>x.remove());if(data.length<2||data[0].votes<=0)return;const lead=data[0].votes;data.slice(1,4).forEach(x=>{if(x.votes<=0)return;const gap=Math.max(0,lead-x.votes);const who=x.row.querySelector('.who');if(!who)return;const note=document.createElement('span');note.className='v154-gap-note';note.textContent=fmt(gap)+' votos atrás do 1º';who.appendChild(note)})}
function apply(){if(!document.body)return;document.body.classList.add('public-v154');const data=rows();rankBadges(data);summary(data);gapNotes(data)}
function start(){apply();setTimeout(apply,250);setTimeout(apply,900);const leaders=document.getElementById('leaders');if(leaders){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}).observe(leaders,{childList:true,subtree:true,characterData:true})}const tabs=document.getElementById('cargoTabs');if(tabs)tabs.addEventListener('click',()=>setTimeout(apply,70))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;
write(`${pub}/v154-results-ux.js`,js);

for(const page of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(page);
  if(!html.includes('/v154-results-ux.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v154-results-ux.css?v=154">\n</head>');
  if(!html.includes('/v154-results-ux.js'))html=html.replace('</body>','<script src="/v154-results-ux.js?v=154"></script>\n</body>');
  write(page,html);
}

let sw=read(`${pub}/service-worker.js`);
sw=sw.replace("const VERSION='v1.5.1-unified';","const VERSION='v1.5.4-unified';");
if(!sw.includes("'/v154-results-ux.css'"))sw=sw.replace("'/v150-unified.css','/v150-unified.js','/v151-team.css','/v151-team.js','/v151-operator-bridge.js'","'/v150-unified.css','/v150-unified.js','/v151-team.css','/v151-team.js','/v151-operator-bridge.js','/v153-regional-theme.css','/v153-regional-theme.js','/v154-results-ux.css','/v154-results-ux.js'");
write(`${pub}/service-worker.js`,sw);

console.log('V1.5.4 applied: top-3 hierarchy, race gap summary, compact distribution strip and refreshed PWA shell.');
