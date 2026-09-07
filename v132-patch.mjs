import fs from 'node:fs';
const targets=['/app/public/index.html','/app/public/transparencia.html'];
for(const file of targets){
  let s=fs.readFileSync(file,'utf8');
  if(!s.includes('/v132-about-hotfix.js')){
    if(!s.includes('</body>')) throw new Error(`Sem </body>: ${file}`);
    s=s.replace('</body>','  <script src="/v132-about-hotfix.js"></script>\n</body>');
    fs.writeFileSync(file,s);
  }
}
console.log('V1.3.2 hotfix aplicado: bloco Sobre único e estável.');
