import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const SERVER=APP+'/server.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(SERVER);

/* V2.2.0 — CE230_ADMIN_ONLY_AUTH
   Somente a credencial administrativa permanece válida.
   As antigas credenciais por seção deixam de autenticar em qualquer rota. */
if(!server.includes('CE230_ADMIN_ONLY_AUTH')){
  const authNeedle='function auth(req)';
  const canWriteNeedle='function canWrite(';
  if(!server.includes(authNeedle))throw new Error('V230: auth function not found');
  if(!server.includes(canWriteNeedle))throw new Error('V230: canWrite function not found');

  server=server.replace(authNeedle,'function ce230LegacyAuth(req)');

  const wrapper=`
/* CE230_ADMIN_ONLY_AUTH */
function auth(req){
  const user=ce230LegacyAuth(req);
  if(!user || String(user.role||'').toLowerCase()!=='admin')return null;
  const sections=[...sectionToPlace.keys()].map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  const places=[...new Set(sections.map(s=>sectionToPlace.get(s)).filter(Boolean))];
  return {...user,role:'admin',sections,places,section:null,scope:'all_sections'};
}

`;
  server=server.replace(canWriteNeedle,wrapper+canWriteNeedle);
}

/* O /whoami deve declarar explicitamente o escopo global administrativo. */
if(server.includes("scope:ce228IsOperator?'all_sections':'admin'")){
  server=server.replace("scope:ce228IsOperator?'all_sections':'admin'","scope:'all_sections'");
}
write(SERVER,server);

const js=`(()=>{'use strict';
if(location.pathname!=='/operacao.html')return;
/* CE230_ADMIN_ALL_SECTIONS_UI */
const nativeFetch=window.fetch.bind(window);
let adminOk=false,rowsPromise=null;

function norm(v){return String(v??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase()}
function places(){
  if(rowsPromise)return rowsPromise;
  rowsPromise=nativeFetch('/data/locais-colmeia.json',{cache:'no-store'}).then(async r=>{
    if(!r.ok)throw new Error('places_unavailable');
    const j=await r.json();
    const list=Array.isArray(j)?j:(j.locais||j.places||j.items||[]);
    const out=[];
    for(const p of list){
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
  return rowsPromise;
}
function labelFor(sel){
  if(sel.id){
    const lab=document.querySelector('label[for="'+CSS.escape(sel.id)+'"]');
    if(lab)return norm(lab.textContent);
  }
  return norm(sel.closest('label')?.textContent||sel.parentElement?.textContent||'');
}
function sectionSelect(sel){
  const meta=norm([sel.id,sel.name,sel.getAttribute('aria-label'),sel.getAttribute('title'),labelFor(sel)].join(' '));
  if(/secao|seção|section/.test(meta))return true;
  return [...sel.options].filter(o=>/\\d{1,3}/.test(String(o.textContent||''))).length>=2;
}
async function expand(){
  if(!adminOk)return;
  const rows=await places();
  if(!rows.length)return;
  for(const sel of [...document.querySelectorAll('select')].filter(sectionSelect)){
    const old=String(sel.value||'');
    const ph=[...sel.options].find(o=>!String(o.value||'').trim()||/selecione|escolha/i.test(o.textContent||''))?.cloneNode(true);
    const frag=document.createDocumentFragment();
    if(ph)frag.appendChild(ph);
    for(const x of rows){
      const o=document.createElement('option');
      o.value=String(x.section);
      o.textContent='Seção '+String(x.section).padStart(2,'0')+(x.place?' · '+x.place:'');
      frag.appendChild(o);
    }
    sel.replaceChildren(frag);
    if(rows.some(x=>String(x.section)===old))sel.value=old;
    sel.dataset.ce230AllSections='1';
    const box=sel.closest('.field,.form-group,label,div');
    if(box){
      box.querySelectorAll('.ce228-all-sections-note,.ce230-all-sections-note').forEach(n=>n.remove());
      const note=document.createElement('small');
      note.className='ce230-all-sections-note';
      note.textContent='Chave administrativa · todas as 29 seções disponíveis.';
      box.appendChild(note);
    }
  }
}
function accept(j){
  const u=j?.user||j;
  if(!u)return;
  adminOk=String(u.role||'').toLowerCase()==='admin'&&u.scope==='all_sections';
  if(adminOk){expand();setTimeout(expand,120);setTimeout(expand,600)}
}
window.fetch=async function(input,init={}){
  const r=await nativeFetch(input,init);
  try{
    const u=new URL(input instanceof Request?input.url:input,location.href);
    if(u.origin===location.origin&&u.pathname==='/api/whoami'){
      if(r.ok)accept(await r.clone().json());
      else if(r.status===401||r.status===403)adminOk=false;
    }
  }catch{}
  return r;
};
async function bootstrap(){
  const token=window.__CE_TEAM_TOKEN||sessionStorage.getItem('ce_admin_token')||sessionStorage.getItem('ce_team_token')||'';
  if(token){
    try{
      const r=await nativeFetch('/api/whoami',{cache:'no-store',headers:{Authorization:'Bearer '+token}});
      if(r.ok)accept(await r.json());
    }catch{}
  }
  new MutationObserver(()=>{if(adminOk)requestAnimationFrame(expand)}).observe(document.documentElement,{childList:true,subtree:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bootstrap,{once:true}):bootstrap();
})();`;
write(PUB+'/v230-admin-only.js',js);
new Function(js);

