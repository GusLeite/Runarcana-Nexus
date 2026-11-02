# Colocar no ar na Oracle Cloud (grátis)

Servidor Always Free da Oracle, endereço grátis do DuckDNS e backup externo no Google Drive. As imagens usadas (Temurin 27, PostgreSQL 18, Caddy 2, Node 22) têm versão arm64. Regras gerais de produção: [`visao-geral.md`](visao-geral.md#colocar-no-ar).

## 1. Criar a máquina

1. Crie a conta em [oracle.com/cloud/free](https://www.oracle.com/cloud/free/). Ela pede cartão para verificação. A **região inicial não muda depois**: escolha uma próxima que tenha Ampere A1.
2. Em **Compute → Instances → Create instance**: imagem **Canonical Ubuntu**, shape **VM.Standard.A1.Flex**, 2 OCPUs e 12 GB (confira no painel o limite grátis atual). Marque que ele aparece como *Always Free*.
3. Baixe a chave SSH e guarde-a fora do repositório. Com "Out of capacity", tente outro domínio de disponibilidade ou mais tarde.
4. Anote o IP público. Para ele não mudar, troque-o por um **IP reservado** (Reserved public IP) na VNIC da instância.
5. Na **Security List** da sub-rede, adicione regras de entrada TCP de `0.0.0.0/0` para as portas **80** e **443**. A 22 já vem aberta.

## 2. Criar o endereço

Em [duckdns.org](https://www.duckdns.org/), crie um subdomínio (ex.: `runarcana.duckdns.org`) e aponte para o IP da máquina.

## 3. Subir o site

```bash
ssh -i CHAVE.key ubuntu@IP
git clone -b feature/character-sheet https://github.com/GusLeite/Runarcana-Nexus.git
cd Runarcana-Nexus
sudo sh deploy/setup-oracle.sh
exit
```

Entre de novo por SSH e:

```bash
cd Runarcana-Nexus
cp .env.example .env
openssl rand -hex 24      # rode duas vezes: uma para DB_PASSWORD, outra para RUNARCANA_MASTER_PASSWORD
nano .env                 # SITE_ADDRESS=runarcana.duckdns.org e as duas senhas
docker compose up -d --build
docker compose logs -f web api
```

Quando os logs estiverem calmos, abra o endereço, entre como `mestre`, troque a senha e gere as senhas dos jogadores na aba **Contas**.

Quando o trabalho estiver na `main`, troque o branch do servidor com `git switch main`.

## 4. Ligar o backup externo

No **seu PC**, com o [rclone](https://rclone.org/downloads/) instalado, rode `rclone authorize "drive"`, autorize no navegador e copie o token que aparecer. No servidor, rode `rclone config`, crie um remote `drive` chamado `gdrive`, responda **não** à autorização automática e cole o token.

Teste e agende a cópia diária:

```bash
sh deploy/backup-offsite.sh
(crontab -l 2>/dev/null; echo "30 4 * * * sh $HOME/Runarcana-Nexus/deploy/backup-offsite.sh >> $HOME/backup-offsite.log 2>&1") | crontab -
```

Confira de vez em quando se os arquivos estão chegando na pasta `runarcana-backups` do Drive.

## Riscos

- **Ociosidade**: a Oracle pode recuperar instâncias Always Free com pouco uso (CPU abaixo de 20% em 7 dias). Este site tende a ficar nessa faixa. Se a máquina sumir ou parar, religue-a; se não der, crie outra, ou contrate uma VPS, e restaure o último dump do Drive.
- **Cota**: a Oracle muda os limites grátis sem muito aviso. Instância acima do limite pode ser desativada; siga o que o painel mostrar.
- **Cobrança**: mantenha a conta no plano Free, sem upgrade, para não haver cobrança.
