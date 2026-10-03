import fs from 'node:fs';
const p='/app/public/data/candidate-catalog.json';
if(!fs.existsSync(p))throw new Error('AUDIT: official fallback missing');
const d=JSON.parse(fs.readFileSync(p,'utf8'));
const g=d.candidates||{};
const norm=s=>String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase();
const statuses={};
const rows=[];
for(const [cargo,items] of Object.entries(g)){
 statuses[cargo]={total:items.length,groups:{},destinations:{},missingSupplement:0};
 for(const c of items){
  statuses[cargo].groups[c.statusGrupo]=(statuses[cargo].groups[c.statusGrupo]||0)+1;
  const k=c.destinacaoCategoria||c.destinacaoVotos||'não informado';
  statuses[cargo].destinations[k]=(statuses[cargo].destinations[k]||0)+1;
  if(!c.situacaoJulgamento&&!c.situacaoPleito&&!c.situacaoUrna)statuses[cargo].missingSupplement++;
  const cur=norm(c.situacao||''), judicial=norm(c.situacaoJulgamentoPleito||c.situacaoJulgamento||'');
  const primary=norm(c.situacaoPleito||''), urna=norm(c.situacaoUrna||''), tot=norm(c.situacaoTotalizacao||'');
  const conflict=(c.statusGrupo==='renuncia' && cur.includes('DEFERIDO')) || (c.statusGrupo==='deferida' && /RENUNC|INDEFER|CASSAD/.test(primary));
  if(c.statusGrupo!=='deferida'||k!=='valido'||conflict){
    rows.push({cargo,n:c.numero,sq:c.sqCandidato,name:c.nomeUrna||c.nome,
      grupo:c.statusGrupo,active:c.ativo,sub:c.subJudice,
      status:c.situacao,judicial:c.situacaoJulgamento,judicialPleito:c.situacaoJulgamentoPleito,
      pleito:c.situacaoPleito,urna:c.situacaoUrna,totalizacao:c.situacaoTotalizacao,
      destino:c.destinacaoVotos,kat:k,substituido:c.substituido,
      cass:c.situacaoCassacao,cassReasons:c.motivosCassacao,
      hist:c.historicoSituacao,conflict});
  }
 }
}
console.log('CE212_AUDIT_BUILD_META',JSON.stringify({generatedAt:d.generatedAt,source:d.source,counts:d.counts,statusSummary:d.statusSummary,substituicoes:d.substituicoes?.length}));
console.log('CE212_AUDIT_CARGO_COUNTS',JSON.stringify(statuses));
for(const row of rows)console.log('CE212_AUDIT_CANDIDATE',JSON.stringify(row));
for(const h of d.substituicoes||[])console.log('CE212_AUDIT_SUBSTITUTION',JSON.stringify(h));
