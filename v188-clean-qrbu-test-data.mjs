import fs from 'node:fs';

const serverPath='/app/server.mjs';
let server=fs.readFileSync(serverPath,'utf8');

if(!server.includes('CE188_QRBU_TEST_CLEANUP')){
  const anchor="console.log('V1.1.1: simulação e ensaio removidos da interface; mapa mantido no fluxo normal da página.');";
  if(!server.includes(anchor))throw new Error('V1.8.8: startup anchor not found');

  const cleanup=anchor+`
  /* CE188_QRBU_TEST_CLEANUP
     One-time cleanup explicitly requested by the owner on 2026-09-28.
     Preserves candidate catalog, sections, places, keys, audit/security logs and backups. */
  setTimeout(()=>{
    const marker='/data/ce188-qrbu-test-cleanup-20260928.done.json';
    try{
      if(ce178fs.existsSync(marker)){
        console.log('V1.8.8: limpeza de testes já executada; marker preservado.');
        return;
      }

      const beforeResults=Number(db.prepare('SELECT COUNT(*) AS n FROM results').get()?.n||0);
      let beforeSimulation=0;
      try{beforeSimulation=Number(simListRows.all()?.length||0)}catch{}

      const backup=ce178CreateBackup('pre-qrbu-cleanup','system');

      db.exec('BEGIN IMMEDIATE');
      try{
        db.exec('DELETE FROM results');
        try{db.exec('DELETE FROM section_reopenings')}catch{}
        db.exec('COMMIT');
      }catch(e){
        try{db.exec('ROLLBACK')}catch{}
        throw e;
      }

      let simulationDeleted=0;
      try{
        simulationDeleted=Number(simDeleteAll.run()?.changes||beforeSimulation||0);
      }catch{}

      const afterResults=Number(db.prepare('SELECT COUNT(*) AS n FROM results').get()?.n||0);
      const meta={
        executedAt:new Date().toISOString(),
        reason:'cleanup-qrbu-test-votes',
        beforeResults,
        afterResults,
        simulationDeleted,
        backupFile:backup?.file||null
      };
      ce178fs.writeFileSync(marker,JSON.stringify(meta,null,2));

      try{
        insertAudit.run('qrbu_test_cleanup',null,null,null,'system',JSON.stringify({results:beforeResults,simulation:beforeSimulation}),JSON.stringify({results:afterResults,simulationDeleted,backupFile:backup?.file||null}),meta.executedAt);
      }catch{}
      try{
        securityEvent({event:'qrbu_test_cleanup',outcome:'accepted',actor:'system',details:meta});
      }catch{}

      console.log('V1.8.8: votos de teste QRBU removidos',JSON.stringify(meta));
      try{broadcast('update',{type:'cleanup',updatedAt:meta.executedAt})}catch{}
    }catch(e){
      console.error('V1.8.8: falha na limpeza de votos de teste QRBU',String(e?.stack||e?.message||e));
    }
  },3500);
`;
  server=server.replace(anchor,cleanup);
  fs.writeFileSync(serverPath,server);
}

if(!server.includes('CE188_QRBU_TEST_CLEANUP'))throw new Error('V1.8.8: cleanup injection failed');
console.log('V1.8.8 patch applied: one-time QRBU test vote cleanup armed with pre-cleanup backup.');
