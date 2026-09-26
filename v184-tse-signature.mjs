import fs from 'node:fs';

const pub='/app/public';
const serverPath='/app/server.mjs';
const opPath=pub+'/operacao.html';
const swPath=pub+'/service-worker.js';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(serverPath);

if(!server.includes("createHash as ce184CreateHash")){
  server="import { createHash as ce184CreateHash } from 'node:crypto';\n"+server;
}

const routeAnchor="    if (p === '/api/tse/status') return json(res,200,{ok:true,...tseSync.getStatus()});";
if(!server.includes("p === '/api/tse/qr-key'")){
  if(!server.includes(routeAnchor))throw new Error('V1.8.4.1: TSE route anchor not found');
  const route=`    if (p === '/api/tse/qr-key' && req.method === 'GET') {
      const rl=takeRateLimit('tse-qr-key:'+sourceHash,20,60000);
      if(!rl.ok){res.setHeader('retry-after',String(rl.retryAfter));return json(res,429,{ok:false,error:'rate_limited'});}
      const version=String(u.searchParams.get('version')||'').trim();
      const type=String(u.searchParams.get('type')||'').trim().toUpperCase();
      const phase=String(u.searchParams.get('phase')||'').trim().toLowerCase();
      const uf=String(u.searchParams.get('uf')||'').trim().toLowerCase();
      if(!/^\\d{8}$/.test(version) || !['LEGAL','COMUNITARIA'].includes(type) || !['o','s'].includes(phase) || !/^[a-z]{2}$/.test(uf))
        return json(res,400,{ok:false,error:'invalid_qr_key_descriptor'});
      const cacheKey=[version,type,phase,uf].join(':');
      const cache=globalThis.__ce184TseQrKeyCache || (globalThis.__ce184TseQrKeyCache=new Map());
      let item=cache.get(cacheKey);
      if(!item || Date.now()-item.at>12*60*60*1000){
        const keyUrl='https://qrcodenobu.tse.jus.br/tse.qrcodebu/'+encodeURIComponent(version)+'/'+type+'/'+phase+uf+'qrcode.pub';
        let response;
        try{response=await fetch(keyUrl,{headers:{accept:'application/octet-stream,*/*;q=0.8','user-agent':'Central-Eleitoral-Colmeia/1.8.4.1'},signal:AbortSignal.timeout(9000),redirect:'follow'});}
        catch(e){return json(res,503,{ok:false,error:'tse_qr_key_network'});}
        if(!response.ok)return json(res,response.status===404?404:503,{ok:false,error:response.status===404?'tse_qr_key_not_found':'tse_qr_key_http'});
        const data=Buffer.from(await response.arrayBuffer());
        if(data.length!==32)return json(res,502,{ok:false,error:'tse_qr_key_invalid_length'});
        item={data,at:Date.now(),sha512:ce184CreateHash('sha512').update(data).digest('hex').toUpperCase()};
        cache.set(cacheKey,item);
      }
      res.writeHead(200,{
        'Content-Type':'application/octet-stream',
        'Content-Length':String(item.data.length),
        'Cache-Control':'public, max-age=43200, immutable',
        'X-CE-Key-SHA512':item.sha512,
        'X-CE-Key-Source':'qrcodenobu.tse.jus.br'
      });
      return res.end(item.data);
    }

${routeAnchor}`;
  server=server.replace(routeAnchor,route);
}
write(serverPath,server);

let op=read(opPath);
function replaceBetween(source,start,end,replacement,label){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  if(a<0||b<0)throw new Error('V1.8.4.1: '+label+' not found');
  return source.slice(0,a)+replacement+source.slice(b);
}

const reset=String.raw`function resetQrSession(stop=true){
  qrSession={parts:{},total:null,parsed:null,fingerprint:'',identity:{},hashVerification:null,signatureVerification:null,signaturePending:false};
  qrLastText='';qrSummary.classList.remove('open');qrSummary.innerHTML='';qrReset.style.display='none';
  setQrStatus('','Nenhum BU lido nesta sessão.');if(stop)stopQrScanner()
}
`;
op=replaceBetween(op,'function resetQrSession(stop=true){','async function loadQrLibrary()',reset,'resetQrSession');

