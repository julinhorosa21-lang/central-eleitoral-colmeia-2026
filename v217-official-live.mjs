import fs from 'node:fs';
const pub='/app/public',read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
write(pub+'/v217-official-live.js',read('/src/v217-official-live.js'));
write(pub+'/v217-official-live.css',read('/src/v217-official-live.css'));
for(const rel of ['index.html','transparencia.html']){
 const p=pub+'/'+rel;let h=read(p);
 h=h.replace(/<script[^>]+src=["']\/v210-official-panel\.js\?v=\d+["'][^>]*><\/script>\s*/g,'');
 if(!h.includes('/v217-official-live.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v217-official-live.css?v=217">\n</head>');
 if(!h.includes('/v217-official-live.js'))h=h.replace('</body>','<script src="/v217-official-live.js?v=217"></script>\n</body>');
 write(p,h);
}
let sw=read(pub+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.0.17-unified';");
if(!sw.includes("'/v217-official-live.js'"))sw=sw.replace('const CORE=[',"const CORE=['/v217-official-live.css','/v217-official-live.js',");
write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.17';write(pkg,JSON.stringify(j,null,2)+'\n')}
new Function(read(pub+'/v217-official-live.js'));
if(!read(pub+'/index.html').includes('/v217-official-live.js?v=217'))throw new Error('V217 public module missing');
if(read(pub+'/index.html').includes('/v210-official-panel.js'))throw new Error('V217 legacy official loader still active');
if(!read(pub+'/service-worker.js').includes('v2.0.17-unified'))throw new Error('V217 SW mismatch');
console.log('V2.0.17 tests passed: direct TSE EA20 client sync, Colmeia 95290, official main ranking and all-candidate panel; local BU storage untouched.');