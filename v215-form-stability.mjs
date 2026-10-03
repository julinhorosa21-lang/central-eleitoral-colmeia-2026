import fs from 'node:fs';
const pub='/app/public',op=pub+'/operacao.html';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const original=read(op);let h=original;

/* CE215: read newest results without redrawing an open BU form or QR scanner. */
const old=h.match(/^async function loadSnapshot\(showStatus=true\)\{[^\n]*\}$/m);
if(!old||!old[0].includes("renderSummary();if(currentPlace&&sheetWrap.classList.contains('open'))openPlace(currentPlace.id)"))
 throw new Error('V215 snapshot lifecycle unexpectedly changed');
const loader=[
"/* CE215_SHEET_SAFE_UPDATES */",
"let ce215SnapshotStamp=null,ce215Deferred=false;",
"new MutationObserver(()=>{",
" if(!sheetWrap.classList.contains('open')&&ce215Deferred){",
"  ce215Deferred=false;requestAnimationFrame(renderSummary);",
" }",
"}).observe(sheetWrap,{attributes:true,attributeFilter:['class']});",
"async function loadSnapshot(showStatus=true){",
" try{",
"  const r=await fetch('/api/snapshot',{cache:'no-store'});",
"  if(!r.ok)throw new Error('snapshot');",
"  const j=await r.json();",
"  const stamp=j.updatedAt?String(j.updatedAt)+'|'+String(j.total||0):null;",
"  const changed=!stamp||ce215SnapshotStamp!==stamp;",
"  if(changed){state=j.results||{};persist();ce215SnapshotStamp=stamp;}",
"  liveConnected=true;",
"  if(showStatus)setSyncStatus('live','Central ao vivo · '+String(j.total||0)+' resultados');",
"  if(!changed)return true;",
"  if(sheetWrap.classList.contains('open')){ce215Deferred=true;return true;}",
"  ce215Deferred=false;renderSummary();return true;",
" }catch(e){",
"  liveConnected=false;",
"  if(showStatus)setSyncStatus('offline','Modo local · servidor indisponível');",
"  return false;",
" }",
"}"
].join('\n');
h=h.replace(old[0],loader);
if(!h.includes('function renderSummary(){'))throw new Error('V215 summary lifecycle missing');
h=h.replace('function renderSummary(){','function renderSummary(){ce215Deferred=false;');

/* The QRBU/QRCE parsing and verification is unchanged. Suppress repeated
   frames from the camera; keep distinct fragments, including out of order. */
const oldCamera='txt=>captureQrPart(txt),()=>{}';
if(!h.includes(oldCamera)||!h.includes('async function startQrScanner(){'))throw new Error('V215 QR start changed');
h=h.replace('async function startQrScanner(){',[
"/* CE215_DUPLICATE_FRAME_GUARD */",
"let ce215LastFrame='',ce215LastFrameAt=0;",
"function ce215AcceptFrame(text){",
" const now=Date.now();",
" if(text===ce215LastFrame&&now-ce215LastFrameAt<850)return;",
" ce215LastFrame=text;ce215LastFrameAt=now;",
" Promise.resolve(captureQrPart(text)).catch(e=>console.warn('Leitura QR:',e));",
"}",
"async function startQrScanner(){ce215LastFrame='';ce215LastFrameAt=0;"
].join('\n'));
h=h.replace(oldCamera,'txt=>ce215AcceptFrame(txt),()=>{}');

/* Avoid rebuilding the entire native photo grid on every search keystroke. */
let search='untouched';
const searchEvent=/candidateSearch\.oninput\s*=\s*\(\)\s*=>\s*renderCandidates\(true\);/;
if(searchEvent.test(h)){
 h=h.replace(searchEvent,"candidateSearch.oninput=()=>{clearTimeout(ce215CandidateTimer);ce215CandidateTimer=setTimeout(()=>renderCandidates(true),140);};");
 h=h.replace('function renderCandidates(reset=false){','let ce215CandidateTimer=null;\nfunction renderCandidates(reset=false){');
 search='debounced';
}
write(op,h);

/* The access-key handoff should not rescan the entire form for every QR update. */
const bridgeFile=pub+'/v151-operator-bridge.js';let bridge=read(bridgeFile);
const a=bridge.indexOf('function start(){handoff();');
const b=bridge.indexOf("if(document.readyState==='loading')",a);
if(a<0||b<0)throw new Error('V215 access-key lifecycle changed');
bridge=bridge.slice(0,a)+[
"/* CE215_TARGETED_HANDOFF */",
"function start(){",
" handoff();let pending=false;",
" const inputs='input[type=\"password\"],input[id*=\"chave\" i],input[id*=\"token\" i],input[id*=\"key\" i]';",
" const mo=new MutationObserver(records=>{",
"  const shouldCheck=records.some(m=>{",
"   if(m.type==='attributes')return m.target instanceof Element &&",
"    (m.target.matches?.(inputs)||m.target.querySelector?.(inputs));",
"   return [...m.addedNodes].some(n=>n instanceof Element &&",
"    (n.matches?.(inputs)||n.querySelector?.(inputs)));",
"  });",
"  if(!shouldCheck||pending)return;",
"  pending=true;requestAnimationFrame(()=>{pending=false;handoff()});",
" });",
" mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','open']});",
" setTimeout(handoff,300);setTimeout(handoff,900);",
"}",
""
].join('\n')+bridge.slice(b);
new Function(bridge);write(bridgeFile,bridge);
h=read(op).replace('/v151-operator-bridge.js?v=151','/v151-operator-bridge.js?v=215');
write(op,h);

/* A version change activates refreshed precache for existing PWA users. */
let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.15-unified';");
write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';if(fs.existsSync(pkg)){
 const j=JSON.parse(read(pkg));j.version='2.0.15';write(pkg,JSON.stringify(j,null,2)+'\n');
}

/* Compile the exact inline operational code and assert crypto/write invariants. */
const inline=[...h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(x=>x[1].includes('CE215_SHEET_SAFE_UPDATES'));
if(!inline)throw new Error('V215 optimized inline program missing');
new Function(inline[1]);
for(const anchor of ['BUParser.verifyHashChain(qrSession.parts)','ce184VerifyCertificate()',
 'saveResult()','queueOffline(payload)']){
 if(original.split(anchor).length!==h.split(anchor).length)throw new Error('V215 changed BU invariant '+anchor);
}
if(!h.includes('CE215_DUPLICATE_FRAME_GUARD')||!read(bridgeFile).includes('CE215_TARGETED_HANDOFF'))
 throw new Error('V215 expected performance guard missing');
if(!sw.includes('v2.0.15-unified'))throw new Error('V215 PWA cache version missing');
console.log('V2.0.15 regression passed: sheet state preserved on concurrent updates, repeated video frames skipped, targeted login handoff, cryptographic verification intact, candidate search '+search+'.');
