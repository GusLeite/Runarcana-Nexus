#!/bin/sh
# Baixa as texturas do mapa de Runeterra para public/map/. Elas são arte da Riot e ficam fora do Git:
# rode na máquina de dev e no servidor, antes do "docker compose up -d --build".
set -eu
cd "$(dirname "$0")/.."
mkdir -p public/map
base=https://map.leagueoflegends.com/assets/images
for file in tiles/terrain_z1 tiles/depth_z1 tiles/ocean_z1 fx/clouds fx/fog fx/fog-mask; do
  curl -fsS -o "public/map/$(basename "$file").jpg" "$base/$file.jpg"
done
echo "Texturas em $(pwd)/public/map"
