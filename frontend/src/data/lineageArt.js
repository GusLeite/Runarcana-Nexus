// Imagens das linhagens (vitrine da aba Linhagens do destaque da origem). Basta colocar o arquivo em
// src/assets/lineages/ com o id da linhagem como nome (aelus.webp, troll-gelo.jpg...), sem mexer em código.
// Formatos aceitos: webp, jpg, jpeg e png. Sem imagem, a vitrine mostra um espaço provisório.
const files = import.meta.glob('../assets/lineages/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' })

export const LINEAGE_IMAGES = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop().replace(/\.[^.]+$/, ''), url]),
)

// Enquadramento (object-position) da miniatura que precisa de ajuste; o padrão mostra o centro, um pouco acima.
export const LINEAGE_POS = {
  alnuk: '50% 12%', // imagem quadrada: sobe o recorte para não cortar os chifres
  fulgor: '50% 6%', // imagem vertical: o rosto fica no topo
}

export const lineageImage = id => LINEAGE_IMAGES[id] ?? null
export const lineagePos = id => LINEAGE_POS[id] ?? '50% 30%'
