(() => {
  function installV021Entry() {
    if (document.getElementById('publicTransparencyBtn')) return;
    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
      const btn = document.createElement('button');
      btn.id = 'publicTransparencyBtn';
      btn.className = 'ghost';
      btn.type = 'button';
      btn.textContent = 'Transparência pública';
      btn.title = 'Abrir o painel público de apuração';
      btn.addEventListener('click', () => { window.location.href = '/transparencia.html'; });
      const coord = document.getElementById('coordToggle');
      if (coord) toolbar.insertBefore(btn, coord);
      else toolbar.appendChild(btn);
    }

    const note = document.querySelector('.central-note');
    if (note) note.innerHTML = '<b>V0.21 · Transparência pública:</b> novo painel público, sem login, com andamento da apuração, totais por candidato, situação das 29 seções, atualização em tempo real e indicação clara do que já foi confrontado com dados oficiais do TSE. A coordenação V0.20 e o PWA/offline V0.19 continuam ativos.';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installV021Entry, { once: true });
  else installV021Entry();
})();
