import fs from 'node:fs';

const pub='/app/public';
const serverPath='/app/server.mjs';
const adminHtmlPath=`${pub}/admin/index.html`;
const swPath=`${pub}/service-worker.js`;
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(serverPath);

// Import isolado para a camada de backup, sem depender dos imports existentes do servidor.
if(!server.includes("import * as ce178fs from 'node:fs';")){
  server="import * as ce178fs from 'node:fs';\n"+server;
}

/* ============================================================
   1) Motor de backup consistente
   ============================================================ */
const helperAnchor="function resultChanged(a,b) { return JSON.stringify(resultCore(a))!==JSON.stringify(resultCore(b)); }";
if(!server.includes('function ce178CreateBackup(')){
  if(!server.includes(helperAnchor)) throw new Error('V1.7.8: helper anchor not found');

  const helpers=`const CE178_DB_FILE='/data/central.sqlite';
const CE178_BACKUP_DIR='/data/backups';
const CE178_MAX_BACKUPS=40;
let ce178LastResultBackupAt=0;

function ce178SafeReason(v){
  return String(v||'auto').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24)||'auto';
}
function ce178Stamp(d=new Date()){
  return d.toISOString().replace(/[-:]/g,'').replace(/\\.\\d{3}Z$/,'Z');
}
function ce178BackupMeta(file){
  const full=CE178_BACKUP_DIR+'/'+file;
  const st=ce178fs.statSync(full);
  const m=file.match(/^central-(\\d{8}T\\d{6}Z)-([a-z0-9_-]+)\\.sqlite$/i);
  const raw=m?.[1]||'';
  const iso=raw?raw.slice(0,4)+'-'+raw.slice(4,6)+'-'+raw.slice(6,8)+'T'+raw.slice(9,11)+':'+raw.slice(11,13)+':'+raw.slice(13,15)+'Z':st.mtime.toISOString();
  return {file,size:st.size,createdAt:iso,reason:m?.[2]||'backup'};
}
function ce178ListBackups(){
  ce178fs.mkdirSync(CE178_BACKUP_DIR,{recursive:true});
  return ce178fs.readdirSync(CE178_BACKUP_DIR)
    .filter(x=>/^central-\\d{8}T\\d{6}Z-[a-z0-9_-]+\\.sqlite$/i.test(x))
    .map(x=>{try{return ce178BackupMeta(x)}catch{return null}})
    .filter(Boolean)
    .sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
}
function ce178PruneBackups(){
  const all=ce178ListBackups();
  for(const x of all.slice(CE178_MAX_BACKUPS)){
    try{ce178fs.unlinkSync(CE178_BACKUP_DIR+'/'+x.file)}catch{}
  }
}
function ce178CreateBackup(reason='auto',actor='system'){
  ce178fs.mkdirSync(CE178_BACKUP_DIR,{recursive:true});
  if(!ce178fs.existsSync(CE178_DB_FILE)) throw new Error('database_not_found');
  try{db.exec('PRAGMA wal_checkpoint(FULL)')}catch{}
  const file='central-'+ce178Stamp()+'-'+ce178SafeReason(reason)+'.sqlite';
  const target=CE178_BACKUP_DIR+'/'+file;
  ce178fs.copyFileSync(CE178_DB_FILE,target);
  const meta=ce178BackupMeta(file);
  ce178PruneBackups();
  try{securityEvent({event:'backup_created',outcome:'accepted',actor,details:{file:meta.file,size:meta.size,reason:meta.reason}})}catch{}
  return meta;
}
function ce178BackupAfterResult(){
  const now=Date.now();
  if(now-ce178LastResultBackupAt<30000)return;
  ce178LastResultBackupAt=now;
  setTimeout(()=>{try{ce178CreateBackup('result','system')}catch(e){console.error('backup result failed',e?.message||e)}},25);
}

${helperAnchor}`;
  server=server.replace(helperAnchor,helpers);
}

/* ============================================================
   2) Backup automático: inicialização e intervalo de 15 minutos
   ============================================================ */
if(!server.includes('CE178 automatic backup schedule')){
  const scheduleAnchor='function ce178BackupAfterResult(){';
  const idx=server.indexOf(scheduleAnchor);
  if(idx<0) throw new Error('V1.7.8: schedule anchor not found');
  const end=server.indexOf('\n}\n\n',idx);
  if(end<0) throw new Error('V1.7.8: schedule helper end not found');
  const pos=end+3;
  const schedule=`// CE178 automatic backup schedule
setTimeout(()=>{try{ce178CreateBackup('startup','system')}catch(e){console.error('backup startup failed',e?.message||e)}},6000);
setInterval(()=>{try{ce178CreateBackup('auto','system')}catch(e){console.error('backup auto failed',e?.message||e)}},15*60*1000);

`;
  server=server.slice(0,pos)+schedule+server.slice(pos);
}

/* ============================================================
   3) Backup após gravações aceitas de BU
   ============================================================ */
