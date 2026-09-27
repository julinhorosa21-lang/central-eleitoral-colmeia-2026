import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const pub='/app/public';
const serverPath='/app/server.mjs';
const opPath=pub+'/operacao.html';
const parserPath=pub+'/bu-parser.js';
const swPath=pub+'/service-worker.js';
const pythonPath=process.env.CE184_PYTHON||'/opt/ce184-venv/bin/python';
const verifierPath='/app/ce184-verify.py';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* ============================================================
   1) Preflight do verificador conforme Manual TSE 2026
   ============================================================ */
if(!fs.existsSync(verifierPath))throw new Error('V1.8.4.3: ce184-verify.py ausente');
const pyCheck=spawnSync(pythonPath,['-c',"import asn1tools; from ecpy.curves import Curve; assert Curve.get_curve('Ed521') is not None; assert Curve.get_curve('secp521r1') is not None"],{encoding:'utf8',timeout:15000});
if(pyCheck.status!==0)throw new Error('V1.8.4.3: dependencias criptograficas indisponiveis: '+String(pyCheck.stderr||pyCheck.stdout||'').slice(0,300));

/* ============================================================
   2) Parser dos QRCE do certificado da urna
   ============================================================ */
let parser=read(parserPath);
const parserAnchor="  root.BUParser={version:'1.8.3',CARGO_MAP,CARGO_NAMES,fragmentInfo,assemble,parse,verifyHashChain};";
if(!parser.includes('function certificateFragmentInfo(')){
  if(!parser.includes(parserAnchor))throw new Error('V1.8.4.3: export BUParser 1.8.3 nao localizado');
  const certHelpers=String.raw`  function certificateFragmentInfo(raw){
    const text=normalize(raw);
    const m=text.match(/^QRCE:(\d+):(\d+)(?=\s|\||$)/i);
    if(!m)return null;
    const index=Number(m[1]),total=Number(m[2]);
    if(!Number.isInteger(index)||!Number.isInteger(total)||index<1||total<1||index>total||total>4)return null;
    const fields={};
    const tokens=text.split(/[\s|]+/).filter(Boolean);
    for(const tok of tokens.slice(1)){
      const [k,v]=splitToken(tok),key=String(k||'').toUpperCase();
      if(key&&v!==''&&fields[key]===undefined)fields[key]=v;
    }
    const cert=asHex(fields.CERT||'');
    if(!cert||cert.length%2||!/^[0-9A-F]+$/.test(cert))return null;
    return {index,total,text,fields,cert,identity:{IDUE:String(fields.IDUE||''),MDUE:String(fields.MDUE||'')}};
  }
  function assembleCertificate(parts){
    const arr=Array.isArray(parts)?parts:Object.values(parts||{});
    const parsed=arr.map(certificateFragmentInfo).filter(Boolean).sort((a,b)=>a.index-b.index);
    if(!parsed.length)throw new Error('qrce_header_missing');
    const total=parsed[0].total;
    if(parsed.some(p=>p.total!==total))throw new Error('qrce_total_mismatch');
    const uniq=new Map();
    for(const p of parsed){
      const prior=uniq.get(p.index);
      if(prior&&prior.text!==p.text)throw new Error('qrce_duplicate_index_conflict');
      uniq.set(p.index,p);
    }
    if(uniq.size!==total)throw new Error('qrce_incomplete');
    const first=[...uniq.values()][0];
    for(const p of uniq.values()){
      if(first.identity.IDUE&&p.identity.IDUE&&first.identity.IDUE!==p.identity.IDUE)throw new Error('qrce_idue_mismatch');
      if(first.identity.MDUE&&p.identity.MDUE&&first.identity.MDUE!==p.identity.MDUE)throw new Error('qrce_model_mismatch');
    }
    let cert='';
    for(let i=1;i<=total;i++){const p=uniq.get(i);if(!p)throw new Error('qrce_incomplete');cert+=p.cert;}
    return {certificateHex:cert,total,IDUE:first.identity.IDUE||'',MDUE:first.identity.MDUE||''};
  }

  root.BUParser={version:'1.8.4.3',CARGO_MAP,CARGO_NAMES,fragmentInfo,certificateFragmentInfo,assembleCertificate,assemble,parse,verifyHashChain};`;
  parser=parser.replace(parserAnchor,certHelpers);
}
write(parserPath,parser);

