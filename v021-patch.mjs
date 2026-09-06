import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const indexPath = '/app/public/index.html';
const serverPath = '/app/server.mjs';
const packagePath = '/app/package.json';

if (!existsSync(indexPath) || !existsSync(serverPath)) {
  throw new Error('V0.21 patch: V0.20 base files not found');
}

let index = readFileSync(indexPath, 'utf8');
if (!index.includes('/v021-main.js')) {
  if (!index.includes('</body>')) throw new Error('V0.21 patch: index.html has no </body>');
  index = index.replace('</body>', '<script src="/v021-main.js"></script>\n</body>');
  writeFileSync(indexPath, index);
}

let server = readFileSync(serverPath, 'utf8');
server = server.replace("version:'0.20.0'", "version:'0.21.0'");
if (!server.includes('Transparência V0.21:')) {
  const anchor = "console.log('PWA V0.19: app instalável + shell offline + fila local deduplicada ativos.');";
  const line = "console.log('Transparência V0.21: painel público sem login + totais + seções + atualização em tempo real ativos.');";
  if (server.includes(anchor)) server = server.replace(anchor, `${line}\n  ${anchor}`);
  else server += `\n${line}\n`;
}
writeFileSync(serverPath, server);

if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  pkg.version = '0.21.0';
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
}

console.log('V0.21 patch applied successfully.');
