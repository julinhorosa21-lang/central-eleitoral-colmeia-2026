import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(PUB+'/v229-tse-interface.css',read('/src/v229-tse-interface.css'));
write(PUB+'/v229-tse-interface.js',read('/src/v229-tse-interface.js'));
new Function(read(PUB+'/v229-tse-interface.js'));

for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p);
  if(!h.includes('/v229-tse-interface.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v229-tse-interface.css?v=229">\n</head>');
  if(!h.includes('/v229-tse-interface.js'))h=h.replace('</body>','<script src="/v229-tse-interface.js?v=229"></script>\n</body>');
  write(p,h);
}

const installFile=PUB+'/v135-install.js';
if(fs.existsSync(installFile)){
  let s=read(installFile).replaceAll('/service-worker.js?v=228','/service-worker.js?v=229');
  if(!s.includes('/service-worker.js?v=229'))throw new Error('V229: service worker cachebuster missing');
  write(installFile,s);
}
for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p).replaceAll('/v135-install.js?v=228','/v135-install.js?v=229');
  if(!h.includes('/v135-install.js?v=229'))throw new Error('V229: installer cachebuster missing in '+rel);
  write(p,h);
}

const swFile=PUB+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.1.9-tse-inspired';");
if(!sw.includes("'/v229-tse-interface.css'")){
  sw=sw.replace('const CORE=[',"const CORE=['/v229-tse-interface.css','/v229-tse-interface.js',");
}
write(swFile,sw);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.1.9';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

for(const rel of ['index.html','transparencia.html']){
  const h=read(PUB+'/'+rel);
  if(!h.includes('/v229-tse-interface.css')||!h.includes('/v229-tse-interface.js'))throw new Error('V229: public assets missing in '+rel);
}
const finalJs=read(PUB+'/v229-tse-interface.js');
const finalCss=read(PUB+'/v229-tse-interface.css');
if(!finalJs.includes('ce229-summary')||!finalJs.includes('ce229-round-badge')||!finalJs.includes('Registrar BU'))throw new Error('V229: required public UI blocks missing');
if(!finalCss.includes('--ce229-yellow:#e9b800')||!finalCss.includes('grid-template-columns:repeat(5,1fr)'))throw new Error('V229: TSE-inspired visual tokens missing');
if(!read(swFile).includes("v2.1.9-tse-inspired"))throw new Error('V229: service worker mismatch');

console.log('V2.1.9 public interface passed: TSE-inspired hierarchy, candidate cards, progress summary and five-item navigation enabled.');
