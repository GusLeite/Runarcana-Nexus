// Imagem de ícone de habilidade: o arquivo escolhido pelo mestre vira um quadrado 128x128
// (recorte central, como os ícones do LoL) em WebP, para caber leve no banco (~10-20 KB).

export const ICON_SIZE = 128
export const MAX_FILE_BYTES = 8 * 1024 * 1024
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

// Mensagem de erro em PT, ou null se o arquivo serve.
export function validateIconFile(file) {
  if (!file) return 'Escolha uma imagem.'
  if (!TYPES.includes(file.type)) return 'Use uma imagem PNG, JPG, WebP ou GIF.'
  if (file.size > MAX_FILE_BYTES) return 'A imagem passa de 8 MB. Escolha uma menor.'
  return null
}

// Link colado: só http(s), sem espaços (o back confere o mesmo).
export const isIconLink = value => /^https?:\/\/\S+$/.test(value ?? '')

// Lado e posição do recorte quadrado central de uma imagem w x h.
export function coverCrop(w, h) {
  const side = Math.min(w, h)
  return { sx: (w - side) / 2, sy: (h - side) / 2, side }
}

// Tamanho final de uma imagem w x h que cabe em max de largura, sem aumentar.
export function fitWidth(w, h, max) {
  const scale = Math.min(max / w, 1)
  return { width: Math.round(w * scale), height: Math.round(h * scale) }
}

const openImage = url => new Promise((resolve, reject) => {
  const el = new Image()
  el.onload = () => resolve(el)
  el.onerror = () => reject(new Error('Não foi possível abrir essa imagem.'))
  el.src = url
})

// Imagem do topo da loja do mercador: mantém a proporção e reduz para caber leve no banco.
export async function fileToBanner(file, maxWidth = 1600) {
  const error = validateIconFile(file)
  if (error) throw new Error(error)

  const url = URL.createObjectURL(file)
  try {
    const img = await openImage(url)
    const { width, height } = fitWidth(img.naturalWidth, img.naturalHeight, maxWidth)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/webp', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function fileToIcon(file, size = ICON_SIZE) {
  const error = validateIconFile(file)
  if (error) throw new Error(error)

  const url = URL.createObjectURL(file)
  try {
    const img = await openImage(url)
    const { sx, sy, side } = coverCrop(img.naturalWidth, img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
    // Navegador sem WebP devolve PNG; os dois são aceitos pelo back.
    return canvas.toDataURL('image/webp', 0.9)
  } finally {
    URL.revokeObjectURL(url)
  }
}
