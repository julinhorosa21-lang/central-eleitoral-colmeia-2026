import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v189-identity.css',read('/src/v189-identity.css'));
write(pub+'/v189-identity.js',read('/src/v189-identity.js'));

for(const rel of ['index.html','transparencia.html','operacao.html','seguranca.html','admin/index.html','admin.html','apuracao.html']){
  const p=pub+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p);
  if(!h.includes('/v189-identity.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v189-identity.css?v=189">\n</head>');
  if(!h.includes('/v189-identity.js'))h=h.replace('</body>','<script src="/v189-identity.js?v=189"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.8.9-unified';");
if(!sw.includes("'/v189-identity.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v189-identity.css','/v189-identity.js',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='1.8.9';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

for(const rel of ['index.html','transparencia.html','operacao.html']){
  const h=read(pub+'/'+rel);
  if(!h.includes('/v189-identity.css')||!h.includes('/v189-identity.js'))throw new Error('V1.8.9 assets ausentes em '+rel);
}
if(!read(pub+'/service-worker.js').includes("v1.8.9-unified"))throw new Error('V1.8.9 service worker não atualizado');
console.log('V1.8.9 applied: visual identity guide tokens, cards, ranking, tabs, accessibility and institutional note.');
