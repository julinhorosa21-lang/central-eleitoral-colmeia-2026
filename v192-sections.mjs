import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v192-sections.css',read('/src/v192-sections.css'));
write(pub+'/v192-sections.js',read('/src/v192-sections.js'));

for(const rel of ['index.html','transparencia.html','admin/index.html','admin.html']){
  const p=pub+'/'+rel;if(!fs.existsSync(p))continue;let h=read(p);
  if(!h.includes('/v192-sections.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v192-sections.css?v=192">\n</head>');
  if(!h.includes('/v192-sections.js'))h=h.replace('</body>','<script src="/v192-sections.js?v=192"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.9.2-unified';");
if(!sw.includes("'/v192-sections.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v192-sections.css','/v192-sections.js',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='1.9.2';write(pkg,JSON.stringify(j,null,2)+'\n')}

for(const rel of ['index.html','transparencia.html','admin/index.html']){
  const h=read(pub+'/'+rel);
  if(!h.includes('/v192-sections.css')||!h.includes('/v192-sections.js'))throw new Error('V1.9.2 assets ausentes em '+rel);
}
if(!read(pub+'/service-worker.js').includes("v1.9.2-unified"))throw new Error('V1.9.2 SW não atualizado');
console.log('V1.9.2 applied: section search, status filters and next-pending navigation.');
