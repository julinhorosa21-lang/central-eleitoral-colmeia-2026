# Central Eleitoral Colméia 2026

## V2.1.4 — 2º turno

Aplicação local para acompanhamento das **29 seções eleitorais de Colméia/TO**, com operação por Boletim de Urna (BU), painel administrativo, transparência pública e mecanismos de auditoria.

### Eleição ativa

- **Turno:** 2º turno
- **Data:** 25 de outubro de 2026
- **Cargos ativos:** Presidente e Governador
- Os cargos de Senador, Deputado Federal e Deputado Estadual permanecem desativados nesta etapa.

### Proteções específicas do 2º turno

- rejeição de QRBU identificado como 1º turno;
- validação de turno também após a montagem completa do BU;
- separação do cache oficial do 2º turno;
- catálogo ativo restrito aos candidatos do 2º turno;
- estado pré-apuração mantido até 25/10/2026;
- resultados do 1º turno arquivados antes da limpeza da base ativa;
- migração idempotente: reinicializações parciais não sobrescrevem o backup histórico;
- auditoria V2.1.4 bloqueia regressões de data, turno, cargos, QRBU e PWA.

### Principais módulos

- coleta de resultados por seção com autenticação por chave;
- leitura e validação de QRBU;
- verificação criptográfica de assinatura do BU;
- bloqueio e reabertura controlada de seções;
- painel da coordenação e trilha de auditoria;
- transparência pública com resultados provenientes dos BUs registrados;
- comparação administrativa BU local × dados oficiais;
- PWA com atualização automática;
- fila local e otimizações para uso em rede móvel;
- backups, restauração e mecanismos de recuperação;
- compartilhamento de resultados com imagens dos candidatos.

### Dados do 1º turno

A migração para o 2º turno preserva os dados anteriores em `/data/archive`, incluindo snapshot JSON dos resultados e cópia da base SQLite. Esses arquivos não são usados como apuração ativa do 2º turno.

### Build

O build é consolidado pelo `v182-build.sh`, que reaplica os patches históricos em sequência e termina com a auditoria `v224-runoff-audit.mjs`.

Release atual: **V2.1.4**.

### Produção

Endereço configurado historicamente:

`https://central-eleitoral-production.up.railway.app/`

> O código V2.1.4 está no GitHub. A publicação de uma nova imagem depende do ambiente Railway estar habilitado para novos deploys.
