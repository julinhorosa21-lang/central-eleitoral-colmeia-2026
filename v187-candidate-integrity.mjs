import fs from 'node:fs';
import {join,basename} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const PUB='/app/public';
const DATA=join(PUB,'data');
const OUT=join(PUB,'candidate-photos');
const TMP='/tmp/ce187-candidates';
const CAND_ZIP='https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip';
const COMP_ZIP='https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand_complementar/consulta_cand_complementar_2026.zip';
const CASS_ZIP='https://cdn.tse.jus.br/estatistica/sead/odsele/motivo_cassacao/motivo_cassacao_2026.zip';
const HIST_ZIP='https://cdn.tse.jus.br/estatistica/sead/odsele/historico_candidatura/historico_candidatura_2026.zip';
const BR_PHOTO_ZIP='https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_BR_div.zip';
fs.mkdirSync(DATA,{recursive:true});fs.mkdirSync(OUT,{recursive:true});fs.rmSync(TMP,{recursive:true,force:true});fs.mkdirSync(TMP,{recursive:true});

function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function pretty(v){const s=String(v||'').trim();if(!s)return'';return s.toLocaleLowerCase('pt-BR').replace(/(^|[\s/-])([a-záàâãéêíóôõúç])/g,(m,a,b)=>a+b.toLocaleUpperCase('pt-BR'))}
function clean(v){const s=String(v??'').trim();return !s||s==='-1'||/^#(?:NE|NULO)$/i.test(s)?'':s}
function csvLine(line){const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++}else quoted=!quoted}else if(ch===';'&&!quoted){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out}
function walk(dir){const out=[];for(const n of fs.readdirSync(dir)){const p=join(dir,n),st=fs.statSync(p);if(st.isDirectory())out.push(...walk(p));else out.push(p)}return out}
function statusInfo(input){
  const combined=norm([input?.situacao,input?.situacaoJulgamento,input?.situacaoPleito,input?.situacaoUrna,input?.situacaoCassacao,input?.destinacaoVotos].filter(Boolean).join(' | '));
  const rec=/RECURSO|PRAZO RECURSAL/.test(combined);
  if(input?.substituido===true)return{ativo:false,subJudice:false,grupo:'substituida',score:2};
  if(/RENUNC/.test(combined))return{ativo:false,subJudice:false,grupo:'renuncia',score:5};
  if(/FALEC/.test(combined))return{ativo:false,subJudice:false,grupo:'falecimento',score:5};
  if(/CANCEL/.test(combined))return{ativo:false,subJudice:false,grupo:'cancelada',score:5};
  if(/CASSAD/.test(combined)&&!rec)return{ativo:false,subJudice:false,grupo:'cassada',score:8};
  if(/INDEFER/.test(combined)&&rec)return{ativo:true,subJudice:true,grupo:'sub_judice',score:80};
  if(/INDEFER/.test(combined))return{ativo:false,subJudice:false,grupo:'indeferida',score:10};
  if(/NAO CONHECIDO|PEDIDO NAO CONHECIDO/.test(combined))return{ativo:false,subJudice:false,grupo:'nao_conhecida',score:10};
  if(/AGUARDANDO JULGAMENTO|PENDENTE/.test(combined))return{ativo:true,subJudice:false,grupo:'pendente',score:85};
  if(/DEFERIDO/.test(combined))return{ativo:true,subJudice:false,grupo:'deferida',score:100};
  return{ativo:true,subJudice:false,grupo:'outros',score:50};
}
function sqn(v){try{return BigInt(String(v||'0').replace(/\D/g,'')||'0')}catch{return 0n}}
function prefer(a,b){
  if(a.ativo!==b.ativo)return a.ativo;
  if(a.subJudice!==b.subJudice&&a.ativo&&b.ativo)return !a.subJudice;
  const sa=sqn(a.sqCandidato),sb=sqn(b.sqCandidato);if(sa!==sb)return sa>sb;
  return Number(a.statusScore||0)>Number(b.statusScore||0);
}
async function fetchBuffer(url,min=100){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),120000);try{const r=await fetch(url,{signal:ctl.signal,headers:{'user-agent':'Central-Eleitoral-Colmeia/1.8.7'}});if(!r.ok)throw new Error(`HTTP ${r.status} ${url}`);const b=Buffer.from(await r.arrayBuffer());if(b.length<min)throw new Error(`arquivo muito pequeno: ${url}`);return b}finally{clearTimeout(timer)}}
async function download(url,path,min=100){fs.writeFileSync(path,await fetchBuffer(url,min))}
function unzip(zip,dir){fs.mkdirSync(dir,{recursive:true});execFileSync('unzip',['-q','-o',zip,'-d',dir],{timeout:120000})}
function extractPhotoZip(zipPath,dir){unzip(zipPath,dir);let n=0;for(const p of walk(dir)){const m=basename(p).match(/^F[A-Z]{2}(\d+)_div\.(?:jpe?g)$/i);if(!m)continue;fs.copyFileSync(p,join(OUT,`${m[1]}.jpg`));n++}return n}
function headerIndex(file){const text=fs.readFileSync(file,'latin1').replace(/^\uFEFF/,'');const lines=text.split(/\r?\n/).filter(Boolean),header=csvLine(lines.shift());return{lines,idx:Object.fromEntries(header.map((h,i)=>[h,i]))}}
function get(r,idx,k){return k in idx?String(r[idx[k]]??'').trim():''}

