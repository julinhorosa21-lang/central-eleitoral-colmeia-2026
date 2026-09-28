import fs from 'node:fs';

const pub='/app/public';
const serverPath='/app/server.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* ============================================================
   V1.9.0 — desempenho operacional
   - verificador criptográfico assíncrono + cache/in-flight dedup
   - backup pós-gravação fora do caminho crítico
   - observers visuais restritos aos componentes relevantes
   ============================================================ */

let server=read(serverPath);

/* 1) Assinatura: remove spawnSync do caminho da requisição. */
if(!server.includes('CE190_ASYNC_SIGNATURE_VERIFY')){
  server="import { spawn as ce190Spawn } from 'node:child_process';\n"+server;

  const routeStart="    if (p === '/api/bu/verify-signature' && req.method === 'POST') {";
  const routeEnd="    if (p === '/api/tse/status') return json(res,200,{ok:true,...tseSync.getStatus()});";
  const a=server.indexOf(routeStart),b=server.indexOf(routeEnd,a);
  if(a<0||b<0)throw new Error('V1.9.0: rota verify-signature não localizada');

  const helper=String.raw`
/* CE190_ASYNC_SIGNATURE_VERIFY */
const ce190SignatureCache=new Map();
const ce190SignaturePending=new Map();
function ce190SignatureCacheKey(hashHex,signatureHex,certificateHex){
  return hashHex+'|'+signatureHex+'|'+certificateHex;
}
function ce190SignatureCachePut(key,value){
  if(ce190SignatureCache.has(key))ce190SignatureCache.delete(key);
  ce190SignatureCache.set(key,value);
  while(ce190SignatureCache.size>24)ce190SignatureCache.delete(ce190SignatureCache.keys().next().value);
}
function ce190RunSignatureVerifier(hashHex,signatureHex,certificateHex){
  const key=ce190SignatureCacheKey(hashHex,signatureHex,certificateHex);
  const cached=ce190SignatureCache.get(key);
  if(cached)return Promise.resolve({...cached,cached:true});
  const pending=ce190SignaturePending.get(key);
  if(pending)return pending;
  const py=process.env.CE184_PYTHON||'/opt/ce184-venv/bin/python';
  const task=new Promise((resolve,reject)=>{
    let proc,out='',err='',settled=false;
    const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);fn(value)};
    try{
      proc=ce190Spawn(py,['/app/ce184-verify.py'],{stdio:['pipe','pipe','pipe']});
    }catch(e){reject(e);return}
    const timer=setTimeout(()=>{try{proc.kill('SIGKILL')}catch{};finish(reject,new Error('signature_verifier_timeout'))},7000);
    proc.stdout.setEncoding('utf8');proc.stderr.setEncoding('utf8');
    proc.stdout.on('data',d=>{if(out.length<1024*1024)out+=d});
    proc.stderr.on('data',d=>{if(err.length<8192)err+=d});
    proc.on('error',e=>finish(reject,e));
    proc.on('close',code=>{
      if(code!==0)return finish(reject,new Error(('signature_verifier_exit_'+code+' '+err).slice(0,300)));
      let result;try{result=JSON.parse(String(out||'').trim())}catch{return finish(reject,new Error('signature_verifier_invalid_response'))}
      ce190SignatureCachePut(key,result);
      finish(resolve,result);
    });
    try{proc.stdin.end(JSON.stringify({hashHex,signatureHex,certificateHex}))}catch(e){finish(reject,e)}
  }).finally(()=>ce190SignaturePending.delete(key));
  ce190SignaturePending.set(key,task);
  return task;
}
`;

  const route=String.raw`    if (p === '/api/bu/verify-signature' && req.method === 'POST') {
      const rl=takeRateLimit('bu-signature:'+sourceHash,12,60000);
      if(!rl.ok){res.setHeader('retry-after',String(rl.retryAfter));return json(res,429,{ok:false,valid:false,error:'rate_limited'});}
      const body=await readBody(req);
      const clean=v=>String(v||'').replace(/\s+/g,'').toUpperCase();
      const hashHex=clean(body.hashHex),signatureHex=clean(body.signatureHex),certificateHex=clean(body.certificateHex);
      if(!/^[0-9A-F]{128}$/.test(hashHex))return json(res,400,{ok:false,valid:false,error:'invalid_hash'});
      if(!/^[0-9A-F]+$/.test(signatureHex)||signatureHex.length<64||signatureHex.length>4096||signatureHex.length%2)return json(res,400,{ok:false,valid:false,error:'invalid_signature'});
      if(!/^[0-9A-F]+$/.test(certificateHex)||certificateHex.length<256||certificateHex.length>65536||certificateHex.length%2)return json(res,400,{ok:false,valid:false,error:'invalid_certificate'});
      let result;
      try{
        result=await ce190RunSignatureVerifier(hashHex,signatureHex,certificateHex);
      }catch(e){
        securityEvent({event:'bu_signature_verify_error',outcome:'error',sourceHash,requestId,details:{message:String(e?.message||e).slice(0,160)}});
        return json(res,503,{ok:false,valid:false,error:'signature_verifier_unavailable'});
      }
      securityEvent({
        event:'bu_signature_checked',
        outcome:result?.valid?'accepted':'denied',
        sourceHash,requestId,
        details:{algorithm:result?.algorithm||null,certificateSha256:result?.certificateSha256||null,error:result?.error||null,cached:!!result?.cached}
      });
      return json(res,200,{
        ok:!!result?.valid,
        valid:!!result?.valid,
        algorithm:result?.algorithm||null,
        oid:result?.oid||null,
        certificateSha256:result?.certificateSha256||null,
        publicKeySha512:result?.publicKeySha512||null,
        cached:!!result?.cached,
        error:result?.error||null
      });
    }

`;

  server=helper+server.slice(0,a)+route+server.slice(b);
}

