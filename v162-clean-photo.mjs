import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const css=`
/* V1.6.3 — fotos limpas e cards neutros */
.ce161-photo-num .public-number-badge,
.ce161-op-photo > span{
  display:none!important;
}
#leaders .leader .who small .ce162-number-text{
  display:inline-flex!important;
  align-items:center;
  margin-left:6px;
  padding-left:7px;
  border-left:1px solid #d6e1e7;
  color:#496475!important;
  font-size:.92em;
  font-weight:850!important;
  white-space:nowrap;
}
.ce161-photo-num img,
.ce161-op-photo img{
  width:100%;
  height:100%;
  object-fit:cover;
}
/* Todos os candidatos recebem o mesmo contorno neutro.
   A única cor individual permanece na lateral/barra do partido. */
body.ce-regional-public #leaders .leader,
body.ce-regional-public #leaders .leader[data-rank="1"],
body.ce-regional-public #leaders .leader[data-rank="2"],
body.ce-regional-public #leaders .leader[data-rank="3"],
body.ce-regional-public #leaders .leader[data-ce161-rank="1"],
body.ce-regional-public #leaders .leader[data-ce161-rank="2"],
body.ce-regional-public #leaders .leader[data-ce161-rank="3"]{
  border-top:1px solid #D9E5EB!important;
  border-right:1px solid #D9E5EB!important;
  border-bottom:1px solid #D9E5EB!important;
  border-left:5px solid var(--party,#2450B2)!important;
  box-shadow:0 3px 10px rgba(22,65,93,.045)!important;
  outline:none!important;
}
@media(max-width:620px){
  #leaders .leader .who small .ce162-number-text{
    margin-left:5px;
    padding-left:6px;
  }
}
`;

const js=`(()=>{
  'use strict';
  const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
  let queued=false;
  function digits(v){const m=String(v||'').match(/\\d{1,5}/);return m?m[0]:'';}
  function cleanPublic(){
    if(!PUBLIC.has(location.pathname))return;
    document.querySelectorAll('#leaders .leader').forEach(row=>{
      const small=row.querySelector('.who small');
      if(!small)return;
      const overlay=row.querySelector('.ce161-photo-num .public-number-badge,.public-photo-num .public-number-badge');
      let num=digits(row.dataset.ce161Number||'');
      if(!num&&overlay)num=digits(overlay.textContent);
      if(!num){
        const box=row.querySelector('.num:not(.public-photo-num)');
        if(box)num=digits(box.textContent);
      }
      if(!num)return;
      let tag=small.querySelector('.ce162-number-text');
      if(!tag){tag=document.createElement('span');tag.className='ce162-number-text';small.appendChild(tag);}
      tag.textContent='Nº '+num;
    });
  }
  function apply(){document.documentElement.dataset.ceUi='163';cleanPublic();}
  function run(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  function start(){run();setTimeout(run,200);setTimeout(run,700);setTimeout(run,1500);new MutationObserver(run).observe(document.body,{subtree:true,childList:true,characterData:true});document.addEventListener('click',()=>setTimeout(run,60),true);window.addEventListener('pageshow',run);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;

write(`${pub}/v162-clean-photo.css`,css);
write(`${pub}/v162-clean-photo.js`,js);
for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`,`${pub}/operacao.html`]){
  let html=read(file);
  if(!html.includes('/v162-clean-photo.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v162-clean-photo.css?v=163">\n</head>');
  if(!html.includes('/v162-clean-photo.js'))html=html.replace('</body>','<script src="/v162-clean-photo.js?v=163"></script>\n</body>');
  write(file,html);
}
let sw=read(`${pub}/service-worker.js`);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.6.2-unified';");
if(!sw.includes("'/v162-clean-photo.css'"))sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v162-clean-photo.css','/v162-clean-photo.js'"+b);
write(`${pub}/service-worker.js`,sw);
console.log('V1.6.3 applied: clean photos and neutral candidate card borders.');
