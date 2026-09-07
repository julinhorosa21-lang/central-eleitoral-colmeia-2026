import {readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';

const index='/app/public/index.html';
const transparency='/app/public/transparencia.html';
const operation='/app/public/operacao.html';
for(const f of [index,transparency,'/app/public/v130-public.css','/app/public/v130-public.js'])if(!existsSync(f))throw new Error(`V1.3.0 public UX: arquivo ausente ${f}`);

// Preserva a Central completa dos operadores antes de transformar a raiz em painel público.
copyFileSync(index,operation);

let publicHtml=readFileSync(transparency,'utf8');
publicHtml=publicHtml.replace(/<title>[\s\S]*?<\/title>/i,'<title>Central Eleitoral Colméia 2026 — Apuração</title>');
if(!publicHtml.includes('/v130-public.css')){
  if(!publicHtml.includes('</head>'))throw new Error('V1.3.0 public UX: página pública sem </head>');
  publicHtml=publicHtml.replace('</head>','<link rel="stylesheet" href="/v130-public.css">\n</head>');
}
if(!publicHtml.includes('/v130-public.js')){
  if(!publicHtml.includes('</body>'))throw new Error('V1.3.0 public UX: página pública sem </body>');
  publicHtml=publicHtml.replace('</body>','<script src="/v130-public.js"></script>\n</body>');
}
writeFileSync(transparency,publicHtml);
writeFileSync(index,publicHtml);
console.log('V1.3.0 public UX applied: public home at /, full operation preserved at /operacao.html.');
