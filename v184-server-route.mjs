import fs from 'node:fs';

const path='/app/server.mjs';
let s=fs.readFileSync(path,'utf8');
const anchor="    if (p === '/api/tse/status') return json(res,200,{ok:true,...tseSync.getStatus()});";

if(!s.includes("p === '/api/tse/qr-key'")){
  if(!s.includes(anchor))throw new Error('V1.8.4: TSE status route anchor not found');
  const route=`    if (p === '/api/tse/qr-key' && req.method === 'GET') {
      try {
        const key=await tseSync.getQrPublicKey({
          version:u.searchParams.get('version'),
          type:u.searchParams.get('type'),
          phase:u.searchParams.get('phase'),
          uf:u.searchParams.get('uf')
        });
        if(!key)return json(res,404,{ok:false,error:'tse_qr_key_not_found'});
        res.writeHead(200,{
          'Content-Type':'application/octet-stream',
          'Content-Length':String(key.data.length),
          'Cache-Control':'public, max-age=604800, immutable',
          'X-CE-Key-Source':'tse-official',
          'X-CE-Key-Version':key.version
        });
        return res.end(key.data);
      } catch(e) {
        const code=String(e?.message||e);
        const invalid=/^invalid_/.test(code);
        if(!invalid)console.warn('[TSE QR key]',code);
        return json(res,invalid?400:503,{ok:false,error:invalid?code:'tse_qr_key_unavailable'});
      }
    }

${anchor}`;
  s=s.replace(anchor,route);
}

fs.writeFileSync(path,s);
console.log('V1.8.4 server route applied: official QR public key endpoint enabled.');
