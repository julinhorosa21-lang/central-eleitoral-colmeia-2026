import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const css=`
/* V1.5.8 — cabeçalho regional limpo + correção definitiva da faixa vazia */
:root{--ce158-green:#009B3A;--ce158-yellow:#FFDF00;--ce158-blue:#002776;--ce158-to:#2450B2;--ce158-col:#9FD0F0}

/* Remove os grandes polígonos da V1.5.7 e mantém a referência cívica por cor, não por ornamento. */
.hero,.top{
  position:relative!important;
  isolation:isolate!important;
  overflow:hidden!important;
  border-top:4px solid var(--ce158-yellow)!important;
  background:linear-gradient(118deg,#008D3D 0%,#009B3A 22%,#137B68 44%,#2450B2 72%,#002776 100%)!important;
  box-shadow:0 10px 26px rgba(0,39,118,.13)!important;
}
.hero:before,.top:before{display:none!important;content:none!important}
.hero:after,.top:after{
  content:''!important;display:block!important;position:absolute!important;z-index:0!important;
  left:0!important;right:0!important;bottom:0!important;top:auto!important;
  width:auto!important;height:4px!important;border:0!important;border-radius:0!important;transform:none!important;
  background:linear-gradient(90deg,var(--ce158-green) 0 34%,var(--ce158-yellow) 34% 50%,var(--ce158-col) 50% 66%,var(--ce158-blue) 66% 100%)!important;
  pointer-events:none!important;
}
.hero>*,.top>*{position:relative!important;z-index:1!important}

/* Navegação inferior: sem bloco azul ocupando toda a aba ativa. */
.footer-nav button.active,.bottom-nav button.active,.public-bottom-nav button.active,
.footer-nav .active,.bottom-nav .active{
  position:relative!important;
  background:transparent!important;
  color:#164F78!important;
  border-radius:0!important;
  box-shadow:none!important;
}
.footer-nav button.active:before,.bottom-nav button.active:before,.public-bottom-nav button.active:before,
.footer-nav .active:before,.bottom-nav .active:before{
  content:''!important;position:absolute!important;
  left:31%!important;right:31%!important;top:0!important;height:3px!important;
  border-radius:0 0 99px 99px!important;
  background:linear-gradient(90deg,var(--ce158-green),var(--ce158-yellow),var(--ce158-blue))!important;
}
.footer-nav button.active svg,.bottom-nav button.active svg,.public-bottom-nav button.active svg{filter:none!important}

/* Artefatos vazios identificados pelo runtime. */
.ce158-empty-artifact{display:none!important;min-height:0!important;height:0!important;margin:0!important;padding:0!important;border:0!important}

@media(max-width:620px){
  .hero,.top{border-radius:15px!important}
}
`;

const js=`(()=>{'use strict';
function emptyEnough(el){
  if(!el)return false;
  const text=String(el.textContent||'').replace(/\\s+/g,'').trim();
  if(text)return false;
  if(el.querySelector('input,select,textarea,button,a[href],img,svg,canvas,video,iframe'))return false;
  return true;
}
function visibleBox(el){
  if(!el||!el.getBoundingClientRect)return false;
  const r=el.getBoundingClientRect();
  const cs=getComputedStyle(el);
  return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>120&&r.height>8;
}
function isTseBlock(el){
  return /TSE\\s*oficial|aguardando\\s*EA11|conector\\s*pronto/i.test(String(el?.textContent||''));
}
function cleanBetweenMetricsAndTse(){
  const metrics=document.querySelector('.metrics');
  if(!metrics)return;
  let el=metrics.nextElementSibling;
  let steps=0;
  while(el&&steps<8){
    if(isTseBlock(el))break;
    if(emptyEnough(el)&&visibleBox(el))el.classList.add('ce158-empty-artifact');
    // Alguns shells envolvem a faixa vazia em um contêiner não vazio por comentários/whitespace.
    for(const child of [...el.children]){
      if(emptyEnough(child)&&visibleBox(child))child.classList.add('ce158-empty-artifact');
    }
    el=el.nextElementSibling;steps++;
  }
}
function cleanSuspiciousEmptyBands(){
  const metrics=document.querySelector('.metrics');
  if(!metrics)return;
  const mr=metrics.getBoundingClientRect();
  const candidates=[...document.querySelectorAll('main > *, .wrap > *, body > *')];
  for(const el of candidates){
    if(!emptyEnough(el)||!visibleBox(el))continue;
    const r=el.getBoundingClientRect();
    // Só remove faixas largas e rasas logo abaixo dos indicadores — exatamente o artefato visto no celular.
    if(r.top>=mr.bottom-2 && r.top<=mr.bottom+180 && r.width>=mr.width*.72 && r.height<=90){
      el.classList.add('ce158-empty-artifact');
    }
  }
}
function tag(){document.documentElement.dataset.ceUi='158'}
function apply(){tag();cleanBetweenMetricsAndTse();cleanSuspiciousEmptyBands()}
function start(){apply();setTimeout(apply,180);setTimeout(apply,650);setTimeout(apply,1500);const mo=new MutationObserver(()=>requestAnimationFrame(apply));mo.observe(document.body,{childList:true,subtree:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;

write(`${pub}/v158-polish.css`,css);
write(`${pub}/v158-polish.js`,js);

for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`,`${pub}/operacao.html`]){
  let html=read(file);
  if(!html.includes('/v158-polish.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v158-polish.css?v=158">\n</head>');
  if(!html.includes('/v158-polish.js'))html=html.replace('</body>','<script src="/v158-polish.js?v=158"></script>\n</body>');
  write(file,html);
}

let sw=read(`${pub}/service-worker.js`);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.5.8-unified';");
if(!sw.includes("'/v158-polish.css'")){
  sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v158-polish.css','/v158-polish.js'"+b);
}
write(`${pub}/service-worker.js`,sw);

console.log('V1.5.8 applied: clean regional header, minimal active nav and robust empty-band cleanup.');
