import fs from 'node:fs';
const pub='/app/public';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const tag='<'+'script src="/v170-public-music.js?v=170"></'+'script>';

for(const file of [`${pub}/index.html`,`${pub}/transparencia.html`]){
  let html=read(file);
  html=html.replace(/\/v170-public-music\.js\?v=\d+/g,'/v170-public-music.js?v=170');
  if(!html.includes('/v170-public-music.js'))html=html.replace('</body>',tag+'\n</body>');
  write(file,html);
}

const swPath=`${pub}/service-worker.js`;
if(fs.existsSync(swPath)){
  let sw=read(swPath);
  sw=sw.replace(/const VERSION='v1\.6\.9-unified';/,"const VERSION='v1.7.0-unified';");
  write(swPath,sw);
}

const installPath=`${pub}/v135-install.js`;
if(fs.existsSync(installPath)){
  let s=read(installPath).replace(/service-worker\.js\?v=\d+/g,'service-worker.js?v=170');
  write(installPath,s);
}

console.log('V1.7.0 applied: public background music + mute control.');
