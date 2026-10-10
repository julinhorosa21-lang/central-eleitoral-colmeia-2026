import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const gate=read(PUB+'/v232-operational-gate.js');
if(!gate.includes('CE238_MANUAL_ONLY'))throw new Error('V238 manual-only marker missing');
if(gate.includes('data-mode="qr"'))throw new Error('V238 QR section action still present');
if(!gate.includes('data-mode="manual"'))throw new Error('V238 manual section action missing');
if(!gate.includes('ce238RemoveQrUi'))throw new Error('V238 QR DOM cleanup missing');
new Function(gate);

const css=read(PUB+'/v232-access.css');
if(!css.includes('CE238_MANUAL_ONLY_UI'))throw new Error('V238 manual-only CSS missing');
if(!css.includes('#qrTools,#qrSummary'))throw new Error('V238 QR tools CSS guard missing');

let op=read(PUB+'/operacao.html');
op=op.replace(/v232-operational-gate\.js\?v=\d+/g,'v232-operational-gate.js?v=238');
op=op.replace(/v232-access\.css\?v=\d+/g,'v232-access.css?v=238');
op=op.replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=238');
write(PUB+'/operacao.html',op);

const install=PUB+'/v135-install.js';
if(fs.existsSync(install)){
  write(install,read(install).replace(/service-worker\.js\?v=\d+/g,'service-worker.js?v=238'));
}
for(const rel of ['index.html','transparencia.html','admin/index.html','admin.html','apuracao.html','seguranca.html']){
  const p=PUB+'/'+rel;
  if(fs.existsSync(p))write(p,read(p).replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=238'));
}

let sw=read(PUB+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.2.7-manual-only';");
write(PUB+'/service-worker.js',sw);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.2.7';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

if(!read(PUB+'/operacao.html').includes('v232-operational-gate.js?v=238'))throw new Error('V238 gate cachebuster missing');
if(!read(PUB+'/service-worker.js').includes('v2.2.7-manual-only'))throw new Error('V238 SW version missing');

console.log('V2.2.7 manual-only passed: QRBU readers removed from operation; all sections open manual result entry.');
