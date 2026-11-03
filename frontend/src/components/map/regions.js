import { REGION_ART } from '../../data/regionArt.js'

// Pontos do mapa, nas posições do original (coordenadas do mundo, com o centro do mapa em 0,0).
// level: 'far' aparece com o mapa visto de longe; 'near', ao aproximar.
// highlight: tem a imagem public/map/regions/<slug>.png, que acende a região no terreno.
// icon: 'crest' usa public/map/crests/<slug>.png; 'capital' usa os ícones de public/map/pins/.
const crest = (slug, name, art, x, y, z, highlight = true) => ({ slug, name, art, x, y, z, highlight, level: 'far', icon: 'crest', zoom: 300 })
const capital = (slug, name, art, x, y, z) => ({ slug, name, art, x, y, z, highlight: false, level: 'near', icon: 'capital', zoom: 200 })

// Piltover e Zaun dividem o mesmo ponto: de perto, cada uma fica a 50 unidades dele, dentro da moldura.
const TWIN_CITIES = { x: 194, y: -109, z: 1 }

const PINS = [
  crest('bilgewater', 'Águas de Sentina', ['BILGEWATER'], 569, -183, 0),
  crest('demacia', 'Demacia', ['DEMACIA'], -428, 67, 6),
  crest('freljord', 'Freljord', ['FRELJORD'], -351, 285, 18),
  crest('ionia', 'Ionia', ['IONIA'], 539, 232, 12),
  crest('ixtal', 'Ixtal', ['IXTAL'], 287, -332, 16),
  crest('noxus', 'Noxus', ['NOXUS'], 0, 173, 8),
  crest('piltover-zaun', 'Piltover e Zaun', ['PILTOVER', 'ZAUN'], TWIN_CITIES.x, TWIN_CITIES.y, TWIN_CITIES.z, false),
  crest('shadow-isles', 'Ilhas das Sombras', ['SHADOW_ISLES'], 700, -393, 0),
  crest('shurima', 'Shurima', ['SHURIMA'], 67, -356, 9),
  crest('targon', 'Targon', ['TARGON'], -240, -384, 0),
  capital('piltover', 'Piltover', ['PILTOVER'], TWIN_CITIES.x, TWIN_CITIES.y + 50, TWIN_CITIES.z),
  capital('zaun', 'Zaun', ['ZAUN'], TWIN_CITIES.x, TWIN_CITIES.y - 50, TWIN_CITIES.z),
  capital('void', 'O Vazio', ['VOID'], 270, -537, 9),
]

export const MAP_PINS = PINS.map(pin => ({ ...pin, art: pin.art.map(id => REGION_ART[id]) }))

// Nomes escritos no mapa, sem clique.
export const MAP_LABELS = [{ slug: 'icathia', name: 'Icathia', x: 275, y: -578, z: 8, level: 'near' }]

// Imagens presas ao terreno; size em unidades do mundo.
export const MAP_DECALS = [{ url: '/map/pins/capital-frame.png', x: TWIN_CITIES.x, y: TWIN_CITIES.y, z: TWIN_CITIES.z, size: 216, level: 'near' }]
