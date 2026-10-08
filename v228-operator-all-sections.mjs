import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const SERVER=APP+'/server.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(SERVER);

/* CE228_OPERATOR_ALL_SECTIONS
   Operadores autenticados podem registrar BUs de qualquer seção válida.
   A identificação do operador e a trilha de auditoria continuam intactas. */
const whoOld="return json(res,200,{ok:true,user:{name:user.name,role:user.role,sections:user.sections,places:user.places}});";
const whoNew="/* CE228_OPERATOR_ALL_SECTIONS */ const ce228IsOperator=String(user.role||'').toLowerCase()!=='admin';const ce228AllSections=[...sectionToPlace.keys()].map(Number).filter(Number.isFinite).sort((a,b)=>a-b);const ce228Sections=ce228IsOperator?ce228AllSections:user.sections;const ce228Places=ce228IsOperator?[...new Set(ce228AllSections.map(s=>sectionToPlace.get(s)).filter(Boolean))]:user.places;return json(res,200,{ok:true,user:{name:user.name,role:user.role,sections:ce228Sections,places:ce228Places,scope:ce228IsOperator?'all_sections':'admin'}});";
if(!server.includes('CE228_OPERATOR_ALL_SECTIONS')){
  if(!server.includes(whoOld))throw new Error('V228: /api/whoami anchor missing');
  server=server.replace(whoOld,whoNew);
}

const guardNeedle="if(!canWrite(user,section)){";
if(!server.includes('CE228_GLOBAL_OPERATOR_WRITE')){
  if(!server.includes(guardNeedle))throw new Error('V228: canWrite guard missing');
  server=server.replace(
    guardNeedle,
    "/* CE228_GLOBAL_OPERATOR_WRITE */ const ce228GlobalOperator=String(user.role||'').toLowerCase()!=='admin';if(!ce228GlobalOperator&&!canWrite(user,section)){"
  );
}
write(SERVER,server);

const js=`(()=>{'use strict';
if(location.pathname!=='/operacao.html')return;
/* CE228_OPERATOR_ALL_SECTIONS_UI */
const nativeFetch=window.fetch.bind(window);
let operatorGlobal=false,placesPromise=null;

function norm(v){return String(v??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase()}
function loadPlaces(){
  if(placesPromise)return placesPromise;
  placesPromise=fetch('/data/locais-colmeia.json',{cache:'no-store'}).then(async r=>{
    if(!r.ok)throw new Error('places_unavailable');
    const j=await r.json();
    const rows=Array.isArray(j)?j:(j.locais||j.places||j.items||[]);
    const out=[];
    for(const p of rows){
      const name=String(p?.nome||p?.name||p?.local||p?.titulo||p?.title||p?.id||'').trim();
      const secs=Array.isArray(p?.secoes)?p.secoes:Array.isArray(p?.sections)?p.sections:[];
      for(const s of secs){
        const n=Number(typeof s==='object'?(s.numero??s.section??s.secao):s);
        if(Number.isFinite(n))out.push({section:n,place:name});
      }
    }
    const by=new Map();
    for(const x of out)if(!by.has(x.section))by.set(x.section,x);
    return [...by.values()].sort((a,b)=>a.section-b.section);
  }).catch(()=>[]);
  return placesPromise;
}
function labelForSelect(sel){
  const id=sel.id;
  if(id){
    const lab=document.querySelector('label[for="'+CSS.escape(id)+'"]');
    if(lab)return norm(lab.textContent);
  }
  return norm(sel.closest('label')?.textContent||sel.parentElement?.textContent||'');
}
function isSectionSelect(sel){
  const meta=norm([sel.id,sel.name,sel.getAttribute('aria-label'),sel.getAttribute('title'),labelForSelect(sel)].join(' '));
  if(/secao|seção|section/.test(meta))return true;
  const opts=[...sel.options];
  const numeric=opts.filter(o=>/^\\s*(?:se[cç][aã]o\\s*)?\\d{1,3}(?:\\s|$)/i.test(String(o.textContent||''))).length;
  return numeric>=2;
}
async function expand(){
  if(!operatorGlobal)return;
  const rows=await loadPlaces();if(!rows.length)return;
  const selects=[...document.querySelectorAll('select')].filter(isSectionSelect);
  for(const sel of selects){
    const old=String(sel.value||'');
    const placeholder=[...sel.options].find(o=>!String(o.value||'').trim()||/selecione|escolha/i.test(o.textContent||''))?.cloneNode(true);
    const frag=document.createDocumentFragment();
    if(placeholder)frag.appendChild(placeholder);
    for(const x of rows){
      const o=document.createElement('option');
      o.value=String(x.section);
      o.textContent='Seção '+String(x.section).padStart(2,'0')+(x.place?' · '+x.place:'');
      frag.appendChild(o);
    }
    sel.replaceChildren(frag);
    if(rows.some(x=>String(x.section)===old))sel.value=old;
    sel.dataset.ce228AllSections='1';
    const box=sel.closest('.field,.form-group,label,div');
    if(box&&!box.querySelector('.ce228-all-sections-note')){
      const note=document.createElement('small');
      note.className='ce228-all-sections-note';
      note.textContent='Chave de operador: todas as seções disponíveis.';
      box.appendChild(note);
    }
  }
}
function acceptUser(j){
  const u=j?.user||j;
  if(!u||String(u.role||'').toLowerCase()==='admin')return;
  operatorGlobal=u.scope==='all_sections'||Array.isArray(u.sections);
  if(operatorGlobal){expand();setTimeout(expand,120);setTimeout(expand,600)}
}
window.fetch=async function(input,init={}){
  const r=await nativeFetch(input,init);
  try{
    const u=new URL(input instanceof Request?input.url:input,location.href);
    if(u.origin===location.origin&&u.pathname==='/api/whoami'&&r.ok)acceptUser(await r.clone().json());
  }catch{}
  return r;
};
async function bootstrap(){
  const token=window.__CE_TEAM_TOKEN||sessionStorage.getItem('ce_team_token')||'';
  if(token){
    try{const r=await nativeFetch('/api/whoami',{cache:'no-store',headers:{Authorization:'Bearer '+token}});if(r.ok)acceptUser(await r.json())}catch{}
  }
  const mo=new MutationObserver(()=>{if(operatorGlobal)requestAnimationFrame(expand)});
  mo.observe(document.documentElement,{childList:true,subtree:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bootstrap,{once:true}):bootstrap();
})();`;
write(PUB+'/v228-operator-all-sections.js',js);
new Function(js);

