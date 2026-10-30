// Apresentação de cada origem na galeria da criação; as regras continuam vindo do catálogo do back.
// tagline: a descrição breve do cartão. hue: matiz da cor da origem. motes: partículas do destaque
// (spark, petal, feather, snow, hex). img/vid/pos: arte definitiva (como em characters.js); sem elas, entra o sigilo provisório.
// vids: vários vídeos que se alternam com fusão; cada um com focus (x do personagem no quadro, 0 a 1, para centralizá-lo
// em qualquer formato de painel), focusY (opcional) e hold (segundos em cena, repetindo se o vídeo for curto).
import yasuo from '../assets/origins/humano-yasuo.mp4'
import garen from '../assets/origins/humano-garen.mp4'
import caitlyn from '../assets/origins/humano-caitlyn.mp4'

export const ORIGIN_ART = {
  humano: { tagline: 'A espécie mais numerosa de Runeterra, moldada por cada cultura que a cerca.', hue: 42, motes: 'spark',
    vids: [
      { src: yasuo, focus: 0.75, hold: 14 },
      { src: garen, focus: 0.68, hold: 9.6 },
      { src: caitlyn, focus: 0.56, hold: 15 },
    ] },
  minotauro: { tagline: 'Povos tribais de grande vigor, vindos das montanhas da Grande Barreira.', hue: 14, motes: 'spark' },
  construto: { tagline: 'Máquinas que despertaram para a vida e ainda tentam entender o que sentem.', hue: 198, motes: 'hex' },
  antroplantae: { tagline: 'Plantas sencientes e raras, ligadas à terra, às flores e aos espinhos.', hue: 118, motes: 'petal' },
  chireano: { tagline: 'Gente-morcego de Zaun: curiosa, ágil, apaixonada por maquinário.', hue: 158, motes: 'hex' },
  'meio-dragao': { tagline: 'Herdeiros raríssimos dos dragões elementais, que despertam a cada nível.', hue: 352, motes: 'spark' },
  troll: { tagline: 'Enormes, grotescos e tribais, com presas à mostra e uma regeneração brutal.', hue: 88, motes: 'snow' },
  vastaya: { tagline: 'Quimeras de sangue humano e magia espiritual, em sintonia com a natureza.', hue: 286, motes: 'feather' },
  yordle: { tagline: 'Pequenos espíritos de Bandópolis, escondidos sob o véu mágico do Glamour.', hue: 322, motes: 'petal' },
  runinata: { tagline: 'Um ser único, nascido das Runas Globais. Cada traço é você quem monta.', hue: 258, motes: 'hex' },
}

const DEFAULT_ART = { hue: 42, motes: 'spark' }

// Arte da origem; uma origem nova no catálogo cai no padrão, com a descrição do livro como tagline.
export function originArt(origin) {
  const art = ORIGIN_ART[origin.id] ?? DEFAULT_ART
  return { ...art, tagline: art.tagline ?? origin.description ?? '' }
}
