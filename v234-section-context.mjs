import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const gate=PUB+'/v232-operational-gate.js';
const g=read(gate);
if(!g.includes('CE234_SCOPED_LEGACY_CONTEXT'))throw new Error('V234: scoped legacy context missing');
if(!g.includes("u.sections=[Number(section)]"))throw new Error('V234: selected section scope missing');
if(!g.includes("u.places=[meta.placeId]")&&!g.includes("u.places=[meta.place]"))throw new Error('V234: selected place scope missing');
new Function(g);

let op=read(PUB+'/operacao.html');
op=op.replace('/v232-operational-gate.js?v=232','/v232-operational-gate.js?v=234');
op=op.replace('/v232-access.css?v=232','/v232-access.css?v=234');
write(PUB+'/operacao.html',op);

let sw=read(PUB+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.2.4-section-context';");
write(PUB+'/service-worker.js',sw);

const install=PUB+'/v135-install.js';
if(fs.existsSync(install)){
  let s=read(install).replace(/service-worker\.js\?v=\d+/g,'service-worker.js?v=234');
  write(install,s);
}
for(const rel of ['index.html','transparencia.html','operacao.html','admin/index.html','admin.html','apuracao.html','seguranca.html']){
  const p=PUB+'/'+rel;if(!fs.existsSync(p))continue;
  let h=read(p).replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=234');
  write(p,h);
}

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.2.4';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(!read(PUB+'/operacao.html').includes('/v232-operational-gate.js?v=234'))throw new Error('V234: operation cachebuster missing');
if(!read(PUB+'/service-worker.js').includes('v2.2.4-section-context'))throw new Error('V234: SW version missing');

console.log('V2.2.4 section-context passed: selected section now scopes the legacy school/section UI while server admin permissions remain global.');
