import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const pages=['/app/public/index.html','/app/public/transparencia.html'];
for(const file of pages){
  if(!existsSync(file))throw new Error(`V1.3.1: página pública ausente ${file}`);
  let html=readFileSync(file,'utf8');
  if(!html.includes('/v131-refine-runtime.js')){
    if(!html.includes('</body>'))throw new Error(`V1.3.1: ${file} sem </body>`);
    html=html.replace('</body>','<script src="/v131-refine-runtime.js"></script>\n</body>');
  }
  writeFileSync(file,html);
}
console.log('V1.3.1 public refinement applied: compact hero, earlier results, simpler locations and progressive details.');
