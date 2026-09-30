import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* WCAG contrast regression for critical palette pairs. */
function hex(s){const v=s.replace('#','');return{r:parseInt(v.slice(0,2),16),g:parseInt(v.slice(2,4),16),b:parseInt(v.slice(4,6),16)}}
function lin(v){v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}
function lum(c){return .2126*lin(c.r)+.7152*lin(c.g)+.0722*lin(c.b)}
function ratio(a,b){const x=lum(hex(a)),y=lum(hex(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const critical=[
  ['#FFFFFF','#1F4D7A','white/primary'],
  ['#FFFFFF','#153A61','white/primary-strong'],
  ['#25313C','#FFFFFF','text/surface'],
  ['#5F6B76','#FFFFFF','muted/surface'],
  ['#1F6546','#EAF7F0','success'],
  ['#684A00','#FFF5DD','warning'],
  ['#7F2720','#FFF0EE','danger']
];
for(const [fg,bg,name] of critical){
  const r=ratio(fg,bg);
  if(r<4.5)throw new Error('V2.0.2 contrast regression '+name+': '+r.toFixed(2)+':1');
}

write(pub+'/v202-contrast.css',read('/src/v202-contrast.css'));
write(pub+'/v202-contrast.js',read('/src/v202-contrast.js'));

for(const rel of ['index.html','transparencia.html','operacao.html','seguranca.html','apuracao.html','admin.html','admin/index.html']){
  const p=pub+'/'+rel;if(!fs.existsSync(p))continue;
  let h=read(p);
  if(!h.includes('/v202-contrast.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v202-contrast.css?v=202">\n</head>');
  if(!h.includes('/v202-contrast.js'))h=h.replace('</body>','<script src="/v202-contrast.js?v=202"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.2-unified';");
if(!sw.includes("'/v202-contrast.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v202-contrast.css','/v202-contrast.js',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.2';write(pkg,JSON.stringify(j,null,2)+'\n')}

for(const rel of ['index.html','operacao.html','admin/index.html']){
  const h=read(pub+'/'+rel);
  if(!h.includes('/v202-contrast.css')||!h.includes('/v202-contrast.js'))throw new Error('V2.0.2 assets ausentes em '+rel);
}
if(!read(pub+'/v202-contrast.css').includes('Correção prioritária: cabeçalho operacional'))throw new Error('V2.0.2 correção do hero ausente');
if(!read(pub+'/v202-contrast.js').includes('ratio>=4.5'))throw new Error('V2.0.2 auditor runtime ausente');
if(!read(pub+'/service-worker.js').includes("v2.0.2-unified"))throw new Error('V2.0.2 SW não atualizado');

console.log('V2.0.2 applied: global contrast guard + WCAG 4.5:1 build regression enabled.');
