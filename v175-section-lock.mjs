import fs from 'node:fs';

const pub='/app/public';
const serverPath='/app/server.mjs';
const opPath=`${pub}/operacao.html`;
const adminJsPath=`${pub}/admin/admin-v150.js`;
const adminCssPath=`${pub}/admin/admin-v150.css`;
const swPath=`${pub}/service-worker.js`;

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(serverPath);

function replaceOnce(label, from, to){
  if(server.includes(to)) return;
  if(!server.includes(from)) throw new Error(`V1.7.5: anchor missing: ${label}`);
  server=server.replace(from,to);
}

/* ============================================================
   1) Persistência para reabertura controlada de seção
   ============================================================ */
const schemaAnchor='CREATE INDEX IF NOT EXISTS idx_security_events_event ON security_events(event);';
if(!server.includes('CREATE TABLE IF NOT EXISTS section_reopenings')){
  replaceOnce('section reopen schema', schemaAnchor, `${schemaAnchor}
CREATE TABLE IF NOT EXISTS section_reopenings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section INTEGER NOT NULL,
  reason TEXT NOT NULL,
  opened_by TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  consumed_by TEXT,
  consumed_cargo TEXT
);
CREATE INDEX IF NOT EXISTS idx_section_reopenings_section ON section_reopenings(section,id DESC);
CREATE INDEX IF NOT EXISTS idx_section_reopenings_active ON section_reopenings(section,consumed_at);`);
}

const stmtAnchor="const securityChainRows = db.prepare('SELECT * FROM security_events ORDER BY id ASC');";
if(!server.includes('const sectionReopenLatest =')){
  replaceOnce('section reopen statements', stmtAnchor, `${stmtAnchor}
const sectionReopenLatest = db.prepare('SELECT * FROM section_reopenings WHERE section=? AND consumed_at IS NULL ORDER BY id DESC LIMIT 1');
const sectionReopenInsert = db.prepare('INSERT INTO section_reopenings(section,reason,opened_by,opened_at,expires_at) VALUES(?,?,?,?,?)');
const sectionReopenConsume = db.prepare('UPDATE section_reopenings SET consumed_at=?,consumed_by=?,consumed_cargo=? WHERE id=? AND consumed_at IS NULL');
const sectionReopenRecent = db.prepare('SELECT * FROM section_reopenings WHERE section=? ORDER BY id DESC LIMIT ?');`);
}

/* ============================================================
   2) Helpers de bloqueio
   ============================================================ */
const helperAnchor="function resultChanged(a,b) { return JSON.stringify(resultCore(a))!==JSON.stringify(resultCore(b)); }";
if(!server.includes('function sectionCompleteForLock(')){
  if(!server.includes(helperAnchor)) throw new Error('V1.7.5: resultChanged helper not found');

  const helpers=`function sectionCompleteForLock(section) {
  const snap=snapshot();
  const results=snap?.results||{};
  const cargos=['presidente','governador','senador','depFederal','depEstadual'];
  return cargos.every(c=>Boolean(results[String(section)+':'+c]));
}
function activeSectionReopen(section) {
  const row=sectionReopenLatest.get(Number(section))||null;
  if(!row)return null;
  const exp=Date.parse(row.expires_at||'');
  if(!Number.isFinite(exp)||exp<=Date.now())return null;
  return row;
}
function publicSectionReopen(x) {
  if(!x)return null;
  return {
    id:x.id,
    section:Number(x.section),
    reason:x.reason,
    openedBy:displayActor(x.opened_by),
    openedAt:x.opened_at,
    expiresAt:x.expires_at,
    consumedAt:x.consumed_at||null,
    consumedBy:x.consumed_by?displayActor(x.consumed_by):null,
    consumedCargo:x.consumed_cargo||null
  };
}
function sectionLockState(section) {
  const complete=sectionCompleteForLock(section);
  const reopen=activeSectionReopen(section);
  return {section:Number(section),complete,locked:complete&&!reopen,reopen:publicSectionReopen(reopen)};
}
${helperAnchor}`;

  server=server.replace(helperAnchor,helpers);
}

/* ============================================================
   3) Endpoints administrativos
   ============================================================ */
