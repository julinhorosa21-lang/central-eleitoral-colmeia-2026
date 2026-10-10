import fs from 'node:fs';
const pub='/app/public',read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const shareFile=pub+'/v191-share.js';let s=read(shareFile);

const a=s.indexOf('function getRows(){');
const b=s.indexOf('\nfunction statusInfo(',a);
if(a<0||b<0)throw new Error('V218 getRows anchor missing');
const getRows=[
"function getRows(){",
"  const cargo=activeCargo();",
"  const official=window.__CE217_OFFICIAL__?.cargos?.[cargo];",
"  if(official&&Array.isArray(official.candidates)){",
"    const rows=official.candidates.map((c,index)=>({",
"      index,",
"      votes:Number(c.votos||0),",
"      nome:String(c.nome||'Candidato').trim(),",
"      partido:String(c.partido||'').trim(),",
"      numero:String(c.numero||'').trim(),",
"      sqCandidato:String(c.sqCandidato||'').trim(),",
"      percentual:Number.isFinite(Number(c.percentual))",
"        ?Number(c.percentual).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%'",
"        :'0,00%',",
"      row:null",
"    })).filter(x=>x.votes>0);",
"    rows.sort((x,y)=>y.votes-x.votes||x.index-y.index);",
"    const total=rows.reduce((sum,x)=>sum+x.votes,0);",
"    return rows.slice(0,5).map((x,i)=>({",
"      ...x,posicao:i+1,",
"      percentual:x.percentual==='0,00%'&&total>0",
"        ?(x.votes/total*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%'",
"        :x.percentual",
"    }));",
"  }",
"  const rows=[...document.querySelectorAll('#leaders .leader')];",
"  const data=rows.map((row,index)=>{",
"    const votes=int(row.querySelector('.votes b')?.textContent);",
"    return {index,votes,nome:String(row.querySelector('.who b')?.textContent||'Candidato').trim(),partido:partyText(row),numero:rowNumber(row),sqCandidato:'',row};",
"  }).filter(x=>x.votes>0);",
"  data.sort((x,y)=>y.votes-x.votes||x.index-y.index);",
"  const total=data.reduce((sum,x)=>sum+x.votes,0);",
"  return data.slice(0,5).map((x,i)=>({...x,posicao:i+1,percentual:pctText(x.row,x.votes,total)}));",
"}"
].join('\n');
s=s.slice(0,a)+getRows+s.slice(b);

const oldLookup="function ce216Lookup(catalog,cargo,numero){\n const entries=catalog?.[cargo];\n return Array.isArray(entries)?entries.find(x=>String(x.numero||'')===String(numero||''))||null:null;\n}";
const newLookup="function ce216Lookup(catalog,cargo,numero,sq=''){\n const entries=catalog?.[cargo];if(!Array.isArray(entries))return null;\n const exact=String(sq||'').trim();\n if(exact){const hit=entries.find(x=>String(x.sqCandidato||'')===exact);if(hit)return hit}\n return entries.find(x=>String(x.numero||'')===String(numero||''))||null;\n}";
if(!s.includes(oldLookup))throw new Error('V218 lookup anchor missing');
s=s.replace(oldLookup,newLookup);

const oldMap="if(!emptyState){const catalog=await ce216LoadCatalog();await Promise.all(top.map(async c=>{const official=ce216Lookup(catalog,cargoKey,c.numero);c.nome=String(official?.nomeUrna||c.nome||'').trim();c.partido=String(official?.partido||c.partido||'').trim();c.photoImage=await ce216Photo(official,cargoKey,c.numero)}));if(top.some(c=>!c.photoImage))throw new Error('foto_indisponivel');}";
const newMap="if(!emptyState){const catalog=await ce216LoadCatalog();await Promise.all(top.map(async c=>{const official=ce216Lookup(catalog,cargoKey,c.numero,c.sqCandidato);const photoSource=official||{sqCandidato:c.sqCandidato,nomeUrna:c.nome,partido:c.partido};c.nome=String(official?.nomeUrna||c.nome||'').trim();c.partido=String(official?.partido||c.partido||'').trim();c.photoImage=await ce216Photo(photoSource,cargoKey,c.numero)}));if(top.some(c=>!c.photoImage))throw new Error('foto_indisponivel');}";
if(!s.includes(oldMap))throw new Error('V218 photo-map anchor missing');
s=s.replace(oldMap,newMap);
s=s.replace('<span>Compartilhar resultado</span>','<span>Compartilhar resultado com fotos</span>');
new Function(s);write(shareFile,s);

for(const rel of ['index.html','transparencia.html']){
 const file=pub+'/'+rel;let h=read(file);
 h=h.replace(/v191-share\.js\?v=\d+/g,'v191-share.js?v=218');
 write(file,h);
}
let sw=read(pub+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.0.18-unified';");
write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.18';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(!s.includes('window.__CE217_OFFICIAL__?.cargos?.[cargo]'))throw new Error('V218 official state source absent');
if(!s.includes('sqCandidato:c.sqCandidato'))throw new Error('V218 exact photo fallback absent');
if(!s.includes('ce216Photo(photoSource,cargoKey,c.numero)'))throw new Error('V218 stable runoff photo call absent');
if(!s.includes('Compartilhar resultado com fotos'))throw new Error('V218 action label absent');
if(!read(pub+'/index.html').includes('v191-share.js?v=218'))throw new Error('V218 cachebuster absent');
if(!sw.includes('v2.0.18-unified'))throw new Error('V218 SW absent');
console.log('V2.0.18 share integration passed: official TSE state drives top 3, SQ_CANDIDATO photos work without catalog, DOM fallback preserved.');
