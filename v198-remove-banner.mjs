import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v198-remove-banner.css',read('/src/v198-remove-banner.css'));
write(pub+'/v198-remove-banner.js',read('/src/v198-remove-banner.js'));

for(const rel of ['index.html','transparencia.html']){
  const p=pub+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p);

  /* Força uma nova URL do script legado, evitando o asset cacheado v1881. */
  h=h.replace(/\/v187-ui\.css\?v=[^"'&<]+/g,'/v187-ui.css?v=198');
  h=h.replace(/\/v187-ui\.js\?v=[^"'&<]+/g,'/v187-ui.js?v=198');

  if(!h.includes('/v198-remove-banner.css')){
    h=h.replace('</head>','<link rel="stylesheet" href="/v198-remove-banner.css?v=198">\n</head>');
  }
  if(!h.includes('/v198-remove-banner.js')){
    h=h.replace('</body>','<script src="/v198-remove-banner.js?v=198"></script>\n</body>');
  }
  write(p,h);
}

/* Mantém o código V1.9.7 correto e elimina qualquer string do banner do JS final. */
const uiPath=pub+'/v187-ui.js';
let ui=read(uiPath);
const start=ui.indexOf('function ensurePreElectionNotice(){');
const end=start>=0?ui.indexOf('function fixCompletionNote()',start):-1;
if(start>=0&&end>start){
  const replacement=String.raw`function ensurePreElectionNotice(){
 const PUBLIC=new Set(['/','/index.html','/transparencia.html']);if(!PUBLIC.has(location.pathname))return;
 const cutoff=Date.parse('2026-10-04T17:00:00-03:00'),pre=Date.now()<cutoff;
 document.documentElement.classList.toggle('ce187-pre-election',pre);
 document.getElementById('ce187TestNotice')?.remove();
}
`;
  ui=ui.slice(0,start)+replacement+ui.slice(end);
  write(uiPath,ui);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.9.8-unified';");
if(!sw.includes("'/v198-remove-banner.css'")){
  sw=sw.replace('const CORE=[',"const CORE=['/v198-remove-banner.css','/v198-remove-banner.js',");
}
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='1.9.8';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

for(const rel of ['index.html','transparencia.html']){
  const h=read(pub+'/'+rel);
  if(!h.includes('/v187-ui.js?v=198'))throw new Error('V1.9.8 cache-bust V187 ausente em '+rel);
  if(!h.includes('/v198-remove-banner.css')||!h.includes('/v198-remove-banner.js'))throw new Error('V1.9.8 guard ausente em '+rel);
}
if(read(uiPath).includes('AMBIENTE DE TESTE · DADOS NÃO OFICIAIS'))throw new Error('V1.9.8 string antiga ainda presente');
if(!read(pub+'/service-worker.js').includes("v1.9.8-unified"))throw new Error('V1.9.8 SW não atualizado');

console.log('V1.9.8 applied: legacy yellow test banner force-removed with cache-busting and final guard.');
