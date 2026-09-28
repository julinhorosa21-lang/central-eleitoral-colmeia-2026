import fs from 'node:fs';
const pub='/app/public',serverPath='/app/server.mjs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v193-operations.css',read('/src/v193-operations.css'));
write(pub+'/v193-operations.js',read('/src/v193-operations.js'));

let server=read(serverPath);
if(!server.includes('CE193_UNDO_DELETE')){
  const marker="    if (p === '/api/results' && req.method === 'DELETE') {";
  const start=server.indexOf(marker);
  if(start<0)throw new Error('V1.9.3: DELETE /api/results não localizado');
  const ending="      return json(res,200,{ok:true});\n    }";
  const endAt=server.indexOf(ending,start);
  if(endAt<0)throw new Error('V1.9.3: fim da rota DELETE não localizado');
  const end=endAt+ending.length;

  const block=String.raw`    /* CE193_UNDO_DELETE */
    if (p === '/api/results/undo-delete' && req.method === 'POST') {
      const user=auth(req);
      if(!user || user.role!=='admin') return json(res,403,{ok:false,error:'admin_required'});
      const body=await readBody(req);
      const undoToken=String(body?.undoToken||'').trim();
      const entry=ce193DeletedResults.get(undoToken);
      if(!entry || Date.now()>entry.expiresAt){
        if(entry)ce193DeletedResults.delete(undoToken);
        return json(res,410,{ok:false,error:'undo_expired'});
      }
      if(entry.tokenHash!==user.tokenHash)return json(res,403,{ok:false,error:'undo_owner_mismatch'});
      const row=entry.row,section=Number(row.section),cargo=String(row.cargo||'');
      if(getRow.get(section,cargo)){
        ce193DeletedResults.delete(undoToken);
        return json(res,409,{ok:false,error:'result_replaced'});
      }
      ce193RestoreDeletedRow(row);
      ce193DeletedResults.delete(undoToken);
      const restored=getRow.get(section,cargo);
      const now=new Date().toISOString();
      insertAudit.run('undo_delete',section,cargo,row.place_id,user.name+'#'+user.tokenHash,null,JSON.stringify(restored),now);
      securityEvent({event:'result_delete_undo',outcome:'accepted',section,cargo,actor:user.name,tokenHint,sourceHash,requestId,details:{placeId:row.place_id,restoredVersion:restored?.version||row.version||null}});
      broadcast('update',{section,cargo,placeId:row.place_id,updatedAt:now,restored:true});
      try{ce178BackupAfterResult()}catch{}
      return json(res,200,{ok:true,restored:true,section,cargo});
    }

    if (p === '/api/results' && req.method === 'DELETE') {
      const user=auth(req);
      if(!user || user.role!=='admin'){ if(tokenHint) securityEvent({event:'admin_auth_failure',outcome:'denied',actor:user?.name||null,tokenHint,sourceHash,requestId,details:{route:'/api/results',method:'DELETE'}}); return json(res,403,{ok:false,error:'admin_required'}); }
      const section=Number(u.searchParams.get('section')), cargo=String(u.searchParams.get('cargo')||'');
      const before=getRow.get(section,cargo); if(!before) return json(res,404,{ok:false,error:'not_found'});
      const undoToken=crypto.randomUUID();
      ce193DeletedResults.set(undoToken,{row:{...before},tokenHash:user.tokenHash,expiresAt:Date.now()+15000});
      while(ce193DeletedResults.size>40)ce193DeletedResults.delete(ce193DeletedResults.keys().next().value);
      deleteRow.run(section,cargo);
      const now=new Date().toISOString(); insertAudit.run('delete',section,cargo,before.place_id,user.name+'#'+user.tokenHash,JSON.stringify(before),null,now);
      securityEvent({event:'result_delete',outcome:'accepted',section,cargo,actor:user.name,tokenHint,sourceHash,requestId,details:{placeId:before.place_id,previousVersion:before.version,undoWindowMs:15000}});
      broadcast('delete',{section,cargo,updatedAt:now});
      return json(res,200,{ok:true,undo:{token:undoToken,expiresInMs:15000,section,cargo}});
    }`;

  const helpers=String.raw`
const ce193DeletedResults=new Map();
let ce193ResultColumnsCache=null;
function ce193ResultColumns(){
  if(!ce193ResultColumnsCache)ce193ResultColumnsCache=db.prepare('PRAGMA table_info(results)').all().map(x=>String(x.name));
  return ce193ResultColumnsCache;
}
function ce193RestoreDeletedRow(row){
  const allowed=new Set(ce193ResultColumns());
  const keys=Object.keys(row||{}).filter(k=>allowed.has(k));
  if(!keys.length)throw new Error('undo_restore_no_columns');
  const q=k=>'"'+String(k).replace(/"/g,'""')+'"';
  const sql='INSERT INTO results('+keys.map(q).join(',')+') VALUES('+keys.map(()=>'?').join(',')+')';
  db.prepare(sql).run(...keys.map(k=>row[k]));
}
setInterval(()=>{
  const now=Date.now();
  for(const [k,v] of ce193DeletedResults)if(!v||now>v.expiresAt)ce193DeletedResults.delete(k);
},30000).unref();
`;

  server=server.slice(0,start)+helpers+block+server.slice(end);
}
write(serverPath,server);

for(const rel of ['operacao.html','admin/index.html','admin.html','apuracao.html']){
  const p=pub+'/'+rel;if(!fs.existsSync(p))continue;let h=read(p);
  if(!h.includes('/v193-operations.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v193-operations.css?v=193">\n</head>');
  if(!h.includes('/v193-operations.js'))h=h.replace('</body>','<script src="/v193-operations.js?v=193"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.9.3-unified';");
if(!sw.includes("'/v193-operations.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v193-operations.css','/v193-operations.js',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='1.9.3';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(!server.includes("p === '/api/results/undo-delete'"))throw new Error('V1.9.3 endpoint de desfazer ausente');
if(!read(pub+'/operacao.html').includes('/v193-operations.js'))throw new Error('V1.9.3 UX ausente no operador');
if(!read(pub+'/admin/index.html').includes('/v193-operations.js'))throw new Error('V1.9.3 UX ausente no admin');
if(!read(pub+'/service-worker.js').includes("v1.9.3-unified"))throw new Error('V1.9.3 SW não atualizado');
console.log('V1.9.3 applied: save feedback, protected deletion confirmation and 15s undo window.');
