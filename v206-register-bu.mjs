import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

write(pub+'/v206-register-bu.css',read('/src/v206-register-bu.css'));

const p=pub+'/operacao.html';
let h=read(p);

h=h.split('\n').filter(line=>
  !line.includes('/v203-modal-scroll.') &&
  !line.includes('/v204-bu-form-scroll.') &&
  !line.includes('/v205-bu-modal.')
).join('\n');

const old='<div class="actions"><button class="btn primary" onclick="saveResult()">Salvar resultado</button><button class="btn" onclick="clearResult()">Apagar resultado desta seção</button></div>';
const neu='<div class="actions ce206-result-actions"><button class="btn primary" onclick="saveResult()">Revisar e confirmar resultado</button><button class="btn" onclick="clearResult()">Apagar resultado desta seção</button></div>';
if(!h.includes(old))throw new Error('V2.0.6: ações reais do adminPanel não encontradas');
h=h.replace(old,neu);

if(!h.includes('/v206-register-bu.css'))h=h.replace('</head>','<link rel="stylesheet" href="/v206-register-bu.css?v=206">\n</head>');
write(p,h);

let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.6-unified';");
if(!sw.includes("'/v206-register-bu.css'"))sw=sw.replace('const CORE=[',"const CORE=['/v206-register-bu.css',");
write(pub+'/service-worker.js',sw);

const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.0.6';write(pkg,JSON.stringify(j,null,2)+'\n')}

const out=read(p);
if(out.includes('/v203-modal-scroll.')||out.includes('/v204-bu-form-scroll.')||out.includes('/v205-bu-modal.'))throw new Error('V2.0.6: legado de scroll ainda carregado');
if(!out.includes('id="sheetWrap"')||!out.includes('id="adminPanel"')||!out.includes('ce206-result-actions'))throw new Error('V2.0.6: DOM operacional esperado ausente');
if(!out.includes('Revisar e confirmar resultado'))throw new Error('V2.0.6: botão final não atualizado');
if(!read(pub+'/v206-register-bu.css').includes('#sheetWrap.open #adminPanel > .actions:last-child'))throw new Error('V2.0.6: sticky actions ausente');
if(!read(pub+'/v206-register-bu.css').includes('.ce174-actions'))throw new Error('V2.0.6: confirmação final não protegida');
if(!read(pub+'/service-worker.js').includes("v2.0.6-unified"))throw new Error('V2.0.6: SW não atualizado');

console.log('V2.0.6 applied: exact #sheetWrap/#adminPanel flow fixed; final actions remain visible and old reactive scripts are removed.');
