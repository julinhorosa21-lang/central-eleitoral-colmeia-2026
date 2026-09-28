(()=>{'use strict';
/* V1.9.4 — fast path compartilhado
   Coalescing curto de GETs idempotentes para impedir que módulos diferentes
   façam a mesma leitura ao mesmo tempo. */
if(window.__CE194_FASTPATH__)return;
window.__CE194_FASTPATH__=true;

const nativeFetch=window.fetch.bind(window);
const pending=new Map();
const cache=new Map();

function cfg(url){
  if(url.pathname==='/api/snapshot')return{ttl:350};
  if(url.pathname==='/api/candidates')return{ttl:15000};
  if(url.pathname==='/data/locais-colmeia.json')return{ttl:10*60*1000,forceCache:true};
  if(url.pathname==='/data/candidate-catalog.json')return{ttl:5*60*1000,forceCache:true};
  return null;
}
function requestMeta(input,init={}){
  try{
    const req=input instanceof Request?input:null;
    const url=new URL(req?req.url:input,location.href);
    const method=String(init.method||(req?req.method:'GET')).toUpperCase();
    return{req,url,method};
  }catch{return null}
}
function cacheKey(meta){
  return meta.method+' '+meta.url.pathname+meta.url.search;
}
function fresh(key,ttl){
  const x=cache.get(key);
  return x&&Date.now()-x.at<ttl&&x.response;
}
function prune(){
  const now=Date.now();
  for(const [k,v] of cache)if(now-v.at>10*60*1000)cache.delete(k);
}
setInterval(prune,60000);

window.fetch=function(input,init={}){
  const meta=requestMeta(input,init);
  if(!meta||meta.url.origin!==location.origin||meta.method!=='GET')return nativeFetch(input,init);
  const opt=cfg(meta.url);
  if(!opt)return nativeFetch(input,init);

  const key=cacheKey(meta);
  const hit=fresh(key,opt.ttl);
  if(hit)return Promise.resolve(hit.clone());

  const inflight=pending.get(key);
  if(inflight)return inflight.then(r=>r.clone());

  let nextInit=init;
  if(opt.forceCache){
    nextInit={...init,cache:'force-cache'};
  }
  const task=nativeFetch(input,nextInit).then(r=>{
    if(r.ok){
      try{cache.set(key,{at:Date.now(),response:r.clone()})}catch{}
    }
    return r;
  }).finally(()=>pending.delete(key));

  pending.set(key,task);
  return task.then(r=>r.clone());
};

window.__ce194Invalidate=(path)=>{
  for(const key of [...cache.keys()])if(key.includes(' '+path))cache.delete(key);
};
})();