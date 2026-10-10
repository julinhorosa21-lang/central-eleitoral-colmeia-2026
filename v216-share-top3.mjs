import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const path=pub+'/v191-share.js';
let source=read(path);
function once(oldText,newText,label){
 if(source.split(oldText).length!==2)throw new Error('V216 anchor mismatch: '+label);
 source=source.replace(oldText,newText);
}
const helpers=String.raw`
/* CE216_TOP3_OFFICIAL_PHOTOS: load only 3 candidates on demand, never block sharing if unavailable. */
let ce216CatalogPromise=null;
const ce216Images=new Map();
async function ce216LoadCatalog(){
 if(ce216CatalogPromise)return ce216CatalogPromise;
 ce216CatalogPromise=(async()=>{
  for(const url of ['/api/candidates','/data/candidate-catalog.json?v=216']){
   try{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),5000);
    let res;try{res=await fetch(url,{signal:ctl.signal,cache:'no-store'});}finally{clearTimeout(timer)}
    if(!res.ok)continue;
    const body=await res.json();
    const catalog=body?.snapshot?.candidates||body?.candidates;
    if(catalog&&typeof catalog==='object')return catalog;
   }catch{}
  }
  return {};
 })();
 try{return await ce216CatalogPromise}finally{ce216CatalogPromise=null}
}
function ce216Lookup(catalog,cargo,numero){
 const entries=catalog?.[cargo];
 return Array.isArray(entries)?entries.find(x=>String(x.numero||'')===String(numero||''))||null:null;
}
function ce216PhotoSources(candidate,cargo,numero){
 const photo=String(candidate?.foto||'').trim(),sq=String(candidate?.sqCandidato||'').replace(/\D/g,'');
 const stable=(cargo&&numero)?'/candidate-photos/2t-'+String(cargo).replace(/[^a-z]/gi,'')+'-'+String(numero).replace(/\D/g,'')+'.jpg':'';
 const local=sq?'/candidate-photos/'+sq+'.jpg':'';
 const urls=[stable,photo,local].filter(Boolean);
 return [...new Set(urls.filter(v=>/^\/candidate-photos\/[a-z0-9._-]+\.jpg$/i.test(v)||/^https:\/\//i.test(v)))];
}
function ce216Image(url){
 if(ce216Images.has(url))return ce216Images.get(url);
 const task=new Promise(resolve=>{
  const image=new Image();
  let done=false;
  const complete=value=>{if(done)return;done=true;clearTimeout(timer);image.onload=null;image.onerror=null;resolve(value)};
  const timer=setTimeout(()=>complete(null),4200);
  image.crossOrigin='anonymous';
  image.decoding='async';
  image.onload=()=>complete(image);
  image.onerror=()=>complete(null);
  image.src=url;
 });
 ce216Images.set(url,task);
 if(ce216Images.size>24)ce216Images.delete(ce216Images.keys().next().value);
 return task;
}
async function ce216Photo(candidate,cargo,numero){
 for(const url of ce216PhotoSources(candidate,cargo,numero)){
  const img=await ce216Image(url);
  if(img)return img;
 }
 return null;
}
function ce216Portrait(ctx,c,x,y,size){
 ctx.save();
 ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);
 ctx.clip();
 ctx.fillStyle='#E8F0F5';ctx.fillRect(x,y,size,size);
 if(c.photoImage){
  const img=c.photoImage;
  const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
  if(w>0&&h>0){
   const side=Math.min(w,h);
   ctx.drawImage(img,(w-side)/2,(h-side)/2,side,side,x,y,size,size);
  }
 }else{
  ctx.font='800 42px Arial, sans-serif';ctx.fillStyle='#51728A';ctx.textAlign='center';
  const initials=String(c.nome||'').trim().split(/\s+/).slice(0,2).map(v=>v[0]||'').join('').toUpperCase()||'?';
  ctx.fillText(initials,x+size/2,y+size*.58);
  ctx.font='600 12px Arial, sans-serif';ctx.fillText('SEM FOTO',x+size/2,y+size*.82);
 }
 ctx.restore();
 ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);
 ctx.strokeStyle='#D5E2EB';ctx.lineWidth=3;ctx.stroke();
 ctx.textAlign='left';
}
`;
const anchor='function buildCanvas(){';
if(!source.includes(anchor))throw new Error('V216 buildCanvas absent');
source=source.replace(anchor,helpers+'\n'+anchor);
once(
  "function buildCanvas(){\n  const cargo=cargoLabel(activeCargo()),done=cargoDone(),status=statusInfo(done),updated=updatedText(),top=getRows(),test=isTestEnvironment(),emptyState=!top.length;",
  "async function buildCanvas(){\n  const cargoKey=activeCargo(),cargo=cargoLabel(cargoKey),done=cargoDone(),status=statusInfo(done),updated=updatedText(),top=getRows().slice(0,3),test=isTestEnvironment(),emptyState=!top.length;\n  if(!emptyState){const catalog=await ce216LoadCatalog();await Promise.all(top.map(async c=>{const official=ce216Lookup(catalog,cargoKey,c.numero);c.nome=String(official?.nomeUrna||c.nome||'').trim();c.partido=String(official?.partido||c.partido||'').trim();c.photoImage=await ce216Photo(official,cargoKey,c.numero)}));}",
  'async card and source candidates'
);
const beginning="  }else{\n    ctx.font='800 25px Arial, sans-serif';ctx.fillStyle='#123D60';ctx.fillText('MAIS VOTADOS NESTE MOMENTO',72,448);";
const start=source.indexOf(beginning);
const endMarker="\n  }\n\n  // Rodapé";
const end=source.indexOf(endMarker,start);
if(start<0||end<0)throw new Error('V216 nonempty ranking block absent');
const ranking=String.raw`  }else{
    ctx.font='800 25px Arial, sans-serif';ctx.fillStyle='#123D60';ctx.fillText('RESULTADO DOS CANDIDATOS',72,448);
    ctx.font='500 18px Arial, sans-serif';ctx.fillStyle='#667985';ctx.fillText('Fotografias dos candidatos · acompanhamento local',72,479);
    const startY=508,rowH=195,gap=19;
    top.forEach((c,i)=>{
      const y=startY+i*(rowH+gap);
      roundRect(ctx,72,y,936,rowH,20,'#FFFFFF','#D8E4EA');
      // Foto do candidato, sem selo de colocação.
      ce216Portrait(ctx,c,96,y+23,148);
      // Nome, partido e número, sem invadir a contagem à direita.
      ctx.font='800 24px Arial, sans-serif';ctx.fillStyle='#17212B';
      drawTextLines(ctx,wrapText(ctx,c.nome,430,2),270,y+68,31);
      ctx.font='700 19px Arial, sans-serif';ctx.fillStyle='#526977';
      ctx.fillText((c.partido?c.partido+' · ':'')+'nº '+(c.numero||'—'),270,y+145);
      ctx.textAlign='right';
      ctx.font='800 27px Arial, sans-serif';ctx.fillStyle='#17212B';
      ctx.fillText(formatVotes(c.votes),984,y+85);
      ctx.font='800 27px Arial, sans-serif';ctx.fillStyle='#2450B2';
      ctx.fillText(c.percentual,984,y+129);
      ctx.textAlign='left';
    });`;
