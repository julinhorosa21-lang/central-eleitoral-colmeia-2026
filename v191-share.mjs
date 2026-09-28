import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v191-share.css',read('/src/v191-share.css'));
write(pub+'/v191-share.js',read('/src/v191-share.js'));

for(const rel of ['index.html','transparencia.html']){
  const p=pub+'/'+rel;if(!fs.existsSync(p))continue;let h=read(p);
  if(!h.includes('/v191-share.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v191-share.css?v=191">\n</head>');
  if(!h.includes('/v191-share.js'))h=h.replace('</body>','<script src="/v191-share.js?v=191"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.9.1-unified';");
if(!sw.includes("'/v191-share.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v191-share.css','/v191-share.js',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='1.9.1';write(pkg,JSON.stringify(j,null,2)+'\n')}

for(const rel of ['index.html','transparencia.html']){
  const h=read(pub+'/'+rel);
  if(!h.includes('/v191-share.css')||!h.includes('/v191-share.js'))throw new Error('V1.9.1 share assets ausentes em '+rel);
}
if(!read(pub+'/service-worker.js').includes("v1.9.1-unified"))throw new Error('V1.9.1 SW não atualizado');
console.log('V1.9.1 applied: shareable 1080x1350 cargo result cards + native share + caption copy.');