function parseComplementary(file,map){
  const {lines,idx}=headerIndex(file);if(!('SQ_CANDIDATO' in idx))throw new Error('Complementar TSE sem SQ_CANDIDATO');
  for(const line of lines){
    const r=csvLine(line),sq=get(r,idx,'SQ_CANDIDATO').replace(/\D/g,'');if(!sq)continue;
    const obj={
      detalhe:pretty(clean(get(r,idx,'DS_DETALHE_SITUACAO_CAND'))),
      situacaoCandidatoPleito:pretty(clean(get(r,idx,'DS_SITUACAO_CANDIDATO_PLEITO'))),
      situacaoCandidatoUrna:pretty(clean(get(r,idx,'DS_SITUACAO_CANDIDATO_URNA'))),
      situacaoCandidatoTot:pretty(clean(get(r,idx,'DS_SITUACAO_CANDIDATO_TOT'))),
      situacaoJulgamento:pretty(clean(get(r,idx,'DS_SITUACAO_JULGAMENTO'))),
      situacaoJulgamentoPleito:pretty(clean(get(r,idx,'DS_SITUACAO_JULGAMENTO_PLEITO'))),
      situacaoJulgamentoUrna:pretty(clean(get(r,idx,'DS_SITUACAO_JULGAMENTO_URNA'))),
      situacaoCassacao:pretty(clean(get(r,idx,'DS_SITUACAO_CASSACAO'))),
      situacaoCassacaoMidia:pretty(clean(get(r,idx,'DS_SITUACAO_CASSACAO_MIDIA'))),
      destinacaoVotos:pretty(clean(get(r,idx,'NM_TIPO_DESTINACAO_VOTOS'))),
      inseridoUrna:/^S$/i.test(get(r,idx,'ST_CANDIDATO_INSERIDO_URNA')),
      substituido:/^S$/i.test(get(r,idx,'ST_SUBSTITUIDO')),
      sqSubstituido:get(r,idx,'SQ_SUBSTITUIDO').replace(/\D/g,'')
    };
    map.set(sq,obj);
  }
}
function parseOptionalReason(file,map){
  const {lines,idx}=headerIndex(file);if(!('SQ_CANDIDATO' in idx))return;
  const textKeys=Object.keys(idx).filter(k=>/MOTIVO|CASSAC|DESCR/i.test(k)&&/^DS_|^NM_/.test(k));
  for(const line of lines){const r=csvLine(line),sq=get(r,idx,'SQ_CANDIDATO').replace(/\D/g,'');if(!sq)continue;const vals=[...new Set(textKeys.map(k=>pretty(clean(get(r,idx,k)))).filter(Boolean))];if(vals.length)map.set(sq,vals)}
}
function parseOptionalHistory(file,map){
  const {lines,idx}=headerIndex(file);if(!('SQ_CANDIDATO' in idx))return;
  const textKeys=Object.keys(idx).filter(k=>/SITUAC|HISTOR|TIPO|MOTIVO|SUBSTIT/i.test(k)&&/^DS_|^NM_/.test(k));
  for(const line of lines){const r=csvLine(line),sq=get(r,idx,'SQ_CANDIDATO').replace(/\D/g,'');if(!sq)continue;const vals=[...new Set(textKeys.map(k=>pretty(clean(get(r,idx,k)))).filter(Boolean))];if(vals.length){const prev=map.get(sq)||[];map.set(sq,[...new Set([...prev,...vals])])}}
}
function selectStatus(comp){
  return comp?.situacaoJulgamentoPleito||comp?.situacaoJulgamento||comp?.situacaoCandidatoPleito||comp?.situacaoCandidatoUrna||comp?.detalhe||'';
}
function applyStatus(item,comp={},motivos=[],historico=[]){
  item.situacao=selectStatus(comp);
  item.situacaoJulgamento=comp.situacaoJulgamento||'';
  item.situacaoJulgamentoPleito=comp.situacaoJulgamentoPleito||'';
  item.situacaoPleito=comp.situacaoCandidatoPleito||'';
  item.situacaoUrna=comp.situacaoCandidatoUrna||'';
  item.situacaoTotalizacao=comp.situacaoCandidatoTot||'';
  item.situacaoCassacao=comp.situacaoCassacao||'';
  item.destinacaoVotos=comp.destinacaoVotos||'';
  item.inseridoUrna=comp.inseridoUrna===true;
  item.substituido=comp.substituido===true;
  item.sqSubstituido=comp.sqSubstituido||'';
  item.motivosCassacao=motivos;
  item.historicoSituacao=historico;
  const si=statusInfo({...item,...comp});item.ativo=si.ativo;item.subJudice=si.subJudice;item.statusGrupo=si.grupo;item.statusScore=si.score;
  return item;
}

