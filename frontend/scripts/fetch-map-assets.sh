#!/bin/sh
# Baixa as texturas do mapa de Runeterra para public/map/. Elas são arte da Riot e ficam fora do Git:
# rode na máquina de dev e no servidor, antes do "docker compose up -d --build".
set -eu
cd "$(dirname "$0")/.."
mkdir -p public/map/regions public/map/tiles public/map/crests public/map/pins public/map/landmarks
site=https://map.leagueoflegends.com
base=$site/assets/images
for file in tiles/terrain_z1 tiles/depth_z1 tiles/ocean_z1 fx/clouds fx/fog fx/fog-mask; do
  curl -fsS -o "public/map/$(basename "$file").jpg" "$base/$file.jpg"
done
for region in bilgewater demacia freljord ionia ixtal noxus shadow-isles shurima targon; do
  curl -fsS -o "public/map/regions/$region.png" "$base/regions/terrain/$region.png"
done
# Brasões das regiões: dourado em repouso e colorido no destaque.
for crest in bilgewater demacia freljord ionia ixtal noxus piltover-zaun shadow-isles shurima targon; do
  curl -fsS -o "public/map/crests/$crest.png" "$base/regions/$crest.png"
  curl -fsS -o "public/map/crests/$crest-hover.png" "$base/regions/$crest-hover.png"
done
for pin in capital capital-hover; do
  curl -fsS -o "public/map/pins/$pin.png" "$base/pins/$pin.png"
done
# Blocos detalhados: mesma lista de TILE_IDS em src/components/map/mapMath.js, com o número somado de 1.
for tile in 18 19 20 21 22 23 26 27 28 29 30 31 34 35 36 37 38 39 43 44 45 46 47 48 52 53 54; do
  curl -fsS -o "public/map/tiles/$tile.jpg" "$site/images/tiles/pt_br/terrain_z2_$tile.jpg"
done
# Modelos 3D dos marcos (Disco Solar, Ixaocan, Monte Targon…), com as texturas e o feixe de luz de Targon.
for file in sun-disc.obj sun-disc.jpg immortal-bastion.obj immortal-bastion.jpg ixaocan.obj ixaocan.png ixaocan_ground.obj ixaocan_orbs.obj ixaocan_shadow.png mount-targon.obj mount-targon.png demacia-city-landmark.obj demacia-city-landmark.jpg frostguard.obj frostguard.jpg placidium.obj placidium.png the-void.obj the-void.jpg; do
  curl -fsS -o "public/map/landmarks/$file" "$site/assets/obj/landmarks/$file"
done
curl -fsS -o public/map/landmarks/beam.jpg "$base/fx/beam.jpg"
echo "Texturas em $(pwd)/public/map"
