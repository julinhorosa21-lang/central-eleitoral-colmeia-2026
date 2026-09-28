(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;

function removeLegacyTestBanner(){
  document.querySelectorAll('#ce187TestNotice,.ce187-test-notice').forEach(el=>el.remove());
}

function start(){
  removeLegacyTestBanner();
  [50,150,400,900,1800,3200].forEach(ms=>setTimeout(removeLegacyTestBanner,ms));
  const root=document.body;
  if(root){
    let scheduled=false;
    const obs=new MutationObserver(mutations=>{
      let relevant=false;
      for(const m of mutations){
        for(const n of m.addedNodes){
          if(n.nodeType!==1)continue;
          if(n.id==='ce187TestNotice'||n.classList?.contains('ce187-test-notice')||n.querySelector?.('#ce187TestNotice,.ce187-test-notice')){
            relevant=true;break;
          }
        }
        if(relevant)break;
      }
      if(relevant&&!scheduled){
        scheduled=true;
        queueMicrotask(()=>{scheduled=false;removeLegacyTestBanner()});
      }
    });
    obs.observe(root,{childList:true,subtree:true});
  }
  window.addEventListener('pageshow',removeLegacyTestBanner);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();