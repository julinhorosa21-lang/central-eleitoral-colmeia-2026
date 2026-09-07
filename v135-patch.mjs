import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const pages=['/app/public/index.html','/app/public/transparencia.html'];
const scriptTag='<script src="/v135-install.js"></script>';
const pwaHead=`<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Central Eleitoral">`;
for(const file of pages){
  if(!existsSync(file))throw new Error(`V1.3.7: página pública ausente ${file}`);
  let html=readFileSync(file,'utf8');
  if(!html.includes('rel="manifest"')){
    if(!html.includes('</head>'))throw new Error(`V1.3.7: ${file} sem </head>`);
    html=html.replace('</head>',`${pwaHead}\n</head>`);
  }
  if(!html.includes('/v135-install.js')){
    if(!html.includes('</body>'))throw new Error(`V1.3.7: ${file} sem </body>`);
    html=html.replace('</body>',`${scriptTag}\n</body>`);
  }
  writeFileSync(file,html);
}
console.log('V1.3.7 PWA restored on public pages: manifest, app icons and install UI; operational page untouched.');
