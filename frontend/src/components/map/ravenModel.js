// Corvo gerado por código. Aponta para +X, com as asas em Y e as costas em +Z.
// Asas e cauda são placas com as penas pintadas numa textura (drawRavenAtlas); o recorte das penas vem do alfa dela.
export const PART = { BODY: 0, WING: 1, TAIL: 2, BEAK: 3, EYE: 4 }

const WING_ROOT = 0.08
const WING_SPAN = 1.7
const WING_LEAD = 0.36
const WING_TRAIL = -0.62
const TAIL_ROOT = -0.5
const TAIL_END = -1.55
const TAIL_HALF = 0.42
const ATLAS_WING = 0.75

// Corpo: x, meia largura, meia altura e altura do centro, do bico ao rabo.
const BODY = [
  [1.52, 0.0, 0.0, 0.03],
  [1.38, 0.03, 0.03, 0.04],
  [1.2, 0.062, 0.066, 0.052],
  [1.06, 0.12, 0.12, 0.07],
  [0.95, 0.158, 0.15, 0.075],
  [0.81, 0.162, 0.152, 0.062],
  [0.66, 0.15, 0.14, 0.04],
  [0.47, 0.205, 0.18, 0.015],
  [0.25, 0.258, 0.222, -0.005],
  [0.02, 0.27, 0.23, -0.015],
  [-0.22, 0.24, 0.195, -0.005],
  [-0.42, 0.17, 0.138, 0.01],
  [-0.58, 0.09, 0.07, 0.02],
  [-0.67, 0.0, 0.0, 0.022],
]
const BEAK_STATIONS = 4
const SIDES = 16

export function buildRaven() {
  const positions = []
  const uvs = []
  const parts = []
  const spans = []
  const vertex = (p, uv, part, span = 0) => {
    positions.push(...p)
    uvs.push(...uv)
    parts.push(part)
    spans.push(span)
  }
  const tri = (a, b, c) => {
    for (const v of [a, b, c]) vertex(...v)
  }
  const quad = (a, b, c, d) => {
    tri(a, b, c)
    tri(a, c, d)
  }

  const ringPoint = ([x, width, height, center], angle) => [x, Math.cos(angle) * width, center + Math.sin(angle) * height]
  for (let s = 0; s < BODY.length - 1; s++) {
    const part = s < BEAK_STATIONS - 1 ? PART.BEAK : PART.BODY
    for (let i = 0; i < SIDES; i++) {
      const a0 = (i / SIDES) * Math.PI * 2
      const a1 = ((i + 1) / SIDES) * Math.PI * 2
      const v = (station, angle) => [ringPoint(BODY[station], angle), [0, 0], part]
      quad(v(s, a0), v(s + 1, a0), v(s + 1, a1), v(s, a1))
    }
  }

  // Olhos em brasa, na lateral da cabeça.
  for (const side of [1, -1]) {
    const [x, width, height, center] = BODY[4]
    const angle = 0.42
    const c = [x + 0.02, side * Math.cos(angle) * width * 1.03, center + Math.sin(angle) * height * 1.03]
    const r = 0.024
    const e = p => [p, [0, 0], PART.EYE]
    quad(e([c[0] + r, c[1], c[2]]), e([c[0], c[1], c[2] + r]), e([c[0] - r, c[1], c[2]]), e([c[0], c[1], c[2] - r]))
  }

  // Placa da asa: grade para dobrar suavemente; o alfa da textura desenha as penas.
  const SPAN_STEPS = 16
  const CHORD_STEPS = 4
  for (const side of [1, -1]) {
    const point = (i, j) => {
      const s = WING_ROOT + (i / SPAN_STEPS) * WING_SPAN
      const x = WING_TRAIL + (j / CHORD_STEPS) * (WING_LEAD - WING_TRAIL)
      const u = ((s - WING_ROOT) / WING_SPAN) * ATLAS_WING
      const v = (x - WING_TRAIL) / (WING_LEAD - WING_TRAIL)
      return [[x, side * s, 0.02], [u, v], PART.WING, side * s]
    }
    for (let i = 0; i < SPAN_STEPS; i++) {
      for (let j = 0; j < CHORD_STEPS; j++) quad(point(i, j), point(i + 1, j), point(i + 1, j + 1), point(i, j + 1))
    }
  }

  // Placa da cauda.
  const TAIL_STEPS = 4
  const tailPoint = (i, j) => {
    const x = TAIL_ROOT + (i / TAIL_STEPS) * (TAIL_END - TAIL_ROOT)
    const y = -TAIL_HALF + (j / TAIL_STEPS) * TAIL_HALF * 2
    const u = ATLAS_WING + ((y + TAIL_HALF) / (TAIL_HALF * 2)) * (1 - ATLAS_WING)
    const v = 1 - (TAIL_ROOT - x) / (TAIL_ROOT - TAIL_END)
    return [[x, y, 0.025], [u, v], PART.TAIL]
  }
  for (let i = 0; i < TAIL_STEPS; i++) {
    for (let j = 0; j < TAIL_STEPS; j++) quad(tailPoint(i, j), tailPoint(i + 1, j), tailPoint(i + 1, j + 1), tailPoint(i, j + 1))
  }

  return { positions, uvs, parts, spans }
}

