(()=>{'use strict';
const path=location.pathname;
function moduleInfo(){
  if(path==='/operacao.html')return{key:'operacao',label:'Área operacional',sub:'Leitura e registro de boletins de urna'};
  if(path==='/seguranca.html')return{key:'seguranca',label:'Segurança',sub:'Auditoria, integridade e eventos'};
  if(path==='/apuracao.html')return{key:'apuracao',label:'Apuração interna',sub:'Acompanhamento e totalização local'};
  if(path==='/admin.html'||path.startsWith('/admin/'))return{key:'admin',label:'Administração',sub:'Coordenação das 29 seções'};
  return null;
}
const info=moduleInfo();if(!info)return;

function mountBar(){
  if(document.getElementById('ce201AppBar'))return;
  const bar=document.createElement('header');
  bar.id='ce201AppBar';bar.className='ce201-appbar';
  bar.innerHTML=
    '<div class="ce201-appmark" aria-hidden="true">CE</div>'+
    '<div class="ce201-appcopy"><b>Central Eleitoral Colméia 2026</b><span>'+info.sub+'</span></div>'+
    '<span class="ce201-module"><i></i>'+info.label+'</span>'+
    '<div class="ce201-appactions"><a href="/">Público</a>'+
      (info.key!=='operacao'?'<a href="/operacao.html">Operação</a>':'')+
      (info.key!=='admin'?'<a href="/admin/index.html">Admin</a>':'')+
    '</div>';
  document.body.prepend(bar);
}
function mountNote(){
  if(document.getElementById('ce201Independent'))return;
  const anchor=document.querySelector('.admin-hero,.hero,.top,.main-wrap,main');
  if(!anchor)return;
  const n=document.createElement('div');
  n.id='ce201Independent';n.className='ce201-independent';
  n.innerHTML='<b>Central independente.</b> Ferramenta local de acompanhamento e operação. A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.';
  if(anchor.matches('.admin-hero,.hero,.top'))anchor.insertAdjacentElement('afterend',n);
  else anchor.insertAdjacentElement('beforebegin',n);
}
function tuneAdmin(){
  if(info.key!=='admin')return;
  const hero=document.querySelector('.admin-hero');
  if(hero){
    const eyebrow=hero.querySelector('.eyebrow');
    const h1=hero.querySelector('h1');
    const p=hero.querySelector('p');
    if(eyebrow)eyebrow.textContent='COORDENAÇÃO · COLMÉIA/TO';
    if(h1)h1.textContent='Administração';
    if(p)p.textContent='Controle de seções, conferência, pendências e integridade operacional.';
  }
}
function tuneOperation(){
  if(info.key!=='operacao')return;
  const hero=document.querySelector('.hero,.top');
  if(!hero)return;
  const eyebrow=hero.querySelector('.eyebrow');
  const h1=hero.querySelector('h1');
  const p=hero.querySelector('p');
  if(eyebrow)eyebrow.textContent='OPERAÇÃO · COLMÉIA/TO';
  if(h1&&/oper|bolet|central/i.test(h1.textContent||''))h1.textContent='Leitura e registro de BU';
  if(p&&p.textContent.length>15)p.textContent='Leia, confira e registre os boletins de urna com validações de integridade.';
}
function apply(){
  document.body.classList.add('ce201-workspace');
  document.body.dataset.ce201Module=info.key;
  mountBar();mountNote();tuneAdmin();tuneOperation();
}
function start(){
  apply();
  [100,400,1000].forEach(ms=>setTimeout(apply,ms));
  window.addEventListener('pageshow',apply);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();