const css=`.ce228-all-sections-note{display:block;margin-top:5px;color:#577487;font-size:9px;line-height:1.35;font-weight:700}`;
write(PUB+'/v228-operator-all-sections.css',css);

const op=PUB+'/operacao.html';
let h=read(op);
if(!h.includes('/v228-operator-all-sections.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v228-operator-all-sections.css?v=228">\\n</head>');
if(!h.includes('/v228-operator-all-sections.js'))h=h.replace('</body>','<script src="/v228-operator-all-sections.js?v=228"></script>\\n</body>');
write(op,h);

const installFile=PUB+'/v135-install.js';
if(fs.existsSync(installFile)){
  let s=read(installFile).replaceAll('/service-worker.js?v=227','/service-worker.js?v=228');
  if(!s.includes('/service-worker.js?v=228'))throw new Error('V228: SW registration cachebuster missing');
  write(installFile,s);
}
for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;if(!fs.existsSync(p))continue;
  let s=read(p).replaceAll('/v135-install.js?v=227','/v135-install.js?v=228');
  if(!s.includes('/v135-install.js?v=228'))throw new Error('V228: installer cachebuster missing in '+rel);
  write(p,s);
}

const swFile=PUB+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.1.8-operator-all-sections';");
if(!sw.includes("'/v228-operator-all-sections.js'"))sw=sw.replace('const CORE=[',"const CORE=['/v228-operator-all-sections.css','/v228-operator-all-sections.js',");
write(swFile,sw);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));j.version='2.1.8';write(pkg,JSON.stringify(j,null,2)+'\\n');
}

const finalServer=read(SERVER),finalOp=read(op);
if(!finalServer.includes('CE228_OPERATOR_ALL_SECTIONS'))throw new Error('V228: global operator whoami missing');
if(!finalServer.includes('CE228_GLOBAL_OPERATOR_WRITE'))throw new Error('V228: global operator write guard missing');
if(!finalOp.includes('/v228-operator-all-sections.js'))throw new Error('V228: operator UI script missing');
if(!read(swFile).includes("v2.1.8-operator-all-sections"))throw new Error('V228: service worker mismatch');
console.log('V2.1.8 operator scope passed: authenticated operator can select and write any valid section.');
