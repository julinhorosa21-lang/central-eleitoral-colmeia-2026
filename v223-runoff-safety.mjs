import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/*
  V2.1.3 compatibility stage.
  The earlier V223 archival migration was retired by user request.
  V226 owns the transition and purges first-turn data instead of preserving it.
*/
const server=read(APP+'/server.mjs');
if(!server.includes('CE220_FIRST_TURN_ARCHIVE'))throw new Error('V223: V220 transition block missing');

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.1.3';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

const swFile=PUB+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.1.3-runoff';");
write(swFile,sw);

if(!read(swFile).includes("v2.1.3-runoff"))throw new Error('V223: service-worker version mismatch');
console.log('V2.1.3 compatibility passed: archival migration retired; V226 will purge first-turn data.');
