import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

/* ============================================================
   V1.9.6 — contraste público + compartilhamento com zero votos
   ============================================================ */

/* 1) Contraste explícito do botão público de próxima seção. */
const sectionsCss=pub+'/v192-sections.css';
let css=read(sectionsCss);
if(!css.includes('CE196_PUBLIC_NEXT_CONTRAST')){
  css+=String.raw`

/* CE196_PUBLIC_NEXT_CONTRAST */
.public-v130 #publicLocais .ce192-next{
  background:#FFFFFF!important;
  color:#123D60!important;
  border:1px solid #2450B2!important;
  box-shadow:none!important;
  opacity:1!important;
}
.public-v130 #publicLocais .ce192-next:hover{
  background:#F3F7FF!important;
  color:#123D60!important;
}
.public-v130 #publicLocais .ce192-next:active{
  background:#E7EFFC!important;
  color:#123D60!important;
}
.public-v130 #publicLocais .ce192-next:focus-visible{
  outline:2px solid #005FCC!important;
  outline-offset:2px!important;
}
.public-v130 #publicLocais .ce192-next:disabled{
  background:#F3F5F7!important;
  color:#6F7F8A!important;
  border-color:#C9D4DA!important;
  opacity:1!important;
  cursor:not-allowed!important;
}
`;
}
write(sectionsCss,css);

/* 2) O card compartilhável passa a aceitar cargos ainda sem votos. */
const sharePath=pub+'/v191-share.js';
let share=read(sharePath);

share=share.replace(
  "  const cargo=cargoLabel(activeCargo()),done=cargoDone(),status=statusInfo(done),updated=updatedText(),top=getRows(),test=isTestEnvironment();\n  if(!top.length)throw new Error('sem_resultados');",
  "  const cargo=cargoLabel(activeCargo()),done=cargoDone(),status=statusInfo(done),updated=updatedText(),top=getRows(),test=isTestEnvironment(),emptyState=!top.length;"
);

const rankingBlock=String.raw`  // Título ranking
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
  });`;

const replacement=String.raw`  // Ranking ou estado inicial sem votos.
  if(emptyState){
    ctx.font='800 25px Arial, sans-serif';ctx.fillStyle='#123D60';ctx.fillText('SITUAÇÃO DA APURAÇÃO',72,448);
    ctx.font='500 18px Arial, sans-serif';ctx.fillStyle='#667985';ctx.fillText('Acompanhamento local deste cargo',72,479);

    roundRect(ctx,72,510,936,330,22,'#FFFFFF','#D8E4EA');
    roundRect(ctx,104,548,118,118,24,'#EEF3F6');
    ctx.font='900 54px Arial, sans-serif';ctx.fillStyle='#123D60';ctx.textAlign='center';ctx.fillText('0',163,625);
    ctx.font='800 18px Arial, sans-serif';ctx.fillStyle='#667985';ctx.fillText('VOTOS',163,654);
    ctx.textAlign='left';

    ctx.font='800 32px Arial, sans-serif';ctx.fillStyle='#17212B';
    ctx.fillText('Nenhum voto computado até o momento',258,589);
    ctx.font='500 21px Arial, sans-serif';ctx.fillStyle='#667985';
    ctx.fillText('A apuração deste cargo ainda não possui votos registrados.',258,633);
    ctx.fillText('Este card pode ser compartilhado normalmente neste estágio.',258,670);

    roundRect(ctx,104,722,840,78,15,status.bg);
    ctx.font='800 20px Arial, sans-serif';ctx.fillStyle=status.color;
    ctx.fillText(status.label,130,756);
    ctx.font='600 18px Arial, sans-serif';ctx.fillStyle='#52636E';
    ctx.fillText(done+'/'+EXPECTED+' seções computadas · '+updated,130,784);
  }else{
    ctx.font='800 25px Arial, sans-serif';ctx.fillStyle='#123D60';ctx.fillText('MAIS VOTADOS NESTE MOMENTO',72,448);
    ctx.font='500 18px Arial, sans-serif';ctx.fillStyle='#667985';ctx.fillText('Até 5 candidaturas · acompanhamento local',72,479);

    const startY=510,rowH=132,gap=14;
    top.forEach((c,i)=>{
      const y=startY+i*(rowH+gap);
      roundRect(ctx,72,y,936,rowH,18,'#FFFFFF','#D8E4EA');

      roundRect(ctx,94,y+28,64,64,13,'#123D60');
      ctx.font='800 24px Arial, sans-serif';ctx.fillStyle='#FFFFFF';ctx.textAlign='center';ctx.fillText(c.posicao+'º',126,y+68);ctx.textAlign='left';

      roundRect(ctx,178,y+28,76,64,13,'#EEF3F6');
      ctx.font='800 23px Arial, sans-serif';ctx.fillStyle='#123D60';ctx.textAlign='center';ctx.fillText(c.numero||'—',216,y+68);ctx.textAlign='left';

      ctx.font='800 25px Arial, sans-serif';ctx.fillStyle='#17212B';
      const nameLines=wrapText(ctx,c.nome,390,2);drawTextLines(ctx,nameLines,280,y+49,28);
      ctx.font='600 18px Arial, sans-serif';ctx.fillStyle='#667985';
      const meta=(c.partido?c.partido+' · ':'')+(c.numero?'nº '+c.numero:'');
      ctx.fillText(meta,280,y+101);

      ctx.textAlign='right';
      ctx.font='800 29px Arial, sans-serif';ctx.fillStyle='#17212B';ctx.fillText(formatVotes(c.votes),984,y+55);
      ctx.font='800 23px Arial, sans-serif';ctx.fillStyle='#2450B2';ctx.fillText(c.percentual,984,y+92);
      ctx.textAlign='left';
    });
  }`;