/* ============================================================
   3) Endpoint local para verificar assinatura com o QRCE lido
   ============================================================ */
let server=read(serverPath);
if(!server.includes("spawnSync as ce184SpawnSync")){
  server="import { spawnSync as ce184SpawnSync } from 'node:child_process';\n"+server;
}
const routeAnchor="    if (p === '/api/tse/status') return json(res,200,{ok:true,...tseSync.getStatus()});";
if(!server.includes("p === '/api/bu/verify-signature'")){
  if(!server.includes(routeAnchor))throw new Error('V1.8.4.3: anchor /api/tse/status nao localizado');
  const route=`    if (p === '/api/bu/verify-signature' && req.method === 'POST') {
      const rl=takeRateLimit('bu-signature:'+sourceHash,12,60000);
      if(!rl.ok){res.setHeader('retry-after',String(rl.retryAfter));return json(res,429,{ok:false,valid:false,error:'rate_limited'});}
      const body=await readBody(req);
      const clean=v=>String(v||'').replace(/\\s+/g,'').toUpperCase();
      const hashHex=clean(body.hashHex),signatureHex=clean(body.signatureHex),certificateHex=clean(body.certificateHex);
      if(!/^[0-9A-F]{128}$/.test(hashHex))return json(res,400,{ok:false,valid:false,error:'invalid_hash'});
      if(!/^[0-9A-F]+$/.test(signatureHex)||signatureHex.length<64||signatureHex.length>4096||signatureHex.length%2)return json(res,400,{ok:false,valid:false,error:'invalid_signature'});
      if(!/^[0-9A-F]+$/.test(certificateHex)||certificateHex.length<256||certificateHex.length>65536||certificateHex.length%2)return json(res,400,{ok:false,valid:false,error:'invalid_certificate'});
      const py=process.env.CE184_PYTHON||'/opt/ce184-venv/bin/python';
      let proc;
      try{
        proc=ce184SpawnSync(py,['/app/ce184-verify.py'],{
          input:JSON.stringify({hashHex,signatureHex,certificateHex}),
          encoding:'utf8',timeout:7000,maxBuffer:1024*1024
        });
      }catch(e){
        securityEvent({event:'bu_signature_verify_error',outcome:'error',sourceHash,requestId,details:{message:String(e?.message||e).slice(0,160)}});
        return json(res,503,{ok:false,valid:false,error:'signature_verifier_unavailable'});
      }
      if(proc.error||proc.status!==0){
        securityEvent({event:'bu_signature_verify_error',outcome:'error',sourceHash,requestId,details:{status:proc.status,message:String(proc.error?.message||proc.stderr||'').slice(0,160)}});
        return json(res,503,{ok:false,valid:false,error:'signature_verifier_failed'});
      }
      let result;try{result=JSON.parse(String(proc.stdout||'').trim())}catch{return json(res,502,{ok:false,valid:false,error:'signature_verifier_invalid_response'});}
      securityEvent({
        event:'bu_signature_checked',
        outcome:result?.valid?'accepted':'denied',
        sourceHash,requestId,
        details:{algorithm:result?.algorithm||null,certificateSha256:result?.certificateSha256||null,error:result?.error||null}
      });
      return json(res,200,{
        ok:!!result?.valid,
        valid:!!result?.valid,
        algorithm:result?.algorithm||null,
        oid:result?.oid||null,
        certificateSha256:result?.certificateSha256||null,
        publicKeySha512:result?.publicKeySha512||null,
        error:result?.error||null
      });
    }

${routeAnchor}`;
  server=server.replace(routeAnchor,route);
}
write(serverPath,server);

/* ============================================================
   4) Fluxo de leitura: QRBU -> SHA-512 -> QRCE -> assinatura
   ============================================================ */
let op=read(opPath);
function replaceBetween(source,start,end,replacement,label){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  if(a<0||b<0)throw new Error('V1.8.4.3: '+label+' nao localizado');
  return source.slice(0,a)+replacement+source.slice(b);
}

