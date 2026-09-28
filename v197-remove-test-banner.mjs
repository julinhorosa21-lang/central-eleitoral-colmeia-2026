import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* V1.9.7 — remove o banner amarelo público sem perder o estado interno de teste. */
const uiPath=pub+'/v187-ui.js';
let ui=read(uiPath);

const start=ui.indexOf('function ensurePreElectionNotice(){');
const end=start>=0?ui.indexOf('function fixCompletionNote()',start):-1;
if(start<0||end<0)throw new Error('V1.9.7: ensurePreElectionNotice não localizado');

const replacement=String.raw`function ensurePreElectionNotice(){
 const PUBLIC=new Set(['/','/index.html','/transparencia.html']);if(!PUBLIC.has(location.pathname))return;
 const cutoff=Date.parse('2026-10-04T17:00:00-03:00'),pre=Date.now()<cutoff;
 document.documentElement.classList.toggle('ce187-pre-election',pre);
 document.getElementById('ce187TestNotice')?.remove();
}
`;

ui=ui.slice(0,start)+replacement+ui.slice(end);
write(uiPath,ui);

/* Remove também o estilo específico para evitar reaparecimento por CSS legado. */
const cssPath=pub+'/v187-ui.css';
let css=read(cssPath);
css=css.replace(//* Aviso obrigatório enquanto a Central opera com dados de ensaio antes da eleição. */[sS]*?@media(max-width:600px){.ce187-test-notice{[sS]*?}}s*/,'');
write(cssPath,css);

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.9.7-unified';");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='1.9.7';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(read(uiPath).includes('AMBIENTE DE TESTE · DADOS NÃO OFICIAIS'))throw new Error('V1.9.7 banner ainda presente');
if(!read(uiPath).includes("classList.toggle('ce187-pre-election',pre)"))throw new Error('V1.9.7 estado de teste interno perdido');
if(!read(pub+'/service-worker.js').includes("v1.9.7-unified"))throw new Error('V1.9.7 SW não atualizado');

console.log('V1.9.7 applied: visible pre-election yellow banner removed; internal test state preserved.');
