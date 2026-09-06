import {mkdirSync,writeFileSync,readdirSync,statSync,copyFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {join,basename} from 'node:path';
import {execFileSync} from 'node:child_process';

const PHOTO_ZIP='https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_TO_div.zip';
const CAND_ZIP='https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip';
const OUT='/app/public/candidate-photos';
const DATA='/app/public/data';
const TMP='/tmp/v0241';
mkdirSync(OUT,{recursive:true}); mkdirSync(DATA,{recursive:true}); mkdirSync(TMP,{recursive:true});

async function download(url,file){
  const ctl=new AbortController(); const timer=setTimeout(()=>ctl.abort(),90000);
  try{
    const r=await fetch(url,{signal:ctl.signal,headers:{'user-agent':'Central-Eleitoral-Colmeia/0.24.1'}});
    if(!r.ok) throw new Error(`${url} HTTP ${r.status}`);
    const buf=Buffer.from(await r.arrayBuffer());
    if(buf.length<1000) throw new Error(`${url} returned too little data`);
    writeFileSync(file,buf);
  } finally {clearTimeout(timer)}
}
function walk(dir){
  const out=[];
  for(const name of readdirSync(dir)){
    const p=join(dir,name),st=statSync(p);
    if(st.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}
function csvLine(line){
  const out=[]; let cur='',quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(quoted&&line[i+1]==='"'){cur+='"';i++;} else quoted=!quoted;
    }else if(ch===';'&&!quoted){out.push(cur);cur='';} else cur+=ch;
  }
  out.push(cur); return out;
}
function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}

const photoZip=join(TMP,'photos.zip'),candZip=join(TMP,'candidates.zip');
await download(PHOTO_ZIP,photoZip); await download(CAND_ZIP,candZip);
const photoDir=join(TMP,'photos'),candDir=join(TMP,'candidates');
mkdirSync(photoDir,{recursive:true}); mkdirSync(candDir,{recursive:true});
execFileSync('unzip',['-q','-o',photoZip,'-d',photoDir]);
execFileSync('unzip',['-q','-o',candZip,'-d',candDir]);

const photoIds=new Set();
for(const p of walk(photoDir)){
  const m=basename(p).match(/^FTO(\d+)_div\.(?:jpe?g)$/i);
  if(!m) continue;
  const sq=m[1]; copyFileSync(p,join(OUT,`${sq}.jpg`)); photoIds.add(sq);
}
if(photoIds.size<300) throw new Error(`V0.24.1 assets: only ${photoIds.size} TO photos extracted`);

const csvPath=walk(candDir).find(p=>basename(p).toLowerCase()==='consulta_cand_2026_to.csv');
if(!csvPath||!existsSync(csvPath)) throw new Error('V0.24.1 assets: consulta_cand_2026_TO.csv not found');
let text=readFileSync(csvPath,'latin1').replace(/^\uFEFF/,'');
const lines=text.split(/\r?\n/).filter(Boolean); const header=csvLine(lines.shift());
const idx=Object.fromEntries(header.map((h,i)=>[h,i]));
for(const k of ['SG_UF','DS_CARGO','SQ_CANDIDATO','NR_CANDIDATO','NM_URNA_CANDIDATO','SG_PARTIDO']) if(!(k in idx)) throw new Error(`V0.24.1 assets: CSV missing ${k}`);
const byCargo={depFederal:{},depEstadual:{}}; let missing=0;
for(const line of lines){
  const r=csvLine(line); if(String(r[idx.SG_UF]||'').toUpperCase()!=='TO') continue;
  const cargo=norm(r[idx.DS_CARGO]); const key=cargo==='DEPUTADO FEDERAL'?'depFederal':cargo==='DEPUTADO ESTADUAL'?'depEstadual':null; if(!key) continue;
  const sq=String(r[idx.SQ_CANDIDATO]||'').replace(/\D/g,''),numero=String(r[idx.NR_CANDIDATO]||'').replace(/\D/g,''); if(!sq||!numero) continue;
  if(!photoIds.has(sq)){missing++;continue;}
  byCargo[key][numero]={sq,numero,nome:String(r[idx.NM_URNA_CANDIDATO]||'').trim(),partido:String(r[idx.SG_PARTIDO]||'').trim(),foto:`/candidate-photos/${sq}.jpg`};
}
const federal=Object.keys(byCargo.depFederal).length,estadual=Object.keys(byCargo.depEstadual).length;
if(federal<90||estadual<190) throw new Error(`V0.24.1 assets: suspicious coverage ${federal}/${estadual}, missing photos ${missing}`);
const map={version:'0.24.1',generatedAt:new Date().toISOString(),source:'Portal de Dados Abertos do TSE — consulta_cand_2026 + foto_cand2026_TO_div',coverage:{depFederal:federal,depEstadual:estadual,total:federal+estadual,photoArchive:photoIds.size,missing},byCargo};
writeFileSync(join(DATA,'candidate-photo-map.json'),JSON.stringify(map));
rmSync(TMP,{recursive:true,force:true});
console.log(`V0.24.1 official TSE assets ready: ${photoIds.size} photos; ${federal} federal + ${estadual} estadual mapped.`);
