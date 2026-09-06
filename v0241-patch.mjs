import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const serverPath='/app/server.mjs',indexPath='/app/public/index.html',transparencyPath='/app/public/transparencia.html';
for(const f of [serverPath,indexPath,transparencyPath]) if(!existsSync(f)) throw new Error(`V0.24.1 patch: missing ${f}`);
function inject(html,needle,asset){return html.includes(asset)?html:html.replace(needle,`${asset}\n${needle}`)}
let server=readFileSync(serverPath,'utf8');
if(server.includes("version:'0.24.0'")) server=server.replace("version:'0.24.0'","version:'0.24.1'");
else if(!server.includes("version:'0.24.1'")) throw new Error('V0.24.1 patch: version anchor missing');
const anchor="console.log('Simulação V0.24: banco simulation.sqlite separado, chaves por seção, reset independente e ambiente de treinamento ativos.');";
const log="console.log('Fotos V0.24.1: fotografias oficiais do TSE para Deputado Federal e Estadual ativas.');";
if(!server.includes(log)){if(!server.includes(anchor)) throw new Error('V0.24.1 patch: log anchor missing'); server=server.replace(anchor,`${anchor}\n${log}`)}
writeFileSync(serverPath,server);
for(const p of [indexPath,transparencyPath]){
  let html=readFileSync(p,'utf8');
  html=inject(html,'</head>','<link rel="stylesheet" href="/v0241-photos.css">');
  html=inject(html,'</body>','<script src="/v0241-photos.js"></script>');
  writeFileSync(p,html);
}
console.log('V0.24.1 photo UI patch applied.');
