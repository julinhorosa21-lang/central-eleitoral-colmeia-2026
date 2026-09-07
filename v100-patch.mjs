import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const serverPath='/app/server.mjs';
const packagePath='/app/package.json';
const photoScriptPath='/app/public/v0241-photos.js';
const pages=['/app/public/index.html','/app/public/transparencia.html','/app/public/seguranca.html','/app/public/simulacao.html'];
for(const f of [serverPath,packagePath,photoScriptPath,...pages]) if(!existsSync(f)) throw new Error(`V1.0 patch: missing ${f}`);

let server=readFileSync(serverPath,'utf8');
if(server.includes("version:'0.24.1'")) server=server.replace("version:'0.24.1'","version:'1.0.0'");
else if(!server.includes("version:'1.0.0'")) throw new Error('V1.0 patch: server version anchor missing');
const photoLog="console.log('Fotos V0.24.1: fotografias oficiais do TSE para Deputado Federal e Estadual ativas.');";
const stableLog="console.log('V1.0: versão estável consolidada, preflight integral e PWA final ativos.');";
if(!server.includes(stableLog)){
  if(!server.includes(photoLog)) throw new Error('V1.0 patch: startup log anchor missing');
  server=server.replace(photoLog,`${photoLog}\n  ${stableLog}`);
}
writeFileSync(serverPath,server);

let photoScript=readFileSync(photoScriptPath,'utf8');
const photoRunOld='function run(){scheduled=false;decorateTransparency();decorateCatalog();decorateGenericResults();updateVersion()}';
const photoRunStable='function run(){scheduled=false;decorateTransparency();decorateCatalog();decorateGenericResults()}';
if(photoScript.includes(photoRunOld)){
  photoScript=photoScript.replace(photoRunOld,photoRunStable);
  writeFileSync(photoScriptPath,photoScript);
}else if(!photoScript.includes(photoRunStable)) throw new Error('V1.0 patch: photo script version-update anchor missing');

for(const file of pages){
  let html=readFileSync(file,'utf8');
  if(!html.includes('/v100-main.js')){
    if(!html.includes('</body>')) throw new Error(`V1.0 patch: ${file} has no </body>`);
    html=html.replace('</body>','<script src="/v100-main.js"></script>\n</body>');
    writeFileSync(file,html);
  }
}

const pkg=JSON.parse(readFileSync(packagePath,'utf8'));
pkg.version='1.0.0';
writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
console.log('V1.0 stable release patch applied.');
