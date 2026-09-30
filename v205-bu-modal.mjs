import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v205-bu-modal.css',read('/src/v205-bu-modal.css'));
write(pub+'/v205-bu-modal.js',read('/src/v205-bu-modal.js'));

const p=pub+'/operacao.html';
let h=read(p);

/* Retira da página os scripts V203/V204 que podiam reagir às próprias mutations. */
h=h.replace(/\s*<link[^>]+href=["']\/v203-modal-scroll\.css[^"']*["'][^>]*>/gi,'');
h=h.replace(/\s*<script[^>]+src=["']\/v203-modal-scroll\.js[^"']*["'][^>]*><\/script>/gi,'');
h=h.replace(/\s*<link[^>]+href=["']\/v204-bu-form-scroll\.css[^"']*["'][^>]*>/gi,'');
h=h.replace(/\s*<script[^>]+src=["']\/v204-bu-form-scroll\.js[^"']*["'][^>]*><\/script>/gi,'');

if(!h.includes('/v205-bu-modal.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v205-bu-modal.css?v=205">\n</head>');
if(!h.includes('/v205-bu-modal.js'))h=h.replace('</body>','<script src="/v205-bu-modal.js?v=205"></script>\n</body>');
write(p,h);

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.5-unified';");
if(!sw.includes("'/v205-bu-modal.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v205-bu-modal.css','/v205-bu-modal.js',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.5';write(pkg,JSON.stringify(j,null,2)+'\n')}

const out=read(p);
if(/\/v203-modal-scroll\.js|\/v204-bu-form-scroll\.js/.test(out))throw new Error('V2.0.5 scripts regressivos ainda carregados');
if(!out.includes('/v205-bu-modal.css')||!out.includes('/v205-bu-modal.js'))throw new Error('V2.0.5 assets ausentes');
if(!read(pub+'/v205-bu-modal.js').includes("childList:true,subtree:true"))throw new Error('V2.0.5 observer seguro ausente');
if(read(pub+'/v205-bu-modal.js').includes("attributeFilter"))throw new Error('V2.0.5 observer de atributos proibido');
if(!read(pub+'/service-worker.js').includes("v2.0.5-unified"))throw new Error('V2.0.5 SW não atualizado');

console.log('V2.0.5 applied: V203/V204 reactive scripts removed; Register BU opening restored with safe scroll handling.');
