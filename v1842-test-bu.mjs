import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const pub='/app/public';
const opPath=pub+'/operacao.html';
const swPath=pub+'/service-worker.js';
const cat=JSON.parse(fs.readFileSync(pub+'/data/candidate-catalog.json','utf8'));
const read=p=>fs.readFileSync(p,'utf8'), write=(p,s)=>fs.writeFileSync(p,s);

const usable=a=>{const all=(Array.isArray(a)?a:[]).filter(x=>x&&String(x.numero||'').trim());const ok=all.filter(x=>!/RENUNC|INAPTO|CANCEL|INDEFER/i.test(String(x.situacao||'')));return (ok.length?ok:all).slice(0,2)};
const c=cat.candidates||{};
const chosen={presidente:usable(c.presidente),governador:usable(c.governador),senador:usable(c.senador),depFederal:usable(c.depFederal),depEstadual:usable(c.depEstadual)};
for(const [k,a] of Object.entries(chosen))if(!a.length)throw new Error('V1.8.4.2 sem candidato '+k);
const n=(k,i=0)=>String((chosen[k][i]||chosen[k][0]).numero);
const part=n=>String(n).slice(0,2).replace(/^0+/,'')||'1';
const cv=(x,v)=>x+':'+v;
const cargo=(code,arr,opt={})=>{const br=opt.br??5,nu=opt.nu??10,total=opt.total??100,leg=opt.leg??0,t=['CARG:'+code,'TIPO:1'];if(code===6||code===7)t.push('PART:'+part(arr[0][0]),...arr.map(x=>cv(x[0],x[1])),'LEGP:'+leg,'NOMI:'+arr.reduce((s,x)=>s+x[1],0),'LEGC:'+leg,'BRAN:'+br,'NULO:'+nu,'TOTC:'+total);else t.push(...arr.map(x=>cv(x[0],x[1])),'BRAN:'+br,'NULO:'+nu,'TOTC:'+total);return t.join(' ')};
const common='ORIG:TESTE ORLC:LEG PROC:1000 DTPL:20261004 PLEI:9999 TURN:1 FASE:S UNFE:TO MUNI:00000 ZONA:16 SECA:1 IDUE:CE1842TEST IDCA:CE1842 TESTE:1 LOCA:1 APTO:100 COMP:100 FALT:0';
const core1=[common,cargo(1,[[n('presidente',0),62],[n('presidente',1),23]],{br:5,nu:10,total:100}),cargo(3,[[n('governador',0),58],[n('governador',1),27]],{br:5,nu:10,total:100}),cargo(5,[[n('senador',0),70],[n('senador',1),50]],{br:10,nu:20,total:150})].join(' ');
const core2=[cargo(6,[[n('depFederal',0),52],[n('depFederal',1),28]],{leg:5,br:5,nu:10,total:100}),cargo(7,[[n('depEstadual',0),49],[n('depEstadual',1),31]],{leg:5,br:5,nu:10,total:100})].join(' ');
const sha=s=>createHash('sha512').update(s).digest('hex').toUpperCase();
const h1=sha(core1), h2=sha(core1+' HASH:'+h1+' '+core2);
const p1='QRBU:1:2 VRQR:1.5 VRCH:20240507 '+core1+' HASH:'+h1;
const p2='QRBU:2:2 VRQR:1.5 VRCH:20240507 '+core2+' HASH:'+h2+' ASSI:'+'00'.repeat(64);