function parseCandidateCsv(file,scope,groups,compMap,cassMap,histMap){
  const {lines,idx}=headerIndex(file);
  for(const k of ['SG_UF','DS_CARGO','SQ_CANDIDATO','NR_CANDIDATO','NM_CANDIDATO','NM_URNA_CANDIDATO','SG_PARTIDO'])if(!(k in idx))throw new Error(`CSV TSE sem ${k}`);
  for(const line of lines){
    const r=csvLine(line),uf=get(r,idx,'SG_UF').toUpperCase();if(scope==='BR'&&uf!=='BR')continue;if(scope==='TO'&&uf!=='TO')continue;
    const c=norm(get(r,idx,'DS_CARGO'));const cargo=c==='PRESIDENTE'?'presidente':c==='GOVERNADOR'?'governador':c==='SENADOR'?'senador':c==='DEPUTADO FEDERAL'?'depFederal':c==='DEPUTADO ESTADUAL'?'depEstadual':null;if(!cargo)continue;if(cargo==='presidente'&&scope!=='BR')continue;if(cargo!=='presidente'&&scope!=='TO')continue;
    const numero=get(r,idx,'NR_CANDIDATO').replace(/\D/g,''),sq=get(r,idx,'SQ_CANDIDATO').replace(/\D/g,'');if(!numero||!sq)continue;
    const localPhoto=join(OUT,`${sq}.jpg`);
    const item=applyStatus({
      nome:get(r,idx,'NM_CANDIDATO'),nomeUrna:get(r,idx,'NM_URNA_CANDIDATO'),numero,partido:get(r,idx,'SG_PARTIDO'),sqCandidato:sq,
      foto:fs.existsSync(localPhoto)?`/candidate-photos/${sq}.jpg`:`https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/${sq}/${cargo==='presidente'?'BR':'TO'}`,
      fotoFonte:'TSE · Dados Abertos/DivulgaCandContas'
    },compMap.get(sq)||{},cassMap.get(sq)||[],histMap.get(sq)||[]);
    const key=`${cargo}|${numero}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);
  }
}

async function optionalDataset(url,slug,parser,map){
  try{const z=join(TMP,slug+'.zip'),d=join(TMP,slug);await download(url,z,200);unzip(z,d);for(const f of walk(d).filter(p=>/\.csv$/i.test(p)))parser(f,map)}catch(e){console.warn(`V1.8.7: recurso opcional ${slug} indisponível:`,String(e?.message||e))}
}
async function rebuild(){
  const candZip=join(TMP,'candidatos.zip'),candDir=join(TMP,'cand'),compZip=join(TMP,'complementar.zip'),compDir=join(TMP,'comp');
  await download(CAND_ZIP,candZip,10000);unzip(candZip,candDir);
  await download(COMP_ZIP,compZip,1000);unzip(compZip,compDir);
  try{const z=join(TMP,'br-fotos.zip'),d=join(TMP,'br-fotos');await download(BR_PHOTO_ZIP,z,500);extractPhotoZip(z,d)}catch(e){console.warn('V1.8.7: fotos BR não atualizadas:',String(e?.message||e))}
  const compMap=new Map(),cassMap=new Map(),histMap=new Map();
  for(const f of walk(compDir).filter(p=>/consulta_cand_complementar_2026_(?:BR|BRASIL|TO)\.csv$/i.test(basename(p))))parseComplementary(f,compMap);
  await optionalDataset(CASS_ZIP,'cassacao',parseOptionalReason,cassMap);
  await optionalDataset(HIST_ZIP,'historico',parseOptionalHistory,histMap);
  const files=walk(candDir),br=files.find(p=>/^consulta_cand_2026_(?:BR|BRASIL)\.csv$/i.test(basename(p))),to=files.find(p=>/^consulta_cand_2026_TO\.csv$/i.test(basename(p)));if(!br||!to)throw new Error('CSV BR/TO não localizado no pacote oficial');
  const groups=new Map();parseCandidateCsv(br,'BR',groups,compMap,cassMap,histMap);parseCandidateCsv(to,'TO',groups,compMap,cassMap,histMap);
  const candidates={presidente:[],governador:[],senador:[],depFederal:[],depEstadual:[]},substituicoes=[];
  for(const [key,rows] of groups){
    const [cargo,numero]=key.split('|');let chosen=rows[0];for(const row of rows.slice(1))if(prefer(row,chosen))chosen=row;candidates[cargo].push(chosen);
    if(rows.length>1)substituicoes.push({cargo,numero,atual:chosen.sqCandidato,historico:rows.filter(r=>r.sqCandidato!==chosen.sqCandidato).map(r=>({sqCandidato:r.sqCandidato,nomeUrna:r.nomeUrna||r.nome,situacao:r.situacao,statusGrupo:r.statusGrupo,substituido:r.substituido}))});
  }
  for(const k of Object.keys(candidates))candidates[k].sort((a,b)=>Number(a.numero)-Number(b.numero));
  const counts=Object.fromEntries(Object.entries(candidates).map(([k,a])=>[k,a.length]));if(counts.presidente<10||counts.governador<3||counts.senador<5||counts.depFederal<70||counts.depEstadual<150)throw new Error('contagens TSE suspeitas '+JSON.stringify(counts));
  const statusSummary={ativos:0,subJudice:0,inativos:0,pendentes:0,porGrupo:{}},inativos=[];
  for(const [cargo,rows] of Object.entries(candidates))for(const c of rows){statusSummary.porGrupo[c.statusGrupo]=(statusSummary.porGrupo[c.statusGrupo]||0)+1;if(c.subJudice)statusSummary.subJudice++;if(c.ativo===false){statusSummary.inativos++;inativos.push({cargo,numero:c.numero,nome:c.nomeUrna||c.nome,situacao:c.situacao,grupo:c.statusGrupo})}else{statusSummary.ativos++;if(c.statusGrupo==='pendente')statusSummary.pendentes++}}
  const generatedAt=new Date().toISOString();const payload={version:'1.8.7',generatedAt,source:{name:'Portal de Dados Abertos do TSE',candidatos:CAND_ZIP,complementar:COMP_ZIP,motivoCassacao:CASS_ZIP,historico:HIST_ZIP},counts,statusSummary,candidates,substituicoes};payload.sha256=createHash('sha256').update(JSON.stringify(payload)).digest('hex');fs.writeFileSync(join(DATA,'candidate-catalog.json'),JSON.stringify(payload));
  const pres=candidates.presidente.map(c=>`${c.numero}:${c.nomeUrna||c.nome}:${c.situacao||c.statusGrupo}:${c.ativo?'ativo':'inativo'}`).join(' | ');
  console.log('V1.8.7 catálogo TSE presidencial:',pres);
  console.log('V1.8.7 situação candidaturas:',JSON.stringify(statusSummary));
  if(inativos.length)console.log('V1.8.7 candidaturas não ativas:',JSON.stringify(inativos.slice(0,80)));
  return payload;
}

try{await rebuild()}catch(e){console.warn('V1.8.7: mantendo catálogo anterior; atualização oficial falhou:',String(e?.message||e))}finally{fs.rmSync(TMP,{recursive:true,force:true})}

const serverPath='/app/server.mjs';let server=fs.readFileSync(serverPath,'utf8');
server=server.replace(/function candidateStatusRank\(v\)\{[^\n]*\}/,
`function candidateStatusRank(v){const s=candidateNorm(v),rec=/RECURSO|PRAZO RECURSAL/.test(s);if(s.includes('RENUNC')||s.includes('FALEC')||s.includes('CANCEL'))return 0;if(s.includes('CASSAD')&&!rec)return 1;if(s.includes('INDEFER')&&rec)return 80;if(s.includes('INDEFER'))return 5;if(s.includes('PENDENTE')||s.includes('AGUARDANDO'))return 85;if(s.includes('DEFERIDO'))return 100;return 50}\nfunction candidateIsActive(v){const s=candidateNorm(v),rec=/RECURSO|PRAZO RECURSAL/.test(s);if(s.includes('RENUNC')||s.includes('FALEC')||s.includes('CANCEL'))return false;if(s.includes('CASSAD')&&!rec)return false;if(s.includes('INDEFER')&&!rec)return false;return true}\nfunction candidatePrefer(a,b){const aa=candidateIsActive(a.situacao),bb=candidateIsActive(b.situacao);if(aa!==bb)return aa;let as=0n,bs=0n;try{as=BigInt(String(a.sqCandidato||'0'))}catch{}try{bs=BigInt(String(b.sqCandidato||'0'))}catch{}if(as!==bs)return as>bs;return candidateStatusRank(a.situacao)>candidateStatusRank(b.situacao)}`);
server=server.replace("const prev=candidates[key].get(numero);if(!prev||candidateStatusRank(item.situacao)>candidateStatusRank(prev.situacao))candidates[key].set(numero,item);","const prev=candidates[key].get(numero);if(!prev||candidatePrefer(item,prev))candidates[key].set(numero,item);");

const adminAnchor='function adminOverview() {';
if(!server.includes('async function ce187EnrichCandidateSnapshot(')){
  if(!server.includes(adminAnchor))throw new Error('V1.8.7: anchor adminOverview ausente');
  const runtime=`async function ce187EnrichCandidateSnapshot(snapshot){
  if(!snapshot?.candidates)return snapshot;
  const URL='${COMP_ZIP}';
  const {mkdtempSync,writeFileSync:fsWrite,readFileSync:fsRead,rmSync,readdirSync,statSync,mkdirSync:fsMkdir}=await import('node:fs');
  const {tmpdir}=await import('node:os');const {join,basename}=await import('node:path');const {execFileSync}=await import('node:child_process');
  const tmp=mkdtempSync(join(tmpdir(),'ce187-comp-')),zip=join(tmp,'comp.zip'),out=join(tmp,'out');fsMkdir(out,{recursive:true});
  const clean=v=>{const s=String(v??'').trim();return !s||s==='-1'||/^#(?:NE|NULO)$/i.test(s)?'':s};
  const pretty=v=>{const s=clean(v);return s?candidatePrettyStatus(s):''};
  const walk=dir=>{const a=[];for(const n of readdirSync(dir)){const p=join(dir,n),st=statSync(p);st.isDirectory()?a.push(...walk(p)):a.push(p)}return a};
  const map=new Map();
  try{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),120000);let r;try{r=await fetch(URL,{signal:ctl.signal,headers:{'user-agent':'Central-Eleitoral-Colmeia/1.8.7'}})}finally{clearTimeout(timer)}
    if(!r.ok)throw new Error('TSE complementar HTTP '+r.status);const buf=Buffer.from(await r.arrayBuffer());if(buf.length<1000)throw new Error('TSE complementar muito pequeno');fsWrite(zip,buf);execFileSync('unzip',['-q','-o',zip,'-d',out],{timeout:120000,stdio:'ignore'});
    for(const f of walk(out).filter(p=>/consulta_cand_complementar_2026_(?:BR|BRASIL|TO)\\.csv$/i.test(basename(p)))){
      const text=fsRead(f,'latin1').replace(/^\\uFEFF/,'');const lines=text.split(/\\r?\\n/).filter(Boolean),head=candidateCsvLine(lines.shift()),idx=Object.fromEntries(head.map((h,i)=>[h,i]));if(!('SQ_CANDIDATO' in idx))continue;
      const g=(row,k)=>k in idx?String(row[idx[k]]??'').trim():'';
      for(const line of lines){const row=candidateCsvLine(line),sq=g(row,'SQ_CANDIDATO').replace(/\\D/g,'');if(!sq)continue;const o={
        detalhe:pretty(g(row,'DS_DETALHE_SITUACAO_CAND')),situacaoPleito:pretty(g(row,'DS_SITUACAO_CANDIDATO_PLEITO')),situacaoUrna:pretty(g(row,'DS_SITUACAO_CANDIDATO_URNA')),
        situacaoTotalizacao:pretty(g(row,'DS_SITUACAO_CANDIDATO_TOT')),situacaoJulgamento:pretty(g(row,'DS_SITUACAO_JULGAMENTO')),situacaoJulgamentoPleito:pretty(g(row,'DS_SITUACAO_JULGAMENTO_PLEITO')),
        situacaoCassacao:pretty(g(row,'DS_SITUACAO_CASSACAO')),destinacaoVotos:pretty(g(row,'NM_TIPO_DESTINACAO_VOTOS')),inseridoUrna:/^S$/i.test(g(row,'ST_CANDIDATO_INSERIDO_URNA')),
        substituido:/^S$/i.test(g(row,'ST_SUBSTITUIDO')),sqSubstituido:g(row,'SQ_SUBSTITUIDO').replace(/\\D/g,'')
      };map.set(sq,o)}
    }
    const info=o=>{const s=candidateNorm([o.situacao,o.situacaoJulgamento,o.situacaoPleito,o.situacaoUrna,o.situacaoCassacao,o.destinacaoVotos].filter(Boolean).join(' | ')),rec=/RECURSO|PRAZO RECURSAL/.test(s);if(o.substituido)return{ativo:false,subJudice:false,statusGrupo:'substituida'};if(s.includes('RENUNC'))return{ativo:false,subJudice:false,statusGrupo:'renuncia'};if(s.includes('FALEC'))return{ativo:false,subJudice:false,statusGrupo:'falecimento'};if(s.includes('CANCEL'))return{ativo:false,subJudice:false,statusGrupo:'cancelada'};if(s.includes('CASSAD')&&!rec)return{ativo:false,subJudice:false,statusGrupo:'cassada'};if(s.includes('INDEFER')&&rec)return{ativo:true,subJudice:true,statusGrupo:'sub_judice'};if(s.includes('INDEFER'))return{ativo:false,subJudice:false,statusGrupo:'indeferida'};if(s.includes('NAO CONHECIDO'))return{ativo:false,subJudice:false,statusGrupo:'nao_conhecida'};if(s.includes('AGUARDANDO JULGAMENTO')||s.includes('PENDENTE'))return{ativo:true,subJudice:false,statusGrupo:'pendente'};if(s.includes('DEFERIDO'))return{ativo:true,subJudice:false,statusGrupo:'deferida'};return{ativo:true,subJudice:false,statusGrupo:'outros'}};
    for(const rows of Object.values(snapshot.candidates))for(const c of Array.isArray(rows)?rows:[]){const o=map.get(String(c.sqCandidato||''));if(!o)continue;c.situacao=o.situacaoJulgamentoPleito||o.situacaoJulgamento||o.situacaoPleito||o.situacaoUrna||o.detalhe||'';Object.assign(c,o,info({...c,...o}))}
    snapshot.version='1.8.7';snapshot.generatedAt=new Date().toISOString();snapshot.statusSummary={ativos:0,subJudice:0,inativos:0,pendentes:0,porGrupo:{}};
    for(const rows of Object.values(snapshot.candidates))for(const c of Array.isArray(rows)?rows:[]){const g=c.statusGrupo||'outros';snapshot.statusSummary.porGrupo[g]=(snapshot.statusSummary.porGrupo[g]||0)+1;if(c.subJudice)snapshot.statusSummary.subJudice++;if(c.ativo===false)snapshot.statusSummary.inativos++;else{snapshot.statusSummary.ativos++;if(g==='pendente')snapshot.statusSummary.pendentes++}}
    candidateSnapshotUpsert.run(JSON.stringify(snapshot),snapshot.generatedAt,URL);return snapshot;
  } finally {rmSync(tmp,{recursive:true,force:true})}
}

`;
  server=server.replace(adminAnchor,runtime+adminAnchor);
}

server=server.replace('const snap=await refreshCandidateCatalogFromTse();securityEvent({event:\'candidate_catalog_refresh\'','const snap=await ce187EnrichCandidateSnapshot(await refreshCandidateCatalogFromTse());securityEvent({event:\'candidate_catalog_refresh\'');
const startup="console.log('V1.0.2: catálogo de candidaturas TSE sincronizável com snapshot persistente ativo.');";
if(server.includes(startup)&&!server.includes('CE187_AUTO_CANDIDATE_REFRESH')){
  server=server.replace(startup,`${startup}\n  /* CE187_AUTO_CANDIDATE_REFRESH */\n  const ce187Refresh=()=>refreshCandidateCatalogFromTse().then(ce187EnrichCandidateSnapshot).then(s=>console.log('V1.8.7: catálogo TSE atualizado',JSON.stringify(s.statusSummary||s.counts))).catch(e=>console.warn('V1.8.7: atualização TSE preservou snapshot anterior',String(e?.message||e)));\n  setTimeout(ce187Refresh,12000);setInterval(ce187Refresh,12*60*60*1000);`);
}
fs.writeFileSync(serverPath,server);
if(!server.includes('candidatePrefer(item,prev)'))throw new Error('V1.8.7: seletor de candidaturas não aplicado');
if(!server.includes('ce187EnrichCandidateSnapshot'))throw new Error('V1.8.7: enriquecimento complementar não aplicado');
if(!server.includes('CE187_AUTO_CANDIDATE_REFRESH'))throw new Error('V1.8.7: atualização automática não aplicada');
console.log('V1.8.7: integridade de candidaturas + situação judicial complementar aplicadas.');