/* 2) Backup de resultados: debounce + cópia assíncrona. */
if(!server.includes('CE190_DEFERRED_RESULT_BACKUP')){
  const old=/function ce178BackupAfterResult\(\)\{[\s\S]*?\n\}/;
  const m=server.match(old);
  if(!m)throw new Error('V1.9.0: ce178BackupAfterResult não localizado');
  const replacement=String.raw`/* CE190_DEFERRED_RESULT_BACKUP */
let ce190ResultBackupTimer=null;
let ce190ResultBackupRunning=false;
let ce190ResultBackupAgain=false;
function ce190ResultBackupAsync(){
  if(ce190ResultBackupRunning){ce190ResultBackupAgain=true;return}
  ce190ResultBackupRunning=true;
  try{db.exec('PRAGMA wal_checkpoint(FULL)')}catch{}
  ce178fs.mkdirSync(CE178_BACKUP_DIR,{recursive:true});
  const file='central-'+ce178Stamp()+'-'+ce178SafeReason('result')+'.sqlite';
  const target=CE178_BACKUP_DIR+'/'+file;
  ce178fs.copyFile(CE178_DB_FILE,target,err=>{
    try{
      if(err)throw err;
      const meta=ce178BackupMeta(file);
      ce178PruneBackups();
      try{securityEvent({event:'backup_created',outcome:'accepted',actor:'system',details:{file:meta.file,size:meta.size,reason:meta.reason,async:true}})}catch{}
    }catch(e){console.error('backup result async failed',e?.message||e)}
    finally{
      ce190ResultBackupRunning=false;
      if(ce190ResultBackupAgain){ce190ResultBackupAgain=false;ce178BackupAfterResult()}
    }
  });
}
function ce178BackupAfterResult(){
  clearTimeout(ce190ResultBackupTimer);
  ce190ResultBackupTimer=setTimeout(ce190ResultBackupAsync,1800);
}`;
  server=server.replace(old,replacement);
}

write(serverPath,server);

