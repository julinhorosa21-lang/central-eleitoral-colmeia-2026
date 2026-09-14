import fs from 'node:fs';

const pub='/app/public';
const opPath=`${pub}/operacao.html`;
const swPath=`${pub}/service-worker.js`;
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let op=read(opPath);

op=op.replace(
  "qrSession={parts:{},total:null,parsed:null,fingerprint:'',identity:{},hashVerification:null};",
  "qrSession={parts:{},total:null,parsed:null,fingerprint:'',identity:{},hashVerification:null,signatureVerification:null};"
);

if(!op.includes('async function ce184AcquireOfficialKey(')){
  const anchor='async function captureQrPart(text){';
  if(!op.includes(anchor))throw new Error('V1.8.4: captureQrPart anchor not found');
  const helper=String.raw`function ce184Hex(bytes){return Array.from(bytes||[]).map(x=>Number(x).toString(16).padStart(2,'0')).join('').toUpperCase()}
async function ce184AcquireOfficialKey(parts){
  let d;try{d=BUParser.keyDescriptor(parts)}catch{return null}
  const file=d.phase+d.uf+'qrcode.pub';
  const base='https://qrcodenobu.tse.jus.br/tse.qrcodebu';
  const url=base+'/'+encodeURIComponent(d.version)+'/'+d.type+'/'+file;
  return await new Promise(resolve=>{
    document.querySelector('.ce184-backdrop')?.remove();
    const back=document.createElement('div');back.className='ce184-backdrop';
    back.innerHTML='<section class="ce184-sheet" role="dialog" aria-modal="true"><div class="ce184-kicker">AUTENTICIDADE DO BU</div><h2>Chave pública do TSE necessária</h2><p>Para validar a assinatura Ed25519 deste boletim, baixe a chave pública correspondente no endereço oficial do TSE e selecione o arquivo <b>'+file+'</b>.</p><div class="ce184-meta">Versão da chave: <b>'+d.version+'</b> · Tipo: <b>'+d.type+'</b> · UF: <b>'+d.uf.toUpperCase()+'</b></div><div class="ce184-actions"><a class="ce184-btn primary" href="'+url+'" target="_blank" rel="noopener">Baixar chave no TSE</a><label class="ce184-btn">Selecionar arquivo<input class="ce184-file" type="file" accept=".pub,application/octet-stream" hidden></label><button class="ce184-btn" type="button" data-cancel>Cancelar</button></div><p class="ce184-error" aria-live="polite"></p><small>A Central aceita somente uma chave binária Ed25519 de 32 bytes. A chave validada fica armazenada apenas neste navegador para leituras futuras com a mesma versão.</small></section>';
    const done=v=>{back.remove();resolve(v)};back.querySelector('[data-cancel]').onclick=()=>done(null);back.addEventListener('click',e=>{if(e.target===back)done(null)});
    const input=back.querySelector('.ce184-file'),err=back.querySelector('.ce184-error');
    input.onchange=async()=>{try{const f=input.files?.[0];if(!f)return;const bytes=new Uint8Array(await f.arrayBuffer());if(bytes.length!==32)throw new Error('A chave selecionada não possui 32 bytes. Baixe novamente o arquivo oficial indicado acima.');let digest='';try{digest=ce184Hex(new Uint8Array(await crypto.subtle.digest('SHA-512',bytes)))}catch{}const storage='ce184_tse_qr_key:'+d.version+':'+d.type+':'+d.phase+':'+d.uf;localStorage.setItem(storage,JSON.stringify({keyHex:ce184Hex(bytes),keySha512:digest,savedAt:new Date().toISOString()}));done(bytes)}catch(e){err.textContent=e?.message||'Não foi possível ler esta chave.';input.value=''}};
    document.body.appendChild(back)
  })
}
async function ce184VerifySignature(parts,chain){
  let v=await BUParser.verifyEd25519Signature(parts,{chain});
  if(v?.ok)return v;
  if(v?.error==='tse_key_unavailable'){
    const bytes=await ce184AcquireOfficialKey(parts);if(!bytes)return v;
    v=await BUParser.verifyEd25519Signature(parts,{chain,publicKeyBytes:bytes});
  }
  return v
}

`;
  op=op.replace(anchor,helper+anchor);
}

