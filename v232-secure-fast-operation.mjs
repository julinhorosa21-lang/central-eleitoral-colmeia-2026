import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

fs.copyFileSync('/src/v232-operational-gate.js',PUB+'/v232-operational-gate.js');
fs.copyFileSync('/src/v232-public-access.js',PUB+'/v232-public-access.js');
fs.copyFileSync('/src/v232-access.css',PUB+'/v232-access.css');

new Function(read(PUB+'/v232-operational-gate.js'));
new Function(read(PUB+'/v232-public-access.js'));

/* CE232_LIGHT_ADMIN_SECTIONS
   V230 não pode reprocessar todos os selects a cada mutação do formulário. */
const v230=PUB+'/v230-admin-only.js';
let admin=read(v230);
admin=admin.replace("nativeFetch('/data/locais-colmeia.json',{cache:'no-store'})","nativeFetch('/data/locais-colmeia.json',{cache:'force-cache'})");
admin=admin.replace(
  "for(const sel of [...document.querySelectorAll('select')].filter(sectionSelect)){",
  "for(const sel of [...document.querySelectorAll('select')].filter(sectionSelect)){if(sel.dataset.ce230AllSections==='1')continue;"
);
const heavy="new MutationObserver(()=>{if(adminOk)requestAnimationFrame(expand)}).observe(document.documentElement,{childList:true,subtree:true});";
const light="/* CE232_LIGHT_ADMIN_SECTIONS */ const ce232Root=document.getElementById('sheetWrap')||document.body;new MutationObserver(records=>{if(!adminOk)return;const hasSelect=records.some(m=>[...m.addedNodes].some(n=>n instanceof Element&&(n.matches?.('select')||n.querySelector?.('select'))));if(hasSelect)requestAnimationFrame(expand)}).observe(ce232Root,{childList:true,subtree:true});";
if(!admin.includes(heavy))throw new Error('V232: V230 heavy observer anchor missing');
admin=admin.replace(heavy,light);
write(v230,admin);
new Function(admin);

/* CE232_OPERATION_STATIC_CONTRAST
   Na operação, a auditoria visual não observa cada alteração de formulário/QR. */
const contrast=PUB+'/v202-contrast.js';
if(fs.existsSync(contrast)){
  let s=read(contrast);
  const needle="function start(){\n  document.documentElement.classList.add('ce202-contrast-guard');\n  audit();";
  if(s.includes(needle)&&!s.includes('CE232_OPERATION_STATIC_CONTRAST')){
    s=s.replace(
      needle,
      needle+"\n  /* CE232_OPERATION_STATIC_CONTRAST */\n  if(location.pathname==='/operacao.html'){setTimeout(()=>audit(),500);window.addEventListener('pageshow',()=>requestAnimationFrame(()=>audit()));return;}"
    );
  }
  write(contrast,s);
  new Function(s);
}

/* A proteção da operação entra primeiro no head. */
let op=read(PUB+'/operacao.html');
if(!op.includes('/v232-operational-gate.js')){
  op=op.replace(/<head([^>]*)>/i,m=>m+'\n<script src="/v232-operational-gate.js?v=232"></script>\n<link rel="stylesheet" href="/v232-access.css?v=232">');
}
op=op.replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=232');
write(PUB+'/operacao.html',op);

/* A tela pública intercepta atalhos de operação/admin e exige chave. */
for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;
  let h=read(p);
  if(!h.includes('/v232-access.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v232-access.css?v=232">\n</head>');
  if(!h.includes('/v232-public-access.js'))h=h.replace('</body>','<script src="/v232-public-access.js?v=232"></script>\n</body>');
  h=h.replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=232');
  write(p,h);
}
for(const rel of ['admin/index.html','admin.html','apuracao.html','seguranca.html']){
  const p=PUB+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p).replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=232');
  write(p,h);
}

/* Cachebuster do SW. */
const install=PUB+'/v135-install.js';
if(fs.existsSync(install)){
  let s=read(install).replace(/service-worker\.js\?v=\d+/g,'service-worker.js?v=232');
  write(install,s);
}

/* PWA */
let sw=read(PUB+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.2.2-secure-fast-operation';");
if(!sw.includes("'/v232-operational-gate.js'")){
  sw=sw.replace('const CORE=[',"const CORE=['/v232-access.css','/v232-operational-gate.js','/v232-public-access.js',");
}
write(PUB+'/service-worker.js',sw);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.2.2';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

const finalOp=read(PUB+'/operacao.html');
if(!finalOp.includes('/v232-operational-gate.js'))throw new Error('V232: operation gate missing');
if(!read(PUB+'/index.html').includes('/v232-public-access.js'))throw new Error('V232: public access guard missing');
if(!read(v230).includes('CE232_LIGHT_ADMIN_SECTIONS'))throw new Error('V232: light admin section observer missing');
if(read(v230).includes(heavy))throw new Error('V232: old heavy observer still present');
if(!read(PUB+'/service-worker.js').includes('v2.2.2-secure-fast-operation'))throw new Error('V232: service worker mismatch');
console.log('V2.2.2 passed: operation password gate, neutral 29-section chooser and lighter BU runtime.');
