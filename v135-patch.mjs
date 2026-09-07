import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const pages=['/app/public/index.html','/app/public/transparencia.html'];
const tag='<script src="/v135-install.js"></script>';
for(const file of pages){
  if(!existsSync(file))throw new Error(`V1.3.5: página pública ausente ${file}`);
  let html=readFileSync(file,'utf8');
  if(!html.includes('/v135-install.js')){
    if(!html.includes('</body>'))throw new Error(`V1.3.5: ${file} sem </body>`);
    html=html.replace('</body>',`${tag}\n</body>`);
    writeFileSync(file,html);
  }
}
console.log('V1.3.5 install option applied to public pages; operational page untouched.');
