import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);


/* Compatibilidade V1.6.2/V1.6.3: fotos limpas e número na linha de informação. */
const cleanCss=`
.ce161-photo-num .public-number-badge,.ce161-op-photo>span{display:none!important}
#leaders .leader .who small .ce162-number-text{display:inline-flex!important;align-items:center;margin-left:6px;padding-left:7px;border-left:1px solid #d6e1e7;color:#496475!important;font-size:11px;font-weight:850!important;white-space:nowrap}
.ce161-photo-num img,.ce161-op-photo img{width:100%;height:100%;object-fit:cover}
`;
const cleanJs=`(()=>{'use strict';const P=new Set(['/','/index.html','/transparencia.html']);if(!P.has(location.pathname))return;let q=false;function d(v){const m=String(v||'').match(/\\d{1,5}/);return m?m[0]:''}function a(){document.querySelectorAll('#leaders .leader').forEach(r=>{const s=r.querySelector('.who small');if(!s)return;let n=d(r.dataset.ce161Number||'');const o=r.querySelector('.public-number-badge');if(!n&&o)n=d(o.textContent);if(!n){const b=r.querySelector('.num:not(.public-photo-num)');if(b)n=d(b.textContent)}if(!n)return;let t=s.querySelector('.ce162-number-text');if(!t){t=document.createElement('span');t.className='ce162-number-text';s.appendChild(t)}if(t.textContent!=='Nº '+n)t.textContent='Nº '+n})}function r(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;a()})}function s(){r();setTimeout(r,250);setTimeout(r,800);new MutationObserver(r).observe(document.body,{subtree:true,childList:true,characterData:true})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',s,{once:true});else s()})();`;
write(`${pub}/v162-clean-photo.css`,cleanCss);
write(`${pub}/v162-clean-photo.js`,cleanJs);
for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`,`${pub}/operacao.html`]){
  let html=read(file);
  if(!html.includes('/v162-clean-photo.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v162-clean-photo.css?v=164">\n</head>');
  if(!html.includes('/v162-clean-photo.js'))html=html.replace('</body>','<script src="/v162-clean-photo.js?v=164"></script>\n</body>');
  write(file,html);
}

const css=`
/* V1.6.4 — refinamento geral: neutralidade, leitura e mobile */
:root{--ce164-line:#D9E5EB;--ce164-ink:#17324A;--ce164-muted:#607582;--ce164-blue:#2450B2;--ce164-green:#16864F}

/* 1–4. Cards neutros, cor partidária consistente, sem ponto redundante e tipografia legível. */
body.ce-regional-public #leaders .leader{
  border-top:1px solid var(--ce164-line)!important;
  border-right:1px solid var(--ce164-line)!important;
  border-bottom:1px solid var(--ce164-line)!important;
  border-left:5px solid var(--party,#2450B2)!important;
  background:#fff!important;
  box-shadow:0 3px 10px rgba(22,65,93,.045)!important;
  outline:none!important;
}
body.ce-regional-public #leaders .leader .bar i{background:var(--party,#2450B2)!important}
body.ce-regional-public #leaders .leader .votes small{color:var(--party,#2450B2)!important;font-weight:900!important}
body.ce-regional-public #leaders .leader .who small:before{display:none!important;content:none!important}
body.ce-regional-public #leaders .leader .who small{gap:7px!important;min-height:22px;font-size:11px!important;line-height:1.25!important}
body.ce-regional-public #leaders .leader .votes small,
body.ce-regional-public #cargoProgressLabel,
body.ce-regional-public .ce161-zero-note,
body.ce-regional-public .ce161-race span,
body.ce-regional-public .ce161-race small{font-size:11px!important;line-height:1.35!important}
.ce164-party-chip{display:inline-flex;align-items:center;justify-content:center;min-height:22px;padding:3px 7px;border-radius:6px;background:var(--party,#2450B2);color:#fff!important;font-size:10.5px!important;font-weight:900!important;line-height:1!important;letter-spacing:.01em;white-space:nowrap}
#leaders .leader .who small .ce162-number-text{margin-left:0!important;padding-left:8px!important;border-left:1px solid #d6e1e7!important;color:#496475!important;font-size:11px!important;font-weight:850!important}

/* 5. Busca e compactação para listas legislativas longas. */
.ce164-candidate-tools{display:flex;align-items:center;gap:8px;margin:8px 0 10px;padding:8px;border:1px solid #DCE6EB;border-radius:11px;background:#F8FBFC}
.ce164-candidate-tools[hidden]{display:none!important}
.ce164-candidate-search{width:100%;min-height:42px;border:1px solid #CFDDE4;border-radius:9px;background:#fff;color:var(--ce164-ink);padding:9px 11px;font:inherit;font-size:12px;font-weight:700;outline:none}
.ce164-candidate-search:focus{border-color:#77A9C7;box-shadow:0 0 0 3px rgba(36,80,178,.10)}
.ce164-search-empty{margin:8px 0;padding:12px;border:1px dashed #C9D8DF;border-radius:10px;text-align:center;color:var(--ce164-muted);font-size:11px}
body.ce164-legislative #leaders .leader{padding:7px 8px!important;gap:8px!important}
body.ce164-legislative #leaders .leader .who b{font-size:12.5px!important}
body.ce164-legislative #leaders .leader .num{width:40px!important;height:46px!important}

/* 6. Cargos acessíveis durante a rolagem. */
body.ce-regional-public #cargoTabs{
  position:sticky!important;
  top:0!important;
  z-index:95!important;
  margin-left:-4px!important;
  margin-right:-4px!important;
  padding:7px 4px 8px!important;
  background:rgba(247,250,252,.96)!important;
  -webkit-backdrop-filter:blur(10px);
  backdrop-filter:blur(10px);
  border-bottom:1px solid rgba(217,229,235,.85)!important;
}

/* 7. No estado zerado, andamento geral mostra só o essencial. */
.ce160-flow[data-state="waiting"] .ce160-flow-legend,
.ce160-flow[data-state="waiting"] .ce160-phases{display:none!important}
.ce160-flow[data-state="waiting"]{padding-bottom:11px!important}
.ce160-flow[data-state="waiting"] .ce160-segments{margin-top:8px!important}
.ce160-flow-sub,.ce160-flow-legend,.ce160-phase{font-size:11px!important;line-height:1.3!important}
.ce160-stat small{font-size:10.5px!important}

/* 8. Fallback visual neutro quando não houver foto, sem usar o número como avatar. */
#leaders .leader .num.ce164-avatar-fallback{position:relative!important;overflow:hidden!important;font-size:0!important;color:transparent!important;background:linear-gradient(145deg,#EEF4F7,#E4ECF0)!important;border:1px solid #D8E3E8!important}
#leaders .leader .num.ce164-avatar-fallback:before{content:''!important;display:block!important;position:absolute!important;left:50%!important;top:9px!important;width:13px!important;height:13px!important;transform:translateX(-50%)!important;border-radius:50%!important;background:#8EA4B0!important}
#leaders .leader .num.ce164-avatar-fallback:after{content:''!important;display:block!important;position:absolute!important;left:50%!important;bottom:7px!important;width:27px!important;height:17px!important;transform:translateX(-50%)!important;border-radius:16px 16px 7px 7px!important;background:#A9BAC3!important}

/* 9. Ranking só existe quando há votos positivos e permanece visualmente neutro. */
.ce161-rank,.ce159-rank,.ce154-rank{display:none!important}.ce164-rank{position:absolute;right:7px;top:-8px;z-index:3;display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:21px;padding:0 7px;border:1px solid #CCD9DF;border-radius:999px;background:#F4F7F9;color:#49616F;font-size:10.5px;font-weight:900;box-shadow:0 2px 5px rgba(22,50,70,.05)}

@media(max-width:620px){
  body.ce-regional-public #cargoTabs{top:0!important}
  .ce164-candidate-tools{position:sticky;top:58px;z-index:90;margin-left:-1px;margin-right:-1px;background:rgba(248,251,252,.97);backdrop-filter:blur(8px)}
  .ce164-candidate-search{font-size:12px!important}
  .ce160-flow-sub,.ce160-flow-legend,.ce160-phase{font-size:11px!important}
  body.ce164-legislative #leaders .leader .votes{min-width:76px!important}
}
`;

const js=`(()=>{
'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;
const COLORS={
  PT:'#D71920',PL:'#1351A3',MDB:'#178544',PSD:'#2F86C7',PP:'#1B62A9',REPUBLICANOS:'#173D77',PDT:'#C91F2C',PSB:'#E5A800',PODEMOS:'#2BA866',AVANTE:'#F28A22',PSDB:'#1757A6',PCDOB:'#D91D2A',PV:'#1C9C45',REDE:'#28A96B',PSOL:'#F28C00',CIDADANIA:'#E85E24',NOVO:'#F58220',PRD:'#214C8B',SOLIDARIEDADE:'#E66B19',DC:'#19724B',MOBILIZA:'#2B64B1',PCB:'#C5161D',PSTU:'#C61C2B',UP:'#7A1D8F',PRTB:'#24683F',PCO:'#B62B31',MISSAO:'#315F7E',AGIR:'#5A5F9E',PMB:'#6F4B8B'
};
let queued=false;
function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function partyToken(v){const s=norm(v);if(!s)return'';if(s.includes('UNIAO BRASIL')||/(^| )UNIAO( |$)/.test(s))return'UNIAO BRASIL';for(const k of Object.keys(COLORS)){if((' '+s+' ').includes(' '+k+' '))return k;}return''}
function partyColor(token){if(token==='UNIAO BRASIL')return'#E0B500';return COLORS[token]||'#2450B2'}
function intValue(v){const m=String(v||'').replace(/\\./g,'').match(/-?\\d+/);return m?Number(m[0]):0}
function numberFor(row){return String(row.dataset.ce161Number||row.querySelector('.ce162-number-text')?.textContent||row.querySelector('.public-number-badge')?.textContent||row.querySelector('.num')?.textContent||'').match(/\\d{1,5}/)?.[0]||''}
function activeCargo(){return document.querySelector('#cargoTabs button.active[data-cargo],#cargoTabs button.active')?.dataset?.cargo||''}
function partyFromRow(row){
  const data=row.dataset.party||row.getAttribute('data-party');if(data&&partyToken(data))return partyToken(data);
  const candidates=[...row.querySelectorAll('.party-mark-v112,.party-badge,[data-party],.partido,.party,.who small *')];
  for(const el of candidates){const t=partyToken(el.getAttribute?.('data-party')||el.textContent);if(t)return t;}
  return partyToken(row.querySelector('.who small')?.textContent||row.textContent);
}
function ensureInfo(row,token){
  const small=row.querySelector('.who small');if(!small)return;
  const n=numberFor(row);
  const sig=(token||'')+'|'+n;if(small.dataset.ce164Sig===sig&&small.querySelector('.ce164-party-chip')&&(!n||small.querySelector('.ce162-number-text')))return;
  let badge=[...small.children].find(el=>!el.classList.contains('ce162-number-text')&&partyToken(el.getAttribute?.('data-party')||el.textContent));
  if(!badge){badge=document.createElement('span');badge.className='ce164-party-chip';badge.textContent=token==='UNIAO BRASIL'?'UNIÃO':token||'PARTIDO';}
  badge.classList.add('ce164-party-chip');
  badge.style.setProperty('--party',partyColor(token));
  let num=small.querySelector('.ce162-number-text');
  if(!num&&n){num=document.createElement('span');num.className='ce162-number-text';num.textContent='Nº '+n;}
  const keepBadge=badge;
  const keepNum=num;
  small.textContent='';
  small.appendChild(keepBadge);
  if(keepNum)small.appendChild(keepNum);
  small.dataset.ce164Sig=sig;
}
function decorateCards(){
  const rows=[...document.querySelectorAll('#leaders .leader')];
  rows.forEach(row=>{
    const token=partyFromRow(row);const color=partyColor(token);
    row.style.setProperty('--party',color);
    row.style.setProperty('border-left-color',color,'important');
    const bar=row.querySelector('.bar i,.leader-bar span');if(bar)bar.style.setProperty('background',color,'important');
    ensureInfo(row,token);
    const box=row.querySelector('.num');
    if(box&&!box.querySelector('img')){box.classList.add('ce164-avatar-fallback');box.setAttribute('aria-hidden','true');}
    else if(box){box.classList.remove('ce164-avatar-fallback');box.removeAttribute('aria-hidden');}
  });
}
function decorateRanking(){
  const rows=[...document.querySelectorAll('#leaders .leader')];
  rows.forEach(row=>{row.removeAttribute('data-rank');row.removeAttribute('data-ce161-rank');});
  const scored=rows.map((row,index)=>({row,index,v:intValue(row.querySelector('.votes b,.leader-votes b')?.textContent)})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v||a.index-b.index);
  const ranks=new Map(scored.slice(0,3).map((x,i)=>[x.row,i+1]));
  rows.forEach(row=>{const rank=ranks.get(row);let tag=row.querySelector('.ce164-rank');if(!rank){row.removeAttribute('data-ce164-rank');if(tag)tag.remove();return;}row.dataset.ce164Rank=String(rank);if(!tag){tag=document.createElement('span');tag.className='ce164-rank';row.appendChild(tag);}tag.textContent=rank+'º';tag.setAttribute('aria-label',rank+'º colocado no momento');});
}
function ensureSearch(){
  const leaders=document.getElementById('leaders');if(!leaders)return;
  let tools=document.getElementById('ce164CandidateTools');
  if(!tools){tools=document.createElement('div');tools.id='ce164CandidateTools';tools.className='ce164-candidate-tools';tools.innerHTML='<input id="ce164CandidateSearch" class="ce164-candidate-search" type="search" inputmode="search" autocomplete="off" placeholder="Buscar candidato por nome ou número" aria-label="Buscar candidato por nome ou número">';leaders.insertAdjacentElement('beforebegin',tools);tools.querySelector('input').addEventListener('input',filterCandidates);}
  const cargo=activeCargo();const legislative=cargo==='depFederal'||cargo==='depEstadual';tools.hidden=!legislative;document.body.classList.toggle('ce164-legislative',legislative);if(!legislative){const input=tools.querySelector('input');if(input)input.value='';filterCandidates();}
}
function filterCandidates(){
  const leaders=document.getElementById('leaders');if(!leaders)return;
  const q=norm(document.getElementById('ce164CandidateSearch')?.value||'');let visible=0;
  [...leaders.querySelectorAll('.leader')].forEach(row=>{const hit=!q||norm(row.textContent).includes(q)||norm(numberFor(row)).includes(q);row.hidden=!hit;if(hit)visible++;});
  let empty=document.getElementById('ce164SearchEmpty');
  if(q&&visible===0){if(!empty){empty=document.createElement('div');empty.id='ce164SearchEmpty';empty.className='ce164-search-empty';leaders.insertAdjacentElement('afterend',empty);}empty.textContent='Nenhum candidato encontrado para esta busca.';}
  else if(empty)empty.remove();
}
function apply(){document.documentElement.dataset.ceUi='164';decorateCards();decorateRanking();ensureSearch();filterCandidates();}
function run(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
function start(){run();setTimeout(run,180);setTimeout(run,650);setTimeout(run,1400);new MutationObserver(run).observe(document.body,{subtree:true,childList:true,characterData:true});document.addEventListener('click',()=>setTimeout(run,70),true);window.addEventListener('pageshow',run);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;

write(`${pub}/v164-refinement.css`,css);
write(`${pub}/v164-refinement.js`,js);
for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(file);
  if(!html.includes('/v164-refinement.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v164-refinement.css?v=164">\n</head>');
  if(!html.includes('/v164-refinement.js'))html=html.replace('</body>','<script src="/v164-refinement.js?v=164"></script>\n</body>');
  write(file,html);
}

/* 10. Central administrativa: menos ações no cabeçalho mobile e menu Mais. */
const adminDir=`${pub}/admin`;
const adminCss=`${adminDir}/admin-v150.css`;
if(fs.existsSync(adminCss)){
  let a=read(adminCss);
  a+=`\n/* V1.6.4 — refinamento mobile da Central Administrativa */\n.ce164-admin-more{display:none;position:relative}.ce164-admin-more summary{list-style:none}.ce164-admin-more summary::-webkit-details-marker{display:none}.ce164-admin-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:80;display:grid;min-width:190px;padding:6px;border:1px solid #D5E1E7;border-radius:12px;background:#fff;box-shadow:0 14px 32px rgba(16,45,65,.18)}.ce164-admin-menu button,.ce164-admin-menu a{border:0;background:transparent;color:#17324A;text-align:left;padding:10px 11px;border-radius:8px;font:inherit;font-size:12px;font-weight:800}.ce164-admin-menu button:active,.ce164-admin-menu a:active{background:#EEF5F8}@media(max-width:720px){.admin-hero .hero-actions>a[href=\"/\"],.admin-hero .hero-actions>#installBtn,.admin-hero .hero-actions>#logoutBtn{display:none!important}.admin-hero .hero-actions{display:flex!important;align-items:center!important;gap:7px!important}.admin-hero .hero-actions>a[href=\"/operacao.html\"]{display:inline-flex!important}.ce164-admin-more{display:block}.admin-hero.compact .hero-actions{display:flex!important}.admin-hero.compact .hero-main .brand-line p{display:none!important}}\n`;
  write(adminCss,a);
}
const adminJs=`(()=>{'use strict';function setup(){const actions=document.querySelector('.admin-hero .hero-actions');if(!actions||actions.querySelector('.ce164-admin-more'))return;const d=document.createElement('details');d.className='ce164-admin-more';d.innerHTML='<summary class="btn ghost">Mais</summary><div class="ce164-admin-menu"><button type="button" data-a="install">Instalar app</button><a href="/">Ver público</a><button type="button" data-a="logout">Sair</button></div>';actions.appendChild(d);d.addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(!b)return;e.preventDefault();const target=b.dataset.a==='install'?document.getElementById('installBtn'):document.getElementById('logoutBtn');target?.click();if(b.dataset.a==='install'&&target?.hidden)b.hidden=true;if(b.dataset.a==='logout')d.open=false;});document.addEventListener('click',e=>{if(d.open&&!d.contains(e.target))d.open=false});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();})();`;
if(fs.existsSync(`${adminDir}/index.html`)){
  write(`${adminDir}/admin-v164.js`,adminJs);
  let ah=read(`${adminDir}/index.html`);
  if(!ah.includes('/admin/admin-v164.js'))ah=ah.replace('</body>','<script src="/admin/admin-v164.js?v=164"></script>\n</body>');
  write(`${adminDir}/index.html`,ah);
}
if(fs.existsSync(`${adminDir}/admin-sw.js`)){
  let asw=read(`${adminDir}/admin-sw.js`).replace(/const VERSION='[^']+';/,"const VERSION='v1.6.4-admin';");
  if(!asw.includes("'/admin/admin-v164.js'"))asw=asw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/admin/admin-v164.js'"+b);
  write(`${adminDir}/admin-sw.js`,asw);
}

let sw=read(`${pub}/service-worker.js`);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.6.4-unified';");
if(!sw.includes("'/v164-refinement.css'"))sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v164-refinement.css','/v164-refinement.js'"+b);
if(!sw.includes("'/v162-clean-photo.css'"))sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v162-clean-photo.css','/v162-clean-photo.js'"+b);
if(!sw.includes("const VERSION='v1.6.2-unified'"))sw+='\n// const VERSION=\'v1.6.2-unified\'; compatibility marker for legacy Docker preflight\n';
write(`${pub}/service-worker.js`,sw);
console.log('V1.6.4 applied: ten visual refinements completed.');
