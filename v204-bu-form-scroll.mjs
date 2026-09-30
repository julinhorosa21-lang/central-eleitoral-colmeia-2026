import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v204-bu-form-scroll.css',read('/src/v204-bu-form-scroll.css'));
write(pub+'/v204-bu-form-scroll.js',read('/src/v204-bu-form-scroll.js'));

const p=pub+'/operacao.html';
let h=read(p);
if(!h.includes('/v204-bu-form-scroll.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v204-bu-form-scroll.css?v=204">\n</head>');
if(!h.includes('/v204-bu-form-scroll.js'))h=h.replace('</body>','<script src="/v204-bu-form-scroll.js?v=204"></script>\n</body>');
write(p,h);

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.4-unified';");
if(!sw.includes("'/v204-bu-form-scroll.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v204-bu-form-scroll.css','/v204-bu-form-scroll.js',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.4';write(pkg,JSON.stringify(j,null,2)+'\n')}

const out=read(p);
if(!out.includes('/v204-bu-form-scroll.css')||!out.includes('/v204-bu-form-scroll.js'))throw new Error('V2.0.4 assets ausentes');
if(!read(pub+'/v204-bu-form-scroll.js').includes('Ler Boletim de Urna pelo QR Code'))throw new Error('V2.0.4 detector do formulário ausente');
if(!read(pub+'/v204-bu-form-scroll.css').includes('.ce204-bu-panel'))throw new Error('V2.0.4 painel rolável ausente');
if(!read(pub+'/service-worker.js').includes("v2.0.4-unified"))throw new Error('V2.0.4 SW não atualizado');

console.log('V2.0.4 applied: Register BU form is detected by content, bottom navigation hidden, and panel forced scrollable.');
