import fs from 'node:fs';
import vm from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const pub='/app/public';
const parserPath=pub+'/bu-parser.js';
const opPath=pub+'/operacao.html';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>{fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true});fs.writeFileSync(p,s)};
const sha=text=>createHash('sha512').update(text,'utf8').digest('hex').toUpperCase();

/* ============================================================
   V1.9.9 — regressão de estresse QRBU multipart (9 partes)
   Não grava resultados e não altera a validação criptográfica.
   ============================================================ */
const parserSource=read(parserPath);
const context={console,TextEncoder,crypto:webcrypto};context.globalThis=context;
vm.runInNewContext(parserSource,context,{filename:'bu-parser.js'});
const P=context.BUParser;
if(!P?.fragmentInfo||!P?.assemble||!P?.verifyHashChain)throw new Error('V1.9.9: BUParser incompleto');

const common=[
  'ORIG:TESTE','ORLC:LEG','PROC:1999','DTPL:20261004','PLEI:9999','TURN:1','FASE:S',
  'UNFE:TO','MUNI:00000','ZONA:16','SECA:999','IDUE:CE199STRESS','IDCA:CE199TESTE',
  'TESTE:1','LOCA:1','APTO:250','COMP:200','FALT:50'
].join(' ');

const cores=[
  common+' CARG:1 TIPO:1 91:110 92:70 BRAN:8 NULO:12 TOTC:200 C1:1',
  'CARG:3 TIPO:1 93:105 94:75 BRAN:8 NULO:12 TOTC:200 C2:2',
  'CARG:5 TIPO:1 95:180 96:160 BRAN:20 NULO:40 TOTC:400 C3:3',
  'CARG:6 TIPO:1 PART:97 9701:80 9702:55 LEGP:15 NOMI:135 LEGC:15 BRAN:20 NULO:30 TOTC:200 C4:4',
  'PART:98 9801:30 LEGP:5 C5:5',
  'CARG:7 TIPO:1 PART:97 97001:60 97002:45 LEGP:10 C6:6',
  'PART:98 98001:35 98002:20 LEGP:5 C7:7',
  'NOMI:160 LEGC:15 BRAN:10 NULO:15 TOTC:200 C8:8',
  'APTS:200 APTT:200 CSEC:1 VERC:1 C9:9'
];

let cumulative='';
const parts=[];
for(let i=0;i<cores.length;i++){
  const material=(cumulative?cumulative+' ':'')+cores[i];
  const h=sha(material);
  const suffix=i===cores.length-1?' ASSI:'+'00'.repeat(132):'';
  const text='QRBU:'+(i+1)+':9 VRQR:6.0 '+cores[i]+' HASH:'+h+suffix;
  parts.push(text);
  cumulative=material+' HASH:'+h;
}

/* 1. Cabeçalho dinâmico: 9 partes e sem teto artificial baixo. */
const nine=P.fragmentInfo(parts[8]);
if(!nine||nine.index!==9||nine.total!==9)throw new Error('V1.9.9: QRBU 9/9 não reconhecido');
const fifty=P.fragmentInfo('QRBU:1:50 TESTE:1');
if(!fifty||fifty.total!==50)throw new Error('V1.9.9: parser contém teto artificial de QRBU');

/* 2. Leitura fora de ordem deve ser remontada e validada. */
const order=[9,1,5,3,7,2,8,4,6];
const shuffled=order.map(n=>parts[n-1]);
const chain=await P.verifyHashChain(shuffled);
if(!chain?.ok||chain.verifiedParts!==9||chain.total!==9)throw new Error('V1.9.9: cadeia 9/9 fora de ordem falhou');
const assembled=P.assemble(shuffled);
const parsed=P.parse(assembled);
if(Number(parsed?.meta?.SECA)!==999||String(parsed?.meta?.TESTE)!=='1'||parsed?.recognizedCargos?.length<5)throw new Error('V1.9.9: reconstrução 9/9 perdeu metadados/cargos');

