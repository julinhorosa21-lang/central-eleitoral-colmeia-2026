import fs from 'node:fs';
import path from 'node:path';

const APP='/app';
const PUB=APP+'/public';
const PHOTO_DIR=PUB+'/candidate-photos';
const CATALOG=PUB+'/data/candidate-catalog.json';
const ACTIVE={presidente:new Set(['13','22']),governador:new Set(['44','45'])};
const KEEP_NAMES=new Set([
  '2t-presidente-13.jpg',
  '2t-presidente-22.jpg',
  '2t-governador-44.jpg',
  '2t-governador-45.jpg'
]);

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const exists=p=>fs.existsSync(p);

function walk(dir){
  if(!exists(dir))return[];
  const out=[];
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name),st=fs.statSync(p);
    if(st.isDirectory())out.push(...walk(p));else out.push(p);
  }
  return out;
}
function sizeOf(files){return files.reduce((n,p)=>n+fs.statSync(p).size,0)}

async function ensureStablePhoto(cargo,c){
  const numero=String(c.numero||'');
  const stableName='2t-'+cargo+'-'+numero+'.jpg';
  const stableAbs=path.join(PHOTO_DIR,stableName);
  if(exists(stableAbs)&&fs.statSync(stableAbs).size>500){
    c.foto='/candidate-photos/'+stableName;
    return stableAbs;
  }

  const localFoto=String(c.foto||'').startsWith('/candidate-photos/')
    ? path.join(PUB,String(c.foto))
    : '';
  const sq=String(c.sqCandidato||'').replace(/\D/g,'');
  const sqPhoto=sq?path.join(PHOTO_DIR,sq+'.jpg'):'';

  if(localFoto&&exists(localFoto)){
    fs.copyFileSync(localFoto,stableAbs);
  }else if(sqPhoto&&exists(sqPhoto)){
    fs.copyFileSync(sqPhoto,stableAbs);
  }else if(/^https:\/\//i.test(String(c.foto||''))){
    const ctl=new AbortController();
    const timer=setTimeout(()=>ctl.abort(),60000);
    try{
      const r=await fetch(String(c.foto),{
        signal:ctl.signal,
        headers:{'user-agent':'Central-Eleitoral-Colmeia/2.1.5'}
      });
      if(!r.ok)throw new Error('HTTP '+r.status);
      const b=Buffer.from(await r.arrayBuffer());
      if(b.length<500)throw new Error('imagem muito pequena');
      fs.writeFileSync(stableAbs,b);
    }finally{clearTimeout(timer)}
  }

  if(!exists(stableAbs)||fs.statSync(stableAbs).size<=500){
    throw new Error('V225: foto do 2º turno ausente para '+cargo+' '+numero);
  }
  c.foto='/candidate-photos/'+stableName;
  return stableAbs;
}

fs.mkdirSync(PHOTO_DIR,{recursive:true});
const beforeFiles=walk(PHOTO_DIR);
const beforeBytes=sizeOf(beforeFiles);

const catalog=JSON.parse(read(CATALOG));
const cargos=Object.keys(catalog.candidates||{}).sort();
if(JSON.stringify(cargos)!==JSON.stringify(['governador','presidente'])){
  throw new Error('V225: catálogo ainda contém cargos fora do 2º turno: '+cargos.join(','));
}
for(const cargo of Object.keys(ACTIVE)){
  const rows=Array.isArray(catalog.candidates?.[cargo])?catalog.candidates[cargo]:[];
  if(rows.length!==2)throw new Error('V225: '+cargo+' deve ter exatamente 2 candidatos');
  for(const c of rows){
    if(!ACTIVE[cargo].has(String(c.numero||'')))throw new Error('V225: candidato inesperado '+cargo+' '+String(c.numero||''));
    await ensureStablePhoto(cargo,c);
  }
}

catalog.version='2.1.5-runoff-minimal';
catalog.turno=2;
catalog.electionDate='2026-10-25';
catalog.activeCargos=['presidente','governador'];
catalog.counts={presidente:2,governador:2};
catalog.substituicoes=[];
write(CATALOG,JSON.stringify(catalog));

let removedFiles=0,removedBytes=0;
for(const p of walk(PHOTO_DIR)){
  const name=path.basename(p);
  if(KEEP_NAMES.has(name))continue;
  const sz=fs.statSync(p).size;
  fs.rmSync(p,{force:true});
  removedFiles++;removedBytes+=sz;
}
for(const name of fs.readdirSync(PHOTO_DIR)){
  const p=path.join(PHOTO_DIR,name);
  if(fs.existsSync(p)&&fs.statSync(p).isDirectory())fs.rmSync(p,{recursive:true,force:true});
}

const retiredAssets=[
  PUB+'/v0241-photos.js',
  PUB+'/v0241-photos.css',
  PUB+'/data/candidate-photo-map.json'
];
for(const p of retiredAssets)fs.rmSync(p,{force:true});

for(const file of walk(PUB).filter(p=>/\.html$/i.test(p))){
  let h=read(file);
  h=h.replace(/\s*<script[^>]+src=["'][^"']*v0241-photos\.js[^"']*["'][^>]*><\/script>/gi,'');
  h=h.replace(/\s*<link[^>]+href=["'][^"']*v0241-photos\.css[^"']*["'][^>]*>/gi,'');
  write(file,h);
}

const swFile=PUB+'/service-worker.js';
let sw=read(swFile);
sw=sw
  .replace(/['"]\/v0241-photos\.js[^'"]*['"]\s*,?/g,'')
  .replace(/['"]\/v0241-photos\.css[^'"]*['"]\s*,?/g,'')
  .replace(/['"]\/data\/candidate-photo-map\.json[^'"]*['"]\s*,?/g,'')
  .replace(/const VERSION='[^']+';/,"const VERSION='v2.1.5-runoff-minimal';");
write(swFile,sw);

const pkg=APP+'/package.json';
if(exists(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.1.5';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

const afterFiles=walk(PHOTO_DIR);
const names=afterFiles.map(p=>path.basename(p)).sort();
const expected=[...KEEP_NAMES].sort();
if(JSON.stringify(names)!==JSON.stringify(expected)){
  throw new Error('V225: candidate-photos final inesperado: '+JSON.stringify(names));
}
for(const rel of ['v0241-photos.js','v0241-photos.css','data/candidate-photo-map.json']){
  if(exists(PUB+'/'+rel))throw new Error('V225: asset proporcional não removido: '+rel);
}
const finalCatalog=JSON.parse(read(CATALOG));
if(Object.keys(finalCatalog.candidates||{}).sort().join(',')!=='governador,presidente'){
  throw new Error('V225: catálogo final contém cargos retirados');
}
if(!read(swFile).includes("v2.1.5-runoff-minimal"))throw new Error('V225: service worker não atualizado');

const afterBytes=sizeOf(afterFiles);
console.log('V2.1.5 runoff minimal assets passed',JSON.stringify({
  beforePhotoFiles:beforeFiles.length,
  afterPhotoFiles:afterFiles.length,
  removedFiles,
  beforePhotoBytes:beforeBytes,
  afterPhotoBytes:afterBytes,
  removedPhotoBytes:removedBytes
}));
