(()=>{'use strict';
const PUBLIC=new Set(['/','/index.html','/transparencia.html']);
if(!PUBLIC.has(location.pathname))return;

const EXPECTED=29;
const CARGO_LABEL={
  presidente:'Presidente',
  governador:'Governador',
  senador:'Senador',
  depFederal:'Deputado Federal',
  depEstadual:'Deputado Estadual'
};
const ICON_SHARE='<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></svg>';
const ICON_COPY='<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';

let toastTimer=null;
function toast(msg,kind=''){
  document.querySelector('.ce191-toast')?.remove();
  const el=document.createElement('div');
  el.className='ce191-toast'+(kind?' '+kind:'');
  el.setAttribute('role','status');
  el.textContent=msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.remove(),2600);
}
function activeCargo(){return document.querySelector('#cargoTabs button.active[data-cargo]')?.dataset?.cargo||'presidente'}
function cargoLabel(cargo){return CARGO_LABEL[cargo]||'Resultado'}
function int(v){const n=parseInt(String(v||'').replace(/\D/g,''),10);return Number.isFinite(n)?n:0}
function rowNumber(row){
  return String(
    row.dataset.ce161Number||
    row.querySelector('.public-number-badge')?.textContent||
    row.querySelector('.v0241-number-badge')?.textContent||
    row.querySelector('.ce162-number-text')?.textContent||
    row.querySelector('.num')?.textContent||''
  ).match(/\d{1,5}/)?.[0]||'';
}
function partyText(row){
  const el=row.querySelector('.who small');
  if(!el)return'';
  const clone=el.cloneNode(true);
  clone.querySelectorAll('.ce187-status,.status,.badge').forEach(x=>x.remove());
  return String(clone.textContent||'').replace(/\s+/g,' ').trim();
}
function pctText(row,votes,total){
  const raw=String(row.querySelector('.votes small')?.textContent||'').trim();
  if(/\d/.test(raw)&&raw.includes('%'))return raw.replace('.',',');
  return total>0?(votes/total*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%':'0,0%';
}
function cargoDone(){
  const t=document.getElementById('cargoProgressText')?.textContent||document.getElementById('cargoProgressLabel')?.textContent||'';
  const m=String(t).match(/(\d+)\s*(?:de|\/)?\s*29/i);
  if(m)return Math.min(EXPECTED,Number(m[1])||0);
  return Math.min(EXPECTED,int(t));
}
function updatedText(){
  const overview=document.getElementById('publicUpdated')?.textContent?.trim();
  if(overview&&overview!=='Aguardando dados')return overview;
  const time=document.getElementById('mUpdated')?.textContent?.trim();
  const date=document.getElementById('mUpdatedDate')?.textContent?.trim();
  if(time&&time!=='—')return [time,date&&date!=='aguardando dados'?date:''].filter(Boolean).join(' · ');
  return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date());
}
function isTestEnvironment(){
  return document.documentElement.classList.contains('ce187-pre-election')||
         !!document.getElementById('ce187TestNotice');
}
function getRows(){
  const rows=[...document.querySelectorAll('#leaders .leader')];
  const data=rows.map((row,index)=>{
    const votes=int(row.querySelector('.votes b')?.textContent);
    return {
      index,
      votes,
      nome:String(row.querySelector('.who b')?.textContent||'Candidato').trim(),
      partido:partyText(row),
      numero:rowNumber(row),
      row
    };
  }).filter(x=>x.votes>0);
  data.sort((a,b)=>b.votes-a.votes||a.index-b.index);
  const total=data.reduce((s,x)=>s+x.votes,0);
  return data.slice(0,5).map((x,i)=>({...x,posicao:i+1,percentual:pctText(x.row,x.votes,total)}));
}
function statusInfo(done){
  if(done>=EXPECTED)return{label:'APURAÇÃO LOCAL CONCLUÍDA',short:'Concluído',color:'#16864F',bg:'#EAF7F0'};
  if(done>0)return{label:'RESULTADO PARCIAL',short:'Parcial',color:'#8B6810',bg:'#FFF7DA'};
  return{label:'AGUARDANDO RESULTADOS',short:'Aguardando',color:'#667985',bg:'#EEF2F4'};
}
function caption(){
  const cargo=cargoLabel(activeCargo()),done=cargoDone(),status=statusInfo(done),updated=updatedText();
  const test=isTestEnvironment();
  const first=test?'DADOS DE TESTE — NÃO OFICIAIS.\n\n':'';
  const middle=done>=EXPECTED
    ?'Apuração local concluída: '+done+'/'+EXPECTED+' seções.'
    :'Apuração: '+done+'/'+EXPECTED+' seções.';
  return first+'Resultado '+status.short.toLowerCase()+' para '+cargo+' em Colméia/TO.\n'+middle+'\nAtualização: '+updated+'.\n\nAcompanhamento local pela Central Eleitoral Colméia 2026. A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.';
}
async function copyCaption(){
  const text=caption();
  try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
    else{
      const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
    }
    toast('Legenda copiada.');
  }catch{toast('Não foi possível copiar a legenda.','bad')}
}
function roundRect(ctx,x,y,w,h,r,fill,stroke=null){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill()}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke()}
}
function wrapText(ctx,text,maxWidth,maxLines=2){
  const words=String(text||'').split(/\s+/).filter(Boolean),lines=[];let line='';
  for(const word of words){
    const test=line?line+' '+word:word;
    if(ctx.measureText(test).width<=maxWidth){line=test;continue}
    if(line)lines.push(line);
    line=word;
    if(lines.length>=maxLines-1)break;
  }
  if(line&&lines.length<maxLines)lines.push(line);
  if(words.length&&lines.length===maxLines){
    const joined=lines.join(' ');
    if(joined.length<String(text||'').trim().length){
      let last=lines[maxLines-1];
      while(last.length>1&&ctx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1);
      lines[maxLines-1]=last+'…';
    }
  }
  return lines;
}
function drawTextLines(ctx,lines,x,y,lineHeight){
  lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));
}
function formatVotes(v){return Number(v||0).toLocaleString('pt-BR')+' voto'+(Number(v)===1?'':'s')}
function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('blob')),'image/png',1))}
function buildCanvas(){
  const cargo=cargoLabel(activeCargo()),done=cargoDone(),status=statusInfo(done),updated=updatedText(),top=getRows(),test=isTestEnvironment();
  if(!top.length)throw new Error('sem_resultados');

  const canvas=document.createElement('canvas');
  canvas.width=1080;canvas.height=1350;
  const ctx=canvas.getContext('2d',{alpha:false});
  ctx.textBaseline='alphabetic';

  ctx.fillStyle='#F5F7F9';ctx.fillRect(0,0,1080,1350);

  // Cabeçalho institucional
  ctx.fillStyle='#123D60';ctx.fillRect(0,0,1080,236);
  ctx.fillStyle='#FFDF00';ctx.fillRect(72,56,54,6);
  ctx.font='700 27px Arial, sans-serif';ctx.fillStyle='rgba(255,255,255,.78)';ctx.fillText('CENTRAL ELEITORAL COLMÉIA 2026',72,102);
  ctx.font='800 54px Arial, sans-serif';ctx.fillStyle='#FFFFFF';ctx.fillText('Resultado · '+cargo,72,172);

  if(test){
    roundRect(ctx,72,194,390,56,12,'#FFF4C7');
    ctx.font='800 21px Arial, sans-serif';ctx.fillStyle='#6B5412';ctx.fillText('DADOS DE TESTE · NÃO OFICIAIS',92,230);
  }

  // Status
  roundRect(ctx,72,276,936,116,18,'#FFFFFF','#D8E4EA');
  roundRect(ctx,96,301,276,60,14,status.bg);
  ctx.font='800 20px Arial, sans-serif';ctx.fillStyle=status.color;ctx.fillText(status.short.toUpperCase(),118,340);
  ctx.font='800 25px Arial, sans-serif';ctx.fillStyle='#17212B';ctx.textAlign='right';ctx.fillText(done+'/'+EXPECTED+' seções',984,326);
  ctx.font='500 18px Arial, sans-serif';ctx.fillStyle='#667985';ctx.fillText('Atualizado · '+updated,984,356);
  ctx.textAlign='left';

  // Título ranking
  ctx.font='800 25px Arial, sans-serif';ctx.fillStyle='#123D60';ctx.fillText('MAIS VOTADOS NESTE MOMENTO',72,448);
  ctx.font='500 18px Arial, sans-serif';ctx.fillStyle='#667985';ctx.fillText('Até 5 candidaturas · acompanhamento local',72,479);

  const startY=510,rowH=132,gap=14;
  top.forEach((c,i)=>{
    const y=startY+i*(rowH+gap);
    roundRect(ctx,72,y,936,rowH,18,'#FFFFFF','#D8E4EA');

    // posição
    roundRect(ctx,94,y+28,64,64,13,'#123D60');
    ctx.font='800 24px Arial, sans-serif';ctx.fillStyle='#FFFFFF';ctx.textAlign='center';ctx.fillText(c.posicao+'º',126,y+68);ctx.textAlign='left';

    // número
    roundRect(ctx,178,y+28,76,64,13,'#EEF3F6');
    ctx.font='800 23px Arial, sans-serif';ctx.fillStyle='#123D60';ctx.textAlign='center';ctx.fillText(c.numero||'—',216,y+68);ctx.textAlign='left';

    // nome / partido
    ctx.font='800 25px Arial, sans-serif';ctx.fillStyle='#17212B';
    const nameLines=wrapText(ctx,c.nome,390,2);drawTextLines(ctx,nameLines,280,y+49,28);
    ctx.font='600 18px Arial, sans-serif';ctx.fillStyle='#667985';
    const meta=(c.partido?c.partido+' · ':'')+(c.numero?'nº '+c.numero:'');
    ctx.fillText(meta,280,y+101);

    // votos
    ctx.textAlign='right';
    ctx.font='800 29px Arial, sans-serif';ctx.fillStyle='#17212B';ctx.fillText(formatVotes(c.votes),984,y+55);
    ctx.font='800 23px Arial, sans-serif';ctx.fillStyle='#2450B2';ctx.fillText(c.percentual,984,y+92);
    ctx.textAlign='left';
  });

  // Rodapé
  const footerY=1245;
  ctx.fillStyle='#D8E4EA';ctx.fillRect(72,footerY-23,936,1);
  ctx.font='600 17px Arial, sans-serif';ctx.fillStyle='#52636E';
  ctx.fillText('Acompanhamento local das seções da 16ª Zona Eleitoral · Colméia/TO',72,footerY+16);
  ctx.font='500 15px Arial, sans-serif';ctx.fillStyle='#71818B';
  ctx.fillText('A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.',72,footerY+48);
  ctx.font='700 16px Arial, sans-serif';ctx.fillStyle='#123D60';ctx.textAlign='right';
  ctx.fillText('Central Eleitoral Colméia 2026',1008,footerY+48);ctx.textAlign='left';

  return{canvas,cargo,done,status,top,test};
}
function safeFileName(cargo){
  return 'central-eleitoral-colmeia-'+cargo.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.png';
}
function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2500);
}
async function shareResult(btn){
  const old=btn.innerHTML;btn.disabled=true;btn.textContent='Gerando imagem…';
  try{
    const card=buildCanvas(),blob=await canvasBlob(card.canvas),file=new File([blob],safeFileName(card.cargo),{type:'image/png'});
    const shareData={title:'Central Eleitoral Colméia 2026 · '+card.cargo,text:caption(),files:[file]};
    if(navigator.share&&navigator.canShare?.({files:[file]})){
      try{
        await navigator.share(shareData);
        toast('Imagem pronta para compartilhar.');
      }catch(e){
        if(e?.name==='AbortError')return;
        downloadBlob(blob,file.name);
        toast('Não foi possível abrir o compartilhamento. A imagem foi baixada.','warn');
      }
    }else{
      downloadBlob(blob,file.name);
      toast('Imagem gerada e baixada.');
    }
  }catch(e){
    if(String(e?.message||e)==='sem_resultados')toast('Ainda não há votos neste cargo para gerar a imagem.','warn');
    else{console.error(e);toast('Não foi possível gerar a imagem agora.','bad')}
  }finally{btn.disabled=false;btn.innerHTML=old}
}
function mount(){
  const section=document.getElementById('publicApuracao')||document.getElementById('publicCandidatos');
  if(!section||document.getElementById('ce191ShareActions'))return;
  const progress=document.getElementById('cargoProgressLabel')?.parentElement||document.getElementById('cargoTabs');
  const actions=document.createElement('div');
  actions.id='ce191ShareActions';actions.className='ce191-share-actions';
  actions.innerHTML='<button type="button" class="ce191-share-btn primary" data-ce191-share>'+ICON_SHARE+'<span>Compartilhar resultado</span></button><button type="button" class="ce191-share-btn" data-ce191-copy>'+ICON_COPY+'<span>Copiar legenda</span></button>';
  if(progress?.parentNode)progress.insertAdjacentElement('afterend',actions);else section.prepend(actions);
  actions.querySelector('[data-ce191-share]').addEventListener('click',e=>shareResult(e.currentTarget));
  actions.querySelector('[data-ce191-copy]').addEventListener('click',copyCaption);
}
function start(){
  mount();
  setTimeout(mount,300);
  document.getElementById('cargoTabs')?.addEventListener('click',()=>setTimeout(mount,60),true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();