import fs from 'node:fs';
const pub='/app/public',h=fs.readFileSync(pub+'/operacao.html','utf8');
console.log('CE213_HTML_INFO',JSON.stringify({length:h.length,scripts:[...h.matchAll(/<script\\b[^>]*src=["']([^"']+)/g)].map(m=>m[1]),inputs:[...h.matchAll(/<(?:input|textarea|select)[^>]*\\bid=["']([^"']+)/g)].map(m=>m[1])}));
const lines=h.split('\\n');
for(let i=0;i<lines.length;i++){
 let s=lines[i];
 if(/function (?:saveResult|render|feedQr|processQr|stopQr|startQr|setQr|openSheet)|addEventListener\\(['"](?:input|change)|MutationObserver|setInterval|function startQrScanner|function handleQr|qrSession|function refresh|function loadSnapshot/.test(s)){
  console.log('CE213_LINE',JSON.stringify({line:i+1,text:s.slice(0,1250)}));
 }
}
for(const file of ['v174-bu-validation.js','v175-section-lock.js','v183-bu-scanner.js','v186-visual-qa.js','v187-ui.js','v189-identity.js','v194-fastpath.js','v202-contrast.js','v151-operator-bridge.js']){
 const p=pub+'/'+file;if(!fs.existsSync(p))continue;
 const src=fs.readFileSync(p,'utf8');
 console.log('CE213_ASSET',JSON.stringify({file,length:src.length,hasBodyObserver:src.includes('observe(document.body'),eventListeners:[...src.matchAll(/addEventListener\\(['"]([a-z]+)/g)].map(m=>m[1]),timers:(src.match(/setInterval\\(/g)||[]).length}));
}
