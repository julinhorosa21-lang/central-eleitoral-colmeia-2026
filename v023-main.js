(()=>{
  function install(){
    document.body.classList.add('v023-security');
    const badge=document.querySelector('.v022-version');
    if(badge) badge.textContent='V0.23';
    const nav=document.querySelector('.v022-quicknav');
    if(nav && !nav.querySelector('.v023-audit-link')){
      const a=document.createElement('a');
      a.className='v023-audit-link';
      a.href='/seguranca.html';
      a.textContent='Segurança';
      a.title='Painel de segurança e auditoria da coordenação';
      nav.appendChild(a);
    }
    const note=document.querySelector('.central-note');
    if(note) note.innerHTML='<b>V0.23 · Segurança e auditoria:</b> tentativas inválidas registradas, limite contra repetição excessiva, correções identificadas separadamente e trilha criptográfica de eventos para a coordenação. Recursos anteriores permanecem ativos.';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();
