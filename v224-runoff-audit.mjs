import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

function need(file,needle,label){
  const s=read(file);
  if(!s.includes(needle))throw new Error('V224: '+label+' missing in '+file);
}
function forbid(file,needle,label){
  const s=read(file);
  if(s.includes(needle))throw new Error('V224: '+label+' still present in '+file);
}

/* Public/runtime second-round invariants. */
need(APP+'/server.mjs',"const CE220_ACTIVE_CARGOS=new Set(['presidente','governador'])",'active cargos');
need(APP+'/server.mjs',"error:'second_turn_required'",'round guard');
need(APP+'/server.mjs',"inBrazil==='2026-10-25'",'election-day scheduler');
forbid(APP+'/server.mjs',"inBrazil==='2026-10-04'?60*60*1000",'first-round scheduler');

need(PUB+'/v187-ui.js',"Date.parse('2026-10-25T17:00:00-03:00')",'second-round public cutoff');
forbid(PUB+'/v187-ui.js',"Date.parse('2026-10-04T17:00:00-03:00')",'first-round public cutoff');

need(PUB+'/bu-parser.js',"const CARGO_MAP={1:'presidente',3:'governador'};",'runoff BU cargo map');
forbid(PUB+'/bu-parser.js',"5:'senador'",'retired senator BU cargo');
forbid(PUB+'/bu-parser.js',"6:'depFederal'",'retired federal deputy BU cargo');
forbid(PUB+'/bu-parser.js',"7:'depEstadual'",'retired state deputy BU cargo');

need(PUB+'/operacao.html','CE220_QR_SECOND_TURN_GUARD','QR second-round guard');
need(PUB+'/operacao.html',"Number(info.identity.TURN)!==2",'QR fragment round validation');
need(PUB+'/operacao.html',"Number(qrSession.parsed?.meta?.TURN)!==2",'assembled BU round validation');

need(APP+'/v210-ea20.mjs',"const STORE='/data/official-ea20-colmeia-2turno.json';",'isolated official runoff store');
need(APP+'/v210-ea20.mjs',"Date.parse('2026-10-25T17:05:00-03:00')",'official runoff opening time');
need(APP+'/v210-ea20.mjs',"Number(data.t)!==2",'official runoff round validation');

const catalog=JSON.parse(read(PUB+'/data/candidate-catalog.json'));
const keys=Object.keys(catalog.candidates||{}).sort();
if(JSON.stringify(keys)!==JSON.stringify(['governador','presidente']))throw new Error('V224: active candidate catalog contains unexpected cargos: '+keys.join(','));
if((catalog.candidates.presidente||[]).length!==2||(catalog.candidates.governador||[]).length!==2)throw new Error('V224: expected exactly two runoff candidates per cargo');
if(Number(catalog.turno)!==2||catalog.electionDate!=='2026-10-25')throw new Error('V224: catalog election metadata is not second round');

const installFile=PUB+'/v135-install.js';
let install=read(installFile).replaceAll('/service-worker.js?v=222','/service-worker.js?v=224');
if(!install.includes('/service-worker.js?v=224'))throw new Error('V224: service-worker registration cachebuster missing');
write(installFile,install);

for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;
  let h=read(p).replaceAll('/v135-install.js?v=222','/v135-install.js?v=224');
  if(!h.includes('/v135-install.js?v=224'))throw new Error('V224: install cachebuster missing from '+rel);
  write(p,h);
}

const swFile=PUB+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.1.4-runoff';");
write(swFile,sw);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.1.4';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

need(PUB+'/v135-install.js','/service-worker.js?v=224','new service-worker cachebuster');
need(PUB+'/index.html','/v135-install.js?v=224','new installer cachebuster');
need(PUB+'/service-worker.js',"const VERSION='v2.1.4-runoff';",'service-worker V2.1.4');

console.log('V2.1.4 runoff audit passed: active cargos, date, QRBU, official cache, catalog and PWA are coherent for the second round.');
