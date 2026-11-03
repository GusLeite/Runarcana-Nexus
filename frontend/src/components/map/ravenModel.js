// Modelo do corvo, gerado por código. Aponta para +X, com a asa em Y e as costas em +Z.
// tone: 0 penas, 1 bico, 2 olho.
const BODY = [
  // x, raio, altura do centro: do bico ao rabo.
  [1.42, 0.004, 0.02],
  [1.2, 0.035, 0.035],
  [1.04, 0.075, 0.05],
  [0.92, 0.135, 0.06],
  [0.72, 0.155, 0.045],
  [0.48, 0.2, 0.01],
  [0.18, 0.25, -0.02],
  [-0.2, 0.22, -0.01],
  [-0.52, 0.13, 0.01],
  [-0.72, 0.06, 0.02],
]
const BEAK_END = 2
const SIDES = 10

const WING_ARM = [
  // Do ombro à mão: bordo de ataque e de fuga.
  [[0.34, 0.1], [-0.2, 0.1]],
  [[0.46, 0.34], [-0.34, 0.34]],
  [[0.44, 0.62], [-0.36, 0.62]],
  [[0.3, 0.9], [-0.26, 0.92]],
  [[0.2, 1.06], [-0.12, 1.08]],
]
// Penas soltas da ponta da asa: as "mãos" abertas que fazem a silhueta do corvo.
const PRIMARIES = [[0.36, 1.58], [0.2, 1.72], [0.03, 1.76], [-0.13, 1.7], [-0.27, 1.56], [-0.38, 1.38]]
const SECONDARIES = [[-0.42, 0.24], [-0.47, 0.48], [-0.47, 0.72], [-0.42, 0.94]]
const TAIL = [[-1.42, -0.3], [-1.52, -0.17], [-1.56, 0], [-1.52, 0.17], [-1.42, 0.3]]

export function buildRaven() {
  const positions = []
  const tones = []
  const tri = (a, b, c, tone = 0) => {
    positions.push(...a, ...b, ...c)
    tones.push(tone, tone, tone)
  }
  const quad = (a, b, c, d, tone = 0) => {
    tri(a, b, c, tone)
    tri(a, c, d, tone)
  }

  const ring = ([x, radius, lift]) => Array.from({ length: SIDES }, (_, i) => {
    const angle = (i / SIDES) * Math.PI * 2
    return [x, Math.cos(angle) * radius, lift + Math.sin(angle) * radius * 0.82]
  })
  for (let s = 0; s < BODY.length - 1; s++) {
    const front = ring(BODY[s])
    const back = ring(BODY[s + 1])
    for (let i = 0; i < SIDES; i++) {
      const j = (i + 1) % SIDES
      quad(front[i], back[i], back[j], front[j], s < BEAK_END ? 1 : 0)
    }
  }

  // Olhos em brasa, um pouco para fora da cabeça.
  for (const side of [1, -1]) {
    const y = side * 0.128
    tri([1.0, y, 0.09], [0.93, y * 1.04, 0.055], [0.93, y * 1.04, 0.125], 2)
    tri([0.86, y, 0.09], [0.93, y * 1.04, 0.125], [0.93, y * 1.04, 0.055], 2)
  }

  // Cauda em leque, pena por pena.
  const root = [-0.62, 0, 0.015]
  for (let i = 0; i < TAIL.length; i++) {
    const [x, y] = TAIL[i]
    const spread = 0.055
    tri(root, [x, y - spread, -0.012 * i], [x - 0.06, y, -0.012 * i])
    tri(root, [x - 0.06, y, -0.012 * i], [x, y + spread, -0.012 * i])
  }

  // Duas asas, espelhadas em Y.
  for (const side of [1, -1]) {
    const at = ([x, y], z = 0) => [x, y * side, z]
    for (let i = 0; i < WING_ARM.length - 1; i++) {
      const [leadA, trailA] = WING_ARM[i]
      const [leadB, trailB] = WING_ARM[i + 1]
      quad(at(leadA), at(trailA), at(trailB), at(leadB))
    }
    // Penas de trás da asa, em dentes.
    for (let i = 0; i < SECONDARIES.length; i++) {
      const [trailA] = [WING_ARM[i][1]]
      const trailB = WING_ARM[i + 1][1]
      tri(at(trailA, -0.004), at(SECONDARIES[i], -0.008), at(trailB, -0.004))
    }
    const [lead, trail] = WING_ARM[WING_ARM.length - 1]
    PRIMARIES.forEach((tip, i) => {
      const base = t => [lead[0] + (trail[0] - lead[0]) * t, lead[1] + (trail[1] - lead[1]) * t]
      const from = base(i / PRIMARIES.length)
      const to = base((i + 1) / PRIMARIES.length)
      const middle = t => [from[0] + (tip[0] - from[0]) * t, from[1] + (tip[1] - from[1]) * t]
      const belly = [middle(0.55)[0] - 0.04, middle(0.55)[1]]
      quad(at(from), at(to), at(belly), at(middle(0.55)))
      tri(at(middle(0.55)), at(belly), at(tip))
    })
  }
  return { positions, tones }
}
