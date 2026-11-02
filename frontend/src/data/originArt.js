// Apresentação de cada origem na galeria da criação; as regras continuam vindo do catálogo do back.
// tagline: a descrição breve do cartão. hue: matiz da cor da origem. motes: partículas do destaque
// (spark, petal, feather, snow, hex). img/vid/pos: arte definitiva (como em characters.js); sem elas, entra o sigilo provisório.
// video: vídeo de fundo, levemente escurecido, com os símbolos da origem por cima: src, focus (x do personagem no quadro, 0 a 1,
// para centralizá-lo em qualquer formato de painel), focusNarrow (opcional: x do rosto, usado nos painéis estreitos, que mostram só uma faixa), focusY (opcional), show (opcional: fração mínima da largura do quadro que
// deve aparecer; sem ela o vídeo cobre o painel. As origens não usam show nem focusNarrow: assim o painel só se expande, sem zoom e sem mudar o enquadramento) start (segundo inicial, para pular uma abertura preta) e end (segundo em que o vídeo volta ao start, para cortar um trecho
// sujo; sem ele vai até o fim). O vídeo volta ao start ao terminar.
// living (hoje sem uso): imagem animada por um shader; tem prioridade sobre o video: src, width, height, scene (data/scenes) e focus/focusY, como no vídeo.
import humano from '../assets/origins/humano.mp4'
import minotauro from '../assets/origins/minotauro.mp4'
import construto from '../assets/origins/construto.mp4'
import antroplantae from '../assets/origins/antroplantae.mp4'
import chireano from '../assets/origins/chireano.mp4'
import meioDragao from '../assets/origins/meio-dragao.mp4'
import troll from '../assets/origins/troll.mp4'
import vastaya from '../assets/origins/vastaya.mp4'
import yordle from '../assets/origins/yordle.mp4'
import runinata from '../assets/origins/runinata.mp4'

export const ORIGIN_ART = {
  humano: { tagline: 'A espécie mais numerosa de Runeterra, moldada por cada cultura que a cerca.', hue: 42, motes: 'spark',
    video: { src: humano, focus: 0.71 } },
  minotauro: { tagline: 'Povos tribais de grande vigor, vindos das montanhas da Grande Barreira.', hue: 14, motes: 'spark',
    video: { src: minotauro, focus: 0.7 } },
  construto: { tagline: 'Máquinas que despertaram para a vida e ainda tentam entender o que sentem.', hue: 198, motes: 'hex',
    video: { src: construto, focus: 0.86 } },
  antroplantae: { tagline: 'Plantas sencientes e raras, ligadas à terra, às flores e aos espinhos.', hue: 118, motes: 'petal',
    video: { src: antroplantae, focus: 0.56 } },
  chireano: { tagline: 'Gente-morcego de Zaun: curiosa, ágil, apaixonada por maquinário.', hue: 158, motes: 'hex',
    video: { src: chireano, focus: 0.37 } },
  'meio-dragao': { tagline: 'Herdeiros raríssimos dos dragões elementais, que despertam a cada nível.', hue: 352, motes: 'spark',
    video: { src: meioDragao, focus: 0.58 } },
  troll: { tagline: 'Enormes, grotescos e tribais, com presas à mostra e uma regeneração brutal.', hue: 88, motes: 'snow',
    video: { src: troll, focus: 0.6 } },
  vastaya: { tagline: 'Quimeras de sangue humano e magia espiritual, em sintonia com a natureza.', hue: 286, motes: 'feather',
    video: { src: vastaya, focus: 0.49 } },
  yordle: { tagline: 'Pequenos espíritos de Bandópolis, escondidos sob o véu mágico do Glamour.', hue: 322, motes: 'petal',
    video: { src: yordle, focus: 0.75 } },
  runinata: { tagline: 'Um ser único, nascido das Runas Globais. Cada traço é você quem monta.', hue: 258, motes: 'hex',
    video: { src: runinata, focus: 0.53 } },
}

const DEFAULT_ART = { hue: 42, motes: 'spark' }

// Arte da origem; uma origem nova no catálogo cai no padrão, com a descrição do livro como tagline.
export function originArt(origin) {
  const art = ORIGIN_ART[origin.id] ?? DEFAULT_ART
  return { ...art, tagline: art.tagline ?? origin.description ?? '' }
}
