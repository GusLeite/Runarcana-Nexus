#!/bin/sh
# Baixa as texturas do mapa de Runeterra para public/map/. Elas são arte da Riot e ficam fora do Git:
# rode na máquina de dev e no servidor, antes do "docker compose up -d --build".
set -eu
cd "$(dirname "$0")/.."
mkdir -p public/map/regions public/map/tiles
site=https://map.leagueoflegends.com
base=$site/assets/images
for file in tiles/terrain_z1 tiles/depth_z1 tiles/ocean_z1 fx/clouds fx/fog fx/fog-mask; do
  curl -fsS -o "public/map/$(basename "$file").jpg" "$base/$file.jpg"
done
for region in bilgewater demacia freljord ionia ixtal noxus shadow-isles shurima targon; do
  curl -fsS -o "public/map/regions/$region.png" "$base/regions/terrain/$region.png"
done
# Blocos detalhados: mesma lista de TILE_IDS em src/components/map/mapMath.js, com o número somado de 1.
for tile in 18 19 20 21 22 23 26 27 28 29 30 31 34 35 36 37 38 39 43 44 45 46 47 48 52 53 54; do
  curl -fsS -o "public/map/tiles/$tile.jpg" "$site/images/tiles/en_us/terrain_z2_$tile.jpg"
done
echo "Texturas em $(pwd)/public/map"
