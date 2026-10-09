import fs from 'node:fs';
const APP='/app',PUB=APP+'/public',OP=PUB+'/operacao.html';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);

const gate=PUB+'/v232-operational-gate.js',g=read(gate);
if(!g.includes('CE234_SCOPED_LEGACY_CONTEXT'))throw new Error('V235 gate scope missing');
new Function(g);

let h=read(OP);
const reps=[
["const CARGOS={presidente:'Presidente',governador:'Governador',senador:'Senador',depFederal:'Deputado Federal',depEstadual:'Deputado Estadual'};","/* CE235_ROOT_SECTION */ const CARGOS={presidente:'Presidente',governador:'Governador'};"],
["async function validateOperator(){if(!operatorToken)return false;","async function validateOperator(){if(!operatorToken&&window.__CE_TEAM_TOKEN)operatorToken=String(window.__CE_TEAM_TOKEN);if(!operatorToken)return false;"],
["function focusOperatorSection(){if(!operatorInfo||operatorInfo.role==='admin')return;const sec=operatorSections()[0];if(!sec)return;const pl=placeForSection(sec);if(pl){currentPlace=pl;currentSection=sec}}","function focusOperatorSection(){if(!operatorInfo)return;if(operatorInfo.role==='admin'){const s=Number(new URLSearchParams(location.search).get('section'));if(Number.isFinite(s)){const p=placeForSection(s);if(p){currentPlace=p;currentSection=s}}return}const sec=operatorSections()[0];if(!sec)return;const pl=placeForSection(sec);if(pl){currentPlace=pl;currentSection=sec}}"],
["function openPlace(id){const next=DATA.locais.find(x=>x.id===id);const same=currentPlace&&currentPlace.id===id;currentPlace=next;if(!same||currentSection==null||!currentPlace.secoes.includes(currentSection))currentSection=currentPlace.secoes[0];","function openPlace(id,preferredSection=null){const next=DATA.locais.find(x=>x.id===id);if(!next)return;const same=currentPlace&&currentPlace.id===id;currentPlace=next;const ps=Number(preferredSection);if(Number.isFinite(ps)&&currentPlace.secoes.includes(ps))currentSection=ps;else if(!same||currentSection==null||!currentPlace.secoes.includes(currentSection))currentSection=currentPlace.secoes[0];"],
["function selectSection(s){currentSection=s;syncAdminSelectors();renderSectionResult();loadTseSectionEvidence(currentSection);openPlace(currentPlace.id)}","function selectSection(s){const sec=Number(s),pl=placeForSection(sec);if(pl){currentPlace=pl;currentSection=sec;openPlace(pl.id,sec);return}currentSection=sec;syncAdminSelectors();renderSectionResult();loadTseSectionEvidence(currentSection)}"],
["function syncAdminSelectors(){let secs;if(operatorInfo?.role==='operator')secs=operatorSections();else secs=currentPlace?currentPlace.secoes:allSections;","function syncAdminSelectors(){let secs;if(operatorInfo?.role==='operator')secs=operatorSections();else secs=allSections;"],
["adminSection.disabled=operatorInfo?.role==='operator'&&secs.length===1;adminCargo.innerHTML=","adminSection.disabled=operatorInfo?.role==='operator'&&secs.length===1;adminSection.onchange=()=>{const s=Number(adminSection.value),p=placeForSection(s);if(p){currentPlace=p;currentSection=s;openPlace(p.id,s)}};adminCargo.innerHTML="],
["async function toggleAdmin(){if(!adminMode){if(!(await ensureOperator()))return;focusOperatorSection();adminMode=true;if(!currentPlace)currentPlace=DATA.locais[0];openPlace(currentPlace.id);return}adminMode=false;adminPanel.classList.remove('open')}","async function toggleAdmin(){if(!adminMode){if(!(await ensureOperator()))return;focusOperatorSection();adminMode=true;const s=Number(new URLSearchParams(location.search).get('section'));if(operatorInfo?.role==='admin'&&Number.isFinite(s)){const p=placeForSection(s);if(p){currentPlace=p;currentSection=s;openPlace(p.id,s);return}}if(!currentPlace){currentSection=Number(allSections[0]);currentPlace=placeForSection(currentSection)||DATA.locais[0]}openPlace(currentPlace.id,currentSection);return}adminMode=false;adminPanel.classList.remove('open')}"]
];
for(const [a,b] of reps){if(!h.includes(a))throw new Error('V235 anchor missing: '+a.slice(0,45));h=h.replace(a,b)}
write(OP,h);

h=read(OP);
for(const x of ['CE235_ROOT_SECTION',"openPlace(id,preferredSection=null)","else secs=allSections","adminSection.onchange=()=>","const CARGOS={presidente:'Presidente',governador:'Governador'}"])if(!h.includes(x))throw new Error('V235 missing '+x);

h=h.replace(/v232-operational-gate\.js\?v=\d+/g,'v232-operational-gate.js?v=235').replace(/v232-access\.css\?v=\d+/g,'v232-access.css?v=235').replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=235');
write(OP,h);

let sw=read(PUB+'/service-worker.js').replace(/const VERSION='[^']+';/,"const VERSION='v2.2.5-root-section';");write(PUB+'/service-worker.js',sw);
const install=PUB+'/v135-install.js';if(fs.existsSync(install))write(install,read(install).replace(/service-worker\.js\?v=\d+/g,'service-worker.js?v=235'));
for(const rel of ['index.html','transparencia.html','admin/index.html','admin.html','apuracao.html','seguranca.html']){const p=PUB+'/'+rel;if(fs.existsSync(p))write(p,read(p).replace(/v135-install\.js\?v=\d+/g,'v135-install.js?v=235'))}
const pkg=APP+'/package.json';if(fs.existsSync(pkg)){const j=JSON.parse(read(pkg));j.version='2.2.5';write(pkg,JSON.stringify(j,null,2)+'\n')}
console.log('V2.2.5 root-section passed: admin usa 29 seções e a seção escolhida controla o local real.');