const adminRouteAnchor="    if (p === '/api/admin/security-summary') {";
if(!server.includes("p === '/api/admin/section-lock'")){
  if(!server.includes(adminRouteAnchor)) throw new Error('V1.7.5: admin route anchor not found');

  const routes=`    if (p === '/api/admin/section-lock' && req.method === 'GET') {
      const user=auth(req);
      if(!user || user.role!=='admin') return json(res,403,{ok:false,error:'admin_required'});

      const section=Number(u.searchParams.get('section'));
      if(!sectionToPlace.get(section)) return json(res,400,{ok:false,error:'invalid_section'});

      return json(res,200,{
        ok:true,
        ...sectionLockState(section),
        recent:sectionReopenRecent.all(section,8).map(publicSectionReopen)
      });
    }

    if (p === '/api/admin/sections/reopen' && req.method === 'POST') {
      const user=auth(req);
      if(!user || user.role!=='admin'){
        securityEvent({
          event:'section_reopen_denied',
          outcome:'denied',
          actor:user?.name||null,
          tokenHint,sourceHash,requestId
        });
        return json(res,403,{ok:false,error:'admin_required'});
      }

      const body=await readBody(req);
      const section=Number(body.section);
      const placeId=sectionToPlace.get(section);
      const reason=String(body.reason||'').trim().replace(/\\s+/g,' ').slice(0,300);

      if(!placeId) return json(res,400,{ok:false,error:'invalid_section'});
      if(reason.length<8) return json(res,400,{
        ok:false,
        error:'reason_required',
        message:'Informe um motivo com pelo menos 8 caracteres.'
      });
      if(!sectionCompleteForLock(section)) return json(res,409,{
        ok:false,
        error:'section_not_complete',
        message:'A seção ainda não está concluída nos cinco cargos.'
      });

      const existing=activeSectionReopen(section);
      if(existing) return json(res,409,{
        ok:false,
        error:'section_already_reopened',
        message:'Esta seção já possui uma reabertura ativa.',
        reopen:publicSectionReopen(existing)
      });

      const openedAt=new Date().toISOString();
      const expiresAt=new Date(Date.now()+15*60*1000).toISOString();
      const actor=user.name+'#'+user.tokenHash;

      const info=sectionReopenInsert.run(section,reason,actor,openedAt,expiresAt);
      const reopen=activeSectionReopen(section);

      insertAudit.run(
        'section_reopen',
        section,
        null,
        placeId,
        actor,
        null,
        JSON.stringify({
          reopenId:Number(info.lastInsertRowid||reopen?.id||0),
          reason,
          oneCorrection:true,
          expiresAt
        }),
        openedAt
      );

      securityEvent({
        event:'section_reopened',
        outcome:'accepted',
        section,
        actor:user.name,
        tokenHint,sourceHash,requestId,
        details:{
          reason,
          reopenId:reopen?.id||null,
          oneCorrection:true,
          expiresAt
        }
      });

      broadcast('section_reopened',{section,updatedAt:openedAt,expiresAt});
      return json(res,200,{ok:true,...sectionLockState(section)});
    }

${adminRouteAnchor}`;

  server=server.replace(adminRouteAnchor,routes);
}

/* ============================================================
   4) Bloqueio no POST /api/results
   ============================================================ */
const postMarker="if (p === '/api/results' && req.method === 'POST') {";
const deleteMarker="if (p === '/api/results' && req.method === 'DELETE') {";
const postStart=server.indexOf(postMarker);
const postEnd=server.indexOf(deleteMarker,postStart);

if(postStart<0||postEnd<0) throw new Error('V1.7.5: POST /api/results not found');

let post=server.slice(postStart,postEnd);

if(!post.includes("event:'section_locked_write_denied'")){
  const guardRe=/if\(!canWrite\(user,section\)\)\{[\s\S]*?return json\(res,403,\{ok:false,error:'operator_not_allowed_for_section',section,placeId\}\);\s*\}/;
  const m=post.match(guardRe);
  if(!m) throw new Error('V1.7.5: canWrite guard not found');

  post=post.replace(m[0],`${m[0]}
      const sectionWasComplete=sectionCompleteForLock(section);
      const activeReopen=sectionWasComplete?activeSectionReopen(section):null;

      if(sectionWasComplete&&!activeReopen){
        securityEvent({
          event:'section_locked_write_denied',
          outcome:'denied',
          section,cargo,
          actor:user.name,
          tokenHint,sourceHash,requestId,
          details:{reason:'five_cargos_already_received'}
        });

        return json(res,423,{
          ok:false,
          error:'section_locked',
          message:'Esta seção já foi concluída e está protegida. A coordenação precisa reabri-la para uma correção.',
          section,cargo
        });
      }`);
}

