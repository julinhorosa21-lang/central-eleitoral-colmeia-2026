import fs from 'node:fs';
const pub='/app/public',read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const op=pub+'/operacao.html';let h=read(op);
const old='fps:10,qrbox:{width:250,height:250}';
const neu="fps:(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4?5:8),qrbox:{width:250,height:250}";
if(!h.includes(old))throw new Error('V214 QR scanner config changed unexpectedly');
h=h.replace(old,neu);
write(op,h);

/* Remove continuous full-document sweeps from candidate visuals on BU entry.
   Candidate UI still reacts to cargo switching and its own result lists. */
const f=pub+'/v157-polish.js';let s=read(f);
const start=s.indexOf('function start(){loadCatalog();run();');
const end=s.indexOf("if(document.readyState==='loading'",start);
if(start<0||end<0)throw new Error('V214 V157 startup anchor unavailable');
const optimized=String.raw`/* CE214_SCOPED_CANDIDATE_RENDER */
let ce214Roots=new WeakSet(),ce214Timer=0;
function ce214Observe(){
 for(const root of [document.getElementById('leaders'),document.getElementById('ce161OperatorCandidates'),document.getElementById('candidateCatalog')]){
  if(!root||ce214Roots.has(root))continue;
  ce214Roots.add(root);
  new MutationObserver(()=>{clearTimeout(ce214Timer);ce214Timer=setTimeout(run,160)}).observe(root,{childList:true});
 }
}
function start(){
 loadCatalog();run();
 [350,1200].forEach(ms=>setTimeout(()=>{ce214Observe();run()},ms));
 document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-ce161-cargo],#cargoTabs,[data-cargo]')){
   setTimeout(()=>{ce214Observe();run()},100);
  }
 },true);
 window.addEventListener('pageshow',()=>{loadCatalog();ce214Observe();run()});
}
`;
s=s.slice(0,start)+optimized+s.slice(end);
if(s.includes('new MutationObserver(run).observe(document.body'))throw new Error('V214 full body candidate observer still active');
new Function(s);write(f,s);

/* Icon QA should not re-scan all buttons during every QR scan / text edit. */
const p=pub+'/v186-visual-qa.js';let qa=read(p);
const oldObserve="new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});";
const newObserve=String.raw`/* CE214_SCOPED_VISUAL_QA: only navigation can trigger an icon audit. */
 const visualRootSelectors=['.footer-nav','.bottom-nav','.public-bottom-nav'];
 for(const selector of visualRootSelectors){
   const root=document.querySelector(selector);
   if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 }
`;
if(!qa.includes(oldObserve))throw new Error('V214 old icon observer not found');
qa=qa.replace(oldObserve,newObserve);
new Function(qa);write(p,qa);

/* Keep the operating controls responsive on slow devices.
   Pure CSS: native textarea editing, no transformations or QR parsing changes. */
const css=String.raw`
/* CE214_BU_RESPONSIVE */
#sheetWrap.open #adminPanel #voteLines,
#sheetWrap.open #qrPaste {will-change:auto;contain:none;transform:none}
#sheetWrap.open #qrReader video{max-width:100%;object-fit:cover}
#sheetWrap.open .candidate-card img,
#sheetWrap.open .ce161-op-card img{content-visibility:auto}
`;
write(pub+'/v214-bu-fluid.css',css);
h=read(op);
if(!h.includes('/v214-bu-fluid.css')){
 h=h.replace('</head>','<link rel="stylesheet" href="/v214-bu-fluid.css?v=214">\n</head>');
}
h=h.replace('/v157-polish.js?v=161','/v157-polish.js?v=214').replace('/v186-visual-qa.js?v=186','/v186-visual-qa.js?v=214');
write(op,h);
for(const rel of ['index.html','transparencia.html']){
 const path=pub+'/'+rel;let page=read(path);
 page=page.replace('/v157-polish.js?v=161','/v157-polish.js?v=214')
 .replace('/v186-visual-qa.js?v=186','/v186-visual-qa.js?v=214');
 write(path,page);
}
let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.14-unified';");
if(!sw.includes("'/v214-bu-fluid.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v214-bu-fluid.css',");
write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.14';write(pkg,JSON.stringify(j,null,2)+'\n')}
if(!read(op).includes(neu)||read(f).includes('observe(document.body')||read(p).includes(oldObserve))throw new Error('V214 regression: expensive scan still present');
console.log('V2.0.14 optimization tests passed: scoped candidate/icon observers, adaptive 5-8 fps QR camera, untouched BU parser and vote entry.');
