import fs from 'node:fs';

const path='/app/tse-sync.mjs';
let s=fs.readFileSync(path,'utf8');
const anchor='  function schedule() {';

if(!s.includes('async function getQrPublicKey(')){
  if(!s.includes(anchor))throw new Error('V1.8.4: tse-sync schedule anchor not found');
  const block=`  async function getQrPublicKey(input={}) {
    const version=String(input.version||'').trim();
    const type=String(input.type||'').toUpperCase();
    const phase=String(input.phase||'').toLowerCase();
    const uf=String(input.uf||'').toLowerCase();
    if(!/^\\d{8}$/.test(version)) throw new Error('invalid_key_version');
    if(!['LEGAL','COMUNITARIA'].includes(type)) throw new Error('invalid_election_type');
    if(!['o','s'].includes(phase)) throw new Error('invalid_phase');
    if(!/^[a-z]{2}$/.test(uf)) throw new Error('invalid_uf');
    const file=phase+uf+'qrcode.pub';
    const url='https://qrcodenobu.tse.jus.br/tse.qrcodebu/'+version+'/'+type+'/'+file;
    const fetched=await fetchArtifact(url);
    if(fetched?.notFound)return null;
    const data=fetched?.data;
    if(!data||data.length!==32)throw new Error('tse_qr_key_invalid_length');
    return {data,file,version,type,phase,uf};
  }

`;
  s=s.replace(anchor,block+anchor);
}

s=s.replace(
  '  return {getStatus, getSectionEvidence, refresh, start, stop};',
  '  return {getStatus, getSectionEvidence, getQrPublicKey, refresh, start, stop};'
);

if(!s.includes('getSectionEvidence, getQrPublicKey, refresh'))throw new Error('V1.8.4: getQrPublicKey export failed');
fs.writeFileSync(path,s);
console.log('V1.8.4 tse-sync applied: constrained official QR public-key retrieval enabled.');
