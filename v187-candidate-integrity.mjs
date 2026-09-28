import fs from 'node:fs';
import {join,basename} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const PUB='/app/public';
const DATA=join(PUB,'data');
const OUT=join(PUB,'candidate-photos');
const TMP='/tmp/ce187-candidates';
const CAND_ZIP='https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip';
const BR_PHOTO_ZIP='https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_BR_div.zip';
fs.mkdirSync(DATA,{recursive:true});fs.mkdirSync(OUT,{recursive:true});fs.rmSync(TMP,{recursive:true,force:true});fs.mkdirSync(TMP,{recursive:true});

function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function pretty(v){const s=String(v||'').trim();if(!s)return'';return s.toLocaleLowerCase('pt-BR').replace(/(^|[\s/-])([a-záàâãéêíóôõúç])/g,(m,a,b)=>a+b.toLocaleUpperCase('pt-BR'))}
function csvLine(line){const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++}else quoted=!quoted}else if(ch===';'&&!quoted){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out}
function walk(dir){const out=[];for(const n of fs.readdirSync(dir)){const p=join(dir,n),st=fs.statSync(p);if(st.isDirectory())out.push(...walk(p));else out.push(p)}return out}
function statusInfo(v){
  const s=norm(v),rec=/RECURSO|PRAZO RECURSAL/.test(s);
  if(/RENUNC/.test(s))return{ativo:false,subJudice:false,grupo:'renuncia',score:5};
  if(/FALEC/.test(s))return{ativo:false,subJudice:false,grupo:'falecimento',score:5};
  if(/CANCEL/.test(s))return{ativo:false,subJudice:false,grupo:'cancelada',score:5};
  if(/CASSAD/.test(s)&&!rec)return{ativo:false,subJudice:false,grupo:'cassada',score:8};
  if(/INDEFER/.test(s)&&rec)return{ativo:true,subJudice:true,grupo:'sub_judice',score:80};
  if(/INDEFER/.test(s))return{ativo:false,subJudice:false,grupo:'indeferida',score:10};
  if(/PENDENTE|AGUARDANDO/.test(s))return{ativo:true,subJudice:false,grupo:'pendente',score:85};
  if(/DEFERIDO/.test(s))return{ativo:true,subJudice:false,grupo:'deferida',score:100};
  if(/NAO CONHECIDO|NÃO CONHECIDO/.test(s))return{ativo:false,subJudice:false,grupo:'nao_conhecida',score:10};
  return{ativo:true,subJudice:false,grupo:'outros',score:50};
}
function sqn(v){try{return BigInt(String(v||'0').replace(/\D/g,'')||'0')}catch{return 0n}}
function prefer(a,b){
  const A=statusInfo(a.situacao),B=statusInfo(b.situacao);
  if(A.ativo!==B.ativo)return A.ativo;
  const sa=sqn(a.sqCandidato),sb=sqn(b.sqCandidato);if(sa!==sb)return sa>sb;
  return A.score>B.score;
}
async function fetchBuffer(url,min=100){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),120000);try{const r=await fetch(url,{signal:ctl.signal,headers:{'user-agent':'Central-Eleitoral-Colmeia/1.8.7'}});if(!r.ok)throw new Error(`HTTP ${r.status} ${url}`);const b=Buffer.from(await r.arrayBuffer());if(b.length<min)throw new Error(`arquivo muito pequeno: ${url}`);return b}finally{clearTimeout(timer)}}
async function download(url,path,min=100){fs.writeFileSync(path,await fetchBuffer(url,min))}

function extractPhotoZip(zipPath,dir){fs.mkdirSync(dir,{recursive:true});execFileSync('unzip',['-q','-o',zipPath,'-d',dir],{timeout:120000});let n=0;for(const p of walk(dir)){const m=basename(p).match(/^F[A-Z]{2}(\d+)_div\.(?:jpe?g)$/i);if(!m)continue;fs.copyFileSync(p,join(OUT,`${m[1]}.jpg`));n++}return n}