/* 3. QR repetido idêntico é idempotente. */
const duplicateOk=await P.verifyHashChain([...parts,parts[3]]);
if(!duplicateOk?.ok||duplicateOk.verifiedParts!==9)throw new Error('V1.9.9: duplicata idêntica não foi tratada como idempotente');

/* 4. Parte ausente deve bloquear montagem. */
let missing=false;
try{P.assemble(parts.filter((_,i)=>i!==4))}catch(e){missing=String(e?.message)==='qrbu_incomplete'}
if(!missing)throw new Error('V1.9.9: conjunto incompleto foi aceito');

/* 5. Duas leituras diferentes na mesma posição devem conflitar. */
const conflict=parts[2].replace('C3:3','C3:999');
let duplicateConflict=false;
try{P.assemble([...parts,conflict])}catch(e){duplicateConflict=String(e?.message)==='qrbu_duplicate_index_conflict'}
if(!duplicateConflict)throw new Error('V1.9.9: conflito de índice duplicado não detectado');

/* 6. Total divergente deve ser rejeitado. */
const wrongTotal=parts[4].replace(/^QRBU:5:9/,'QRBU:5:10');
let totalMismatch=false;
try{P.assemble(parts.map((x,i)=>i===4?wrongTotal:x))}catch(e){totalMismatch=String(e?.message)==='qrbu_total_mismatch'}
if(!totalMismatch)throw new Error('V1.9.9: total divergente não detectado');

/* 7. Alteração de conteúdo deve quebrar SHA-512. */
const tampered=[...parts];
tampered[5]=tampered[5].replace('C6:6','C6:66');
const badChain=await P.verifyHashChain(tampered);
if(badChain?.ok||badChain?.error!=='qrbu_hash_mismatch')throw new Error('V1.9.9: adulteração não quebrou a cadeia SHA-512');

/* 8. A camada operacional precisa continuar recusando identidade divergente. */
const op=read(opPath);
if(!op.includes('Este QR apresenta identificação diferente do BU que já está sendo lido')||
   !op.includes('qrSession.identity[k]')||
   !op.includes('qrSession.total!==info.total')){
  throw new Error('V1.9.9: guardas operacionais de identidade/total ausentes');
}

/* ============================================================
   Página manual: 9 QRBU + dois QR extras para cenários negativos.
   ============================================================ */
const dir=pub+'/teste-qrbu-9';
fs.rmSync(dir,{recursive:true,force:true});
fs.mkdirSync(dir,{recursive:true});

for(let i=0;i<parts.length;i++){
  write(dir+'/qr-'+(i+1)+'.txt',parts[i]);
  execFileSync('qrencode',['-l','M','-s','5','-m','3','-o',dir+'/qr-'+(i+1)+'.png',parts[i]]);
}

const mixedIdentity=parts[1].replace('VRQR:6.0 ','VRQR:6.0 IDUE:CE199OUTRO ');
write(dir+'/qr-outro-bu-2.txt',mixedIdentity);
execFileSync('qrencode',['-l','M','-s','5','-m','3','-o',dir+'/qr-outro-bu-2.png',mixedIdentity]);

write(dir+'/qr-conflito-3.txt',conflict);
execFileSync('qrencode',['-l','M','-s','5','-m','3','-o',dir+'/qr-conflito-3.png',conflict]);

const cards=parts.map((_,i)=>
  '<article class="card"><h2>QRBU '+(i+1)+' / 9</h2><img src="/teste-qrbu-9/qr-'+(i+1)+'.png" alt="QRBU '+(i+1)+' de 9"><div><a href="/teste-qrbu-9/qr-'+(i+1)+'.png">Abrir QR</a> · <a href="/teste-qrbu-9/qr-'+(i+1)+'.txt">Ver texto</a></div></article>'
).join('');

