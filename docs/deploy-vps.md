# Colocar no ar numa VPS

Hospedagem escolhida: VPS **Hetzner CAX11** (ARM, 2 vCPUs, 4 GB), paga por mês, com endereço grátis do DuckDNS e backup externo no Google Drive. A Oracle Always Free foi tentada, mas estava sem capacidade de Ampere A1 em São Paulo. As imagens usadas (Temurin 27, PostgreSQL 18, Caddy 2, Node 22) têm versão arm64. Regras gerais de produção: [`visao-geral.md`](visao-geral.md#colocar-no-ar).

## 1. Criar a chave SSH

No PC, gere a chave e copie a parte pública (o arquivo `.pub`). A privada nunca sai do PC.

```bash
ssh-keygen -t ed25519 -f "$HOME/.ssh/runarcana"
```

## 2. Criar o servidor

Em [console.hetzner.com](https://console.hetzner.com/), crie um projeto e adicione um servidor:

- **Localização**: a mais barata que tiver o plano (Europa).
- **Imagem**: Ubuntu 24.04.
- **Tipo**: Arm64 (Ampere), CAX11.
- **Rede**: IPv4 público ligado. O Let's Encrypt e parte dos jogadores precisam dele.
- **SSH key**: cole a chave pública. Assim o acesso por senha fica desligado.
- **Backups, volumes e firewall da Hetzner**: deixe sem. Os backups extras são pagos e o backup externo cobre os dados.

Confira o total mensal antes de confirmar e anote o IP.

## 3. Criar o endereço

Em [duckdns.org](https://www.duckdns.org/), crie um subdomínio (ex.: `runarcana.duckdns.org`) e aponte para o IP do servidor.

## 4. Subir o site

```bash
ssh -i "$HOME/.ssh/runarcana" root@IP
git clone -b feature/character-sheet https://github.com/GusLeite/Runarcana-Nexus.git
cd Runarcana-Nexus
sh deploy/setup-server.sh
cp .env.example .env
openssl rand -hex 24      # rode duas vezes: uma para DB_PASSWORD, outra para RUNARCANA_MASTER_PASSWORD
nano .env                 # SITE_ADDRESS=runarcana.duckdns.org e as duas senhas
sh frontend/scripts/fetch-map-assets.sh
docker compose up -d --build
docker compose logs -f web api
```

Quando os logs estiverem calmos, abra o endereço, entre como `mestre`, troque a senha e gere as senhas dos jogadores na aba **Contas**.

Quando o trabalho estiver na `main`, troque o branch do servidor com `git switch main`.

## Atualizar

No servidor, na pasta do projeto: `sh deploy/update.sh`. Ele busca a `main` do GitHub; sem commits novos, não faz nada (`--force` reconstrói assim mesmo). Com commits novos, grava um `pg_dump` em `backups/runarcana-predeploy-*.dump`, dá `git pull --ff-only`, baixa de novo as texturas se `fetch-map-assets.sh` mudou e roda `docker compose up -d --build`. Os `ALTER TABLE` que o `ddl-auto` não aplica ficam de fora: rode antes, à mão.

## 5. Ligar o backup externo

No **seu PC**, com o [rclone](https://rclone.org/downloads/) instalado, rode `rclone authorize "drive"`, autorize no navegador e copie o token que aparecer. No servidor, rode `rclone config`, crie um remote `drive` chamado `gdrive`, responda **não** à autorização automática e cole o token.

Teste e agende a cópia diária:

```bash
sh deploy/backup-offsite.sh
(crontab -l 2>/dev/null; echo "30 4 * * * sh $HOME/Runarcana-Nexus/deploy/backup-offsite.sh >> $HOME/backup-offsite.log 2>&1") | crontab -
```

Confira de vez em quando se os arquivos estão chegando na pasta `runarcana-backups` do Drive.

## Custos e riscos

- **Cobrança**: mensal, em euro, com IOF no cartão. Servidor desligado continua sendo cobrado; para parar de pagar, é preciso **apagar** o servidor, depois de copiar os backups.
- **Memória**: o build do Java e do front roda no próprio servidor; 4 GB bastam, sem swap.
