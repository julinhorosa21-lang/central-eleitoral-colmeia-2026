import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v194-fastpath.js',read('/src/v194-fastpath.js'));
write(pub+'/v194-performance.css',read('/src/v194-performance.css'));

/* 1) Fast path deve entrar cedo, antes dos scripts que disparam fetches. */
for(const rel of ['index.html','transparencia.html','operacao.html','admin/index.html','admin.html','apuracao.html']){
  const p=pub+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p);
  if(!h.includes('/v194-performance.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v194-performance.css?v=194">\n</head>');
  if(!h.includes('/v194-fastpath.js')){
    h=h.replace(/<head([^>]*)>/i,(m)=>m+'\n<script src="/v194-fastpath.js?v=194"></script>');
  }
  write(p,h);
}

/* 2) Public UI legado: observer só nos componentes que realmente mudam. */
const publicJs=pub+'/v130-public.js';
if(fs.existsSync(publicJs)){
  let s=read(publicJs);
  const old="    const obs=new MutationObserver(ce180ScheduleApply);\n    obs.observe(document.body,{childList:true,subtree:true});";
  const neu="    const obs=new MutationObserver(ce180ScheduleApply);\n    const roots=[document.getElementById('leaders'),document.getElementById('places'),document.getElementById('publicOverview'),document.querySelector('.metrics')].filter(Boolean);\n    roots.forEach(root=>obs.observe(root,{childList:true,subtree:true}));";
  if(s.includes(old))s=s.replace(old,neu);
  write(publicJs,s);
}

/* 3) Andamento de seções: sem observer global e sem polling de 30s. */
const flowJs=pub+'/v160-flow.js';
if(fs.existsSync(flowJs)){
  let s=read(flowJs);
  s=s.replace("fetch('/data/locais-colmeia.json',{cache:'no-store'})","fetch('/data/locais-colmeia.json',{cache:'force-cache'})");
  const old="function start(){scheduleApply();loadStats(true);setTimeout(scheduleApply,250);setTimeout(scheduleApply,900);setTimeout(scheduleApply,1600);new MutationObserver(scheduleApply).observe(document.body,{subtree:true,childList:true,characterData:true});window.addEventListener('pageshow',()=>{scheduleApply();loadStats(true);});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadStats(false);});setInterval(()=>loadStats(false),30000);}";
  const neu="function start(){scheduleApply();loadStats(true);setTimeout(scheduleApply,300);setTimeout(scheduleApply,1000);const roots=[document.getElementById('publicOverview'),document.querySelector('.metrics')].filter(Boolean);const mo=new MutationObserver(scheduleApply);roots.forEach(root=>mo.observe(root,{subtree:true,childList:true}));window.addEventListener('pageshow',()=>{scheduleApply();loadStats(false);});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadStats(false);});setInterval(()=>{if(!document.hidden)loadStats(false)},90000);}";
  if(s.includes(old))s=s.replace(old,neu);
  write(flowJs,s);
}

/* 4) Tema regional antigo: decoração só acompanha a lista de candidatos. */
const regionalJs=pub+'/v153-regional-theme.js';
if(fs.existsSync(regionalJs)){
  let s=read(regionalJs);
  const old="var q=false;new MutationObserver(function(){if(q)return;q=true;requestAnimationFrame(function(){q=false;run()})}).observe(document.body,{subtree:true,childList:true,characterData:true})";
  const neu="var q=false,root=document.getElementById('leaders');if(root)new MutationObserver(function(){if(q)return;q=true;requestAnimationFrame(function(){q=false;rows()})}).observe(root,{subtree:true,childList:true})";
  if(s.includes(old))s=s.replace(old,neu);
  write(regionalJs,s);
}

