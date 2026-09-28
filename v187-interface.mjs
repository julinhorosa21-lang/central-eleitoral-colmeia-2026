import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
write(pub+'/v187-ui.css',read('/src/v187-ui.css'));
write(pub+'/v187-ui.js',read('/src/v187-ui.js'));
for(const rel of ['index.html','transparencia.html','operacao.html','seguranca.html','admin/index.html','admin.html','apuracao.html']){
  const p=pub+'/'+rel;if(!fs.existsSync(p))continue;let h=read(p);
  if(!h.includes('/v187-ui.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v187-ui.css?v=1881">\n</head>');
  if(!h.includes('/v187-ui.js'))h=h.replace('</body>','<script src="/v187-ui.js?v=1881"></script>\n</body>');
  write(p,h);
}
let sw=read(pub+'/service-worker.js');sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.8.8.1-unified';");
if(!sw.includes("'/v187-ui.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v187-ui.css','/v187-ui.js',");write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='1.8.8.1';write(pkg,JSON.stringify(j,null,2)+'\n')}
for(const rel of ['index.html','transparencia.html','operacao.html','admin/index.html']){const h=read(pub+'/'+rel);if(!h.includes('/v187-ui.css')||!h.includes('/v187-ui.js'))throw new Error('V1.8.8.1: assets ausentes em '+rel)}
if(!read(pub+'/service-worker.js').includes("v1.8.8.1-unified"))throw new Error('V1.8.8.1: service worker não atualizado');
console.log('V1.8.8.1 applied: candidate integrity + interface corrections.');
