import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const css=`
/* V1.5.1 — acesso da equipe mais visível e separado do status */
.hero .unified-team-entry{display:flex!important;width:max-content!important;align-items:center!important;gap:7px!important;margin:11px 0 0!important;padding:8px 12px!important;border:1px solid rgba(255,255,255,.92)!important;border-radius:10px!important;background:#fff!important;color:#164b70!important;box-shadow:0 5px 14px rgba(8,39,61,.14)!important;font-size:10.5px!important;font-weight:850!important;opacity:1!important}
.hero .unified-team-entry:hover,.hero .unified-team-entry:focus-visible{background:#f5fbff!important;border-color:#d9edf8!important;box-shadow:0 0 0 3px rgba(255,255,255,.18),0 6px 16px rgba(8,39,61,.16)!important}
.hero .unified-team-entry svg{stroke:#164b70!important}
.team-access-backdrop{position:fixed;inset:0;z-index:11000;background:rgba(7,23,35,.55);display:flex;align-items:flex-end;justify-content:center;padding:12px}
.team-access-sheet{width:min(480px,100%);background:#fff;color:#17364e;border-radius:18px 18px 14px 14px;padding:17px;box-shadow:0 -18px 50px rgba(0,0,0,.24)}
.team-access-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.team-access-head h2{margin:0 0 4px;font-size:19px}.team-access-head p{margin:0;color:#657784;font-size:11px;line-height:1.45}.team-access-close{flex:0 0 auto;width:36px;height:36px;border:0;border-radius:10px;background:#edf3f6;color:#244b66;font-size:20px;cursor:pointer}
.team-access-form{display:grid;gap:10px}.team-access-label{display:block;color:#315169;font-size:11px;font-weight:800}.team-access-input-wrap{display:grid;grid-template-columns:1fr auto;align-items:center;border:1px solid #ccdbe4;border-radius:12px;background:#fff;overflow:hidden}.team-access-input{width:100%;min-width:0;border:0;outline:0;background:transparent;padding:12px 13px;color:#142f43;font:inherit;font-size:14px}.team-access-eye{height:100%;border:0;border-left:1px solid #e2e9ed;background:#f8fafb;color:#315b77;padding:0 13px;font-weight:750;cursor:pointer}.team-access-submit{border:0;border-radius:12px;background:#175f8c;color:#fff;padding:12px 14px;font:inherit;font-size:12px;font-weight:850;cursor:pointer}.team-access-submit:disabled{opacity:.62;cursor:wait}.team-access-error{min-height:18px;margin:0;color:#a12828;font-size:10.5px;line-height:1.35}.team-access-note{margin:2px 0 0;color:#71808a;font-size:10px;line-height:1.4}
@media(min-width:700px){.team-access-backdrop{align-items:center}.team-access-sheet{border-radius:18px;padding:19px}}
`;
write(`${pub}/v151-team.css`,css);

