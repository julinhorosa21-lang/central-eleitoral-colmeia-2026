import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* Mantém neutralidade visual dos cards, sem destaque por posição. */
const legacyJs=`${pub}/v153-regional-theme.js`;
if(fs.existsSync(legacyJs)){
  let s=read(legacyJs);
  s=s.replace("if(i<3)r.setAttribute('data-rank',String(i+1))","r.removeAttribute('data-rank')");
  write(legacyJs,s);
}
const legacyCss=`${pub}/v153-regional-theme.css`;
if(fs.existsSync(legacyCss)){
  let s=read(legacyCss);
  s += `\n/* V1.6.7 — neutralidade dos cards */\nbody.ce-regional-public #leaders .leader,body.ce-regional-public #leaders .leader:first-child,body.ce-regional-public #leaders .leader[data-rank=\"1\"],body.ce-regional-public #leaders .leader[data-ce161-rank=\"1\"],body.ce-regional-public #leaders .leader[data-ce164-rank=\"1\"]{border-top-color:#D9E5EB!important;border-right-color:#D9E5EB!important;border-bottom-color:#D9E5EB!important;outline:none!important;box-shadow:0 3px 10px rgba(22,65,93,.045)!important}\n`;
  write(legacyCss,s);
}

const js=`(()=>{
'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;
const CARGOS=['presidente','governador','senador','depFederal','depEstadual'];
const COLORS={PT:'#D71920',PL:'#1351A3',MDB:'#178544',PSD:'#2F86C7',PP:'#1B62A9',REPUBLICANOS:'#173D77',PDT:'#C91F2C',PSB:'#E5A800',PODEMOS:'#2BA866',AVANTE:'#F28A22',PSDB:'#1757A6',PCDOB:'#D91D2A',PV:'#1C9C45',REDE:'#28A96B',PSOL:'#F28C00',CIDADANIA:'#E85E24',NOVO:'#F58220',PRD:'#214C8B',SOLIDARIEDADE:'#E66B19',DC:'#19724B',MOBILIZA:'#2B64B1',PCB:'#C5161D',PSTU:'#C61C2B',UP:'#7A1D8F',PRTB:'#24683F',PCO:'#B62B31',MISSAO:'#315F7E',AGIR:'#5A5F9E',PMB:'#6F4B8B'};
let fetched=null,queued=false;
function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function token(v){const s=norm(v);if(!s)return'';if(s.includes('UNIAO BRASIL')||/(^| )UNIAO( |$)/.test(s))return'UNIAO BRASIL';for(const k of Object.keys(COLORS))if((' '+s+' ').includes(' '+k+' '))return k;return''}
function label(v){const t=token(v);if(t==='UNIAO BRASIL')return'UNIÃO';if(t==='MISSAO')return'MISSÃO';if(t==='PCDOB')return'PCdoB';return t||String(v||'').trim()||'PARTIDO'}
function color(v){const t=token(v);if(t==='UNIAO BRASIL')return'#E0B500';return COLORS[t]||'#2450B2'}
function activeCargo(){
 const b=document.querySelector('#cargoTabs button.active[data-cargo],.cargo-tabs button.active[data-cargo],[data-cargo].active');
 if(b?.dataset?.cargo)return b.dataset.cargo;
 const title=norm(document.getElementById('cargoTitle')?.textContent||document.querySelector('.results-head h2,.results-head h3')?.textContent||'');
 if(title.includes('GOVERNADOR'))return'governador';if(title.includes('SENADOR'))return'senador';if(title.includes('DEPUTADO FEDERAL'))return'depFederal';if(title.includes('DEPUTADO ESTADUAL'))return'depEstadual';return'presidente';
}
function numberFor(row){return String(row.dataset.ce161Number||row.querySelector('.ce162-number-text')?.textContent||row.querySelector('.public-number-badge')?.textContent||row.querySelector('.num')?.textContent||'').match(/\\d{1,5}/)?.[0]||''}
function rowsLocal(k){try{return typeof CANDIDATOS!=='undefined'&&Array.isArray(CANDIDATOS?.[k])?CANDIDATOS[k]:[]}catch{return[]}}
function rowsFetched(k){return fetched?.candidates&&Array.isArray(fetched.candidates[k])?fetched.candidates[k]:[]}
function partyOf(c){return c?.partido||c?.siglaPartido||c?.sgPartido||c?.partidoSigla||c?.sigla||''}
function findIn(rows,n){return rows.find(c=>String(c?.numero??c?.nrCandidato??'').trim()===String(n).trim())||null}
function candidateFor(cargo,n){
 let c=findIn(rowsLocal(cargo),n)||findIn(rowsFetched(cargo),n);if(c)return c;
 for(const k of CARGOS){c=findIn(rowsLocal(k),n)||findIn(rowsFetched(k),n);if(c&&partyOf(c))return c}
 return null;
}
function ensureChip(row){
 const small=row.querySelector('.who small');if(!small)return null;
 let chip=small.querySelector('.ce167-party-chip,.ce164-party-chip,.party-mark-v112,.party-badge,[data-party]');
 if(!chip){chip=document.createElement('span');chip.className='ce167-party-chip';small.prepend(chip)}
 return chip;
}
function fix(){
 const cargo=activeCargo();
 document.querySelectorAll('#leaders .leader').forEach(row=>{
   row.removeAttribute('data-rank');row.removeAttribute('data-ce161-rank');
   const n=numberFor(row),c=candidateFor(cargo,n),chip=ensureChip(row);if(!chip)return;
   const source=partyOf(c)||row.getAttribute('data-party-full')||chip.getAttribute('data-party-full')||chip.getAttribute('data-party')||row.getAttribute('data-party')||chip.textContent;
   const text=label(source),p=color(source);
   if(text&&chip.textContent!==text)chip.textContent=text;
   chip.classList.add('ce164-party-chip','ce167-party-chip');chip.setAttribute('data-party',text);chip.setAttribute('data-party-full',text);chip.setAttribute('title','Partido '+text);chip.setAttribute('aria-label','Partido '+text);chip.style.setProperty('--party',p);
   row.setAttribute('data-party-full',text);row.style.setProperty('--party',p);row.style.setProperty('border-left-color',p,'important');
   row.style.setProperty('border-top-color','#D9E5EB','important');row.style.setProperty('border-right-color','#D9E5EB','important');row.style.setProperty('border-bottom-color','#D9E5EB','important');row.style.setProperty('box-shadow','0 3px 10px rgba(22,65,93,.045)','important');
   const bar=row.querySelector('.bar i,.leader-bar span');if(bar)bar.style.setProperty('background',p,'important');
 });
}
function run(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fix()})}
function extract(j){if(j?.available&&j?.snapshot)return j.snapshot;if(j?.snapshot?.candidates)return j.snapshot;if(j?.candidates)return j;return null}
async function loadFetched(){
 try{const r=await fetch('/api/candidates',{cache:'no-store'});if(r.ok)fetched=extract(await r.json())}catch{}
 if(!fetched){try{const r=await fetch('/data/candidate-catalog.json',{cache:'no-store'});if(r.ok)fetched=extract(await r.json())}catch{}}
 run();
}
function start(){loadFetched();run();[120,350,800,1600,3000].forEach(ms=>setTimeout(run,ms));new MutationObserver(run).observe(document.body,{subtree:true,childList:true,characterData:true});document.addEventListener('click',()=>setTimeout(run,80),true);window.addEventListener('pageshow',run)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;

write(`${pub}/v165-party-label-fix.js`,js);
for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(file);
  html=html.replace(/\/v165-party-label-fix\.js\?v=\d+/g,'/v165-party-label-fix.js?v=167');
  if(!html.includes('/v165-party-label-fix.js'))html=html.replace('</body>','<script src="/v165-party-label-fix.js?v=167"></script>\n</body>');
  write(file,html);
}
let sw=read(`${pub}/service-worker.js`);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.6.5-unified';");
if(!sw.includes("'/v165-party-label-fix.js'"))sw=sw.replace('const CORE=[',"const CORE=['/v165-party-label-fix.js',");
sw += `\n// party-label-runtime-v167\n`;
write(`${pub}/service-worker.js`,sw);
console.log('V1.6.7 runtime applied: party labels resolve from local CANDIDATOS first, with fetched catalog fallback.');
