import fs from 'node:fs';

const PUB='/app/public';
const SERVER='/app/server.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* V2.1.2 — acabamento da migração para o 2º turno.
   Mantém o estado pré-apuração até 25/10, alinha a rotina de atualização
   de candidaturas ao domingo do 2º turno e força atualização limpa do PWA. */

let server=read(SERVER);
const oldElectionDay="inBrazil==='2026-10-04'?60*60*1000:3*60*60*1000";
const newElectionDay="inBrazil==='2026-10-25'?60*60*1000:3*60*60*1000";
if(server.includes(oldElectionDay))server=server.replace(oldElectionDay,newElectionDay);
if(!server.includes(newElectionDay))throw new Error('V222: election-day candidate refresh schedule not updated');
write(SERVER,server);

const uiFile=PUB+'/v187-ui.js';
let ui=read(uiFile);
ui=ui.replace("Date.parse('2026-10-04T17:00:00-03:00')","Date.parse('2026-10-25T17:00:00-03:00')");
if(!ui.includes("Date.parse('2026-10-25T17:00:00-03:00')"))throw new Error('V222: pre-election cutoff not moved to second round');
write(uiFile,ui);

const installFile=PUB+'/v135-install.js';
let install=read(installFile);
install=install.replaceAll('/service-worker.js?v=221','/service-worker.js?v=222');
if(!install.includes('/service-worker.js?v=222'))throw new Error('V222: service-worker registration cachebuster missing');
write(installFile,install);

for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;
  let h=read(p);
  h=h.replaceAll('/v135-install.js?v=221','/v135-install.js?v=222');
  if(!h.includes('/v135-install.js?v=222'))throw new Error('V222: install asset cachebuster missing from '+rel);
  write(p,h);
}

const swFile=PUB+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.1.2-runoff';");
write(swFile,sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.1.2';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

if(!read(SERVER).includes("inBrazil==='2026-10-25'"))throw new Error('V222: server still uses first-round election day');
if(!read(uiFile).includes("2026-10-25T17:00:00-03:00"))throw new Error('V222: UI still uses first-round cutoff');
if(!read(installFile).includes('/service-worker.js?v=222'))throw new Error('V222: PWA registration not bumped');
if(!read(swFile).includes("v2.1.2-runoff"))throw new Error('V222: service-worker version mismatch');

console.log('V2.1.2 runoff polish passed: pre-election state until 25/10, election-day candidate refresh aligned, PWA cachebusters renewed.');
