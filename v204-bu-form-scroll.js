(()=>{'use strict';
if(location.pathname!=='/operacao.html')return;

const TITLE='Ler Boletim de Urna pelo QR Code';
let currentPanel=null,currentBackdrop=null;

function visible(el){
  if(!el||!el.isConnected)return false;
  const cs=getComputedStyle(el);
  if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return false;
  const r=el.getBoundingClientRect();
  return r.width>80&&r.height>40;
}

function findTitleNode(){
  const all=[...document.querySelectorAll('h1,h2,h3,h4,strong,b,div,span,p')];
  return all.find(el=>visible(el)&&String(el.textContent||'').trim().includes(TITLE))||null;
}

function scoreAncestor(el){
  if(!el||el===document.body||el===document.documentElement)return -999;
  const cs=getComputedStyle(el),r=el.getBoundingClientRect();
  let s=0;
  if(el.matches('[role="dialog"],dialog'))s+=100;
  if(/modal|sheet|dialog|popup|drawer/i.test(el.className||''))s+=70;
  if(cs.position==='fixed')s+=60;
  if(Number(cs.zIndex)>100)s+=25;
  if(r.width>420&&r.height>300)s+=20;
  if(el.querySelector('input,textarea,select,button'))s+=20;
  if(String(el.textContent||'').includes('Votos por candidato'))s+=30;
  if(String(el.textContent||'').includes('Comparecimento'))s+=20;
  if(String(el.textContent||'').includes('Fonte'))s+=10;
  return s;
}

function locatePanel(title){
  let best=null,bestScore=-Infinity,n=title;
  for(let i=0;i<8&&n&&n!==document.body;i++,n=n.parentElement){
    const s=scoreAncestor(n);
    if(s>bestScore){best=n;bestScore=s}
  }
  return best;
}

function locateBackdrop(panel){
  let n=panel?.parentElement,best=null;
  for(let i=0;i<5&&n&&n!==document.body;i++,n=n.parentElement){
    const cs=getComputedStyle(n),r=n.getBoundingClientRect();
    if(cs.position==='fixed'&&r.width>=innerWidth*.85&&r.height>=innerHeight*.75){best=n;break}
    if(/backdrop|overlay|modal/i.test(n.className||'')){best=n;break}
  }
  return best;
}

function cleanup(){
  currentPanel?.classList.remove('ce204-bu-panel');
  currentBackdrop?.classList.remove('ce204-bu-backdrop');
  currentPanel=null;currentBackdrop=null;
  document.documentElement.classList.remove('ce204-bu-form-open');
}

function apply(){
  const title=findTitleNode();
  if(!title){cleanup();return}
  const panel=locatePanel(title);
  if(!panel||!visible(panel)){cleanup();return}
  const backdrop=locateBackdrop(panel);

  if(currentPanel&&currentPanel!==panel)currentPanel.classList.remove('ce204-bu-panel');
  if(currentBackdrop&&currentBackdrop!==backdrop)currentBackdrop.classList.remove('ce204-bu-backdrop');

  currentPanel=panel;currentBackdrop=backdrop;
  panel.classList.add('ce204-bu-panel');
  if(backdrop)backdrop.classList.add('ce204-bu-backdrop');
  document.documentElement.classList.add('ce204-bu-form-open');

  panel.style.setProperty('overflow-y','auto','important');
  panel.style.setProperty('max-height','calc(100dvh - 24px)','important');
  panel.style.setProperty('touch-action','pan-y','important');
}

function wheel(e){
  if(!currentPanel||!currentPanel.contains(e.target))return;
  if(currentPanel.scrollHeight<=currentPanel.clientHeight+1)return;
  e.stopPropagation();
}

function touchStart(e){
  if(!currentPanel||!currentPanel.contains(e.target))return;
  currentPanel.dataset.ce204TouchY=String(e.touches?.[0]?.clientY||0);
}
function touchMove(e){
  if(!currentPanel||!currentPanel.contains(e.target))return;
  const y=Number(currentPanel.dataset.ce204TouchY||0);
  const now=e.touches?.[0]?.clientY||0;
  if(y)currentPanel.scrollTop+=y-now;
  currentPanel.dataset.ce204TouchY=String(now);
}

function start(){
  apply();
  const mo=new MutationObserver(()=>queueMicrotask(apply));
  mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
  document.addEventListener('wheel',wheel,{capture:true,passive:true});
  document.addEventListener('touchstart',touchStart,{capture:true,passive:true});
  document.addEventListener('touchmove',touchMove,{capture:true,passive:true});
  window.addEventListener('resize',apply,{passive:true});
  window.addEventListener('pageshow',apply);
  [150,500,1200,2500].forEach(ms=>setTimeout(apply,ms));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();