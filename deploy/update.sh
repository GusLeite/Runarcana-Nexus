#!/bin/sh
# Atualiza o servidor com a main do GitHub: backup, pull, texturas (se o script mudou) e rebuild.
# Uso (na pasta do projeto, no servidor): sh deploy/update.sh [--force]
#   --force  reconstrói mesmo sem commits novos.
# ALTER TABLE que o ddl-auto não aplica NÃO é feito aqui: rode antes, à mão.
set -eu
cd "$(dirname "$0")/.."

git fetch -q origin
old=$(git rev-parse HEAD)
new=$(git rev-parse '@{u}')

if [ "$old" = "$new" ] && [ "${1:-}" != "--force" ]; then
  echo "Já está em dia ($(git log --oneline -1)). Nada a fazer."
  exit 0
fi

mkdir -p backups
file="backups/runarcana-predeploy-$(date +%F-%H%M).dump"
docker compose exec -T db pg_dump -U runarcana -d runarcana -Fc > "$file.tmp"
mv "$file.tmp" "$file"
echo "Backup antes do deploy: $file"

git pull --ff-only -q
echo "Commits novos:"
git log --oneline "$old..HEAD"

if git diff --quiet "$old" HEAD -- frontend/scripts/fetch-map-assets.sh; then
  echo "Texturas do mapa: sem mudança."
else
  echo "Script das texturas mudou: baixando de novo."
  sh frontend/scripts/fetch-map-assets.sh
fi

docker compose up -d --build
docker image prune -f > /dev/null
docker compose ps --format "table {{.Name}}\t{{.Status}}"
