import fs from 'node:fs';

const pub='/app/public';
const publicJsPath=`${pub}/v130-public.js`;
const legacyPhotoPath=`${pub}/v0241-photos.js`;
const swPath=`${pub}/service-worker.js`;
const pages=[`${pub}/index.html`,`${pub}/transparencia.html`];
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* ============================================================
   1) Resultados públicos: fotos realmente sob demanda
   ============================================================ */
let js=read(publicJsPath);
const start=js.indexOf('  function decoratePhotos(){');
const end=start>=0?js.indexOf('  function candidateSemantics(){',start):-1;
if(start<0||end<0) throw new Error('V1.8.0: bloco de fotos públicas não localizado');

const optimized=`  /* V1.8.0 — carregamento progressivo de fotos */
  const CE180_CATALOG_CACHE='ce180-candidate-catalog-v1';
  const CE180_CATALOG_KEY='/api/candidates';
  const CE180_CATALOG_TTL=30*60*1000;
  const CE180_MAX_PHOTO_LOADS=(()=>{
    const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    if(c?.saveData)return 2;
    if(/(^|-)2g/.test(String(c?.effectiveType||'')))return 2;
    return 4;
  })();
  let ce180PhotoObserver=null;
  let ce180PhotoQueue=[];
  let ce180PhotoActive=0;
  let ce180CatalogPromise=null;

  function ce180CommitPhoto(job,img){
    const {row,box,n}=job;
    if(!row.isConnected||!box.isConnected)return;
    if(candidateNumber(row)!==n)return;
    if(box.querySelector('img'))return;
    box.classList.add('public-photo-num');
    box.textContent='';
    const badge=document.createElement('span');
    badge.className='public-number-badge';
    badge.textContent=n;
    box.append(img,badge);
    row.dataset.ce180Photo='loaded';
  }

  function ce180PumpPhotos(){
    while(ce180PhotoActive<CE180_MAX_PHOTO_LOADS&&ce180PhotoQueue.length){
      const job=ce180PhotoQueue.shift();
      if(!job?.row?.isConnected){continue;}
      ce180PhotoActive++;
      const img=new Image();
      img.className='public-candidate-photo';
      img.alt=job.name?\`Foto de \${job.name}\`:'Foto de candidato';
      img.loading='lazy';
      img.decoding='async';
      try{img.fetchPriority=job.priority||'low'}catch{}
      const finish=()=>{ce180PhotoActive=Math.max(0,ce180PhotoActive-1);ce180PumpPhotos()};
      img.onload=()=>{
        const commit=()=>{ce180CommitPhoto(job,img);finish()};
        if(typeof img.decode==='function')img.decode().catch(()=>{}).finally(commit);else commit();
      };
      img.onerror=()=>{job.row.dataset.ce180Photo='error';finish()};
      img.src=job.url;
    }
  }

  function ce180QueuePhoto(row){
    if(!catalog||!row?.isConnected)return;
    if(row.dataset.ce180Photo==='queued'||row.dataset.ce180Photo==='loaded')return;
    const box=row.querySelector('.num');
    if(!box||box.querySelector('img')){row.dataset.ce180Photo='loaded';return;}
    const n=candidateNumber(row);
    if(!n)return;
    const cargo=activeCargo();
    const c=catalogCandidate(cargo,n);
    const foto=c?.foto;
    if(!foto)return;
    row.dataset.ce180Photo='queued';
    const rect=row.getBoundingClientRect();
    const priority=rect.top<innerHeight*1.15?'high':'low';
    ce180PhotoQueue.push({row,box,n,url:foto,name:c?.nome||'',priority});
    ce180PumpPhotos();
  }

  function ce180Observer(){
    if(ce180PhotoObserver)return ce180PhotoObserver;
    if(!('IntersectionObserver'in window))return null;
    ce180PhotoObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        ce180PhotoObserver.unobserve(entry.target);
        ce180QueuePhoto(entry.target);
      }
    },{root:null,rootMargin:'900px 0px',threshold:0.01});
    return ce180PhotoObserver;
  }

  function decoratePhotos(){
    if(!catalog)return;
    const cargo=activeCargo();
    if(!cargo)return;
    const observer=ce180Observer();
    document.querySelectorAll('#leaders .leader').forEach((row,i)=>{
      const box=row.querySelector('.num');
      if(!box||box.querySelector('img'))return;
      if(row.dataset.ce180Photo==='queued'||row.dataset.ce180Photo==='loaded')return;
      const n=candidateNumber(row);
      const c=catalogCandidate(cargo,n);
      if(!c?.foto)return;
      row.dataset.ce180Photo='waiting';
      if(observer)observer.observe(row);
      else if(i<12)ce180QueuePhoto(row);
    });
  }

  async function ce180UseCatalogResponse(response){
    if(!response?.ok)return false;
    const j=await response.json();
    const next=j?.snapshot||j;
    if(!next?.candidates)return false;
    catalog=next;
    decoratePhotos();
    return true;
  }

  async function loadCatalog(){
    if(ce180CatalogPromise)return ce180CatalogPromise;
    ce180CatalogPromise=(async()=>{
      let cache=null,hadCache=false;
      try{
        cache=await caches.open(CE180_CATALOG_CACHE);
        const cached=await cache.match(CE180_CATALOG_KEY);
        if(cached){hadCache=await ce180UseCatalogResponse(cached.clone());}
      }catch{}

      let last=0;
      try{last=Number(localStorage.getItem('ce180_catalog_at')||0)}catch{}
      const fresh=hadCache&&Date.now()-last<CE180_CATALOG_TTL;
      if(!fresh){
        try{
          const r=await fetch(CE180_CATALOG_KEY,{cache:'no-store'});
          if(r.ok){
            try{await cache?.put(CE180_CATALOG_KEY,r.clone())}catch{}
            await ce180UseCatalogResponse(r);
            try{localStorage.setItem('ce180_catalog_at',String(Date.now()))}catch{}
            return;
          }
        }catch{}
      }else return;

      if(!catalog){
        try{
          const r=await fetch('/data/candidate-catalog.json',{cache:'force-cache'});
          if(r.ok){catalog=await r.json();decoratePhotos();}
        }catch{}
      }
    })().finally(()=>{setTimeout(()=>{ce180CatalogPromise=null},1000)});
    return ce180CatalogPromise;
  }

`;
js=js.slice(0,start)+optimized+js.slice(end);

