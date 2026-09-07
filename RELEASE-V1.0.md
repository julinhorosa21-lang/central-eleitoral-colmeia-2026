# Central Eleitoral Colméia 2026 — Release V1.0

Data da consolidação: 06/09/2026.

## Escopo

A V1.0 consolida as versões V0.18 a V0.24.1 sem alterar o modelo de autenticação, as chaves existentes, a base SQLite persistente ou a separação do ambiente de simulação.

## Garantias verificadas no build

- sintaxe do servidor e dos scripts finais;
- rotas públicas, administrativas, TSE, segurança e simulação presentes;
- rate limiting e trilha de integridade presentes;
- banco `simulation.sqlite` isolado de `central.sqlite`;
- snapshot real sem acesso aos dados de simulação;
- páginas essenciais e shell PWA presentes;
- service worker identificado como `v1.0.0`;
- mapa e arquivos de fotos dos candidatos proporcionais presentes;
- cobertura mínima de fotos validada;
- combinações críticas de contraste continuam atendendo WCAG AA (4,5:1).

## Operação

Os dados exibidos pela Central têm finalidade local de acompanhamento e transparência. A Justiça Eleitoral permanece como fonte oficial e definitiva dos resultados.
