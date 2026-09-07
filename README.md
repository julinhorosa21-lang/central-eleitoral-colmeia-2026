# central-eleitoral-colmeia-2026

## V1.0.1 — versão estável

Central Eleitoral Colméia 2026 para acompanhamento local das 29 seções da 16ª Zona Eleitoral.

Hotfix V1.0.1:
- corrige a abertura da interface após a V1.0;
- impede que o marcador `data-app-version` do elemento `<html>` seja tratado como alvo de `textContent`;
- adiciona teste de regressão no preflight para bloquear esse erro em futuras versões;
- renova o cache do PWA para `v1.0.1`.

Principais módulos consolidados:
- coleta de resultados por seção com autenticação por chave;
- comparação BU local × dados oficiais do TSE;
- painel da coordenação e auditoria de segurança;
- transparência pública em tempo real;
- PWA/offline e fila local deduplicada;
- modo de simulação em banco separado;
- fotografias oficiais de candidatos a Deputado Federal e Estadual;
- auditoria de contraste WCAG AA;
- preflight integral de release antes de cada build.

Produção: https://central-eleitoral-production.up.railway.app/

Status da release: V1.0.1 pronta para produção.