if(!server.includes('ce178BackupAfterResult();')){
  const updateAnchor="      broadcast('update',{section,cargo,placeId,verificationStatus:status,updatedAt:now});";
  if(!server.includes(updateAnchor)) throw new Error('V1.7.8: result broadcast anchor not found');
  server=server.replace(updateAnchor,`${updateAnchor}\n      ce178BackupAfterResult();`);
}

/* ============================================================
   4) Endpoints administrativos
   ============================================================ */
const routeAnchor="    if (p === '/api/admin/integrity' && req.method === 'GET') {";
if(!server.includes("p === '/api/admin/backups'")){
  if(!server.includes(routeAnchor)) throw new Error('V1.7.8: admin route anchor not found');

  const routes=`    if (p === '/api/admin/backups' && req.method === 'GET') {
      const user=auth(req);
      if(!user || user.role!=='admin') return json(res,403,{ok:false,error:'admin_required'});
      const items=ce178ListBackups();
      return json(res,200,{ok:true,max:CE178_MAX_BACKUPS,count:items.length,items});
    }

    if (p === '/api/admin/backups' && req.method === 'POST') {
      const user=auth(req);
      if(!user || user.role!=='admin'){
        securityEvent({event:'backup_create_denied',outcome:'denied',actor:user?.name||null,tokenHint,sourceHash,requestId});
        return json(res,403,{ok:false,error:'admin_required'});
      }
      try{
        const item=ce178CreateBackup('manual',user.name);
        insertAudit.run('backup_create',null,null,null,user.name+'#'+user.tokenHash,null,JSON.stringify(item),new Date().toISOString());
        return json(res,201,{ok:true,item});
      }catch(e){
        securityEvent({event:'backup_create_failed',outcome:'error',actor:user.name,tokenHint,sourceHash,requestId,details:{message:String(e?.message||e)}});
        return json(res,500,{ok:false,error:'backup_failed',message:'Não foi possível criar o backup agora.'});
      }
    }

    if (p === '/api/admin/backups/download' && req.method === 'GET') {
      const user=auth(req);
      if(!user || user.role!=='admin') return json(res,403,{ok:false,error:'admin_required'});
      const file=String(u.searchParams.get('file')||'');
      if(!/^central-\\d{8}T\\d{6}Z-[a-z0-9_-]+\\.sqlite$/i.test(file)) return json(res,400,{ok:false,error:'invalid_backup'});
      const full=CE178_BACKUP_DIR+'/'+file;
      if(!ce178fs.existsSync(full)) return json(res,404,{ok:false,error:'backup_not_found'});
      try{
        const data=ce178fs.readFileSync(full);
        securityEvent({event:'backup_downloaded',outcome:'accepted',actor:user.name,tokenHint,sourceHash,requestId,details:{file,size:data.length}});
        res.writeHead(200,{
          'Content-Type':'application/vnd.sqlite3',
          'Content-Length':String(data.length),
          'Content-Disposition':'attachment; filename="'+file+'"',
          'Cache-Control':'no-store'
        });
        return res.end(data);
      }catch(e){
        return json(res,500,{ok:false,error:'backup_download_failed'});
      }
    }

${routeAnchor}`;
  server=server.replace(routeAnchor,routes);
}

write(serverPath,server);

/* ============================================================
   5) Painel administrativo de backups
   ============================================================ */
const css=`
.ce178-backup{margin-top:14px}.ce178-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ce178-head h3{margin:2px 0 3px;font-size:17px}.ce178-head p{margin:0;color:#6b7d88;font-size:10px;line-height:1.45}.ce178-actions{display:flex;gap:7px;flex-wrap:wrap}.ce178-btn{border:1px solid #cfdde4;background:#fff;color:#24506a;border-radius:10px;padding:9px 11px;font:inherit;font-size:10px;font-weight:850;cursor:pointer}.ce178-btn.primary{background:#174f73;color:#fff;border-color:#174f73}.ce178-btn:disabled{opacity:.55;cursor:wait}.ce178-status{margin:10px 0;padding:9px 10px;border-radius:10px;background:#f3f8fb;color:#4c6574;font-size:9.5px}.ce178-list{display:grid;gap:6px}.ce178-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 10px;border:1px solid #e0e8ec;border-radius:11px;background:#fff}.ce178-item strong{display:block;color:#193b52;font-size:10.5px}.ce178-item small{display:block;margin-top:3px;color:#73838c;font-size:8.5px}.ce178-download{border:0;border-radius:9px;background:#edf4f7;color:#24506a;padding:8px 9px;font-size:9px;font-weight:900;cursor:pointer}.ce178-empty{padding:11px;border:1px dashed #cfdde4;border-radius:10px;color:#71818a;font-size:10px}.ce178-note{margin-top:9px;color:#70808a;font-size:8.8px;line-height:1.4}@media(max-width:620px){.ce178-head{display:grid}.ce178-actions{width:100%}.ce178-btn{flex:1}.ce178-item{grid-template-columns:1fr auto}}
`;
write(`${pub}/v178-backup.css`,css);