/* 5) Admin: ranking agregado fica memoizado por snapshot/cargo. */
const adminJs=pub+'/admin/admin-v150.js';
if(fs.existsSync(adminJs)){
  let s=read(adminJs);
  const start=s.indexOf('function aggregateCargo(cargo){');
  const end=start>=0?s.indexOf('function renderOverview()',start):-1;
  if(start>=0&&end>start&&!s.includes('CE194_AGGREGATE_CACHE')){
    const repl=String.raw`/* CE194_AGGREGATE_CACHE */
let ce194AggregateStamp='',ce194AggregateCache=new Map();
function aggregateCargo(cargo){
  const stamp=String(snapshot?.updatedAt||'')+'|'+String(snapshot?.total||0);
  if(stamp!==ce194AggregateStamp){ce194AggregateStamp=stamp;ce194AggregateCache.clear()}
  if(ce194AggregateCache.has(cargo))return ce194AggregateCache.get(cargo);
  const rows=entries().filter(r=>r.cargo===cargo);
  const map=new Map();let nominal=0,legenda=0,brancos=0,nulos=0;
  for(const r of rows){
    const p=r.payload||{};
    for(const c of p.candidatos||[]){
      const key=String(c.numero||c.nome||'').trim();if(!key)continue;
      const old=map.get(key)||{numero:String(c.numero||''),nome:String(c.nome||''),partido:String(c.partido||''),votos:0};
      if(!old.nome&&c.nome)old.nome=String(c.nome);
      if(!old.partido&&c.partido)old.partido=String(c.partido);
      old.votos+=Number(c.votos||0);map.set(key,old);nominal+=Number(c.votos||0);
    }
    for(const l of p.legendas||[])legenda+=Number(l.votos||0);
    brancos+=Number(p.brancos||0);nulos+=Number(p.nulos||0);
  }
  const value={rows,items:[...map.values()].sort((a,b)=>b.votos-a.votos||String(a.numero).localeCompare(String(b.numero),'pt-BR',{numeric:true})),nominal,legenda,brancos,nulos};
  ce194AggregateCache.set(cargo,value);return value;
}
`;
    s=s.slice(0,start)+repl+s.slice(end);
  }

  /* Static local data no longer needs no-store. */
  s=s.replace("fetch('/data/locais-colmeia.json',{cache:'no-store'})","fetch('/data/locais-colmeia.json',{cache:'force-cache'})");
  write(adminJs,s);
}

/* 6) Invalidação explícita após gravação/remoção/restauração. */
const opJs=pub+'/v193-operations.js';
if(fs.existsSync(opJs)){
  let s=read(opJs);
  s=s.replace("if(response.ok)status('Resultado salvo com sucesso.','ok',false,2600);","if(response.ok){window.__ce194Invalidate?.('/api/snapshot');status('Resultado salvo com sucesso.','ok',false,2600);}");
  s=s.replace("if(response.ok){\n      status('Resultado removido.','ok',false,1600);","if(response.ok){\n      window.__ce194Invalidate?.('/api/snapshot');\n      status('Resultado removido.','ok',false,1600);");
  s=s.replace("closeUndo();status('Resultado restaurado com sucesso.','ok',false,3000);","window.__ce194Invalidate?.('/api/snapshot');closeUndo();status('Resultado restaurado com sucesso.','ok',false,3000);");
  write(opJs,s);
}

/* 7) Service worker / versão */
let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.9.4-unified';");
if(!sw.includes("'/v194-fastpath.js'"))sw=sw.replace('const CORE=[',"const CORE=['/v194-fastpath.js','/v194-performance.css',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='1.9.4';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(!read(pub+'/index.html').includes('/v194-fastpath.js'))throw new Error('V1.9.4 fastpath ausente');
if(!read(pub+'/admin/admin-v150.js').includes('CE194_AGGREGATE_CACHE'))throw new Error('V1.9.4 aggregate cache ausente');
if(read(pub+'/v160-flow.js').includes("observe(document.body,{subtree:true,childList:true,characterData:true})"))throw new Error('V1.9.4 observer global V160 ainda ativo');
if(!read(pub+'/service-worker.js').includes("v1.9.4-unified"))throw new Error('V1.9.4 SW não atualizado');
console.log('V1.9.4 applied: request coalescing, memoized rankings, scoped observers and reduced polling.');
