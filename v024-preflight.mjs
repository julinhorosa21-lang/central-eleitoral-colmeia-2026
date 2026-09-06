import {readFileSync,existsSync} from 'node:fs';
const server=readFileSync('/app/server.mjs','utf8');
const required=[
  "version:'0.24.0'",
  "new DatabaseSync(path.join(RUNTIME, 'simulation.sqlite'))",
  'CREATE TABLE IF NOT EXISTS simulation_results',
  "'/api/sim/meta'",
  "'/api/sim/snapshot'",
  "'/api/sim/results'",
  "'/api/sim/reset'",
  "'/api/sim/export'",
  'simInsertRow.run',
  'simUpdateRow.run',
  'simulationSnapshot()',
  "event:'simulation_write'"
];
for(const token of required) if(!server.includes(token)) throw new Error('V0.24 preflight: missing '+token);
for(const file of ['/app/public/simulacao.html','/app/public/v024-main.js','/app/public/service-worker.js']) if(!existsSync(file)) throw new Error('V0.24 preflight: missing '+file);
const sw=readFileSync('/app/public/service-worker.js','utf8');
if(!sw.includes("VERSION='v0.24.0'")) throw new Error('V0.24 preflight: wrong service worker version');
if(!sw.includes("'/simulacao.html'")||!sw.includes("'/v024-main.js'")) throw new Error('V0.24 preflight: simulation assets not precached');
const simStart=server.indexOf("if (p === '/api/sim/results' && req.method === 'POST')");
const simEnd=server.indexOf("if (p === '/api/sim/reset'",simStart);
if(simStart<0||simEnd<0) throw new Error('V0.24 preflight: simulation route boundaries missing');
const simRoute=server.slice(simStart,simEnd);
for(const forbidden of ['insertRow.run(','updateRow.run(','deleteRow.run(']) if(simRoute.includes(forbidden)) throw new Error('V0.24 preflight: simulation route touches real results via '+forbidden);
if(!simRoute.includes('simInsertRow.run')||!simRoute.includes('simUpdateRow.run')) throw new Error('V0.24 preflight: simulation route does not use isolated statements');
const snapStart=server.indexOf('function snapshot()');
const snapEnd=server.indexOf('function simulationSnapshot()',snapStart);
if(snapStart<0||snapEnd<0) throw new Error('V0.24 preflight: real snapshot boundary missing');
const realSnapshot=server.slice(snapStart,snapEnd);
if(!realSnapshot.includes('listRows.all()')) throw new Error('V0.24 preflight: real snapshot no longer reads real results');
if(realSnapshot.includes('simListRows')) throw new Error('V0.24 preflight: real snapshot contaminated by simulation data');
console.log('V0.24 preflight: separate simulation DB, isolated routes, real snapshot separation and PWA assets verified.');
