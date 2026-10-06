import fs from 'node:fs';
const pub='/app/public',read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);

/* CE219_MANUAL_BU_ONLY_PUBLIC
   Public ranking + share are driven only by the Central's local BU snapshot.
   TSE EA20 backend/admin reconciliation remains intact for later reactivation. */

for(const rel of ['index.html','transparencia.html']){
  const file=pub+'/'+rel;
  let h=read(file);
  h=h.replace(/\s*<script[^>]+src=["']\/v217-official-live\.js\?v=\d+["'][^>]*><\/script>\s*/g,'\n');
  h=h.replace(/\s*<link[^>]+href=["']\/v217-official-live\.css\?v=\d+["'][^>]*>\s*/g,'\n');
  write(file,h);
}

const shareFile=pub+'/v191-share.js';
let s=read(shareFile);
const a=s.indexOf('function getRows(){');
const b=s.indexOf('\nfunction statusInfo(',a);
if(a<0||b<0)throw new Error('V219 getRows anchor missing');
const localRows=[
"function getRows(){",
"  const rows=[...document.querySelectorAll('#leaders .leader')];",
"  const data=rows.map((row,index)=>{",
"    const votes=int(row.querySelector('.votes b')?.textContent);",
"    return {",
"      index,",
"      votes,",
"      nome:String(row.querySelector('.who b')?.textContent||'Candidato').trim(),",
"      partido:partyText(row),",
"      numero:rowNumber(row),",
"      sqCandidato:String(row.dataset?.sqCandidato||row.dataset?.ceSqCandidato||'').trim(),",
"      row",
"    };",
"  }).filter(x=>x.votes>0);",
"  data.sort((x,y)=>y.votes-x.votes||x.index-y.index);",
"  const total=data.reduce((sum,x)=>sum+x.votes,0);",
"  return data.slice(0,5).map((x,i)=>({...x,posicao:i+1,percentual:pctText(x.row,x.votes,total)}));",
"}"
].join('\n');
s=s.slice(0,a)+localRows+s.slice(b);
s=s.replace('<span>Compartilhar resultado com fotos</span>','<span>Compartilhar resultado com fotos</span>');
if(s.includes('window.__CE217_OFFICIAL__'))throw new Error('V219 official state still present in sharing');
new Function(s);
write(shareFile,s);

for(const rel of ['index.html','transparencia.html']){
  const file=pub+'/'+rel;
  let h=read(file).replace(/v191-share\.js\?v=\d+/g,'v191-share.js?v=219');
  write(file,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.19-unified';");
sw=sw.replaceAll("'/v217-official-live.css',",'').replaceAll("'/v217-official-live.js',",'');
sw=sw.replaceAll(",'/v217-official-live.css'",'').replaceAll(",'/v217-official-live.js'",'');
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.19';write(pkg,JSON.stringify(j,null,2)+'\n')}

const index=read(pub+'/index.html'),trans=read(pub+'/transparencia.html');
if(index.includes('/v217-official-live.js')||trans.includes('/v217-official-live.js'))throw new Error('V219 official public script still loaded');
if(index.includes('/v217-official-live.css')||trans.includes('/v217-official-live.css'))throw new Error('V219 official public css still loaded');
if(!index.includes('v191-share.js?v=219')||!trans.includes('v191-share.js?v=219'))throw new Error('V219 share cachebuster missing');
if(!s.includes("document.querySelectorAll('#leaders .leader')"))throw new Error('V219 manual ranking share source missing');
if(s.includes('window.__CE217_OFFICIAL__'))throw new Error('V219 TSE source still drives share');
if(!read(pub+'/service-worker.js').includes("v2.0.19-unified"))throw new Error('V219 service worker version missing');

console.log('V2.0.19 passed: TSE results hidden from public UI; public ranking/share use only manually entered local BUs; official backend/admin sync preserved.');
