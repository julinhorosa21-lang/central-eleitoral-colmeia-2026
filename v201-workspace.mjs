import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v201-workspace.css',read('/src/v201-workspace.css'));
write(pub+'/v201-workspace.js',read('/src/v201-workspace.js'));

for(const rel of ['operacao.html','seguranca.html','apuracao.html','admin.html','admin/index.html']){
  const p=pub+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p);
  if(!h.includes('/v201-workspace.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v201-workspace.css?v=201">\n</head>');
  if(!h.includes('/v201-workspace.js'))h=h.replace('</body>','<script src="/v201-workspace.js?v=201"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.1-unified';");
if(!sw.includes("'/v201-workspace.css'")){
  sw=sw.replace('const CORE=[',"const CORE=['/v201-workspace.css','/v201-workspace.js',");
}
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.1';write(pkg,JSON.stringify(j,null,2)+'\n')}

for(const rel of ['operacao.html','admin/index.html']){
  const h=read(pub+'/'+rel);
  if(!h.includes('/v201-workspace.css')||!h.includes('/v201-workspace.js'))throw new Error('V2.0.1 assets ausentes em '+rel);
}
if(!read(pub+'/v201-workspace.css').includes('.ce201-appbar'))throw new Error('V2.0.1 CSS incompleto');
if(!read(pub+'/v201-workspace.js').includes("key:'operacao'")||!read(pub+'/v201-workspace.js').includes("key:'admin'"))throw new Error('V2.0.1 módulos ausentes');
if(!read(pub+'/service-worker.js').includes("v2.0.1-unified"))throw new Error('V2.0.1 service worker não atualizado');

console.log('V2.0.1 applied: operational, administrative, security and internal result areas unified with the public visual system.');
