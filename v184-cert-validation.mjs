import fs from 'node:fs';

const pub='/app/public';
const serverPath='/app/server.mjs';
const opPath=pub+'/operacao.html';
const swPath=pub+'/service-worker.js';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* ============================================================
   1) Backend: verificação conforme o manual TSE 2026
   ============================================================ */
let server=read(serverPath);
if(!server.includes("spawnSync as ce184SpawnSync")){
  server="import { spawnSync as ce184SpawnSync } from 'node:child_process';\n"+server;
}

const routeAnchor="    if (p === '/api/tse/status') return json(res,200,{ok:true,...tseSync.getStatus()});";
if(!server.includes("p === '/api/bu/verify-signature'")){
  if(!server.includes(routeAnchor))throw new Error('V1.8.4: route anchor not found');
  const route=`    if (p === '/api/bu/verify-signature' && req.method === 'POST') {
      const user=auth(req);
      if(!user) return json(res,401,{ok:false,error:'auth_required'});
      const body=await readBody(req);
      const certHex=String(body.certHex||'').replace(/\\s+/g,'');
      const signatureHex=String(body.signatureHex||'').replace(/\\s+/g,'');
      const hashHex=String(body.hashHex||'').replace(/\\s+/g,'');
      if(!certHex || certHex.length>24000 || certHex.length%2 || !/^[0-9a-f]+$/i.test(certHex))
        return json(res,400,{ok:false,error:'invalid_certificate_hex'});
      if(!signatureHex || signatureHex.length>1200 || signatureHex.length%2 || !/^[0-9a-f]+$/i.test(signatureHex))
        return json(res,400,{ok:false,error:'invalid_signature_hex'});
      if(!/^[0-9a-f]{128}$/i.test(hashHex))
        return json(res,400,{ok:false,error:'invalid_hash_hex'});
      try{
        const child=ce184SpawnSync('/usr/bin/python3',['/app/v184-bu-verify.py'],{
          input:JSON.stringify({certHex,signatureHex,hashHex}),
          encoding:'utf8',
          timeout:6000,
          maxBuffer:65536
        });
        if(child.error || child.status!==0){
          securityEvent({event:'bu_signature_verifier_error',outcome:'error',actor:user.name,tokenHint,sourceHash,requestId,details:{status:child.status??null,message:String(child.error?.message||child.stderr||'').slice(0,300)}});
          return json(res,503,{ok:false,error:'signature_verifier_unavailable'});
        }
        const result=JSON.parse(String(child.stdout||'{}'));
        if(!result.ok){
          securityEvent({event:'bu_signature_verification_failed',outcome:'denied',actor:user.name,tokenHint,sourceHash,requestId,details:{error:String(result.error||'verification_failed').slice(0,160)}});
          return json(res,422,{ok:false,valid:false,error:result.error||'signature_verification_failed'});
        }
        securityEvent({event:result.valid?'bu_signature_verified':'bu_signature_invalid',outcome:result.valid?'accepted':'denied',actor:user.name,tokenHint,sourceHash,requestId,details:{algorithm:result.algorithm||null,oid:result.oid||null}});
        return json(res,200,{ok:true,valid:!!result.valid,algorithm:result.algorithm||null,oid:result.oid||null,certificateSource:'QRCE'});
      }catch(e){
        console.warn('[BU signature]',e?.message||e);
        return json(res,503,{ok:false,error:'signature_verifier_error'});
      }
    }

${routeAnchor}`;
  server=server.replace(routeAnchor,route);
}
write(serverPath,server);

/* ============================================================
   2) Operação: QRBU + dois QRCE do certificado da urna
   ============================================================ */
let op=read(opPath);
function replaceBetween(source,start,end,replacement,label){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  if(a<0||b<0)throw new Error('V1.8.4: '+label+' not found');
  return source.slice(0,a)+replacement+source.slice(b);
}

const reset=String.raw`function resetQrSession(stop=true){
  qrSession={parts:{},total:null,parsed:null,fingerprint:'',identity:{},hashVerification:null,certParts:{},certTotal:null,certIdentity:{},signatureVerification:null,signaturePending:false};
  qrLastText='';qrSummary.classList.remove('open');qrSummary.innerHTML='';qrReset.style.display='none';
  setQrStatus('','Nenhum BU lido nesta sessão.');if(stop)stopQrScanner()
}
`;
op=replaceBetween(op,'function resetQrSession(stop=true){','async function loadQrLibrary()',reset,'resetQrSession');