const reset=String.raw`function resetQrSession(stop=true){
  qrSession={parts:{},total:null,parsed:null,fingerprint:'',identity:{},hashVerification:null,certParts:{},certTotal:null,certIdentity:{},signatureVerification:null,signaturePending:false,testMode:false};
  qrLastText='';qrSummary.classList.remove('open');qrSummary.innerHTML='';qrReset.style.display='none';
  setQrStatus('','Nenhum BU lido nesta sessão.');if(stop)stopQrScanner()
}
`;
op=replaceBetween(op,'function resetQrSession(stop=true){','async function loadQrLibrary()',reset,'resetQrSession');

const capture=String.raw`function ce184GateSummary(){
  if(!qrSummary)return;
  let box=qrSummary.querySelector('[data-ce184-signature]');
  if(!box){box=document.createElement('div');box.setAttribute('data-ce184-signature','1');box.style.cssText='margin:0 0 12px;padding:10px 11px;border-radius:10px;font-size:10.5px;font-weight:800;line-height:1.4';qrSummary.prepend(box)}
  const valid=!!qrSession.signatureVerification?.valid;
  const test=!!qrSession.testMode;
  if(test){box.style.background='#fff0f0';box.style.color='#8b1e1e';box.textContent='MODO TESTE · BU sintético · assinatura oficial não aplicável · gravação desativada.'}
  else if(valid){box.style.background='#eaf7ef';box.style.color='#17683f';box.textContent='Assinatura digital compatível com o certificado QRCE lido · '+String(qrSession.signatureVerification?.algorithm||'algoritmo verificado')+'.'}
  else{const got=Object.keys(qrSession.certParts||{}).length,total=qrSession.certTotal||2;box.style.background='#fff7df';box.style.color='#6f5915';box.textContent='Assinatura digital aguardando certificado da urna · QRCE '+got+'/'+total+'. Leia os QR Codes do certificado antes de salvar.'}
  qrSummary.querySelectorAll('button').forEach(b=>{
    if(!/salvar|revisar/i.test(String(b.textContent||'')))return;
    if(test){b.disabled=true;b.textContent='Teste — gravação desativada';return}
    if(!valid){if(!b.disabled)b.dataset.ce184Enabled='1';b.disabled=true}
    else if(b.dataset.ce184Enabled==='1'){b.disabled=false;delete b.dataset.ce184Enabled}
  });
}

async function ce184VerifyCertificate(){
  if(qrSession.signaturePending||!qrSession.hashVerification?.ok)return;
  qrSession.signaturePending=true;
  try{
    const cert=BUParser.assembleCertificate(qrSession.certParts);
    const buId=String(qrSession.identity?.IDUE||qrSession.parsed?.meta?.IDUE||'');
    if(buId&&cert.IDUE&&buId!==String(cert.IDUE)){setQrStatus('bad','O certificado QRCE pertence a outra urna (IDUE diferente). Os dados não serão liberados. Toque em <b>Novo BU</b>.');return}
    if(!qrSession.hashVerification.signature){setQrStatus('bad','O último QRBU não contém a assinatura digital esperada. Os dados não serão liberados.');return}
    setQrStatus('','<span class="spinner-dot"></span>Certificado QRCE completo. Verificando a assinatura digital do BU…');
    let res,j;
    try{
      res=await fetch('/api/bu/verify-signature',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
        hashHex:qrSession.hashVerification.lastHash,
        signatureHex:qrSession.hashVerification.signature,
        certificateHex:cert.certificateHex
      })});
      j=await res.json().catch(()=>null);
    }catch(e){setQrStatus('bad','Não foi possível consultar o verificador criptográfico. A leitura foi mantida; tente ler novamente o último QRCE quando a conexão estabilizar.');return}
    qrSession.signatureVerification={...(j||{}),valid:!!j?.valid,IDUE:cert.IDUE,MDUE:cert.MDUE};
    if(!res.ok||!j?.valid){
      renderQrSummary();ce184GateSummary();
      setQrStatus('bad','A assinatura digital não pôde ser validada com o certificado QRCE lido. Os dados <b>não serão liberados para gravação</b>. Recomece a leitura deste BU.');
      return
    }
    await stopQrScanner();renderQrSummary();ce184GateSummary();
    setQrStatus('','Integridade SHA-512 e assinatura digital do BU foram verificadas com o certificado QRCE lido ('+String(j.algorithm||'algoritmo reconhecido')+').');
  }finally{qrSession.signaturePending=false}
}

async function captureQrPart(text){
  text=String(text||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
  const now=Date.now();if(text===qrLastText&&now-qrLastAt<1500)return;qrLastText=text;qrLastAt=now;

  if(/^QRCE:/i.test(text)){
    if(!qrSession.hashVerification?.ok||!qrSession.parsed){setQrStatus('warn','Leia primeiro todos os QR Codes <b>QRBU</b> do boletim. Depois leia os dois QR Codes <b>QRCE</b> do certificado.');return}
    if(qrSession.testMode){setQrStatus('warn','Este é um BU sintético de teste; certificado oficial não é utilizado.');return}
    const ci=BUParser?.certificateFragmentInfo(text);
    if(!ci){setQrStatus('bad','O QRCE do certificado não pôde ser interpretado.');return}
    if(ci.total!==2){setQrStatus('bad','O certificado lido não possui os dois QRCE esperados pelo formato 2026.');return}
    const buId=String(qrSession.identity?.IDUE||qrSession.parsed?.meta?.IDUE||'');
    if(buId&&ci.identity?.IDUE&&buId!==String(ci.identity.IDUE)){setQrStatus('bad','Este QRCE pertence a outra urna (IDUE diferente). Nenhum certificado foi misturado.');return}
    if(qrSession.certTotal&&qrSession.certTotal!==ci.total){setQrStatus('bad','Os QRCE lidos pertencem a conjuntos diferentes. Toque em <b>Novo BU</b> e recomece.');return}
    const previous=qrSession.certParts?.[ci.index];
    if(previous){
      if(String(previous).trim()!==text){setQrStatus('bad','Já existe outro QRCE na posição '+ci.index+'/'+ci.total+'. Para impedir mistura entre certificados, a leitura foi recusada.');return}
      if(Object.keys(qrSession.certParts).length===ci.total&&!qrSession.signaturePending)await ce184VerifyCertificate();
      else setQrStatus('','QRCE '+ci.index+'/'+ci.total+' já havia sido capturado.');
      return
    }
    qrSession.certTotal=ci.total;qrSession.certIdentity=qrSession.certIdentity||{};
    if(qrSession.certIdentity.MDUE&&ci.identity?.MDUE&&qrSession.certIdentity.MDUE!==ci.identity.MDUE){setQrStatus('bad','Os QRCE apresentam modelos de urna diferentes. Recomece a leitura.');return}
    Object.assign(qrSession.certIdentity,ci.identity||{});qrSession.certParts[ci.index]=text;
    if(navigator.vibrate)navigator.vibrate(80);
    const got=Object.keys(qrSession.certParts).length;
    renderQrSummary();ce184GateSummary();
    setQrStatus('','QRCE <b>'+ci.index+'/'+ci.total+'</b> capturado · <b>'+got+' de '+ci.total+'</b> certificados reunidos.');
    if(got===ci.total)await ce184VerifyCertificate();
    return
  }

  const info=BUParser?.fragmentInfo(text);
  if(!info){setQrStatus('bad','O código lido não é um QRBU nem um QRCE reconhecido do Boletim de Urna.');return}
  if(qrSession.total&&qrSession.total!==info.total){setQrStatus('warn','Este QR pertence a outro conjunto de BU. Toque em <b>Novo BU</b> antes de começar outro boletim.');return}
  qrSession.identity=qrSession.identity||{};
  for(const [k,v] of Object.entries(info.identity||{})){
    if(qrSession.identity[k]!==undefined&&String(qrSession.identity[k])!==String(v)){setQrStatus('bad','Este QR apresenta identificação diferente do BU que já está sendo lido. Nenhum dado foi misturado. Toque em <b>Novo BU</b>.');return}
  }
  const existing=qrSession.parts?.[info.index];
  if(existing){
    if(String(existing).trim()===text){setQrStatus('','QRBU <b>'+info.index+'/'+info.total+'</b> já havia sido capturado · '+Object.keys(qrSession.parts).length+'/'+info.total+' reunidos.');return}
    setQrStatus('bad','Já existe um QRBU diferente na posição <b>'+info.index+'/'+info.total+'</b>. A leitura foi recusada.');return
  }
  Object.assign(qrSession.identity,info.identity||{});qrSession.total=info.total;qrSession.parts[info.index]=text;qrReset.style.display='inline-block';
  if(navigator.vibrate)navigator.vibrate(80);
  const got=Object.keys(qrSession.parts).length;setQrStatus('','QRBU <b>'+info.index+'/'+info.total+'</b> capturado · <b>'+got+' de '+info.total+'</b> QR reunidos.');if(got<info.total)return;

  try{
    setQrStatus('','<span class="spinner-dot"></span>Todos os QRBU foram lidos. Verificando a cadeia SHA-512…');
    const chain=await BUParser.verifyHashChain(qrSession.parts);qrSession.hashVerification=chain;
    if(!chain?.ok){const p=chain?.part?(' no QR '+chain.part+'/'+info.total):'';setQrStatus('bad','A verificação de integridade SHA-512 falhou'+p+'. Os dados <b>não serão aplicados</b>. Toque em <b>Novo BU</b>.');return}
    const assembled=BUParser.assemble(qrSession.parts);qrSession.parsed=BUParser.parse(assembled);qrSession.fingerprint=await sha256Hex(assembled);
    qrSession.testMode=String(qrSession.parsed?.meta?.TESTE||'')==='1'||String(qrSession.parsed?.meta?.ORIG||'').toUpperCase()==='TESTE';
    renderQrSummary();ce184GateSummary();
    if(qrSession.testMode){await stopQrScanner();setQrStatus('warn','BU sintético reconhecido. A cadeia SHA-512 foi conferida, mas <b>nenhum resultado poderá ser salvo</b>.');return}
    setQrStatus('','Cadeia SHA-512 íntegra. Agora leia os <b>2 QR Codes QRCE do certificado da urna</b> impressos ao final do BU.');
  }catch(e){console.error(e);setQrStatus('bad','As partes foram lidas, mas não consegui reconstruir e validar o BU. Toque em <b>Novo BU</b> e tente novamente.')}
}
`;
op=replaceBetween(op,'async function captureQrPart(text){','function renderQrSummary(){',capture,'captureQrPart');

