// Apresentação de cada região no carrossel da criação; as regras continuam vindo do catálogo do back.
// tagline: a descrição breve (o catálogo ainda não tem descrição de região). hue: matiz da cor da região.
// video: loop de fundo. img: quadro inicial do vídeo (aparece enquanto ele carrega e na miniatura) ou, sem vídeo, a arte da região,
// que ganha um zoom lento. pos: object-position (opcional).
import bilgewaterVid from '../assets/regions/bilgewater.mp4'
import bilgewaterImg from '../assets/regions/bilgewater.webp'
import bandleVid from '../assets/regions/bandle-city.mp4'
import bandleImg from '../assets/regions/bandle-city.webp'
import demaciaVid from '../assets/regions/demacia.mp4'
import demaciaImg from '../assets/regions/demacia.webp'
import freljordVid from '../assets/regions/freljord.mp4'
import freljordImg from '../assets/regions/freljord.webp'
import shadowVid from '../assets/regions/shadow-isles.mp4'
import shadowImg from '../assets/regions/shadow-isles.webp'
import ioniaVid from '../assets/regions/ionia.mp4'
import ioniaImg from '../assets/regions/ionia.webp'
import ixtalVid from '../assets/regions/ixtal.mp4'
import ixtalImg from '../assets/regions/ixtal.webp'
import noxusVid from '../assets/regions/noxus.mp4'
import noxusImg from '../assets/regions/noxus.webp'
import nazumahImg from '../assets/regions/nazumah.webp'
import piltoverVid from '../assets/regions/piltover.mp4'
import piltoverImg from '../assets/regions/piltover.webp'
import shurimaVid from '../assets/regions/shurima.mp4'
import shurimaImg from '../assets/regions/shurima.webp'
import targonVid from '../assets/regions/targon.mp4'
import targonImg from '../assets/regions/targon.webp'
import voidImg from '../assets/regions/void.webp'
import zaunVid from '../assets/regions/zaun.mp4'
import zaunImg from '../assets/regions/zaun.webp'

export const REGION_ART = {
  BILGEWATER: { tagline: 'Porto de piratas e caçadores de monstros, onde tudo tem preço e nada dura muito.', hue: 165, video: bilgewaterVid, img: bilgewaterImg },
  BANDLE_CITY: { tagline: 'O lar colorido dos yordles, escondido entre o mundo material e o espiritual.', hue: 322, video: bandleVid, img: bandleImg },
  DEMACIA: { tagline: 'Reino de honra e aço petricite, orgulhoso da sua justiça e desconfiado da magia.', hue: 42, video: demaciaVid, img: demaciaImg },
  FRELJORD: { tagline: 'Terras de gelo eterno, disputadas por tribos guerreiras e por poderes antigos.', hue: 205, video: freljordVid, img: freljordImg },
  SHADOW_ISLES: { tagline: 'Ilhas devastadas pela Ruína, onde a Névoa Negra aprisiona os mortos.', hue: 175, video: shadowVid, img: shadowImg },
  IONIA: { tagline: 'As Primeiras Terras: magia, natureza e espírito em busca de equilíbrio.', hue: 335, video: ioniaVid, img: ioniaImg },
  IXTAL: { tagline: 'Reino oculto na selva, mestre da magia elemental e fechado para o mundo.', hue: 130, video: ixtalVid, img: ixtalImg },
  NOXUS: { tagline: 'Império implacável em que a força abre todas as portas, seja qual for a sua origem.', hue: 0, video: noxusVid, img: noxusImg },
  NAZUMAH: { tagline: 'Cidade-oásis de Shurima, de velas coloridas e águas que desafiam o deserto.', hue: 160, img: nazumahImg },
  PILTOVER: { tagline: 'A Cidade do Progresso, movida a comércio, invenção e tecnologia hextec.', hue: 45, video: piltoverVid, img: piltoverImg },
  SHURIMA: { tagline: 'Um império solar em ruínas, cujas areias guardam tesouros e deuses esquecidos.', hue: 32, video: shurimaVid, img: shurimaImg },
  TARGON: { tagline: 'A montanha que toca as estrelas, cuja escalada transforma quem chega ao topo.', hue: 230, video: targonVid, img: targonImg },
  VOID: { tagline: 'O nada que existe além da realidade, faminto por tudo o que há em Runeterra.', hue: 295, img: voidImg },
  ZAUN: { tagline: 'A cidade subterrânea sob Piltover, feita de químicos, ousadia e sobrevivência.', hue: 110, video: zaunVid, img: zaunImg },
}

const DEFAULT_ART = { hue: 42 }

// Arte da região; uma região nova no catálogo cai no padrão, com a descrição do livro como tagline.
export function regionArt(region) {
  const art = REGION_ART[region.id] ?? DEFAULT_ART
  return { ...art, tagline: region.description ?? art.tagline ?? '' }
}

// Passo do carrossel: dá a volta nas pontas.
export const wrapIndex = (index, length) => (index % length + length) % length
