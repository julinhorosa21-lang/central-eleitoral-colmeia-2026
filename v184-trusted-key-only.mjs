import fs from 'node:fs';

const path='/app/public/operacao.html';
let s=fs.readFileSync(path,'utf8');
const start=s.indexOf('function ce184Hex(bytes){');
const end=start>=0?s.indexOf('async function captureQrPart(text){',start):-1;
if(start<0||end<0)throw new Error('V1.8.4: helper block not found');

const secure=`async function ce184VerifySignature(parts,chain){
  return await BUParser.verifyEd25519Signature(parts,{chain})
}

`;
s=s.slice(0,start)+secure+s.slice(end);
s=s.replace(/<style id="ce184-style">[\s\S]*?<\/style>/,'');
if(s.includes('ce184AcquireOfficialKey'))throw new Error('V1.8.4: untrusted manual key fallback still present');
fs.writeFileSync(path,s);
console.log('V1.8.4 trust policy applied: only the server-fetched TSE public key may validate a BU.');
