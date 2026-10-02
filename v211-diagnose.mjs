import fs from 'node:fs';
const s=fs.readFileSync('/app/server.mjs','utf8'),t=fs.readFileSync('/app/tse-sync.mjs','utf8');
function inspect(label,str,patterns,span=1600,limit=4){
 for(const p of patterns){let pos=0,n=0;while(n<limit&&(pos=str.indexOf(p,pos))!==-1){console.log('CE211_DIAG '+label+' '+p+' '+n+' :: '+str.slice(Math.max(0,pos-500),Math.min(str.length,pos+span)).replace(/\n/g,' '));pos+=p.length;n++}}
}
inspect('server',s,['function snapshot(', 'function adminOverview(', 'getSectionEvidence(', 'verificationStatus:', "p === '/api/admin/tse", "p === '/api/admin/sections","getRow =", 'CREATE TABLE IF NOT EXISTS results', 'const resultCore ='],1700,4);
inspect('sync',t,['async function getSectionEvidence(', 'function getSectionEvidence(', 'async function refresh(', 'function getStatus(', 'return {getStatus','async function fetchJson'],1800,2);
console.log('CE211_DIAG done');
