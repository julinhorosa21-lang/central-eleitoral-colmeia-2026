(() => {
  const isTransparency = location.pathname.includes('transparencia');

  function scrollToTarget(selector) {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function addVersionBadge() {
    if (document.querySelector('.v022-version')) return;
    const badge = document.createElement('span');
    badge.className = 'v022-version';
    badge.textContent = 'V0.22';
    if (isTransparency) {
      const actions = document.querySelector('.hero-actions');
      if (actions) actions.prepend(badge);
    } else {
      const top = document.querySelector('.top');
      if (top) top.appendChild(badge);
    }
  }

  function addMainQuickNav() {
    if (isTransparency || document.querySelector('.v022-quicknav')) return;
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) return;
    const nav = document.createElement('div');
    nav.className = 'v022-quicknav';
    nav.innerHTML = `
      <button class="primary" type="button" data-v22-target=".grid">Apuração</button>
      <button type="button" data-v22-target="#candidateCatalog">Candidatos</button>
      <button type="button" data-v22-target="#places">Locais</button>
      <a href="/transparencia.html">Transparência</a>`;
    toolbar.parentNode.insertBefore(nav, toolbar);
    nav.addEventListener('click', e => {
      const btn = e.target.closest('[data-v22-target]');
      if (!btn) return;
      scrollToTarget(btn.dataset.v22Target);
    });
  }

  function improveMainNote() {
    if (isTransparency) return;
    const note = document.querySelector('.central-note');
    if (note) note.innerHTML = '<b>V0.22 · Visual e usabilidade:</b> interface refinada para celular, navegação rápida por Apuração/Candidatos/Locais, cartões mais legíveis, estados de conferência com maior contraste e melhorias de toque e acessibilidade. Transparência V0.21, Coordenação V0.20 e PWA/offline V0.19 permanecem ativos.';
  }

  function addTopButton() {
    if (document.querySelector('.v022-top')) return;
    const btn = document.createElement('button');
    btn.className = 'v022-top';
    btn.type = 'button';
    btn.setAttribute('aria-label','Voltar ao topo');
    btn.title = 'Voltar ao topo';
    btn.textContent = '↑';
    btn.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));
    document.body.appendChild(btn);
    const update = () => btn.classList.toggle('show', window.scrollY > 520);
    window.addEventListener('scroll', update, {passive:true});
    update();
  }

  function improveTransparency() {
    if (!isTransparency) return;
    const notice = document.querySelector('.notice');
    if (notice && !notice.dataset.v22) {
      notice.dataset.v22 = '1';
      notice.innerHTML = '<b>Leitura rápida:</b> verde indica dado oficial/conferido, amarelo indica prévia local aguardando confirmação e vermelho sinaliza divergência que exige conferência. Este acompanhamento local não substitui a Justiça Eleitoral.';
    }
    const tabs = document.querySelector('.cargo-tabs');
    if (tabs) tabs.setAttribute('aria-label','Selecionar cargo da apuração');
  }

  function install() {
    document.body.classList.add('v022');
    addVersionBadge();
    addMainQuickNav();
    improveMainNote();
    improveTransparency();
    addTopButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
