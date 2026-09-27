(()=>{'use strict';
const S=d=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+d+'</svg>';
const I={
 home:S('<path d="m4 11 8-7 8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 10.5V20h11v-9.5M10 20v-6h4v6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
 results:S('<path d="M5 19V11M12 19V5M19 19v-8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>'),
 pin:S('<path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.1" stroke="currentColor" stroke-width="1.8"/>'),
 users:S('<circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M3.8 19c.5-3.3 2.3-5 5.2-5s4.7 1.7 5.2 5M16 5.5a3 3 0 0 1 0 5.8M16 14c2.5.2 4 1.8 4.4 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
 info:S('<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 10.5V17M12 7.2h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
 grid:S('<path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" stroke="currentColor" stroke-width="1.8"/>'),
 sections:S('<path d="M6 5h12M6 12h12M6 19h12" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="4" cy="5" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="19" r="1" fill="currentColor"/>'),
 ballot:S('<path d="M7 8V5h10v3M5 10h14v9H5zM8 13h8M9 16h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
 scan:S('<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M8 9h8v6H8z" stroke="currentColor" stroke-width="1.7"/>'),
 alert:S('<path d="M12 4 3.8 19h16.4L12 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9v4M12 16.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
 shield:S('<path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9 12 2 2 4-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
 download:S('<path d="M12 4v10M8 10l4 4 4-4M5 19h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'),
 refresh:S('<path d="M19 7v5h-5M5 17v-5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.1 8.1A6.5 6.5 0 0 1 18 10M6 14a6.5 6.5 0 0 0 10.9 1.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
 chevron:S('<path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
 close:S('<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
 check:S('<path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
 more:S('<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>')
};
const put=(el,n)=>{
 if(!el)return;
 const name=I[n]?n:'grid';
 if(el.dataset.ce186Icon===name&&el.querySelector('svg'))return;
 el.innerHTML=I[name];el.dataset.ce186Icon=name;el.setAttribute('aria-hidden','true');
};
function semantic(text,href=''){
 const t=(String(text||'')+' '+String(href||'')).toLowerCase();
 if(/apur|resultado|voto/.test(t))return'results';
 if(/local|mapa|endereço|endereco/.test(t))return'pin';
 if(/candidat|equipe|pessoa|usuár|usuario/.test(t))return'users';
 if(/seç|secao|seção/.test(t))return'sections';
 if(/bu|boletim|urna|oper|leitura|scanner|qr/.test(t))return /qr|leitura|scanner/.test(t)?'scan':'ballot';
 if(/segur|integridade|admin|coordena/.test(t))return'shield';
 if(/baix|download/.test(t))return'download';
 if(/atualiz|refresh|recarreg/.test(t))return'refresh';
 if(/sobre|info|ajuda/.test(t))return'info';
 if(/mais|menu/.test(t))return'more';
 return'grid';
}
function normalizeNav(){
 const pub={publicApuracao:'results',publicLocais:'pin',publicCandidatos:'users',publicSobre:'info'};
 document.querySelectorAll('.public-bottom-nav button[data-target]').forEach(b=>put(b.querySelector('span:first-child'),pub[b.dataset.target]||semantic(b.textContent)));
 const adm={painel:'grid',secoes:'sections',apuracao:'results',pendencias:'alert',mais:'more'};
 document.querySelectorAll('.bottom-nav button[data-target]').forEach(b=>put(b.querySelector('span:first-child'),adm[b.dataset.target]||semantic(b.textContent)));
 document.querySelectorAll('.footer-nav button').forEach(b=>put(b.querySelector('span:first-child'),semantic(b.textContent)));
}
function normalizeActions(){
 document.querySelectorAll('.civic-action-icon').forEach(el=>{
   const p=el.closest('button,a');put(el,semantic(p?.textContent,p?.getAttribute('href')));
 });
 document.querySelectorAll('.unified-module').forEach(a=>{
   put(a.querySelector('.unified-module-icon'),semantic(a.textContent,a.getAttribute('href')));
   put(a.querySelector('.unified-module-arrow'),'chevron');
 });
 document.querySelectorAll('.unified-sheet-close,.modal-close').forEach(b=>{put(b,'close');if(!b.getAttribute('aria-label'))b.setAttribute('aria-label','Fechar')});
}
function normalizeMetrics(){
 document.querySelectorAll('.metric').forEach(m=>{
   const t=(m.querySelector('small')?.textContent||'').toLowerCase();
   let n='grid';
   if(/completa|conferida|verific/.test(t))n='check';
   else if(/diverg|erro|atenç|alert/.test(t))n='alert';
   else if(/recebid|boletim|urna/.test(t))n='ballot';
   else if(/seç|secao|seção/.test(t))n='sections';
   put(m.querySelector('.metric-icon,.civic-metric-icon'),n);
 });
}
function labelIconButtons(){
 document.querySelectorAll('button').forEach(b=>{
   const txt=(b.textContent||'').trim();
   if(!txt&&b.querySelector('svg')&&!b.getAttribute('aria-label'))b.setAttribute('aria-label','Ação');
 });
}
function apply(){
 normalizeNav();normalizeActions();normalizeMetrics();labelIconButtons();
 document.documentElement.classList.add('ce186-ready');
}
let raf=0;
const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply)};
function start(){
 apply();setTimeout(apply,250);setTimeout(apply,900);
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('resize',schedule,{passive:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();