if(!share.includes(rankingBlock))throw new Error('V1.9.6: bloco de ranking V1.9.1 não localizado');
share=share.replace(rankingBlock,replacement);

/* Legenda específica para zero votos, sem tratar isso como erro. */
const captionOld=String.raw`function caption(){
  const cargo=cargoLabel(activeCargo()),done=cargoDone(),status=statusInfo(done),updated=updatedText();
  const test=isTestEnvironment();
  const first=test?'DADOS DE TESTE — NÃO OFICIAIS.\n\n':'';
  const middle=done>=EXPECTED
    ?'Apuração local concluída: '+done+'/'+EXPECTED+' seções.'
    :'Apuração: '+done+'/'+EXPECTED+' seções.';
  return first+'Resultado '+status.short.toLowerCase()+' para '+cargo+' em Colméia/TO.\n'+middle+'\nAtualização: '+updated+'.\n\nAcompanhamento local pela Central Eleitoral Colméia 2026. A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.';
}`;
const captionNew=String.raw`function caption(){
  const cargo=cargoLabel(activeCargo()),done=cargoDone(),status=statusInfo(done),updated=updatedText(),emptyState=getRows().length===0;
  const test=isTestEnvironment();
  const first=test?'DADOS DE TESTE — NÃO OFICIAIS.\n\n':'';
  if(emptyState){
    return first+'Resultado para '+cargo+' em Colméia/TO.\nAinda não há votos computados para este cargo.\nApuração: '+done+'/'+EXPECTED+' seções.\nAtualização: '+updated+'.\n\nAcompanhamento local pela Central Eleitoral Colméia 2026. A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.';
  }
  const middle=done>=EXPECTED
    ?'Apuração local concluída: '+done+'/'+EXPECTED+' seções.'
    :'Apuração: '+done+'/'+EXPECTED+' seções.';
  return first+'Resultado '+status.short.toLowerCase()+' para '+cargo+' em Colméia/TO.\n'+middle+'\nAtualização: '+updated+'.\n\nAcompanhamento local pela Central Eleitoral Colméia 2026. A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.';
}`;
if(!share.includes(captionOld))throw new Error('V1.9.6: função caption não localizada');
share=share.replace(captionOld,captionNew);

share=share.replace(
  "  }catch(e){\n    if(String(e?.message||e)==='sem_resultados')toast('Ainda não há votos neste cargo para gerar a imagem.','warn');\n    else{console.error(e);toast('Não foi possível gerar a imagem agora.','bad')}\n  }finally{btn.disabled=false;btn.innerHTML=old}",
  "  }catch(e){\n    console.error(e);toast('Não foi possível gerar a imagem agora.','bad');\n  }finally{btn.disabled=false;btn.innerHTML=old}"
);

if(share.includes("throw new Error('sem_resultados')"))throw new Error('V1.9.6: bloqueio de zero votos ainda presente');
if(!share.includes('Nenhum voto computado até o momento'))throw new Error('V1.9.6: estado zero votos ausente');
write(sharePath,share);

/* 3) Versão PWA */
const swPath=pub+'/service-worker.js';
let sw=read(swPath).replace(/const VERSION='[^']+';/,"const VERSION='v1.9.6-unified';");
write(swPath,sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='1.9.6';write(pkg,JSON.stringify(j,null,2)+'\n')}

if(!read(sectionsCss).includes('CE196_PUBLIC_NEXT_CONTRAST'))throw new Error('V1.9.6 contraste ausente');
if(!read(sharePath).includes('emptyState=!top.length'))throw new Error('V1.9.6 zero-vote share ausente');
if(!read(swPath).includes("v1.9.6-unified"))throw new Error('V1.9.6 SW não atualizado');

console.log('V1.9.6 applied: public next-section contrast fixed and zero-vote result sharing enabled.');
