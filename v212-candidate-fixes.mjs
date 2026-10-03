import fs from 'node:fs';
const pub='/app/public',serverFile='/app/server.mjs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
function replaceRequired(text,from,to,label){
 if(!text.includes(from))throw new Error('V212 anchor missing '+label);
 return text.replace(from,to);
}
let server=read(serverFile);

/* Match only explicit terminology imported from TSE.
   Judicial status must never be used to guess vote destination. */
server=replaceRequired(server,
 " if(s.includes('ANULADO'))return 'anulado';",
 " if(s.includes('NULO')&&s.includes('TECNICO'))return 'nulo_tecnico';\n if(s.includes('ANULADO'))return 'anulado';",
 'nulo tecnico classifier');
server=replaceRequired(server,
 "const totals={valido:0,valido_legenda:0,anulado:0,anulado_sub_judice:0,nao_informada:0};",
 "const totals={valido:0,valido_legenda:0,anulado:0,anulado_sub_judice:0,nulo_tecnico:0,nao_informada:0};",
 'destination totals');
server=replaceRequired(server,
 "   const pending=ce209CandidatePending(c);\n   if(pending)judicialPending++;",
 "   const pending=ce209CandidatePending(c);\n   const judicial=ce209Norm(c.situacaoJulgamento);\n   const totalizado=ce209Norm(c.situacaoTotalizacao||c.situacaoJulgamentoPleito);\n   const situacoesDistintas=!!(judicial&&totalizado&&judicial!==totalizado);\n   if(pending)judicialPending++;",
 'distinct situation marker');
server=replaceRequired(server,
 "    situacaoTotalizacao:String(c.situacaoTotalizacao||''),",
 "    situacaoTotalizacao:String(c.situacaoTotalizacao||''),\n    situacaoJudicial:String(c.situacaoJulgamento||''),\n    situacaoJulgamentoPleito:String(c.situacaoJulgamentoPleito||''),\n    situacaoPleito:String(c.situacaoPleito||''),\n    situacaoCassacao:String(c.situacaoCassacao||''),\n    situacoesDistintas,statusGrupo:String(c.statusGrupo||''),",
 'expose original status fields');
server=replaceRequired(server,
 "return {ok:true,total:rows.length,totals,judicialPending,counts,rows,",
 "return {ok:true,total:rows.length,totals,judicialPending,counts,rows,\n         situacoesDistintas:rows.filter(r=>r.situacoesDistintas).length,",
 'distinct situation summary');
write(serverFile,server);

let ui=read(pub+'/v209-admin-audit.js');
ui=replaceRequired(ui,
 "anulado_sub_judice:'Anulado sub judice',nao_informada:",
 "anulado_sub_judice:'Anulado sub judice',nulo_tecnico:'Nulo técnico',nao_informada:",
 'client labels');
ui=replaceRequired(ui,
 '<option value="anulado_sub_judice">Anulado sub judice</option><option value="nao_informada">',
 '<option value="anulado_sub_judice">Anulado sub judice</option><option value="nulo_tecnico">Nulo técnico</option><option value="distintas">Situações distintas</option><option value="nao_informada">',
 'audit filters');
ui=replaceRequired(ui,
 "['Anulado',t.anulado],['Anulado sub judice',t.anulado_sub_judice],['A confirmar',t.nao_informada],",
 "['Anulado',t.anulado],['Anulado sub judice',t.anulado_sub_judice],['Nulo técnico',t.nulo_tecnico],['A confirmar',t.nao_informada],['Campos distintos',audit.situacoesDistintas],",
 'metric cards');
ui=replaceRequired(ui,
 "   if(active==='substituida'&&!c.substituido)return false;",
 "   if(active==='substituida'&&!c.substituido)return false;\n   if(active==='distintas'&&!c.situacoesDistintas)return false;",
 'distinct filter');
ui=replaceRequired(ui,
 "if(!['all','judicial','substituida'].includes(active)&&c.destino!==active)",
 "if(!['all','judicial','substituida','distintas'].includes(active)&&c.destino!==active)",
 'special filters');
ui=replaceRequired(ui,
 "'</small></div><span data-kind="'+esc(c.destino)+'">'",
 "'</small>'+(c.situacoesDistintas?'<small class="ce212-dual">Judicial: '+esc(c.situacaoJudicial||'—')+' · Totalização: '+esc(c.situacaoTotalizacao||c.situacaoJulgamentoPleito||'—')+'</small>':'')+'</div><span data-kind="'+esc(c.destino)+'">'",
 'show distinct official fields');
ui=replaceRequired(ui,
 "q('#ce209Status').textContent='Último catálogo oficial importado: '+when+' · Origem: Portal de Dados Abertos do TSE · '+(j.missingComplement||0)+' sem registro complementar encontrado';",
 "q('#ce209Status').textContent='Último catálogo oficial importado: '+when+' · Origem: Portal de Dados Abertos do TSE · '+(j.missingComplement||0)+' sem registro complementar encontrado · '+(j.situacoesDistintas||0)+' com campos judiciais/totalização distintos';",
 'status text');