if(!op.includes('ce184VerifySignature(qrSession.parts,verification)')){
  const anchor='    const assembled=BUParser.assemble(qrSession.parts);';
  if(!op.includes(anchor))throw new Error('V1.8.4: assembled anchor not found');
  const block=String.raw`    setQrStatus('','<span class="spinner-dot"></span>Cadeia SHA-512 íntegra. Validando a assinatura Ed25519 do boletim…');
    const sigVerification=await ce184VerifySignature(qrSession.parts,verification);qrSession.signatureVerification=sigVerification;
    if(!sigVerification?.ok){
      const er=String(sigVerification?.error||'signature_verification_failed');
      if(er==='tse_key_unavailable')setQrStatus('bad','A chave pública correspondente não foi disponibilizada. Por segurança, os dados <b>não serão aplicados</b>.');
      else if(er==='ed25519_unavailable')setQrStatus('bad','Este navegador não oferece a verificação Ed25519 necessária. Por segurança, os dados <b>não serão aplicados</b>. Atualize o Chrome e tente novamente.');
      else if(er==='qrbu_signature_missing')setQrStatus('bad','O boletim não contém a assinatura digital esperada. Por segurança, os dados <b>não serão aplicados</b>.');
      else setQrStatus('bad','A assinatura digital Ed25519 do boletim é inválida para a chave pública selecionada. Os dados <b>não serão aplicados</b>.');
      return
    }
`;
  op=op.replace(anchor,block+anchor);
}

op=op.replace(
  'Leitura estrutural registrada · cadeia SHA-512 dos QR verificada. A assinatura Ed25519 é preservada, mas ainda não é validada criptograficamente nesta versão.',
  'Leitura estrutural registrada · cadeia SHA-512 verificada · assinatura Ed25519 validada com a chave pública correspondente do TSE.'
);
op=op.replace(
  'Cadeia SHA-512: <b>verificada</b> · Fingerprint local:',
  'Cadeia SHA-512: <b>verificada</b> · Assinatura Ed25519: <b>válida</b> · Fingerprint local:'
);
op=op.replace(
  'A assinatura Ed25519 é preservada; esta versão ainda não executa sua validação criptográfica com a chave pública do TSE.',
  'A assinatura Ed25519 foi validada com a chave pública correspondente do TSE.'
);
op=op.replace(
  "fingerprint:qrSession.fingerprint,hashChainVerified:!!qrSession.hashVerification?.ok,hashAlgorithm:'SHA-512',parsedAt:new Date().toISOString(),",
  "fingerprint:qrSession.fingerprint,hashChainVerified:!!qrSession.hashVerification?.ok,hashAlgorithm:'SHA-512',signatureVerified:!!qrSession.signatureVerification?.ok,signatureAlgorithm:'Ed25519',tseKeyVersion:String(qrSession.signatureVerification?.descriptor?.version||''),tseKeySha512:String(qrSession.signatureVerification?.keySha512||''),tseKeySource:String(qrSession.signatureVerification?.keySource||''),parsedAt:new Date().toISOString(),"
);

if(!op.includes('signatureVerified:!!qrSession.signatureVerification?.ok'))throw new Error('V1.8.4: signature metadata not injected');
write(opPath,op);

const css=`<style id="ce184-style">
.ce184-backdrop{position:fixed;inset:0;z-index:25000;background:rgba(5,20,31,.68);display:flex;align-items:flex-end;justify-content:center;padding:12px}.ce184-sheet{width:min(560px,100%);background:#fff;color:#17324a;border-radius:20px 20px 14px 14px;padding:18px;box-shadow:0 -20px 58px rgba(0,0,0,.28)}.ce184-sheet h2{margin:4px 0 8px;font-size:20px}.ce184-sheet p{font-size:11px;line-height:1.5;color:#536d7b}.ce184-kicker{font-size:9px;font-weight:900;letter-spacing:.08em;color:#176b49}.ce184-meta{padding:10px;border-radius:10px;background:#f3f8fb;font-size:10px}.ce184-actions{display:grid;gap:8px;margin-top:12px}.ce184-btn{display:block;text-align:center;border:1px solid #cad9e1;border-radius:11px;background:#fff;color:#31566e;padding:11px 12px;font:inherit;font-size:11px;font-weight:850;cursor:pointer;text-decoration:none}.ce184-btn.primary{border-color:#176b49;background:#176b49;color:#fff}.ce184-error{min-height:16px;color:#9b2929!important}.ce184-sheet small{display:block;margin-top:10px;color:#73838c;font-size:9px;line-height:1.45}@media(min-width:700px){.ce184-backdrop{align-items:center}.ce184-sheet{border-radius:18px}}
</style>`;
if(!op.includes('id="ce184-style"'))op=op.replace('</head>',css+'\n</head>');
write(opPath,op);

let sw=read(swPath);sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.8.4-unified';");write(swPath,sw);
console.log('V1.8.4 operation applied: Ed25519 authenticity validation with official TSE key import enabled.');
