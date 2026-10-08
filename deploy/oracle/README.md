# Deploy gratuito — Oracle Cloud Always Free

Esta pasta executa a Central Eleitoral V2.1.6 em uma VM Oracle Cloud usando Docker, armazenamento persistente local e HTTPS via Caddy.

## VM recomendada

- Shape: VM.Standard.A1.Flex (Ampere ARM)
- 1 OCPU
- 6 GB de RAM
- Ubuntu 24.04
- Boot volume padrão (Always Free)
- IPv4 público
- Regras de entrada TCP: 22, 80 e 443

A aplicação também funciona com os limites Always Free superiores, mas não precisa deles.

## Instalação

Na VM:

```bash
git clone https://github.com/julinhorosa21-lang/central-eleitoral-colmeia-2026.git
cd central-eleitoral-colmeia-2026
sudo bash deploy/oracle/install-oracle.sh
```

O instalador detecta o IPv4 público e cria um hostname no formato:

```
https://SEU.IP.PUBLICO.nip.io/
```

O Caddy solicita o certificado HTTPS automaticamente e encaminha o tráfego para a Central na porta interna 8787.

## Persistência

Os dados ficam em:

```
/opt/central-eleitoral/deploy/oracle/data
```

Essa pasta é montada como `/data` no container da Central.

## Atualização

```bash
sudo /opt/central-eleitoral/deploy/oracle/update-oracle.sh
```

## Diagnóstico

```bash
cd /opt/central-eleitoral/deploy/oracle
sudo docker compose ps
sudo docker compose logs -f central
sudo docker compose logs -f caddy
```
