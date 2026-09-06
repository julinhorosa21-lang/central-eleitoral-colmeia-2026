import { readFileSync } from 'node:fs';

const css=readFileSync('/app/public/v0222-contrast.css','utf8');
const pairs=[
  ['#102f55','#ffffff','texto principal em cartão'],
  ['#52606d','#ffffff','texto secundário em cartão'],
  ['#07377c','#ffffff','azul institucional em branco'],
  ['#ffffff','#06285d','texto branco no azul escuro'],
  ['#ffffff','#09499e','texto branco no azul médio'],
  ['#06285d','#ffd21c','texto azul sobre amarelo'],
  ['#08732c','#edf9f0','status conferido'],
  ['#754f00','#fff8d9','status prévia/aviso'],
  ['#8f2118','#fff1ef','status divergente']
];

function rgb(hex){hex=hex.replace('#','');return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255)}
function channel(v){return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
function luminance(hex){const [r,g,b]=rgb(hex).map(channel);return .2126*r+.7152*g+.0722*b}
function contrast(a,b){const x=luminance(a),y=luminance(b);const hi=Math.max(x,y),lo=Math.min(x,y);return (hi+.05)/(lo+.05)}

for(const [fg,bg,label] of pairs){
  if(!css.toLowerCase().includes(fg)||!css.toLowerCase().includes(bg)) throw new Error(`Contraste V0.22.2: token ausente em ${label}`);
  const value=contrast(fg,bg);
  if(value<4.5) throw new Error(`Contraste V0.22.2 reprovado: ${label} = ${value.toFixed(2)}:1`);
  console.log(`✓ ${label}: ${value.toFixed(2)}:1`);
}
console.log('V0.22.2 contrast audit: all critical text pairs meet WCAG AA 4.5:1.');