const teamJs=`(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);if(!PUBLIC.has(location.pathname))return;
function closeSheet(){document.querySelector('.team-access-backdrop')?.remove()}
async function validateKey(key){const r=await fetch('/api/whoami',{cache:'no-store',headers:{Authorization:'Bearer '+key}});let j=null;try{j=await r.json()}catch{}if(!r.ok)throw new Error(j?.error||'Chave de acesso inválida.');return j?.user||j||{}}
function openAccess(){if(document.querySelector('.team-access-backdrop'))return;document.querySelector('.unified-sheet-backdrop')?.remove();const back=document.createElement('div');back.className='team-access-backdrop';back.innerHTML='<section class="team-access-sheet" role="dialog" aria-modal="true" aria-labelledby="teamAccessTitle"><div class="team-access-head"><div><h2 id="teamAccessTitle">Acesso da equipe</h2><p>Digite sua chave. O sistema identifica automaticamente se o acesso é de operador ou de coordenação.</p></div><button class="team-access-close" type="button" aria-label="Fechar">×</button></div><form class="team-access-form"><label class="team-access-label" for="teamAccessKey">Chave de acesso</label><div class="team-access-input-wrap"><input id="teamAccessKey" class="team-access-input" type="password" inputmode="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Digite a chave"><button class="team-access-eye" type="button" aria-label="Mostrar chave">Mostrar</button></div><p class="team-access-error" aria-live="polite"></p><button class="team-access-submit" type="submit">Continuar</button><p class="team-access-note">A chave é validada pela própria Central e não aparece na área pública.</p></form></section>';const input=back.querySelector('.team-access-input'),eye=back.querySelector('.team-access-eye'),err=back.querySelector('.team-access-error'),submit=back.querySelector('.team-access-submit');back.querySelector('.team-access-close').onclick=closeSheet;back.addEventListener('click',e=>{if(e.target===back)closeSheet()});eye.onclick=()=>{const show=input.type==='password';input.type=show?'text':'password';eye.textContent=show?'Ocultar':'Mostrar';eye.setAttribute('aria-label',show?'Ocultar chave':'Mostrar chave')};back.querySelector('form').onsubmit=async e=>{e.preventDefault();const key=String(input.value||'').trim();if(!key){err.textContent='Informe a chave de acesso.';input.focus();return}err.textContent='';submit.disabled=true;submit.textContent='Validando…';try{const user=await validateKey(key);sessionStorage.setItem('ce_team_token',key);const role=String(user.role||'').toLowerCase();if(role==='admin'){sessionStorage.setItem('ce_admin_token',key);location.href='/admin/index.html?from=team&ui=151';return}location.href='/operacao.html?from=team&ui=151'+(user.section?'&section='+encodeURIComponent(user.section):'')}catch(ex){err.textContent=ex?.message||'Não foi possível validar esta chave.';submit.disabled=false;submit.textContent='Continuar';input.select()}};document.body.appendChild(back);setTimeout(()=>input.focus(),60)}
function mount(){const b=document.querySelector('.unified-team-entry');if(!b)return;b.onclick=openAccess;b.setAttribute('aria-haspopup','dialog');b.title='Entrar com chave de operador ou coordenação';}
function start(){mount();setTimeout(mount,250);setTimeout(mount,900);const mo=new MutationObserver(()=>requestAnimationFrame(mount));mo.observe(document.body,{childList:true,subtree:true})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;
write(`${pub}/v151-team.js`,teamJs);

const bridge=`(()=>{'use strict';
const q=new URLSearchParams(location.search);if(q.get('from')!=='team')return;const key=sessionStorage.getItem('ce_team_token');if(!key)return;
const nativeFetch=window.fetch.bind(window);window.fetch=(input,init={})=>{try{const raw=input instanceof Request?input.url:input;const u=new URL(raw,location.href);if(u.origin===location.origin&&u.pathname.startsWith('/api/')){const headers=new Headers(input instanceof Request?input.headers:undefined);new Headers(init.headers||{}).forEach((v,k)=>headers.set(k,v));if(!headers.has('Authorization'))headers.set('Authorization','Bearer '+key);if(input instanceof Request)return nativeFetch(new Request(input,{...init,headers}));return nativeFetch(input,{...init,headers})}}catch{}return nativeFetch(input,init)};
window.__CE_TEAM_TOKEN=key;
function visible(el){const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'}
function handoff(){const inputs=[...document.querySelectorAll('input[type="password"],input[id*="chave" i],input[name*="chave" i],input[id*="token" i],input[name*="token" i],input[id*="key" i],input[name*="key" i]')].filter(visible);for(const input of inputs){const box=input.closest('form,[role="dialog"],.modal,.sheet,.dialog,section')||input.parentElement;if(!box||box.dataset.ceTeamAuthed==='1')continue;const text=(box.textContent||'').toLowerCase();if(!/chave|operador|coordena|acesso|seção/.test(text))continue;input.value=key;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));const btn=[...box.querySelectorAll('button,input[type="submit"]')].find(b=>/entrar|acessar|validar|continuar|confirmar|liberar|autenticar|abrir/.test(String(b.textContent||b.value||'').toLowerCase()));if(btn){box.dataset.ceTeamAuthed='1';setTimeout(()=>btn.click(),80);return}if(input.form?.requestSubmit){box.dataset.ceTeamAuthed='1';setTimeout(()=>input.form.requestSubmit(),80);return}}}
function start(){handoff();const mo=new MutationObserver(()=>requestAnimationFrame(handoff));mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(handoff,300);setTimeout(handoff,900)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;
write(`${pub}/v151-operator-bridge.js`,bridge);

for(const page of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(page);
  if(!html.includes('/v151-team.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v151-team.css?v=151">\n</head>');
  if(!html.includes('/v151-team.js'))html=html.replace('</body>','<script src="/v151-team.js?v=151"></script>\n</body>');
  if(!html.includes('leadersSig')){
    const start=html.indexOf("if(!a.items.length){$('leaders').innerHTML");
    const end=start>=0?html.indexOf(';let official=0',start):-1;
    if(start<0||end<0)throw new Error(`V1.5.1: bloco de candidatos não localizado em ${page}`);
    const repl=`const leadersEl=$('leaders');const leadersSig=JSON.stringify([currentCargo,a.nominal,a.items.map(c=>[c.numero,c.nome,c.partido,c.votos])]);if(leadersEl.dataset.renderSig!==leadersSig){leadersEl.dataset.renderSig=leadersSig;if(!a.items.length){leadersEl.innerHTML='<div class="empty"><b>Ainda não há votos publicados para este cargo.</b><br>Os totais aparecerão automaticamente quando as seções forem recebidas.</div>'}else{leadersEl.innerHTML=a.items.map((c,i)=>{const share=a.nominal?c.votos/a.nominal*100:0;const name=c.nome||\`Candidato \${c.numero||''}\`;return \`<div class="leader"><div class="num">\${escapeHtml(c.numero||'—')}</div><div class="who"><b>\${escapeHtml(name)}</b><small>\${escapeHtml(c.partido||'Partido não informado')}</small></div><div class="votes"><b>\${fmt(c.votos)}</b><small>\${share.toFixed(1).replace('.',',')}%</small></div><div class="bar"><i style="width:\${Math.min(100,share)}%"></i></div></div>\`}).join('')}}let official=0`;
    html=html.slice(0,start)+repl+html.slice(end+';let official=0'.length);
  }
  write(page,html);
}

// Evita que a foto suma enquanto o navegador a recarrega; só troca o número pela foto depois de a imagem estar pronta.
let photoJs=read(`${pub}/v130-public.js`);
const pStart=photoJs.indexOf('  function decoratePhotos(){');
const pEnd=pStart>=0?photoJs.indexOf('  async function loadCatalog(){',pStart):-1;
if(pStart<0||pEnd<0)throw new Error('V1.5.1: decoratePhotos não localizado');
const stablePhotos=`  function decoratePhotos(){\n    if(!catalog)return;\n    const cargo=activeCargo();\n    if(!cargo)return;\n    document.querySelectorAll('#leaders .leader').forEach(row=>{\n      const box=row.querySelector('.num');\n      if(!box||box.querySelector('img')||box.dataset.photoLoading==='1')return;\n      const n=candidateNumber(row);\n      const c=catalogCandidate(cargo,n);\n      const foto=c?.foto;\n      if(!foto)return;\n      box.dataset.photoLoading='1';\n      const img=new Image();\n      img.className='public-candidate-photo';\n      img.alt=c?.nome?\`Foto de \${c.nome}\`:'Foto de candidato';\n      img.loading='eager';img.decoding='async';\n      img.onload=()=>{\n        if(!box.isConnected||box.querySelector('img'))return;\n        box.classList.add('public-photo-num');\n        box.textContent='';\n        const badge=document.createElement('span');badge.className='public-number-badge';badge.textContent=n;\n        box.append(img,badge);\n        delete box.dataset.photoLoading;\n      };\n      img.onerror=()=>{delete box.dataset.photoLoading;};\n      img.src=foto;\n    });\n  }\n\n`;
photoJs=photoJs.slice(0,pStart)+stablePhotos+photoJs.slice(pEnd);
write(`${pub}/v130-public.js`,photoJs);

// A chave administrativa validada na tela pública também acompanha o acesso de contingência à operação.
let adminHtml=read(`${pub}/admin/index.html`);
adminHtml=adminHtml.replaceAll('href="/operacao.html"','href="/operacao.html?from=team&ui=151"');
write(`${pub}/admin/index.html`,adminHtml);

// Ponte de autenticação carregada antes dos scripts da área operacional.
let op=read(`${pub}/operacao.html`);
if(!op.includes('/v151-operator-bridge.js'))op=op.replace('<head>','<head>\n<script src="/v151-operator-bridge.js?v=151"></script>');
write(`${pub}/operacao.html`,op);

// Atualiza o shell do PWA único para incluir os novos arquivos.
let sw=read(`${pub}/service-worker.js`);
sw=sw.replace("const VERSION='v1.5.0-unified';","const VERSION='v1.5.1-unified';");
if(!sw.includes("'/v151-team.css'"))sw=sw.replace("'/v150-unified.css','/v150-unified.js'","'/v150-unified.css','/v150-unified.js','/v151-team.css','/v151-team.js','/v151-operator-bridge.js'");
write(`${pub}/service-worker.js`,sw);

console.log('V1.5.1 applied: team access requires key on public screen, operator/admin handoff enabled, access button separated, candidate photos stabilized.');
