// Apresentação de cada classe no salão da criação; as regras continuam vindo do catálogo do back.
// Mesmos campos de originArt.js (tagline, hue, motes, video { src, focus }); sigil: traços do sigilo (viewBox 100×100).
// Os vídeos são loops de até 10 s, sem áudio, em no máximo 1080p/30 fps (ver docs/frontend.md).
import acolyte from '../assets/classes/acolyte.mp4'
import arcanist from '../assets/classes/arcanist.mp4'
import marksman from '../assets/classes/marksman.mp4'
import bodhisattva from '../assets/classes/bodhisattva.mp4'
import brute from '../assets/classes/brute.mp4'
import hunter from '../assets/classes/hunter.mp4'
import fighter from '../assets/classes/fighter.mp4'
import mercurial from '../assets/classes/mercurial.mp4'
import shaman from '../assets/classes/shaman.mp4'

export const CLASS_ART = {
  ACOLYTE: { tagline: 'Canalizam o mundo espiritual pela fé: curam, protegem e julgam.', hue: 165, motes: 'spark',
    sigil: ['M50 8a13 13 0 1 0 .01 0', 'M50 36V92M28 56H72', 'M36 92H64'],
    video: { src: acolyte, focus: 0.68 } },
  ARCANIST: { tagline: 'A mana aflora com violência e eles aprendem a dobrá-la, em magia Celestial, Elemental ou Espiritual.', hue: 255, motes: 'hex',
    sigil: ['M50 6 60 38 94 38 66 58 77 92 50 72 23 92 34 58 6 38 40 38Z', 'M50 34a16 16 0 1 0 .01 0'],
    video: { src: arcanist, focus: 0.66 } },
  MARKSMAN: { tagline: 'A classe mais nova de Runeterra: armas de fogo, mira firme e a essência de Runas.', hue: 285, motes: 'spark',
    sigil: ['M50 12a38 38 0 1 0 .01 0', 'M50 2V28M50 72V98M2 50H28M72 50H98', 'M50 46a4 4 0 1 0 .01 0'],
    video: { src: marksman, focus: 0.57 } },
  BODHISATTVA: { tagline: 'Aprimoram o corpo e o espírito pelo Ki, a energia que liga a carne à magia.', hue: 350, motes: 'petal',
    sigil: ['M50 88C34 78 24 60 28 38 42 46 49 62 50 88Z', 'M50 88C66 78 76 60 72 38 58 46 51 62 50 88Z', 'M50 88C40 64 40 36 50 12 60 36 60 64 50 88Z'],
    video: { src: bodhisattva, focus: 0.62 } },
  BRUTE: { tagline: 'Força sobrenatural e resistência rara: a anima primitiva aflora e esmaga o que estiver à frente.', hue: 28, motes: 'spark',
    sigil: ['M22 14 40 50 26 88', 'M50 8 60 50 50 94', 'M78 14 60 50 74 88'],
    video: { src: brute, focus: 0.42 } },
  HUNTER: { tagline: 'Rastreiam e abatem, ou capturam, a presa, quase sempre ao lado de um companheiro.', hue: 245, motes: 'feather',
    sigil: ['M30 10C74 30 74 70 30 90Z', 'M16 50H88M78 40 88 50 78 60'],
    video: { src: hunter, focus: 0.58 } },
  FIGHTER: { tagline: 'Veteranos de combate e de estratégia, o esteio dos exércitos de Runeterra.', hue: 8, motes: 'spark',
    sigil: ['M50 6 60 20V62H40V20Z', 'M26 62H74', 'M50 62V92M42 92H58'],
    video: { src: fighter, focus: 0.65 } },
  MERCURIAL: { tagline: 'Ladrões, espiões, assassinos e diplomatas: astúcia, ardis e o golpe certo.', hue: 205, motes: 'snow',
    sigil: ['M20 16 70 66M80 16 30 66', 'M16 12 28 16 24 28ZM84 12 72 16 76 28Z', 'M50 56 66 78 50 94 34 78Z'],
    video: { src: mercurial, focus: 0.6 } },
  SHAMAN: { tagline: 'Veem o mundo material e o espiritual entrelaçados e pedem ajuda aos espíritos.', hue: 32, motes: 'spark',
    sigil: ['M50 8C72 34 76 52 63 72 56 82 44 82 37 72 24 52 40 42 50 8Z', 'M50 92V54M50 70 38 58M50 70 62 58'],
    video: { src: shaman, focus: 0.5 } },
}

const DEFAULT_ART = { hue: 42, motes: 'spark' }

// Arte da classe; uma classe nova no catálogo cai no padrão, com a descrição do livro (primeiro parágrafo) como tagline.
export function classArt(klass) {
  const art = CLASS_ART[klass.id] ?? DEFAULT_ART
  return { ...art, tagline: art.tagline ?? klass.description?.split('\n')[0] ?? '' }
}
