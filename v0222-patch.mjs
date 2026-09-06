import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const indexPath='/app/public/index.html';
const transparencyPath='/app/public/transparencia.html';
const serverPath='/app/server.mjs';
const packagePath='/app/package.json';

function patchHtml(file){
  if(!existsSync(file)) throw new Error(`V0.22.2 patch: missing ${file}`);
  let html=readFileSync(file,'utf8');
  if(!html.includes('/v0222-contrast.css')){
    if(!html.includes('</head>')) throw new Error(`V0.22.2 patch: ${file} has no </head>`);
    html=html.replace('</head>','<link rel="stylesheet" href="/v0222-contrast.css">\n</head>');
  }
  writeFileSync(file,html);
}
patchHtml(indexPath);
patchHtml(transparencyPath);

let server=readFileSync(serverPath,'utf8');
server=server.replace("version:'0.22.1'","version:'0.22.2'");
if(!server.includes('Acessibilidade V0.22.2:')){
  const anchor="console.log('Identidade V0.22.1: linguagem cívica azul/amarelo/verde, header institucional e navegação refinada ativos.');";
  const line="console.log('Acessibilidade V0.22.2: contraste WCAG AA, textos secundários reforçados e foco visível ativos.');";
  if(server.includes(anchor)) server=server.replace(anchor,`${anchor}\n  ${line}`);
  else server += `\n${line}\n`;
}
writeFileSync(serverPath,server);

if(existsSync(packagePath)){
  const pkg=JSON.parse(readFileSync(packagePath,'utf8'));
  pkg.version='0.22.2';
  writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
}
console.log('V0.22.2 accessibility contrast patch applied successfully.');