op=op.replace(
  'Leitura estrutural registrada · cadeia SHA-512 dos QR verificada. A assinatura Ed25519 é preservada, mas ainda não é validada criptograficamente nesta versão.',
  'Cadeia SHA-512 verificada. Em boletins oficiais, a gravação só é liberada depois da conferência da assinatura digital com os QRCE do certificado da urna.'
);
op=op.replace(
  'A assinatura Ed25519 é preservada; esta versão ainda não executa sua validação criptográfica com a chave pública do TSE.',
  'A assinatura do BU é conferida com a chave pública extraída do certificado QRCE da própria urna; o algoritmo é identificado pelo certificado.'
);
op=op.replace(
  "fingerprint:qrSession.fingerprint,hashChainVerified:!!qrSession.hashVerification?.ok,hashAlgorithm:'SHA-512',parsedAt:new Date().toISOString(),",
  "fingerprint:qrSession.fingerprint,hashChainVerified:!!qrSession.hashVerification?.ok,hashAlgorithm:'SHA-512',signatureVerified:!!qrSession.signatureVerification?.valid,signatureAlgorithm:String(qrSession.signatureVerification?.algorithm||''),certificateSha256:String(qrSession.signatureVerification?.certificateSha256||''),certificateIDUE:String(qrSession.signatureVerification?.IDUE||''),certificateModel:String(qrSession.signatureVerification?.MDUE||''),testMode:!!qrSession.testMode,parsedAt:new Date().toISOString(),"
);
if(!op.includes("signatureVerified:!!qrSession.signatureVerification?.valid"))throw new Error('V1.8.4.3: metadata de assinatura nao injetada');
if(!op.includes("fetch('/api/bu/verify-signature'"))throw new Error('V1.8.4.3: endpoint de assinatura nao conectado ao leitor');
if(!op.includes('certificateFragmentInfo(text)'))throw new Error('V1.8.4.3: leitura QRCE nao conectada');
write(opPath,op);

/* ============================================================
   5) Versão PWA
   ============================================================ */
let sw=read(swPath);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.8.4.3-unified';");
write(swPath,sw);

console.log('V1.8.4.3 applied: QRCE + ECDSA P-521 / EdDSA Ed521 signature verification enabled.');
