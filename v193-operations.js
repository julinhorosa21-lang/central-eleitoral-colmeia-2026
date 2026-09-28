(()=>{'use strict';
const PATHS=new Set(['/operacao.html','/admin/index.html','/admin.html','/apuracao.html']);
if(!PATHS.has(location.pathname))return;

const previousFetch=window.fetch.bind(window);
const CARGO={
  presidente:'Presidente',
  governador:'Governador',
  senador:'Senador',
  depFederal:'Deputado Federal',
  depEstadual:'Deputado Estadual'
};
let statusTimer=null,undoNode=null,undoTimer=null,deletePending=false;

function status(message,kind='',busy=false,ttl=2400){
  document.querySelector('.ce193-status')?.remove();
  clearTimeout(statusTimer);
  const el=document.createElement('div');
  el.className='ce193-status'+(kind?' '+kind:'');
  el.setAttribute('role','status');
  if(busy){const sp=document.createElement('i');sp.className='ce193-spinner';sp.setAttribute('aria-hidden','true');el.appendChild(sp)}
  const txt=document.createElement('span');txt.textContent=message;el.appendChild(txt);
  document.body.appendChild(el);
  if(!busy&&ttl>0)statusTimer=setTimeout(()=>el.remove(),ttl);
  return el;
}
function clearStatus(){clearTimeout(statusTimer);document.querySelector('.ce193-status')?.remove()}
function esc(v){return String(v??'').replace(/[&<>"]/g,m=>m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':'&quot;')}
function cargoLabel(v){return CARGO[v]||v||'Cargo não identificado'}
function requestInfo(input,init={}){
  try{
    const req=input instanceof Request?input:null;
    const url=new URL(req?req.url:input,location.href);
    const method=String(init.method||(req?req.method:'GET')).toUpperCase();
    return{req,url,method};
  }catch{return null}
}
async function jsonClone(response){try{return await response.clone().json()}catch{return null}}
function headersFor(input,init={}){
  const h=new Headers(input instanceof Request?input.headers:undefined);
  new Headers(init.headers||{}).forEach((v,k)=>h.set(k,v));
  if(!h.has('authorization')){
    const token=sessionStorage.getItem('ce_admin_token')||sessionStorage.getItem('ce_team_token')||'';
    if(token)h.set('authorization','Bearer '+token);
  }
  h.set('content-type','application/json');
  return h;
}
function confirmDelete(section,cargo){
  return new Promise(resolve=>{
    document.querySelector('.ce193-backdrop')?.remove();
    const back=document.createElement('div');back.className='ce193-backdrop';
    back.innerHTML='<section class="ce193-dialog" role="dialog" aria-modal="true" aria-labelledby="ce193DeleteTitle"><div class="ce193-dialog-icon">!</div><h2 id="ce193DeleteTitle">Remover este resultado?</h2><p>Confira a seção e o cargo antes de continuar. A remoção será registrada no histórico de auditoria.</p><div class="ce193-delete-detail"><b>Seção '+esc(section||'—')+' · '+esc(cargoLabel(cargo))+'</b><span>O resultado deixará imediatamente a apuração atual.</span></div><p class="ce193-dialog-note">Depois da exclusão, você terá alguns segundos para desfazer a ação.</p><div class="ce193-dialog-actions"><button type="button" class="ce193-cancel">Cancelar</button><button type="button" class="ce193-danger">Remover resultado</button></div></section>';
    const done=v=>{back.remove();resolve(v)};
    back.querySelector('.ce193-cancel').onclick=()=>done(false);
    back.querySelector('.ce193-danger').onclick=()=>done(true);
    back.addEventListener('click',e=>{if(e.target===back)done(false)});
    const onKey=e=>{if(e.key==='Escape'){document.removeEventListener('keydown',onKey);done(false)}};
    document.addEventListener('keydown',onKey);
    document.body.appendChild(back);
    setTimeout(()=>back.querySelector('.ce193-cancel')?.focus(),20);
  });
}
function closeUndo(){
  clearInterval(undoTimer);undoTimer=null;
  undoNode?.remove();undoNode=null;
}
function showUndo(j,input,init){
  closeUndo();
  const token=j?.undo?.token;if(!token)return;
  const expires=Number(j?.undo?.expiresInMs||12000);
  const section=j?.undo?.section||'—',cargo=j?.undo?.cargo||'';
  const node=document.createElement('div');node.className='ce193-undo';node.setAttribute('role','status');
  node.innerHTML='<span>Resultado removido · Seção '+esc(section)+' · '+esc(cargoLabel(cargo))+' <small data-ce193-count></small></span><button type="button">Desfazer</button>';
  document.body.appendChild(node);undoNode=node;
  const count=node.querySelector('[data-ce193-count]');
  const end=Date.now()+expires;
  const tick=()=>{const left=Math.max(0,Math.ceil((end-Date.now())/1000));if(count)count.textContent='· '+left+'s';if(left<=0)closeUndo()};
  tick();undoTimer=setInterval(tick,250);
  node.querySelector('button').onclick=async()=>{
    const b=node.querySelector('button');b.disabled=true;b.textContent='Restaurando…';
    status('Restaurando resultado…','',true,0);
    try{
      const r=await previousFetch('/api/results/undo-delete',{method:'POST',headers:headersFor(input,init),body:JSON.stringify({undoToken:token}),cache:'no-store'});
      const data=await r.json().catch(()=>null);
      if(!r.ok)throw Object.assign(new Error(data?.error||'undo_failed'),{status:r.status});
      closeUndo();status('Resultado restaurado com sucesso.','ok',false,3000);
    }catch(e){
      closeUndo();
      status(e?.status===409?'Não foi possível desfazer porque um novo resultado já ocupa este cargo.':e?.status===410?'O tempo para desfazer terminou.':'Não foi possível restaurar o resultado.','bad',false,3800);
    }
  };
}
async function postFeedback(input,init){
  const el=status('Validando e salvando resultado…','',true,0);
  let response;
  try{response=await previousFetch(input,init)}
  catch(e){el.remove();status('Falha de conexão ao salvar. Tente novamente.','bad',false,3500);throw e}
  const j=await jsonClone(response);
  el.remove();
  if(response.ok)status('Resultado salvo com sucesso.','ok',false,2600);
  else if(response.status===409&&j?.error==='submission_cancelled')clearStatus();
  else if(response.status===422)status('Envio bloqueado: revise os dados do BU.','warn',false,3500);
  else if(response.status===423)status('Seção protegida. A coordenação precisa reabri-la para correção.','warn',false,4000);
  else status('Não foi possível salvar o resultado.','bad',false,3500);
  return response;
}
async function deleteFeedback(input,init,info){
  if(deletePending)return new Response(JSON.stringify({ok:false,error:'delete_in_progress'}),{status:409,headers:{'content-type':'application/json'}});
  const section=info.url.searchParams.get('section')||'',cargo=info.url.searchParams.get('cargo')||'';
  const confirmed=await confirmDelete(section,cargo);
  if(!confirmed)return new Response(JSON.stringify({ok:false,error:'delete_cancelled'}),{status:409,headers:{'content-type':'application/json'}});
  deletePending=true;
  const el=status('Removendo resultado…','',true,0);
  try{
    const response=await previousFetch(input,init);
    const j=await jsonClone(response);
    el.remove();
    if(response.ok){
      status('Resultado removido.','ok',false,1600);
      showUndo(j,input,init);
    }else if(response.status===403)status('A exclusão exige acesso da coordenação.','bad',false,3500);
    else if(response.status===404)status('Este resultado já não existe.','warn',false,3000);
    else status('Não foi possível remover o resultado.','bad',false,3500);
    return response;
  }catch(e){
    el.remove();status('Falha de conexão ao remover. Nada foi confirmado como excluído.','bad',false,4000);throw e;
  }finally{deletePending=false}
}

window.fetch=function(input,init={}){
  const info=requestInfo(input,init);
  if(!info||info.url.origin!==location.origin)return previousFetch(input,init);
  if(info.url.pathname==='/api/results'&&info.method==='POST')return postFeedback(input,init);
  if(info.url.pathname==='/api/results'&&info.method==='DELETE')return deleteFeedback(input,init,info);
  return previousFetch(input,init);
};
})();