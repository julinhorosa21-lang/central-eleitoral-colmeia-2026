(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;
const CLIENT_KEY='ce208_anon_client',ACCESS_KEY='ce208_access_session',PWA_KEY='ce208_pwa_session',INSTALL_KEY='ce208_install_seen';
function clientId(){try{let id=localStorage.getItem(CLIENT_KEY);if(!id){id=(crypto.randomUUID?.()||('ce-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2))).replace(/[^A-Za-z0-9_-]/g,'');localStorage.setItem(CLIENT_KEY,id)}return id}catch{return 'session-'+String(Math.random()).slice(2)+Date.now().toString(36)}}
function standalone(){return window.matchMedia?.('(display-mode: standalone)').matches===true||window.navigator.standalone===true}
function send(event){const payload=JSON.stringify({event,clientId:clientId(),path:location.pathname});try{return fetch('/api/analytics/event',{method:'POST',headers:{'content-type':'application/json'},body:payload,cache:'no-store',keepalive:true}).catch(()=>null)}catch{return Promise.resolve(null)}}
function onceSession(key,event){try{if(sessionStorage.getItem(key)==='1')return;sessionStorage.setItem(key,'1')}catch{}send(event)}
async function markInstall(){try{if(localStorage.getItem(INSTALL_KEY)==='1')return}catch{}const r=await send('install');if(r?.ok){try{localStorage.setItem(INSTALL_KEY,'1')}catch{}}}
function start(){onceSession(ACCESS_KEY,'access');if(standalone()){onceSession(PWA_KEY,'pwa_open');markInstall()}window.addEventListener('appinstalled',markInstall)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();