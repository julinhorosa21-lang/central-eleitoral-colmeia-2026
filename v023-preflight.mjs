import {readFileSync,existsSync} from 'node:fs';
const server=readFileSync('/app/server.mjs','utf8');
const required=[
  "version:'0.23.0'",
  'CREATE TABLE IF NOT EXISTS security_events',
  "'/api/admin/security-summary'",
  "'/api/admin/security-events'",
  "'/api/admin/security-export'",
  "event:'auth_failure'",
  "event:'forbidden_section'",
  "event:'rate_limited'",
  "'result_correction'",
  "'result_write'",
  'auditAction',
  'verifySecurityChain()',
  'takeRateLimit('
];
for(const token of required) if(!server.includes(token)) throw new Error('V0.23 preflight: missing '+token);
for(const file of ['/app/public/seguranca.html','/app/public/v023-main.js','/app/public/service-worker.js']) if(!existsSync(file)) throw new Error('V0.23 preflight: missing '+file);
const sw=readFileSync('/app/public/service-worker.js','utf8');
if(!sw.includes("VERSION='v0.23.0'")) throw new Error('V0.23 preflight: wrong service worker version');
if(!sw.includes("'/seguranca.html'")) throw new Error('V0.23 preflight: security dashboard not precached');
console.log('V0.23 preflight: security/audit endpoints, rate limiting, dynamic correction logging and PWA assets verified.');
