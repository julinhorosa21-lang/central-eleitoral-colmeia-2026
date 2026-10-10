import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const share=PUB+'/v191-share.js';
const polish=PUB+'/v157-polish.js';
const iface=PUB+'/v229-tse-interface.js';

for(const p of [share,polish,iface]){
  if(!fs.existsSync(p))throw new Error('V239 missing '+p);
}

/* Garantias do compartilhamento. */
const shareSrc=read(share);
if(!shareSrc.includes("'/candidate-photos/2t-'"))throw new Error('V239 stable runoff photo source missing');
if(!shareSrc.includes("throw new Error('foto_indisponivel')"))throw new Error('V239 mandatory photo guard missing');
if(shareSrc.includes("ctx.fillText(c.posicao+'º'"))throw new Error('V239 placement badge still drawn in share image');
if(!shareSrc.includes('ce216Portrait(ctx,c,96'))throw new Error('V239 portrait layout missing');

/* Garantias dos cards públicos. */
const polishSrc=read(polish);
if(!polishSrc.includes('CE239_NO_CANDIDATE_RANK_BADGES'))throw new Error('V239 rank injection removal missing');
if(polishSrc.includes("s.textContent=(i+1)+'º'"))throw new Error('V239 public rank badge still injected');

const ifaceSrc=read(iface);
if(!ifaceSrc.includes("row.querySelectorAll('.ce161-rank"))throw new Error('V239 stale rank cleanup missing');
new Function(shareSrc);
new Function(polishSrc);
new Function(ifaceSrc);

/* Força os navegadores/PWA a buscar os JS corrigidos. */
for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p);
  h=h.replace(/v191-share\.js\?v=\d+/g,'v191-share.js?v=239');
  h=h.replace(/v229-tse-interface\.js\?v=\d+/g,'v229-tse-interface.js?v=239');
  h=h.replace(/v229-tse-interface\.css\?v=\d+/g,'v229-tse-interface.css?v=239');
  h=h.replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=239');
  write(p,h);
}

const install=PUB+'/v135-install.js';
if(fs.existsSync(install)){
  write(install,read(install).replace(/service-worker\.js\?v=\d+/g,'service-worker.js?v=239'));
}

let sw=read(PUB+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.2.8-share-photos-no-rank';");
write(PUB+'/service-worker.js',sw);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.2.8';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

const expected=[
  '2t-presidente-13.jpg',
  '2t-presidente-22.jpg',
  '2t-governador-44.jpg',
  '2t-governador-45.jpg'
];
for(const file of expected){
  const p=PUB+'/candidate-photos/'+file;
  if(!fs.existsSync(p)||fs.statSync(p).size<500)throw new Error('V239 candidate photo missing: '+file);
}

console.log('V2.2.8 passed: placement badges removed and share image requires real runoff candidate photos.');
