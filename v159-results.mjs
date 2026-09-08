import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const css=`
/* V1.5.9 — leitura da disputa + identidade partidária nos resultados */
:root{--ce159-ink:#17324A;--ce159-muted:#687985;--ce159-line:#D9E5EB;--ce159-soft:#F4F8FA}

/* Resumo da disputa: informativo, neutro e compacto. */
.ce159-race{margin:10px 0 12px;padding:12px 13px;border:1px solid var(--ce159-line);border-radius:12px;background:linear-gradient(135deg,#F8FBFC,#FFFFFF 58%,#FFFDF4);box-shadow:0 3px 12px rgba(22,65,93,.05)}
.ce159-race[hidden]{display:none!important}.ce159-race-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.ce159-race-kicker{font-size:9px;font-weight:900;letter-spacing:.08em;color:#537080;text-transform:uppercase}.ce159-race-title{margin-top:3px;font-size:13px;font-weight:850;color:var(--ce159-ink);line-height:1.25}.ce159-race-badge{flex:0 0 auto;padding:5px 8px;border-radius:999px;background:#EEF5F8;border:1px solid #D7E5EC;color:#315A70;font-size:9px;font-weight:850;white-space:nowrap}.ce159-race-badge.tight{background:#FFF8DF;border-color:#F0DE94;color:#775A00}.ce159-race-badge.tie{background:#F3F0FF;border-color:#DDD4FF;color:#5B4A91}.ce159-race-gap{display:flex;align-items:baseline;gap:5px;margin-top:8px;color:var(--ce159-muted);font-size:10px}.ce159-race-gap b{font-size:18px;line-height:1;color:var(--ce159-ink);letter-spacing:-.02em}.ce159-race-gap strong{color:#315A70}.ce159-race-bar{display:flex;height:8px;margin-top:10px;border-radius:999px;overflow:hidden;background:#E8EFF3}.ce159-race-bar i{display:block;height:100%;min-width:0}.ce159-race-note{margin-top:7px;font-size:9px;color:#7B8992;line-height:1.35}

/* Cards: partido guia a leitura, mas não domina o layout. */
body.ce-regional-public #leaders .leader{--party:#2450B2;position:relative!important;overflow:visible!important;border-left:5px solid var(--party)!important;background:#fff!important;transition:transform .16s ease,box-shadow .16s ease!important}
body.ce-regional-public #leaders .leader .bar{background:#E7EEF2!important}
body.ce-regional-public #leaders .leader .bar i{background:var(--party)!important;box-shadow:none!important}
body.ce-regional-public #leaders .leader .votes small{color:var(--party)!important;font-weight:900!important}
body.ce-regional-public #leaders .leader .who small{display:flex!important;align-items:center!important;gap:5px!important}
body.ce-regional-public #leaders .leader .who small:before{content:'';display:inline-block;width:7px;height:7px;flex:0 0 7px;border-radius:50%;background:var(--party);box-shadow:0 0 0 2px color-mix(in srgb,var(--party) 13%,transparent)}
body.ce-regional-public #leaders .leader .public-number-badge{background:var(--party)!important;color:#fff!important}
body.ce-regional-public #leaders .leader .num:not(.public-photo-num){background:color-mix(in srgb,var(--party) 9%,#fff)!important;color:var(--party)!important;border:1px solid color-mix(in srgb,var(--party) 20%,#E2E8ED)!important}

/* Ranking só aparece quando há votos. */
.ce159-rank{position:absolute;right:8px;top:-8px;display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:20px;padding:0 7px;border-radius:999px;background:#F2F6F8;border:1px solid #D5E2E8;color:#49616F;font-size:8.5px;font-weight:900;letter-spacing:.01em;box-shadow:0 2px 7px rgba(22,65,93,.07)}
.leader[data-ce159-rank="1"] .ce159-rank{background:#FFF8D8;border-color:#E8CE60;color:#725500}.leader[data-ce159-rank="1"]{box-shadow:0 6px 17px rgba(22,65,93,.085)!important}.leader[data-ce159-rank="2"] .ce159-rank{background:#F1F5F7;color:#52636E}.leader[data-ce159-rank="3"] .ce159-rank{background:#FFF2E8;border-color:#EAC8AD;color:#815637}
.ce159-behind{grid-column:2/4;margin-top:-2px;font-size:8.8px;color:#76858E;line-height:1.2}.ce159-behind b{color:#526773;font-weight:850}

@media(max-width:620px){
  .ce159-race{padding:11px;margin:9px 0 10px}.ce159-race-title{font-size:12px}.ce159-race-gap b{font-size:16px}.ce159-race-badge{font-size:8px;padding:4px 7px}
  .ce159-rank{right:6px;top:-7px;height:19px;min-width:26px;padding:0 6px;font-size:8px}
  .ce159-behind{grid-column:2/4!important;font-size:8.3px}
}
@media(prefers-reduced-motion:reduce){body.ce-regional-public #leaders .leader{transition:none!important}}
`;

