import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const pages=['/app/public/index.html','/app/public/transparencia.html'];
const hotfix=`<script id="v132-about-inline-hotfix">(()=>{'use strict';const clean=()=>{document.querySelectorAll('.notice').forEach(n=>n.remove());const all=[...document.querySelectorAll('details.public-about-v131')];let keep=all[0]||null;all.slice(1).forEach(el=>el.remove());if(!keep){keep=document.createElement('details');keep.className='public-about-v131';keep.innerHTML='<summary>Sobre este acompanhamento</summary><div class="public-about-body"><p>Este painel acompanha localmente os boletins recebidos das 29 seções. Resultados parciais podem mudar durante a apuração e a conferência.</p><p>A divulgação oficial dos resultados é de responsabilidade da Justiça Eleitoral.</p><a class="public-team-link" href="/operacao.html">Acesso da equipe operacional</a></div>';}keep.id='publicSobre';document.querySelectorAll('#publicSobre').forEach(el=>{if(el!==keep)el.removeAttribute('id')});const details=document.querySelector('.public-details-card'),foot=document.querySelector('.foot');if(details){if(details.nextElementSibling!==keep)details.after(keep)}else if(foot){if(keep.nextElementSibling!==foot)foot.before(keep)}else if(!keep.isConnected){document.querySelector('.wrap')?.appendChild(keep)}};const install=()=>{clean();setTimeout(clean,150);setTimeout(clean,700);let busy=false;new MutationObserver(()=>{if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;clean()})}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['id']})};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install()})();</script>`;
for(const file of pages){
  if(!existsSync(file))throw new Error(`V1.3.1: página pública ausente ${file}`);
  let html=readFileSync(file,'utf8');
  if(!html.includes('/v131-refine-runtime.js')){
    if(!html.includes('</body>'))throw new Error(`V1.3.1: ${file} sem </body>`);
    html=html.replace('</body>','<script src="/v131-refine-runtime.js"></script>\n</body>');
  }
  if(!html.includes('v132-about-inline-hotfix')){
    html=html.replace('</body>',`${hotfix}\n</body>`);
  }
  writeFileSync(file,html);
}
console.log('V1.3.2 public hotfix applied: single stable Sobre block.');