// Pena: do canhão até a ponta arredondada, com haste clara no meio e borda iridescente.
function feather(g, base, tip, baseWidth, tipWidth, tone = 0) {
  const dx = tip[0] - base[0]
  const dy = tip[1] - base[1]
  const length = Math.hypot(dx, dy)
  const nx = -dy / length
  const ny = dx / length
  const angle = Math.atan2(dy, dx)
  g.beginPath()
  g.moveTo(base[0] + nx * baseWidth / 2, base[1] + ny * baseWidth / 2)
  g.lineTo(tip[0] + nx * tipWidth / 2, tip[1] + ny * tipWidth / 2)
  g.arc(tip[0], tip[1], tipWidth / 2, angle + Math.PI / 2, angle - Math.PI / 2, true)
  g.lineTo(base[0] - nx * baseWidth / 2, base[1] - ny * baseWidth / 2)
  g.closePath()
  const shade = g.createLinearGradient(base[0], base[1], tip[0], tip[1])
  shade.addColorStop(0, `rgb(${13 + tone},${13 + tone},${19 + tone})`)
  shade.addColorStop(1, `rgb(${6 + tone},${6 + tone},${9 + tone})`)
  g.fillStyle = shade
  g.fill()
  g.strokeStyle = 'rgba(70, 68, 108, 0.55)'
  g.lineWidth = 1.6
  g.stroke()
  g.beginPath()
  g.moveTo(base[0], base[1])
  g.lineTo(base[0] + dx * 0.88, base[1] + dy * 0.88)
  g.strokeStyle = 'rgba(92, 90, 130, 0.38)'
  g.lineWidth = 1.2
  g.stroke()
}