const js=`(()=>{'use strict';
if(!location.pathname.startsWith('/admin/'))return;
const TOKEN_KEY='ce_admin_token';
const token=()=>sessionStorage.getItem(TOKEN_KEY)||'';
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':'&quot;');
const fmtSize=n=>{n=Number(n)||0;if(n<1024)return n+' B';if(n<1024*1024)return (n/1024).toFixed(1)+' KB';return (n/1024/1024).toFixed(2)+' MB'};
const fmtDate=v=>{const d=new Date(v||'');return Number.isNaN(d.getTime())?'—':d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'medium'})};
function authHeaders(extra={}){return {...extra,Authorization:'Bearer '+token()}}
function root(){return document.querySelector('#ce178Backup')}
function mount(){if(root())return;const host=document.querySelector('#secoes')||document.querySelector('main');if(!host)return;const el=document.createElement('article');el.id='ce178Backup';el.className='card pad ce178-backup';el.innerHTML='<div class="ce178-head"><div><span class="kicker">BACKUP E RECUPERAÇÃO</span><h3>Cópias automáticas da apuração</h3><p>O banco é copiado após lançamentos, na inicialização e a cada 15 minutos.</p></div><div class="ce178-actions"><button class="ce178-btn" data-ce178-refresh>Atualizar</button><button class="ce178-btn primary" data-ce178-create>Criar backup agora</button></div></div><div class="ce178-status" data-ce178-status>Carregando backups…</div><div class="ce178-list" data-ce178-list></div><p class="ce178-note">São mantidas até 40 cópias no volume persistente. Baixe periodicamente uma cópia para outro dispositivo como proteção adicional.</p>';host.appendChild(el);el.querySelector('[data-ce178-refresh]').onclick=load;el.querySelector('[data-ce178-create]').onclick=createNow;load()}
async function load(){const r=root();if(!r)return;if(!token()){r.querySelector('[data-ce178-status]').textContent='Faça login como coordenação para consultar os backups.';return}try{const res=await fetch('/api/admin/backups',{cache:'no-store',headers:authHeaders()});const j=await res.json().catch(()=>null);if(!res.ok)throw new Error(j?.error||('HTTP '+res.status));r.querySelector('[data-ce178-status]').textContent=(j.count||0)+' backup(s) disponível(is) · limite de '+(j.max||40);const items=(j.items||[]).slice(0,10);r.querySelector('[data-ce178-list]').innerHTML=items.length?items.map(x=>'<div class="ce178-item"><div><strong>'+esc(x.reason)+' · '+fmtDate(x.createdAt)+'</strong><small>'+fmtSize(x.size)+' · '+esc(x.file)+'</small></div><button class="ce178-download" data-file="'+esc(x.file)+'">Baixar</button></div>').join(''):'<div class="ce178-empty">Nenhum backup disponível ainda.</div>';r.querySelectorAll('.ce178-download').forEach(b=>b.onclick=()=>download(b.dataset.file,b))}catch(e){r.querySelector('[data-ce178-status]').textContent='Não foi possível consultar os backups agora.'}}
async function createNow(){const r=root(),b=r?.querySelector('[data-ce178-create]');if(!b||!token())return;b.disabled=true;b.textContent='Criando…';try{const res=await fetch('/api/admin/backups',{method:'POST',headers:authHeaders({'content-type':'application/json'}),body:'{}'});const j=await res.json().catch(()=>null);if(!res.ok)throw new Error(j?.message||j?.error||('HTTP '+res.status));r.querySelector('[data-ce178-status]').textContent='Backup criado com sucesso: '+j.item.file;await load()}catch(e){r.querySelector('[data-ce178-status]').textContent='Falha ao criar backup: '+String(e?.message||e)}finally{b.disabled=false;b.textContent='Criar backup agora'}}
async function download(file,b){if(!token())return;const old=b.textContent;b.disabled=true;b.textContent='Baixando…';try{const res=await fetch('/api/admin/backups/download?file='+encodeURIComponent(file),{headers:authHeaders(),cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);const blob=await res.blob();const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}catch{alert('Não foi possível baixar este backup agora.')}finally{b.disabled=false;b.textContent=old}}
function start(){mount();setTimeout(mount,500);setInterval(()=>{if(!document.hidden&&token())load()},30000)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;
write(`${pub}/v178-backup.js`,js);
new Function(js);

let html=read(adminHtmlPath);
if(!html.includes('/v178-backup.css')) html=html.replace('</head>','<link rel="stylesheet" href="/v178-backup.css?v=178">\n</head>');
if(!html.includes('/v178-backup.js')) html=html.replace('</body>','<script src="/v178-backup.js?v=178"></script>\n</body>');
write(adminHtmlPath,html);

let sw=read(swPath);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.7.8-unified';");
if(!sw.includes("'/v178-backup.js'")) sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v178-backup.css','/v178-backup.js'"+b);
write(swPath,sw);

if(!read(serverPath).includes("p === '/api/admin/backups'")) throw new Error('V1.7.8: backup endpoint injection failed');
if(!read(adminHtmlPath).includes('/v178-backup.js')) throw new Error('V1.7.8: admin backup UI injection failed');
console.log('V1.7.8 applied: automatic SQLite backups, retention and admin download panel enabled.');
