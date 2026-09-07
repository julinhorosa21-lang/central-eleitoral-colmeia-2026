import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const css=`
/* V1.5.3 — identidade Brasil + Tocantins + Colmeia */
body.public-v130.public-v131.public-v153{
  --br-green:#009B3A;
  --br-yellow:#FFDF00;
  --br-blue:#002776;
  --to-blue:#2450B2;
  --to-yellow:#F4C400;
  --col-blue:#A8D4F2;
  --col-green:#2E9E58;
  --col-gold:#E5B100;
  --regional-ink:#15364c;
  --regional-bg:#f3f8fb;
  background:linear-gradient(180deg,#eef7fb 0,#f8fafb 180px,#f4f7f9 100%)!important;
}
.public-v153 .wrap{position:relative}
.public-v153 .hero.public-main-hero{
  position:relative!important;
  overflow:hidden!important;
  border:1px solid rgba(255,255,255,.16)!important;
  border-top:4px solid var(--br-yellow)!important;
  background:
    radial-gradient(circle at 88% 18%,rgba(255,223,0,.34) 0,rgba(255,223,0,.14) 18%,transparent 38%),
    radial-gradient(circle at 12% 110%,rgba(168,212,242,.30),transparent 36%),
    linear-gradient(128deg,#008d3b 0%,#0b844a 29%,#2450b2 67%,#002776 100%)!important;
  box-shadow:0 12px 30px rgba(0,39,118,.16)!important;
}
.public-v153 .hero.public-main-hero h1{color:#fff!important;text-shadow:0 1px 0 rgba(0,0,0,.08)}
.public-v153 .hero.public-main-hero p{color:rgba(255,255,255,.88)!important}
.public-v153 .hero .eyebrow{color:#fff7b0!important}
.public-v153 .hero .live{border:1px solid rgba(255,255,255,.22)!important;background:rgba(0,39,118,.18)!important;color:#fff!important}
.public-v153 .regional-signature{display:flex;align-items:center;gap:7px;width:max-content;margin:0 0 5px;padding:5px 8px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(255,255,255,.10);color:#fff;font-size:9.5px;font-weight:800;letter-spacing:.02em;backdrop-filter:blur(4px)}
.public-v153 .regional-signature i{display:block;width:7px;height:7px;border-radius:50%}.public-v153 .regional-signature i:nth-child(1){background:var(--br-green)}.public-v153 .regional-signature i:nth-child(2){background:var(--br-yellow)}.public-v153 .regional-signature i:nth-child(3){background:var(--col-blue)}
.public-v153 .hero .unified-team-entry{border-color:#fff!important;background:#fff!important;color:#164b70!important}

.public-v153 .public-overview,.public-v153 #publicApuracao,.public-v153 #publicCandidatos,.public-v153 #publicLocais,.public-v153 .public-details-card,.public-v153 .public-about-v131{
  border-color:#d7e6ee!important;
  box-shadow:0 3px 12px rgba(24,72,104,.055)!important;
}
.public-v153 .public-overview{border-top:3px solid var(--col-blue)!important;background:linear-gradient(180deg,#fff,#fbfdfe)!important}
.public-v153 .public-overview-kicker{color:var(--to-blue)!important}
.public-v153 .public-overview-row>strong{color:var(--br-blue)!important}
.public-v153 .public-progress{height:10px!important;background:#e5edf2!important}
.public-v153 .public-progress i{background:linear-gradient(90deg,var(--br-green) 0 40%,var(--br-yellow) 40% 54%,var(--to-blue) 54% 100%)!important;box-shadow:0 0 0 1px rgba(0,39,118,.06) inset}
.public-v153 .public-summary-chip.complete{background:#eaf8ef!important;color:#20733f!important;border:1px solid #cdebd8}.public-v153 .public-summary-chip:not(.complete){background:#eef6fb!important;color:#315b78!important;border:1px solid #d8e8f2}
.public-v153 .public-inline-disclaimer{border-left:4px solid var(--to-yellow)!important;background:#fffdf4!important}

.public-v153 #publicApuracao{border-top:3px solid var(--br-yellow)!important}
.public-v153 #cargoTabs{scroll-padding-inline:8px}
.public-v153 #cargoTabs button{border-color:#d9e6ed!important;background:linear-gradient(180deg,#fff,#f7fafc)!important;color:#375367!important;transition:transform .14s ease,border-color .14s ease,background .14s ease,box-shadow .14s ease}
.public-v153 #cargoTabs button:hover{border-color:#9fc9df!important;transform:translateY(-1px)}
.public-v153 #cargoTabs button.active{position:relative;background:linear-gradient(135deg,var(--to-blue),var(--br-blue))!important;color:#fff!important;border-color:var(--to-blue)!important;box-shadow:0 4px 10px rgba(0,39,118,.16)!important}
.public-v153 #cargoTabs button.active:after{content:'';position:absolute;left:14%;right:14%;bottom:-1px;height:3px;border-radius:99px;background:var(--br-yellow)}
.public-v153 #publicApuracao .progress{background:#e3edf2!important}.public-v153 #publicApuracao .progress i{background:linear-gradient(90deg,var(--col-green),var(--to-blue))!important}

.public-v153 #publicCandidatos{border-top:3px solid var(--br-green)!important;background:linear-gradient(180deg,#fff,#fcfefe)!important}
.public-v153 .leaders{gap:9px!important}
.public-v153 .leader.public-candidate-row,.public-v153 #leaders .leader{
  --party-color:#2450B2;
  position:relative;
  overflow:hidden;
  border:1px solid #dbe6ec!important;
  border-left:5px solid var(--party-color)!important;
  background:linear-gradient(90deg,color-mix(in srgb,var(--party-color) 4%,#fff) 0,#fff 26%)!important;
  box-shadow:0 2px 8px rgba(19,58,84,.055)!important;
  transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease;
}
.public-v153 #leaders .leader:hover{transform:translateY(-1px);box-shadow:0 5px 15px rgba(19,58,84,.09)!important}
.public-v153 #leaders .leader .who small{display:flex!important;align-items:center;gap:5px!important;font-weight:700!important;color:#60727f!important}
.public-v153 #leaders .leader .who small:before{content:'';display:inline-block;flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:var(--party-color);box-shadow:0 0 0 2px #fff,0 0 0 3px color-mix(in srgb,var(--party-color) 30%,#d8e2e8)}
.public-v153 #leaders .leader .votes b{color:#17354b!important;font-variant-numeric:tabular-nums}
.public-v153 #leaders .leader .votes small{font-weight:800!important;color:var(--party-color)!important}
.public-v153 #leaders .leader .bar{height:9px!important;background:#e7edf1!important;box-shadow:inset 0 1px 2px rgba(23,53,75,.05)}
.public-v153 #leaders .leader .bar i{background:var(--party-color)!important;box-shadow:0 1px 2px color-mix(in srgb,var(--party-color) 30%,transparent);transition:width .35s ease}
.public-v153 #leaders .leader.leader-leading{border-color:color-mix(in srgb,var(--col-gold) 65%,#dbe6ec)!important;box-shadow:0 5px 16px rgba(229,177,0,.12)!important}
.public-v153 #leaders .leader.leader-leading .who:after{content:'Liderando';display:inline-flex;margin-top:5px;padding:3px 7px;border-radius:999px;background:#fff7cf;color:#765900;border:1px solid #f1df84;font-size:8.5px;font-weight:900;letter-spacing:.03em;text-transform:uppercase}
.public-v153 .public-number-badge{background:linear-gradient(135deg,var(--br-blue),var(--to-blue))!important}
.public-v153 .public-vote-details-toggle{border-color:#d6e5ed!important;background:#f4f9fc!important;color:#1c5a7d!important}

.public-v153 #publicLocais{border-top:3px solid var(--col-blue)!important}
.public-v153 #publicLocais .place{border:1px solid #dce8ee!important;background:linear-gradient(180deg,#fff,#f9fcfd)!important}
.public-v153 .public-place-progress.complete{background:#e8f7ed!important;color:#1f7040!important;border:1px solid #c8e9d3}.public-v153 .public-place-progress.partial{background:#fff8db!important;color:#785f00!important;border:1px solid #f1e4a4}
.public-v153 .public-place-toggle,.public-v153 .public-team-link,.public-v153 .public-about-v131 summary{color:#175f8c!important}
.public-v153 .public-about-v131{border-top:3px solid var(--col-gold)!important}
.public-v153 .public-details-card{border-top:3px solid var(--to-blue)!important}

.public-v153 .pwa-install-card{border:1px solid #d7e7ef!important;border-top:3px solid var(--br-yellow)!important;background:linear-gradient(135deg,#f8fcff,#fffef5)!important}.public-v153 .pwa-install-btn{background:linear-gradient(135deg,var(--to-blue),var(--br-blue))!important}
.public-v153 .public-bottom-nav{border-top:1px solid #d5e5ed!important;background:rgba(255,255,255,.985)!important}
.public-v153 .public-bottom-nav button.active{position:relative;color:var(--to-blue)!important;background:linear-gradient(180deg,#eef7fb,#f8fbfd)!important}.public-v153 .public-bottom-nav button.active:before{content:'';position:absolute;left:27%;right:27%;top:0;height:3px;border-radius:0 0 4px 4px;background:linear-gradient(90deg,var(--br-green),var(--br-yellow),var(--to-blue))}

@media(max-width:620px){
  .public-v153 .hero.public-main-hero{border-radius:15px!important}
  .public-v153 #cargoTabs{position:sticky;top:0;z-index:80;margin-left:-11px!important;margin-right:-11px!important;padding:7px 11px 8px!important;background:rgba(255,255,255,.96)!important;border-top:1px solid #edf2f5;border-bottom:1px solid #dce8ee;box-shadow:0 5px 12px rgba(20,60,86,.06);backdrop-filter:blur(10px)}
  .public-v153 #cargoTabs button{min-height:42px!important}
  .public-v153 #leaders .leader{border-left-width:4px!important}
}
@media(max-width:390px){
  .public-v153 #leaders .leader .who b{font-size:12px!important}
  .public-v153 #leaders .leader .votes{min-width:72px!important}
  .public-v153 #leaders .leader .votes b{font-size:11.5px!important}
  .public-v153 .regional-signature{font-size:9px}
}
@media(prefers-reduced-motion:reduce){.public-v153 #leaders .leader,.public-v153 #cargoTabs button,.public-v153 #leaders .leader .bar i{transition:none!important}}
`;
write(`${pub}/v153-regional-theme.css`,css);