if(!post.includes("event:'section_relocked'")){
  const broadcastAnchor="      broadcast('update',{section,cargo,placeId,verificationStatus:status,updatedAt:now});";
  if(!post.includes(broadcastAnchor)) throw new Error('V1.7.5: update broadcast anchor not found');

  post=post.replace(broadcastAnchor,`      if(sectionWasComplete&&activeReopen){
        sectionReopenConsume.run(now,user.name+'#'+user.tokenHash,cargo,activeReopen.id);

        insertAudit.run(
          'section_relock',
          section,cargo,placeId,
          user.name+'#'+user.tokenHash,
          JSON.stringify({reopenId:activeReopen.id,reason:activeReopen.reason}),
          JSON.stringify({locked:true,consumedAt:now,cargo}),
          now
        );

        securityEvent({
          event:'section_relocked',
          outcome:'accepted',
          section,cargo,
          actor:user.name,
          tokenHint,sourceHash,requestId,
          details:{reopenId:activeReopen.id,reason:activeReopen.reason}
        });
      }else if(!sectionWasComplete&&sectionCompleteForLock(section)){
        insertAudit.run(
          'section_lock',
          section,cargo,placeId,
          user.name+'#'+user.tokenHash,
          null,
          JSON.stringify({locked:true,reason:'five_cargos_received'}),
          now
        );

        securityEvent({
          event:'section_locked',
          outcome:'accepted',
          section,cargo,
          actor:user.name,
          tokenHint,sourceHash,requestId,
          details:{reason:'five_cargos_received'}
        });
      }

${broadcastAnchor}`);
}

server=server.slice(0,postStart)+post+server.slice(postEnd);
write(serverPath,server);

/* ============================================================
   5) Interface do operador
   ============================================================ */
const opCss=`
/* V1.7.5 — seção concluída protegida */
.ce175-lock-backdrop{
  position:fixed;inset:0;z-index:24000;background:rgba(5,20,31,.64);
  display:flex;align-items:flex-end;justify-content:center;padding:12px
}
.ce175-lock-sheet{
  width:min(520px,100%);background:#fff;color:#17324a;
  border-radius:20px 20px 14px 14px;padding:18px;
  box-shadow:0 -20px 58px rgba(0,0,0,.3)
}
.ce175-lock-icon{
  width:42px;height:42px;display:grid;place-items:center;
  border-radius:12px;background:#eef4f7;font-size:22px
}
.ce175-lock-sheet h2{margin:10px 0 5px;font-size:19px}
.ce175-lock-sheet p{margin:0;color:#607582;font-size:11px;line-height:1.5}
.ce175-lock-note{
  margin-top:11px!important;padding:10px 11px;border:1px solid #dbe5ea;
  border-radius:11px;background:#f7fafb;color:#36586d!important
}
.ce175-lock-close{
  width:100%;margin-top:13px;border:0;border-radius:11px;
  background:#174f73;color:#fff;padding:11px 13px;
  font:inherit;font-size:11px;font-weight:850;cursor:pointer
}
@media(min-width:700px){
  .ce175-lock-backdrop{align-items:center}
  .ce175-lock-sheet{border-radius:18px}
}
`;
write(`${pub}/v175-section-lock.css`,opCss);

const opJs=`(()=>{'use strict';
if(location.pathname!=='/operacao.html')return;

const previousFetch=window.fetch.bind(window);

function esc(v){
  return String(v??'').replace(/[&<>"]/g,m=>m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':'&quot;')
}

function showLocked(j){
  document.querySelector('.ce175-lock-backdrop')?.remove();

  const b=document.createElement('div');
  b.className='ce175-lock-backdrop';
  b.innerHTML='<section class="ce175-lock-sheet" role="dialog" aria-modal="true">'
    +'<div class="ce175-lock-icon">🔒</div>'
    +'<h2>Seção concluída e protegida</h2>'
    +'<p>'+esc(j?.message||'Esta seção já recebeu os cinco cargos e não aceita novas alterações.')+'</p>'
    +'<p class="ce175-lock-note">Para corrigir qualquer valor, a coordenação deve reabrir a seção informando o motivo. A autorização vale por 15 minutos e para uma única correção. Depois, a seção é bloqueada novamente.</p>'
    +'<button class="ce175-lock-close" type="button">Entendi</button>'
    +'</section>';

  const close=()=>b.remove();
  b.querySelector('button').onclick=close;
  b.addEventListener('click',e=>{if(e.target===b)close()});
  document.body.appendChild(b);
}

window.fetch=async function(input,init={}){
  const r=await previousFetch(input,init);

  try{
    const u=new URL(input instanceof Request?input.url:input,location.href);
    const method=String(init.method||(input instanceof Request?input.method:'GET')).toUpperCase();

    if(
      u.origin===location.origin &&
      u.pathname==='/api/results' &&
      method==='POST' &&
      r.status===423
    ){
      const j=await r.clone().json().catch(()=>null);
      showLocked(j);
    }
  }catch{}

  return r;
};
})();`;

