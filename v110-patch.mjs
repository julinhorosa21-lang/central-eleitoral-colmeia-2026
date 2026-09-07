import {readFileSync,writeFileSync,existsSync} from 'node:fs';

const serverPath='/app/server.mjs';
const packagePath='/app/package.json';
const pages=['/app/public/index.html','/app/public/transparencia.html','/app/public/seguranca.html','/app/public/simulacao.html'];
for(const f of [serverPath,packagePath,'/app/public/index.html','/app/public/ensaio.html'])if(!existsSync(f))throw new Error(`V1.1.0 patch: missing ${f}`);

let server=readFileSync(serverPath,'utf8');
if(!server.includes("version:'1.1.0'")){
  if(!server.includes("version:'1.0.2'"))throw new Error('V1.1.0 patch: server version anchor missing');
  server=server.replace("version:'1.0.2'","version:'1.1.0'");
}
const oldLog="console.log('V1.0.2: catálogo de candidaturas TSE sincronizável com snapshot persistente ativo.');";
const newLog="console.log('V1.1.0: Ensaio Geral com BUs sintéticos em QR e banco simulation.sqlite isolado ativo.');";
if(!server.includes(newLog)){
  if(!server.includes(oldLog))throw new Error('V1.1.0 patch: startup log anchor missing');
  server=server.replace(oldLog,`${oldLog}\n  ${newLog}`);
}
writeFileSync(serverPath,server);

for(const page of pages){
  if(!existsSync(page))continue;
  let html=readFileSync(page,'utf8');
  if(page.endsWith('/simulacao.html')&&!html.includes('href="/ensaio.html"')){
    const anchor='<a class="btn" href="/seguranca.html">Segurança</a>';
    if(!html.includes(anchor))throw new Error('V1.1.0 patch: simulation link anchor missing');
    html=html.replace(anchor,`${anchor}<a class="btn primary" href="/ensaio.html">Ensaio Geral com QR</a>`);
  }
  if(!html.includes('/v110-main.js')){
    if(!html.includes('</body>'))throw new Error(`V1.1.0 patch: ${page} has no </body>`);
    html=html.replace('</body>','<script src="/v110-main.js"></script>\n</body>');
  }
  writeFileSync(page,html);
}

const pkg=JSON.parse(readFileSync(packagePath,'utf8'));
pkg.version='1.1.0';
writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
console.log('V1.1.0 Ensaio Geral patch applied.');