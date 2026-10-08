import fs from 'node:fs';

const SERVER='/app/server.mjs';
const PUB='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(SERVER);
const start=server.indexOf('  /* CE220_FIRST_TURN_ARCHIVE */');
const end=start>=0?server.indexOf("  console.log('V1.0.2: catálogo de candidaturas TSE sincronizável com snapshot persistente ativo.');",start):-1;
if(start<0||end<0)throw new Error('V223: migration block anchors missing');

const safe=String.raw`  /* CE220_FIRST_TURN_ARCHIVE */
  /* CE223_SAFE_SECOND_TURN_ARCHIVE
     Idempotent transition: an existing first-round archive is never overwritten.
     If a previous boot archived and then crashed before writing the marker, the
     next boot finishes the reset from the preserved archive instead of replacing it. */
  const ce220Marker='/data/.ce220-second-turn-2026';
  if(!ce220fs.existsSync(ce220Marker)){
    const ce220Now=new Date().toISOString();
    const ce223ArchiveDir='/data/archive';
    const ce223ArchiveJson=ce223ArchiveDir+'/primeiro-turno-resultados-2026-10-04.json';
    const ce223ArchiveDb=ce223ArchiveDir+'/central-primeiro-turno-2026-10-04.sqlite';
    const ce223ArchiveOfficial=ce223ArchiveDir+'/official-ea20-primeiro-turno-2026-10-04.json';
    try{
      ce220fs.mkdirSync(ce223ArchiveDir,{recursive:true});
      try{db.exec('PRAGMA wal_checkpoint(FULL)')}catch{}

      const ce223HadArchive=ce220fs.existsSync(ce223ArchiveJson);
      let ce223ArchivedResults=0;
      if(ce223HadArchive){
        try{
          const previous=JSON.parse(ce220fs.readFileSync(ce223ArchiveJson,'utf8'));
          ce223ArchivedResults=Array.isArray(previous?.rows)?previous.rows.length:Number(previous?.archivedResults||0);
        }catch(e){
          throw new Error('first_round_archive_unreadable: '+String(e?.message||e));
        }
      }else{
        const ce220Rows=db.prepare('SELECT * FROM results').all();
        ce223ArchivedResults=ce220Rows.length;
        const tmp=ce223ArchiveJson+'.tmp-'+process.pid;
        ce220fs.writeFileSync(tmp,JSON.stringify({archivedAt:ce220Now,archivedResults:ce220Rows.length,rows:ce220Rows},null,2));
        ce220fs.renameSync(tmp,ce223ArchiveJson);
      }

      if(ce220fs.existsSync('/data/central.sqlite')&&!ce220fs.existsSync(ce223ArchiveDb)){
        ce220fs.copyFileSync('/data/central.sqlite',ce223ArchiveDb);
      }
      if(ce220fs.existsSync('/data/official-ea20-colmeia.json')&&!ce220fs.existsSync(ce223ArchiveOfficial)){
        ce220fs.copyFileSync('/data/official-ea20-colmeia.json',ce223ArchiveOfficial);
      }

      const ce223CurrentResults=Number(db.prepare('SELECT COUNT(*) AS n FROM results').get()?.n||0);
      if(ce223CurrentResults>0)db.exec('BEGIN IMMEDIATE; DELETE FROM results; COMMIT;');
      try{db.exec('DELETE FROM section_reopenings')}catch{}

      const snap=storedCandidateSnapshot();
      if(snap)candidateSnapshotUpsert.run(JSON.stringify(ce220FilterCandidateSnapshot(snap)),ce220Now,'CE223 safe second-turn active catalog');

      const markerTmp=ce220Marker+'.tmp-'+process.pid;
      ce220fs.writeFileSync(markerTmp,JSON.stringify({
        mode:'segundo_turno',turno:2,electionDate:'2026-10-25',
        archivedAt:ce220Now,archivedResults:ce223ArchivedResults,
        recoveredFromExistingArchive:ce223HadArchive
      }));
      ce220fs.renameSync(markerTmp,ce220Marker);
      console.log('CE223_SAFE_SECOND_TURN_RESET',JSON.stringify({
        archivedResults:ce223ArchivedResults,
        removedActiveRows:ce223CurrentResults,
        electionDate:'2026-10-25'
      }));
    }catch(e){
      console.error('CE223_SAFE_SECOND_TURN_RESET_FAILED',String(e?.message||e));
      throw e;
    }
  }
`;

server=server.slice(0,start)+safe+server.slice(end);
write(SERVER,server);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.1.3';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

const swFile=PUB+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.1.3-runoff';");
write(swFile,sw);

const final=read(SERVER);
if(!final.includes('CE223_SAFE_SECOND_TURN_ARCHIVE'))throw new Error('V223: safe migration missing');
if(!final.includes("if(ce220fs.existsSync(ce223ArchiveJson))"))throw new Error('V223: existing archive recovery missing');
if(!final.includes("ce220fs.renameSync(tmp,ce223ArchiveJson)"))throw new Error('V223: atomic archive write missing');
if(!final.includes("ce220fs.renameSync(markerTmp,ce220Marker)"))throw new Error('V223: atomic marker write missing');
if(!read(swFile).includes("v2.1.3-runoff"))throw new Error('V223: service-worker version mismatch');

console.log('V2.1.3 safety passed: first-round archive is immutable across partial restarts and second-round reset is idempotent.');
