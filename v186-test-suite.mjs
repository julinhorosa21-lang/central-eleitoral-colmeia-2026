import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const pub='/app/public';
const cat=JSON.parse(fs.readFileSync(pub+'/data/candidate-catalog.json','utf8'));
const loc=JSON.parse(fs.readFileSync(pub+'/data/locais-colmeia.json','utf8'));
const write=(p,s)=>fs.writeFileSync(p,s);
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]||m));
const sha=s=>createHash('sha512').update(s).digest('hex').toUpperCase();

const usable=a=>{
  const all=(Array.isArray(a)?a:[]).filter(x=>x&&String(x.numero||'').trim());
  const ok=all.filter(x=>!/RENUNC|INAPTO|CANCEL|INDEFER/i.test(String(x.situacao||'')));
  return ok.length?ok:all;
};

const pools={};
for(const k of ['presidente','governador','senador','depFederal','depEstadual']){
  pools[k]=usable(cat.candidates?.[k]);
  if(!pools[k].length)throw new Error('Suite 29 BUs: catálogo sem candidatos em '+k);
}

const sections=[...new Set((Array.isArray(loc.locais)?loc.locais:[]).flatMap(p=>Array.isArray(p.secoes)?p.secoes:[]).map(Number).filter(Number.isFinite))].sort((a,b)=>a-b);
if(sections.length!==29)throw new Error('Suite 29 BUs: esperado 29 seções reais, encontrado '+sections.length+' -> '+sections.join(','));

function take(pool,start,count){
  const n=Math.min(count,pool.length),out=[];
  for(let i=0;i<n;i++)out.push(pool[(start+i)%pool.length]);
  return out;
}
function allocate(rows,total,seed){
  if(!rows.length)return [];
  const weights=rows.map((_,i)=>3+((seed*(i+5)+i*7)%19));
  const sum=weights.reduce((a,b)=>a+b,0);
  let used=0;
  const votes=weights.map((w,i)=>{
    if(i===weights.length-1)return total-used;
    const v=Math.max(1,Math.floor(total*w/sum));used+=v;return v;
  });
  if(votes.at(-1)<1){
    const deficit=1-votes.at(-1);votes[votes.length-1]=1;votes[0]=Math.max(1,votes[0]-deficit);
  }
  return rows.map((c,i)=>({numero:String(c.numero),nome:String(c.nomeUrna||c.nome||''),partido:String(c.partido||''),votos:votes[i]}));
}
function cargo(code,arr,{br=0,nu=0,total=0}={}){
  const nominal=arr.reduce((s,x)=>s+Number(x.votos||0),0);
  const t=['CARG:'+code,'TIPO:1'];
  if(code===6||code===7)t.push('PART:1');
  for(const x of arr)t.push(String(x.numero)+':'+Number(x.votos||0));
  if(code===6||code===7)t.push('LEGP:0','NOMI:'+nominal,'LEGC:0');
  t.push('BRAN:'+br,'NULO:'+nu,'TOTC:'+total);
  return t.join(' ');
}
function label(k){return ({presidente:'Presidente',governador:'Governador',senador:'Senador',depFederal:'Deputado Federal',depEstadual:'Deputado Estadual'})[k]||k}
function fmt(n){return new Intl.NumberFormat('pt-BR').format(Number(n)||0)}

const root=pub+'/teste-29-bus';
fs.rmSync(root,{recursive:true,force:true});
fs.mkdirSync(root,{recursive:true});

