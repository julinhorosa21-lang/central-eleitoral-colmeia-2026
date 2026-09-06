(()=>{
  function install(){
    const badge=document.querySelector('.v022-version');
    if(badge) badge.textContent='V0.24';
    const nav=document.querySelector('.v022-quicknav');
    if(nav && !nav.querySelector('.v024-sim-link')){
      const a=document.createElement('a');
      a.className='v024-sim-link';
      a.href='/simulacao.html';
      a.textContent='Treinamento';
      a.title='Modo de simulação com dados fictícios e base separada';
      nav.appendChild(a);
    }
    const note=document.querySelector('.central-note');
    if(note) note.innerHTML='<b>V0.24 · Treinamento seguro:</b> modo de simulação com base de dados separada, identificação visual permanente e limpeza independente. Nenhum lançamento de treinamento entra na apuração real.';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();
