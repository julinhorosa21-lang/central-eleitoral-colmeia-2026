import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v185-interface.css',read('/src/v185-interface.css'));
write(pub+'/v185-icons.js',read('/src/v185-icons.js'));

for(const rel of ['index.html','transparencia.html','operacao.html','seguranca.html','admin/index.html']){
  const p=pub+'/'+rel;if(!fs.existsSync(p))continue;
  let h=read(p);
  if(!h.includes('/v185-interface.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v185-interface.css?v=185">\n</head>');
  if(!h.includes('/v185-icons.js'))h=h.replace('</body>','<script src="/v185-icons.js?v=185"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.8.5-unified';");
if(!sw.includes("'/v185-interface.css'"))sw=sw.replace("const CORE=[","const CORE=['/v185-interface.css','/v185-icons.js',");
write(pub+'/service-worker.js',sw);

for(const rel of ['index.html','transparencia.html','operacao.html','admin/index.html']){
  const h=read(pub+'/'+rel);
  if(!h.includes('/v185-interface.css')||!h.includes('/v185-icons.js'))throw new Error('V1.8.5: assets visuais ausentes em '+rel);
}
console.log('V1.8.5 applied: visual system and icon alignment enabled.');