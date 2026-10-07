import fs from 'node:fs';
const files=['/app/server.mjs','/app/public/index.html','/app/public/transparencia.html','/app/public/operacao.html','/app/public/admin/index.html','/app/public/admin/admin-v150.js','/app/public/v130-public.js','/app/public/v187-ui.js','/app/public/v192-sections.js'];
for(const file of files){
 if(!fs.existsSync(file))continue;
 const s=fs.readFileSync(file,'utf8');
 const needles=[
  'function snapshot(','const CARGO_KEYS','const CARGOS','CARGOS=','cargoTabs','/api/candidates',
  "p === '/api/snapshot'","p === '/api/results' && req.method === 'POST'",
  'listRows','INSERT INTO results','CREATE TABLE IF NOT EXISTS results',
  'renderSummary','sectionInfo','openPlace','candidateCatalog'
 ];
 console.log('CE220_FILE',file,'LEN',s.length);
 for(const n of needles){
  let at=s.indexOf(n);
  if(at<0)continue;
  console.log('CE220_SNIP',JSON.stringify({file,needle:n,text:s.slice(Math.max(0,at-420),Math.min(s.length,at+2200))}));
 }
}