const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Teste QRBU 9 partes · Central Eleitoral</title><style>'+
'body{margin:0;background:#f3f6f8;color:#17313d;font-family:system-ui,-apple-system,Segoe UI,sans-serif}.w{max-width:1150px;margin:auto;padding:18px}.warn{padding:14px;border:1px solid #e2b5b1;border-radius:14px;background:#fff2f1;color:#7a2925;line-height:1.45}.info{margin:12px 0;padding:13px;border:1px solid #d9e3e8;border-radius:14px;background:#fff;line-height:1.5}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.card{padding:12px;border:1px solid #d9e3e8;border-radius:14px;background:#fff;text-align:center}.card h2{font-size:16px}.card img{display:block;width:100%;height:auto}.card a{font-size:12px}.negative{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.negative article{padding:13px;border:1px solid #e3cb83;border-radius:14px;background:#fff9e3;text-align:center}.negative img{max-width:100%;height:auto}.steps li{margin:6px 0}@media(max-width:760px){.grid{grid-template-columns:1fr 1fr}.negative{grid-template-columns:1fr}}@media(max-width:440px){.grid{grid-template-columns:1fr}.w{padding:11px}}'+
'</style></head><body><main class="w"><h1>Teste de estresse · QRBU 9 partes</h1>'+
'<div class="warn"><b>BU SINTÉTICO · NÃO OFICIAL · NÃO GRAVA RESULTADOS.</b><br>Contém TESTE:1 e serve exclusivamente para validar o leitor multipart da Central.</div>'+
'<div class="info"><b>Teste principal:</b> leia os nove QRBU. Para testar leitura fora de ordem, use: <b>9 → 1 → 5 → 3 → 7 → 2 → 8 → 4 → 6</b>. O leitor deve reunir 9/9, ordenar internamente e validar a cadeia SHA-512.</div>'+
'<ol class="info steps"><li><b>Duplicata:</b> leia novamente qualquer QR já capturado; ele deve informar que a parte já havia sido lida.</li><li><b>Ausente:</b> omita uma parte; o leitor deve continuar aguardando e não montar o BU.</li><li><b>Conflito:</b> depois do QRBU 3/9 normal, leia o “QR conflitante 3/9” abaixo; deve ser recusado.</li><li><b>Outro BU:</b> depois do QRBU 1/9, leia o “QR de outra urna 2/9”; deve ser recusado por identificação diferente.</li></ol>'+
'<div class="grid">'+cards+'</div>'+
'<div class="negative"><article><h2>Teste negativo · conflito 3/9</h2><img src="/teste-qrbu-9/qr-conflito-3.png" alt="QRBU conflitante 3 de 9"><p>Use depois do QRBU 3/9 normal.</p></article><article><h2>Teste negativo · outra urna 2/9</h2><img src="/teste-qrbu-9/qr-outro-bu-2.png" alt="QRBU 2 de 9 com IDUE diferente"><p>Use depois do QRBU 1/9 normal.</p></article></div>'+
'</main></body></html>';
write(pub+'/teste-qrbu-9.html',html);
write(dir+'/manifest.json',JSON.stringify({synthetic:true,official:false,testMode:true,totalQrbu:9,order,checks:['out_of_order','duplicate_identical','missing_part','duplicate_conflict','total_mismatch','hash_tamper','identity_mismatch_guard'],parts:parts.map((_,i)=>'/teste-qrbu-9/qr-'+(i+1)+'.png')},null,2));

for(let i=1;i<=9;i++){
  if(!fs.existsSync(dir+'/qr-'+i+'.png')||!fs.existsSync(dir+'/qr-'+i+'.txt'))throw new Error('V1.9.9: asset QRBU '+i+' ausente');
}
if(!fs.existsSync(dir+'/qr-conflito-3.png')||!fs.existsSync(dir+'/qr-outro-bu-2.png'))throw new Error('V1.9.9: QR negativos ausentes');

/* Versão */
let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.9.9-unified';");
write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';
if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='1.9.9';write(pkg,JSON.stringify(j,null,2)+'\n')}

console.log('V1.9.9 applied: QRBU 9-part stress regression passed (out-of-order, duplicate, missing, conflict, mismatch and SHA-512 tamper).');