const capture=String.raw`function ce184CertInfo(raw){
  const text=String(raw||'').replace(/[\\r\\n\\t]+/g,' ').replace(/\\s+/g,' ').trim();
  const m=text.match(/^QRCE:(\\d+):(\\d+)(?=\\s|\\||$)/i);if(!m)return null;
  const index=Number(m[1]),total=Number(m[2]);if(!Number.isInteger(index)||!Number.isInteger(total)||index<1||total<1||index>total)return null;
  const fields={};for(const tok of text.split(/[\\s|]+/).slice(1)){const p=tok.indexOf(':');if(p<0)continue;const k=tok.slice(0,p).toUpperCase(),v=tok.slice(p+1);if(k&&v!==''&&fields[k]===undefined)fields[k]=v}
  if(!fields.CERT||!/^[0-9A-F]+$/i.test(fields.CERT))return null;
  return {index,total,text,fields};
}
async function ce184FinalizeIfReady(){
  if(!qrSession.hashVerification?.ok||qrSession.signatureVerification?.valid||qrSession.signaturePending)return;
  const total=Number(qrSession.certTotal||0),parts=qrSession.certParts||{};
  if(!total||Object.keys(parts).length!==total)return;
  let certHex='';for(let i=1;i<=total;i++){const x=ce184CertInfo(parts[i]);if(!x){setQrStatus('bad','Não foi possível reconstruir o certificado da urna. Toque em <b>Novo BU</b> e leia novamente.');return}certHex+=x.fields.CERT}
  const hv=qrSession.hashVerification;if(!hv.signature){setQrStatus('bad','O BU não contém a assinatura digital esperada. Os dados <b>não serão aplicados</b>.');return}
  qrSession.signaturePending=true;
  setQrStatus('','<span class="spinner-dot"></span>Certificado completo. Validando a assinatura digital da urna…');
  try{
    const res=await fetch('/api/bu/verify-signature',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({certHex,signatureHex:hv.signature,hashHex:hv.lastHash})});
    const j=await res.json().catch(()=>null);
    if(!res.ok||!j?.ok){setQrStatus('bad','Não foi possível validar criptograficamente o certificado e a assinatura deste BU. Os dados <b>não serão aplicados</b>.');return}
    qrSession.signatureVerification=j;
    if(!j.valid){setQrStatus('bad','A assinatura digital deste BU <b>não confere</b> com o certificado QRCE impresso pela urna. Os dados não serão aplicados.');return}
    const assembled=BUParser.assemble(qrSession.parts);qrSession.parsed=BUParser.parse(assembled);qrSession.fingerprint=await sha256Hex(assembled);
    await stopQrScanner();setQrStatus('','Integridade e autenticidade verificadas com sucesso.');renderQrSummary()
  }catch(e){console.error(e);setQrStatus('bad','Falha ao concluir a validação criptográfica. Os dados não foram aplicados. Tente novamente.')}
  finally{qrSession.signaturePending=false}
}
async function ce184CaptureCertificate(text){
  const info=ce184CertInfo(text);if(!info)return false;
  qrSession.certParts=qrSession.certParts||{};qrSession.certIdentity=qrSession.certIdentity||{};
  if(qrSession.certTotal&&qrSession.certTotal!==info.total){setQrStatus('bad','Este QRCE pertence a outro certificado. Toque em <b>Novo BU</b> para evitar mistura.');return true}
  const idue=String(info.fields.IDUE||'');const mdue=String(info.fields.MDUE||'');
  if(idue&&qrSession.identity?.IDUE&&idue!==String(qrSession.identity.IDUE)){setQrStatus('bad','O certificado pertence a outra urna (IDUE diferente). Os dados não foram misturados.');return true}
  if(qrSession.certIdentity.IDUE&&idue&&qrSession.certIdentity.IDUE!==idue){setQrStatus('bad','Os QRCE lidos pertencem a urnas diferentes. Toque em <b>Novo BU</b>.');return true}
  if(qrSession.certIdentity.MDUE&&mdue&&qrSession.certIdentity.MDUE!==mdue){setQrStatus('bad','Os QRCE apresentam modelos de urna diferentes. Toque em <b>Novo BU</b>.');return true}
  const old=qrSession.certParts[info.index];if(old){if(String(old).trim()===info.text){setQrStatus('','QRCE <b>'+info.index+'/'+info.total+'</b> já havia sido lido.');return true}setQrStatus('bad','Já existe outro QRCE na posição '+info.index+'/'+info.total+'. Toque em <b>Novo BU</b>.');return true}
  qrSession.certTotal=info.total;qrSession.certParts[info.index]=info.text;if(idue)qrSession.certIdentity.IDUE=idue;if(mdue)qrSession.certIdentity.MDUE=mdue;
  if(navigator.vibrate)navigator.vibrate(80);
  const got=Object.keys(qrSession.certParts).length;setQrStatus('','Certificado da urna: <b>'+got+' de '+info.total+'</b> QRCE lidos.');
  await ce184FinalizeIfReady();return true
}
async function captureQrPart(text){
  text=String(text||'').replace(/[\\r\\n\\t]+/g,' ').replace(/\\s+/g,' ').trim();
  const now=Date.now();if(text===qrLastText&&now-qrLastAt<1800)return;qrLastText=text;qrLastAt=now;
  if(/^QRCE:/i.test(text)){await ce184CaptureCertificate(text);return}
  const info=BUParser?.fragmentInfo(text);
  if(!info){setQrStatus('bad','O código lido não é um QRBU nem um QRCE reconhecido do Boletim de Urna.');return}
  if(qrSession.total&&qrSession.total!==info.total){setQrStatus('warn','Este QR pertence a outro conjunto de BU. Toque em <b>Novo BU</b> antes de começar outro boletim.');return}
  qrSession.identity=qrSession.identity||{};
  for(const [k,v] of Object.entries(info.identity||{})){if(qrSession.identity[k]!==undefined&&String(qrSession.identity[k])!==String(v)){setQrStatus('bad','Este QR apresenta identificação diferente do BU que já está sendo lido. Nenhum dado foi misturado.');return}}
  if(qrSession.certIdentity?.IDUE&&info.identity?.IDUE&&String(qrSession.certIdentity.IDUE)!==String(info.identity.IDUE)){setQrStatus('bad','O QRBU e o certificado QRCE pertencem a urnas diferentes. Toque em <b>Novo BU</b>.');return}
  const existing=qrSession.parts?.[info.index];if(existing){if(String(existing).trim()===text){setQrStatus('','QR <b>'+info.index+'/'+info.total+'</b> já havia sido capturado · '+Object.keys(qrSession.parts).length+'/'+info.total+' reunidos.');return}setQrStatus('bad','Já existe um QR diferente na posição <b>'+info.index+'/'+info.total+'</b>. Para impedir mistura entre boletins, esta leitura foi recusada.');return}
  Object.assign(qrSession.identity,info.identity||{});qrSession.total=info.total;qrSession.parts[info.index]=text;qrReset.style.display='inline-block';if(navigator.vibrate)navigator.vibrate(80);
  const got=Object.keys(qrSession.parts).length;setQrStatus('','Dados do BU: <b>'+got+' de '+info.total+'</b> QRBU lidos.');if(got<info.total)return;
  try{
    setQrStatus('','<span class="spinner-dot"></span>Todos os QRBU foram lidos. Verificando a cadeia SHA-512…');
    const verification=await BUParser.verifyHashChain(qrSession.parts);qrSession.hashVerification=verification;
    if(!verification?.ok){const p=verification?.part?(' no QR '+verification.part+'/'+info.total):'';setQrStatus('bad','A verificação de integridade SHA-512 falhou'+p+'. Os dados <b>não serão aplicados</b>. Toque em <b>Novo BU</b> e leia novamente.');return}
    const cg=Object.keys(qrSession.certParts||{}).length,ct=Number(qrSession.certTotal||2);
    if(cg<ct){setQrStatus('','Cadeia SHA-512 íntegra. Agora leia os <b>2 QRCE do certificado da urna</b> ('+cg+'/'+ct+').');return}
    await ce184FinalizeIfReady()
  }catch(e){console.error(e);setQrStatus('bad','Não foi possível reconstruir e validar o BU. Os dados não foram aplicados.')}
}
`;
op=replaceBetween(op,'async function captureQrPart(text){','function renderQrSummary(){',capture,'captureQrPart');

