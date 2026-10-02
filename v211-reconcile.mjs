/* V2.0.11: read-only reconciliation; the original BU and official snapshots remain immutable. */
export const CE211_CARGOS=['presidente','governador','senador','depFederal','depEstadual'];
export const CE211_STATES=['divergente','conferido','sem_bu_local','aguardando_tse','aguardando_decodificacao','nao_comparavel','aguardando_ambos'];
function present(x){return x!==null&&x!==undefined}
function safeSummary(x){
 if(x===null||x===undefined)return null;
 if(typeof x==='string')return x.slice(0,2500);
 if(typeof x==='object')return JSON.parse(JSON.stringify(x));
 return String(x).slice(0,2500);
}
export function reconcileOne(input){
 const {section,cargo,placeName='',local=null,official=null,version=null,updatedAt=null,
 verificationStatus='',evidence=null,compare=null}=input;
 const hasLocal=present(local),hasOfficial=present(official);
 let state='aguardando_ambos',cmp=null;
 if(hasLocal&&hasOfficial){
   try{cmp=typeof compare==='function'?compare(local,official):null}catch{cmp=null}
   if(cmp?.ready===true)state=cmp.equal===true?'conferido':'divergente';
   else state='nao_comparavel';
 }else if(hasOfficial)state='sem_bu_local';
 else if(hasLocal){
   state=evidence?.officialBuReady&&!evidence?.structuredOfficialReady?'aguardando_decodificacao':'aguardando_tse';
 }
 const differences=state==='divergente'&&Array.isArray(cmp?.differences)?cmp.differences.slice(0,80):[];
 const summary=state==='divergente'?safeSummary(cmp?.summary):null;
 return {section:Number(section),cargo,placeName,state,version,updatedAt,verificationStatus,
   localAvailable:hasLocal,officialAvailable:hasOfficial,
   officialBuDownloaded:evidence?.officialBuReady===true,
   structuredOfficialReady:evidence?.structuredOfficialReady===true,
   voteComparison:evidence?.voteComparison||null,
   differences,summary,
   comparisonReady:cmp?.ready===true,
   evidenceHashCount:Array.isArray(evidence?.officialBu)?evidence.officialBu.length:0};
}
export function reconciliationReport(rows,sectionInfo,compare,evidenceOf,generatedAt=new Date().toISOString()){
 const byKey=new Map(rows.map(r=>[Number(r.section)+':'+r.cargo,r]));
 const items=[];
 for(const sec of sectionInfo){
   const section=Number(sec.section),evidence=evidenceOf(section);
   for(const cargo of CE211_CARGOS){
     const row=byKey.get(section+':'+cargo);
     const parse=x=>{if(!x)return null;try{return typeof x==='string'?JSON.parse(x):x}catch{return null}};
     items.push(reconcileOne({section,cargo,placeName:sec.placeName||'',
       local:row?parse(row.local_payload_json):null,
       official:row?parse(row.official_payload_json):null,
       verificationStatus:row?.verification_status||'',updatedAt:row?.updated_at||null,
       version:row?.version||null,evidence,compare}));
   }
 }
 const summary=Object.fromEntries(CE211_STATES.map(x=>[x,items.filter(i=>i.state===x).length]));
 summary.total=items.length;
 summary.secoesComDivergencia=new Set(items.filter(i=>i.state==='divergente').map(i=>i.section)).size;
 return {ok:true,generatedAt,summary,items};
}