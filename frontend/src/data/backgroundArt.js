import andarilho from '../assets/backgrounds/andarilho.webp'

// Símbolo de cada passado, por id, em traços num viewBox 100×100, como o `SUBCLASS_SIGILS` de subclassArt.js.
// Um passado novo no catálogo cai no símbolo genérico (backgroundSigil); o teste backgroundArt.test.js avisa quando falta um.
export const BACKGROUND_SIGILS = {
  andarilho: ['M8 80 34 38 50 62 62 46 92 80Z', 'M72 22a8 8 0 1 0 .01 0'],
  apostador: ['M18 18H82V82H18Z', 'M34 34h.1M66 34h.1M50 50h.1M34 66h.1M66 66h.1'],
  aristocrata: ['M14 78H86', 'M14 78 8 30 34 50 50 20 66 50 92 30 86 78Z'],
  artesao: ['M16 40H78C74 50 66 52 58 52V68H68V80H32V68H42V52C34 52 24 50 16 40Z', 'M74 14 78 24 88 28 78 32 74 42 70 32 60 28 70 24Z'],
  artista: ['M38 74V20L78 12V66', 'M38 74a10 8 0 1 1-.01 0M78 66a10 8 0 1 1-.01 0'],
  charlatao: ['M10 78H90', 'M28 78V30H72V78', 'M28 62H72', 'M28 30Q50 22 72 30'],
  criacao: ['M24 30H76V74H24Z', 'M50 30V16M44 16H56', 'M38 48h.1M62 48h.1', 'M38 62H62', 'M12 46V58M88 46V58'],
  criminoso: ['M50 10C28 10 18 34 22 56L10 90H90L78 56C82 34 72 10 50 10Z', 'M36 48C42 40 58 40 64 48 58 62 42 62 36 48Z'],
  desconhecido: ['M34 34C34 12 72 12 70 36 68 54 50 54 50 68', 'M50 86h.1'],
  estudioso: ['M50 24C36 14 20 14 8 20V78C20 72 36 72 50 82 64 72 80 72 92 78V20C80 14 64 14 50 24Z', 'M50 24V82'],
  exilado: ['M14 14H46V86H14Z', 'M56 50H90M78 38 90 50 78 62'],
  forasteiro: ['M50 8 74 40H62L82 66H18L38 40H26Z', 'M50 66V92'],
  gladiador: ['M18 62C18 34 34 16 50 16 66 16 82 34 82 62V84H18Z', 'M30 52H70', 'M50 16V52', 'M50 64V84'],
  'heroi-local': ['M50 8 61 38 92 38 67 57 77 88 50 69 23 88 33 57 8 38 39 38Z'],
  inventor: ['M50 10C30 10 20 26 24 42 26 52 36 58 38 68H62C64 58 74 52 76 42 80 26 70 10 50 10Z', 'M40 78H60M44 88H56'],
  investigador: ['M42 14a28 28 0 1 0 .01 0', 'M62 62 88 88'],
  marujo: ['M50 14a6 6 0 1 0 .01 0', 'M50 22V88', 'M32 38H68', 'M16 58C18 80 34 90 50 90 66 90 82 80 84 58', 'M10 66l6-8 8 8M76 66l8-8 8 8'],
  mercenario: ['M50 8a42 42 0 1 0 .01 0', 'M50 22V66', 'M38 60H62', 'M50 66V80', 'M45 30h10'],
  orfao: ['M50 88C20 66 10 46 10 32 10 18 22 10 32 10 42 10 48 16 50 24 52 16 58 10 68 10 78 10 90 18 90 32 90 46 80 66 50 88Z', 'M50 24 44 40 56 52 48 70'],
  pirata: ['M50 14C30 14 20 28 20 44 20 54 26 60 32 64V76H68V64C74 60 80 54 80 44 80 28 70 14 50 14Z', 'M38 46a5 5 0 1 0 .01 0M62 46a5 5 0 1 0 .01 0', 'M44 76V64M56 76V64', 'M12 90 40 80M88 90 60 80'],
  religioso: ['M50 56V92', 'M28 72H72', 'M50 56C32 56 32 12 50 12 68 12 68 56 50 56Z'],
  soldado: ['M30 8 46 40M70 8 54 40', 'M50 52a22 22 0 1 0 .01 0', 'M50 58 53 66 62 66 55 71 58 80 50 75 42 80 45 71 38 66 47 66Z'],
}

const GENERIC = ['M50 8 88 30V70L50 92 12 70V30Z', 'M50 34a16 16 0 1 0 .01 0']

export function backgroundSigil(background) {
  return BACKGROUND_SIGILS[background?.id] ?? GENERIC
}

// Ilustração de destaque do painel de detalhe, por id; só alguns passados têm (os demais mostram só o símbolo).
export const BACKGROUND_IMAGES = { andarilho }

export function backgroundImage(background) {
  return BACKGROUND_IMAGES[background?.id]
}
