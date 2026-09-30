import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v203-modal-scroll.css',read('/src/v203-modal-scroll.css'));
write(pub+'/v203-modal-scroll.js',read('/src/v203-modal-scroll.js'));

const p=pub+'/operacao.html';
let h=read(p);
if(!h.includes('/v203-modal-scroll.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v203-modal-scroll.css?v=203">\n</head>');
if(!h.includes('/v203-modal-scroll.js'))h=h.replace('</body>','<script src="/v203-modal-scroll.js?v=203"></script>\n</body>');
write(p,h);

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.3-unified';");
if(!sw.includes("'/v203-modal-scroll.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v203-modal-scroll.css','/v203-modal-scroll.js',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.3';write(pkg,JSON.stringify(j,null,2)+'\n')}

const out=read(p);
if(!out.includes('/v203-modal-scroll.css')||!out.includes('/v203-modal-scroll.js'))throw new Error('V2.0.3 assets não injetados');
if(!read(pub+'/v203-modal-scroll.css').includes('max-height:calc(100dvh'))throw new Error('V2.0.3 viewport scroll guard ausente');
if(!read(pub+'/v203-modal-scroll.js').includes('ce203-modal-open'))throw new Error('V2.0.3 modal state guard ausente');
if(!read(pub+'/service-worker.js').includes("v2.0.3-unified"))throw new Error('V2.0.3 SW não atualizado');

console.log('V2.0.3 applied: operational dialogs are viewport-bounded and vertically scrollable on mouse, touchpad and touch.');
