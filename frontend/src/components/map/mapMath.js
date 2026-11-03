// Regras da câmera do mapa, sem depender do WebGL. Os valores imitam o mapa de Runeterra original.
export const MAP_SIZE = 2048
export const TERRAIN_HEIGHT = 60
export const FOV = 50
export const CAM_INTRO_Z = 2300
export const CAM_FAR_Z = 1189
export const CAM_NEAR_Z = 200
// Inclinação no zoom máximo. O original calcula a sua numa função que não foi localizada; este valor é aproximado.
export const MAX_TILT = 0.85

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// 0 com o mapa inteiro à vista, 1 no zoom máximo. O cubo deixa a câmera reta até chegar bem perto.
export function zoomProgress(z) {
  const t = clamp((z - CAM_NEAR_Z) / (1200 - CAM_NEAR_Z), 0, 1)
  return (1 - t) ** 3
}

export const tiltFor = z => -MAX_TILT * zoomProgress(z)

export const clampZoom = z => clamp(z, CAM_NEAR_Z, CAM_FAR_Z)

// Altura do mundo visível a esta distância, usada no limite de arraste e na conversão de pixels.
export const visibleHeight = z => 2 * Math.tan((FOV / 2) * Math.PI / 180) * z

// Quanto mais perto, mais longe o mapa pode ser arrastado; de longe, ele fica centralizado.
export function clampPan(pan, z, aspect) {
  const height = visibleHeight(z)
  const maxX = Math.max(MAP_SIZE - height * aspect, 0) / 2
  const maxY = Math.max(0.75 * MAP_SIZE - height, 0) / 2
  return { x: clamp(pan.x, -maxX, maxX), y: clamp(pan.y, -maxY, maxY) }
}

// Arrastar: o mapa acompanha o ponteiro na mesma proporção em qualquer zoom.
export const worldPerPixel = (z, clientHeight) => visibleHeight(z) / clientHeight

// Roda do mouse: rolar para cima aproxima. Limita o passo para mouse e trackpad terem ritmo parecido.
export const wheelZoom = (z, deltaY) => clampZoom(z * Math.exp(clamp(deltaY, -100, 100) * 0.001))

// Suavização que dá o mesmo resultado em qualquer taxa de quadros; rate é a fração percorrida a cada 1/60 s.
export const easeFactor = (rate, dt) => 1 - (1 - rate) ** (dt * 60)

// Os brasões das regiões só aparecem com o mapa visto de longe, depois da entrada; de perto eles saem do caminho.
export const crestsVisible = z => {
  const progress = zoomProgress(z)
  return progress > 0 && progress <= 0.32
}

// Leva o ponto do mundo ao centro da tela, ou mais para o lado quando um painel cobre parte dela.
export const focusPan = (x, y, z, aspect, clientHeight, coveredPx = 0) =>
  clampPan({ x: -x - (coveredPx / 2) * worldPerPixel(z, clientHeight), y: -y }, z, aspect)

// Blocos detalhados: grade de 8x8 sobre o mapa, só onde há terra. Numerados da esquerda para a direita, de cima para baixo.
export const TILE_SIZE = MAP_SIZE / 8
export const TILE_IDS = [17, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29, 30, 33, 34, 35, 36, 37, 38, 42, 43, 44, 45, 46, 47, 51, 52, 53]
// Aparecem a partir deste zoom, antes de a imagem geral começar a borrar. O original espera até 0,33.
export const TILE_MIN_PROGRESS = 0.1

export const tileCenter = id => ({
  x: (id % 8 - 3.5) * TILE_SIZE,
  y: (3.5 - Math.floor(id / 8)) * TILE_SIZE,
})

// Só baixa o bloco que está perto da vista; a inclinação revela mais do mapa, daí a folga.
export function tileNearView(id, pan, z, aspect) {
  const center = tileCenter(id)
  const height = visibleHeight(z)
  const reach = Math.max(height, height * aspect) * 1.2 + TILE_SIZE
  return Math.hypot(center.x + pan.x, center.y + pan.y) <= reach
}

export const sineInOut = t => 0.5 - Math.cos(Math.PI * clamp(t, 0, 1)) / 2
