#!/bin/sh
# Baixa as texturas do mapa de Runeterra para public/map/. Elas são arte da Riot e ficam fora do Git:
# rode na máquina de dev e no servidor, antes do "docker compose up -d --build".
set -eu
cd "$(dirname "$0")/.."
mkdir -p public/map
for name in terrain_z1 depth_z1 ocean_z1; do
  curl -fsS -o "public/map/$name.jpg" "https://map.leagueoflegends.com/assets/images/tiles/$name.jpg"
done
echo "Texturas em $(pwd)/public/map"
