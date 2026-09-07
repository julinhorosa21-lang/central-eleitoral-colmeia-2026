import {readFileSync,writeFileSync,existsSync} from 'node:fs';

const indexPath='/app/public/index.html';
if(!existsSync(indexPath))throw new Error('Map points patch: index.html ausente');

let html=readFileSync(indexPath,'utf8');
const points=[
  {id:'arte-saber',lat:'-8.730540',lng:'-48.763852',status:'confirmada'},
  {id:'goiany',lat:'-8.650779',lng:'-48.852319',status:'confirmada'}
];

for(const point of points){
  const re=new RegExp(`(\\{id:'${point.id}'[^}]*?\\blat:)-?\\d+(?:\\.\\d+)?(,lng:)-?\\d+(?:\\.\\d+)?`);
  if(!re.test(html))throw new Error(`Map points patch: local ${point.id} não encontrado`);
  html=html.replace(re,`$1${point.lat}$2${point.lng}`);

  if(point.id==='arte-saber'){
    const statusRe=/(\{id:'arte-saber'[^}]*?coordenadaStatus:)'[^']*'/;
    if(statusRe.test(html))html=html.replace(statusRe,`$1'${point.status}'`);
  }
}

html=html.replace('coordenadas fixas V0.9','coordenadas fixas V0.10');

for(const point of points){
  const exact=`lat:${point.lat},lng:${point.lng}`;
  if(!html.includes(exact))throw new Error(`Map points patch: validação falhou para ${point.id}`);
}

writeFileSync(indexPath,html);
console.log('Mapa V0.10: Arte do Saber e Escola Juscelino Kubitschek atualizados com coordenadas confirmadas pelo usuário em 07/09/2026.');
