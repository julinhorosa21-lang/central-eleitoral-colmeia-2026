import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const pub='/app/public',source=fs.readFileSync(pub+'/v191-share.js','utf8');
const startup="document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();";
assert.equal(source.split(startup).length,2,'expected share script startup');
const harness=source.replace(startup,'globalThis.ce216Test={buildCanvas,ce216PhotoSources,ce216Lookup};');
let rows=[],fetchCalls=0,imageLoads=[],drawImages=0,texts=[];
function candidateRow(numero,nome,votes,partido){
 return {dataset:{ce161Number:numero},querySelector(selector){
  const content={'.votes b':String(votes),'.who b':nome,'.who small':partido,'.votes small':'', '.num':numero};
  const textContent=content[selector];if(textContent===undefined)return null;
  return {textContent,cloneNode(){return {textContent,querySelectorAll(){return[]}}}};
 }};
}
const canvasCtx={
 beginPath(){},arc(){},arcTo(){},closePath(){},clip(){},fill(){},stroke(){},save(){},restore(){},fillRect(){},moveTo(){},lineTo(){},
 measureText(t){return {width:String(t).length*11}},
 fillText(t){texts.push(String(t))},
 drawImage(){drawImages++}
};
const canvas={getContext(){return canvasCtx}};
const document={
 documentElement:{classList:{contains(){return false}}},
 querySelector(selector){return selector.startsWith('#cargoTabs')?{dataset:{cargo:'governador'}}:null},
 querySelectorAll(selector){return selector==='#leaders .leader'?rows:[]},
 getElementById(id){if(id==='cargoProgressText')return {textContent:'6/29'};return null},
 createElement(kind){assert.equal(kind,'canvas');return canvas}
};
const catalog={governador:[
 {numero:'10',nomeUrna:'Alpha Oficial',partido:'PA',sqCandidato:'100',foto:'https://example.org/alpha'},
 {numero:'20',nomeUrna:'Beta Oficial',partido:'PB',sqCandidato:'200',foto:'https://example.org/beta'},
 {numero:'30',nomeUrna:'Gama Oficial',partido:'PC',sqCandidato:'300',foto:'https://example.org/gama'}
]};
class TestImage{
 naturalWidth=180;naturalHeight=180;onload=null;onerror=null;
 set src(url){
  imageLoads.push(url);
  queueMicrotask(()=>{
   if(url==='/candidate-photos/100.jpg'||url==='https://example.org/beta')this.onload?.();
   else this.onerror?.();
  });
 }
}
const sandbox={
 location:{pathname:'/'},document,Image:TestImage,AbortController,URL,Intl,Date,
 navigator:{},console,setTimeout,clearTimeout,Promise,
 fetch:async url=>{fetchCalls++;assert.equal(url,'/api/candidates');return {ok:true,json:async()=>({available:true,snapshot:{candidates:catalog}})}}
};
vm.runInNewContext(harness,sandbox,{timeout:1200});
const lib=sandbox.ce216Test;
assert.ok(lib,'script harness not exposed');
assert.equal(lib.ce216Lookup(catalog,'governador','20').nomeUrna,'Beta Oficial');
assert.equal(lib.ce216PhotoSources(catalog.governador[0])[0],'/candidate-photos/100.jpg');
rows=[
 candidateRow('10','Alpha',120,'PA'),candidateRow('20','Beta',70,'PB'),
 candidateRow('30','Gama',30,'PC'),candidateRow('40','Delta',10,'PD')
];
const result=await lib.buildCanvas();
assert.equal(result.top.length,3,'only top three');
assert.equal(result.top[0].nome,'Alpha Oficial','official name imported');
assert.equal(result.top[2].nome,'Gama Oficial');
assert.equal(drawImages,2,'two photos crop correctly');
assert.ok(texts.includes('SEM FOTO'),'missing photo has a visible fallback');
assert.ok(!texts.includes('Delta'),'fourth-place excluded');
assert.equal(fetchCalls,1,'one catalog lookup per card');
assert.deepEqual(imageLoads.slice(0,3),[
 '/candidate-photos/100.jpg','/candidate-photos/200.jpg','/candidate-photos/300.jpg'
],'same-origin photo attempted first');
rows=[];texts=[];drawImages=0;
const empty=await lib.buildCanvas();
assert.equal(empty.top.length,0,'zero-vote sharing preserved');
assert.ok(texts.includes('Nenhum voto computado até o momento'));
assert.equal(fetchCalls,1,'zero-vote share does not fetch candidate catalog');
for(const rel of ['index.html','transparencia.html'])
 assert.ok(fs.readFileSync(pub+'/'+rel,'utf8').includes('v191-share.js?v=216'));
console.log('V2.0.16 integration test passed: 3 official candidates, 2 photo renders, missing-photo avatar, fourth candidate excluded, single API call, zero-vote share preserved.');
