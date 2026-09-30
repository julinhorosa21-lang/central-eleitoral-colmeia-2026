(()=>{'use strict';
if(location.pathname!=='/operacao.html')return;

const DIALOG_SEL=[
  '.modal-card',
  '.unified-sheet',
  '.ce174-sheet',
  '.ce179-modal',
  '.ce193-dialog',
  '[role="dialog"]'
].join(',');

function visibleDialog(){
  return [...document.querySelectorAll(DIALOG_SEL)].find(el=>{
    if(!el.isConnected)return false;
    const cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden')return false;
    const r=el.getBoundingClientRect();
    return r.width>0&&r.height>0;
  });
}

function sync(){
  const d=visibleDialog();
  document.documentElement.classList.toggle('ce203-modal-open',!!d);
  if(!d)return;
  d.setAttribute('tabindex',d.getAttribute('tabindex')||'-1');
  d.style.setProperty('overflow-y','auto','important');
  d.style.setProperty('overscroll-behavior','contain','important');
  d.style.setProperty('touch-action','pan-y','important');
}

function wheelFix(e){
  const d=e.target.closest?.(DIALOG_SEL);
  if(!d)return;
  const canScroll=d.scrollHeight>d.clientHeight+1;
  if(!canScroll)return;
  const atTop=d.scrollTop<=0;
  const atBottom=Math.ceil(d.scrollTop+d.clientHeight)>=d.scrollHeight;
  if((e.deltaY<0&&atTop)||(e.deltaY>0&&atBottom))return;
  e.stopPropagation();
}

function keyFix(e){
  const d=visibleDialog();if(!d)return;
  if(!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key))return;
  if(e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
  const step=e.key==='PageDown'?d.clientHeight*.8:
             e.key==='PageUp'?-d.clientHeight*.8:
             e.key==='ArrowDown'?50:
             e.key==='ArrowUp'?-50:
             e.key==='Home'?-d.scrollHeight:d.scrollHeight;
  d.scrollBy({top:step,behavior:'auto'});e.preventDefault();
}

function start(){
  sync();
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style']});
  document.addEventListener('wheel',wheelFix,{capture:true,passive:true});
  document.addEventListener('keydown',keyFix,true);
  window.addEventListener('resize',sync,{passive:true});
  window.addEventListener('pageshow',sync);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();