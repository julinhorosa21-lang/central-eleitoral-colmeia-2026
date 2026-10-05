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
 {numero:'13',sqCandidato:'111',nome:'A',partido:'X',votos:100,percentual:50},
 {numero:'22',sqCandidato:'222',nome:'B',partido:'Y',votos:60,percentual:30},
 {numero:'44',sqCandidato:'333',nome:'C',partido:'Z',votos:40,percentual:20},
 {numero:'55',sqCandidato:'444',nome:'D',partido:'W',votos:5,percentual:2.5}
]}}};
vm.runInNewContext(harness,sandbox,{timeout:1500});
const rows=sandbox.T.getRows();assert.equal(rows.length,4);assert.equal(rows[0].sqCandidato,'111');
const card=await sandbox.T.buildCanvas();assert.equal(card.top.length,3);assert.equal(draw,3);
assert.deepEqual(requested.slice(0,3),['/candidate-photos/111.jpg','/candidate-photos/222.jpg','/candidate-photos/333.jpg']);
assert.ok(!texts.includes('D'));assert.ok(texts.includes('OS 3 MAIS VOTADOS'));
assert.ok(fetches>=1);
assert.ok(fs.readFileSync(pub+'/index.html','utf8').includes('v191-share.js?v=218'));
console.log('V2.0.18 integration test passed: live official top 3 rendered with exact local photos even when candidate catalog is unavailable.');
