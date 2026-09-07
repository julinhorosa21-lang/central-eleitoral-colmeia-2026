(()=>{
'use strict';
const PATHS=new Set(['/','/index.html','/transparencia.html']);
if(!PATHS.has(location.pathname))return;

function cleanAbout(){
  /* Remove o aviso legado: o V1.3.0 tenta reatribuir id=publicSobre a ele em toda mutação. */
  document.querySelectorAll('.notice').forEach(n=>n.remove());

  const all=[...document.querySelectorAll('details.public-about-v131')];
  let keep=all[0]||null;
  all.slice(1).forEach(el=>el.remove());

  if(!keep){
    keep=document.createElement('details');
    keep.className='public-about-v131';
    keep.innerHTML='<summary>Sobre este acompanhamento</summary><div class="public-about-body"><p>Este painel acompanha localmente os boletins recebidos das 29 seções. Resultados parciais podem mudar durante a apuração e a conferência.</p><p>A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.</p><a class="public-team-link" href="/operacao.html">Acesso da equipe operacional</a></div>';
  }
  keep.id='publicSobre';

  /* Remove qualquer outro elemento que tenha recebido o mesmo id. */
  document.querySelectorAll('#publicSobre').forEach(el=>{if(el!==keep)el.removeAttribute('id')});

  const details=document.querySelector('.public-details-card');
  const foot=document.querySelector('.foot');
  if(details){
    if(details.nextElementSibling!==keep)details.after(keep);
  }else if(foot){
    if(keep.nextElementSibling!==foot)foot.before(keep);
  }else if(!keep.isConnected){
    document.querySelector('.wrap')?.appendChild(keep);
  }

  /* Garante que o botão Sobre da barra inferior abra o único bloco. */
  const b=document.querySelector('.public-bottom-nav button[data-target="publicSobre"]');
  if(b&&!b.dataset.v132){
    b.dataset.v132='1';
    b.addEventListener('click',()=>{
      cleanAbout();
      const d=document.querySelector('details.public-about-v131');
      if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})}
    },true);
  }
}

function install(){
  cleanAbout();
  setTimeout(cleanAbout,150);
  setTimeout(cleanAbout,700);
  let busy=false;
  const mo=new MutationObserver(()=>{
    if(busy)return;
    busy=true;
    requestAnimationFrame(()=>{busy=false;cleanAbout()});
  });
  mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['id']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
