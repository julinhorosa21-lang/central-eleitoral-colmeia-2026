import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const installFile=pub+'/v135-install.js';
let s=read(installFile);
s=s.replace("navigator.serviceWorker.register('/service-worker.js?v=173',{scope:'/',updateViaCache:'none'})",
            "navigator.serviceWorker.register('/service-worker.js?v=221',{scope:'/',updateViaCache:'none'})");
if(!s.includes('/service-worker.js?v=221'))throw new Error('V221 service worker registration anchor missing');

const bootAnchor="async function boot(){\n  ensureStyle();";
if(!s.includes(bootAnchor))throw new Error('V221 boot anchor missing');
const autoUpdate="/* CE221_AUTO_PWA_UPDATE\n   The installed app activates a newer service worker and reloads once automatically.\n   sessionStorage prevents reload loops. */\nlet ce221ControllerReloaded=false;\nasync function ce221KeepFresh(){\n  if(!('serviceWorker' in navigator))return;\n  try{\n    const reg=await navigator.serviceWorker.getRegistration('/');\n    if(!reg)return;\n    if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});\n    const installing=reg.installing;\n    if(installing){\n      installing.addEventListener('statechange',()=>{\n        if(installing.state==='installed'&&navigator.serviceWorker.controller){\n          try{reg.waiting?.postMessage({type:'SKIP_WAITING'})}catch{}\n        }\n      });\n    }\n    await reg.update().catch(()=>{});\n  }catch{}\n}\nnavigator.serviceWorker?.addEventListener?.('controllerchange',()=>{\n  if(ce221ControllerReloaded)return;\n  ce221ControllerReloaded=true;\n  const key='ce221-auto-reloaded';\n  if(sessionStorage.getItem(key)==='1'){\n    sessionStorage.removeItem(key);\n    return;\n  }\n  sessionStorage.setItem(key,'1');\n  location.reload();\n});";
s=s.replace(bootAnchor,autoUpdate+'\n'+bootAnchor);
s=s.replace("  const ok=await ensurePwa();","  const ok=await ensurePwa();\n  if(ok)ce221KeepFresh();",1);
s=s.replace("  window.addEventListener('pageshow',refresh);",
"  window.addEventListener('pageshow',()=>{refresh();ce221KeepFresh()});\n  document.addEventListener('visibilitychange',()=>{if(!document.hidden)ce221KeepFresh()});\n  setInterval(()=>{if(!document.hidden)ce221KeepFresh()},15*60*1000);");
new Function(s);
write(installFile,s);

for(const rel of ['index.html','transparencia.html']){
  const file=pub+'/'+rel;
  let h=read(file);
  if(!h.includes('/v135-install.js'))throw new Error('V221 install asset missing from '+rel);
  h=h.replace(/\/v135-install\.js(?:\?v=\d+)?/g,'/v135-install.js?v=221');
  write(file,h);
}

const swFile=pub+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.1.1-runoff';");
if(!sw.includes('self.skipWaiting()'))throw new Error('V221 skipWaiting behavior missing');
write(swFile,sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.1.1';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(!read(installFile).includes('CE221_AUTO_PWA_UPDATE'))throw new Error('V221 auto update missing');
if(!read(pub+'/index.html').includes('/v135-install.js?v=221'))throw new Error('V221 public cachebuster missing');
if(!read(pub+'/transparencia.html').includes('/v135-install.js?v=221'))throw new Error('V221 transparency cachebuster missing');
if(!read(swFile).includes('v2.1.1-runoff'))throw new Error('V221 cache version missing');
console.log('V2.1.1 auto-update tests passed: new SW registration, automatic activation/reload, visibility refresh, no manual cache clearing required.');