op=op.replace(
  'Leitura estrutural registrada · cadeia SHA-512 dos QR verificada. A assinatura Ed25519 é preservada, mas ainda não é validada criptograficamente nesta versão.',
  'Leitura estrutural registrada · cadeia SHA-512 verificada · assinatura digital validada com o certificado QRCE impresso pela urna.'
);
op=op.replace(
  "Cadeia SHA-512: <b>verificada</b> · Fingerprint local: ${esc((qrSession.fingerprint||'').slice(0,24))}",
  "Cadeia SHA-512: <b>verificada</b> · Assinatura: <b>${esc(qrSession.signatureVerification?.algorithm||'validada')}</b> · Fingerprint local: ${esc((qrSession.fingerprint||'').slice(0,24))}"
);
op=op.replace(
  'A assinatura Ed25519 é preservada; esta versão ainda não executa sua validação criptográfica com a chave pública do TSE.',
  'A assinatura digital foi validada com a chave pública extraída do certificado QRCE impresso pela própria urna.'
);
op=op.replace(
  "fingerprint:qrSession.fingerprint,hashChainVerified:!!qrSession.hashVerification?.ok,hashAlgorithm:'SHA-512',parsedAt:new Date().toISOString(),",
  "fingerprint:qrSession.fingerprint,hashChainVerified:!!qrSession.hashVerification?.ok,hashAlgorithm:'SHA-512',signatureVerified:!!qrSession.signatureVerification?.valid,signatureAlgorithm:String(qrSession.signatureVerification?.algorithm||''),certificateQrVerified:true,certificateModel:String(qrSession.certIdentity?.MDUE||''),certificateUrnId:String(qrSession.certIdentity?.IDUE||''),parsedAt:new Date().toISOString(),"
);
if(!op.includes("certificateQrVerified:true"))throw new Error('V1.8.4: metadata not injected');
if(op.includes('assinatura Ed25519'))throw new Error('V1.8.4: stale Ed25519 wording remains in operation');
write(opPath,op);

let sw=read(swPath);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.8.4-unified';");
write(swPath,sw);

console.log('V1.8.4 applied: QRCE certificate capture and TSE-spec signature verification enabled.');
