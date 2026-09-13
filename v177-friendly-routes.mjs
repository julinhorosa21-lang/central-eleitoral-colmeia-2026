import fs from 'node:fs';

const pub='/app/public';
const serverPath='/app/server.mjs';
const swPath=`${pub}/service-worker.js`;
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

let server=read(serverPath);
const anchor="    if (p === '/api/admin/integrity' && req.method === 'GET') {";

if(!server.includes('V1.7.7 friendly routes')){
  if(!server.includes(anchor)) throw new Error('V1.7.7: integrity endpoint anchor not found');
  server=server.replace(anchor,`    // V1.7.7 friendly routes
    if (req.method === 'GET' || req.method === 'HEAD') {
      const friendlyRoutes = new Map([
        ['/admin','/admin/index.html'],
        ['/admin/','/admin/index.html'],
        ['/apuracao','/transparencia.html'],
        ['/apuracao/','/transparencia.html'],
        ['/transparencia','/transparencia.html'],
        ['/transparencia/','/transparencia.html'],
        ['/operacao','/operacao.html'],
        ['/operacao/','/operacao.html'],
        ['/seguranca','/seguranca.html'],
        ['/seguranca/','/seguranca.html']
      ]);
      const target = friendlyRoutes.get(p);
      if (target) {
        res.writeHead(302,{
          Location: target + (u.search || ''),
          'Cache-Control':'no-store'
        });
        return res.end();
      }
    }

${anchor}`);
  write(serverPath,server);
}

// Alias estático útil para compartilhamento e atalhos.
const redirectHtml=(target,title)=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${target}"><title>${title}</title></head><body><script>location.replace('${target}'+location.search+location.hash)</script><p><a href="${target}">Abrir ${title}</a></p></body></html>`;
write(`${pub}/apuracao.html`,redirectHtml('/transparencia.html','Apuração Pública'));

// Normaliza links internos antigos ou inconsistentes sem alterar o desenho das telas.
for(const file of ['index.html','transparencia.html','operacao.html','seguranca.html','admin.html','admin/index.html']){
  const path=`${pub}/${file}`;
  if(!fs.existsSync(path)) continue;
  let html=read(path);
  html=html
    .replace(/href=(['"])\/admin\/?\1/g,'href="/admin/index.html"')
    .replace(/href=(['"])\/apuracao\/?\1/g,'href="/transparencia.html"')
    .replace(/href=(['"])\/transparencia\/?\1/g,'href="/transparencia.html"')
    .replace(/href=(['"])\/operacao\/?\1/g,'href="/operacao.html"')
    .replace(/href=(['"])\/seguranca\/?\1/g,'href="/seguranca.html"');
  write(path,html);
}

let sw=read(swPath);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.7.7-unified';");
if(!sw.includes("'/apuracao.html'")){
  sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/apuracao.html'"+b);
}
write(swPath,sw);

if(!read(serverPath).includes('V1.7.7 friendly routes')) throw new Error('V1.7.7: route injection failed');
if(!fs.existsSync(`${pub}/apuracao.html`)) throw new Error('V1.7.7: apuracao alias not created');

console.log('V1.7.7 applied: friendly routes and navigation aliases enabled.');
