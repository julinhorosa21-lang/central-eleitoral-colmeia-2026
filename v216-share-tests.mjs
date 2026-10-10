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
 {numero:'44',nomeUrna:'PROFESSORA DORINHA',partido:'UNIÃO',foto:'/candidate-photos/2t-governador-44.jpg'},
 {numero:'45',nomeUrna:'VICENTINHO JÚNIOR',partido:'PSDB',foto:'/candidate-photos/2t-governador-45.jpg'}
]};
class TestImage{
 naturalWidth=180;naturalHeight=180;onload=null;onerror=null;
 set src(url){
  imageLoads.push(url);
  queueMicrotask(()=>{
   if(url==='/candidate-photos/2t-governador-44.jpg'||url==='/candidate-photos/2t-governador-45.jpg')this.onload?.();
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
assert.equal(lib.ce216Lookup(catalog,'governador','45').nomeUrna,'VICENTINHO JÚNIOR');
assert.equal(lib.ce216PhotoSources(catalog.governador[0],'governador','44')[0],'/candidate-photos/2t-governador-44.jpg');

rows=[
 candidateRow('44','DORINHA',120,'UNIÃO'),
 candidateRow('45','VICENTINHO',70,'PSDB')
];
const result=await lib.buildCanvas();
assert.equal(result.top.length,2,'two runoff candidates');
assert.equal(result.top[0].nome,'PROFESSORA DORINHA','official ballot name imported');
assert.equal(result.top[1].nome,'VICENTINHO JÚNIOR');
assert.equal(drawImages,2,'both candidate photos rendered');
assert.ok(!texts.includes('SEM FOTO'),'share must not fall back to text avatar');
assert.ok(!texts.includes('1º')&&!texts.includes('2º'),'placement badges removed from share image');
assert.equal(fetchCalls,1,'one catalog lookup per card');
assert.deepEqual(imageLoads.slice(0,2),[
 '/candidate-photos/2t-governador-44.jpg',
 '/candidate-photos/2t-governador-45.jpg'
],'stable second-round candidate photos loaded first');

rows=[];texts=[];drawImages=0;
const empty=await lib.buildCanvas();
assert.equal(empty.top.length,0,'zero-vote sharing preserved');
assert.ok(texts.includes('Nenhum voto computado até o momento'));
assert.equal(fetchCalls,1,'zero-vote share does not fetch candidate catalog');

for(const rel of ['index.html','transparencia.html'])
 assert.ok(/v191-share\.js\?v=\d+/.test(fs.readFileSync(pub+'/'+rel,'utf8')));

console.log('V2.0.16 integration test passed: runoff photos render, no placement badges, and zero-vote sharing remains valid.');
