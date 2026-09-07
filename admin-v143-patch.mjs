import fs from 'node:fs';

const pub = '/app/public/admin';
const htmlPath = `${pub}/index.html`;
const jsPath = `${pub}/admin.js`;

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace('Preparar instalação', 'Instalar app');
fs.writeFileSync(htmlPath, html);

let js = fs.readFileSync(jsPath, 'utf8');
const installRe = /function isStandalone\(\)\{[\s\S]*?\}\nfunction setupNav/;
if (!installRe.test(js)) throw new Error('V1.4.2 install block not found');

js = js.replace(installRe, `function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true}
function androidChromeIntent(){const target=location.origin+'/admin/index.html?install=1&ui=admin143';const path=location.host+'/admin/index.html?install=1&ui=admin143';return 'intent://'+path+'#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;S.browser_fallback_url='+encodeURIComponent(target)+';end'}
async function setupInstall(){const btn=$('installBtn');if(!btn)return;const hide=()=>{btn.hidden=true};const ready=()=>{btn.hidden=false;btn.disabled=false;btn.textContent='Instalar app';btn.classList.add('install-ready')};if(isStandalone()){hide();return}ready();window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;ready()});window.addEventListener('appinstalled',()=>{deferredPrompt=null;hide();toast('Central Administrativa instalada.')});if('serviceWorker'in navigator){try{const reg=await navigator.serviceWorker.register('/admin/admin-sw.js?v=143',{scope:'/admin/'});await reg.update().catch(()=>{});await navigator.serviceWorker.ready}catch(e){console.warn('admin PWA registration failed',e)}}btn.onclick=async()=>{if(isStandalone()){hide();return}if(deferredPrompt){const prompt=deferredPrompt;deferredPrompt=null;btn.disabled=true;try{await prompt.prompt();const choice=await prompt.userChoice;if(choice?.outcome==='accepted'){hide();return}}catch{}btn.disabled=false;ready();return}const isAndroid=/Android/i.test(navigator.userAgent||'');if(isAndroid){toast('Abrindo no Chrome para concluir a instalação…');setTimeout(()=>{location.href=androidChromeIntent()},120);return}toast('Este navegador não liberou a instalação direta deste aplicativo.')}}
function setupNav`);

fs.writeFileSync(jsPath, js);
console.log('V1.4.3 admin applied: in-page install button now opens full Chrome when current Android view cannot expose beforeinstallprompt.');
