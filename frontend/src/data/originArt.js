// Apresentação de cada origem na galeria da criação; as regras continuam vindo do catálogo do back.
// tagline: a descrição breve do cartão. hue: matiz da cor da origem. motes: partículas do destaque
// (spark, petal, feather, snow, hex). img/vid/pos: arte definitiva (como em characters.js); sem elas, entra o sigilo provisório.
// video: vídeo de fundo, levemente escurecido, com os símbolos da origem por cima: src, focus (x do personagem no quadro, 0 a 1,
// para centralizá-lo em qualquer formato de painel), focusNarrow (opcional: x do rosto, usado nos painéis estreitos, que mostram só uma faixa), focusY (opcional), show (opcional: fração mínima da largura do quadro que
// deve aparecer; sem ela o vídeo cobre o painel, o que num painel em pé vira um close) e start (segundo inicial, para pular uma abertura preta;
// o vídeo volta a ele ao terminar).
// living (hoje sem uso): imagem animada por um shader; tem prioridade sobre o video: src, width, height, scene (data/scenes) e focus/focusY, como no vídeo.
import humano from '../assets/origins/humano.mp4'
import minotauro from '../assets/origins/minotauro.mp4'
import construto from '../assets/origins/construto.mp4'
import antroplantae from '../assets/origins/antroplantae.mp4'
import chireano from '../assets/origins/chireano.mp4'
import meioDragao from '../assets/origins/meio-dragao.mp4'

export const ORIGIN_ART = {
  humano: { tagline: 'A espécie mais numerosa de Runeterra, moldada por cada cultura que a cerca.', hue: 42, motes: 'spark',
    video: { src: humano, focus: 0.71, start: 1 } },
  minotauro: { tagline: 'Povos tribais de grande vigor, vindos das montanhas da Grande Barreira.', hue: 14, motes: 'spark',
    video: { src: minotauro, focus: 0.7, show: 0.62 } },
  construto: { tagline: 'Máquinas que despertaram para a vida e ainda tentam entender o que sentem.', hue: 198, motes: 'hex',
    video: { src: construto, focus: 0.66, focusNarrow: 0.86, show: 0.62 } },
  antroplantae: { tagline: 'Plantas sencientes e raras, ligadas à terra, às flores e aos espinhos.', hue: 118, motes: 'petal',
    video: { src: antroplantae, focus: 0.6, focusNarrow: 0.56, show: 0.62 } },
  chireano: { tagline: 'Gente-morcego de Zaun: curiosa, ágil, apaixonada por maquinário.', hue: 158, motes: 'hex',
    video: { src: chireano, focus: 0.4, focusNarrow: 0.37, show: 0.62 } },
  'meio-dragao': { tagline: 'Herdeiros raríssimos dos dragões elementais, que despertam a cada nível.', hue: 352, motes: 'spark',
    video: { src: meioDragao, focus: 0.58, show: 0.5 } },
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
