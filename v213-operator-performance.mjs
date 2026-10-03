import fs from 'node:fs';
const pub='/app/public',opFile=pub+'/operacao.html';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const original=read(opFile);let h=original;

/* CE213_FORM_SAFE_REFRESH: preserve the active sheet during external updates. */
const old=h.match(/^async function loadSnapshot\(showStatus=true\)\{[^\n]*\}$/m);
if(!old||!old[0].includes("renderSummary();if(currentPlace&&sheetWrap.classList.contains('open'))openPlace(currentPlace.id)"))
 throw new Error('CE213 snapshot lifecycle changed');
const loader=[
"/* CE213_FORM_SAFE_REFRESH */",
"let ce213Stamp=null,ce213Deferred=false;",
"const ce213SheetObserver=new MutationObserver(()=>{",
" if(!sheetWrap.classList.contains('open')&&ce213Deferred){ce213Deferred=false;requestAnimationFrame(renderSummary)}",
"});",
"ce213SheetObserver.observe(sheetWrap,{attributes:true,attributeFilter:['class']});",
"async function loadSnapshot(showStatus=true){",
" try{",
"  const r=await fetch('/api/snapshot',{cache:'no-store'});if(!r.ok)throw new Error('snapshot');",
"  const j=await r.json();",
"  const stamp=j.updatedAt?String(j.updatedAt)+'|'+String(j.total||0):null;",
"  const changed=!stamp||ce213Stamp!==stamp;",
"  if(changed){state=j.results||{};persist();ce213Stamp=stamp;}",
"  liveConnected=true;",
"  if(showStatus)setSyncStatus('live','Central ao vivo · '+String(j.total||0)+' resultados');",
"  if(!changed)return true;",
"  if(sheetWrap.classList.contains('open')){ce213Deferred=true;return true;}",
"  ce213Deferred=false;renderSummary();return true;",
" }catch(e){liveConnected=false;if(showStatus)setSyncStatus('offline','Modo local · servidor indisponível');return false}",
"}"
].join('\n');
h=h.replace(old[0],loader);
if(!h.includes('function renderSummary(){'))throw new Error('CE213 summary missing');
h=h.replace('function renderSummary(){','function renderSummary(){ce213Deferred=false;');

/* Camera work reduction: all distinct QRBU/QRCE are passed through unchanged. */
const cameraOld="await qrScanner.start({facingMode:'environment'},{fps:10,qrbox:{width:250,height:250},aspectRatio:1},txt=>captureQrPart(txt),()=>{});";
const cameraNew="ce213LastQrValue='';ce213LastQrTime=0;await qrScanner.start({facingMode:'environment'},{fps:6,qrbox:{width:250,height:250},aspectRatio:1},txt=>ce213CaptureVideoQr(txt),()=>{});";
if(!h.includes(cameraOld)||!h.includes('async function startQrScanner(){'))throw new Error('CE213 camera anchor missing');
h=h.replace('async function startQrScanner(){',[
"/* CE213_FRAME_DEDUP: ignore repeated frames, not new QR parts. */",
"let ce213LastQrValue='',ce213LastQrTime=0;",
"function ce213CaptureVideoQr(txt){",
" const now=Date.now();if(txt===ce213LastQrValue&&now-ce213LastQrTime<850)return;",
" ce213LastQrValue=txt;ce213LastQrTime=now;",
" Promise.resolve(captureQrPart(txt)).catch(e=>console.warn('Leitura QR:',e));",
"}",
"async function startQrScanner(){"
].join('\n'));
h=h.replace(cameraOld,cameraNew);

/* 140 ms debounce only when the native candidate search uses oninput. */
let search='unchanged';
const input=/candidateSearch\.oninput\s*=\s*\(\)\s*=>\s*renderCandidates\(true\);/;
if(input.test(h)){
 h=h.replace(input,"candidateSearch.oninput=()=>{clearTimeout(ce213CandidateTimer);ce213CandidateTimer=setTimeout(()=>renderCandidates(true),140);};");
 h=h.replace('function renderCandidates(reset=false){','let ce213CandidateTimer=null;\nfunction renderCandidates(reset=false){');
 search='debounced';
}

