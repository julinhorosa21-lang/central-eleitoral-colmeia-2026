(()=>{
  'use strict';
  const PUBLIC_PATHS=new Set(['/','/index.html','/transparencia.html']);
  if(!PUBLIC_PATHS.has(location.pathname))return;

  const EXPECTED=29;
  let catalog=null;
  let photoTimer=null;

  const $=id=>document.getElementById(id);
  const txt=(el,v)=>{if(el&&el.textContent!==v)el.textContent=v};
  const numberFrom=v=>{
    const m=String(v||'').replace(/\./g,'').match(/\d+/);
    return m?Number(m[0]):0;
  };
  const pct=(n,d=EXPECTED)=>d?Math.max(0,Math.min(100,n/d*100)):0;

  function hero(){
    const h=document.querySelector('.hero');
    if(!h)return;
    h.classList.add('public-main-hero');
    const eyebrow=h.querySelector('.eyebrow');
    const title=h.querySelector('h1');
    const p=h.querySelector('p');
    txt(eyebrow,'APURAÇÃO LOCAL · COLMÉIA/TO');
    txt(title,'Central Eleitoral Colméia 2026');
    txt(p,'Acompanhe de forma simples o andamento das 29 seções e os resultados publicados por cargo.');
    const actions=h.querySelector('.hero-actions');
    if(actions){
      const refresh=$('refreshBtn');
      if(refresh){refresh.textContent='Atualizar';refresh.title='Buscar os dados mais recentes';}
      const op=[...actions.querySelectorAll('button,a')].find(el=>el!==refresh);
      if(op){
        op.textContent='Área operacional';
        op.classList.add('public-operation-link');
        op.removeAttribute('onclick');
        op.addEventListener('click',()=>{location.href='/operacao.html'},{once:false});
      }
    }
  }

  function overview(){
    if($('publicOverview'))return;
    const h=document.querySelector('.hero');
    if(!h)return;
    h.insertAdjacentHTML('afterend',`
      <section id="publicOverview" class="public-overview" aria-live="polite">
        <div class="public-overview-main">
          <div class="public-overview-kicker"><span class="public-live-dot"></span><span id="publicPhase">APURAÇÃO LOCAL</span></div>
          <div class="public-overview-row">
            <strong id="publicPercent">0%</strong>
            <div><b id="publicCount">0 de ${EXPECTED} seções</b><span id="publicState">Aguardando o início da apuração</span></div>
          </div>
          <div class="public-progress" role="progressbar" aria-label="Progresso da apuração" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="publicProgress"></i></div>
          <div class="public-update"><span>Última atualização</span><b id="publicUpdated">Aguardando dados</b></div>
        </div>
        <div class="public-legend" aria-label="Legenda dos estados dos dados">
          <span><i class="ok"></i>Conferido/oficial</span>
          <span><i class="pending"></i>Prévia local</span>
          <span><i class="waiting"></i>Aguardando</span>
        </div>
      </section>`);
  }

  function simplifyMetrics(){
    const any=$('mAny')?.closest('.metric');
    const complete=$('mComplete')?.closest('.metric');
    const entries=$('mEntries')?.closest('.metric');
    const updated=$('mUpdated')?.closest('.metric');
    if(any){any.classList.add('public-metric');txt(any.querySelector('small'),'Seções recebidas');}
    if(complete){complete.classList.add('public-metric');txt(complete.querySelector('small'),'Seções completas');}
    if(entries)entries.classList.add('public-hide-metric');
    if(updated){updated.classList.add('public-metric');txt(updated.querySelector('small'),'Última atualização');}
  }

  function conciseNotice(){
    const n=document.querySelector('.notice');
    if(!n)return;
    n.id='publicSobre';
    n.innerHTML='<b>Sobre os resultados:</b> este é um acompanhamento local. Resultados parciais podem mudar até a conclusão da apuração e da conferência com os dados oficiais da Justiça Eleitoral.';
  }

  function sectionAnchors(){
    $('cargoTabs')?.closest('section')?.setAttribute('id','publicApuracao');
    $('leaders')?.closest('section')?.setAttribute('id','publicCandidatos');
    $('places')?.closest('section')?.setAttribute('id','publicLocais');
  }

  function bottomNav(){
    if(document.querySelector('.public-bottom-nav'))return;
    const nav=document.createElement('nav');
    nav.className='public-bottom-nav';
    nav.setAttribute('aria-label','Navegação principal');
    nav.innerHTML=`
      <button type="button" data-target="publicApuracao"><span aria-hidden="true">▥</span><b>Apuração</b></button>
      <button type="button" data-target="publicLocais"><span aria-hidden="true">⌖</span><b>Locais</b></button>
      <button type="button" data-target="publicCandidatos"><span aria-hidden="true">◎</span><b>Candidatos</b></button>
      <button type="button" data-target="publicSobre"><span aria-hidden="true">i</span><b>Sobre</b></button>`;
    nav.addEventListener('click',e=>{
      const b=e.target.closest('button[data-target]');
      if(!b)return;
      document.getElementById(b.dataset.target)?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    document.body.appendChild(nav);
  }

  function collapseStatus(){
    const list=document.querySelector('.status-list');
    const aside=list?.closest('aside,section');
    if(!aside||aside.dataset.publicDetails)return;
    aside.dataset.publicDetails='1';
    aside.classList.add('public-details-card');
    const title=aside.querySelector('h2');
    if(title)title.textContent='Entenda os dados';
    const top=title?.parentElement||aside.firstElementChild;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='public-disclosure';
    btn.setAttribute('aria-expanded','false');
    btn.innerHTML='<span>Ver situação da conferência</span><b aria-hidden="true">+</b>';
    top?.insertAdjacentElement('afterend',btn);
    btn.addEventListener('click',()=>{
      const open=aside.classList.toggle('open');
      btn.setAttribute('aria-expanded',String(open));
      btn.querySelector('span').textContent=open?'Ocultar detalhes':'Ver situação da conferência';
      btn.querySelector('b').textContent=open?'−':'+';
    });
  }

  function collapseRegions(){
    const root=$('regions');
    const card=root?.closest('section');
    if(!card||card.dataset.publicRegions)return;
    card.dataset.publicRegions='1';
    card.classList.add('public-regions-card');
    const head=card.querySelector('.section-title');
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='public-region-toggle';
    btn.textContent='Ver regiões';
    btn.setAttribute('aria-expanded','false');
    head?.appendChild(btn);
    btn.addEventListener('click',()=>{
      const open=card.classList.toggle('open');
      btn.textContent=open?'Ocultar regiões':'Ver regiões';
      btn.setAttribute('aria-expanded',String(open));
    });
  }

  function placeSummaries(){
    document.querySelectorAll('#places .place').forEach(place=>{
      const head=place.querySelector('.place-head');
      if(!head)return;
      const all=[...place.querySelectorAll('.sec')];
      const done=all.filter(x=>x.classList.contains('done')).length;
      let badge=head.querySelector('.public-place-progress');
      if(!badge){badge=document.createElement('span');badge.className='public-place-progress';head.appendChild(badge);}
      badge.textContent=`${done}/${all.length} seções`;
      badge.classList.toggle('complete',all.length>0&&done===all.length);
      badge.classList.toggle('partial',done>0&&done<all.length);
    });
  }

  function publicCargoMessage(){
    const text=$('cargoProgressText');
    const label=$('cargoProgressLabel');
    if(!text||!label)return;
    const done=numberFrom(text.textContent);
    if(done===0)label.textContent='Aguardando os primeiros boletins deste cargo';
    else if(done<EXPECTED)label.textContent=`Resultado parcial · ${done} de ${EXPECTED} seções publicadas`;
    else label.textContent=`Apuração deste cargo concluída · ${EXPECTED} de ${EXPECTED} seções`;
  }

  function overviewState(){
    const any=numberFrom($('mAny')?.textContent);
    const complete=numberFrom($('mComplete')?.textContent);
    const p=Math.round(pct(any));
    txt($('publicPercent'),`${p}%`);
    txt($('publicCount'),`${any} de ${EXPECTED} seções`);
    const state=$('publicState');
    const phase=$('publicPhase');
    if(any===0){txt(state,'Aguardando o início da apuração');txt(phase,'APURAÇÃO LOCAL');}
    else if(any<EXPECTED){txt(state,`Resultado parcial · ${EXPECTED-any} seções ainda aguardando`);txt(phase,'RESULTADO PARCIAL');}
    else if(complete<EXPECTED){txt(state,'Todas as seções chegaram · conclusão dos cargos em andamento');txt(phase,'SEÇÕES RECEBIDAS');}
    else{txt(state,'Apuração local concluída');txt(phase,'APURAÇÃO CONCLUÍDA');}
    const bar=$('publicProgress');
    if(bar)bar.style.width=`${p}%`;
    const prog=document.querySelector('.public-progress');
    if(prog)prog.setAttribute('aria-valuenow',String(p));
    const time=$('mUpdated')?.textContent?.trim();
    const date=$('mUpdatedDate')?.textContent?.trim();
    txt($('publicUpdated'),time&&time!=='—'?`${time}${date&&date!=='aguardando dados'?' · '+date:''}`:'Aguardando dados');
    publicCargoMessage();
  }

  function candidateNumber(row){
    return (row.querySelector('.v0241-number-badge')?.textContent||row.querySelector('.num')?.textContent||'').trim().match(/\d+/)?.[0]||'';
  }
  function activeCargo(){return document.querySelector('#cargoTabs button.active')?.dataset?.cargo||''}
  function catalogCandidate(cargo,number){
    const rows=catalog?.candidates?.[cargo];
    return Array.isArray(rows)?rows.find(c=>String(c.numero||'').trim()===String(number)):null;
  }
  function decoratePhotos(){
    if(!catalog)return;
    const cargo=activeCargo();
    if(!cargo)return;
    document.querySelectorAll('#leaders .leader').forEach(row=>{
      const box=row.querySelector('.num');
      if(!box||box.querySelector('img'))return;
      const n=candidateNumber(row);
      const c=catalogCandidate(cargo,n);
      const foto=c?.foto;
      if(!foto)return;
      box.classList.add('public-photo-num');
      box.textContent='';
      const img=document.createElement('img');
      img.className='public-candidate-photo';
      img.src=foto;
      img.alt=c?.nome?`Foto de ${c.nome}`:'Foto de candidato';
      img.loading='lazy';img.decoding='async';
      const badge=document.createElement('span');badge.className='public-number-badge';badge.textContent=n;
      img.onerror=()=>{box.classList.remove('public-photo-num');box.textContent=n;};
      box.append(img,badge);
    });
  }

  async function loadCatalog(){
    try{
      const r=await fetch('/api/candidates',{cache:'no-store'});
      if(r.ok){const j=await r.json();catalog=j.snapshot||j;if(catalog?.candidates){decoratePhotos();return;}}
    }catch{}
    try{
      const r=await fetch('/data/candidate-catalog.json',{cache:'no-store'});
      if(r.ok){catalog=await r.json();decoratePhotos();}
    }catch{}
  }

  function candidateSemantics(){
    document.querySelectorAll('#leaders .leader').forEach(row=>{
      row.classList.add('public-candidate-row');
      const votes=row.querySelector('.votes b');
      if(votes&&!/voto/i.test(votes.textContent||''))votes.textContent=`${votes.textContent.trim()} votos`;
      const percent=row.querySelector('.votes small');
      if(percent&&!/%/.test(percent.textContent||''))percent.textContent=`${percent.textContent.trim()}%`;
    });
    clearTimeout(photoTimer);photoTimer=setTimeout(decoratePhotos,60);
  }

  function footer(){
    const f=document.querySelector('.foot');
    if(!f)return;
    f.textContent='Central Eleitoral Colméia 2026 · acompanhamento local das 29 seções da 16ª Zona Eleitoral. A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.';
  }

  function apply(){
    if(!document.body)return;
    document.body.classList.add('public-v130');
    hero();overview();simplifyMetrics();conciseNotice();sectionAnchors();bottomNav();collapseStatus();collapseRegions();placeSummaries();candidateSemantics();overviewState();footer();
  }

  function install(){
    apply();
    loadCatalog();
    setTimeout(apply,250);
    setTimeout(apply,900);
    const obs=new MutationObserver(()=>requestAnimationFrame(apply));
    obs.observe(document.body,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',()=>setTimeout(()=>{apply();decoratePhotos()},80),true);
    window.addEventListener('pageshow',apply);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
