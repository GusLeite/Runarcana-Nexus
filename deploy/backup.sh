#!/bin/sh
# Um pg_dump por dia em /backups, guardando os últimos 14 dias. Uma cópia falha não apaga as antigas.
while true; do
  file="/backups/runarcana-$(date +%F-%H%M).dump"
  if pg_dump -h db -U runarcana -d runarcana -Fc -f "$file.tmp"; then
    mv "$file.tmp" "$file"
    find /backups -name 'runarcana-*.dump' -mtime +14 -delete
    echo "Backup criado: $file"
  else
    rm -f "$file.tmp"
    echo "Backup falhou" >&2
  fi
  sleep 86400
done
