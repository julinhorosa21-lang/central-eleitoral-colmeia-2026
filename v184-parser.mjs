import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const parserPath='/app/public/bu-parser.js';
let parser=fs.readFileSync(parserPath,'utf8');
const anchor="  root.BUParser={version:'1.8.3',CARGO_MAP,CARGO_NAMES,fragmentInfo,assemble,parse,verifyHashChain};";

if(!parser.includes('async function verifyEd25519Signature(')){
  if(!parser.includes(anchor))throw new Error('V1.8.4: BUParser 1.8.3 anchor not found');
  const extension=String.raw`  function hexToBytes(hex){
    const s=asHex(hex);if(!s||s.length%2||!/^[0-9A-F]+$/.test(s))throw new Error('invalid_hex');
    const out=new Uint8Array(s.length/2);for(let i=0;i<out.length;i++)out[i]=parseInt(s.slice(i*2,i*2+2),16);return out;
  }
  function bytesToHex(bytes){return Array.from(bytes||[]).map(x=>Number(x).toString(16).padStart(2,'0')).join('').toUpperCase();}
  function keyDescriptor(parts){
    const ordered=orderedParts(parts),fields={};
    for(const part of ordered)for(const [k,v] of Object.entries(part.fields||{}))if(fields[k]===undefined)fields[k]=String(v);
    const version=String(fields.VRCH||'').trim();
    const type=String(fields.ORLC||'').toUpperCase()==='LEG'?'LEGAL':String(fields.ORLC||'').toUpperCase()==='COM'?'COMUNITARIA':'';
    const rawPhase=String(fields.FASE||'').toUpperCase();const phase=rawPhase==='O'?'o':rawPhase==='S'?'s':'';
    const uf=String(fields.UNFE||'').toLowerCase();
    if(!/^\d{8}$/.test(version))throw new Error('invalid_key_version');
    if(!type)throw new Error('unsupported_election_type');
    if(!phase)throw new Error('unsupported_phase');
    if(!/^[a-z]{2}$/.test(uf))throw new Error('invalid_uf');
    return {version,type,phase,uf};
  }
  function storageKey(d){return 'ce184_tse_qr_key:'+d.version+':'+d.type+':'+d.phase+':'+d.uf;}
  function cachedPublicKey(d){
    try{if(!root.localStorage)return null;const raw=root.localStorage.getItem(storageKey(d));if(!raw)return null;const j=JSON.parse(raw);const bytes=hexToBytes(j?.keyHex||'');if(bytes.length!==32)return null;return {bytes,keySha512:String(j?.keySha512||''),source:'browser-cache'};}catch{return null}
  }
  function cachePublicKey(d,bytes,keySha512){
    try{if(!root.localStorage)return;root.localStorage.setItem(storageKey(d),JSON.stringify({keyHex:bytesToHex(bytes),keySha512:String(keySha512||''),savedAt:new Date().toISOString()}));}catch{}
  }
  async function fetchPublicKey(d){
    const cached=cachedPublicKey(d);if(cached)return cached;
    if(typeof root.fetch!=='function')throw new Error('tse_key_unavailable');
    const q=new URLSearchParams({version:d.version,type:d.type,phase:d.phase,uf:d.uf});
    let r;try{r=await root.fetch('/api/tse/qr-key?'+q.toString(),{cache:'no-store'});}catch{throw new Error('tse_key_unavailable')}
    if(!r?.ok)throw new Error('tse_key_unavailable');
    const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length!==32)throw new Error('tse_key_invalid_length');
    const keySha512=String(r.headers?.get?.('x-ce-key-sha512')||'');cachePublicKey(d,bytes,keySha512);
    return {bytes,keySha512,source:String(r.headers?.get?.('x-ce-key-source')||'tse')};
  }
  async function verifyDetachedEd25519(signatureHex,hashHex,publicKeyBytes){
    if(!root.crypto?.subtle)throw new Error('ed25519_unavailable');
    const signature=hexToBytes(signatureHex),message=hexToBytes(hashHex),keyBytes=publicKeyBytes instanceof Uint8Array?publicKeyBytes:new Uint8Array(publicKeyBytes||[]);
    if(signature.length!==64)throw new Error('invalid_signature_length');if(message.length!==64)throw new Error('invalid_hash_length');if(keyBytes.length!==32)throw new Error('invalid_public_key_length');
    let key;try{key=await root.crypto.subtle.importKey('raw',keyBytes,{name:'Ed25519'},false,['verify']);}catch{throw new Error('ed25519_unavailable')}
    return !!(await root.crypto.subtle.verify({name:'Ed25519'},key,signature,message));
  }
  async function verifyEd25519Signature(parts,options={}){
    const chain=options.chain?.ok?options.chain:await verifyHashChain(parts);
    if(!chain?.ok)return {ok:false,error:chain?.error||'hash_chain_invalid',chain};
    if(!chain.signature)return {ok:false,error:'qrbu_signature_missing',chain};
    let descriptor;try{descriptor=keyDescriptor(parts);}catch(e){return {ok:false,error:e.message||'key_descriptor_invalid',chain};}
    let keyInfo;try{keyInfo=options.publicKeyBytes?{bytes:options.publicKeyBytes,keySha512:'',source:'provided'}:await fetchPublicKey(descriptor);}catch(e){return {ok:false,error:e.message||'tse_key_unavailable',chain,descriptor};}
    let valid=false;try{valid=await verifyDetachedEd25519(chain.signature,chain.lastHash,keyInfo.bytes);}catch(e){return {ok:false,error:e.message||'signature_verification_failed',chain,descriptor};}
    return {ok:valid,error:valid?'':'qrbu_signature_invalid',chain,descriptor,keySha512:keyInfo.keySha512||'',keySource:keyInfo.source||'',algorithm:'Ed25519'};
  }

  root.BUParser={version:'1.8.4',CARGO_MAP,CARGO_NAMES,fragmentInfo,assemble,parse,verifyHashChain,keyDescriptor,verifyDetachedEd25519,verifyEd25519Signature};`;
  parser=parser.replace(anchor,extension);
}
fs.writeFileSync(parserPath,parser);

const context={console,TextEncoder,URLSearchParams,crypto:webcrypto};context.globalThis=context;
vm.runInNewContext(parser,context,{filename:'bu-parser.js'});
const P=context.BUParser;
const hex=s=>Uint8Array.from(String(s).match(/../g).map(x=>parseInt(x,16)));
const key=hex('3c8dd2914fc8b20bd80b09744867684c051145e3f8b887d28af3d23a17a843dd');
const hash='57D17C50037E7E4C624468438AE77BEA6562076A20CD454FE30EAD413F7D6174ADE59D0D97013BD8F9F50316D766D3670B57FBB7D396C08DD4C4D9250E7B05FC';
const sig='B2FA068D49111BA3A61DA0DC44334F8EC41598C73DE90B8E22AA64DAB8C10AA083FD0737B47560B3C6C837D0F24044ABB18DD5A4D2BC66884DB57BFCFA40F906';
if(!(await P.verifyDetachedEd25519(sig,hash,key)))throw new Error('V1.8.4: official TSE Ed25519 regression vector failed');
console.log('V1.8.4 parser applied: Ed25519 verification ready.');