const capture=String.raw`async function captureQrPart(text){
  text=String(text||'').replace(/[\\r\\n\\t]+/g,' ').replace(/\\s+/g,' ').trim();
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
  if(qrSession.signaturePending)return;
  qrSession.signaturePending=true;
  try{
    setQrStatus('','<span class="spinner-dot"></span>Todos os QR foram lidos. Verificando a cadeia SHA-512…');
    const chain=await BUParser.verifyHashChain(qrSession.parts);qrSession.hashVerification=chain;
    if(!chain?.ok){const p=chain?.part?(' no QR '+chain.part+'/'+info.total):'';setQrStatus('bad','A verificação de integridade SHA-512 falhou'+p+'. Os dados <b>não serão aplicados</b>. Toque em <b>Novo BU</b> e leia novamente.');return}
    setQrStatus('','<span class="spinner-dot"></span>Cadeia SHA-512 íntegra. Validando a assinatura Ed25519 com a chave pública oficial do TSE…');
    const sig=await BUParser.verifyEd25519Signature(qrSession.parts,{chain});qrSession.signatureVerification=sig;
    if(!sig?.ok){
      const msg=sig?.error==='qrbu_signature_invalid'
        ? 'A assinatura digital do BU <b>não confere</b> com a chave pública oficial correspondente. Os dados não serão aplicados.'
        : 'Não foi possível validar a assinatura digital com a chave pública oficial do TSE. Os dados <b>não serão aplicados</b>. Verifique a conexão e tente novamente.';
      setQrStatus('bad',msg);return
    }
    const assembled=BUParser.assemble(qrSession.parts);qrSession.parsed=BUParser.parse(assembled);qrSession.fingerprint=await sha256Hex(assembled);
    await stopQrScanner();setQrStatus('','Integridade e autenticidade do BU verificadas com sucesso.');renderQrSummary()
  }catch(e){console.error(e);setQrStatus('bad','Não foi possível reconstruir e validar o BU. Os dados não foram aplicados. Toque em <b>Novo BU</b> e tente novamente.')}
  finally{qrSession.signaturePending=false}
}
`;
op=replaceBetween(op,'async function captureQrPart(text){','function renderQrSummary(){',capture,'captureQrPart');

op=op.replace(
  'Leitura estrutural registrada · cadeia SHA-512 dos QR verificada. A assinatura Ed25519 é preservada, mas ainda não é validada criptograficamente nesta versão.',
  'Leitura estrutural registrada · cadeia SHA-512 verificada · assinatura Ed25519 validada com a chave pública oficial do TSE.'
);
op=op.replace(
  "Cadeia SHA-512: <b>verificada</b> · Fingerprint local: ${esc((qrSession.fingerprint||'').slice(0,24))}",
  "Cadeia SHA-512: <b>verificada</b> · Assinatura Ed25519: <b>válida</b> · Fingerprint local: ${esc((qrSession.fingerprint||'').slice(0,24))}"
);
op=op.replace(
  'A assinatura Ed25519 é preservada; esta versão ainda não executa sua validação criptográfica com a chave pública do TSE.',
  'A assinatura Ed25519 foi validada contra a chave pública oficial selecionada por versão, tipo de eleição, fase e UF.'
);
op=op.replace(
  "fingerprint:qrSession.fingerprint,hashChainVerified:!!qrSession.hashVerification?.ok,hashAlgorithm:'SHA-512',parsedAt:new Date().toISOString(),",
  "fingerprint:qrSession.fingerprint,hashChainVerified:!!qrSession.hashVerification?.ok,hashAlgorithm:'SHA-512',signatureVerified:!!qrSession.signatureVerification?.ok,signatureAlgorithm:'Ed25519',keySha512:String(qrSession.signatureVerification?.keySha512||''),keySource:String(qrSession.signatureVerification?.keySource||''),parsedAt:new Date().toISOString(),"
);
if(!op.includes("signatureAlgorithm:'Ed25519'"))throw new Error('V1.8.4.1: signature metadata not injected');
if(!op.includes('BUParser.verifyEd25519Signature(qrSession.parts,{chain})'))throw new Error('V1.8.4.1: Ed25519 verification not wired');
write(opPath,op);

let sw=read(swPath);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.8.4.1-unified';");
write(swPath,sw);

console.log('V1.8.4.1 applied: TSE public-key Ed25519 verification enabled for QR-BU.');
