import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const SERVER=APP+'/server.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(SERVER);
const start=server.indexOf('  /* CE220_FIRST_TURN_ARCHIVE */');
const end=start>=0?server.indexOf("  console.log('V1.0.2: catálogo de candidaturas TSE sincronizável com snapshot persistente ativo.');",start):-1;
if(start<0||end<0)throw new Error('V226: second-turn migration block not found');

const purge=String.raw`  /* CE226_FIRST_TURN_PURGE
     O 1º turno não é preservado. A primeira migração limpa a apuração ativa;
     reinícios posteriores preservam os resultados do 2º turno. Arquivos e
     backups anteriores à migração são removidos. */
  const ce220Marker='/data/.ce220-second-turn-2026';
  const ce226Now=new Date().toISOString();
  const ce226AlreadyMigrated=ce220fs.existsSync(ce220Marker);

  function ce226Rm(p){
    try{ce220fs.rmSync(p,{recursive:true,force:true})}catch{}
  }
  function ce226BackupTimestamp(name){
    const m=String(name||'').match(/^central-(\d{8})T(\d{6})Z-/i);
    if(!m)return NaN;
    const d=m[1],t=m[2];
    return Date.parse(d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8)+'T'+t.slice(0,2)+':'+t.slice(2,4)+':'+t.slice(4,6)+'Z');
  }

  try{
    try{db.exec('PRAGMA wal_checkpoint(FULL)')}catch{}

    let ce226Cutoff=Date.now();
    if(ce226AlreadyMigrated){
      try{
        const old=JSON.parse(ce220fs.readFileSync(ce220Marker,'utf8'));
        const parsed=Date.parse(old?.archivedAt||old?.migratedAt||'');
        if(Number.isFinite(parsed))ce226Cutoff=parsed;
      }catch{}
    }

    if(!ce226AlreadyMigrated){
      const removed=Number(db.prepare('SELECT COUNT(*) AS n FROM results').get()?.n||0);
      if(removed>0)db.exec('BEGIN IMMEDIATE; DELETE FROM results; COMMIT;');
      try{db.exec('DELETE FROM section_reopenings')}catch{}

      const snap=storedCandidateSnapshot();
      if(snap)candidateSnapshotUpsert.run(
        JSON.stringify(ce220FilterCandidateSnapshot(snap)),
        ce226Now,
        'CE226 second-turn active catalog'
      );

      const tmp=ce220Marker+'.tmp-'+process.pid;
      ce220fs.writeFileSync(tmp,JSON.stringify({
        mode:'segundo_turno',
        turno:2,
        electionDate:'2026-10-25',
        migratedAt:ce226Now,
        firstTurnPreserved:false,
        removedFirstTurnResults:removed
      }));
      ce220fs.renameSync(tmp,ce220Marker);
      ce226Cutoff=Date.parse(ce226Now);
      console.log('CE226_FIRST_TURN_RESULTS_PURGED',JSON.stringify({removedResults:removed,electionDate:'2026-10-25'}));
    }

    const firstTurnPaths=[
      '/data/archive/primeiro-turno-resultados-2026-10-04.json',
      '/data/archive/central-primeiro-turno-2026-10-04.sqlite',
      '/data/archive/official-ea20-primeiro-turno-2026-10-04.json',
      '/data/official-ea20-colmeia.json'
    ];
    for(const p of firstTurnPaths)ce226Rm(p);

    const backupDir='/data/backups';
    let removedBackups=0;
    if(ce220fs.existsSync(backupDir)){
      for(const name of ce220fs.readdirSync(backupDir)){
        if(!/^central-\d{8}T\d{6}Z-[a-z0-9_-]+\.sqlite$/i.test(name))continue;
        const stamp=ce226BackupTimestamp(name);
        if(!Number.isFinite(stamp)||stamp<=ce226Cutoff){
          ce226Rm(backupDir+'/'+name);
          removedBackups++;
        }
      }
    }

    try{
      if(ce220fs.existsSync('/data/archive')&&ce220fs.readdirSync('/data/archive').length===0)ce220fs.rmdirSync('/data/archive');
    }catch{}

    console.log('CE226_FIRST_TURN_STORAGE_PURGED',JSON.stringify({
      removedLegacyBackups:removedBackups,
      preservedFirstTurn:false
    }));
  }catch(e){
    console.error('CE226_FIRST_TURN_PURGE_FAILED',String(e?.message||e));
    throw e;
  }
`;

server=server.slice(0,start)+purge+server.slice(end);
write(SERVER,server);

const catalogFile=PUB+'/data/candidate-catalog.json';
if(fs.existsSync(catalogFile)){
  const c=JSON.parse(read(catalogFile));
  c.version='2.1.6-runoff-only';
  c.turno=2;
  c.electionDate='2026-10-25';
  c.activeCargos=['presidente','governador'];
  write(catalogFile,JSON.stringify(c));
}

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.1.6';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

const installFile=PUB+'/v135-install.js';
if(fs.existsSync(installFile)){
  let s=read(installFile).replaceAll('/service-worker.js?v=225','/service-worker.js?v=226');
  if(!s.includes('/service-worker.js?v=226'))throw new Error('V226: service worker cachebuster missing');
  write(installFile,s);
}
for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;
  if(!fs.existsSync(p))continue;
  let h=read(p).replaceAll('/v135-install.js?v=225','/v135-install.js?v=226');
  if(!h.includes('/v135-install.js?v=226'))throw new Error('V226: installer cachebuster missing in '+rel);
  write(p,h);
}
const swFile=PUB+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.1.6-runoff-purge';");
write(swFile,sw);

const final=read(SERVER);
if(!final.includes('CE226_FIRST_TURN_PURGE'))throw new Error('V226: purge migration missing');
if(final.includes('CE223_SAFE_SECOND_TURN_ARCHIVE'))throw new Error('V226: archival migration still active');
if(final.includes("ce220fs.copyFileSync('/data/central.sqlite','/data/archive/central-primeiro-turno-2026-10-04.sqlite')"))throw new Error('V226: first-turn DB archive still active');
if(!final.includes("firstTurnPreserved:false"))throw new Error('V226: migration marker does not record purge policy');
if(!read(swFile).includes('v2.1.6-runoff-purge'))throw new Error('V226: service worker version mismatch');

console.log('V2.1.6 passed: first-turn results and legacy storage are purged; second-turn data survives subsequent restarts.');
