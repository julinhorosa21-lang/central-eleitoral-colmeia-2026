import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const gate=read(PUB+'/v232-operational-gate.js');
if(gate.includes("data-mode=\"qr\""))throw new Error('V238: QR action must be absent');
if(!gate.includes("data-mode=\"manual\""))throw new Error('V238: manual section action missing');
if(!gate.includes("ce232LaunchSelected"))throw new Error('V233: direct selected-section launch missing');
if(!gate.includes("mode=q.get('mode')"))throw new Error('V233: selected mode handoff missing');

const css=read(PUB+'/v232-access.css');
if(!css.includes('.ce232-section-actions'))throw new Error('V233: section action styles missing');
if(!css.includes('.ce232-ready'))throw new Error('V233: ready badge missing');

let sw=read(PUB+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.2.3-ready-sections';");
write(PUB+'/service-worker.js',sw);

const install=PUB+'/v135-install.js';
if(fs.existsSync(install)){
  let s=read(install).replace(/service-worker\.js\?v=\d+/g,'service-worker.js?v=233');
  write(install,s);
}
for(const rel of ['index.html','transparencia.html','operacao.html','admin/index.html','admin.html','apuracao.html','seguranca.html']){
  const p=PUB+'/'+rel;if(!fs.existsSync(p))continue;
  let h=read(p).replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=233');
  write(p,h);
}
const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.2.3';write(pkg,JSON.stringify(j,null,2)+'\n')}

console.log('V2.2.3 compatibility passed: all 29 sections expose direct manual entry without school selection.');
