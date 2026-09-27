import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v186-visual-qa.css',read('/src/v186-visual-qa.css'));
write(pub+'/v186-visual-qa.js',read('/src/v186-visual-qa.js'));

const pages=['index.html','transparencia.html','operacao.html','seguranca.html','admin/index.html'];
for(const rel of pages){
  const p=pub+'/'+rel;if(!fs.existsSync(p))continue;
  let h=read(p);
  if(!h.includes('/v186-visual-qa.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v186-visual-qa.css?v=186">\n</head>');
  if(!h.includes('/v186-visual-qa.js'))h=h.replace('</body>','<script src="/v186-visual-qa.js?v=186"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.8.6-unified';");
if(!sw.includes("'/v186-visual-qa.css'"))sw=sw.replace("const CORE=[","const CORE=['/v186-visual-qa.css','/v186-visual-qa.js',");
write(pub+'/service-worker.js',sw);

for(const rel of ['index.html','transparencia.html','operacao.html','admin/index.html']){
  const h=read(pub+'/'+rel);
  if(!h.includes('/v186-visual-qa.css')||!h.includes('/v186-visual-qa.js'))throw new Error('V1.8.6: assets visuais ausentes em '+rel);
}
if(!read(pub+'/v186-visual-qa.css').includes('auditoria visual profunda'))throw new Error('V1.8.6: CSS incompleto');
if(!read(pub+'/v186-visual-qa.js').includes('normalizeNav'))throw new Error('V1.8.6: JS visual incompleto');
console.log('V1.8.6 applied: deep visual QA, icon geometry, mobile rhythm and accessibility normalized.');