write(`${pub}/v175-section-lock.js`,opJs);

let op=read(opPath);
if(!op.includes('/v175-section-lock.css')){
  op=op.replace('</head>','<link rel="stylesheet" href="/v175-section-lock.css?v=175">\\n</head>');
}
if(!op.includes('/v175-section-lock.js')){
  op=op.replace('</body>','<script src="/v175-section-lock.js?v=175"></script>\\n</body>');
}
write(opPath,op);

/* ============================================================
   6) Interface administrativa
   ============================================================ */
if(!fs.existsSync(adminJsPath)) throw new Error('V1.7.5: admin-v150.js not found');
if(!fs.existsSync(adminCssPath)) throw new Error('V1.7.5: admin-v150.css not found');

let adminJs=read(adminJsPath);

if(!adminJs.includes('async function ce175RefreshLock(')){
  const closeAnchor='function closeModal()';
  if(!adminJs.includes(closeAnchor)) throw new Error('V1.7.5: admin closeModal anchor missing');

  const helpers=`async function ce175RefreshLock(section){
  const box=document.querySelector('[data-ce175-lock-box]');
  if(!box)return;

  try{
    const st=await api('/api/admin/section-lock?section='+encodeURIComponent(section));
    const pill=box.querySelector('[data-ce175-lock-pill]');
    const btn=box.querySelector('[data-ce175-reopen]');
    const text=box.querySelector('[data-ce175-lock-text]');

    if(st.reopen){
      pill.textContent='REABERTURA ATIVA · 1 CORREÇÃO';
      pill.className='ce175-admin-pill open';
      btn.disabled=true;
      btn.textContent='Aguardando correção autorizada';

      const exp=st.reopen.expiresAt
        ? new Date(st.reopen.expiresAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
        : '';

      text.textContent='Motivo: '+st.reopen.reason+(exp?' · expira às '+exp:'');
    }else{
      pill.textContent=st.locked?'SEÇÃO PROTEGIDA':'NÃO BLOQUEADA';
      pill.className='ce175-admin-pill '+(st.locked?'locked':'');
      btn.disabled=!st.locked;
      btn.textContent=st.locked?'Reabrir para uma correção':'Reabertura indisponível';
      text.textContent=st.locked
        ? 'Os cinco cargos já foram recebidos.'
        : 'A seção ainda não está concluída.';
    }
  }catch{
    box.querySelector('[data-ce175-lock-text]').textContent='Não foi possível consultar o bloqueio agora.';
  }
}

async function ce175Reopen(section,btn){
  const value=prompt(
    'Informe o motivo da reabertura da seção '+String(section).padStart(2,'0')
    +'.\\n\\nA autorização valerá por 15 minutos e para uma única correção.'
  );

  if(value===null)return;

  const reason=String(value||'').trim().replace(/\\s+/g,' ');
  if(reason.length<8){
    toast('Informe um motivo com pelo menos 8 caracteres.');
    return;
  }

  btn.disabled=true;
  btn.textContent='Reabrindo…';

  try{
    await api('/api/admin/sections/reopen',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({section,reason})
    });

    toast('Seção reaberta para uma única correção.');
    await ce175RefreshLock(section);
    scheduleLoad();
  }catch(e){
    toast(e?.body?.message||'Não foi possível reabrir a seção.');
    await ce175RefreshLock(section);
  }
}

${closeAnchor}`;

  adminJs=adminJs.replace(closeAnchor,helpers);

  const openRe=/function openSection\(section\)\{[\s\S]*?\}\nasync function ce175RefreshLock/;
  const m=adminJs.match(openRe);

  if(!m) throw new Error('V1.7.5: admin openSection not found');

  const replacement=`function openSection(section){
  const x=sectionInfo(section);
  const complete=x.count===CARGO_KEYS.length;

  const lockBlock=complete
    ? '<section class="ce175-admin-lock" data-ce175-lock-box>'
      +'<div>'
      +'<span class="ce175-admin-pill locked" data-ce175-lock-pill>CONSULTANDO BLOQUEIO…</span>'
      +'<h3>Proteção da seção concluída</h3>'
      +'<p data-ce175-lock-text>Consultando autorização de correção…</p>'
      +'</div>'
      +'<button class="btn ce175-reopen-btn" type="button" data-ce175-reopen disabled>Reabrir para uma correção</button>'
      +'</section>'
    : '';

  $('modalBody').innerHTML=
    '<span class="kicker">DETALHE DA SEÇÃO</span>'
    +'<h2 id="modalTitle">Seção '+String(section).padStart(2,'0')+'</h2>'
    +'<p class="muted">'+esc(x.place?.nome||'Local não identificado')+' · '+esc(x.place?.endereco||'')+(section===49?' · Inclui a seção 113 agregada':'')+'</p>'
    +'<span class="status-pill '+x.state+'">'+sectionLabel(x.state)+' · '+x.count+'/5 cargos</span>'
    +lockBlock
    +'<div class="modal-cargos">'
    +CARGOS.map(([k,l])=>{
      const p=x.by.get(k);
      const st=p?statusForPayload(p):'waiting';
      const label=p?(st==='verified'?'Conferido/oficial':st==='divergent'?'Divergência':'Prévia local'):'Aguardando';
      return '<div class="modal-cargo"><b>'+l+'</b><span class="status-pill '+st+'">'+label+'</span></div>';
    }).join('')
    +'</div>'
    +'<div class="modal-actions">'
    +'<a class="btn" href="/operacao.html?section='+section+'">Abrir área operacional</a>'
    +'<button class="btn ghost-dark" data-close-modal>Fechar</button>'
    +'</div>';

  $('sectionModal').hidden=false;
  document.body.style.overflow='hidden';

  $('modalBody').querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=closeModal);

  const reopen=$('modalBody').querySelector('[data-ce175-reopen]');
  if(reopen){
    reopen.onclick=()=>ce175Reopen(section,reopen);
    ce175RefreshLock(section);
  }
}

async function ce175RefreshLock`;

  adminJs=adminJs.replace(openRe,replacement);
}

