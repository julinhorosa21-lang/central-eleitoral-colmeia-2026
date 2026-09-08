import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* Neutraliza na origem o destaque legado que marcava os primeiros cards por posição. */
const legacyJs=`${pub}/v153-regional-theme.js`;
if(fs.existsSync(legacyJs)){
  let s=read(legacyJs);
  s=s.replace("if(i<3)r.setAttribute('data-rank',String(i+1))","r.removeAttribute('data-rank')");
  write(legacyJs,s);
}
const legacyCss=`${pub}/v153-regional-theme.css`;
if(fs.existsSync(legacyCss)){
  let s=read(legacyCss);
  s += `\n/* V1.6.6 — neutralidade dos cards */\nbody.ce-regional-public #leaders .leader,body.ce-regional-public #leaders .leader:first-child,body.ce-regional-public #leaders .leader[data-rank=\"1\"],body.ce-regional-public #leaders .leader[data-ce161-rank=\"1\"],body.ce-regional-public #leaders .leader[data-ce164-rank=\"1\"]{border-top-color:#D9E5EB!important;border-right-color:#D9E5EB!important;border-bottom-color:#D9E5EB!important;outline:none!important;box-shadow:0 3px 10px rgba(22,65,93,.045)!important}\n`;
  write(legacyCss,s);
}

const js=`(()=>{
'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;
const COLORS={PT:'#D71920',PL:'#1351A3',MDB:'#178544',PSD:'#2F86C7',PP:'#1B62A9',REPUBLICANOS:'#173D77',PDT:'#C91F2C',PSB:'#E5A800',PODEMOS:'#2BA866',AVANTE:'#F28A22',PSDB:'#1757A6',PCDOB:'#D91D2A',PV:'#1C9C45',REDE:'#28A96B',PSOL:'#F28C00',CIDADANIA:'#E85E24',NOVO:'#F58220',PRD:'#214C8B',SOLIDARIEDADE:'#E66B19',DC:'#19724B',MOBILIZA:'#2B64B1',PCB:'#C5161D',PSTU:'#C61C2B',UP:'#7A1D8F',PRTB:'#24683F',PCO:'#B62B31',MISSAO:'#315F7E',AGIR:'#5A5F9E',PMB:'#6F4B8B'};
let catalog=null,queued=false;
function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function token(v){const s=norm(v);if(!s)return'';if(s.includes('UNIAO BRASIL')||/(^| )UNIAO( |$)/.test(s))return'UNIAO BRASIL';for(const k of Object.keys(COLORS))if((' '+s+' ').includes(' '+k+' '))return k;return''}
function color(t){if(t==='UNIAO BRASIL')return'#E0B500';return COLORS[t]||'#2450B2'}
function label(v){const t=token(v);if(t==='UNIAO BRASIL')return'UNIÃO';if(t==='MISSAO')return'MISSÃO';if(t==='PCDOB')return'PCdoB';if(t)return t;const s=String(v||'').trim();return s||'PARTIDO'}
function activeCargo(){return document.querySelector('#cargoTabs button.active[data-cargo],#cargoTabs button.active')?.dataset?.cargo||''}
function numberFor(row){return String(row.dataset.ce161Number||row.querySelector('.ce162-number-text')?.textContent||row.querySelector('.public-number-badge')?.textContent||row.querySelector('.num')?.textContent||'').match(/\\d{1,5}/)?.[0]||''}
function candidate(cargo,n){const rows=catalog?.candidates?.[cargo];if(!Array.isArray(rows))return null;return rows.find(c=>String(c.numero||'').trim()===String(n).trim())||null}
function fix(){
 const cargo=activeCargo();
 document.querySelectorAll('#leaders .leader').forEach(row=>{
  row.removeAttribute('data-rank');row.removeAttribute('data-ce161-rank');
  const n=numberFor(row);const c=candidate(cargo,n);const chip=row.querySelector('.ce164-party-chip,.party-mark-v112,.party-badge');if(!chip)return;
  const source=c?.partido||chip.getAttribute('data-party')||row.getAttribute('data-party')||chip.textContent;
  const text=label(source);const t=token(source);const p=color(t);
  if(chip.textContent!==text)chip.textContent=text;
  chip.classList.add('ce164-party-chip');chip.setAttribute('data-party',text);chip.setAttribute('title','Partido '+text);chip.setAttribute('aria-label','Partido '+text);chip.style.setProperty('--party',p);
  row.style.setProperty('--party',p);row.style.setProperty('border-left-color',p,'important');
  row.style.setProperty('border-top-color','#D9E5EB','important');row.style.setProperty('border-right-color','#D9E5EB','important');row.style.setProperty('border-bottom-color','#D9E5EB','important');row.style.setProperty('box-shadow','0 3px 10px rgba(22,65,93,.045)','important');
  const bar=row.querySelector('.bar i,.leader-bar span');if(bar)bar.style.setProperty('background',p,'important');
 });
}
function run(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fix()})}
async function load(){try{const r=await fetch('/api/candidates',{cache:'no-store'});if(r.ok){const j=await r.json();catalog=j.snapshot||j}}catch{}if(!catalog?.candidates){try{const r=await fetch('/data/candidate-catalog.json',{cache:'no-store'});if(r.ok)catalog=await r.json()}catch{}}run();setTimeout(run,250);setTimeout(run,900)}
function install(){load();new MutationObserver(run).observe(document.body,{subtree:true,childList:true,characterData:true});document.addEventListener('click',()=>setTimeout(run,90),true);window.addEventListener('pageshow',run)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();`;

write(`${pub}/v165-party-label-fix.js`,js);
for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(file);
  html=html.replace(/\/v165-party-label-fix\.js\?v=\d+/g,'/v165-party-label-fix.js?v=166');
  if(!html.includes('/v165-party-label-fix.js'))html=html.replace('</body>','<script src="/v165-party-label-fix.js?v=166"></script>\n</body>');
  write(file,html);
}
let sw=read(`${pub}/service-worker.js`);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.6.5-unified';");
write(`${pub}/service-worker.js`,sw);
console.log('V1.6.6 applied: party labels corrected and positional yellow highlight removed.');
