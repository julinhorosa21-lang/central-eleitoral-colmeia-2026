import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v207-speed.css',read('/src/v207-speed.css'));

/* ============================================================
   1) Contraste: deixa de revarrer o documento inteiro
   ============================================================ */
{
  const p=pub+'/v202-contrast.js';
  let s=read(p);
  const a=s.indexOf('function start(){');
  const b=s.indexOf("document.readyState==='loading'",a);
  if(a<0||b<0)throw new Error('V2.0.7: start V202 não localizado');

  const start=`function start(){
  document.documentElement.classList.add('ce202-contrast-guard');
  audit();
  [240,1100].forEach(ms=>setTimeout(audit,ms));

  /* CE207_TARGETED_CONTRAST_OBSERVER:
     processa somente o elemento alterado/adicionado, nunca a página inteira. */
  const mo=new MutationObserver(records=>{
    const roots=new Set();
    for(const m of records){
      if(m.type==='childList'){
        for(const n of m.addedNodes)if(n instanceof Element)roots.add(n);
      }else if(m.type==='attributes'&&m.target instanceof Element){
        roots.add(m.target);
      }
    }
    if(!roots.size)return;
    requestAnimationFrame(()=>{
      for(const root of roots){
        if(root.matches?.(TARGETS))protect(root);
        root.querySelectorAll?.(TARGETS).forEach(protect);
      }
    });
  });
  mo.observe(document.body,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','disabled','aria-selected','aria-pressed']
  });

  document.addEventListener('click',e=>{
    const el=e.target.closest?.(TARGETS);
    if(el)requestAnimationFrame(()=>protect(el));
  },true);
  window.addEventListener('pageshow',()=>requestAnimationFrame(audit));
}
`;
  s=s.slice(0,a)+start+s.slice(b);
  write(p,s);
  new Function(s);
}

/* ============================================================
   2) Candidatos: elimina observer global + fotos eager
   ============================================================ */
{
  const p=pub+'/v161-candidates-all-cargos.js';
  let s=read(p);

  s=s.replaceAll('loading="eager"','loading="lazy"');
  s=s.replaceAll("img.loading='eager'","img.loading='lazy'");

  const old="function start(){loadCatalog();run();setTimeout(run,300);setTimeout(run,1000);new MutationObserver(run).observe(document.body,{subtree:true,childList:true,characterData:true});document.addEventListener('click',()=>setTimeout(run,100),true)}";
  const neu="function start(){loadCatalog();run();setTimeout(run,450);const roots=[document.getElementById('leaders'),document.getElementById('cargoTabs')].filter(Boolean);const mo=new MutationObserver(run);roots.forEach(root=>mo.observe(root,{subtree:true,childList:true,characterData:true}));document.addEventListener('click',e=>{if(e.target.closest?.('#cargoTabs,[data-cargo],[data-ce161-cargo]'))setTimeout(run,80)},true);document.addEventListener('change',e=>{if(e.target.closest?.('select'))setTimeout(run,80)},true)}";
  if(!s.includes(old))throw new Error('V2.0.7: observer global V161 não localizado');
  s=s.replace(old,neu);

  write(p,s);
  new Function(s);
}

/* ============================================================
   3) Público: reduz reaplicações redundantes no carregamento
   ============================================================ */
{
  const p=pub+'/v200-resultados-public.js';
  let s=read(p);
  s=s.replace("[100,350,900,1800].forEach(ms=>setTimeout(apply,ms));","[180,850].forEach(ms=>setTimeout(apply,ms));");
  write(p,s);
  new Function(s);
}

/* ============================================================
   4) Carrega CSS final nas telas e remove precache obsoleto
   ============================================================ */
for(const rel of ['index.html','transparencia.html','operacao.html','admin/index.html','admin.html','apuracao.html']){
  const p=pub+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p);
  if(!h.includes('/v207-speed.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v207-speed.css?v=207">\n</head>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.7-unified';");
for(const asset of [
  '/v203-modal-scroll.css','/v203-modal-scroll.js',
  '/v204-bu-form-scroll.css','/v204-bu-form-scroll.js',
  '/v205-bu-modal.css','/v205-bu-modal.js'
]){
  sw=sw.replaceAll("'"+asset+"',",'');
  sw=sw.replaceAll(","+"'"+asset+"'",'');
  sw=sw.replaceAll("'"+asset+"'",'');
}
if(!sw.includes("'/v207-speed.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v207-speed.css',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.7';write(pkg,JSON.stringify(j,null,2)+'\n')}

/* ============================================================
   5) Regressões obrigatórias
   ============================================================ */
const contrast=read(pub+'/v202-contrast.js');
const candidates=read(pub+'/v161-candidates-all-cargos.js');
const speed=read(pub+'/v207-speed.css');
const serviceWorker=read(pub+'/service-worker.js');

if(!contrast.includes('CE207_TARGETED_CONTRAST_OBSERVER'))throw new Error('V2.0.7: contraste otimizado ausente');
if(contrast.includes("attributeFilter:['class','style','disabled']"))throw new Error('V2.0.7: observer de style ainda ativo');
if(candidates.includes("observe(document.body,{subtree:true,childList:true,characterData:true})"))throw new Error('V2.0.7: observer global de candidatos ainda ativo');
if(candidates.includes('loading="eager"')||candidates.includes("img.loading='eager'"))throw new Error('V2.0.7: fotos eager ainda ativas no V161');
if(!speed.includes('.ce161-rank')||!speed.includes('min-width:34px'))throw new Error('V2.0.7: proteção do ranking ausente');
for(const asset of ['v203-modal-scroll.js','v204-bu-form-scroll.js','v205-bu-modal.js']){
  if(serviceWorker.includes(asset))throw new Error('V2.0.7: asset obsoleto ainda no precache: '+asset);
}
if(!serviceWorker.includes("v2.0.7-unified"))throw new Error('V2.0.7: SW não atualizado');

console.log('V2.0.7 applied: rank badges protected; targeted DOM observers, lazy candidate photos, progressive rendering and leaner precache enabled.');
