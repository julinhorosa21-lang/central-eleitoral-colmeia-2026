import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const publicCss=`
/* V1.5.5 — tema regional robusto: Brasil + Tocantins + Colmeia */
body.public-v130{
  --br-green:#009B3A;
  --br-yellow:#FFDF00;
  --br-blue:#002776;
  --to-blue:#2450B2;
  --to-yellow:#F4C400;
  --col-blue:#9FD0F0;
  --col-green:#2E9E58;
  --col-gold:#E5B100;
  --public-blue:#174F7A!important;
  --public-blue-2:#2450B2!important;
  --public-bg:#F2F7FA!important;
  background:linear-gradient(180deg,#eef8f9 0,#f5f9fb 230px,#f3f6f8 100%)!important;
}
body.public-v130 .hero.public-main-hero{
  position:relative!important;
  isolation:isolate!important;
  overflow:hidden!important;
  border:1px solid rgba(255,255,255,.18)!important;
  border-top:4px solid var(--br-yellow)!important;
  background:linear-gradient(128deg,#008D3B 0%,#087E48 30%,#2450B2 68%,#002776 100%)!important;
  box-shadow:0 12px 28px rgba(0,39,118,.15)!important;
}
body.public-v130 .hero.public-main-hero:before{
  content:''!important;display:block!important;position:absolute!important;z-index:0!important;
  width:190px!important;height:190px!important;right:-74px!important;top:-92px!important;
  border-radius:34px!important;transform:rotate(45deg)!important;
  background:rgba(255,223,0,.22)!important;
}
body.public-v130 .hero.public-main-hero:after{
  content:''!important;display:block!important;position:absolute!important;z-index:0!important;
  width:150px!important;height:150px!important;left:-72px!important;bottom:-100px!important;
  border-radius:50%!important;background:rgba(159,208,240,.22)!important;
}
body.public-v130 .hero.public-main-hero>*{position:relative;z-index:1}
body.public-v130 .hero .eyebrow{color:#FFF4A6!important}
body.public-v130 .hero h1{color:#fff!important;text-shadow:0 1px 0 rgba(0,0,0,.08)!important}
body.public-v130 .hero p{color:rgba(255,255,255,.86)!important}
body.public-v130 .hero .live{background:rgba(0,39,118,.18)!important;border:1px solid rgba(255,255,255,.20)!important;color:#fff!important}
body.public-v130 .hero .unified-team-entry{background:#fff!important;color:#164B70!important;border-color:#fff!important}
.regional-signature{display:flex;align-items:center;gap:6px;width:max-content;max-width:100%;margin:0 0 7px;padding:5px 8px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(255,255,255,.11);color:#fff;font-size:9px;font-weight:850;letter-spacing:.025em;backdrop-filter:blur(5px)}
.regional-signature i{display:block;width:7px;height:7px;border-radius:50%;flex:0 0 auto}.regional-signature i:nth-child(1){background:#00A651}.regional-signature i:nth-child(2){background:#FFDF00}.regional-signature i:nth-child(3){background:#9FD0F0}

body.public-v130 .metrics .metric,body.public-v130 .public-overview,body.public-v130 #publicApuracao,body.public-v130 #publicCandidatos,body.public-v130 #publicLocais,body.public-v130 .public-details-card,body.public-v130 .public-regions-card{border-color:#D7E5EC!important;box-shadow:0 3px 12px rgba(25,72,102,.055)!important}
body.public-v130 .metrics .metric{position:relative!important;overflow:hidden!important}
body.public-v130 .metrics .metric:nth-child(4n+1){border-top:3px solid var(--br-green)!important}
body.public-v130 .metrics .metric:nth-child(4n+2){border-top:3px solid var(--to-blue)!important}
body.public-v130 .metrics .metric:nth-child(4n+3){border-top:3px solid var(--br-yellow)!important}
body.public-v130 .metrics .metric:nth-child(4n+4){border-top:3px solid var(--col-blue)!important}
body.public-v130 .metrics .metric b{color:#173C55!important}
body.public-v130 .metrics .civic-metric-icon{background:#EDF6FA!important;color:#2450B2!important}

body.public-v130 .public-overview{border-top:3px solid var(--col-blue)!important;background:linear-gradient(180deg,#fff,#fbfdfe)!important}
body.public-v130 .public-overview-kicker{color:var(--to-blue)!important}
body.public-v130 .public-overview-row>strong{color:var(--br-blue)!important}
body.public-v130 .public-progress{height:10px!important;background:#E5EDF2!important}
body.public-v130 .public-progress i{background:linear-gradient(90deg,var(--br-green) 0 39%,var(--br-yellow) 39% 54%,var(--to-blue) 54% 100%)!important}
body.public-v130 .notice{border-left:4px solid var(--to-yellow)!important;background:#FFFBEA!important}
body.public-v130 .pwa-install-card{border:1px solid #D6E7E4!important;border-top:3px solid var(--br-green)!important;background:linear-gradient(135deg,#F0FAF4 0%,#F8FCFF 58%,#FFFEF2 100%)!important}
body.public-v130 .pwa-install-btn{background:linear-gradient(135deg,#16734D 0%,#2450B2 100%)!important;border-color:transparent!important;color:#fff!important}

body.public-v130 #publicApuracao{border-top:3px solid var(--br-yellow)!important}
body.public-v130 #cargoTabs button{border-color:#D7E4EB!important;background:linear-gradient(180deg,#fff,#F6F9FB)!important;color:#36566B!important}
body.public-v130 #cargoTabs button.active{position:relative!important;background:linear-gradient(135deg,var(--to-blue),var(--br-blue))!important;color:#fff!important;border-color:var(--to-blue)!important;box-shadow:0 4px 11px rgba(0,39,118,.15)!important}
body.public-v130 #cargoTabs button.active:after{content:'';position:absolute;left:14%;right:14%;bottom:-1px;height:3px;border-radius:99px;background:var(--br-yellow)}
body.public-v130 #publicApuracao .progress i{background:linear-gradient(90deg,var(--col-green),var(--to-blue))!important}

body.public-v130 #publicCandidatos{position:relative!important;border-top:3px solid var(--br-green)!important;background:linear-gradient(180deg,#fff,#FCFEFE)!important}
body.public-v130 #publicCandidatos:before{content:'';position:absolute;left:0;right:0;top:-3px;height:3px;background:linear-gradient(90deg,var(--br-green),var(--br-yellow),var(--to-blue));border-radius:12px 12px 0 0}
body.public-v130 #leaders .leader{--party-color:#2450B2;position:relative!important;overflow:hidden!important;border:1px solid #D9E5EB!important;border-left:5px solid var(--party-color)!important;background:linear-gradient(90deg,color-mix(in srgb,var(--party-color) 5%,#fff) 0%,#fff 30%)!important;box-shadow:0 2px 8px rgba(19,58,84,.055)!important}
body.public-v130 #leaders .leader .who small{display:flex!important;align-items:center!important;gap:5px!important;font-weight:750!important}
body.public-v130 #leaders .leader .who small:before{content:'';display:inline-block;width:8px;height:8px;flex:0 0 8px;border-radius:50%;background:var(--party-color)}
body.public-v130 #leaders .leader .votes small{color:var(--party-color)!important;font-weight:900!important}
body.public-v130 #leaders .leader .bar{height:10px!important;background:#E6EDF1!important}
body.public-v130 #leaders .leader .bar i{background:var(--party-color)!important;border-radius:99px!important;transition:width .35s ease}
body.public-v130 #leaders .leader.leader-leading{border-top-color:var(--col-gold)!important;border-right-color:var(--col-gold)!important;border-bottom-color:var(--col-gold)!important;box-shadow:0 5px 16px rgba(229,177,0,.13)!important}
body.public-v130 #leaders .leader.leader-leading .who:after{content:'Liderando';display:inline-flex;margin-top:5px;padding:3px 7px;border-radius:999px;background:#FFF7CF;color:#765900;border:1px solid #F1DF84;font-size:8.5px;font-weight:900;letter-spacing:.03em;text-transform:uppercase}
body.public-v130 .public-number-badge{background:linear-gradient(135deg,var(--br-blue),var(--to-blue))!important}
.v155-rank{position:absolute;z-index:6;left:-3px;top:-3px;display:grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#fff;color:#35576c;border:1px solid #d9e4ea;box-shadow:0 2px 6px rgba(19,58,84,.12);font-size:7.5px;font-weight:950;line-height:1}.v155-rank.r1{background:#FFF6C7;color:#6F5700;border-color:#EAD36A}.v155-rank.r2{background:#F2F6F8;color:#49616F;border-color:#D2DDE3}.v155-rank.r3{background:#FFF0E3;color:#87532C;border-color:#EBCCB2}.v155-gap{display:block;margin-top:4px;color:#788995;font-size:8.5px;font-weight:700}
.v155-race{position:relative;margin:8px 0 11px;padding:11px 12px 10px;border:1px solid #D8E7EE;border-radius:12px;background:linear-gradient(135deg,#F2FAF5 0%,#fff 48%,#F7FBFF 72%,#FFFDF1 100%);box-shadow:0 2px 9px rgba(22,66,94,.05);overflow:hidden}.v155-race[hidden]{display:none!important}.v155-race:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--br-green),var(--br-yellow),var(--to-blue))}.v155-race-head{display:flex;align-items:flex-start;justify-content:space-between;gap:9px}.v155-race-kicker{display:block;color:#638091;font-size:8.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.v155-race-title{display:block;margin-top:2px;color:#173B53;font-size:12.5px;font-weight:900}.v155-race-note{display:block;margin-top:3px;color:#70828E;font-size:9px;line-height:1.3}.v155-race-badge{flex:0 0 auto;padding:5px 8px;border-radius:999px;border:1px solid #D9E5EB;background:#fff;color:#31566F;font-size:8px;font-weight:900;white-space:nowrap}.v155-race-badge.tight{border-color:#ECD77C;background:#FFF8D6;color:#725900}.v155-race-badge.tie{border-color:#B9D8EA;background:#EEF8FD;color:#225F80}.v155-race-strip{display:flex;height:9px;margin-top:9px;border-radius:999px;background:#E8EEF2;overflow:hidden}.v155-race-strip i{display:block;height:100%}.v155-race-legend{display:flex;flex-wrap:wrap;gap:5px 9px;margin-top:7px;color:#667B88;font-size:8.5px}.v155-race-legend span{display:inline-flex;align-items:center;gap:4px}.v155-race-legend i{width:7px;height:7px;border-radius:50%}

body.public-v130 #publicLocais{border-top:3px solid var(--col-blue)!important}
body.public-v130 #publicLocais .place{border-color:#DCE8EE!important;background:linear-gradient(180deg,#fff,#F9FCFD)!important}
body.public-v130 .public-place-progress.complete{background:#E8F7ED!important;color:#1F7040!important}
body.public-v130 .public-place-progress.partial{background:#FFF8DB!important;color:#785F00!important}
body.public-v130 .public-details-card{border-top:3px solid var(--to-blue)!important}
body.public-v130 .public-regions-card{border-top:3px solid var(--col-gold)!important}
body.public-v130 .public-bottom-nav{border-top-color:#D5E5ED!important;background:rgba(255,255,255,.985)!important}
body.public-v130 .public-bottom-nav button.active{position:relative!important;color:var(--to-blue)!important;background:linear-gradient(180deg,#EEF7FB,#FAFCFD)!important}
body.public-v130 .public-bottom-nav button.active:before{content:'';position:absolute;left:24%;right:24%;top:0;height:3px;border-radius:0 0 4px 4px;background:linear-gradient(90deg,var(--br-green),var(--br-yellow),var(--to-blue))}

@media(max-width:620px){
 body.public-v130 .hero.public-main-hero{border-radius:14px!important;padding:16px!important}
 body.public-v130 #cargoTabs{position:sticky!important;top:0!important;z-index:80!important;margin-left:-10px!important;margin-right:-10px!important;padding:7px 10px 8px!important;background:rgba(255,255,255,.96)!important;border-bottom:1px solid #DCE8EE!important;box-shadow:0 5px 12px rgba(20,60,86,.06)!important;backdrop-filter:blur(10px)!important}
 body.public-v130 #leaders .leader{border-left-width:4px!important}
 .regional-signature{font-size:8.5px}
}
@media(prefers-reduced-motion:reduce){body.public-v130 #leaders .leader .bar i{transition:none!important}}
`;
write(`${pub}/v153-regional-theme.css`,publicCss);