/* ============================================================
   2) Reduz reprocessamentos globais do DOM
   ============================================================ */
const installStart=js.indexOf('  function install(){');
const installEnd=installStart>=0?js.indexOf("  if(document.readyState==='loading')",installStart):-1;
if(installStart<0||installEnd<0) throw new Error('V1.8.0: install público não localizado');
const optimizedInstall=`  let ce180ApplyPending=false;
  function ce180ScheduleApply(){
    if(ce180ApplyPending)return;
    ce180ApplyPending=true;
    setTimeout(()=>requestAnimationFrame(()=>{ce180ApplyPending=false;apply()}),90);
  }

  function install(){
    apply();
    loadCatalog();
    setTimeout(ce180ScheduleApply,300);
    const obs=new MutationObserver(ce180ScheduleApply);
    obs.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',e=>{
      if(e.target.closest('#cargoTabs,button[data-cargo]'))setTimeout(()=>{ce180ScheduleApply();decoratePhotos()},60);
    },true);
    window.addEventListener('pageshow',ce180ScheduleApply);
  }
`;
js=js.slice(0,installStart)+optimizedInstall+js.slice(installEnd);
write(publicJsPath,js);
new Function(js);

/* ============================================================
   3) Evita duplicação do sistema antigo de fotos na área pública
   ============================================================ */
let legacy=read(legacyPhotoPath);
if(!legacy.includes('CE180_PUBLIC_PATH')){
  legacy=legacy.replace("  const MAP_URL='/data/candidate-photo-map.json';",`  const MAP_URL='/data/candidate-photo-map.json';\n  const CE180_PUBLIC_PATH=new Set(['/','/index.html','/transparencia.html']).has(location.pathname);`);
  legacy=legacy.replace("  async function install(){\n    try{const r=await fetch(MAP_URL,{cache:'no-store'});",`  async function install(){\n    if(CE180_PUBLIC_PATH&&!document.getElementById('candidateCatalog'))return;\n    try{const r=await fetch(MAP_URL,{cache:'force-cache'});`);
  legacy=legacy.replace('  function decorateTransparency(){\n    const root=',`  function decorateTransparency(){\n    if(CE180_PUBLIC_PATH)return;\n    const root=`);
  legacy=legacy.replace('  function decorateGenericResults(){\n    document.querySelectorAll',`  function decorateGenericResults(){\n    if(CE180_PUBLIC_PATH)return;\n    document.querySelectorAll`);
  legacy=legacy.replace("    const mo=new MutationObserver(schedule); mo.observe(document.body,{childList:true,subtree:true});\n    document.addEventListener('click',schedule,true);",`    const target=document.getElementById('candidateCatalog')||(CE180_PUBLIC_PATH?null:document.body);\n    if(target){const mo=new MutationObserver(schedule);mo.observe(target,{childList:true,subtree:true});}\n    if(!CE180_PUBLIC_PATH)document.addEventListener('click',schedule,true);`);
}
write(legacyPhotoPath,legacy);
new Function(legacy);

/* ============================================================
   4) CSS de renderização progressiva
   ============================================================ */
const css=`
/* V1.8.0 — desempenho e estabilidade visual */
#leaders .leader{content-visibility:auto;contain-intrinsic-size:76px}
#leaders .public-candidate-photo{background:#eef3f5;transform:translateZ(0)}
#leaders .leader[data-ce180-photo="waiting"] .num,#leaders .leader[data-ce180-photo="queued"] .num{transition:background .18s ease}
@media(prefers-reduced-motion:reduce){#leaders .leader .num{transition:none!important}}
`;
write(`${pub}/v180-performance.css`,css);

for(const page of pages){
  let html=read(page);
  if(!html.includes('/v180-performance.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v180-performance.css?v=180">\n</head>');
  html=html.replace(/v130-public\.js\?v=\d+/g,'v130-public.js?v=180');
  html=html.replace(/v0241-photos\.js\?v=\d+/g,'v0241-photos.js?v=180');
  write(page,html);
}

/* ============================================================
   5) Novo cache do PWA
   ============================================================ */
let sw=read(swPath);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.8.0-unified';");
if(!sw.includes("'/v180-performance.css'")){
  sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v180-performance.css'"+b);
}
write(swPath,sw);

if(!read(publicJsPath).includes('CE180_MAX_PHOTO_LOADS'))throw new Error('V1.8.0: optimized photo loader missing');
if(!read(publicJsPath).includes('rootMargin:\'900px 0px\''))throw new Error('V1.8.0: lazy observer missing');
if(!read(legacyPhotoPath).includes('CE180_PUBLIC_PATH'))throw new Error('V1.8.0: duplicate photo guard missing');
console.log('V1.8.0 applied: progressive photo loading, catalog cache and reduced DOM work enabled.');
