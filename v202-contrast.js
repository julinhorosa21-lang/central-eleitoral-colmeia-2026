(()=>{'use strict';
const TARGETS=[
  'button','.btn','.status-pill','.count-pill','.chip','.badge',
  '.ce191-share-btn','.ce195-state','.ce176-pill','.ce201-module',
  '.ce201-appactions a','.ce200-locality','.public-bottom-nav button',
  '.bottom-nav button','.footer-nav button'
].join(',');

function parseRgb(s){
  const m=String(s||'').match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)/i);
  if(!m)return null;
  return {r:+m[1],g:+m[2],b:+m[3],a:m[4]===undefined?1:+m[4]};
}
function lin(v){v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}
function lum(c){return .2126*lin(c.r)+.7152*lin(c.g)+.0722*lin(c.b)}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const WHITE={r:255,g:255,b:255,a:1},DARK={r:37,g:49,b:60,a:1};

function opaqueBackground(el){
  let n=el;
  for(let i=0;i<5&&n&&n!==document.documentElement;i++,n=n.parentElement){
    const cs=getComputedStyle(n);
    if(cs.backgroundImage&&cs.backgroundImage!=='none'){
      if(/linear-gradient|radial-gradient/i.test(cs.backgroundImage))return {gradient:true,color:null};
    }
    const c=parseRgb(cs.backgroundColor);
    if(c&&c.a>=.92)return {gradient:false,color:c};
  }
  return null;
}
function protect(el){
  if(!(el instanceof Element)||el.closest('[hidden]'))return;
  const bg=opaqueBackground(el);if(!bg)return;
  if(bg.gradient){
    const own=getComputedStyle(el);
    const current=parseRgb(own.color);
    if(current&&contrast(current,DARK)<3.5){
      el.style.setProperty('--ce202-auto-fg','#FFFFFF');
      el.classList.add('ce202-auto-contrast');
    }
    return;
  }
  const current=parseRgb(getComputedStyle(el).color);
  if(!current)return;
  const ratio=contrast(current,bg.color);
  if(ratio>=4.5)return;
  const white=contrast(WHITE,bg.color),dark=contrast(DARK,bg.color);
  const fg=white>=dark?'#FFFFFF':'#25313C';
  if(Math.max(white,dark)>=4.5){
    el.style.setProperty('--ce202-auto-fg',fg);
    el.classList.add('ce202-auto-contrast');
  }
}
function audit(root=document){
  if(root.matches?.(TARGETS))protect(root);
  root.querySelectorAll?.(TARGETS).forEach(protect);
}
let scheduled=false;
function queueAudit(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;audit()});
}
function start(){
  document.documentElement.classList.add('ce202-contrast-guard');
  audit();
  [120,450,1200,2600].forEach(ms=>setTimeout(audit,ms));
  const mo=new MutationObserver(ms=>{
    for(const m of ms){
      if(m.type==='childList'&&m.addedNodes.length){queueAudit();break}
      if(m.type==='attributes'){queueAudit();break}
    }
  });
  mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','disabled']});
  window.addEventListener('pageshow',queueAudit);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();