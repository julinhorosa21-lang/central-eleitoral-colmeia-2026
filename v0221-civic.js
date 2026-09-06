(() => {
  const transparent = location.pathname.includes('transparencia');
  const icon = (name) => {
    const icons = {
      ballot:'<svg viewBox="0 0 24 24" fill="none"><path d="M7 8V5h10v3M5 10h14v9H5zM8 13h8M9 16h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      zone:'<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.2" stroke="currentColor" stroke-width="1.8"/></svg>',
      place:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 20V8l8-4 8 4v12M8 20v-6h8v6M3 20h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      sections:'<svg viewBox="0 0 24 24" fill="none"><path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      results:'<svg viewBox="0 0 24 24" fill="none"><path d="M5 19V11M12 19V5M19 19v-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      map:'<svg viewBox="0 0 24 24" fill="none"><path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2zM9 4v14M15 6v14" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      pin:'<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2" stroke="currentColor" stroke-width="1.8"/></svg>',
      panel:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" stroke-width="1.8"/></svg>',
      shield:'<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9 12 2 2 4-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      target:'<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      data:'<svg viewBox="0 0 24 24" fill="none"><path d="M5 4h14v16H5zM8 8h8M8 12h3M8 16h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    return icons[name] || icons.results;
  };

  function decorateMainHeader(){
    if(transparent) return;
    const top=document.querySelector('.top');
    const brand=top?.querySelector('.brand');
    const badge=top?.querySelector('.badge');
    if(!top||!brand||top.classList.contains('civic-header')) return;
    top.classList.add('civic-header');
    brand.innerHTML=`
      <div class="civic-seal" aria-hidden="true"><span class="civic-seal-mark"></span></div>
      <div class="civic-brand-copy">
        <div class="civic-kicker">Central de acompanhamento eleitoral</div>
        <h1>Central Eleitoral <span>Colméia 2026</span></h1>
        <p>Informação, transparência e acompanhamento local das 29 seções da 16ª Zona Eleitoral.</p>
      </div>`;
    if(badge){badge.classList.add('civic-badge');badge.textContent='ELEIÇÕES 2026';}
    top.insertAdjacentHTML('beforeend','<div class="civic-ribbon" aria-hidden="true"></div><div class="civic-sun" aria-hidden="true"></div><div class="civic-horizon" aria-hidden="true"></div>');
    const context=document.createElement('div');
    context.className='civic-context';
    context.innerHTML='<span><i></i>COLMÉIA · TO</span><span><i></i>16ª ZONA ELEITORAL</span><span><i></i>29 SEÇÕES ATIVAS</span>';
    top.insertAdjacentElement('afterend',context);
  }

  function decoratePublicHeader(){
    if(!transparent) return;
    const hero=document.querySelector('.hero');
    if(!hero||hero.classList.contains('civic-public-hero')) return;
    hero.classList.add('civic-public-hero');
    hero.insertAdjacentHTML('beforeend','<div class="civic-ribbon" aria-hidden="true"></div><div class="civic-sun" aria-hidden="true"></div><div class="civic-horizon" aria-hidden="true"></div>');
    const title=hero.querySelector('h1');
    if(title) title.textContent='Transparência da apuração';
    const eyebrow=hero.querySelector('.eyebrow');
    if(eyebrow) eyebrow.textContent='Central Eleitoral · Colméia 2026';
    const p=hero.querySelector('p');
    if(p) p.textContent='Acompanhe em tempo real o avanço das 29 seções, a totalização por cargo e a situação de conferência dos dados locais com a Justiça Eleitoral.';
  }

  function metricIcons(){
    const main=['ballot','zone','place','sections'];
    const pub=['sections','shield','data','target'];
    document.querySelectorAll('.summary .metric, .metrics .metric').forEach((el,i)=>{
      if(el.querySelector('.civic-metric-icon')) return;
      const d=document.createElement('div');
      d.className='civic-metric-icon';
      d.innerHTML=icon((transparent?pub:main)[i]||'results');
      el.prepend(d);
    });
  }

  function enhanceQuickNav(){
    if(transparent) return;
    const nav=document.querySelector('.v022-quicknav');
    if(!nav||nav.dataset.civic) return;
    nav.dataset.civic='1';
    const labels=[['Apuração','results'],['Candidatos','panel'],['Locais','pin'],['Transparência','data']];
    [...nav.children].forEach((el,i)=>{
      const cfg=labels[i]; if(!cfg) return;
      el.innerHTML=`<span class="civic-action-icon">${icon(cfg[1])}</span>${cfg[0]}`;
    });
  }

  function enhanceToolbar(){
    if(transparent) return;
    const map={adminToggle:['Registrar BU','ballot'],coordToggle:['Coordenação','shield'],publicTransparencyBtn:['Transparência','data'],centerMapBtn:['Centralizar mapa','target'],exportBtn:['Exportar dados','data']};
    Object.entries(map).forEach(([id,[label,ic]])=>{
      const el=document.getElementById(id);if(!el||el.dataset.civic)return;
      el.dataset.civic='1';
      el.innerHTML=`<span class="civic-action-icon">${icon(ic)}</span>${label}`;
    });
  }

  function enhanceFooter(){
    if(transparent) return;
    const nav=document.querySelector('.footer-nav div');
    if(!nav||nav.dataset.civic)return;
    nav.dataset.civic='1';
    const data=[['Mapa','map'],['Locais','pin'],['Registrar','ballot'],['Dados','panel']];
    [...nav.querySelectorAll('button')].forEach((b,i)=>{
      const [label,ic]=data[i]||['Menu','panel'];
      b.innerHTML=`<span class="civic-nav-icon">${icon(ic)}</span><span>${label}</span>`;
    });
  }

  function notes(){
    if(transparent){
      const notice=document.querySelector('.notice');
      if(notice) notice.innerHTML='<b>Como ler:</b> verde identifica informação oficial ou já conferida; amarelo indica prévia local aguardando confirmação; vermelho aponta divergência em conferência. A Central é um acompanhamento local e não substitui a divulgação oficial da Justiça Eleitoral.';
      return;
    }
    const note=document.querySelector('.central-note');
    if(note) note.innerHTML='<b>V0.22.1 · Nova identidade visual:</b> interface redesenhada com referências cívicas de Colméia, Tocantins e Brasil, hierarquia mais forte, navegação mobile aprimorada e leitura mais clara da apuração. Toda a lógica de segurança, TSE, PWA e auditoria permanece inalterada.';
  }

  function version(){
    document.querySelectorAll('.v022-version').forEach(el=>el.textContent='V0.22.1');
  }

  function install(){
    document.body.classList.add('civic-v0221');
    decorateMainHeader();
    decoratePublicHeader();
    metricIcons();
    enhanceQuickNav();
    enhanceToolbar();
    enhanceFooter();
    notes();
    version();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
