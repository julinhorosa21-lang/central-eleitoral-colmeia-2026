import fs from 'node:fs';

const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

function addBodyClasses(html,classes){
  return html.replace(/<body([^>]*)>/i,(full,attrs)=>{
    const m=attrs.match(/class=(['"])(.*?)\1/i);
    if(m){
      const set=new Set((m[2]+' '+classes).trim().split(/\s+/));
      return full.replace(m[0],`class=${m[1]}${[...set].join(' ')}${m[1]}`);
    }
    return `<body${attrs} class="${classes}">`;
  });
}

const css=`
/* V1.5.6 — identidade Brasil + Tocantins + Colmeia em Público e Operação */
body.ce-regional-public,body.ce-regional-operation{
  --br-green:#009B3A;--br-yellow:#FFDF00;--br-blue:#002776;
  --to-blue:#2450B2;--to-yellow:#F4C400;--col-blue:#9FD0F0;
  --col-green:#2E9E58;--col-gold:#E5B100;
  --regional-ink:#17384F;--regional-line:#D7E5EC;
  background:linear-gradient(180deg,#EEF8F9 0,#F6FAFC 240px,#F3F6F8 100%)!important;
}

body.ce-regional-public .hero,body.ce-regional-operation .hero{
  position:relative!important;isolation:isolate!important;overflow:hidden!important;
  border:1px solid rgba(255,255,255,.18)!important;border-top:4px solid var(--br-yellow)!important;
  background:linear-gradient(128deg,#008D3B 0%,#087E48 29%,#2450B2 68%,#002776 100%)!important;
  box-shadow:0 12px 30px rgba(0,39,118,.15)!important;
}
body.ce-regional-public .hero:before,body.ce-regional-operation .hero:before{
  content:''!important;display:block!important;position:absolute!important;z-index:0!important;
  width:180px!important;height:180px!important;right:-72px!important;top:-96px!important;
  border-radius:32px!important;transform:rotate(45deg)!important;background:rgba(255,223,0,.23)!important;
}
body.ce-regional-public .hero:after,body.ce-regional-operation .hero:after{
  content:''!important;display:block!important;position:absolute!important;z-index:0!important;
  width:150px!important;height:150px!important;left:-78px!important;bottom:-105px!important;
  border-radius:50%!important;background:rgba(159,208,240,.21)!important;
}
body.ce-regional-public .hero>*,body.ce-regional-operation .hero>*{position:relative!important;z-index:1!important}
body.ce-regional-public .hero .eyebrow,body.ce-regional-operation .hero .eyebrow{color:#FFF3A0!important}
body.ce-regional-public .hero h1,body.ce-regional-operation .hero h1{color:#fff!important;text-shadow:0 1px 0 rgba(0,0,0,.08)!important}
body.ce-regional-public .hero p,body.ce-regional-operation .hero p{color:rgba(255,255,255,.86)!important}
body.ce-regional-public .hero .live,body.ce-regional-operation .hero .live{background:rgba(0,39,118,.17)!important;border-color:rgba(255,255,255,.2)!important;color:#fff!important}
.ce-regional-signature{display:flex;align-items:center;gap:6px;width:max-content;max-width:100%;margin:0 0 7px;padding:5px 8px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(255,255,255,.11);color:#fff;font-size:9px;font-weight:850;letter-spacing:.025em;backdrop-filter:blur(5px)}
.ce-regional-signature i{display:block;width:7px;height:7px;border-radius:50%}.ce-regional-signature i:nth-child(1){background:#00A651}.ce-regional-signature i:nth-child(2){background:#FFDF00}.ce-regional-signature i:nth-child(3){background:#9FD0F0}

body.ce-regional-public .metric,body.ce-regional-operation .metric,
body.ce-regional-public .card,body.ce-regional-operation .card,
body.ce-regional-public .place,body.ce-regional-operation .place,
body.ce-regional-public .region,body.ce-regional-operation .region{
  border-color:var(--regional-line)!important;box-shadow:0 4px 15px rgba(22,65,93,.065)!important;
}
body.ce-regional-public .metrics .metric,body.ce-regional-operation .metrics .metric,
body.ce-regional-public .summary .metric,body.ce-regional-operation .summary .metric{position:relative!important;overflow:hidden!important;background:linear-gradient(180deg,#fff,#FCFEFF)!important}
body.ce-regional-public .metric:nth-child(4n+1),body.ce-regional-operation .metric:nth-child(4n+1){border-top:3px solid var(--br-green)!important}
body.ce-regional-public .metric:nth-child(4n+2),body.ce-regional-operation .metric:nth-child(4n+2){border-top:3px solid var(--to-blue)!important}
body.ce-regional-public .metric:nth-child(4n+3),body.ce-regional-operation .metric:nth-child(4n+3){border-top:3px solid var(--br-yellow)!important}
body.ce-regional-public .metric:nth-child(4n+4),body.ce-regional-operation .metric:nth-child(4n+4){border-top:3px solid var(--col-blue)!important}
body.ce-regional-public .metric b,body.ce-regional-operation .metric b{color:var(--regional-ink)!important}
body.ce-regional-public .civic-metric-icon,body.ce-regional-operation .civic-metric-icon,
body.ce-regional-public .metric-icon,body.ce-regional-operation .metric-icon{background:#EDF6FA!important;color:var(--to-blue)!important}

body.ce-regional-public .progress,body.ce-regional-operation .progress,
body.ce-regional-public .progress-track,body.ce-regional-operation .progress-track{background:#E4EDF2!important;overflow:hidden!important}
body.ce-regional-public .progress>span,body.ce-regional-operation .progress>span,
body.ce-regional-public .progress>i,body.ce-regional-operation .progress>i,
body.ce-regional-public .progress-track>span,body.ce-regional-operation .progress-track>span{
  background:linear-gradient(90deg,var(--br-green) 0 39%,var(--br-yellow) 39% 54%,var(--to-blue) 54% 100%)!important;
}
body.ce-regional-public .notice,body.ce-regional-operation .notice{border-left:4px solid var(--to-yellow)!important;background:#FFFBEA!important}
body.ce-regional-public .tse-status,body.ce-regional-operation .tse-status{border-color:#E9D884!important;background:#FFFBEA!important}
body.ce-regional-public .pwa-install-card,body.ce-regional-operation .pwa-install-card,
body.ce-regional-public .pwa-panel,body.ce-regional-operation .pwa-panel{border-top:3px solid var(--br-green)!important;background:linear-gradient(135deg,#F0FAF4 0%,#F7FBFF 62%,#FFFEF1 100%)!important}
body.ce-regional-public .pwa-install-btn,body.ce-regional-operation .pwa-install-btn{background:linear-gradient(135deg,#16734D,#2450B2)!important;color:#fff!important}

body.ce-regional-public .btn.primary,body.ce-regional-operation .btn.primary,
body.ce-regional-public .toolbar .primary,body.ce-regional-operation .toolbar .primary,
body.ce-regional-public .v022-quicknav .primary,body.ce-regional-operation .v022-quicknav .primary{
  background:linear-gradient(135deg,#16734D 0%,#2450B2 100%)!important;border-color:transparent!important;color:#fff!important;
}
body.ce-regional-public .tabs button.active,body.ce-regional-operation .tabs button.active,
body.ce-regional-public .cargo-tabs button.active,body.ce-regional-operation .cargo-tabs button.active,
body.ce-regional-public #cargoTabs button.active,body.ce-regional-operation #cargoTabs button.active{
  position:relative!important;background:linear-gradient(135deg,var(--to-blue),var(--br-blue))!important;color:#fff!important;border-color:var(--to-blue)!important;box-shadow:0 4px 11px rgba(0,39,118,.15)!important;
}
body.ce-regional-public .tabs button.active:after,body.ce-regional-operation .tabs button.active:after,
body.ce-regional-public .cargo-tabs button.active:after,body.ce-regional-operation .cargo-tabs button.active:after,
body.ce-regional-public #cargoTabs button.active:after,body.ce-regional-operation #cargoTabs button.active:after{
  content:'';position:absolute;left:17%;right:17%;bottom:-1px;height:3px;border-radius:99px;background:var(--br-yellow);
}

body.ce-regional-public .leader,body.ce-regional-operation .leader,
body.ce-regional-public .candidate-card,body.ce-regional-operation .candidate-card{
  --party-color:#2450B2;position:relative!important;border-color:#D9E5EB!important;border-left:5px solid var(--party-color)!important;
  background:linear-gradient(90deg,color-mix(in srgb,var(--party-color) 5%,#fff) 0%,#fff 31%)!important;
}
body.ce-regional-public .leader .bar i,body.ce-regional-operation .leader .bar i,
body.ce-regional-public .leader-bar span,body.ce-regional-operation .leader-bar span,
body.ce-regional-public .candidate-card .progress span,body.ce-regional-operation .candidate-card .progress span{background:var(--party-color)!important}
body.ce-regional-public .leader .votes small,body.ce-regional-operation .leader .votes small,
body.ce-regional-public .leader-votes small,body.ce-regional-operation .leader-votes small{color:var(--party-color)!important;font-weight:900!important}
body.ce-regional-public .leader[data-ce-rank="1"],body.ce-regional-operation .leader[data-ce-rank="1"]{border-top-color:var(--col-gold)!important;border-right-color:var(--col-gold)!important;border-bottom-color:var(--col-gold)!important;box-shadow:0 5px 16px rgba(229,177,0,.13)!important}
body.ce-regional-public .leader[data-ce-rank] .num,body.ce-regional-operation .leader[data-ce-rank] .num{position:relative!important}
body.ce-regional-public .leader[data-ce-rank] .num:before,body.ce-regional-operation .leader[data-ce-rank] .num:before{content:attr(data-ce-rank-label);position:absolute;z-index:8;left:-4px;top:-4px;display:grid;place-items:center;min-width:20px;height:20px;padding:0 4px;border-radius:999px;background:#fff;color:#35576C;border:1px solid #D9E4EA;box-shadow:0 2px 6px rgba(19,58,84,.12);font-size:7.5px;font-weight:950}
body.ce-regional-public .leader[data-ce-rank="1"] .num:before,body.ce-regional-operation .leader[data-ce-rank="1"] .num:before{background:#FFF6C7;color:#6F5700;border-color:#EAD36A}
body.ce-regional-public .leader[data-ce-rank="2"] .num:before,body.ce-regional-operation .leader[data-ce-rank="2"] .num:before{background:#F2F6F8;color:#49616F}
body.ce-regional-public .leader[data-ce-rank="3"] .num:before,body.ce-regional-operation .leader[data-ce-rank="3"] .num:before{background:#FFF0E3;color:#87532C;border-color:#EBCCB2}

.ce-race-summary{position:relative;margin:8px 0 11px;padding:11px 12px;border:1px solid #D8E7EE;border-radius:12px;background:linear-gradient(135deg,#F2FAF5,#fff 48%,#F7FBFF 74%,#FFFDF1);box-shadow:0 2px 9px rgba(22,66,94,.05);overflow:hidden}.ce-race-summary[hidden]{display:none!important}.ce-race-summary:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#009B3A,#FFDF00,#2450B2)}.ce-race-summary b{display:block;color:#173B53;font-size:12px}.ce-race-summary span{display:block;margin-top:3px;color:#70828E;font-size:9px}.ce-race-strip{display:flex;height:8px;margin-top:8px;border-radius:999px;background:#E8EEF2;overflow:hidden}.ce-race-strip i{display:block;height:100%}

body.ce-regional-public .footer-nav,body.ce-regional-operation .footer-nav,
body.ce-regional-public .public-bottom-nav,body.ce-regional-operation .public-bottom-nav{
  border-top-color:#D5E5ED!important;background:rgba(255,255,255,.985)!important;
}
body.ce-regional-public .footer-nav button.active,body.ce-regional-operation .footer-nav button.active,
body.ce-regional-public .public-bottom-nav button.active,body.ce-regional-operation .public-bottom-nav button.active{
  position:relative!important;color:var(--to-blue)!important;background:#EEF7FB!important;
}
body.ce-regional-public .footer-nav button.active:before,body.ce-regional-operation .footer-nav button.active:before,
body.ce-regional-public .public-bottom-nav button.active:before,body.ce-regional-operation .public-bottom-nav button.active:before{
  content:'';position:absolute;left:25%;right:25%;top:0;height:3px;background:linear-gradient(90deg,var(--br-green),var(--br-yellow),var(--to-blue));
}

@media(max-width:620px){
 body.ce-regional-public .hero,body.ce-regional-operation .hero{border-radius:14px!important}
 body.ce-regional-public .leader,body.ce-regional-operation .leader,body.ce-regional-public .candidate-card,body.ce-regional-operation .candidate-card{border-left-width:4px!important}
 .ce-regional-signature{font-size:8.5px}
}
@media(prefers-reduced-motion:reduce){body.ce-regional-public *,body.ce-regional-operation *{scroll-behavior:auto!important}}
`;
write(`${pub}/v153-regional-theme.css`,css);

const js=`(function(){'use strict';
var PATHS={'/':1,'/index.html':1,'/transparencia.html':1,'/operacao.html':1};if(!PATHS[location.pathname])return;
var PARTY={PT:'#D71920',PL:'#1351A3',MDB:'#178544',PSD:'#2F86C7',PP:'#1B62A9',REPUBLICANOS:'#173D77',PDT:'#C91F2C',PSB:'#E5A800',PODEMOS:'#2BA866',AVANTE:'#F28A22',PSDB:'#1757A6',PCDOB:'#D91D2A',PV:'#1C9C45',REDE:'#28A96B',PSOL:'#F28C00',CIDADANIA:'#E85E24',NOVO:'#F58220',PRD:'#214C8B',SOLIDARIEDADE:'#E66B19',DC:'#1E5F9E',MOBILIZA:'#2B64B1',PCB:'#C5161D',PSTU:'#C61C2B',UP:'#7A1D8F'};
function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function key(v){var s=norm(v),k;if(!s)return'';if(s.indexOf('UNIAO BRASIL')>=0||s==='UNIAO')return'UNIAO';for(k in PARTY){if((' '+s+' ').indexOf(' '+k+' ')>=0)return k}return''}
function color(v){var k=key(v);return k==='UNIAO'?'#F0C300':(PARTY[k]||'#2450B2')}
function signature(){var h=document.querySelector('.hero');if(!h||h.querySelector('.ce-regional-signature'))return;var e=document.createElement('div');e.className='ce-regional-signature';e.innerHTML='<i></i><i></i><i></i><span>Colmeia · Tocantins · Brasil</span>';var t=h.querySelector('.eyebrow');if(t)t.insertAdjacentElement('beforebegin',e);else h.prepend(e)}
function partyText(row){var el=row.querySelector('.who small,.leader-who small,.candidate-party,.party,.cand-party,.meta small');return el?el.textContent:row.textContent}
function rows(){var list=[].slice.call(document.querySelectorAll('.leader,.candidate-card'));for(var i=0;i<list.length;i++){var row=list[i],c=color(partyText(row));row.style.setProperty('--party-color',c)}var ranked=[].slice.call(document.querySelectorAll('#leaders .leader')).slice(0,3);for(var j=0;j<ranked.length;j++){ranked[j].setAttribute('data-ce-rank',String(j+1));var n=ranked[j].querySelector('.num');if(n)n.setAttribute('data-ce-rank-label',(j+1)+'º')}}
function votes(row){var el=row.querySelector('.votes b,.leader-votes b');var n=Number(String(el?el.textContent:'').replace(/[^0-9]/g,''));return isFinite(n)?n:0}
function race(){if(location.pathname==='/operacao.html')return;var leaders=document.getElementById('leaders');if(!leaders)return;var rs=[].slice.call(leaders.querySelectorAll('.leader'));var host=leaders.parentElement;if(!host)return;var box=host.querySelector('.ce-race-summary');if(!box){box=document.createElement('div');box.className='ce-race-summary';box.hidden=true;leaders.insertAdjacentElement('beforebegin',box)}if(rs.length<2){box.hidden=true;return}var a=votes(rs[0]),b=votes(rs[1]),total=rs.reduce(function(s,r){return s+votes(r)},0);if(total<=0){box.hidden=true;return}var gap=Math.abs(a-b),p1=(a/total*100),p2=(b/total*100),c1=getComputedStyle(rs[0]).getPropertyValue('--party-color').trim()||'#2450B2',c2=getComputedStyle(rs[1]).getPropertyValue('--party-color').trim()||'#009B3A';box.hidden=false;box.innerHTML='<b>Leitura da disputa · diferença de '+gap.toLocaleString('pt-BR')+' voto'+(gap===1?'':'s')+'</b><span>Parcial local — os números podem mudar com novas seções.</span><div class="ce-race-strip"><i style="width:'+p1.toFixed(2)+'%;background:'+c1+'"></i><i style="width:'+p2.toFixed(2)+'%;background:'+c2+'"></i></div>'}
var queued=false;function apply(){signature();rows();race()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;apply()})}
function boot(){apply();setTimeout(apply,250);setTimeout(apply,1000);var mo=new MutationObserver(schedule);mo.observe(document.body,{subtree:true,childList:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;
write(`${pub}/v153-regional-theme.js`,js);

for(const f of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(f);
  html=addBodyClasses(html,'public-v130 public-v153 ce-regional-public');
  html=html.replace(/<link rel="stylesheet" href="\/v153-regional-theme\.css[^\"]*">/g,'<link rel="stylesheet" href="/v153-regional-theme.css?v=156">');
  html=html.replace(/<script src="\/v153-regional-theme\.js[^\"]*"><\/script>/g,'<script src="/v153-regional-theme.js?v=156"></script>');
  if(!html.includes('/v153-regional-theme.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v153-regional-theme.css?v=156">\n</head>');
  if(!html.includes('/v153-regional-theme.js'))html=html.replace('</body>','<script src="/v153-regional-theme.js?v=156"></script>\n</body>');
  write(f,html);
}

let op=read(`${pub}/operacao.html`);
op=addBodyClasses(op,'ce-regional-operation');
op=op.replace(/<link rel="stylesheet" href="\/v153-regional-theme\.css[^\"]*">/g,'<link rel="stylesheet" href="/v153-regional-theme.css?v=156">');
op=op.replace(/<script src="\/v153-regional-theme\.js[^\"]*"><\/script>/g,'<script src="/v153-regional-theme.js?v=156"></script>');
if(!op.includes('/v153-regional-theme.css'))op=op.replace('</head>','<link rel="stylesheet" href="/v153-regional-theme.css?v=156">\n</head>');
if(!op.includes('/v153-regional-theme.js'))op=op.replace('</body>','<script src="/v153-regional-theme.js?v=156"></script>\n</body>');
write(`${pub}/operacao.html`,op);

const adminPath=`${pub}/admin/admin-v150.css`;
if(fs.existsSync(adminPath)){
  let a=read(adminPath).replace(/\/\* CE REGIONAL V15[\s\S]*?CE REGIONAL END \*\//g,'');
  a+=`\n/* CE REGIONAL V156 */\n:root{--brand:#174F7A;--brand2:#2450B2;--regional-green:#009B3A;--regional-yellow:#FFDF00;--regional-blue:#002776;--regional-light:#9FD0F0}\n.admin-hero{position:relative!important;overflow:hidden!important;border-top:4px solid var(--regional-yellow)!important;background:linear-gradient(128deg,#087E48 0%,#176D61 31%,#2450B2 70%,#002776 100%)!important}\n.admin-hero:after{content:'';position:absolute;width:180px;height:180px;right:-75px;top:-95px;transform:rotate(45deg);border-radius:30px;background:rgba(255,223,0,.20);pointer-events:none}.admin-hero>*{position:relative;z-index:1}\n.metric-grid .metric:nth-child(6n+1){border-top:3px solid #009B3A}.metric-grid .metric:nth-child(6n+2){border-top:3px solid #2450B2}.metric-grid .metric:nth-child(6n+3){border-top:3px solid #FFDF00}.metric-grid .metric:nth-child(6n+4){border-top:3px solid #9FD0F0}.metric-grid .metric:nth-child(6n+5){border-top:3px solid #E5B100}.metric-grid .metric:nth-child(6n+6){border-top:3px solid #2E9E58}\n.progress-track span{background:linear-gradient(90deg,#009B3A 0 39%,#FFDF00 39% 54%,#2450B2 54% 100%)!important}.btn.primary{background:linear-gradient(135deg,#16734D,#2450B2)!important;border-color:transparent!important}.bottom-nav button.active{position:relative;color:#2450B2!important;background:#EEF7FB!important}.bottom-nav button.active:before{content:'';position:absolute;left:25%;right:25%;top:0;height:3px;background:linear-gradient(90deg,#009B3A,#FFDF00,#2450B2)}\n/* CE REGIONAL END */\n`;
  write(adminPath,a);
}

const manifestPath=`${pub}/manifest.webmanifest`;
if(fs.existsSync(manifestPath)){
  const m=JSON.parse(read(manifestPath));m.theme_color='#174F7A';m.background_color='#F2F7FA';write(manifestPath,JSON.stringify(m,null,2));
}

const swPath=`${pub}/service-worker.js`;
if(fs.existsSync(swPath)){
  let sw=read(swPath);
  sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.5.6-regional-shell';");
  if(!sw.includes("'/v153-regional-theme.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v153-regional-theme.css','/v153-regional-theme.js',");
  write(swPath,sw);
}

console.log('V1.5.6 applied: regional identity is static on public and operational shells, with party colors and refreshed PWA cache.');
