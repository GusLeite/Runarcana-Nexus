import { REGION_ART } from '../../data/regionArt.js'

// Regiões do mapa, nas posições do original (coordenadas do mundo, com o centro do mapa em 0,0).
// highlight: tem a imagem public/map/regions/<slug>.png, que acende a região no terreno.
const REGIONS = [
  { slug: 'bilgewater', name: 'Águas de Sentina', art: ['BILGEWATER'], x: 569, y: -183, z: 0, highlight: true },
  { slug: 'demacia', name: 'Demacia', art: ['DEMACIA'], x: -428, y: 67, z: 6, highlight: true },
  { slug: 'freljord', name: 'Freljord', art: ['FRELJORD'], x: -351, y: 285, z: 18, highlight: true },
  { slug: 'ionia', name: 'Ionia', art: ['IONIA'], x: 539, y: 232, z: 12, highlight: true },
  { slug: 'ixtal', name: 'Ixtal', art: ['IXTAL'], x: 287, y: -332, z: 16, highlight: true },
  { slug: 'noxus', name: 'Noxus', art: ['NOXUS'], x: 0, y: 173, z: 8, highlight: true },
  { slug: 'piltover-zaun', name: 'Piltover e Zaun', art: ['PILTOVER', 'ZAUN'], x: 194, y: -109, z: 1, highlight: false },
  { slug: 'shadow-isles', name: 'Ilhas das Sombras', art: ['SHADOW_ISLES'], x: 700, y: -393, z: 0, highlight: true },
  { slug: 'shurima', name: 'Shurima', art: ['SHURIMA'], x: 67, y: -356, z: 9, highlight: true },
  { slug: 'targon', name: 'Targon', art: ['TARGON'], x: -240, y: -384, z: 0, highlight: true },
]

export const MAP_REGIONS = REGIONS.map(region => ({ ...region, art: region.art.map(id => REGION_ART[id]) }))