const manifest=[];
for(let idx=0;idx<sections.length;idx++){
  const section=sections[idx],seed=idx+1;
  const apto=240+(seed%37);
  const comp=180+((seed*11)%47);
  const falt=apto-comp;

  const presRows=take(pools.presidente,seed*2,Math.min(2,pools.presidente.length));
  const govRows=take(pools.governador,seed*2,Math.min(2,pools.governador.length));
  const senRows=take(pools.senador,seed*3,Math.min(3,pools.senador.length));
  const fedRows=take(pools.depFederal,seed*4,Math.min(4,pools.depFederal.length));
  const estRows=take(pools.depEstadual,seed*8,Math.min(8,pools.depEstadual.length));

  const presBr=2+(seed%4),presNu=3+(seed%6);
  const govBr=2+((seed+1)%4),govNu=3+((seed+2)%6);
  const senTotal=comp*2,senBr=4+(seed%5),senNu=7+(seed%9);
  const fedBr=2+(seed%4),fedNu=4+(seed%6);
  const estBr=3+(seed%4),estNu=4+((seed+3)%6);

  const pres=allocate(presRows,comp-presBr-presNu,seed*13);
  const gov=allocate(govRows,comp-govBr-govNu,seed*17);
  const sen=allocate(senRows,senTotal-senBr-senNu,seed*19);
  const fed=allocate(fedRows,comp-fedBr-fedNu,seed*23);
  const est=allocate(estRows,comp-estBr-estNu,seed*29);

  const sec=String(section);
  const common=[
    'ORIG:TESTE','ORLC:LEG','PROC:1000','DTPL:20261004','PLEI:9999','TURN:1','FASE:S',
    'UNFE:TO','MUNI:00000','ZONA:16','SECA:'+sec,'IDUE:CE29S'+sec.padStart(3,'0'),
    'IDCA:CE29TESTE','TESTE:1','LOCA:1','APTO:'+apto,'COMP:'+comp,'FALT:'+falt
  ].join(' ');

  const cores=[
    [common,cargo(1,pres,{br:presBr,nu:presNu,total:comp}),cargo(3,gov,{br:govBr,nu:govNu,total:comp})].join(' '),
    [cargo(5,sen,{br:senBr,nu:senNu,total:senTotal}),cargo(6,fed,{br:fedBr,nu:fedNu,total:comp})].join(' '),
    cargo(7,est,{br:estBr,nu:estNu,total:comp})
  ];

  let cumulative='';
  const parts=[];
  for(let i=0;i<cores.length;i++){
    const material=(cumulative?cumulative+' ':'')+cores[i];
    const h=sha(material);
    const suffix=i===cores.length-1?' ASSI:'+'00'.repeat(132):'';
    const text='QRBU:'+(i+1)+':'+cores.length+' VRQR:6.0 '+cores[i]+' HASH:'+h+suffix;
    parts.push(text);
    cumulative=material+' HASH:'+h;
  }

  const slug=String(section).padStart(3,'0');
  const dir=root+'/secao-'+slug;
  fs.mkdirSync(dir,{recursive:true});
  for(let i=0;i<parts.length;i++){
    write(dir+'/qr-'+(i+1)+'.txt',parts[i]);
    execFileSync('qrencode',['-l','M','-s','6','-m','4','-o',dir+'/qr-'+(i+1)+'.png',parts[i]]);
  }

  const cargos=[
    ['presidente',pres,presBr,presNu,comp],
    ['governador',gov,govBr,govNu,comp],
    ['senador',sen,senBr,senNu,senTotal],
    ['depFederal',fed,fedBr,fedNu,comp],
    ['depEstadual',est,estBr,estNu,comp]
  ];
  const rows=cargos.flatMap(([k,a,br,nu,total])=>[
    ...a.map(x=>'<tr><td>'+label(k)+'</td><td><b>'+esc(x.numero)+'</b></td><td>'+esc(x.nome)+'</td><td>'+esc(x.partido)+'</td><td class="n">'+fmt(x.votos)+'</td></tr>'),
    '<tr class="mut"><td>'+label(k)+'</td><td>—</td><td>Brancos</td><td>—</td><td class="n">'+fmt(br)+'</td></tr>',
    '<tr class="mut"><td>'+label(k)+'</td><td>—</td><td>Nulos</td><td>—</td><td class="n">'+fmt(nu)+'</td></tr>',
    '<tr class="tot"><td>'+label(k)+'</td><td colspan="3"><b>Total do cargo</b></td><td class="n"><b>'+fmt(total)+'</b></td></tr>'
  ]).join('');

  const page='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>BU teste · Seção '+esc(section)+'</title><style>'+
  'body{font-family:system-ui;background:#f3f6f8;color:#17313d;margin:0}.w{max-width:1050px;margin:auto;padding:18px}.a{background:#fff0f0;border:1px solid #e5aaaa;color:#7f2020;padding:13px;border-radius:14px}.meta{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.meta span{background:#fff;border:1px solid #dce5ea;padding:7px 9px;border-radius:999px;font-size:12px}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.c{background:#fff;padding:14px;border-radius:14px;text-align:center}.c img{max-width:100%;height:auto}.c a{display:inline-block;margin-top:6px;font-size:12px}table{width:100%;background:#fff;border-collapse:collapse;margin-top:16px;font-size:12px}td,th{padding:8px;border-bottom:1px solid #e3e8eb;text-align:left}.n{text-align:right;font-variant-numeric:tabular-nums}.mut{color:#697b85}.tot{background:#f6f9fa}.back{display:inline-block;margin:0 0 12px}@media(max-width:760px){.g{grid-template-columns:1fr}table{font-size:11px}.w{padding:12px}}'+
  '</style></head><body><main class="w"><a class="back" href="/teste-29-bus.html">← Voltar às 29 seções</a><div class="a"><b>SIMULAÇÃO · BU SINTÉTICO · NÃO OFICIAL</b><br>Seção '+esc(section)+'. Os nomes e números vêm do catálogo de candidaturas da Central; os votos são inteiramente fictícios. TESTE:1 impede gravação no resultado oficial do aplicativo.</div><div class="meta"><span>Seção <b>'+esc(section)+'</b></span><span>Aptos <b>'+fmt(apto)+'</b></span><span>Comparecimento <b>'+fmt(comp)+'</b></span><span>QRBU <b>3 partes</b></span></div><div class="g">'+
  parts.map((_,i)=>'<div class="c"><h2>QRBU '+(i+1)+' de '+parts.length+'</h2><img src="/teste-29-bus/secao-'+slug+'/qr-'+(i+1)+'.png" alt="QRBU '+(i+1)+' da seção '+esc(section)+'"><br><a href="/teste-29-bus/secao-'+slug+'/qr-'+(i+1)+'.png">Abrir QR isolado</a></div>').join('')+
  '</div><table><thead><tr><th>Cargo</th><th>Número</th><th>Candidato real</th><th>Partido</th><th class="n">Votos fictícios</th></tr></thead><tbody>'+rows+'</tbody></table></main></body></html>';
  write(dir+'/index.html',page);

  const data={synthetic:true,official:false,section,apto,comparecimento:comp,faltosos:falt,cargos:Object.fromEntries(cargos.map(([k,a,br,nu,total])=>[k,{candidatos:a,brancos:br,nulos:nu,total}])),parts};
  write(dir+'/dados.json',JSON.stringify(data,null,2));
  manifest.push({section,slug,path:'/teste-29-bus/secao-'+slug+'/',parts:parts.length,apto,comparecimento:comp});
}