function parseCandidateCsv(file,scope,groups){
  const text=fs.readFileSync(file,'latin1').replace(/^\uFEFF/,'');const lines=text.split(/\r?\n/).filter(Boolean);const header=csvLine(lines.shift());const idx=Object.fromEntries(header.map((h,i)=>[h,i]));
  for(const k of ['SG_UF','DS_CARGO','SQ_CANDIDATO','NR_CANDIDATO','NM_CANDIDATO','NM_URNA_CANDIDATO','SG_PARTIDO'])if(!(k in idx))throw new Error(`CSV TSE sem ${k}`);
  const statusKey=['DS_SITUACAO_CANDIDATURA','DS_SITUACAO_CANDIDATO_PLEITO','DS_SITUACAO_CANDIDATO_URNA','DS_SITUACAO'].find(k=>k in idx);
  const pleitoKey=['DS_SITUACAO_CANDIDATO_PLEITO'].find(k=>k in idx),urnaKey=['DS_SITUACAO_CANDIDATO_URNA'].find(k=>k in idx);
  for(const line of lines){
    const r=csvLine(line),uf=String(r[idx.SG_UF]||'').toUpperCase();if(scope==='BR'&&uf!=='BR')continue;if(scope==='TO'&&uf!=='TO')continue;
    const c=norm(r[idx.DS_CARGO]);const cargo=c==='PRESIDENTE'?'presidente':c==='GOVERNADOR'?'governador':c==='SENADOR'?'senador':c==='DEPUTADO FEDERAL'?'depFederal':c==='DEPUTADO ESTADUAL'?'depEstadual':null;if(!cargo)continue;if(cargo==='presidente'&&scope!=='BR')continue;if(cargo!=='presidente'&&scope!=='TO')continue;
    const numero=String(r[idx.NR_CANDIDATO]||'').replace(/\D/g,''),sq=String(r[idx.SQ_CANDIDATO]||'').replace(/\D/g,'');if(!numero||!sq)continue;
    const situacao=pretty(statusKey?r[idx[statusKey]]:'');const si=statusInfo(situacao);const localPhoto=join(OUT,`${sq}.jpg`);
    const item={
      nome:String(r[idx.NM_CANDIDATO]||'').trim(),nomeUrna:String(r[idx.NM_URNA_CANDIDATO]||'').trim(),numero,partido:String(r[idx.SG_PARTIDO]||'').trim(),situacao,
      situacaoPleito:pretty(pleitoKey?r[idx[pleitoKey]]:''),situacaoUrna:pretty(urnaKey?r[idx[urnaKey]]:''),sqCandidato:sq,ativo:si.ativo,subJudice:si.subJudice,statusGrupo:si.grupo,
      foto:fs.existsSync(localPhoto)?`/candidate-photos/${sq}.jpg`:`https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/${sq}/${cargo==='presidente'?'BR':'TO'}`,
      fotoFonte:'TSE · Dados Abertos/DivulgaCandContas'
    };
    const key=`${cargo}|${numero}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);
  }
}

async function rebuild(){
  const candZip=join(TMP,'candidatos.zip'),candDir=join(TMP,'cand');await download(CAND_ZIP,candZip,10000);fs.mkdirSync(candDir,{recursive:true});execFileSync('unzip',['-q','-o',candZip,'-d',candDir],{timeout:120000});
  try{const z=join(TMP,'br-fotos.zip'),d=join(TMP,'br-fotos');await download(BR_PHOTO_ZIP,z,500);extractPhotoZip(z,d)}catch(e){console.warn('V1.8.7: fotos BR não atualizadas:',String(e?.message||e))}
  const files=walk(candDir),br=files.find(p=>/^consulta_cand_2026_(?:BR|BRASIL)\.csv$/i.test(basename(p))),to=files.find(p=>/^consulta_cand_2026_TO\.csv$/i.test(basename(p)));if(!br||!to)throw new Error('CSV BR/TO não localizado no pacote oficial');
  const groups=new Map();parseCandidateCsv(br,'BR',groups);parseCandidateCsv(to,'TO',groups);
  const candidates={presidente:[],governador:[],senador:[],depFederal:[],depEstadual:[]},substituicoes=[];
  for(const [key,rows] of groups){const [cargo,numero]=key.split('|');let chosen=rows[0];for(const row of rows.slice(1))if(prefer(row,chosen))chosen=row;candidates[cargo].push(chosen);if(rows.length>1)substituicoes.push({cargo,numero,atual:chosen.sqCandidato,historico:rows.filter(r=>r.sqCandidato!==chosen.sqCandidato).map(r=>({sqCandidato:r.sqCandidato,nomeUrna:r.nomeUrna||r.nome,situacao:r.situacao,statusGrupo:r.statusGrupo}))})}
  for(const k of Object.keys(candidates))candidates[k].sort((a,b)=>Number(a.numero)-Number(b.numero));
  const counts=Object.fromEntries(Object.entries(candidates).map(([k,a])=>[k,a.length]));if(counts.presidente<10||counts.governador<3||counts.senador<5||counts.depFederal<70||counts.depEstadual<150)throw new Error('contagens TSE suspeitas '+JSON.stringify(counts));
  const generatedAt=new Date().toISOString();const payload={version:'1.8.7',generatedAt,source:{name:'Portal de Dados Abertos do TSE',url:CAND_ZIP},counts,candidates,substituicoes};payload.sha256=createHash('sha256').update(JSON.stringify(payload)).digest('hex');fs.writeFileSync(join(DATA,'candidate-catalog.json'),JSON.stringify(payload));
  const pres=candidates.presidente.map(c=>`${c.numero}:${c.nomeUrna||c.nome}:${c.situacao}`).join(' | ');console.log('V1.8.7 catálogo TSE:',pres);return payload;
}

try{await rebuild()}catch(e){console.warn('V1.8.7: mantendo catálogo anterior; atualização oficial falhou:',String(e?.message||e))}finally{fs.rmSync(TMP,{recursive:true,force:true})}

const serverPath='/app/server.mjs';let server=fs.readFileSync(serverPath,'utf8');
server=server.replace(/function candidateStatusRank\(v\)\{[^\n]*\}/,
`function candidateStatusRank(v){const s=candidateNorm(v),rec=/RECURSO|PRAZO RECURSAL/.test(s);if(s.includes('RENUNC')||s.includes('FALEC')||s.includes('CANCEL'))return 0;if(s.includes('CASSAD')&&!rec)return 1;if(s.includes('INDEFER')&&rec)return 80;if(s.includes('INDEFER'))return 5;if(s.includes('PENDENTE')||s.includes('AGUARDANDO'))return 85;if(s.includes('DEFERIDO'))return 100;return 50}\nfunction candidateIsActive(v){const s=candidateNorm(v),rec=/RECURSO|PRAZO RECURSAL/.test(s);if(s.includes('RENUNC')||s.includes('FALEC')||s.includes('CANCEL'))return false;if(s.includes('CASSAD')&&!rec)return false;if(s.includes('INDEFER')&&!rec)return false;return true}\nfunction candidatePrefer(a,b){const aa=candidateIsActive(a.situacao),bb=candidateIsActive(b.situacao);if(aa!==bb)return aa;let as=0n,bs=0n;try{as=BigInt(String(a.sqCandidato||'0'))}catch{}try{bs=BigInt(String(b.sqCandidato||'0'))}catch{}if(as!==bs)return as>bs;return candidateStatusRank(a.situacao)>candidateStatusRank(b.situacao)}`);
server=server.replace("const prev=candidates[key].get(numero);if(!prev||candidateStatusRank(item.situacao)>candidateStatusRank(prev.situacao))candidates[key].set(numero,item);","const prev=candidates[key].get(numero);if(!prev||candidatePrefer(item,prev))candidates[key].set(numero,item);");

const startup="console.log('V1.0.2: catálogo de candidaturas TSE sincronizável com snapshot persistente ativo.');";
if(server.includes(startup)&&!server.includes('CE187_AUTO_CANDIDATE_REFRESH')){
  server=server.replace(startup,`${startup}\n  /* CE187_AUTO_CANDIDATE_REFRESH */\n  const ce187Refresh=()=>refreshCandidateCatalogFromTse().then(s=>console.log('V1.8.7: catálogo TSE atualizado',JSON.stringify(s.counts))).catch(e=>console.warn('V1.8.7: atualização TSE preservou snapshot anterior',String(e?.message||e)));\n  setTimeout(ce187Refresh,12000);setInterval(ce187Refresh,12*60*60*1000);`);
}
fs.writeFileSync(serverPath,server);
if(!server.includes('candidatePrefer(item,prev)'))throw new Error('V1.8.7: seletor de candidaturas não aplicado');
if(!server.includes('CE187_AUTO_CANDIDATE_REFRESH'))throw new Error('V1.8.7: atualização automática não aplicada');
console.log('V1.8.7: integridade de candidaturas aplicada.');
