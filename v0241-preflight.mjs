import {readFileSync,existsSync,readdirSync} from 'node:fs';
const server=readFileSync('/app/server.mjs','utf8');
if(!server.includes("version:'0.24.1'")) throw new Error('V0.24.1 preflight: server version mismatch');
for(const f of ['/app/public/index.html','/app/public/transparencia.html']){
  const html=readFileSync(f,'utf8');
  for(const a of ['/v0241-photos.css','/v0241-photos.js']) if(!html.includes(a)) throw new Error(`V0.24.1 preflight: ${a} missing from ${f}`);
}
const mapPath='/app/public/data/candidate-photo-map.json'; if(!existsSync(mapPath)) throw new Error('V0.24.1 preflight: map missing');
const map=JSON.parse(readFileSync(mapPath,'utf8')); const f=Object.values(map.byCargo?.depFederal||{}),e=Object.values(map.byCargo?.depEstadual||{});
if(f.length<90||e.length<190) throw new Error(`V0.24.1 preflight: low coverage ${f.length}/${e.length}`);
for(const x of [...f,...e]) if(!existsSync(`/app/public${x.foto}`)) throw new Error(`V0.24.1 preflight: missing photo ${x.foto}`);
const photoCount=readdirSync('/app/public/candidate-photos').filter(n=>/^\d+\.jpg$/.test(n)).length;
if(photoCount<300) throw new Error(`V0.24.1 preflight: only ${photoCount} photos packaged`);
const sw=readFileSync('/app/public/service-worker.js','utf8'); if(!sw.includes("VERSION='v0.24.1'")) throw new Error('V0.24.1 preflight: SW mismatch');
console.log(`V0.24.1 preflight OK: ${photoCount} TSE photos; ${f.length} federal + ${e.length} estadual mapped.`);
