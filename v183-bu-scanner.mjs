import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const pub='/app/public';
const opPath=`${pub}/operacao.html`;
const parserPath=`${pub}/bu-parser.js`;
const swPath=`${pub}/service-worker.js`;
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const parser=String.raw`/* CE183 — leitor robusto do QR Code do Boletim de Urna */
(function(root){
  'use strict';

  const CARGO_MAP={1:'presidente',3:'governador',5:'senador',6:'depFederal',7:'depEstadual'};
  const CARGO_NAMES={1:'Presidente',3:'Governador',5:'Senador',6:'Deputado Federal',7:'Deputado Estadual'};
  const GLOBAL_ANYWHERE=new Set(['HASH','ASSI']);
  const NUMBER_FIELDS=new Set(['SECA','ZONA','MUNI','COMP','APTO','FALT','LOCA','TURN','PLEI','IDEL','IDUE','HBBM','HBBG','HBSB','APTS','APTT']);
  const IDENTITY_FIELDS=['DTPL','PLEI','TURN','FASE','UNFE','MUNI','ZONA','SECA','IDUE','IDCA'];

  function normalize(raw){return String(raw||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();}
  function splitToken(token){const p=String(token||'').indexOf(':');return p<0?[String(token||''),'']:[token.slice(0,p),token.slice(p+1)];}
  function asNumber(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function asHex(v){return String(v||'').replace(/\s+/g,'').toUpperCase();}

  function fragmentInfo(raw){
    const text=normalize(raw);
    const m=text.match(/^QRBU:(\d+):(\d+)(?=\s|\||$)/i);
    if(!m)return null;
    const index=Number(m[1]),total=Number(m[2]);
    if(!Number.isInteger(index)||!Number.isInteger(total)||index<1||total<1||index>total)return null;
    const fields={};
    const tokens=text.split(/[\s|]+/).filter(Boolean);
    for(const tok of tokens.slice(1)){
      const [k,v]=splitToken(tok);const key=String(k||'').toUpperCase();
      if(key&&v!==''&&fields[key]===undefined)fields[key]=v;
    }
    const identity={};
    for(const key of IDENTITY_FIELDS)if(fields[key]!==undefined)identity[key]=String(fields[key]);
    return {index,total,text,fields,identity};
  }

  function orderedParts(parts){
    const arr=Array.isArray(parts)?parts:Object.values(parts||{});
    const parsed=arr.map(fragmentInfo).filter(Boolean).sort((a,b)=>a.index-b.index);
    if(!parsed.length)throw new Error('qrbu_header_missing');
    const total=parsed[0].total;
    if(parsed.some(p=>p.total!==total))throw new Error('qrbu_total_mismatch');
    const uniq=new Map();
    for(const p of parsed){
      const prior=uniq.get(p.index);
      if(prior&&prior.text!==p.text)throw new Error('qrbu_duplicate_index_conflict');
      uniq.set(p.index,p);
    }
    if(uniq.size!==total)throw new Error('qrbu_incomplete');
    const out=[];for(let i=1;i<=total;i++){const p=uniq.get(i);if(!p)throw new Error('qrbu_incomplete');out.push(p);}
    return out;
  }

  function assemble(parts){
    const parsed=orderedParts(parts),total=parsed.length,body=[];
    for(const p of parsed){body.push(p.text.replace(/^QRBU:\d+:\d+(?:\s+|\|*)/i,'').trim());}
    return ('QRBU:1:'+total+' '+body.join(' ')).trim();
  }

  function securityPieces(fragment){
    const info=fragmentInfo(fragment);if(!info)throw new Error('qrbu_header_missing');
    let text=info.text;
    text=text.replace(/^QRBU:\d+:\d+\s+/i,'');
    text=text.replace(/^VRQR:[^\s]+\s+/i,'');
    text=text.replace(/^VRCH:[^\s]+(?:\s+|$)/i,'');
    const hm=text.match(/(?:^|\s)HASH:([0-9A-Fa-f]+)(?=\s|$)/i);
    if(!hm)return {info,data:text.trim(),hash:'',signature:''};
    const hash=asHex(hm[1]);
    const data=text.slice(0,hm.index).trim();
    const after=text.slice(hm.index+hm[0].length).trim();
    const am=after.match(/(?:^|\s)ASSI:([0-9A-Fa-f]+)(?=\s|$)/i);
    return {info,data,hash,signature:am?asHex(am[1]):''};
  }

  async function sha512Hex(text){
    if(!root.crypto||!root.crypto.subtle||typeof root.TextEncoder!=='function')throw new Error('sha512_unavailable');
    const bytes=new root.TextEncoder().encode(text);
    const digest=await root.crypto.subtle.digest('SHA-512',bytes);
    return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
  }

  async function verifyHashChain(parts){
    let parsed;
    try{parsed=orderedParts(parts);}catch(e){return {ok:false,error:e.message||'qrbu_invalid',verifiedParts:0,lastHash:''};}
    let cumulative='',verifiedParts=0,lastHash='';
    for(const part of parsed){
      const p=securityPieces(part.text);
      if(!p.hash)return {ok:false,error:'qrbu_hash_missing',part:p.info.index,verifiedParts,lastHash};
      const material=(cumulative?cumulative+' ':'')+p.data;
      let actual;
      try{actual=await sha512Hex(material);}catch(e){return {ok:false,error:e.message||'sha512_unavailable',part:p.info.index,verifiedParts,lastHash};}
      if(actual!==p.hash)return {ok:false,error:'qrbu_hash_mismatch',part:p.info.index,verifiedParts,lastHash,expected:p.hash,actual};
      verifiedParts++;lastHash=p.hash;cumulative=material+' HASH:'+p.hash;
    }
    return {ok:true,verifiedParts,total:parsed.length,lastHash,signature:securityPieces(parsed[parsed.length-1].text).signature||''};
  }

  function parse(raw){
    const text=normalize(raw);
    if(!/^QRBU:\d+:\d+(?=\s|\||$)/i.test(text))throw new Error('not_qrbu');
    const tokens=text.split(/[\s|]+/).filter(Boolean);
    const header=fragmentInfo(text);
    const meta={qrTotal:header?.total||1};
    const cargos=[];let current=null,currentParty=null;
    function finish(){
      if(!current)return;
      const byNum=new Map();
      for(const c of current.candidatos){const k=String(c.numero);byNum.set(k,{numero:k,votos:(byNum.get(k)?.votos||0)+asNumber(c.votos)});}
      current.candidatos=[...byNum.values()].sort((a,b)=>a.numero.localeCompare(b.numero,'pt-BR',{numeric:true}));
      const leg=new Map();
      for(const l of current.legendas){const k=String(l.numero);leg.set(k,{numero:k,votos:(leg.get(k)?.votos||0)+asNumber(l.votos)});}
      current.legendas=[...leg.values()].sort((a,b)=>a.numero.localeCompare(b.numero,'pt-BR',{numeric:true}));
      current.cargo=CARGO_MAP[current.codigo]||null;
      current.nome=CARGO_NAMES[current.codigo]||('Cargo '+current.codigo);
      cargos.push(current);current=null;currentParty=null;
    }
    for(let i=1;i<tokens.length;i++){
      const tok=tokens[i];if(!tok)continue;
      const [keyRaw,valueRaw]=splitToken(tok),key=String(keyRaw||'').toUpperCase(),value=valueRaw;
      if(key==='QRBU')continue;
      if(key==='CARG'){
        finish();current={codigo:asNumber(value),cargo:null,nome:'',tipo:null,candidatos:[],legendas:[],brancos:0,nulos:0,total:0,nominais:0,votosLegenda:0,fields:{}};continue;
      }
      if(GLOBAL_ANYWHERE.has(key)){meta[key]=value;continue;}
      if(!current){meta[key]=NUMBER_FIELDS.has(key)?asNumber(value):value;continue;}
      if(key==='TIPO'){current.tipo=asNumber(value);continue;}
      if(key==='PART'){currentParty=String(value);continue;}
      if(key==='LEGP'){
        const votos=asNumber(value);if(currentParty)current.legendas.push({numero:currentParty,votos});continue;
      }
      if(key==='APTA'||key==='APTS'||key==='APTT'||key==='CSEC'||key==='VERC'||key==='TOTP'){
        current.fields[key]=value;continue;
      }
      if(key==='BRAN'){current.brancos=asNumber(value);continue;}
      if(key==='NULO'){current.nulos=asNumber(value);continue;}
      if(key==='TOTC'){current.total=asNumber(value);continue;}
      if(key==='NOMI'){current.nominais=asNumber(value);continue;}
      if(key==='LEGC'){current.votosLegenda=asNumber(value);continue;}
      if(/^\d+$/.test(key)){current.candidatos.push({numero:key,votos:asNumber(value)});continue;}
      if(key==='VRQR'||key==='VRCH')continue;
      current.fields[key]=value;
    }
    finish();
    for(const c of cargos){if(c.votosLegenda&&c.legendas.length){c.fields.LEGENDA_SOMA=c.legendas.reduce((s,l)=>s+l.votos,0);c.fields.LEGENDA_RESUMO=c.votosLegenda;}}
    return {raw:text,meta,cargos,recognizedCargos:cargos.filter(c=>c.cargo)};
  }

  root.BUParser={version:'1.8.3',CARGO_MAP,CARGO_NAMES,fragmentInfo,assemble,parse,verifyHashChain};
})(typeof globalThis!=='undefined'?globalThis:this);
`;