const dir=pub+'/teste-bu';fs.mkdirSync(dir,{recursive:true});
write(dir+'/qr-1.txt',p1);write(dir+'/qr-2.txt',p2);
execFileSync('qrencode',['-l','M','-s','7','-m','4','-o',dir+'/qr-1.png',p1]);
execFileSync('qrencode',['-l','M','-s','7','-m','4','-o',dir+'/qr-2.png',p2]);
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m));
const labels={presidente:'Presidente',governador:'Governador',senador:'Senador',depFederal:'Deputado Federal',depEstadual:'Deputado Estadual'};
const rows=Object.entries(chosen).flatMap(([k,a])=>a.map(x=>'<tr><td>'+labels[k]+'</td><td><b>'+esc(x.numero)+'</b></td><td>'+esc(x.nomeUrna||x.nome||'')+'</td><td>'+esc(x.partido||'')+'</td></tr>')).join('');
write(dir+'/dados.json',JSON.stringify({synthetic:true,chosen,parts:[p1,p2]},null,2));
write(pub+'/teste-bu.html','<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>BU de teste</title><style>body{font-family:system-ui;background:#f3f6f8;color:#17313d;margin:0}.w{max-width:980px;margin:auto;padding:22px}.a{background:#fff3cd;border:1px solid #ddb93f;padding:14px;border-radius:14px}.g{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.c{background:#fff;padding:16px;border-radius:14px;text-align:center}.c img{max-width:100%}table{width:100%;background:#fff;border-collapse:collapse;margin-top:16px}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}@media(max-width:700px){.g{grid-template-columns:1fr}}</style><body><main class="w"><div class="a"><b>BU SINTÉTICO DE TESTE — NÃO OFICIAL</b><br>Usa candidatos presentes no catálogo atual da Central. Serve apenas para testar o leitor e não pode gravar resultados.</div><div class="g"><div class="c"><h2>QR 1 de 2</h2><img src="/teste-bu/qr-1.png"></div><div class="c"><h2>QR 2 de 2</h2><img src="/teste-bu/qr-2.png"></div></div><table><thead><tr><th>Cargo</th><th>Número</th><th>Candidato</th><th>Partido</th></tr></thead><tbody>'+rows+'</tbody></table><p>Abra esta página em outro aparelho. No celular com a Central, abra <b>Operação → leitor de BU</b>, leia primeiro o QR 1 e depois o QR 2.</p></main></body></html>');

let op=read(opPath);
function rb(src,a,b,repl){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);if(i<0||j<0)throw new Error('V1.8.4.2 anchor');return src.slice(0,i)+repl+src.slice(j)}
const reset=`function resetQrSession(stop=true){\n  qrSession={parts:{},total:null,parsed:null,fingerprint:'',identity:{},hashVerification:null,signatureVerification:null,signaturePending:false,testMode:false};\n  qrLastText='';qrSummary.classList.remove('open');qrSummary.innerHTML='';qrReset.style.display='none';\n  setQrStatus('','Nenhum BU lido nesta sessão.');if(stop)stopQrScanner()\n}\n`;
op=rb(op,'function resetQrSession(stop=true){','async function loadQrLibrary()',reset);
const old='    setQrStatus(\'\',\'<span class="spinner-dot"></span>Cadeia SHA-512 íntegra. Validando a assinatura Ed25519 com a chave pública oficial do TSE…\');';
const test=`    const assembled=BUParser.assemble(qrSession.parts);\n    const parsed=BUParser.parse(assembled);\n    const isTest=String(parsed?.meta?.TESTE||'')==='1'||String(parsed?.meta?.ORIG||'').toUpperCase()==='TESTE';\n    if(isTest){\n      qrSession.testMode=true;qrSession.parsed=parsed;qrSession.signatureVerification={ok:true,testMode:true,algorithm:'SYNTHETIC_TEST'};\n      qrSession.fingerprint=await sha256Hex(assembled);await stopQrScanner();renderQrSummary();\n      qrSummary.insertAdjacentHTML('afterbegin','<div style="margin:0 0 12px;padding:11px 12px;border-radius:10px;background:#8b1e1e;color:#fff;font-weight:900">MODO TESTE · BU SINTÉTICO · NÃO OFICIAL · NÃO SERÁ GRAVADO</div>');\n      qrSummary.querySelectorAll('button').forEach(b=>{if(/salvar|revisar/i.test(String(b.textContent||''))){b.disabled=true;b.textContent='Teste — gravação desativada'}});\n      setQrStatus('warn','BU sintético reconhecido. A cadeia SHA-512 foi conferida e os candidatos foram carregados apenas para teste. <b>Nenhum resultado poderá ser salvo.</b>');return\n    }\n`+old;
if(!op.includes(old))throw new Error('V1.8.4.2 signature anchor');
op=op.replace(old,test);
op=op.replace('    const assembled=BUParser.assemble(qrSession.parts);qrSession.parsed=BUParser.parse(assembled);qrSession.fingerprint=await sha256Hex(assembled);','    qrSession.parsed=parsed;qrSession.fingerprint=await sha256Hex(assembled);');
write(opPath,op);
let sw=read(swPath).replace(/const VERSION='[^']+';/,"const VERSION='v1.8.4.2-unified';");write(swPath,sw);
console.log('V1.8.4.2 applied: BU sintético multipart gerado com candidatos do catálogo atual; gravação bloqueada no modo teste.');
