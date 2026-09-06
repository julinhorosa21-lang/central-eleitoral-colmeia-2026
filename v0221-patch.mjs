import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const indexPath='/app/public/index.html';
const transparencyPath='/app/public/transparencia.html';
const serverPath='/app/server.mjs';
const packagePath='/app/package.json';

function patchHtml(file){
  if(!existsSync(file)) throw new Error(`V0.22.1 patch: missing ${file}`);
  let html=readFileSync(file,'utf8');
  if(!html.includes('/v0221-civic.css')){
    if(!html.includes('</head>')) throw new Error(`V0.22.1 patch: ${file} has no </head>`);
    html=html.replace('</head>','<link rel="stylesheet" href="/v0221-civic.css">\n</head>');
  }
  if(!html.includes('/v0221-civic.js')){
    if(!html.includes('</body>')) throw new Error(`V0.22.1 patch: ${file} has no </body>`);
    html=html.replace('</body>','<script src="/v0221-civic.js"></script>\n</body>');
  }
  writeFileSync(file,html);
}

patchHtml(indexPath);
patchHtml(transparencyPath);

let server=readFileSync(serverPath,'utf8');
server=server.replace("version:'0.22.0'","version:'0.22.1'");
if(!server.includes('Identidade V0.22.1:')){
  const anchor="console.log('Visual V0.22: responsividade, navegação rápida, contraste e ergonomia mobile ativos.');";
  const line="console.log('Identidade V0.22.1: linguagem cívica azul/amarelo/verde, header institucional e navegação refinada ativos.');";
  if(server.includes(anchor)) server=server.replace(anchor,`${anchor}\n  ${line}`);
  else server += `\n${line}\n`;
}
writeFileSync(serverPath,server);

if(existsSync(packagePath)){
  const pkg=JSON.parse(readFileSync(packagePath,'utf8'));
  pkg.version='0.22.1';
  writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
}

console.log('V0.22.1 civic identity patch applied successfully.');
