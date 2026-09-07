import {readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';

const serverPath='/app/server.mjs';
const packagePath='/app/package.json';
const pages=['/app/public/index.html','/app/public/transparencia.html','/app/public/seguranca.html'];
for(const f of [serverPath,packagePath,'/app/public/index.html','/app/public/v111-main.js','/app/public/v111-cleanup.css'])if(!existsSync(f))throw new Error(`V1.1.1 patch: missing ${f}`);

let server=readFileSync(serverPath,'utf8');
if(!server.includes("version:'1.1.1'")){
  if(!server.includes("version:'1.1.0'"))throw new Error('V1.1.1 patch: server version anchor missing');
  server=server.replace("version:'1.1.0'","version:'1.1.1'");
}
const simAnchor="    if (p === '/api/sim/meta') return json(res,200,{ok:true,...simulationMeta()});";
const simGuard="    if (p === '/api/sim' || p.startsWith('/api/sim/')) return json(res,404,{ok:false,error:'not_found'});";
if(!server.includes(simGuard)){
  if(!server.includes(simAnchor))throw new Error('V1.1.1 patch: simulation route anchor missing');
  server=server.replace(simAnchor,`${simGuard}\n${simAnchor}`);
}
server=server.replace("  console.log('Simulação V0.24: banco simulation.sqlite separado, chaves por seção, reset independente e ambiente de treinamento ativos.');\n",'');
server=server.replace("  console.log('V1.1.0: Ensaio Geral com BUs sintéticos em QR e banco simulation.sqlite isolado ativo.');\n",'');
const catalogLog="  console.log('V1.0.2: catálogo de candidaturas TSE sincronizável com snapshot persistente ativo.');";
const cleanupLog="  console.log('V1.1.1: simulação e ensaio removidos da interface; mapa mantido no fluxo normal da página.');";
if(!server.includes(cleanupLog)){
  if(!server.includes(catalogLog))throw new Error('V1.1.1 patch: startup log anchor missing');
  server=server.replace(catalogLog,`${catalogLog}\n${cleanupLog}`);
}
writeFileSync(serverPath,server);

for(const page of pages){
  if(!existsSync(page))continue;
  let html=readFileSync(page,'utf8');
  html=html.replace(/<script\s+src=["']\/v024-main\.js["']><\/script>\s*/g,'');
  html=html.replace(/<script\s+src=["']\/v110-main\.js["']><\/script>\s*/g,'');
  html=html.replace(/<a\b[^>]*href=["']\/(?:simulacao|ensaio)\.html["'][^>]*>[\s\S]*?<\/a>/gi,'');
  if(!html.includes('/v111-cleanup.css')){
    if(!html.includes('</head>'))throw new Error(`V1.1.1 patch: ${page} has no </head>`);
    html=html.replace('</head>','<link rel="stylesheet" href="/v111-cleanup.css">\n</head>');
  }
  if(!html.includes('/v111-main.js')){
    if(!html.includes('</body>'))throw new Error(`V1.1.1 patch: ${page} has no </body>`);
    html=html.replace('</body>','<script src="/v111-main.js"></script>\n</body>');
  }
  writeFileSync(page,html);
}

rmSync('/app/public/simulacao.html',{force:true});
rmSync('/app/public/ensaio.html',{force:true});

const pkg=JSON.parse(readFileSync(packagePath,'utf8'));
pkg.version='1.1.1';
writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
console.log('V1.1.1 cleanup patch applied.');