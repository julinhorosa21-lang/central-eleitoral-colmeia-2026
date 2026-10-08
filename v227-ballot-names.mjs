import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const SERVER=APP+'/server.mjs';
const CATALOG=PUB+'/data/candidate-catalog.json';
const BALLOT_NAMES={
  '44':'PROFESSORA DORINHA',
  '45':'VICENTINHO JÚNIOR'
};
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

function applyBallotName(c){
  const n=BALLOT_NAMES[String(c?.numero||'')];
  if(!n)return;
  if(c.nome&&!c.nomeCompleto)c.nomeCompleto=c.nome;
  c.nome=n;
  c.nomeUrna=n;
  c.nome_urna=n;
}

const catalog=JSON.parse(read(CATALOG));
for(const c of (catalog.candidates?.governador||[]))applyBallotName(c);
catalog.version='2.1.7-ballot-names';
write(CATALOG,JSON.stringify(catalog));

let server=read(SERVER);
const activeAnchor="const CE220_ACTIVE_NUMBERS={presidente:new Set(['13','22']),governador:new Set(['44','45'])};";
if(!server.includes('CE227_GOVERNOR_BALLOT_NAMES')){
  if(!server.includes(activeAnchor))throw new Error('V227: active-number anchor missing');
  server=server.replace(
    activeAnchor,
    activeAnchor+"\n/* CE227_GOVERNOR_BALLOT_NAMES */\nconst CE227_GOVERNOR_BALLOT_NAMES={'44':'PROFESSORA DORINHA','45':'VICENTINHO JÚNIOR'};"
  );
  const photoLine="if(ce220fs.existsSync('/app/public'+local))c.foto=local;";
  if(!server.includes(photoLine))throw new Error('V227: candidate loop anchor missing');
  server=server.replace(
    photoLine,
    photoLine+"\n      if(cargo==='governador'){const ce227Name=CE227_GOVERNOR_BALLOT_NAMES[String(c.numero||'')];if(ce227Name){if(c.nome&&!c.nomeCompleto)c.nomeCompleto=c.nome;c.nome=ce227Name;c.nomeUrna=ce227Name;c.nome_urna=ce227Name;}}"
  );
}
write(SERVER,server);

const runoffFile=PUB+'/v220-second-turn.js';
if(fs.existsSync(runoffFile)){
  let s=read(runoffFile);
  if(!s.includes('CE227_GOVERNOR_BALLOT_NAMES')){
    const marker="CANDIDATOS.governador=(Array.isArray(CANDIDATOS.governador)?CANDIDATOS.governador:[]).filter(c=>ce225Keep.governador.has(String(c.numero||'')));";
    if(!s.includes(marker))throw new Error('V227: runoff governor anchor missing');
    s=s.replace(marker,marker+"/* CE227_GOVERNOR_BALLOT_NAMES */for(const c of CANDIDATOS.governador){const n=String(c.numero||'')==='44'?'PROFESSORA DORINHA':String(c.numero||'')==='45'?'VICENTINHO JÚNIOR':'';if(n){if(c.nome&&!c.nomeCompleto)c.nomeCompleto=c.nome;c.nome=n;c.nomeUrna=n;c.nome_urna=n;}}");
  }
  new Function(s);
  write(runoffFile,s);
}

const installFile=PUB+'/v135-install.js';
if(fs.existsSync(installFile)){
  let s=read(installFile).replaceAll('/service-worker.js?v=226','/service-worker.js?v=227');
  if(!s.includes('/service-worker.js?v=227'))throw new Error('V227: service worker cachebuster missing');
  write(installFile,s);
}
for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p).replaceAll('/v135-install.js?v=226','/v135-install.js?v=227');
  if(!h.includes('/v135-install.js?v=227'))throw new Error('V227: installer cachebuster missing in '+rel);
  write(p,h);
}

const swFile=PUB+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.1.7-ballot-names';");
write(swFile,sw);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.1.7';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

const final=JSON.parse(read(CATALOG));
const gov=Object.fromEntries((final.candidates?.governador||[]).map(c=>[String(c.numero),String(c.nome||'')]));
if(gov['44']!=='PROFESSORA DORINHA')throw new Error('V227: nome de urna 44 incorreto: '+gov['44']);
if(gov['45']!=='VICENTINHO JÚNIOR')throw new Error('V227: nome de urna 45 incorreto: '+gov['45']);
if(!read(SERVER).includes('CE227_GOVERNOR_BALLOT_NAMES'))throw new Error('V227: runtime server guard missing');
if(!read(runoffFile).includes('CE227_GOVERNOR_BALLOT_NAMES'))throw new Error('V227: runtime client guard missing');

console.log('V2.1.7 ballot names passed: 44 PROFESSORA DORINHA; 45 VICENTINHO JÚNIOR.');