const css=`.ce230-all-sections-note{display:block;margin-top:5px;color:#526c7d;font-size:9px;line-height:1.35;font-weight:800}`;
write(PUB+'/v230-admin-only.css',css);

let op=read(PUB+'/operacao.html');
op=op.replace(/chave do operador/gi,'chave administrativa');
op=op.replace(/chave de operador/gi,'chave administrativa');
op=op.replace(/chave da seção/gi,'chave administrativa');
if(!op.includes('/v230-admin-only.css'))op=op.replace('</head>','<link rel="stylesheet" href="/v230-admin-only.css?v=230">\n</head>');
if(!op.includes('/v230-admin-only.js'))op=op.replace('</body>','<script src="/v230-admin-only.js?v=230"></script>\n</body>');
write(PUB+'/operacao.html',op);

/* Atualiza os textos de acesso público sem alterar a chave administrativa existente. */
for(const rel of ['v150-unified.js','v151-team.js']){
  const p=PUB+'/'+rel;
  if(!fs.existsSync(p))continue;
  let s=read(p);
  s=s.replace(/Ler e registrar o BU da seção com a chave do operador\./g,'Ler e registrar BUs com a chave administrativa.');
  s=s.replace(/Digite sua chave\. O sistema identifica automaticamente se o acesso é de operador ou de coordenação\./g,'Digite a chave administrativa da Central.');
  s=s.replace(/Entrar com chave de operador ou coordenação/g,'Entrar com a chave administrativa');
  write(p,s);
}

const swFile=PUB+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.2.0-admin-only';");
if(!sw.includes("'/v230-admin-only.js'"))sw=sw.replace('const CORE=[',"const CORE=['/v230-admin-only.css','/v230-admin-only.js',");
write(swFile,sw);

const installFile=PUB+'/v135-install.js';
if(fs.existsSync(installFile)){
  let s=read(installFile).replaceAll('/service-worker.js?v=229','/service-worker.js?v=230');
  if(!s.includes('/service-worker.js?v=230'))throw new Error('V230: service worker cachebuster missing');
  write(installFile,s);
}
for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;if(!fs.existsSync(p))continue;
  let h=read(p).replaceAll('/v135-install.js?v=229','/v135-install.js?v=230');
  if(!h.includes('/v135-install.js?v=230'))throw new Error('V230: installer cachebuster missing in '+rel);
  write(p,h);
}

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));j.version='2.2.0';write(pkg,JSON.stringify(j,null,2)+'\n');
}

const finalServer=read(SERVER);
if(!finalServer.includes('function ce230LegacyAuth(req)'))throw new Error('V230: legacy auth not renamed');
if(!finalServer.includes('CE230_ADMIN_ONLY_AUTH'))throw new Error('V230: admin-only wrapper missing');
if(!finalServer.includes("String(user.role||'').toLowerCase()!=='admin'"))throw new Error('V230: non-admin rejection missing');
if(!read(PUB+'/operacao.html').includes('/v230-admin-only.js'))throw new Error('V230: operation UI missing');
console.log('V2.2.0 admin-only auth passed: section keys rejected; administrative key has all 29 sections.');
