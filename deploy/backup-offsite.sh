#!/bin/sh
# Copia os dumps de backups/ para fora do servidor com o rclone e apaga as cópias remotas com mais de 30 dias.
# Destino padrão: remote "gdrive" do rclone; troque com a variável RCLONE_DEST.
# Só apaga se a cópia der certo e houver dump recente, para não perder tudo se os backups locais pararem.
set -e

dir="$(dirname "$0")/../backups"
dest="${RCLONE_DEST:-gdrive:runarcana-backups}"

rclone copy "$dir" "$dest" --include 'runarcana-*.dump'
if [ -z "$(find "$dir" -name 'runarcana-*.dump' -mtime -2)" ]; then
  echo "$(date '+%F %H:%M') Nenhum dump recente em $dir: confira o serviço backup" >&2
  exit 1
fi
rclone delete "$dest" --min-age 30d
echo "$(date '+%F %H:%M') Backup externo copiado para $dest"
