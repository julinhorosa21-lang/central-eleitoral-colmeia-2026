(()=>{'use strict';
if(location.pathname!=='/operacao.html')return;

const TITLE='Ler Boletim de Urna pelo QR Code';
let panel=null,backdrop=null;

function isVisible(el){
  if(!el||!el.isConnected)return false;
  const s=getComputedStyle(el);
  if(s.display==='none'||s.visibility==='hidden')return false;
  const r=el.getBoundingClientRect();
  return r.width>100&&r.height>60;
}

function exactTitle(){
  const nodes=[...document.querySelectorAll('h1,h2,h3,h4,h5,strong,b,p,span,div')];
  const exact=nodes.filter(el=>isVisible(el)&&String(el.textContent||'').trim()===TITLE);
  if(exact.length)return exact.sort((a,b)=>a.childElementCount-b.childElementCount)[0];
  const near=nodes.filter(el=>{
    if(!isVisible(el))return false;
    const t=String(el.textContent||'').trim();
    return t.startsWith(TITLE)&&t.length<TITLE.length+80;
  });
  return near.sort((a,b)=>String(a.textContent).length-String(b.textContent).length)[0]||null;
}

function findPanel(title){
  const dialog=title.closest('[role="dialog"],dialog');
  if(dialog)return dialog;

  let n=title.parentElement;
  for(let i=0;i<7&&n&&n!==document.body;i++,n=n.parentElement){
    const c=String(n.className||'');
    if(/modal|sheet|dialog|drawer|popup/i.test(c)&&n.querySelector('input,select,textarea,button'))return n;
  }

  n=title.parentElement;
  let fallback=null;
  for(let i=0;i<6&&n&&n!==document.body;i++,n=n.parentElement){
    const r=n.getBoundingClientRect();
    if(r.width>420&&r.height>300&&n.querySelectorAll('input,select,textarea,button').length>=4)fallback=n;
  }
  return fallback;
}

function findBackdrop(p){
  let n=p?.parentElement;
  for(let i=0;i<4&&n&&n!==document.body;i++,n=n.parentElement){
    const s=getComputedStyle(n),r=n.getBoundingClientRect();
    if(/backdrop|overlay/i.test(String(n.className||'')))return n;
    if(s.position==='fixed'&&r.width>=innerWidth*.85&&r.height>=innerHeight*.75)return n;
  }
  return null;
}

function clear(){
  panel?.classList.remove('ce205-bu-panel');
  backdrop?.classList.remove('ce205-bu-backdrop');
  panel=null;backdrop=null;
  document.documentElement.classList.remove('ce205-bu-open');
}

function sync(){
  const title=exactTitle();
  if(!title){clear();return}
  const p=findPanel(title);
  if(!p||!isVisible(p)){clear();return}

  if(panel&&panel!==p)panel.classList.remove('ce205-bu-panel');
  panel=p;
  const b=findBackdrop(p);
  if(backdrop&&backdrop!==b)backdrop.classList.remove('ce205-bu-backdrop');
  backdrop=b;

  panel.classList.add('ce205-bu-panel');
  if(backdrop)backdrop.classList.add('ce205-bu-backdrop');
  document.documentElement.classList.add('ce205-bu-open');
}

function afterPossibleOpen(){
  [0,50,120,250,500,900].forEach(ms=>setTimeout(sync,ms));
}

function start(){
  /* Só observa criação/remoção de nós. Não observa class/style, evitando loop. */
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});

  document.addEventListener('click',e=>{
    const b=e.target.closest('button,.btn,a,[role="button"]');
    if(!b)return;
    const t=String(b.textContent||'').trim();
    if(/registrar\s*bu|registro\s*de\s*bu|boletim\s*de\s*urna/i.test(t))afterPossibleOpen();
    if(/fechar|cancelar|voltar/i.test(t))setTimeout(sync,50);
  });

  window.addEventListener('pageshow',sync);
  window.addEventListener('resize',sync,{passive:true});
  sync();
}

document.readyState==='loading'
  ?document.addEventListener('DOMContentLoaded',start,{once:true})
  :start();
})();