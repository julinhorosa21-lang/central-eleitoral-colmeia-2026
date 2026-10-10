import fs from 'node:fs';
import path from 'node:path';

const APP='/app',PUB=APP+'/public',SERVER=APP+'/server.mjs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const vendor=PUB+'/vendor/leaflet';
fs.mkdirSync(vendor,{recursive:true});
fs.mkdirSync(vendor+'/images',{recursive:true});

const src='/app/node_modules/leaflet/dist';
for(const [a,b] of [['leaflet.js','leaflet.js'],['leaflet.css','leaflet.css']]){
  const from=src+'/'+a;if(!fs.existsSync(from))throw new Error('V241 Leaflet local ausente: '+from);
  fs.copyFileSync(from,vendor+'/'+b);
}
for(const name of ['marker-icon.png','marker-icon-2x.png','marker-shadow.png','layers.png','layers-2x.png']){
  const from=src+'/images/'+name;if(fs.existsSync(from))fs.copyFileSync(from,vendor+'/images/'+name);
}

let js=read(PUB+'/v240-public-map-winners.js');
js=js.replace("loadCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');","loadCss('/vendor/leaflet/leaflet.css?v=241');");
js=js.replace("await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');","await loadScript('/vendor/leaflet/leaflet.js?v=241');");
js=js.replace("async function refresh(){\n  try{data=await loadData();await drawMap()}catch(e){console.error('CE240 map',e)}\n}",
"async function refresh(){\n  try{data=await loadData();await drawMap()}catch(e){console.error('CE240 map',e);const el=document.getElementById('ce240Map');if(el){el.classList.add('ce240-map-empty');el.textContent='Não foi possível carregar o mapa. Toque em Atualizar para tentar novamente.'}}\n}");
new Function(js);write(PUB+'/v240-public-map-winners.js',js);

let server=read(SERVER);
if(!server.includes('CE241_LOCATION_ROWS')){
  const anchor='function ce240PlaceWinners(){';
  if(!server.includes(anchor))throw new Error('V241 ce240PlaceWinners anchor missing');
  const helper="/* CE241_LOCATION_ROWS */\nfunction ce241LocationRows(source){if(Array.isArray(source))return source;if(!source||typeof source!=='object')return[];for(const k of ['locais','places','items','locations'])if(Array.isArray(source[k]))return source[k];return Object.values(source).filter(x=>x&&typeof x==='object'&&(Array.isArray(x.secoes)||Array.isArray(x.sections)))}\n";
  server=server.replace(anchor,helper+anchor);
  server=server.replace("(Array.isArray(locations)?locations:[]).map(loc=>","ce241LocationRows(locations).map(loc=>");
}
write(SERVER,server);

for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;let h=read(p);
  h=h.replace(/v240-public-map-winners\.js\?v=\d+/g,'v240-public-map-winners.js?v=241');
  h=h.replace(/v240-public-map-winners\.css\?v=\d+/g,'v240-public-map-winners.css?v=241');
  write(p,h);
}

let sw=read(PUB+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.3.0-map-fix';");
if(!sw.includes("'/vendor/leaflet/leaflet.js'"))sw=sw.replace('const CORE=[',"const CORE=['/vendor/leaflet/leaflet.css','/vendor/leaflet/leaflet.js',");
write(PUB+'/service-worker.js',sw);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.3.0';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(!read(SERVER).includes('CE241_LOCATION_ROWS'))throw new Error('V241 location normalizer missing');
if(read(PUB+'/v240-public-map-winners.js').includes('unpkg.com/leaflet'))throw new Error('V241 external Leaflet dependency remains');
if(!fs.existsSync(vendor+'/leaflet.js')||!fs.existsSync(vendor+'/leaflet.css'))throw new Error('V241 local Leaflet assets missing');

console.log('V2.3.0 passed: mapa usa Leaflet local e aceita locations array/locais/places/items/locations.');