/* The visual normalizer is allowed to watch nav/action controls, not every QR status. */
const qaFile=pub+'/v186-visual-qa.js';let qa=read(qaFile);
const observe="new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});";
if(!qa.includes(observe))throw new Error('CE213 visual observer changed');
qa=qa.replace(observe,[
"/* CE213_SCOPED_ICON_OBSERVER */",
"if(location.pathname==='/operacao.html'){",
" const roots=[...document.querySelectorAll('.footer-nav,.bottom-nav,.public-bottom-nav,.quick-actions,.coord-actions')];",
" const mo=new MutationObserver(schedule);",
" roots.forEach(root=>mo.observe(root,{childList:true,subtree:true}));",
"}else new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});"
].join('\n'));
new Function(qa);write(qaFile,qa);

/* V157 independently observes every text and DOM change; remove it on operation. */
const v157File=pub+'/v157-polish.js';let v157=read(v157File);
const a=v157.indexOf('function start(){'),b=v157.indexOf("if(document.readyState==='loading')",a);
if(a<0||b<0||!v157.slice(a,b).includes('new MutationObserver(run).observe(document.body'))
 throw new Error('CE213 candidate observer changed');
v157=v157.slice(0,a)+[
"/* CE213_SCOPED_CANDIDATE_OBSERVER */",
"function start(){",
" loadCatalog();run();setTimeout(run,250);setTimeout(run,900);",
" if(OP){",
"  document.addEventListener('click',e=>{if(e.target.closest?.('[data-ce161-cargo]'))setTimeout(run,80)},true);",
" }else{",
"  const leaders=document.getElementById('leaders');",
"  if(leaders)new MutationObserver(run).observe(leaders,{subtree:true,childList:true});",
"  document.addEventListener('click',e=>{if(e.target.closest?.('#cargoTabs,[data-cargo]'))setTimeout(run,80)},true);",
" }",
" window.addEventListener('pageshow',()=>{loadCatalog();run()});",
"}",
""
].join('\n')+v157.slice(b);
new Function(v157);write(v157File,v157);

write(opFile,h);
const css="/* V2.0.13: reduce offscreen paint on low-powered phones. */\n@media(max-width:850px){body .candidate-card{content-visibility:auto;contain-intrinsic-size:auto 85px}body #ce161OperatorCandidates{content-visibility:auto;contain-intrinsic-size:auto 480px}}\n#sheetWrap.open .sheet{scroll-behavior:auto;overscroll-behavior:contain}\n";
write(pub+'/v213-operator-speed.css',css);
h=read(opFile).replace('</head>','<link rel="stylesheet" href="/v213-operator-speed.css?v=213">\n</head>');write(opFile,h);
let sw=read(pub+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.0.13-unified';");
if(!sw.includes("'/v213-operator-speed.css'"))sw=sw.replace("const CORE=[","const CORE=['/v213-operator-speed.css',");
write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.13';write(pkg,JSON.stringify(j,null,2)+'\n')}

for(const needle of ['BUParser.verifyHashChain(qrSession.parts)','ce184VerifyCertificate()','saveResult()','queueOffline(payload)']){
 if(original.split(needle).length!==h.split(needle).length)throw new Error('CE213 QR/write invariant changed: '+needle);
}
for(const needle of ['CE213_FORM_SAFE_REFRESH','CE213_FRAME_DEDUP','fps:6','/v213-operator-speed.css']){
 if(!h.includes(needle))throw new Error('CE213 missing: '+needle);
}
console.log('V2.0.13 regression passed: form protected, QR 6fps, distinct frame dedup, scoped observers, candidate input '+search+', BU verification intact.');