write(parserPath,parser);

const context={console,TextEncoder,crypto:webcrypto};context.globalThis=context;
vm.runInNewContext(parser,context,{filename:'bu-parser.js'});
const P=context.BUParser;
const sample='QRBU:1:1 VRQR:1.5 VRCH:20240507 ORIG:VOTA ORLC:LEG PROC:1000 DTPL:20241006 PLEI:1100 TURN:1 FASE:S UNFE:TO MUNI:12345 ZONA:4 SECA:10 IDUE:ABC IDCA:XYZ LOCA:1 APTO:100 COMP:100 FALT:0 IDEL:1101 CARG:6 TIPO:1 VERC:1 PART:13 13123:60 LEGP:5 TOTP:65 PART:22 22123:25 LEGP:0 TOTP:25 APTA:100 NOMI:85 LEGC:5 BRAN:5 NULO:5 TOTC:100';
const hash=await (async()=>{const b=new TextEncoder().encode(sample.replace(/^QRBU:1:1 VRQR:1\.5 VRCH:20240507 /,''));const d=await webcrypto.subtle.digest('SHA-512',b);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()})();
const one=sample+' HASH:'+hash+' ASSI:AA';
const parsed=P.parse(one);const dep=parsed.recognizedCargos.find(x=>x.cargo==='depFederal');
if(!dep||dep.candidatos.find(x=>x.numero==='13123')?.votos!==60||dep.legendas.find(x=>x.numero==='13')?.votos!==5||dep.brancos!==5||dep.nulos!==5||parsed.meta.COMP!==100)throw new Error('V1.8.3: parser TSE regression failed');
const hv=await P.verifyHashChain([one]);if(!hv.ok||hv.verifiedParts!==1)throw new Error('V1.8.3: SHA-512 chain regression failed');
const frag=P.fragmentInfo('QRBU:2:2 VRQR:1.5 VRCH:X TESTE:1 HASH:AA');if(!frag||frag.index!==2||frag.total!==2)throw new Error('V1.8.3: fragment parser failed');
let incomplete=false;try{P.assemble({1:'QRBU:1:2 VRQR:1.5 VRCH:X A:1 HASH:AA'})}catch{incomplete=true}if(!incomplete)throw new Error('V1.8.3: incomplete multipart accepted');

