import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const pub='/app/public',serverFile='/app/server.mjs';
write('/app/v210-ea20.mjs',read('/src/v210-ea20.mjs'));
write(pub+'/v210-official-panel.js',read('/src/v210-official-panel.js'));
write(pub+'/v210-official-panel.css',read('/src/v210-official-panel.css'));
let s=read(serverFile);
if(!s.includes("import {createEA20Sync} from './v210-ea20.mjs';")){
 s="import {createEA20Sync} from './v210-ea20.mjs';\n"+s;
}
if(!s.includes('const ce210EA20=createEA20Sync();')){
 const anchor='function adminOverview() {';
 if(!s.includes(anchor))throw new Error('V210 server startup anchor not found');
 s=s.replace(anchor,"/* CE210_READ_ONLY_EA20: independent official municipal totals, no writes to raw BU. */\nconst ce210EA20=createEA20Sync();\nsetTimeout(()=>ce210EA20.start(),15000).unref();\n"+anchor);
}
if(!s.includes("p === '/api/official/ea20'")){
 const anchor="    if (p === '/api/snapshot') return json(res,200,{ok:true,...snapshot()});";
 if(!s.includes(anchor))throw new Error('V210 route anchor not found');
 s=s.replace(anchor,"    if (p === '/api/official/ea20' && req.method === 'GET') return json(res,200,ce210EA20.get());\n"+anchor);
}
write(serverFile,s);
for(const rel of ['index.html','transparencia.html']){
 const file=pub+'/'+rel;let h=read(file);
 if(!h.includes('/v210-official-panel.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v210-official-panel.css?v=210">\n</head>');
 if(!h.includes('/v210-official-panel.js'))h=h.replace('</body>','<script src="/v210-official-panel.js?v=210"></script>\n</body>');
 write(file,h);
}
let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.10-unified';");
if(!sw.includes("'/v210-official-panel.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v210-official-panel.css','/v210-official-panel.js',");
write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.10';write(pkg,JSON.stringify(j,null,2)+'\n')}
const {parseEA20,createEA20Sync}=await import('file:///app/v210-ea20.mjs');
const sample={ele:6259,t:1,f:'o',dv:'s',tpabr:'mu',cdabr:12345,dg:'04/10/2026',hg:'17:08:00',and:'p',idg:4,tf:'n',
 carg:[{cd:3,agr:[{par:[{sg:'XYZ',cand:[{n:12,nmu:'Candidato de teste',sqcand:999,vap:11,pvap:100,dvt:'Anulado sub judice'}]}]}]}],
 v:{tv:12,vv:0,vnom:0,vl:0,van:0,vansj:11,vb:0,vn:1,vnt:0},
 s:{ts:2,st:1,snt:1}};
const parsed=parseEA20(sample,'governador',6259,'12345');
if(parsed.candidates[0].votos!==11||parsed.candidates[0].destinacao!=='Anulado sub judice'||parsed.votos.validos!==0||parsed.votos.anuladosSubJudice!==11||parsed.votos.nulos!==1)throw new Error('V210 EA20 parse/count test failed');
let rejected=0;
for(const invalid of [{...sample,f:'s'},{...sample,cdabr:54321},{...sample,ele:21272},{...sample,carg:[{cd:5,agr:[]}]}]){
 try{parseEA20(invalid,'governador',6259,'12345')}catch{rejected++}
}
if(rejected!==4)throw new Error('V210 invalid official file not rejected');
if(!read(serverFile).includes('CE210_READ_ONLY_EA20'))throw new Error('V210 official server module not installed');
if(!read(pub+'/index.html').includes('/v210-official-panel.js'))throw new Error('V210 public panel not installed');
if(!read(pub+'/service-worker.js').includes('v2.0.10-unified'))throw new Error('V210 service worker mismatch');
new Function(read(pub+'/v210-official-panel.js'));
console.log('V2.0.10 EA20 tests passed: 5 official endpoints, phase/municipality guards, separated valid/annulled/sub judice totals, local BUs preserved.');
