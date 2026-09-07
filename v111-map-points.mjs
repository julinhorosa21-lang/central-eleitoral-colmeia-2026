import {readFileSync,writeFileSync,existsSync} from 'node:fs';

const indexPath='/app/public/index.html';
if(!existsSync(indexPath))throw new Error('Map points patch: index.html ausente');

let html=readFileSync(indexPath,'utf8');

const replacements=[
  ['-8.7292556','-8.730540','Arte do Saber latitude'],
  ['-48.764658','-48.763852','Arte do Saber longitude'],
  ['-8.652047','-8.650779','Juscelino latitude'],
  ['-48.851714','-48.852319','Juscelino longitude']
];

for(const [oldValue,newValue,label] of replacements){
  if(!html.includes(oldValue) && !html.includes(newValue)){
    throw new Error(`Map points patch: coordenada-base não encontrada (${label})`);
  }
  html=html.split(oldValue).join(newValue);
}

html=html.replace('coordenadas fixas V0.9','coordenadas fixas V0.10');

const required=['-8.730540','-48.763852','-8.650779','-48.852319'];
for(const value of required){
  if(!html.includes(value))throw new Error(`Map points patch: validação falhou (${value})`);
}

writeFileSync(indexPath,html);
console.log('Mapa V0.10: Arte do Saber (-8.730540,-48.763852) e Escola Juscelino Kubitschek (-8.650779,-48.852319) atualizados com coordenadas confirmadas pelo usuário em 07/09/2026.');