let op=read(opPath);
function replaceBetween(source,start,end,replacement,label){const a=source.indexOf(start);const b=source.indexOf(end,a+start.length);if(a<0||b<0)throw new Error('V1.8.3: '+label+' não localizado');return source.slice(0,a)+replacement+source.slice(b);}

const resetBlock=String.raw`function resetQrSession(stop=true){
  qrSession={parts:{},total:null,parsed:null,fingerprint:'',identity:{},hashVerification:null};
  qrLastText='';qrSummary.classList.remove('open');qrSummary.innerHTML='';qrReset.style.display='none';
  setQrStatus('','Nenhum BU lido nesta sessão.');if(stop)stopQrScanner()
}
`;
op=replaceBetween(op,'function resetQrSession(stop=true){','async function loadQrLibrary()',resetBlock,'resetQrSession');

const captureBlock=String.raw`async function captureQrPart(text){
  text=String(text||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
  const now=Date.now();if(text===qrLastText&&now-qrLastAt<1800)return;qrLastText=text;qrLastAt=now;
  const info=BUParser?.fragmentInfo(text);
  if(!info){setQrStatus('bad','O código lido não começa com <b>QRBU:</b> e não parece ser um QR de Boletim de Urna.');return}
  if(qrSession.total&&qrSession.total!==info.total){setQrStatus('warn','Este QR pertence a outro conjunto de BU. Toque em <b>Novo BU</b> antes de começar outro boletim.');return}
  qrSession.identity=qrSession.identity||{};
  for(const [k,v] of Object.entries(info.identity||{})){
    if(qrSession.identity[k]!==undefined&&String(qrSession.identity[k])!==String(v)){setQrStatus('bad','Este QR apresenta identificação diferente do BU que já está sendo lido. Nenhum dado foi misturado. Toque em <b>Novo BU</b> para iniciar outro boletim.');return}
  }
  const existing=qrSession.parts?.[info.index];
  if(existing){
    if(String(existing).trim()===text){setQrStatus('','QR <b>'+info.index+'/'+info.total+'</b> já havia sido capturado · '+Object.keys(qrSession.parts).length+'/'+info.total+' reunidos.');return}
    setQrStatus('bad','Já existe um QR diferente na posição <b>'+info.index+'/'+info.total+'</b>. Para impedir mistura entre boletins, esta leitura foi recusada. Toque em <b>Novo BU</b>.');return
  }
  Object.assign(qrSession.identity,info.identity||{});qrSession.total=info.total;qrSession.parts[info.index]=text;qrReset.style.display='inline-block';
  if(navigator.vibrate)navigator.vibrate(80);
  const got=Object.keys(qrSession.parts).length;setQrStatus('','QR <b>'+info.index+'/'+info.total+'</b> capturado · <b>'+got+' de '+info.total+'</b> QR reunidos.');if(got<info.total)return;
  try{
    setQrStatus('','<span class="spinner-dot"></span>Todos os QR foram lidos. Verificando a cadeia SHA-512 do boletim…');
    const verification=await BUParser.verifyHashChain(qrSession.parts);qrSession.hashVerification=verification;
    if(!verification?.ok){const p=verification?.part?(' no QR '+verification.part+'/'+info.total):'';setQrStatus('bad','A verificação de integridade SHA-512 falhou'+p+'. As partes podem pertencer a boletins diferentes ou a leitura pode estar incompleta. Os dados <b>não serão aplicados</b>. Toque em <b>Novo BU</b> e leia novamente.');return}
    const assembled=BUParser.assemble(qrSession.parts);qrSession.parsed=BUParser.parse(assembled);qrSession.fingerprint=await sha256Hex(assembled);
    await stopQrScanner();renderQrSummary()
  }catch(e){console.error(e);setQrStatus('bad','As partes foram lidas, mas não consegui reconstruir e validar o BU. Os dados não foram aplicados. Toque em <b>Novo BU</b> e tente novamente.')}
}
`;
op=replaceBetween(op,'async function captureQrPart(text){','function renderQrSummary(){',captureBlock,'captureQrPart');

