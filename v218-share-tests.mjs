import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const pub='/app/public',source=fs.readFileSync(pub+'/v191-share.js','utf8');
const startup="document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();";
const harness=source.replace(startup,'globalThis.T={getRows,buildCanvas};');
let draw=0,texts=[],fetches=0,requested=[];
const ctx={beginPath(){},arc(){},arcTo(){},closePath(){},clip(){},fill(){},stroke(){},save(){},restore(){},fillRect(){},moveTo(){},measureText(t){return{width:String(t).length*10}},fillText(t){texts.push(String(t))},drawImage(){draw++}};
const canvas={getContext(){return ctx}};
const document={documentElement:{classList:{contains(){return false}}},querySelector(sel){return sel.startsWith('#cargoTabs')?{dataset:{cargo:'presidente'}}:null},querySelectorAll(){return[]},getElementById(id){if(id==='cargoProgressText')return{textContent:'29 / 29'};return null},createElement(k){assert.equal(k,'canvas');return canvas}};
class Img{constructor(){this.onload=null;this.onerror=null;this.naturalWidth=100;this.naturalHeight=100;}set src(v){requested.push(v);queueMicrotask(()=>this.onload?.())}}
const sandbox={document,location:{pathname:'/'},navigator:{},Image:Img,AbortController,URL,Intl,Date,Promise,console,setTimeout,clearTimeout,
 fetch:async()=>{fetches++;throw new Error('catalog unavailable')}};
sandbox.window=sandbox;
sandbox.__CE217_OFFICIAL__={cargos:{presidente:{candidates:[
 {numero:'13',sqCandidato:'111',nome:'A',partido:'X',votos:100,percentual:62.5},
 {numero:'22',sqCandidato:'222',nome:'B',partido:'Y',votos:60,percentual:37.5}
]}}};
vm.runInNewContext(harness,sandbox,{timeout:1500});
const rows=sandbox.T.getRows();assert.equal(rows.length,2);assert.equal(rows[0].sqCandidato,'111');
const card=await sandbox.T.buildCanvas();assert.equal(card.top.length,2);assert.equal(draw,2);
assert.deepEqual(requested.slice(0,2),['/candidate-photos/2t-presidente-13.jpg','/candidate-photos/2t-presidente-22.jpg']);
assert.ok(!texts.includes('1º')&&!texts.includes('2º'));assert.ok(texts.includes('RESULTADO DOS CANDIDATOS'));
assert.ok(fetches>=1);
assert.ok(fs.readFileSync(pub+'/index.html','utf8').includes('v191-share.js?v=218'));
console.log('V2.0.18 compatibility test passed: runoff portraits render from stable local files without placement badges.');
