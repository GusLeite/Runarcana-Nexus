import { placeholderArt } from '../utils/placeholderArt.js'
import rudoImg from '../assets/characters/rudo.jpg'
import rudoVid from '../assets/characters/rudo.mp4'
import gaudronImg from '../assets/characters/gaudron.jpg'
import gaudronVid from '../assets/characters/gaudron.mp4'

// Personagens da tela de seleção.
// - img: arte real (import de src/assets) ou placeholder gerado por hue/variant
// - vid: vídeo MP4 sem áudio em loop; `img` vira o poster
// - pos: enquadramento (background-position / object-position)
// - fx: efeito de partículas ('embers' = brasas do Gaudron, 'blood' = magia de sangue do Rudo)
// - impact: onda de choque + tremor ao receber o mouse
// - burst: pulso vermelho ao receber o mouse
const BASE = [
  { id: 'rudo', name: 'RUDO', role: 'Vanguarda', hue: 8, variant: 0, lore: 'Abre caminho no corpo a corpo e nunca recua.',
    img: rudoImg, vid: rudoVid, pos: '60% 30%', fx: 'blood', burst: true },
  { id: 'gaudron', name: 'GAUDRON', role: 'Guardião', hue: 42, variant: 1, lore: 'Guarda os portões e as promessas feitas.',
    img: gaudronImg, vid: gaudronVid, pos: '57% 25%', fx: 'embers', impact: true },
  { id: 'proto', name: 'PROTO', role: 'Arcanista', hue: 190, variant: 2, lore: 'Dobra a magia antiga em novas formas.' },
  { id: 'titan', name: 'TITAN', role: 'Colosso', hue: 262, variant: 3, lore: 'Cada passo seu abala o campo de batalha.' },
  { id: 'loge', name: 'LOGE', role: 'Espreitador', hue: 135, variant: 4, lore: 'Some nas sombras e volta com o que falta.' },
]

export const CHARACTERS = BASE.map(c => ({
  fx: '',
  impact: false,
  burst: false,
  vid: null,
  pos: 'center top',
  ...c,
  img: c.img ?? placeholderArt(c.hue, c.variant),
}))