op=op.replace('Leitura estrutural registrada. A validação criptográfica da assinatura do TSE ainda não é executada nesta versão.','Leitura estrutural registrada · cadeia SHA-512 dos QR verificada. A assinatura Ed25519 é preservada, mas ainda não é validada criptograficamente nesta versão.');
op=op.replace("Fingerprint local: ${esc((qrSession.fingerprint||'').slice(0,24))}","Cadeia SHA-512: <b>verificada</b> · Fingerprint local: ${esc((qrSession.fingerprint||'').slice(0,24))}");
op=op.replace('A assinatura auxiliar é preservada, mas a V0.20 não declara validação criptográfica da assinatura sem implementação específica confirmada pelo TSE.','A assinatura Ed25519 é preservada; esta versão ainda não executa sua validação criptográfica com a chave pública do TSE.');
op=op.replace('>Salvar todos os cargos lidos</button>','>Revisar e salvar cargos lidos</button>');
op=op.replace("fingerprint:qrSession.fingerprint,parsedAt:new Date().toISOString(),","fingerprint:qrSession.fingerprint,hashChainVerified:!!qrSession.hashVerification?.ok,hashAlgorithm:'SHA-512',parsedAt:new Date().toISOString(),");
if(!op.includes('hashChainVerified:!!qrSession.hashVerification?.ok'))throw new Error('V1.8.3: buMeta não atualizado');
if(!op.includes('BUParser.verifyHashChain(qrSession.parts)'))throw new Error('V1.8.3: verificação de cadeia não injetada');
write(opPath,op);

let sw=read(swPath);sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.8.3-unified';");write(swPath,sw);
console.log('V1.8.3 applied: QR-BU parser hardened, multipart conflicts blocked and SHA-512 chain verified before use.');
