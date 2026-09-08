import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const css=`
/* V1.6.3 — neutralidade visual dos cards de candidatos */
body.ce-regional-public #leaders .leader,
body.ce-regional-public #leaders .leader[data-rank="1"],
body.ce-regional-public #leaders .leader[data-rank="2"],
body.ce-regional-public #leaders .leader[data-rank="3"],
body.ce-regional-public #leaders .leader[data-ce161-rank="1"],
body.ce-regional-public #leaders .leader[data-ce161-rank="2"],
body.ce-regional-public #leaders .leader[data-ce161-rank="3"]{
  border-top:1px solid #D9E5EB!important;
  border-right:1px solid #D9E5EB!important;
  border-bottom:1px solid #D9E5EB!important;
  border-left:5px solid var(--party,#2450B2)!important;
  box-shadow:0 3px 10px rgba(22,65,93,.045)!important;
  outline:none!important;
}
`;

write(`${pub}/v163-neutral-cards.css`,css);
for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(file);
  if(!html.includes('/v163-neutral-cards.css'))html=html.replace('</head>','<link rel="stylesheet" href="/v163-neutral-cards.css?v=163">\n</head>');
  write(file,html);
}
let sw=read(`${pub}/service-worker.js`);
sw=sw.replace(/const VERSION='[^']+';/,"const VERSION='v1.6.3-unified';");
if(!sw.includes("'/v163-neutral-cards.css'"))sw=sw.replace(/(const CORE=\[[\s\S]*?)(\];)/,(m,a,b)=>a+",'/v163-neutral-cards.css'"+b);
write(`${pub}/service-worker.js`,sw);
console.log('V1.6.3 applied: candidate cards use the same neutral border regardless of list position.');
