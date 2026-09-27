(()=>{'use strict';
const S=(d)=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
const I={
 results:S('<path d="M5 19V11M12 19V5M19 19v-8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>'),
 pin:S('<path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.1" stroke="currentColor" stroke-width="1.8"/>'),
 users:S('<circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M3.8 19c.5-3.3 2.3-5 5.2-5s4.7 1.7 5.2 5M16 5.5a3 3 0 0 1 0 5.8M16 14c2.5.2 4 1.8 4.4 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
 info:S('<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 10.5V17M12 7.2h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
 grid:S('<path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" stroke="currentColor" stroke-width="1.8"/>'),
 sections:S('<path d="M6 5h12M6 12h12M6 19h12" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="4" cy="5" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="19" r="1" fill="currentColor"/>'),
 ballot:S('<path d="M7 8V5h10v3M5 10h14v9H5zM8 13h8M9 16h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
 alert:S('<path d="M12 4 3.8 19h16.4L12 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9v4M12 16.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
 more:S('<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>'),
 check:S('<path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
 wait:S('<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
 shield:S('<path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9 12 2 2 4-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
 chevron:S('<path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
 close:S('<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')
};
const put=(el,n)=>{if(!el||el.dataset.ce185Icon===n)return;el.innerHTML=I[n]||I.grid;el.dataset.ce185Icon=n};
function apply(){
 const pub={publicApuracao:'results',publicLocais:'pin',publicCandidatos:'users',publicSobre:'info'};
 document.querySelectorAll('.public-bottom-nav button[data-target]').forEach(b=>put(b.querySelector('span:first-child'),pub[b.dataset.target]||'grid'));
 const adm={painel:'grid',secoes:'sections',apuracao:'results',pendencias:'alert',mais:'more'};
 document.querySelectorAll('.bottom-nav button[data-target]').forEach(b=>put(b.querySelector('span:first-child'),adm[b.dataset.target]||'grid'));
 document.querySelectorAll('.metric').forEach(m=>{const t=(m.querySelector('small')?.textContent||'').toLowerCase();let n='grid';if(t.includes('completa')||t.includes('conferida'))n='check';else if(t.includes('conferência')||t.includes('diverg'))n='alert';else if(t.includes('aguard'))n='wait';else if(t.includes('recebid'))n='ballot';put(m.querySelector('.metric-icon'),n)});
 document.querySelectorAll('.unified-module').forEach(a=>{put(a.querySelector('.unified-module-icon'),(a.getAttribute('href')||'').includes('/admin')?'shield':'ballot');put(a.querySelector('.unified-module-arrow'),'chevron')});
 document.querySelectorAll('.unified-sheet-close,.modal-close').forEach(b=>put(b,'close'));
}
function start(){apply();setTimeout(apply,250);setTimeout(apply,900);document.addEventListener('click',e=>{if(e.target.closest('.unified-team-entry,[data-section]'))setTimeout(apply,0)})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();