source=source.slice(0,start)+ranking+source.slice(end);
once("const card=buildCanvas(),blob=await canvasBlob(card.canvas)","const card=await buildCanvas(),blob=await canvasBlob(card.canvas)","async share entry");
new Function(source);
write(path,source);

// Public pages use a query-versioned script, including installations with a cached PWA.
for(const rel of ['index.html','transparencia.html']){
 const file=pub+'/'+rel;let html=read(file);
 if(!/v191-share\.js\?v=\d+/.test(html))throw new Error('V216 share script reference missing: '+rel);
 html=html.replace(/v191-share\.js\?v=\d+/g,'v191-share.js?v=216');
 write(file,html);
}
const swFile=pub+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.0.16-unified';");
write(swFile,sw);
const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.16';write(pkg,JSON.stringify(j,null,2)+'\n')}
if(!source.includes('CE216_TOP3_OFFICIAL_PHOTOS')||!source.includes('getRows().slice(0,3)'))throw new Error('V216 photo module missing');
if(!source.includes('if(emptyState)')||!source.includes('Nenhum voto computado até o momento'))throw new Error('V216 zero-vote card changed');
if(!source.includes("navigator.canShare?.({files:[file]})"))throw new Error('V216 native share missing');
if(!read(pub+'/index.html').includes('v191-share.js?v=216')||!read(pub+'/transparencia.html').includes('v191-share.js?v=216'))throw new Error('V216 script cachebuster failed');
if(!read(swFile).includes('v2.0.16-unified'))throw new Error('V216 SW version failed');
console.log('V2.0.16 share build passed: async Top 3 official portraits, safe local/CORS fallback, zero-vote preserved, versioned PWA assets.');