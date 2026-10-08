import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const SERVER=APP+'/server.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(SERVER);

/* Imports isolados para persistência remota do SQLite. */
if(!server.includes("CE231PgPool")){
  server="import { Pool as CE231PgPool } from 'pg';\nimport * as ce231fs from 'node:fs';\nimport { createHash as ce231Hash } from 'node:crypto';\n"+server;
}

/* Restaura o SQLite do Postgres/Neon ANTES de DatabaseSync abrir o arquivo. */
if(!server.includes('CE231_PERSISTENT_SQLITE_RESTORE')){
  const m=server.match(/(?:const|let|var)\s+db\s*=\s*new\s+DatabaseSync\s*\([^;]+;/);
  if(!m||m.index==null)throw new Error('V231: DatabaseSync initialization not found');
  const pos=m.index;
  const restore=String.raw`
/* CE231_PERSISTENT_SQLITE_RESTORE */
const CE231_DB_FILE='/app/runtime/central.sqlite';
const CE231_DATABASE_URL=String(process.env.DATABASE_URL||'').trim();
let ce231Pool=null;
let ce231Restored=false;

function ce231SqliteHeader(buf){
  return Buffer.isBuffer(buf)&&buf.length>=16&&buf.subarray(0,16).toString('utf8')==='SQLite format 3\u0000';
}

async function ce231RestoreBeforeOpen(){
  ce231fs.mkdirSync('/app/runtime',{recursive:true});
  if(!CE231_DATABASE_URL){
    console.warn('CE231_PERSISTENCE_DISABLED: DATABASE_URL ausente; SQLite continua efêmero.');
    return;
  }
  try{
    ce231Pool=new CE231PgPool({
      connectionString:CE231_DATABASE_URL,
      max:2,
      idleTimeoutMillis:30000,
      connectionTimeoutMillis:10000,
      ssl:CE231_DATABASE_URL.includes('localhost')?undefined:{rejectUnauthorized:false}
    });
    await ce231Pool.query("CREATE TABLE IF NOT EXISTS ce_sqlite_snapshot(id smallint PRIMARY KEY CHECK(id=1),db_bytes bytea NOT NULL,sha256 text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),reason text)");
    const q=await ce231Pool.query('SELECT db_bytes,sha256,updated_at FROM ce_sqlite_snapshot WHERE id=1');
    const row=q.rows?.[0];
    if(row?.db_bytes){
      const buf=Buffer.from(row.db_bytes);
      if(!ce231SqliteHeader(buf))throw new Error('remote_snapshot_not_sqlite');
      const sha=ce231Hash('sha256').update(buf).digest('hex');
      if(row.sha256&&String(row.sha256)!==sha)throw new Error('remote_snapshot_hash_mismatch');
      const tmp=CE231_DB_FILE+'.restore-'+process.pid;
      ce231fs.writeFileSync(tmp,buf);
      ce231fs.renameSync(tmp,CE231_DB_FILE);
      for(const suffix of ['-wal','-shm']){try{ce231fs.unlinkSync(CE231_DB_FILE+suffix)}catch{}}
      ce231Restored=true;
      console.log('CE231_REMOTE_RESTORE_OK',JSON.stringify({bytes:buf.length,sha256:sha.slice(0,16),updatedAt:row.updated_at||null}));
    }else{
      console.log('CE231_REMOTE_RESTORE_EMPTY: primeiro snapshot será criado após a inicialização.');
    }
  }catch(e){
    console.error('CE231_REMOTE_RESTORE_FAILED',String(e?.message||e));
    try{await ce231Pool?.end()}catch{}
    ce231Pool=null;
  }
}
await ce231RestoreBeforeOpen();

`;
  server=server.slice(0,pos)+restore+server.slice(pos);
}

/* Motor de snapshots após o SQLite estar aberto. */
if(!server.includes('CE231_PERSISTENT_SQLITE_SNAPSHOT')){
  const m=server.match(/(?:const|let|var)\s+db\s*=\s*new\s+DatabaseSync\s*\([^;]+;/);
  if(!m||m.index==null)throw new Error('V231: DatabaseSync initialization missing after restore injection');
  const end=m.index+m[0].length;
  const helpers=String.raw`

/* CE231_PERSISTENT_SQLITE_SNAPSHOT */
let ce231LastSha='';
let ce231LastMtime=0;
let ce231Persisting=false;
let ce231PendingReason=null;
let ce231Timer=null;

async function ce231PersistNow(reason='auto'){
  if(!ce231Pool||ce231Persisting)return false;
  if(!ce231fs.existsSync(CE231_DB_FILE))return false;
  ce231Persisting=true;
  try{
    try{db.exec('PRAGMA wal_checkpoint(FULL)')}catch{}
    const buf=ce231fs.readFileSync(CE231_DB_FILE);
    if(!ce231SqliteHeader(buf))throw new Error('local_snapshot_not_sqlite');
    const sha=ce231Hash('sha256').update(buf).digest('hex');
    if(sha===ce231LastSha)return true;
    await ce231Pool.query(
      "INSERT INTO ce_sqlite_snapshot(id,db_bytes,sha256,updated_at,reason) VALUES(1,$1,$2,now(),$3) ON CONFLICT(id) DO UPDATE SET db_bytes=EXCLUDED.db_bytes,sha256=EXCLUDED.sha256,updated_at=EXCLUDED.updated_at,reason=EXCLUDED.reason",
      [buf,sha,String(reason||'auto').slice(0,80)]
    );
    ce231LastSha=sha;
    try{ce231LastMtime=ce231fs.statSync(CE231_DB_FILE).mtimeMs}catch{}
    console.log('CE231_REMOTE_SNAPSHOT_OK',JSON.stringify({bytes:buf.length,sha256:sha.slice(0,16),reason}));
    return true;
  }catch(e){
    console.error('CE231_REMOTE_SNAPSHOT_FAILED',String(e?.message||e));
    return false;
  }finally{
    ce231Persisting=false;
    if(ce231PendingReason){
      const next=ce231PendingReason;ce231PendingReason=null;
      setTimeout(()=>ce231PersistNow(next),500);
    }
  }
}

function ce231SchedulePersist(reason='change',delay=800){
  if(!ce231Pool)return;
  if(ce231Persisting){ce231PendingReason=reason;return}
  clearTimeout(ce231Timer);
  ce231Timer=setTimeout(()=>ce231PersistNow(reason),delay);
}

setTimeout(()=>ce231SchedulePersist(ce231Restored?'startup-restored':'startup',300),1800);
setInterval(()=>{
  if(!ce231Pool||!ce231fs.existsSync(CE231_DB_FILE))return;
  try{
    const mt=ce231fs.statSync(CE231_DB_FILE).mtimeMs;
    if(mt!==ce231LastMtime){
      ce231LastMtime=mt;
      ce231SchedulePersist('mtime',900);
    }
  }catch{}
},2500).unref();

for(const sig of ['SIGTERM','SIGINT']){
  process.on(sig,()=>{
    ce231SchedulePersist('shutdown',0);
    setTimeout(()=>process.exit(0),1800).unref();
  });
}

`;
  server=server.slice(0,end)+helpers+server.slice(end);
}

/* Corrige o mecanismo de backup local para o caminho real usado no Render. */
server=server.replace("const CE178_DB_FILE='/data/central.sqlite';","const CE178_DB_FILE=CE231_DB_FILE;");
server=server.replace("const CE178_BACKUP_DIR='/data/backups';","const CE178_BACKUP_DIR='/app/runtime/backups';");
server=server.replace("const CE179_DB_FILE='/data/central.sqlite';","const CE179_DB_FILE=CE231_DB_FILE;");
server=server.replace("const CE179_BACKUP_DIR='/data/backups';","const CE179_BACKUP_DIR='/app/runtime/backups';");
server=server.replace("const CE179_RESTORE_MARKER='/data/restore-request.json';","const CE179_RESTORE_MARKER='/app/runtime/restore-request.json';");
server=server.replace("const CE179_LAST_RESTORE='/data/last-restore.json';","const CE179_LAST_RESTORE='/app/runtime/last-restore.json';");
server=server.replace("const CE179_RESTORE_FAILED='/data/restore-failed.json';","const CE179_RESTORE_FAILED='/app/runtime/restore-failed.json';");

/* O marcador do 2º turno passa a viver DENTRO do SQLite, portanto é persistido. */
if(!server.includes('CE231_RUNOFF_META')){
  const old="  const ce220Marker='/data/.ce220-second-turn-2026';\n  const ce226Now=new Date().toISOString();\n  const ce226AlreadyMigrated=ce220fs.existsSync(ce220Marker);";
  const repl="  const ce220Marker='/app/runtime/.ce220-second-turn-2026';\n  const ce226Now=new Date().toISOString();\n  /* CE231_RUNOFF_META */\n  db.exec(\"CREATE TABLE IF NOT EXISTS ce_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL)\");\n  const ce231RunoffMeta=db.prepare(\"SELECT value FROM ce_meta WHERE key='second_turn_2026'\").get();\n  const ce226AlreadyMigrated=!!ce231RunoffMeta;";
  if(!server.includes(old))throw new Error('V231: V226 marker anchor missing');
  server=server.replace(old,repl);

  const markerWrite="      ce220fs.renameSync(tmp,ce220Marker);";
  if(!server.includes(markerWrite))throw new Error('V231: V226 marker write anchor missing');
  server=server.replace(markerWrite,markerWrite+"\n      db.prepare(\"INSERT INTO ce_meta(key,value,updated_at) VALUES('second_turn_2026',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at\").run(JSON.stringify({turno:2,electionDate:'2026-10-25',migratedAt:ce226Now}),ce226Now);\n      ce231SchedulePersist('second-turn-marker',200);");
}

/* Substitui o aviso enganoso de volume quando a persistência remota estiver configurada. */
server=server.replace(
  "console.log('AVISO: banco em armazenamento efêmero. Anexe um Volume antes do uso real.');",
  "if(CE231_DATABASE_URL)console.log('Persistência CE231: SQLite protegido por snapshot remoto PostgreSQL/Neon.');else console.warn('AVISO: SQLite efêmero; configure DATABASE_URL para persistência remota.');"
);

/* Endpoint administrativo de diagnóstico, sem expor a URL/segredo. */
if(!server.includes("p === '/api/admin/persistence'")){
  const anchor="    if (p === '/api/admin/integrity' && req.method === 'GET') {";
  if(!server.includes(anchor))throw new Error('V231: admin route anchor missing');
  const route=String.raw`    if (p === '/api/admin/persistence' && req.method === 'GET') {
      const user=auth(req);
      if(!user || user.role!=='admin') return json(res,403,{ok:false,error:'admin_required'});
      let remote=null;
      if(ce231Pool){
        try{
          const q=await ce231Pool.query('SELECT sha256,updated_at,reason,octet_length(db_bytes) AS bytes FROM ce_sqlite_snapshot WHERE id=1');
          const x=q.rows?.[0]||null;
          remote=x?{configured:true,sha256:String(x.sha256||'').slice(0,16),updatedAt:x.updated_at||null,reason:x.reason||null,bytes:Number(x.bytes||0)}:{configured:true,empty:true};
        }catch(e){remote={configured:true,error:'remote_check_failed'}}
      }else remote={configured:false};
      return json(res,200,{ok:true,local:{path:CE231_DB_FILE,exists:ce231fs.existsSync(CE231_DB_FILE)},remote});
    }

`;
  server=server.replace(anchor,route+anchor);
}

write(SERVER,server);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.2.1';
  j.dependencies=j.dependencies||{};
  j.dependencies.pg='^8.13.1';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

const swFile=PUB+'/service-worker.js';
let sw=read(swFile).replace(/const VERSION='[^']+';/,"const VERSION='v2.2.1-persistent';");
write(swFile,sw);

const installFile=PUB+'/v135-install.js';
if(fs.existsSync(installFile)){
  let s=read(installFile).replaceAll('/service-worker.js?v=230','/service-worker.js?v=231');
  if(!s.includes('/service-worker.js?v=231'))throw new Error('V231: SW cachebuster missing');
  write(installFile,s);
}
for(const rel of ['index.html','transparencia.html']){
  const p=PUB+'/'+rel;if(!fs.existsSync(p))continue;
  let h=read(p).replaceAll('/v135-install.js?v=230','/v135-install.js?v=231');
  if(!h.includes('/v135-install.js?v=231'))throw new Error('V231: installer cachebuster missing in '+rel);
  write(p,h);
}

const final=read(SERVER);
if(!final.includes('CE231_PERSISTENT_SQLITE_RESTORE'))throw new Error('V231: restore layer missing');
if(!final.includes('CE231_PERSISTENT_SQLITE_SNAPSHOT'))throw new Error('V231: snapshot layer missing');
if(!final.includes('CE231_RUNOFF_META'))throw new Error('V231: persistent runoff marker missing');
if(!final.includes("p === '/api/admin/persistence'"))throw new Error('V231: persistence diagnostic endpoint missing');
if(!final.includes('const CE178_DB_FILE=CE231_DB_FILE;'))throw new Error('V231: backup DB path not fixed');
console.log('V2.2.1 persistence layer passed: SQLite remote snapshot restore/save + persistent second-turn marker enabled.');