/* 3) V1.8.7 UI: remove observer global/characterData e cacheia catálogo. */
const uiPath=pub+'/v187-ui.js';
let ui=read(uiPath);
ui=ui.replace(
  "async function load(){try{const r=await fetch('/data/candidate-catalog.json?v=187',{cache:'no-store'});if(r.ok){catalog=await r.json();adoptCatalog();run()}}catch(e){console.warn('V1.8.7 catálogo estático indisponível',e)}}",
  "let ce190CatalogLoadedAt=0;async function load(force=false){if(!force&&catalog&&Date.now()-ce190CatalogLoadedAt<300000){run();return}try{const r=await fetch('/data/candidate-catalog.json?v=187',{cache:'force-cache'});if(r.ok){catalog=await r.json();ce190CatalogLoadedAt=Date.now();adoptCatalog();run()}}catch(e){console.warn('V1.9.0 catálogo visual indisponível',e)}}"
);
ui=ui.replace(
  "function start(){load();run();[150,500,1200,2500].forEach(ms=>setTimeout(run,ms));new MutationObserver(run).observe(document.body,{subtree:true,childList:true,characterData:true});document.addEventListener('click',()=>setTimeout(run,80),true);window.addEventListener('pageshow',()=>{load();run()})}",
  "let ce190RunTimer=null,ce190Observed=new WeakSet();function ce190ScheduleRun(ms=90){clearTimeout(ce190RunTimer);ce190RunTimer=setTimeout(run,ms)}function ce190ObserveRoots(){document.querySelectorAll('#leaders,#candidateCatalog,#ce161OperatorCandidates').forEach(root=>{if(ce190Observed.has(root))return;ce190Observed.add(root);new MutationObserver(()=>ce190ScheduleRun(100)).observe(root,{subtree:true,childList:true})})}function start(){load();run();[250,900].forEach(ms=>setTimeout(()=>{ce190ObserveRoots();ce190ScheduleRun()},ms));document.addEventListener('click',e=>{if(e.target.closest('#cargoTabs,.cargo-tabs,[data-cargo]'))ce190ScheduleRun(70)},true);window.addEventListener('pageshow',()=>{ce190ObserveRoots();load(false);ce190ScheduleRun()})}"
);
if(!ui.includes('ce190ObserveRoots')||ui.includes("characterData:true"))throw new Error('V1.9.0: observer V187 não otimizado');
write(uiPath,ui);

/* 4) Identidade V1.8.9: observer só no ranking/candidatos. */
const idPath=pub+'/v189-identity.js';
let identity=read(idPath);
identity=identity.replace(
  "function start(){\n  run();\n  [200,700,1600].forEach(ms=>setTimeout(run,ms));\n  new MutationObserver(()=>requestAnimationFrame(run)).observe(document.body,{subtree:true,childList:true});\n}",
  "let ce190IdentityTimer=null,ce190IdentityRoot=null;function ce190IdentitySchedule(){clearTimeout(ce190IdentityTimer);ce190IdentityTimer=setTimeout(()=>requestAnimationFrame(run),120)}function ce190IdentityObserve(){const root=document.getElementById('leaders')||document.getElementById('candidateCatalog')||document.getElementById('ce161OperatorCandidates');if(!root||root===ce190IdentityRoot)return;ce190IdentityRoot=root;new MutationObserver(ce190IdentitySchedule).observe(root,{subtree:true,childList:true})}function start(){\n  run();\n  [250,900].forEach(ms=>setTimeout(()=>{ce190IdentityObserve();ce190IdentitySchedule()},ms));\n}"
);
if(identity.includes("observe(document.body,{subtree:true,childList:true})"))throw new Error('V1.9.0: observer V189 não otimizado');
write(idPath,identity);

/* 5) Cards extensos da consulta operacional só são renderizados visualmente quando próximos. */
const perfCss=pub+'/v180-performance.css';
if(fs.existsSync(perfCss)){
  let c=read(perfCss);
  if(!c.includes('.ce161-op-card{content-visibility:auto')){
    c+='\n.ce161-op-card{content-visibility:auto;contain-intrinsic-size:76px 320px}\n';
    write(perfCss,c);
  }
}

/* 6) PWA/cache */
const swPath=pub+'/service-worker.js';
let sw=read(swPath).replace(/const VERSION='[^']+';/,"const VERSION='v1.9.0-unified';");
write(swPath,sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='1.9.0';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(!read(serverPath).includes('CE190_ASYNC_SIGNATURE_VERIFY'))throw new Error('V1.9.0 async signature missing');
if(!read(serverPath).includes('CE190_DEFERRED_RESULT_BACKUP'))throw new Error('V1.9.0 deferred backup missing');
if(!read(swPath).includes("v1.9.0-unified"))throw new Error('V1.9.0 SW missing');
console.log('V1.9.0 applied: async BU signature verification, deferred backups and scoped DOM observers.');