new Function(ui);
write(pub+'/v209-admin-audit.js',ui);
let css=read(pub+'/v209-admin-audit.css');
css+='\n/* V212: distinguish raw TSE judicial/totalization data; avoid implying an inferred result. */\n.ce209-row .ce212-dual{color:#66521a;font-weight:750;background:#fff8e8;padding:4px 6px;border-radius:5px}.ce209-row span[data-kind=nulo_tecnico]{background:#eef0f4;color:#37465a}\n';
write(pub+'/v209-admin-audit.css',css);

/* Keep the offline fallback catalog aligned with the same explicit TSE categories. */
const staticFile=pub+'/data/candidate-catalog.json';
const fallback=JSON.parse(read(staticFile));
const normalize=s=>String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().trim();
for(const candidates of Object.values(fallback.candidates||{}))for(const c of candidates){
 const raw=normalize(c.destinacaoVotos);
 if(raw.includes('NULO')&&raw.includes('TECNICO'))c.destinacaoCategoria='nulo_tecnico';
}
write(staticFile,JSON.stringify(fallback));

/* PWA: refresh only audit assets; do not touch BU readers or recorded votes. */
for(const p of [pub+'/admin/index.html',pub+'/admin.html']){
 if(!fs.existsSync(p))continue;
 let h=read(p);
 h=h.replace('/v209-admin-audit.js?v=209','/v209-admin-audit.js?v=212');
 h=h.replace('/v209-admin-audit.css?v=209','/v209-admin-audit.css?v=212');
 write(p,h);
}
let sw=read(pub+'/service-worker.js');
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v2.0.12-unified';");
write(pub+'/service-worker.js',sw);
const pkg='/app/package.json';
if(fs.existsSync(pkg)){const p=JSON.parse(read(pkg));p.version='2.0.12';write(pkg,JSON.stringify(p,null,2)+'\n')}

/* Tests evaluate the very same server functions shipped to production. */
const start=server.indexOf('/* CE209_OFFICIAL_DESTINATION_AUDIT');
const end=server.indexOf('/* CE210_READ_ONLY_EA20',start);
if(start<0||end<0)throw new Error('V212 helper extraction failed');
const fn=new Function(server.slice(start,end)+'\nreturn {ce209Destination,ce209Audit};')();
for(const [raw,want] of [
 ['Válido','valido'],['Anulado','anulado'],
 ['Anulado Sub Judice','anulado_sub_judice'],['Nulo Técnico','nulo_tecnico'],
 ['','nao_informada'],['Indeferido','nao_informada']
])if(fn.ce209Destination(raw)!==want)throw new Error('V212 classification '+raw);
const dual=fn.ce209Audit({candidates:{governador:[{
 numero:'35',situacao:'Deferido',situacaoJulgamento:'Renúncia',
 situacaoJulgamentoPleito:'Deferido',situacaoTotalizacao:'Deferido',
 destinacaoVotos:'Válido'
}],depEstadual:[{numero:'22777',situacaoJulgamento:'Renúncia',
 destinacaoVotos:'Nulo Técnico'}]}});
if(dual.situacoesDistintas!==1||dual.totals.valido!==1||dual.totals.nulo_tecnico!==1)throw new Error('V212 contradictory fields/nulo tecnico test failed');
if(dual.rows[0].situacaoJudicial!=='Renúncia'||dual.rows[0].situacaoTotalizacao!=='Deferido')throw new Error('V212 raw fields not preserved');
const current=fn.ce209Audit(fallback);
const rawTechnical=current.rows.filter(r=>r.destinacaoOriginal.toLowerCase().includes('nulo')&&r.destinacaoOriginal.toLowerCase().includes('técnico'));
if(current.total<250||current.totals.nulo_tecnico!==rawTechnical.length)throw new Error('V212 fallback mismatch');
if(current.totals.nulo_tecnico){
 console.log('V2.0.12 TSE nulo técnico confirmed:',JSON.stringify(rawTechnical.map(r=>({cargo:r.cargo,numero:r.numero,nome:r.nome}))));
}
console.log('V2.0.12 TSE confirmed summary:',JSON.stringify({
 generatedAt:fallback.generatedAt,total:current.total,counts:current.counts,totals:current.totals,
 distinct:current.rows.filter(r=>r.situacoesDistintas).map(r=>({cargo:r.cargo,numero:r.numero,nome:r.nome,judicial:r.situacaoJudicial,totalizacao:r.situacaoTotalizacao,dest:r.destinacaoOriginal}))
}));
console.log('V2.0.12 tests passed: all candidates checked, explicit Nulo Técnico, conflicting official fields shown, raw BU untouched.');
