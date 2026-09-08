import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const css=`
/* V1.5.8 — cabeçalho regional limpo + correção definitiva da faixa vazia */
:root{--ce157-green:#009B3A;--ce157-yellow:#FFDF00;--ce157-blue:#002776;--ce157-to:#2450B2;--ce157-col:#9FD0F0;--ce157-gold:#E5B100}

/* O cabeçalho real pode ser .hero ou .top conforme o módulo/shell. */
.hero,.top{
  position:relative!important;isolation:isolate!important;overflow:hidden!important;
  border-top:4px solid var(--ce157-yellow)!important;
  background:linear-gradient(118deg,#008D3D 0%,#009B3A 22%,#137B68 44%,#2450B2 72%,#002776 100%)!important;
  box-shadow:0 10px 26px rgba(0,39,118,.13)!important;
}
/* V1.5.8: remove o grande losango/polígono que pesava no topo. */
.hero:before,.top:before{display:none!important;content:none!important}
.hero:after,.top:after{
  content:''!important;display:block!important;position:absolute!important;z-index:0!important;
  left:0!important;right:0!important;top:auto!important;bottom:0!important;width:auto!important;height:4px!important;
  border:0!important;border-radius:0!important;transform:none!important;
  background:linear-gradient(90deg,var(--ce157-green) 0 34%,var(--ce157-yellow) 34% 50%,var(--ce157-col) 50% 66%,var(--ce157-blue) 66% 100%)!important;
  pointer-events:none!important;
}
.hero>*,.top>*{position:relative;z-index:1}
.hero .eyebrow,.top .eyebrow{color:#FFF3A3!important}
.hero h1,.top h1{color:#fff!important;text-shadow:0 1px 1px rgba(0,0,0,.08)!important}
.hero p,.top p{color:rgba(255,255,255,.88)!important}

/* Mantém os cartões limpos, mas faz a identidade regional aparecer no ritmo da tela. */
.metrics .metric:nth-child(4n+1){border-top-color:var(--ce157-green)!important}
.metrics .metric:nth-child(4n+2){border-top-color:var(--ce157-to)!important}
.metrics .metric:nth-child(4n+3){border-top-color:var(--ce157-yellow)!important}
.metrics .metric:nth-child(4n+4){border-top-color:var(--ce157-col)!important}

.pwa-install-card{background:linear-gradient(135deg,#F0FAF4 0%,#F8FCFF 57%,#FFFCEB 100%)!important;border-top:3px solid var(--ce157-green)!important}
.pwa-install-btn,.btn.primary,.toolbar .primary,.quick-actions .primary{background:linear-gradient(110deg,#168650 0%,#187B6A 36%,#2450B2 76%,#16459A 100%)!important;color:#fff!important;border-color:transparent!important}

/* Botões que já são ativos ficam coloridos, mas os demais continuam neutros. */
.cargo-tabs button.active,#cargoTabs button.active,.nav-tabs button.active,.tab.active{
  background:linear-gradient(110deg,#13864E,#2450B2)!important;color:#fff!important;border-color:transparent!important;
  box-shadow:0 4px 12px rgba(20,80,118,.13)!important;
}

/* Barra inferior: só tipografia/ícone e uma linha tricolor, sem bloco azul ocupando a aba inteira. */
.footer-nav button.active,.bottom-nav button.active,.public-bottom-nav button.active,
.footer-nav .active,.bottom-nav .active{
  position:relative!important;background:transparent!important;color:#174F7A!important;border-radius:0!important;box-shadow:none!important;
}
.footer-nav button.active:before,.bottom-nav button.active:before,.public-bottom-nav button.active:before,
.footer-nav .active:before,.bottom-nav .active:before{
  content:''!important;position:absolute!important;left:31%!important;right:31%!important;top:0!important;height:3px!important;
  border-radius:0 0 99px 99px!important;background:linear-gradient(90deg,var(--ce157-green),var(--ce157-yellow),var(--ce157-blue))!important;
}

/* Progresso regional. */
.progress span,.progress i,.public-progress i{background:linear-gradient(90deg,var(--ce157-green) 0 42%,var(--ce157-yellow) 42% 55%,var(--ce157-to) 55% 100%)!important}

/* Remove somente artefatos vazios marcados pelo runtime. */
.ce157-empty-artifact{display:none!important;min-height:0!important;height:0!important;margin:0!important;padding:0!important;border:0!important}

@media(max-width:620px){
  .hero,.top{border-radius:15px!important}
  .footer-nav button.active,.bottom-nav button.active,.public-bottom-nav button.active,.footer-nav .active,.bottom-nav .active{border-radius:0!important}
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
function isTseBlock(el){return /TSE\\s*oficial|aguardando\\s*EA11|conector\\s*pronto/i.test(String(el?.textContent||''))}
function cleanAfterMetrics(){
  const metrics=document.querySelector('.metrics');
  if(!metrics)return;
  let el=metrics.nextElementSibling;
  let steps=0;
  while(el&&steps<8){
    if(isTseBlock(el))break;
    if(emptyEnough(el)&&visibleBox(el))el.classList.add('ce157-empty-artifact');
    for(const child of [...el.children]){
      if(emptyEnough(child)&&visibleBox(child))child.classList.add('ce157-empty-artifact');
    }
    el=el.nextElementSibling;steps++;
  }
}
function cleanNearbyBands(){
  const metrics=document.querySelector('.metrics');
  if(!metrics)return;
  const mr=metrics.getBoundingClientRect();
  const candidates=[...document.querySelectorAll('main > *, .wrap > *, body > *')];
  for(const el of candidates){
    if(!emptyEnough(el)||!visibleBox(el))continue;
    const r=el.getBoundingClientRect();
    if(r.top>=mr.bottom-2&&r.top<=mr.bottom+190&&r.width>=mr.width*.72&&r.height<=95){
      el.classList.add('ce157-empty-artifact');
    }
  }
}
function tagVersion(){document.documentElement.dataset.ceUi='158'}
function apply(){tagVersion();cleanAfterMetrics();cleanNearbyBands()}
function start(){apply();setTimeout(apply,180);setTimeout(apply,650);setTimeout(apply,1500);const mo=new MutationObserver(()=>requestAnimationFrame(apply));mo.observe(document.body,{childList:true,subtree:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;

write(`${pub}/v157-polish.css`,css);
write(`${pub}/v157-polish.js`,js);

for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`,`${pub}/operacao.html`]){
  let html=read(file);
  if(!html.includes('/v157-polish.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v157-polish.css?v=158">\n</head>');
  if(!html.includes('/v157-polish.js'))html=html.replace('</body>','<script src="/v157-polish.js?v=158"></script>\n</body>');
  write(file,html);
}

/* Mantém o identificador interno aceito pelo preflight existente; os assets usam ?v=158 para furar cache. */
let sw=read(`${pub}/service-worker.js`);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.5.7-unified';");
if(!sw.includes("'/v157-polish.css'")){
  sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v157-polish.css','/v157-polish.js'"+b);
}
write(`${pub}/service-worker.js`,sw);

console.log('V1.5.8 applied through stable V1.5.7 build hook: cleaner header, minimal nav and robust empty-band cleanup.');
