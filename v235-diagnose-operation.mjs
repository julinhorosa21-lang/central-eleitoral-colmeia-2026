import fs from 'node:fs';
const p='/app/public/operacao.html';
const s=fs.readFileSync(p,'utf8');
const terms=[
  'Abrir no Google Maps',
  'Registrar resultado da seção',
  'Aguardando primeira seção',
  'seções apuradas',
  'currentPlace',
  'openPlace',
  'placeId',
  'allowedPlaces',
  'sectionToPlace',
  'maps.google',
  'google.com/maps',
  'coordenação',
  'sections',
  'places'
];
console.log('CE235_DIAG_BEGIN',JSON.stringify({bytes:s.length,scripts:(s.match(/<script/g)||[]).length}));
for(const term of terms){
  let pos=0,count=0;
  const lower=s.toLowerCase(),needle=term.toLowerCase();
  while((pos=lower.indexOf(needle,pos))>=0&&count<4){
    console.log('CE235_DIAG',JSON.stringify({term,pos,snippet:s.slice(Math.max(0,pos-1200),Math.min(s.length,pos+3500))}));
    pos+=needle.length;count++;
  }
}
const funcs=[...s.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]);
console.log('CE235_FUNCTIONS',JSON.stringify([...new Set(funcs)].slice(0,200)));
console.log('CE235_DIAG_END');
