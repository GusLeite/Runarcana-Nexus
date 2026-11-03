import { REGION_ART } from '../../data/regionArt.js'
import voidGold from '../../assets/region-icons/void-gold.svg'
import bandleGold from '../../assets/region-icons/bandle-gold.svg'
import { drawTwinFrame } from './twinFrame.js'

// Pontos do mapa, nas posições do original (coordenadas do mundo, com o centro do mapa em 0,0).
// level: 'far' aparece com o mapa visto de longe; 'near', ao aproximar; 'any', nos dois; 'hidden' fica escondido.
// highlight: acende a região no terreno, com public/map/regions/<slug>.png ou com a área de MAP_AREAS.
// icon: 'crest' usa public/map/crests/<slug>.png; 'capital' usa public/map/pins/; 'art' usa goldIcon em repouso e o brasão de regionArt.js no destaque.
// lift: distância do ponto dentro da moldura em pé, que acompanha a inclinação da câmera.
const crest = (slug, name, art, x, y, z, highlight = true) => ({ slug, name, art, x, y, z, highlight, level: 'far', icon: 'crest', zoom: 300, lift: 0 })
const capital = (slug, name, art, x, y, z, lift) => ({ slug, name, art, x, y, z, highlight: false, level: 'near', icon: 'capital', zoom: 200, lift })

// Piltover e Zaun dividem o mesmo ponto: de perto, cada uma fica numa ponta da moldura.
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
  // O original não tem brasão do Vazio: o dourado é desenho nosso, o colorido vem da criação, e ele fica visível também de perto.
  { ...crest('void', 'O Vazio', ['VOID'], 270, -537, 9), level: 'any', icon: 'art', goldIcon: voidGold },
  // Sem lugar fixo: o mestre rola o d10 e MapScreen o põe em bandleSpot(rolagem).
  { ...crest('bandle', 'Bandópolis', ['BANDLE_CITY'], 0, 0, 0, false), level: 'hidden', icon: 'art', goldIcon: bandleGold },
  capital('piltover', 'Piltover', ['PILTOVER'], TWIN_CITIES.x, TWIN_CITIES.y, TWIN_CITIES.z, 50),
  capital('zaun', 'Zaun', ['ZAUN'], TWIN_CITIES.x, TWIN_CITIES.y, TWIN_CITIES.z, -50),
]

export const MAP_PINS = PINS.map(pin => ({ ...pin, art: pin.art.map(id => REGION_ART[id]) }))

// Onde Bandópolis surge em cada face do d10: uma por região, longe do brasão dela.
// Os pontos vêm da lista de lugares de Bandópolis no original, menos Ilhas das Sombras e Targon, onde lá não há nenhum por perto.
export const BANDLE_SPOTS = [
  { region: 'Águas de Sentina', x: 593, y: -66, z: 0 },
  { region: 'Demacia', x: -360, y: 70, z: 9 },
  { region: 'Freljord', x: -339, y: 204, z: 25 },
  { region: 'Ionia', x: 606, y: 256, z: 14 },
  { region: 'Ixtal', x: 351, y: -380, z: 6 },
  { region: 'Noxus', x: -107, y: 133, z: 7 },
  { region: 'Piltover e Zaun', x: 221, y: -202, z: 6 },
  { region: 'Ilhas das Sombras', x: 655, y: -330, z: 0 },
  { region: 'Shurima', x: 111, y: -371, z: 8 },
  { region: 'Targon', x: -200, y: -330, z: 8 },
]

export const bandleSpot = roll => (roll ? BANDLE_SPOTS[roll - 1] : null)

// Nomes escritos no mapa, sem clique.
export const MAP_LABELS = [{ slug: 'icathia', name: 'Icathia', x: 275, y: -578, z: 8, level: 'near', lift: 0 }]

// Imagens em pé, de frente para a câmera; size em unidades do mundo.
export const MAP_DECALS = [{ draw: drawTwinFrame, x: TWIN_CITIES.x, y: TWIN_CITIES.y, z: TWIN_CITIES.z, size: 180, level: 'near' }]

// Domos de distorção temporal no deserto de Shurima. speed é o ritmo do tempo lá dentro; o negativo corre ao contrário.
export const MAP_DOMES = [
  { x: -55, y: -285, radius: 50, speed: 1 },
  { x: 120, y: -265, radius: 34, speed: 1.9 },
  { x: 158, y: -395, radius: 56, speed: 0.45 },
  { x: -10, y: -440, radius: 42, speed: -1 },
  { x: -150, y: -400, radius: 30, speed: 2.8 },
  { x: 105, y: -505, radius: 38, speed: 0.2 },
]

// Globo demoníaco: domo oval só sobre o deserto de Shurima, cobrindo os domos de distorção.
export const MAP_GLOBE = { x: 0, y: -380, radiusX: 225, radiusY: 165, height: 110, flightHeight: 120, ravens: 30, flocks: 5 }

// Regiões sem imagem de destaque no original: acendem a terra dentro de um círculo em volta do ponto.
export const MAP_AREAS = { void: { x: 270, y: -560, radius: 175, color: [0.55, 0.2, 0.85] } }
