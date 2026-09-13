import fs from 'node:fs';

const pub='/app/public';
const serverPath='/app/server.mjs';
const adminHtmlPath=`${pub}/admin/index.html`;
const swPath=`${pub}/service-worker.js`;
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(serverPath);

if(!server.includes("import * as ce178fs from 'node:fs';")){
  throw new Error('V1.7.9: V1.7.8 filesystem layer not found');
}
if(!server.includes('function ce178CreateBackup(')){
  throw new Error('V1.7.9: V1.7.8 backup engine not found');
}

/* ============================================================
   1) Restauração antes de abrir o SQLite
   ============================================================ */
if(!server.includes('CE179 startup restore preflight')){
  const dbMatch=server.match(/(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*new\s+DatabaseSync\s*\(/);
  if(!dbMatch || dbMatch.index==null) throw new Error('V1.7.9: DatabaseSync initialization not found');
  const lineStart=server.lastIndexOf('\n',dbMatch.index)+1;

  const startup=`// CE179 startup restore preflight
const CE179_RESTORE_MARKER='/data/restore-request.json';
const CE179_LAST_RESTORE='/data/last-restore.json';
const CE179_RESTORE_FAILED='/data/restore-failed.json';
const CE179_DB_FILE='/data/central.sqlite';
const CE179_BACKUP_DIR='/data/backups';
function ce179Stamp(d=new Date()){
  return d.toISOString().replace(/[-:]/g,'').replace(/\\.\\d{3}Z$/,'Z');
}
function ce179ValidBackupFile(file){
  return /^central-\\d{8}T\\d{6}Z-[a-z0-9_-]+\\.sqlite$/i.test(String(file||''));
}
function ce179HasSqliteHeader(path){
  try{
    const fd=ce178fs.openSync(path,'r');
    const b=Buffer.alloc(16);
    const n=ce178fs.readSync(fd,b,0,16,0);
    ce178fs.closeSync(fd);
    return n===16 && b.toString('utf8',0,16)==='SQLite format 3\\u0000';
  }catch{return false;}
}
try{
  if(ce178fs.existsSync(CE179_RESTORE_MARKER)){
    const req=JSON.parse(ce178fs.readFileSync(CE179_RESTORE_MARKER,'utf8'));
    const file=String(req?.file||'');
    if(!ce179ValidBackupFile(file)) throw new Error('invalid_restore_file');
    const source=CE179_BACKUP_DIR+'/'+file;
    if(!ce178fs.existsSync(source)) throw new Error('restore_source_not_found');
    if(!ce179HasSqliteHeader(source)) throw new Error('restore_source_not_sqlite');

    ce178fs.mkdirSync(CE179_BACKUP_DIR,{recursive:true});
    let safetyFile=null;
    if(ce178fs.existsSync(CE179_DB_FILE)){
      safetyFile='central-'+ce179Stamp()+'-pre-restore-safety.sqlite';
      ce178fs.copyFileSync(CE179_DB_FILE,CE179_BACKUP_DIR+'/'+safetyFile);
    }

    const tmp=CE179_DB_FILE+'.restore.tmp';
    ce178fs.copyFileSync(source,tmp);
    if(!ce179HasSqliteHeader(tmp)){
      try{ce178fs.unlinkSync(tmp)}catch{}
      throw new Error('restore_temp_validation_failed');
    }
    ce178fs.renameSync(tmp,CE179_DB_FILE);
    for(const suffix of ['-wal','-shm']){
      try{ce178fs.unlinkSync(CE179_DB_FILE+suffix)}catch{}
    }

    const receipt={
      ok:true,file,safetyFile,
      requestedAt:req?.requestedAt||null,
      requestedBy:req?.requestedBy||null,
      completedAt:new Date().toISOString(),
      auditRecorded:false
    };
    ce178fs.writeFileSync(CE179_LAST_RESTORE,JSON.stringify(receipt,null,2));
    try{ce178fs.unlinkSync(CE179_RESTORE_MARKER)}catch{}
    try{ce178fs.unlinkSync(CE179_RESTORE_FAILED)}catch{}
    console.log('V1.7.9 restore completed from '+file);
  }
}catch(e){
  const failure={ok:false,error:String(e?.message||e),failedAt:new Date().toISOString()};
  try{ce178fs.writeFileSync(CE179_RESTORE_FAILED,JSON.stringify(failure,null,2))}catch{}
  try{ce178fs.renameSync(CE179_RESTORE_MARKER,CE179_RESTORE_MARKER+'.failed-'+Date.now())}catch{}
  console.error('V1.7.9 restore failed:',e?.message||e);
}

`;
  server=server.slice(0,lineStart)+startup+server.slice(lineStart);
}

/* ============================================================
   2) Registra conclusão no banco restaurado
   ============================================================ */
const helperAnchor="function resultChanged(a,b) { return JSON.stringify(resultCore(a))!==JSON.stringify(resultCore(b)); }";
if(!server.includes('CE179 restore completion audit')){
  if(!server.includes(helperAnchor)) throw new Error('V1.7.9: resultChanged anchor not found');
  const audit=`${helperAnchor}
// CE179 restore completion audit
setTimeout(()=>{
  try{
    if(!ce178fs.existsSync(CE179_LAST_RESTORE))return;
    const r=JSON.parse(ce178fs.readFileSync(CE179_LAST_RESTORE,'utf8'));
    if(!r?.ok || r.auditRecorded)return;
    const actor=String(r.requestedBy||'admin');
    const now=new Date().toISOString();
    insertAudit.run(
      'backup_restore_completed',null,null,null,actor,
      JSON.stringify({file:r.file}),
      JSON.stringify({restored:true,safetyFile:r.safetyFile||null,completedAt:r.completedAt}),
      now
    );
    try{securityEvent({event:'backup_restored',outcome:'accepted',actor,details:{file:r.file,safetyFile:r.safetyFile||null,completedAt:r.completedAt}})}catch{}
    r.auditRecorded=true;
    r.auditRecordedAt=now;
    ce178fs.writeFileSync(CE179_LAST_RESTORE,JSON.stringify(r,null,2));
  }catch(e){console.error('restore completion audit failed',e?.message||e)}
},2500);
`;
  server=server.replace(helperAnchor,audit);
}

/* ============================================================
   3) Endpoints administrativos de restauração
   ============================================================ */
const routeAnchor="    if (p === '/api/admin/backups' && req.method === 'GET') {";
if(!server.includes("p === '/api/admin/backups/restore'")){
  if(!server.includes(routeAnchor)) throw new Error('V1.7.9: V1.7.8 backup route anchor not found');

  const routes=`    if (p === '/api/admin/backups/restore-status' && req.method === 'GET') {
      const user=auth(req);
      if(!user || user.role!=='admin') return json(res,403,{ok:false,error:'admin_required'});
      let last=null,failed=null,pending=null;
      try{if(ce178fs.existsSync(CE179_LAST_RESTORE))last=JSON.parse(ce178fs.readFileSync(CE179_LAST_RESTORE,'utf8'))}catch{}
      try{if(ce178fs.existsSync(CE179_RESTORE_FAILED))failed=JSON.parse(ce178fs.readFileSync(CE179_RESTORE_FAILED,'utf8'))}catch{}
      try{if(ce178fs.existsSync(CE179_RESTORE_MARKER))pending=JSON.parse(ce178fs.readFileSync(CE179_RESTORE_MARKER,'utf8'))}catch{}
      return json(res,200,{ok:true,pending,last,failed});
    }

    if (p === '/api/admin/backups/restore' && req.method === 'POST') {
      const user=auth(req);
      if(!user || user.role!=='admin'){
        securityEvent({event:'backup_restore_denied',outcome:'denied',actor:user?.name||null,tokenHint,sourceHash,requestId});
        return json(res,403,{ok:false,error:'admin_required'});
      }
      const body=await readBody(req);
      const file=String(body.file||'');
      const confirmation=String(body.confirmation||'').trim().toUpperCase();
      if(confirmation!=='RESTAURAR') return json(res,400,{ok:false,error:'confirmation_required',message:'Digite RESTAURAR para confirmar.'});
      if(!ce179ValidBackupFile(file)) return json(res,400,{ok:false,error:'invalid_backup'});
      const full=CE179_BACKUP_DIR+'/'+file;
      if(!ce178fs.existsSync(full)) return json(res,404,{ok:false,error:'backup_not_found'});
      if(!ce179HasSqliteHeader(full)) return json(res,422,{ok:false,error:'invalid_sqlite_backup',message:'O arquivo selecionado não passou na validação SQLite.'});
      if(ce178fs.existsSync(CE179_RESTORE_MARKER)) return json(res,409,{ok:false,error:'restore_already_pending',message:'Já existe uma restauração aguardando reinício.'});

      let preRestore=null;
      try{
        preRestore=ce178CreateBackup('pre-restore',user.name);
      }catch(e){
        securityEvent({event:'backup_restore_prebackup_failed',outcome:'error',actor:user.name,tokenHint,sourceHash,requestId,details:{message:String(e?.message||e)}});
        return json(res,500,{ok:false,error:'pre_restore_backup_failed',message:'A restauração foi cancelada porque não foi possível criar a cópia de segurança do estado atual.'});
      }

      const request={
        file,
        requestedAt:new Date().toISOString(),
        requestedBy:user.name+'#'+user.tokenHash,
        preRestoreFile:preRestore.file,
        requestId
      };
      const tmp=CE179_RESTORE_MARKER+'.tmp';
      ce178fs.writeFileSync(tmp,JSON.stringify(request,null,2));
      ce178fs.renameSync(tmp,CE179_RESTORE_MARKER);

      insertAudit.run(
        'backup_restore_requested',null,null,null,user.name+'#'+user.tokenHash,
        JSON.stringify({currentBackup:preRestore.file}),
        JSON.stringify({restoreFile:file,restartRequired:true}),
        request.requestedAt
      );
      securityEvent({event:'backup_restore_requested',outcome:'accepted',actor:user.name,tokenHint,sourceHash,requestId,details:{file,preRestoreFile:preRestore.file}});

      json(res,202,{ok:true,restarting:true,file,preRestoreFile:preRestore.file,message:'Restauração agendada. O sistema será reiniciado agora.'});
      const timer=setTimeout(()=>process.exit(75),900);
      timer.unref?.();
      return;
    }

${routeAnchor}`;
  server=server.replace(routeAnchor,routes);
}

write(serverPath,server);

/* ============================================================
   4) Interface administrativa
   ============================================================ */
const css=`
.ce179-restore{border:0;border-radius:9px;background:#fff0f0;color:#963535;padding:8px 9px;font-size:9px;font-weight:900;cursor:pointer;margin-left:5px}.ce179-restore:disabled{opacity:.55;cursor:wait}.ce179-warning{margin-top:8px;padding:9px 10px;border:1px solid #efd2d2;border-radius:10px;background:#fff8f8;color:#7f3d3d;font-size:8.8px;line-height:1.45}.ce179-backdrop{position:fixed;inset:0;z-index:30000;background:rgba(7,20,29,.7);display:grid;place-items:center;padding:14px}.ce179-modal{width:min(520px,100%);background:#fff;border-radius:17px;padding:17px;color:#17384e;box-shadow:0 22px 70px rgba(0,0,0,.32)}.ce179-modal h3{margin:8px 0 5px;font-size:18px}.ce179-modal p{margin:0 0 10px;color:#617681;font-size:10.5px;line-height:1.5}.ce179-file{padding:9px;border-radius:9px;background:#f3f7f9;font:700 9px ui-monospace,SFMono-Regular,monospace;word-break:break-all}.ce179-modal label{display:block;margin-top:12px;font-size:9px;font-weight:850;color:#536b78}.ce179-modal input{width:100%;box-sizing:border-box;margin-top:5px;padding:10px 11px;border:1px solid #cfdae0;border-radius:10px;font:inherit;font-size:11px}.ce179-actions2{display:flex;gap:8px;margin-top:13px}.ce179-actions2 button{flex:1;border:0;border-radius:10px;padding:10px 11px;font:inherit;font-size:10px;font-weight:900;cursor:pointer}.ce179-cancel{background:#edf3f6;color:#36586d}.ce179-confirm{background:#a43838;color:#fff}.ce179-confirm:disabled{opacity:.45;cursor:not-allowed}.ce179-status-ok{color:#287150}.ce179-status-bad{color:#993b3b}
`;
write(`${pub}/v179-restore.css`,css);

const js=`(()=>{'use strict';
if(!location.pathname.startsWith('/admin/'))return;
const TOKEN_KEY='ce_admin_token';
const token=()=>sessionStorage.getItem(TOKEN_KEY)||'';
const headers=extra=>({...extra,Authorization:'Bearer '+token()});
function statusEl(){return document.querySelector('#ce178Backup [data-ce178-status]')}
function enhance(){
  const root=document.querySelector('#ce178Backup');if(!root)return;
  if(!root.querySelector('.ce179-warning')){
    const p=document.createElement('div');p.className='ce179-warning';p.innerHTML='<strong>Recuperação de emergência:</strong> restaurar substitui a base atual por uma cópia anterior. Antes disso, o sistema cria automaticamente um backup do estado atual e reinicia o serviço.';root.appendChild(p)
  }
  root.querySelectorAll('.ce178-item').forEach(item=>{
    if(item.querySelector('.ce179-restore'))return;
    const dl=item.querySelector('.ce178-download[data-file]');if(!dl)return;
    const b=document.createElement('button');b.className='ce179-restore';b.type='button';b.textContent='Restaurar';b.dataset.file=dl.dataset.file;b.onclick=()=>openModal(b.dataset.file);dl.insertAdjacentElement('afterend',b)
  })
}
function openModal(file){
  document.querySelector('.ce179-backdrop')?.remove();
  const bg=document.createElement('div');bg.className='ce179-backdrop';bg.innerHTML='<section class="ce179-modal" role="dialog" aria-modal="true"><div style="font-size:24px">⚠️</div><h3>Restaurar esta cópia?</h3><p>A base atual será preservada em um backup de segurança. Em seguida, o app reiniciará e voltará com os dados desta cópia.</p><div class="ce179-file"></div><label>Para confirmar, digite <strong>RESTAURAR</strong></label><input autocomplete="off" spellcheck="false" placeholder="RESTAURAR"><div class="ce179-actions2"><button class="ce179-cancel" type="button">Cancelar</button><button class="ce179-confirm" type="button" disabled>Restaurar e reiniciar</button></div></section>';
  bg.querySelector('.ce179-file').textContent=file;const input=bg.querySelector('input'),ok=bg.querySelector('.ce179-confirm');input.oninput=()=>{ok.disabled=input.value.trim().toUpperCase()!=='RESTAURAR'};bg.querySelector('.ce179-cancel').onclick=()=>bg.remove();bg.onclick=e=>{if(e.target===bg)bg.remove()};ok.onclick=()=>restore(file,input.value,ok,bg);document.body.appendChild(bg);setTimeout(()=>input.focus(),50)
}
async function restore(file,confirmation,button,bg){
  if(!token())return;button.disabled=true;button.textContent='Preparando…';
  try{
    const res=await fetch('/api/admin/backups/restore',{method:'POST',headers:headers({'content-type':'application/json'}),body:JSON.stringify({file,confirmation})});const j=await res.json().catch(()=>null);if(!res.ok)throw new Error(j?.message||j?.error||('HTTP '+res.status));bg.remove();const s=statusEl();if(s){s.classList.add('ce179-status-ok');s.textContent='Restauração agendada. Reiniciando o sistema…'};waitForRestart()
  }catch(e){button.disabled=false;button.textContent='Restaurar e reiniciar';const s=statusEl();if(s){s.classList.add('ce179-status-bad');s.textContent='Restauração cancelada: '+String(e?.message||e)}}
}
function waitForRestart(){
  let tries=0;const t=setInterval(async()=>{tries++;try{const r=await fetch('/api/health?restore='+Date.now(),{cache:'no-store'});if(r.ok&&tries>2){clearInterval(t);location.reload();return}}catch{}if(tries>30){clearInterval(t);location.reload()}},1500)
}
async function loadStatus(){if(!token())return;try{const r=await fetch('/api/admin/backups/restore-status',{headers:headers(),cache:'no-store'});const j=await r.json().catch(()=>null);if(!r.ok||!j)return;const s=statusEl();if(j.pending&&s)s.textContent='Há uma restauração aguardando reinício.';else if(j.failed&&s){s.classList.add('ce179-status-bad');s.textContent='A última tentativa de restauração falhou: '+(j.failed.error||'erro desconhecido')}else if(j.last?.ok&&s&&!s.textContent.includes('backup(s)')){s.classList.add('ce179-status-ok');s.textContent='Última restauração concluída em '+new Date(j.last.completedAt).toLocaleString('pt-BR')}}catch{}
}
function start(){enhance();setTimeout(enhance,500);setTimeout(loadStatus,1000);new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});window.addEventListener('focus',()=>{enhance();loadStatus()})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;
write(`${pub}/v179-restore.js`,js);
new Function(js);

let html=read(adminHtmlPath);
if(!html.includes('/v179-restore.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v179-restore.css?v=179">\n</head>');
if(!html.includes('/v179-restore.js'))html=html.replace('</body>','<script src="/v179-restore.js?v=179"></script>\n</body>');
write(adminHtmlPath,html);

let sw=read(swPath);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.7.9-unified';");
if(!sw.includes("'/v179-restore.js'"))sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v179-restore.css','/v179-restore.js'"+b);
write(swPath,sw);

if(!read(serverPath).includes("p === '/api/admin/backups/restore'"))throw new Error('V1.7.9: restore endpoint injection failed');
if(!read(serverPath).includes('CE179 startup restore preflight'))throw new Error('V1.7.9: startup restore injection failed');
if(!read(adminHtmlPath).includes('/v179-restore.js'))throw new Error('V1.7.9: admin injection failed');

console.log('V1.7.9 applied: emergency restore with pre-restore backup, restart and audit enabled.');