// Textura das penas: asa direita vista de cima à esquerda, cauda à direita.
export function drawRavenAtlas(width = 2048) {
  const height = width / 2
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const g = canvas.getContext('2d')
  g.lineJoin = 'round'
  g.lineCap = 'round'
  const wingWidth = width * ATLAS_WING
  // Coordenadas da asa (s ao longo da envergadura, x da frente para trás) em pixels.
  const W = (s, x) => [((s - WING_ROOT) / WING_SPAN) * wingWidth, (1 - (x - WING_TRAIL) / (WING_LEAD - WING_TRAIL)) * height]
  const unit = height / (WING_LEAD - WING_TRAIL)

  // Cada parte fica no seu pedaço da textura: a ponta das penas não pode vazar para a cauda.
  g.save()
  g.beginPath()
  g.rect(0, 0, wingWidth - 4, height)
  g.clip()
  // Rêmiges secundárias, ao longo da borda de trás do braço.
  for (let i = 0; i < 11; i++) {
    const s = 0.1 + i * 0.088
    feather(g, W(s, 0.02), W(s - 0.035, -0.5 + Math.sin(i * 1.7) * 0.015), 0.13 * unit, 0.105 * unit, i % 2 ? 4 : 0)
  }
  // Primárias: os "dedos" abertos da ponta, cada uma com o seu ângulo.
  const primaries = [[1.7, 0.2], [1.75, 0.08], [1.75, -0.05], [1.7, -0.18], [1.61, -0.3], [1.48, -0.4], [1.33, -0.47]]
  primaries.forEach((tip, i) => {
    const base = [1.02 + i * 0.02, 0.16 - i * 0.055]
    feather(g, W(...base), W(...tip), 0.12 * unit, 0.062 * unit, i % 2 ? 0 : 5)
  })

  // Coberteiras: o manto que cobre a base das rêmiges.
  g.beginPath()
  const cover = [[0.08, 0.3], [0.4, 0.37], [0.75, 0.35], [1.0, 0.27], [1.16, 0.16], [1.2, 0.02], [1.04, -0.08], [0.6, -0.13], [0.08, -0.11]]
  cover.forEach((p, i) => (i ? g.lineTo(...W(...p)) : g.moveTo(...W(...p))))
  g.closePath()
  const mantle = g.createLinearGradient(0, W(0, 0.37)[1], 0, W(0, -0.13)[1])
  mantle.addColorStop(0, 'rgb(8, 8, 12)')
  mantle.addColorStop(1, 'rgb(14, 14, 20)')
  g.fillStyle = mantle
  g.fill()
  // Coberteiras das primárias, mais curtas, sobre a mão.
  for (let i = 0; i < 6; i++) {
    feather(g, W(0.98 + i * 0.015, 0.2 - i * 0.05), W(1.32 - i * 0.03, 0.17 - i * 0.07), 0.1 * unit, 0.07 * unit, 6)
  }
  // Fileiras de escamas: as pequenas coberteiras do braço.
  const rows = [[0.25, 0.055, 0.045], [0.13, 0.07, 0.055], [0.0, 0.085, 0.065]]
  rows.forEach(([x, step, radius], row) => {
    for (let s = 0.1; s < 1.05 - row * 0.05; s += step) {
      const [cx, cy] = W(s + (row % 2) * step / 2, x)
      g.beginPath()
      g.arc(cx, cy, radius * unit, 0, Math.PI)
      g.fillStyle = `rgb(${10 + row * 2}, ${10 + row * 2}, ${15 + row * 2})`
      g.fill()
      g.strokeStyle = 'rgba(78, 75, 115, 0.45)'
      g.lineWidth = 1.2
      g.stroke()
    }
  })

  g.restore()
  g.save()
  g.beginPath()
  g.rect(wingWidth + 4, 0, width - wingWidth - 4, height)
  g.clip()
  // Cauda em cunha, como a dos corvos: a pena do meio é a mais longa.
  const T = (x, y) => [wingWidth + ((y + TAIL_HALF) / (TAIL_HALF * 2)) * (width - wingWidth), ((TAIL_ROOT - x) / (TAIL_ROOT - TAIL_END)) * height]
  const tailUnit = (width - wingWidth) / (TAIL_HALF * 2)
  const tails = [-0.27, -0.18, -0.09, 0, 0.09, 0.18, 0.27]
  const ordered = [...tails].sort((a, b) => Math.abs(b) - Math.abs(a))
  for (const y of ordered) {
    const reach = TAIL_END + 0.08 + Math.abs(y) * 0.5
    feather(g, T(TAIL_ROOT - 0.04, y * 0.25), T(reach, y), 0.14 * tailUnit, 0.13 * tailUnit, Math.abs(y) < 0.05 ? 6 : 0)
  }
  feather(g, T(TAIL_ROOT - 0.02, 0), T(TAIL_ROOT - 0.42, 0), 0.32 * tailUnit, 0.2 * tailUnit, 3)
  g.restore()
  return canvas
}
