import fs from 'node:fs';
const pub='/app/public',serverPath='/app/server.mjs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v208-analytics.js',read('/src/v208-analytics.js'));
write(pub+'/v208-admin-analytics.js',read('/src/v208-admin-analytics.js'));
write(pub+'/v208-analytics.css',read('/src/v208-analytics.css'));

let server=read(serverPath);
function replaceOnce(label,from,to){
  if(server.includes(to))return;
  if(!server.includes(from))throw new Error('V2.0.8 anchor missing: '+label);
  server=server.replace(from,to);
}

const schemaAnchor='CREATE INDEX IF NOT EXISTS idx_security_events_event ON security_events(event);';
if(!server.includes('CREATE TABLE IF NOT EXISTS app_analytics')){
  replaceOnce('analytics schema',schemaAnchor,schemaAnchor+"\nCREATE TABLE IF NOT EXISTS app_analytics (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  ts TEXT NOT NULL,\n  day TEXT NOT NULL,\n  event TEXT NOT NULL,\n  client_hash TEXT NOT NULL,\n  path TEXT NOT NULL\n);\nCREATE INDEX IF NOT EXISTS idx_app_analytics_day ON app_analytics(day);\nCREATE INDEX IF NOT EXISTS idx_app_analytics_event ON app_analytics(event);\nCREATE INDEX IF NOT EXISTS idx_app_analytics_client ON app_analytics(client_hash);");
}

const stmtAnchor="const securityChainRows = db.prepare('SELECT * FROM security_events ORDER BY id ASC');";
if(!server.includes('const ce208AnalyticsInsert =')){
  replaceOnce('analytics statements',stmtAnchor,stmtAnchor+"\nconst ce208AnalyticsInsert = db.prepare('INSERT INTO app_analytics(ts,day,event,client_hash,path) VALUES(?,?,?,?,?)');\nconst ce208AnalyticsCountEvent = db.prepare('SELECT COUNT(*) n FROM app_analytics WHERE event=?');\nconst ce208AnalyticsDistinctEvent = db.prepare('SELECT COUNT(DISTINCT client_hash) n FROM app_analytics WHERE event=?');\nconst ce208AnalyticsDistinctInstall = db.prepare(\"SELECT COUNT(DISTINCT client_hash) n FROM app_analytics WHERE event='install'\");\nconst ce208AnalyticsToday = db.prepare(\"SELECT COUNT(*) n FROM app_analytics WHERE event='access' AND day=?\");\nconst ce208AnalyticsSince = db.prepare(\"SELECT COUNT(*) n FROM app_analytics WHERE event='access' AND day>=?\");\nconst ce208AnalyticsPrune = db.prepare('DELETE FROM app_analytics WHERE day<?');");
}

const routeAnchor="    if (p === '/api/admin/security-summary') {";
if(!server.includes("p === '/api/analytics/event'")){
  if(!server.includes(routeAnchor))throw new Error('V2.0.8 admin route anchor missing');
  server=server.replace(routeAnchor,"    if (p === '/api/analytics/event' && req.method === 'POST') {\n      const body=await readBody(req);\n      const event=String(body?.event||'').trim();\n      const clientId=String(body?.clientId||'').trim();\n      const allowed=new Set(['access','install','pwa_open']);\n      if(!allowed.has(event))return json(res,400,{ok:false,error:'invalid_event'});\n      if(!/^[A-Za-z0-9_-]{16,100}$/.test(clientId))return json(res,400,{ok:false,error:'invalid_client'});\n      const clientHash=crypto.createHash('sha256').update(clientId).digest('hex').slice(0,32);\n      const rl=takeRateLimit('analytics:'+clientHash,30,60000);\n      if(!rl.ok)return json(res,429,{ok:false,error:'rate_limited'});\n      const now=new Date().toISOString(),day=now.slice(0,10);\n      const path=['/','/index.html','/transparencia.html'].includes(String(body?.path||''))?String(body.path):'/';\n      ce208AnalyticsInsert.run(now,day,event,clientHash,path);\n      if(Math.random()<0.01){\n        const cutoff=new Date(Date.now()-400*86400000).toISOString().slice(0,10);\n        try{ce208AnalyticsPrune.run(cutoff)}catch{}\n      }\n      return json(res,200,{ok:true});\n    }\n\n    if (p === '/api/admin/analytics' && req.method === 'GET') {\n      const user=auth(req);\n      if(!user || user.role!=='admin')return json(res,403,{ok:false,error:'admin_required'});\n      const today=new Date().toISOString().slice(0,10);\n      const since7=new Date(Date.now()-6*86400000).toISOString().slice(0,10);\n      return json(res,200,{\n        ok:true,\n        accesses:Number(ce208AnalyticsCountEvent.get('access')?.n||0),\n        visitors:Number(ce208AnalyticsDistinctEvent.get('access')?.n||0),\n        installs:Number(ce208AnalyticsDistinctInstall.get()?.n||0),\n        pwaOpens:Number(ce208AnalyticsCountEvent.get('pwa_open')?.n||0),\n        today:Number(ce208AnalyticsToday.get(today)?.n||0),\n        last7:Number(ce208AnalyticsSince.get(since7)?.n||0)\n      });\n    }\n\n"+routeAnchor);
}
write(serverPath,server);

for(const rel of ['index.html','transparencia.html']){
  const p=pub+'/'+rel;let h=read(p);
  if(!h.includes('/v208-analytics.js'))h=h.replace('</body>','<script src="/v208-analytics.js?v=208"></script>\n</body>');
  write(p,h);
}

for(const rel of ['admin/index.html','admin.html']){
  const p=pub+'/'+rel;if(!fs.existsSync(p))continue;let h=read(p);
  if(!h.includes('/v208-analytics.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v208-analytics.css?v=208">\n</head>');
  if(!h.includes('/v208-admin-analytics.js'))h=h.replace('</body>','<script src="/v208-admin-analytics.js?v=208"></script>\n</body>');
  write(p,h);
}

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.8-unified';");
if(!sw.includes("'/v208-analytics.js'"))sw=sw.replace('const CORE=[',"const CORE=['/v208-analytics.js','/v208-admin-analytics.js','/v208-analytics.css',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.8';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(!server.includes("p === '/api/analytics/event'"))throw new Error('V2.0.8 public analytics route missing');
if(!server.includes("p === '/api/admin/analytics'"))throw new Error('V2.0.8 admin analytics route missing');
if(!server.includes('CREATE TABLE IF NOT EXISTS app_analytics'))throw new Error('V2.0.8 analytics table missing');
if(!read(pub+'/index.html').includes('/v208-analytics.js'))throw new Error('V2.0.8 public tracker missing');
if(!read(pub+'/admin/index.html').includes('/v208-admin-analytics.js'))throw new Error('V2.0.8 admin panel missing');
if(!read(pub+'/service-worker.js').includes("v2.0.8-unified"))throw new Error('V2.0.8 service worker missing');
console.log('V2.0.8 applied: private aggregate public-access and PWA-install analytics added to admin.');
