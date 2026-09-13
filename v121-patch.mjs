import {readFileSync,writeFileSync,existsSync} from 'node:fs';

const pages=['/app/public/index.html','/app/public/transparencia.html','/app/public/seguranca.html'];
for(const file of pages){
  if(!existsSync(file))throw new Error(`V1.2.1 polish: página ausente ${file}`);
  let html=readFileSync(file,'utf8');
  if(!html.includes('/v121-polish.css')){
    if(!html.includes('</head>'))throw new Error(`V1.2.1 polish: ${file} sem </head>`);
    html=html.replace('</head>','<link rel="stylesheet" href="/v121-polish.css">\n</head>');
  }
  if(!html.includes('/v121-polish.js')){
    if(!html.includes('</body>'))throw new Error(`V1.2.1 polish: ${file} sem </body>`);
    html=html.replace('</body>','<script src="/v121-polish.js?v=170"></script>\n</body>');
  }else{
    html=html.replace(/\/v121-polish\.js(?:\?v=\d+)?/g,'/v121-polish.js?v=170');
  }
  writeFileSync(file,html);
}
console.log('V1.2.1/V1.7.0 visual polish applied: public music cache-busted, tablet density and compact panels.');
