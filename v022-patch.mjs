import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const indexPath='/app/public/index.html';
const transparencyPath='/app/public/transparencia.html';
const serverPath='/app/server.mjs';
const packagePath='/app/package.json';

function patchHtml(file){
  if(!existsSync(file)) throw new Error(`V0.22 patch: missing ${file}`);
  let html=readFileSync(file,'utf8');
  if(!html.includes('/v022-visual.css')){
    if(!html.includes('</head>')) throw new Error(`V0.22 patch: ${file} has no </head>`);
    html=html.replace('</head>','<link rel="stylesheet" href="/v022-visual.css">\n</head>');
  }
  if(!html.includes('/v022-main.js')){
    if(!html.includes('</body>')) throw new Error(`V0.22 patch: ${file} has no </body>`);
    html=html.replace('</body>','<script src="/v022-main.js"></script>\n</body>');
  }
  writeFileSync(file,html);
}

patchHtml(indexPath);
patchHtml(transparencyPath);

let server=readFileSync(serverPath,'utf8');
server=server.replace("version:'0.21.0'","version:'0.22.0'");
if(!server.includes('Visual V0.22:')){
  const anchor="console.log('Transparência V0.21: painel público sem login + totais + seções + atualização em tempo real ativos.');";
  const line="console.log('Visual V0.22: responsividade, navegação rápida, contraste e ergonomia mobile ativos.');";
  if(server.includes(anchor)) server=server.replace(anchor,`${anchor}\n  ${line}`);
  else server += `\n${line}\n`;
}
writeFileSync(serverPath,server);

if(existsSync(packagePath)){
  const pkg=JSON.parse(readFileSync(packagePath,'utf8'));
  pkg.version='0.22.0';
  writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
}

console.log('V0.22 patch applied successfully.');