write(adminJsPath,adminJs);

let adminCss=read(adminCssPath);
if(!adminCss.includes('V1.7.5 — bloqueio de seção concluída')){
  adminCss+=`
/* V1.7.5 — bloqueio de seção concluída */
.ce175-admin-lock{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;
  align-items:center;margin:13px 0;padding:12px;
  border:1px solid #d6e2e8;border-radius:13px;background:#f8fbfc
}
.ce175-admin-lock h3{margin:5px 0 3px;font-size:13px;color:#18374c}
.ce175-admin-lock p{margin:0;color:#6b7d88;font-size:10px;line-height:1.4}
.ce175-admin-pill{
  display:inline-flex;padding:5px 8px;border-radius:999px;
  background:#edf2f5;color:#496170;font-size:8px;
  font-weight:900;letter-spacing:.04em
}
.ce175-admin-pill.locked{background:#edf2f5;color:#38566b}
.ce175-admin-pill.open{background:#fff4d6;color:#765c12}
.ce175-reopen-btn{white-space:nowrap}
.ce175-reopen-btn:disabled{opacity:.6}
@media(max-width:620px){
  .ce175-admin-lock{grid-template-columns:1fr}
  .ce175-reopen-btn{width:100%}
}
`;
}
write(adminCssPath,adminCss);

/* ============================================================
   7) PWA/cache
   ============================================================ */
let sw=read(swPath);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.7.5-unified';");

if(!sw.includes("'/v175-section-lock.js'")){
  sw=sw.replace(
    /(const CORE=\[[\s\S]*?)(\];)/,
    (m,a,b)=>a+",'/v175-section-lock.css','/v175-section-lock.js'"+b
  );
}
write(swPath,sw);

console.log(
  'V1.7.5 applied: completed sections lock automatically; '
  +'coordination may reopen once for 15 minutes with mandatory reason and audit trail.'
);
