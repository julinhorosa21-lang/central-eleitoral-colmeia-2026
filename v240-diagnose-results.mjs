import fs from 'node:fs';
const s=fs.readFileSync('/app/server.mjs','utf8');
for(const term of ['CREATE TABLE IF NOT EXISTS results','FROM results','INSERT INTO results','UPDATE results','SELECT * FROM results','sectionToPlace']){
  let p=0,c=0;
  while((p=s.indexOf(term,p))>=0&&c<8){
    console.log('CE240_SCHEMA',JSON.stringify({term,pos:p,snippet:s.slice(Math.max(0,p-1200),Math.min(s.length,p+5000))}));
    p+=term.length;c++;
  }
}
