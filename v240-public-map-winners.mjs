import fs from 'node:fs';

const APP='/app',PUB=APP+'/public',SERVER=APP+'/server.mjs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);

fs.copyFileSync('/src/v240-public-map-winners.js',PUB+'/v240-public-map-winners.js');
fs.copyFileSync('/src/v240-public-map-winners.css',PUB+'/v240-public-map-winners.css');
new Function(read(PUB+'/v240-public-map-winners.js'));

let server=read(SERVER);
if(!server.includes('CE240_PUBLIC_PLACE_WINNERS')){
  const anchor='const server = http.createServer(async (req,res) => {';
  if(!server.includes(anchor))throw new Error('V240 server anchor missing');
  const helper=[
    '',
    '/* CE240_PUBLIC_PLACE_WINNERS */',
    "function ce240Sections(loc){const raw=Array.isArray(loc?.secoes)?loc.secoes:Array.isArray(loc?.sections)?loc.sections:[];const vals=raw.map(s=>Number(typeof s==='object'?(s.numero??s.section??s.secao):s)).filter(Number.isFinite).map(n=>n===113?49:n);return [...new Set(vals)].sort((a,b)=>a-b)}",
    "function ce240LocId(loc){return String(loc?.id??loc?.codigo??loc?.code??loc?.nome??loc?.name??'').trim()}",
    "function ce240LocName(loc){return String(loc?.nome??loc?.name??loc?.local??loc?.titulo??loc?.title??ce240LocId(loc)).trim()}",
    "function ce240Coord(loc,kind){const keys=kind==='lat'?['lat','latitude']:['lng','lon','long','longitude'];for(const k of keys){const n=Number(loc?.[k]);if(Number.isFinite(n))return n}const bags=[loc?.coords,loc?.coord,loc?.coordenadas,loc?.coordinates];for(const b of bags){if(!b)continue;for(const k of keys){const n=Number(b?.[k]);if(Number.isFinite(n))return n}if(Array.isArray(b)&&b.length>=2){const a=Number(b[0]),c=Number(b[1]);if(Number.isFinite(a)&&Number.isFinite(c))return kind==='lat'?a:c}}return null}",
    "function ce240PlaceWinners(){const cargos=['presidente','governador'];const rows=listRows.all().filter(r=>r.local_payload_json&&cargos.includes(String(r.cargo||'')));const snap=storedCandidateSnapshot()||{};const catalog=snap?.candidates||{};return (Array.isArray(locations)?locations:[]).map(loc=>{const sections=ce240Sections(loc),sectionSet=new Set(sections),byCargo={};for(const cargo of cargos){const cargoRows=rows.filter(r=>String(r.cargo)===cargo&&sectionSet.has(Number(r.section)));const completed=[...new Set(cargoRows.map(r=>Number(r.section)===113?49:Number(r.section)))];const complete=sections.length>0&&sections.every(s=>completed.includes(s));const totals=new Map();for(const row of cargoRows){const payload=safeJson(row.local_payload_json,{});for(const c of Array.isArray(payload?.candidatos)?payload.candidatos:[]){const numero=String(c?.numero||'').replace(/\\D/g,'');if(!numero)continue;totals.set(numero,(totals.get(numero)||0)+Math.max(0,Number(c?.votos||0)))}}let winner=null,tie=false;if(complete&&totals.size){const sorted=[...totals.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));if(sorted.length>1&&sorted[0][1]===sorted[1][1])tie=true;if(!tie){const [numero,votos]=sorted[0];const meta=(Array.isArray(catalog?.[cargo])?catalog[cargo]:[]).find(c=>String(c?.numero||'')===numero)||{};winner={numero,votos,nome:String(meta?.nomeUrna||meta?.nome||('Nº '+numero)),partido:String(meta?.partido||'')}}}byCargo[cargo]={complete,completedSections:completed.length,expectedSections:sections.length,tie,winner}}const both=sections.filter(sec=>cargos.every(cargo=>rows.some(r=>String(r.cargo)===cargo&&Number(r.section)===sec&&r.local_payload_json))).length;return{id:ce240LocId(loc),name:ce240LocName(loc),sections,expectedSections:sections.length,completedSections:both,complete:cargos.every(c=>byCargo[c].complete),lat:ce240Coord(loc,'lat'),lng:ce240Coord(loc,'lng'),cargos:byCargo}})}",
    ''
  ].join('\n');
  server=server.replace(anchor,helper+anchor);
  const routeAnchor="    if (p === '/api/health')";
  if(!server.includes(routeAnchor))throw new Error('V240 route anchor missing');
  const route="    if (p === '/api/public/place-winners' && req.method === 'GET') {\n      return json(res,200,{ok:true,turno:2,electionDate:'2026-10-25',source:'manual_local_results',places:ce240PlaceWinners()});\n    }\n";
  server=server.replace(routeAnchor,route+routeAnchor);
}
write(SERVER,server);

for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;if(!fs.existsSync(p))continue;
  let h=read(p);
  if(!h.includes('/v240-public-map-winners.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v240-public-map-winners.css?v=240">\n</head>');
  if(!h.includes('/v240-public-map-winners.js'))h=h.replace('</body>','<script src="/v240-public-map-winners.js?v=240"></script>\n</body>');
  h=h.replace(/v135-install\\.js\\?v=\\d+/g,'v135-install.js?v=240');
  write(p,h);
}

const opCss=PUB+'/v232-access.css';
let css=read(opCss);
if(!css.includes('CE240_NO_OPERATION_MAP'))css+='\n/* CE240_NO_OPERATION_MAP */\nbody[data-ce201-module="operacao"] #map,body[data-ce201-module="operacao"] .mapbox,body[data-ce201-module="operacao"] .map-wrap,body[data-ce201-module="operacao"] .map-card,body[data-ce201-module="operacao"] [data-map-container],body[data-ce201-module="operacao"] #directionsLink,body[data-ce201-module="operacao"] a[href*="maps.google"],body[data-ce201-module="operacao"] a[href*="google.com/maps"]{display:none!important}\n';
write(opCss,css);

let op=read(PUB+'/operacao.html');
op=op.replace(/v232-access\\.css\\?v=\\d+/g,'v232-access.css?v=240');
op=op.replace(/v135-install\\.js\\?v=\\d+/g,'v135-install.js?v=240');
write(PUB+'/operacao.html',op);

const install=PUB+'/v135-install.js';
if(fs.existsSync(install))write(install,read(install).replace(/service-worker\\.js\\?v=\\d+/g,'service-worker.js?v=240'));

let sw=read(PUB+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.2.9-public-map-winners';");
if(!sw.includes("'/v240-public-map-winners.js'"))sw=sw.replace('const CORE=[',"const CORE=['/v240-public-map-winners.css','/v240-public-map-winners.js',");
write(PUB+'/service-worker.js',sw);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.2.9';write(pkg,JSON.stringify(j,null,2)+'\n')}

const finalServer=read(SERVER);
if(!finalServer.includes("p === '/api/public/place-winners'"))throw new Error('V240 endpoint missing');
if(!finalServer.includes("source:'manual_local_results'"))throw new Error('V240 manual source marker missing');
if(!finalServer.includes("n===113?49:n"))throw new Error('V240 aggregate 113->49 missing');
if(!read(PUB+'/index.html').includes('/v240-public-map-winners.js?v=240'))throw new Error('V240 public map asset missing');
if(!read(opCss).includes('CE240_NO_OPERATION_MAP'))throw new Error('V240 operation map removal missing');

console.log('V2.2.9 passed: electoral map moved to public area; manual-only winners by polling place appear after local completion.');