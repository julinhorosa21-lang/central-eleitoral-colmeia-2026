import fs from 'node:fs';

const APP='/app';
const PUB=APP+'/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const cssFile=PUB+'/v232-access.css';
let css=read(cssFile);

if(!css.includes('CE237_OPERATION_HEADER_OFFSET')){
  css += `

/* CE237_OPERATION_HEADER_OFFSET
   Impede que o cabeçalho fixo azul cubra Presidente/Governador
   e mantém o seletor de seção fora da área das abas. */
:root{
  --ce237-op-header:78px;
}

html.ce232-direct-section #sheetWrap.open{
  padding-top:calc(var(--ce237-op-header) + env(safe-area-inset-top,0px))!important;
  padding-right:8px!important;
  padding-bottom:8px!important;
  padding-left:8px!important;
  box-sizing:border-box!important;
}

html.ce232-direct-section #sheetWrap.open > .sheet{
  height:calc(100dvh - var(--ce237-op-header) - env(safe-area-inset-top,0px) - 8px)!important;
  max-height:calc(100dvh - var(--ce237-op-header) - env(safe-area-inset-top,0px) - 8px)!important;
  margin:0 auto!important;
  padding-top:10px!important;
  scroll-padding-top:58px!important;
}

html.ce232-direct-section #sheetCargoTabs{
  position:sticky!important;
  top:0!important;
  z-index:90!important;
  display:flex!important;
  background:#fff!important;
  padding:8px 0 10px!important;
  margin:0 0 12px!important;
  box-shadow:0 5px 10px rgba(21,58,97,.06)!important;
}

html.ce232-direct-section #sheetCargoTabs button{
  flex:0 0 auto!important;
  min-height:44px!important;
}

html.ce232-direct-section .ce232-switcher{
  top:calc(var(--ce237-op-header) + env(safe-area-inset-top,0px) + 10px)!important;
  right:14px!important;
  bottom:auto!important;
  z-index:16100!important;
}

@media(max-width:680px){
  :root{--ce237-op-header:72px}
  html.ce232-direct-section #sheetWrap.open{
    padding-top:calc(var(--ce237-op-header) + env(safe-area-inset-top,0px))!important;
    padding-right:0!important;
    padding-bottom:0!important;
    padding-left:0!important;
  }
  html.ce232-direct-section #sheetWrap.open > .sheet{
    height:calc(100dvh - var(--ce237-op-header) - env(safe-area-inset-top,0px))!important;
    max-height:calc(100dvh - var(--ce237-op-header) - env(safe-area-inset-top,0px))!important;
    border-radius:0!important;
  }
  html.ce232-direct-section .ce232-switcher{
    top:calc(var(--ce237-op-header) + env(safe-area-inset-top,0px) + 8px)!important;
    right:8px!important;
    bottom:auto!important;
  }
}

@supports not (height:100dvh){
  html.ce232-direct-section #sheetWrap.open > .sheet{
    height:calc(100vh - var(--ce237-op-header) - 8px)!important;
    max-height:calc(100vh - var(--ce237-op-header) - 8px)!important;
  }
}
`;
}

write(cssFile,css);

let op=read(PUB+'/operacao.html');
op=op.replace(/v232-access\.css\?v=\d+/g,'v232-access.css?v=237');
op=op.replace(/v232-operational-gate\.js\?v=\d+/g,'v232-operational-gate.js?v=237');
op=op.replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=237');
write(PUB+'/operacao.html',op);

const install=PUB+'/v135-install.js';
if(fs.existsSync(install)){
  write(install,read(install).replace(/service-worker\.js\?v=\d+/g,'service-worker.js?v=237'));
}

for(const rel of ['index.html','transparencia.html','admin/index.html','admin.html','apuracao.html','seguranca.html']){
  const p=PUB+'/'+rel;
  if(fs.existsSync(p))write(p,read(p).replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=237'));
}

let sw=read(PUB+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.2.6-operation-header-offset';");
write(PUB+'/service-worker.js',sw);

const pkg=APP+'/package.json';
if(fs.existsSync(pkg)){
  const j=JSON.parse(read(pkg));
  j.version='2.2.6';
  write(pkg,JSON.stringify(j,null,2)+'\n');
}

const finalCss=read(cssFile);
if(!finalCss.includes('CE237_OPERATION_HEADER_OFFSET'))throw new Error('V237 header offset missing');
if(!finalCss.includes('padding-top:calc(var(--ce237-op-header)'))throw new Error('V237 sheet top offset missing');
if(!finalCss.includes('#sheetCargoTabs'))throw new Error('V237 cargo tabs rule missing');
if(!read(PUB+'/operacao.html').includes('v232-access.css?v=237'))throw new Error('V237 CSS cachebuster missing');

console.log('V2.2.6 operation header offset passed: cargo tabs stay below fixed header and section switcher no longer overlaps them.');
