import fs from 'node:fs';

const pub='/app/public';
const pages=[`${pub}/index.html`,`${pub}/transparencia.html`];
const swPath=`${pub}/service-worker.js`;
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

for(const path of pages){
  let html=read(path);

  // Locais de votação são estáticos: usar cache do navegador/PWA.
  html=html.replaceAll(
    "fetch('/data/locais-colmeia.json',{cache:'no-store'})",
    "fetch('/data/locais-colmeia.json',{cache:'force-cache'})"
  );

  // Atualizações SSE passam a buscar somente o snapshot.
  if(!html.includes('CE181 snapshot request')){
    const anchor="function scheduleLoad(){clearTimeout(reloadTimer);reloadTimer=setTimeout(load,450)}";

    if(!html.includes(anchor))
      throw new Error(`V1.8.1: scheduleLoad não localizado em ${path}`);

    const smart=`/* CE181 snapshot request */
let ce181SnapshotReq=null;

async function ce181LoadSnapshot(){
  if(ce181SnapshotReq)return ce181SnapshotReq;

  ce181SnapshotReq=fetch('/api/snapshot',{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('snapshot')))
    .then(s=>{
      snapshot=s;
      $('errorBox').innerHTML='';
      render();
      return s;
    })
    .catch(()=>{
      $('errorBox').innerHTML=
        '<div class="error"><b>Não foi possível atualizar o painel agora.</b><br>Verifique a conexão e tente novamente.</div>';
    })
    .finally(()=>{ce181SnapshotReq=null});

  return ce181SnapshotReq;
}

function scheduleLoad(){
  clearTimeout(reloadTimer);
  reloadTimer=setTimeout(()=>{
    if(!document.hidden)ce181LoadSnapshot();
  },220);
}`;

    html=html.replace(anchor,smart);
  }

  // O carregamento completo vira apenas uma verificação periódica de contingência.
  html=html.replace(
    "setInterval(load,30000);",
    `setInterval(()=>{
      if(!document.hidden)load();
    },120000);

    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)ce181LoadSnapshot();
    });`
  );

  write(path,html);
}

let sw=read(swPath);
sw=sw.replace(
  /const VERSION='[^']+';/,
  "const VERSION='v1.8.1-unified';"
);
write(swPath,sw);

for(const path of pages){
  const html=read(path);

  if(!html.includes('CE181 snapshot request'))
    throw new Error(`V1.8.1 ausente em ${path}`);

  if(!html.includes("cache:'force-cache'"))
    throw new Error(`V1.8.1 cache ausente em ${path}`);
}

console.log(
  'V1.8.1 applied: SSE snapshot refresh, static cache and reduced polling enabled.'
);
