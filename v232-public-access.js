(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);if(!PUBLIC.has(location.pathname))return;
const rawFetch=window.fetch.bind(window);

function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
async function verify(key){
  const r=await rawFetch('/api/whoami',{cache:'no-store',headers:{Authorization:'Bearer '+key}});
  let j=null;try{j=await r.json()}catch{}
  const u=j?.user||j;
  if(!r.ok||!u||String(u.role||'').toLowerCase()!=='admin')throw new Error('Chave administrativa inválida.');
  sessionStorage.setItem('ce_admin_token',key);
  sessionStorage.setItem('ce_team_token',key);
  return u;
}
function auth(target){
  document.querySelector('.ce232-public-backdrop')?.remove();
  const back=document.createElement('div');back.className='ce232-public-backdrop';
  const title=target==='admin'?'Central Administrativa':'Área Operacional';
  back.innerHTML='<section class="ce232-public-login" role="dialog" aria-modal="true"><header><div><div class="ce232-kicker">ACESSO PROTEGIDO</div><h2>'+esc(title)+'</h2><p>Digite a chave administrativa para continuar.</p></div><button type="button" data-close>×</button></header><form><label>Chave administrativa</label><div class="ce232-key-row"><input type="password" autocomplete="off" autocapitalize="none" spellcheck="false"><button type="button" data-eye>Mostrar</button></div><p class="ce232-error" aria-live="polite"></p><button class="ce232-primary" type="submit">Continuar</button></form></section>';
  document.body.appendChild(back);
  const input=back.querySelector('input'),err=back.querySelector('.ce232-error'),submit=back.querySelector('.ce232-primary');
  const close=()=>back.remove();
  back.querySelector('[data-close]').onclick=close;
  back.addEventListener('click',e=>{if(e.target===back)close()});
  back.querySelector('[data-eye]').onclick=e=>{const show=input.type==='password';input.type=show?'text':'password';e.currentTarget.textContent=show?'Ocultar':'Mostrar'};
  back.querySelector('form').onsubmit=async e=>{
    e.preventDefault();
    const key=String(input.value||'').trim();
    if(!key){err.textContent='Informe a chave administrativa.';return}
    submit.disabled=true;submit.textContent='Validando…';err.textContent='';
    try{
      await verify(key);
      location.href=target==='admin'?'/admin/index.html?from=team&ui=232':'/operacao.html?from=team&ui=232';
    }catch(ex){
      err.textContent=ex?.message||'Não foi possível validar a chave.';
      submit.disabled=false;submit.textContent='Continuar';input.select();
    }
  };
  setTimeout(()=>input.focus(),50);
}
function choose(){
  document.querySelector('.ce232-public-backdrop')?.remove();
  const back=document.createElement('div');back.className='ce232-public-backdrop';
  back.innerHTML='<section class="ce232-public-login ce232-module-picker" role="dialog" aria-modal="true"><header><div><div class="ce232-kicker">ACESSO DA EQUIPE</div><h2>Escolha a área</h2><p>As áreas internas exigem a chave administrativa.</p></div><button type="button" data-close>×</button></header><div class="ce232-module-list"><button type="button" data-target="operacao"><b>Área Operacional</b><span>Escolher uma das 29 seções e registrar BU.</span></button><button type="button" data-target="admin"><b>Central Administrativa</b><span>Conferência, auditoria e administração.</span></button></div></section>';
  document.body.appendChild(back);
  const close=()=>back.remove();
  back.querySelector('[data-close]').onclick=close;
  back.addEventListener('click',e=>{if(e.target===back)close()});
  back.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>{const t=b.dataset.target;close();auth(t)});
}
document.addEventListener('click',e=>{
  const hit=e.target.closest?.('.unified-team-entry,[data-ce229-href="/operacao.html"],a[href^="/operacao.html"],a[href^="/admin/index.html"]');
  if(!hit)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  if(hit.classList.contains('unified-team-entry'))choose();
  else auth(hit.matches('a[href^="/admin/index.html"]')?'admin':'operacao');
},true);
})();