const publicJs=`(function(){'use strict';
var PARTY={PT:'#D71920',PL:'#1351A3',MDB:'#178544',PSD:'#2F86C7',PP:'#1B62A9',REPUBLICANOS:'#173D77',PDT:'#C91F2C',PSB:'#E5A800',PODEMOS:'#2BA866',AVANTE:'#F28A22',PSDB:'#1757A6',PCDOB:'#D91D2A',PV:'#1C9C45',REDE:'#28A96B',PSOL:'#F28C00',CIDADANIA:'#E85E24',NOVO:'#F58220',PRD:'#214C8B',SOLIDARIEDADE:'#E66B19',DC:'#1E5F9E',MOBILIZA:'#2B64B1',PCB:'#C5161D',PSTU:'#C61C2B',UP:'#7A1D8F'};
function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function pkey(v){var s=norm(v),k;if(!s)return'';if(s.indexOf('UNIAO BRASIL')>=0||s==='UNIAO')return'UNIAO';for(k in PARTY)if((' '+s+' ').indexOf(' '+k+' ')>=0)return k;return s}
function pcolor(v){var k=pkey(v);return k==='UNIAO'?'#F0C300':(PARTY[k]||'#2450B2')}
function numberFrom(row){var el=row.querySelector('.votes b'),t=el?el.textContent:'';var n=Number(String(t).replace(/[^0-9]/g,''));return isFinite(n)?n:0}
function percentFrom(row){var el=row.querySelector('.votes small'),t=el?el.textContent:'';var m=String(t).replace(',','.').match(/([0-9]+(?:\\.[0-9]+)?)/);return m?Number(m[1]):0}
function nameFrom(row){var el=row.querySelector('.who b');return el?el.textContent.trim():'Candidato'}
function signature(){var hero=document.querySelector('.hero.public-main-hero')||document.querySelector('.hero');if(!hero||hero.querySelector('.regional-signature'))return;var d=document.createElement('div');d.className='regional-signature';d.innerHTML='<i></i><i></i><i></i><span>Colmeia · Tocantins · Brasil</span>';hero.insertBefore(d,hero.firstChild)}
function summary(rows){var host=document.getElementById('leaders');if(!host)return;var box=document.querySelector('.v155-race');if(!box){box=document.createElement('div');box.className='v155-race';box.hidden=true;host.parentNode.insertBefore(box,host)}if(rows.length<2){box.hidden=true;return}var v1=numberFrom(rows[0]),v2=numberFrom(rows[1]);if(v1<=0&&v2<=0){box.hidden=true;return}var p1=percentFrom(rows[0]),p2=percentFrom(rows[1]),gap=v1-v2,pp=Math.max(0,p1-p2);var state='Diferença atual',cls='';if(gap===0){state='Empate no momento';cls=' tie'}else if(pp<=1){state='Diferença muito estreita';cls=' tight'}else if(pp<=3){state='Diferença estreita';cls=' tight'}var total=0,i;for(i=0;i<Math.min(rows.length,5);i++)total+=numberFrom(rows[i]);var seg='',leg='';for(i=0;i<Math.min(rows.length,5);i++){var r=rows[i],v=numberFrom(r),w=total?100*v/total:0,c=r.style.getPropertyValue('--party-color')||'#2450B2';seg+='<i style="width:'+w.toFixed(2)+'%;background:'+c+'"></i>';leg+='<span><i style="background:'+c+'"></i>'+nameFrom(r)+'</span>'}box.hidden=false;box.innerHTML='<div class="v155-race-head"><div><span class="v155-race-kicker">Leitura da disputa</span><b class="v155-race-title">'+gap.toLocaleString('pt-BR')+' votos de diferença</b><span class="v155-race-note">Resultado parcial conforme os BUs já recebidos. Pode mudar durante a apuração.</span></div><span class="v155-race-badge'+cls+'">'+state+'</span></div><div class="v155-race-strip">'+seg+'</div><div class="v155-race-legend">'+leg+'</div>'}
function decorate(){signature();var rows=[].slice.call(document.querySelectorAll('#leaders .leader'));var i;for(i=0;i<rows.length;i++){var row=rows[i],small=row.querySelector('.who small'),party=small?small.textContent:'';row.style.setProperty('--party-color',pcolor(party));row.classList.remove('leader-leading');var num=row.querySelector('.num');if(num){var rank=num.querySelector('.v155-rank');if(i<3){if(!rank){rank=document.createElement('span');rank.className='v155-rank';num.appendChild(rank)}rank.className='v155-rank r'+(i+1);rank.textContent=(i+1)+'º'}else if(rank)rank.remove()}var old=row.querySelector('.v155-gap');if(old)old.remove()}if(rows.length){var v1=numberFrom(rows[0]),v2=rows.length>1?numberFrom(rows[1]):-1;if(v1>0&&v1>v2)rows[0].classList.add('leader-leading');for(i=1;i<Math.min(rows.length,3);i++){var vv=numberFrom(rows[i]);if(v1>vv&&v1>0){var votes=rows[i].querySelector('.votes');if(votes){var note=document.createElement('span');note.className='v155-gap';note.textContent=(v1-vv).toLocaleString('pt-BR')+' votos atrás do 1º';votes.appendChild(note)}}}}summary(rows)}
var queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;decorate()})}
function start(){if(document.body)document.body.classList.add('public-v155');decorate();setTimeout(decorate,250);setTimeout(decorate,900);var l=document.getElementById('leaders');if(l)new MutationObserver(schedule).observe(l,{childList:true,subtree:true,characterData:true});var tabs=document.getElementById('cargoTabs');if(tabs)tabs.addEventListener('click',function(){setTimeout(decorate,60)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;
write(`${pub}/v153-regional-theme.js`,publicJs);

const adminCss=`
/* V1.5.5 — Central Administrativa na mesma família regional */
:root{--brand:#174F7A!important;--brand2:#16804D!important;--regional-green:#009B3A;--regional-yellow:#FFDF00;--regional-blue:#002776;--tocantins-blue:#2450B2;--colmeia-blue:#9FD0F0;--colmeia-gold:#E5B100}
body{background:linear-gradient(180deg,#EDF7F8 0,#F3F7F9 250px,#F3F6F8 100%)!important}
.admin-hero{position:relative;isolation:isolate;overflow:hidden;border-top:4px solid var(--regional-yellow)!important;background:linear-gradient(128deg,#087E48 0%,#126D62 32%,#2450B2 70%,#123F62 100%)!important;box-shadow:0 18px 38px rgba(20,63,94,.16)!important}
.admin-hero:before{content:'';position:absolute;z-index:0;width:190px;height:190px;right:-80px;top:-104px;border-radius:35px;transform:rotate(45deg);background:rgba(255,223,0,.20)}
.admin-hero:after{content:'';position:absolute;z-index:0;width:150px;height:150px;left:-85px;bottom:-110px;border-radius:50%;background:rgba(159,208,240,.20)}
.admin-hero>*{position:relative;z-index:1}.admin-hero .eyebrow{color:#FFF2A2!important}.live-dot.ok{background:#49E39B!important;box-shadow:0 0 0 4px rgba(73,227,155,.13)!important}
.btn.primary,.btn:not(.ghost):not(.ghost-dark):not(.light){background:linear-gradient(135deg,#176A63,#2450B2)!important;border-color:transparent!important}.btn.light{color:#174F7A!important}
.kicker{color:#13744A!important}.overview-card{border-top:3px solid var(--colmeia-blue)!important}.progress-copy>strong{color:var(--regional-blue)!important}.progress-track{height:12px!important}.progress-track span{background:linear-gradient(90deg,var(--regional-green) 0 40%,var(--regional-yellow) 40% 55%,var(--tocantins-blue) 55% 100%)!important}
.metric{overflow:hidden}.metric:nth-child(6n+1){border-top:3px solid var(--regional-green)!important}.metric:nth-child(6n+2){border-top:3px solid var(--tocantins-blue)!important}.metric:nth-child(6n+3){border-top:3px solid var(--regional-yellow)!important}.metric:nth-child(6n+4){border-top:3px solid var(--colmeia-blue)!important}.metric:nth-child(6n+5){border-top:3px solid var(--colmeia-gold)!important}.metric:nth-child(6n+6){border-top:3px solid #2E9E58!important}.metric-icon{background:#EDF6FA!important;color:#174F7A!important}
.card,.overview-card,.metric,.section-card,.pending-row{border-color:#D8E5EB!important}.count-pill{background:#EDF6FA!important;color:#174F7A!important}.system-box{border-left:4px solid var(--tocantins-blue)!important}.cargo-tabs button.active{background:linear-gradient(135deg,var(--tocantins-blue),var(--regional-blue))!important;border-color:var(--tocantins-blue)!important}.leader-bar span{background:linear-gradient(90deg,#2E9E58,#2450B2)!important}
.bottom-nav{border-top-color:#D4E4EB!important}.bottom-nav button.active{position:relative;color:#174F7A!important;background:linear-gradient(180deg,#EDF7FA,#F9FBFC)!important}.bottom-nav button.active:before{content:'';position:absolute;left:27%;right:27%;top:0;height:3px;background:linear-gradient(90deg,var(--regional-green),var(--regional-yellow),var(--tocantins-blue))}
@media(max-width:720px){.admin-hero{border-top-width:4px!important}.metric{min-height:116px}}
`;
write(`${pub}/admin/v155-regional-admin.css`,adminCss);

for(const page of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(page);
  if(!html.includes('/v153-regional-theme.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v153-regional-theme.css?v=155">\n</head>');
  else html=html.replace(/\/v153-regional-theme\.css\?v=\d+/g,'/v153-regional-theme.css?v=155');
  if(!html.includes('/v153-regional-theme.js'))html=html.replace('</body>','<script src="/v153-regional-theme.js?v=155"></script>\n</body>');
  else html=html.replace(/\/v153-regional-theme\.js\?v=\d+/g,'/v153-regional-theme.js?v=155');
  write(page,html);
}

const adminPage=`${pub}/admin/index.html`;
if(fs.existsSync(adminPage)){
  let html=read(adminPage);
  if(!html.includes('/admin/v155-regional-admin.css'))html=html.replace('</head>','<link rel="stylesheet" href="/admin/v155-regional-admin.css?v=155">\n</head>');
  write(adminPage,html);
}

const manifestPath=`${pub}/manifest.webmanifest`;
if(fs.existsSync(manifestPath)){
  const manifest=JSON.parse(read(manifestPath));
  manifest.theme_color='#0B6C61';
  manifest.background_color='#F2F7FA';
  write(manifestPath,JSON.stringify(manifest,null,2));
}

const swPath=`${pub}/service-worker.js`;
if(fs.existsSync(swPath)){
  let sw=read(swPath);
  sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.5.5-regional';");
  if(!sw.includes('/v153-regional-theme.css')){
    sw=sw.replace(/const CORE=\[([\s\S]*?)\];/,function(all,inner){return "const CORE=["+inner+",'/v153-regional-theme.css','/v153-regional-theme.js','/admin/v155-regional-admin.css'];"});
  }
  write(swPath,sw);
}

console.log('V1.5.5 applied: robust regional public theme, party colors, regional admin styling and refreshed PWA cache.');
