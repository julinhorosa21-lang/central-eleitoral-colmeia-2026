import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v195-display.css',read('/src/v195-display.css'));
write(pub+'/v195-display.js',read('/src/v195-display.js'));

for(const rel of ['index.html','transparencia.html']){
  const p=pub+'/'+rel;let h=read(p);
  if(!h.includes('/v195-display.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v195-display.css?v=195">\n</head>');
  if(!h.includes('/v195-display.js'))h=h.replace('</body>','<script src="/v195-display.js?v=195"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.9.5-unified';");
if(!sw.includes("'/v195-display.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v195-display.css','/v195-display.js',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='1.9.5';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(!read(pub+'/index.html').includes('/v195-display.js'))throw new Error('V1.9.5 display ausente no público');
if(!read(pub+'/transparencia.html').includes('/v195-display.js'))throw new Error('V1.9.5 transparência ausente');
if(!read(pub+'/v195-display.js').includes('Modo divulgação'))throw new Error('V1.9.5 modo divulgação ausente');
if(!read(pub+'/v195-display.js').includes('Exportar CSV'))throw new Error('V1.9.5 exportação ausente');
if(!read(pub+'/service-worker.js').includes("v1.9.5-unified"))throw new Error('V1.9.5 SW não atualizado');
console.log('V1.9.5 applied: TV/display mode, cargo rotation, public transparency summary and CSV/JSON export.');