const js=`(()=>{'use strict';
const PATH=new Set(['/','/index.html','/transparencia.html']);if(!PATH.has(location.pathname))return;
const COLORS={PT:'#D71920',PL:'#1351A3',MDB:'#178544',PSD:'#2F86C7',PP:'#1B62A9',REPUBLICANOS:'#173D77',PDT:'#C91F2C',PSB:'#E5A800',PODEMOS:'#2BA866',AVANTE:'#F28A22',PSDB:'#1757A6',PCDOB:'#D91D2A',PV:'#1C9C45',REDE:'#28A96B',PSOL:'#F28C00',CIDADANIA:'#E85E24',NOVO:'#F58220',PRD:'#214C8B',SOLIDARIEDADE:'#E66B19',DC:'#1E5F9E',MOBILIZA:'#2B64B1',PCB:'#C5161D',PSTU:'#C61C2B',UP:'#7A1D8F'};
const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
function partyColor(v){const s=norm(v);if(s.includes('UNIAO BRASIL')||s==='UNIAO')return'#E7B900';for(const k in COLORS)if((' '+s+' ').includes(' '+k+' '))return COLORS[k];return'#2450B2'}
function intValue(v){const m=String(v||'').replace(/\./g,'').match(/-?\d+/);return m?Number(m[0]):0}
function pctValue(v){const m=String(v||'').replace(',','.').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0}
function fmt(n){return new Intl.NumberFormat('pt-BR').format(Math.max(0,Math.round(Number(n)||0)))}
function rowData(row){const who=row.querySelector('.who');const name=(who?.querySelector('b')?.textContent||'Candidato').trim();const party=(who?.querySelector('small')?.textContent||'').trim();const votes=intValue(row.querySelector('.votes b')?.textContent);const pct=pctValue(row.querySelector('.votes small')?.textContent);return{row,name,party,votes,pct,color:partyColor(party)}}
function summaryHost(){const leaders=document.getElementById('leaders');if(!leaders)return null;let box=document.getElementById('ce159Race');if(!box){box=document.createElement('div');box.id='ce159Race';box.className='ce159-race';box.hidden=true;leaders.insertAdjacentElement('beforebegin',box)}return box}
function clearRanks(rows){for(const row of rows){row.removeAttribute('data-ce159-rank');row.querySelector('.ce159-rank')?.remove();row.querySelector('.ce159-behind')?.remove()}}
function rank(rows){const data=rows.map(rowData);for(const d of data)d.row.style.setProperty('--party',d.color);clearRanks(rows);if(!data.length||Math.max(...data.map(d=>d.votes))<=0)return data;const leader=data[0];data.slice(0,3).forEach((d,i)=>{d.row.dataset.ce159Rank=String(i+1);const badge=document.createElement('span');badge.className='ce159-rank';badge.textContent=(i+1)+'º';badge.setAttribute('aria-label',(i+1)+'º colocado no momento');d.row.appendChild(badge);if(i>0&&leader.votes>d.votes){const gap=document.createElement('div');gap.className='ce159-behind';gap.innerHTML='<b>−'+fmt(leader.votes-d.votes)+'</b> votos em relação ao 1º';d.row.appendChild(gap)}});return data}
function race(data){const box=summaryHost();if(!box)return;if(data.length<2||data[0].votes<=0){box.hidden=true;box.innerHTML='';return}const a=data[0],b=data[1];const dv=Math.max(0,a.votes-b.votes);const dp=Math.max(0,a.pct-b.pct);const tie=dv===0;let label='Vantagem atual',cls='';if(tie){label='Empate no momento';cls='tie'}else if(dp<=1){label='Diferença muito estreita';cls='tight'}else if(dp<=3){label='Disputa apertada';cls='tight'}const top=data.slice(0,3);let sum=top.reduce((s,d)=>s+Math.max(0,d.pct),0);if(sum<=0)sum=top.reduce((s,d)=>s+Math.max(0,d.votes),0);const seg=top.map(d=>{const base=d.pct>0?d.pct:d.votes;const w=sum>0?Math.max(0,base/sum*100):0;return '<i style="width:'+w.toFixed(2)+'%;background:'+d.color+'" title="'+d.name+'"></i>'}).join('');const title=tie?'Os dois primeiros estão empatados neste momento':a.name+' aparece à frente neste momento';const gap=tie?'<b>0</b><span>votos de diferença</span>':'<b>'+fmt(dv)+'</b><span>votos · <strong>'+dp.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' p.p.</strong></span>';box.hidden=false;box.innerHTML='<div class="ce159-race-top"><div><div class="ce159-race-kicker">Leitura da disputa</div><div class="ce159-race-title">'+title+'</div></div><span class="ce159-race-badge '+cls+'">'+label+'</span></div><div class="ce159-race-gap">'+gap+'</div><div class="ce159-race-bar" aria-label="Distribuição entre os três primeiros">'+seg+'</div><div class="ce159-race-note">Resultado parcial da Central. A posição pode mudar com a entrada de novas seções e a conferência oficial.</div>'}
function accessibility(data){for(const d of data){const rank=d.row.dataset.ce159Rank;const bits=[d.name,d.party,d.votes+' votos',d.pct.toLocaleString('pt-BR',{maximumFractionDigits:2})+' por cento'];if(rank)bits.push(rank+'º colocado no momento');d.row.setAttribute('aria-label',bits.filter(Boolean).join(' · '))}}
function apply(){const rows=[...document.querySelectorAll('#leaders .leader')];if(!rows.length){const box=document.getElementById('ce159Race');if(box)box.hidden=true;return}const data=rank(rows);race(data);accessibility(data);document.documentElement.dataset.ceUi='159'}
function start(){let queued=false;const run=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};run();setTimeout(run,250);setTimeout(run,900);new MutationObserver(run).observe(document.body,{subtree:true,childList:true,characterData:true});document.addEventListener('click',()=>setTimeout(run,80),true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;

write(`${pub}/v159-results.css`,css);
write(`${pub}/v159-results.js`,js);
for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(file);
  if(!html.includes('/v159-results.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v159-results.css?v=159">\n</head>');
  if(!html.includes('/v159-results.js'))html=html.replace('</body>','<script src="/v159-results.js?v=159"></script>\n</body>');
  write(file,html);
}
let sw=read(`${pub}/service-worker.js`);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.5.9-unified';");
if(!sw.includes("'/v159-results.css'"))sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v159-results.css','/v159-results.js'"+b);
write(`${pub}/service-worker.js`,sw);
console.log('V1.5.9 applied: party-colored candidate cards, top-three ranking and neutral race summary.');