const js=`(()=>{'use strict';
const PATHS=new Set(['/','/index.html','/transparencia.html']);if(!PATHS.has(location.pathname))return;
const PARTY={
  PT:'#D71920',PL:'#1351A3',MDB:'#178544',PSD:'#2F86C7',PP:'#1B62A9',REPUBLICANOS:'#173D77',PDT:'#C91F2C',PSB:'#E5A800',PODEMOS:'#2BA866',AVANTE:'#F28A22',PSDB:'#1757A6',PCDOB:'#D91D2A',PV:'#1C9C45',REDE:'#28A96B',PSOL:'#F28C00',CIDADANIA:'#E85E24',NOVO:'#F58220',PRD:'#214C8B',SOLIDARIEDADE:'#E66B19',DC:'#1E5F9E',MOBILIZA:'#2B64B1',PCB:'#C5161D',PSTU:'#C61C2B',UP:'#7A1D8F'
};
function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function partyKey(raw){const s=norm(raw);if(!s)return'';if(/UNIAO BRASIL|\\bUNIAO\\b/.test(s))return'UNIAO';for(const k of Object.keys(PARTY)){if(new RegExp('(^| )'+k.replace(/([.*+?^${}()|[\\]\\\\])/g,'\\\\$1')+'( |$)').test(s))return k}return s}
function partyColor(raw){const key=partyKey(raw);if(key==='UNIAO')return'#F0C300';return PARTY[key]||'#2450B2'}
function votes(row){const t=row.querySelector('.votes b')?.textContent||'';const n=Number(t.replace(/[^0-9]/g,''));return Number.isFinite(n)?n:0}
function decorateHero(){const hero=document.querySelector('.hero.public-main-hero');if(!hero)return;if(!hero.querySelector('.regional-signature')){const sig=document.createElement('div');sig.className='regional-signature';sig.innerHTML='<i></i><i></i><i></i><span>Colmeia · Tocantins · Brasil</span>';const target=hero.querySelector('.eyebrow')||hero.firstElementChild;if(target)target.insertAdjacentElement('beforebegin',sig);else hero.prepend(sig)}}
function decorateCandidates(){const rows=[...document.querySelectorAll('#leaders .leader')];rows.forEach(row=>{const party=row.querySelector('.who small')?.textContent||'';const color=partyColor(party);row.style.setProperty('--party-color',color);row.dataset.party=partyKey(party);row.classList.remove('leader-leading')});if(!rows.length)return;const first=votes(rows[0]);const second=rows[1]?votes(rows[1]):-1;if(first>0&&first>second)rows[0].classList.add('leader-leading')}
function tabs(){const box=document.getElementById('cargoTabs');if(!box||box.dataset.v153==='1')return;box.dataset.v153='1';box.setAttribute('role','tablist');box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;setTimeout(()=>{b.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});decorateCandidates()},40)});box.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;const bs=[...box.querySelectorAll('button')];const cur=document.activeElement.closest?.('button');const i=Math.max(0,bs.indexOf(cur));const next=bs[(i+(e.key==='ArrowRight'?1:-1)+bs.length)%bs.length];if(next){e.preventDefault();next.focus();next.click()}})}
function accessibility(){const leaders=document.getElementById('leaders');if(leaders)leaders.setAttribute('aria-live','polite');document.querySelectorAll('#cargoTabs button').forEach(b=>{b.setAttribute('role','tab');b.setAttribute('aria-selected',b.classList.contains('active')?'true':'false')})}
function apply(){if(!document.body)return;document.body.classList.add('public-v153');decorateHero();decorateCandidates();tabs();accessibility()}
function start(){apply();setTimeout(apply,200);setTimeout(apply,900);const leaders=document.getElementById('leaders');if(leaders)new MutationObserver(()=>requestAnimationFrame(apply)).observe(leaders,{childList:true,subtree:true,characterData:true});const tabsEl=document.getElementById('cargoTabs');if(tabsEl)new MutationObserver(()=>requestAnimationFrame(accessibility)).observe(tabsEl,{attributes:true,subtree:true,attributeFilter:['class']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;
write(`${pub}/v153-regional-theme.js`,js);

for(const page of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(page);
  if(!html.includes('/v153-regional-theme.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v153-regional-theme.css?v=153">\n</head>');
  if(!html.includes('/v153-regional-theme.js'))html=html.replace('</body>','<script src="/v153-regional-theme.js?v=153"></script>\n</body>');
  write(page,html);
}

console.log('V1.5.3 regional theme applied: Brazil, Tocantins and Colmeia palette, party-colored candidate bars and leader highlight.');