const cards=manifest.map(x=>'<a class="card" href="'+x.path+'"><b>Seção '+esc(x.section)+'</b><span>'+x.parts+' QRBU · '+fmt(x.comparecimento)+' comparecimento</span><em>Abrir teste →</em></a>').join('');
const index='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>29 BUs sintéticos · Central Eleitoral</title><style>'+
'body{font-family:system-ui;background:#f3f6f8;color:#17313d;margin:0}.w{max-width:1000px;margin:auto;padding:20px}.a{background:#fff0f0;border:1px solid #e5aaaa;color:#7f2020;padding:14px;border-radius:14px;line-height:1.45}.info{background:#fff;border:1px solid #dce5ea;padding:14px;border-radius:14px;margin:12px 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.card{display:flex;flex-direction:column;gap:5px;background:#fff;border:1px solid #dce5ea;border-radius:13px;padding:13px;text-decoration:none;color:#17313d}.card:hover{border-color:#7fa8bd}.card span{font-size:11px;color:#687b86}.card em{font-style:normal;font-size:11px;color:#176b49;font-weight:800}@media(max-width:760px){.grid{grid-template-columns:1fr 1fr}.w{padding:12px}}@media(max-width:440px){.grid{grid-template-columns:1fr}}'+
'</style></head><body><main class="w"><h1>29 BUs sintéticos para teste</h1><div class="a"><b>NÃO SÃO BOLETINS OFICIAIS.</b> Esta suíte usa candidatos reais do catálogo da Central, mas todos os votos são fictícios. Cada BU contém <b>TESTE:1</b>, portanto o aplicativo deve permitir a conferência e <b>bloquear qualquer gravação</b>.</div><div class="info"><b>Como testar:</b> abra uma seção abaixo em outro aparelho. Na Área Operacional, inicie a leitura de BU e leia os 3 QRBU na ordem. O leitor deve reconhecer a seção, validar a cadeia SHA-512, preencher os cinco cargos e terminar em modo de teste sem salvar.</div><div class="grid">'+cards+'</div></main></body></html>';
write(pub+'/teste-29-bus.html',index);
write(root+'/manifest.json',JSON.stringify({synthetic:true,official:false,count:manifest.length,generatedFrom:'candidate-catalog + locais-colmeia',sections:manifest},null,2));

for(const x of manifest){
  const d=root+'/secao-'+x.slug;
  if(!fs.existsSync(d+'/index.html'))throw new Error('Suite 29 BUs: página ausente '+x.section);
  for(let i=1;i<=3;i++)if(!fs.existsSync(d+'/qr-'+i+'.png'))throw new Error('Suite 29 BUs: QR ausente '+x.section+' parte '+i);
}
console.log('Suite 29 BUs pronta: '+manifest.length+' seções reais, 3 QRBU por seção, candidatos reais e votos sintéticos.');
