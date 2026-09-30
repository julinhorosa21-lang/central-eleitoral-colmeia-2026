import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v200-resultados-public.css',read('/src/v200-resultados-public.css'));
write(pub+'/v200-resultados-public.js',read('/src/v200-resultados-public.js'));

for(const rel of ['index.html','transparencia.html']){
  const p=pub+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p);
  if(!h.includes('/v200-resultados-public.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v200-resultados-public.css?v=200">\n</head>');
  if(!h.includes('/v200-resultados-public.js'))h=h.replace('</body>','<script src="/v200-resultados-public.js?v=200"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.0-unified';");
if(!sw.includes("'/v200-resultados-public.css'")){
  sw=sw.replace('const CORE=[',"const CORE=['/v200-resultados-public.css','/v200-resultados-public.js',");
}
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.0';write(pkg,JSON.stringify(j,null,2)+'\n')}

for(const rel of ['index.html','transparencia.html']){
  const h=read(pub+'/'+rel);
  if(!h.includes('/v200-resultados-public.css')||!h.includes('/v200-resultados-public.js'))throw new Error('V2.0.0 assets ausentes em '+rel);
}
if(!read(pub+'/v200-resultados-public.css').includes('.ce200-appbar'))throw new Error('V2.0.0 CSS incompleto');
if(!read(pub+'/v200-resultados-public.js').includes('Central independente.'))throw new Error('V2.0.0 aviso de independência ausente');
if(!read(pub+'/service-worker.js').includes("v2.0.0-unified"))throw new Error('V2.0.0 service worker não atualizado');

console.log('V2.0.0 applied: public experience redesigned with Resultados-inspired hierarchy while preserving independent identity.');
