import fs from 'node:fs';
const p='/app/public/operacao.html';
const s=fs.readFileSync(p,'utf8');
const needles=['Registrar BU','Ler Boletim de Urna pelo QR Code','Confirmar','resultado','Votos por candidato','Comparecimento'];
console.log('CE206_INSPECT_START');
for(const n of needles){
  let i=s.indexOf(n);
  console.log('\nNEEDLE:',n,'INDEX:',i);
  if(i>=0)console.log(s.slice(Math.max(0,i-2200),Math.min(s.length,i+5200)));
}
console.log('\nSTYLE_MATCHES');
for(const re of [/[^{}]*(?:modal|backdrop|sheet|dialog|bottom-nav|footer-nav)[^{}]*\{[^{}]*\}/gi,/[^{}]*(?:overflow|max-height|position:fixed|position:sticky)[^{}]*\{[^{}]*\}/gi]){
  const m=s.match(re)||[];
  console.log(m.slice(0,120).join('\n---\n'));
}
console.log('CE206_INSPECT_END');
