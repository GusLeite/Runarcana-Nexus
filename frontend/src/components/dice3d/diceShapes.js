// Formas dos dados 3D (d4, d6, d8, d10, d12, d20): vértices, faces (índices em volta da face, virados para fora),
// normais e o número de cada face. Funções puras: a cena (diceScene.js) e os testes usam as mesmas.
//
// Como o dado cai no valor do servidor: a física roda primeiro (sem desenhar), vê qual face ficou para cima
// (upFace) e troca o número dessa face com o da face que tinha o valor sorteado (relabel). Só então o dado é
// desenhado e o lançamento gravado é reproduzido: o número certo aparece na face de cima, sem truque visível.
// No d4 o valor é o do vértice de cima (cada face mostra o número de cada canto), então a troca é por vértice.

const PHI = (1 + Math.sqrt(5)) / 2

export const DICE_SIDES = [4, 6, 8, 10, 12, 20]
export const supportsSides = sides => DICE_SIDES.includes(sides)

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const len = a => Math.sqrt(dot(a, a))
const norm = a => { const l = len(a); return [a[0] / l, a[1] / l, a[2] / l] }
const centroidOf = pts => pts.reduce((c, p) => [c[0] + p[0] / pts.length, c[1] + p[1] / pts.length, c[2] + p[2] / pts.length], [0, 0, 0])

// Face de um sólido convexo pela direção da normal: os vértices mais distantes nessa direção, em volta do centro.
function facesFromNormals(vertices, normals) {
  return normals.map(n => {
    const dir = norm(n)
    const top = Math.max(...vertices.map(v => dot(v, dir)))
    const ids = vertices.map((v, i) => i).filter(i => Math.abs(dot(vertices[i], dir) - top) < 1e-6)
    return orderAround(vertices, ids, dir)
  })
}

// Ordena os vértices da face em volta do centro, no sentido que deixa a normal para fora (anti-horário visto de fora).
function orderAround(vertices, ids, outward) {
  const c = centroidOf(ids.map(i => vertices[i]))
  const u = norm(sub(vertices[ids[0]], c))
  const w = cross(outward, u)
  return [...ids].sort((a, b) => {
    const pa = sub(vertices[a], c)
    const pb = sub(vertices[b], c)
    return Math.atan2(dot(pa, w), dot(pa, u)) - Math.atan2(dot(pb, w), dot(pb, u))
  })
}

function signs(n) {
  // todas as combinações de ± para n coordenadas
  return Array.from({ length: 2 ** n }, (_, k) => Array.from({ length: n }, (_, i) => ((k >> i) & 1 ? -1 : 1)))
}

function cube() {
  const vertices = signs(3).map(s => [s[0], s[1], s[2]])
  const normals = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  return { vertices, faces: facesFromNormals(vertices, normals) }
}

function octahedron() {
  const vertices = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  return { vertices, faces: facesFromNormals(vertices, signs(3)) }
}

function tetrahedron() {
  const vertices = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]
  return { vertices, faces: facesFromNormals(vertices, vertices.map(v => [-v[0], -v[1], -v[2]])) }
}

const icosaPoints = () => signs(2).flatMap(([a, b]) => [[0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]])
const dodecaPoints = () => [
  ...signs(3),
  ...signs(2).flatMap(([a, b]) => [[0, a * PHI, b / PHI], [a / PHI, 0, b * PHI], [a * PHI, b / PHI, 0]]),
]

function icosahedron() {
  const vertices = icosaPoints()
  return { vertices, faces: facesFromNormals(vertices, dodecaPoints()) }
}

function dodecahedron() {
  const vertices = dodecaPoints()
  return { vertices, faces: facesFromNormals(vertices, icosaPoints()) }
}

// d10: trapezoedro pentagonal. Anel de 10 vértices alternando altura ±h e dois ápices em ±H, com
// H = h·(1+cos36°)/(1−cos36°) para as pipas serem planas.
function trapezohedron() {
  const h = 0.105
  const c = Math.cos(Math.PI / 5)
  const H = (h * (1 + c)) / (1 - c)
  const ring = Array.from({ length: 10 }, (_, k) => [Math.cos((k * Math.PI) / 5), k % 2 === 0 ? h : -h, Math.sin((k * Math.PI) / 5)])
  const vertices = [...ring, [0, H, 0], [0, -H, 0]]
  const T = 10
  const B = 11
  const at = k => ((k % 10) + 10) % 10
  const faces = []
  for (let k = 0; k < 10; k += 2) faces.push([T, at(k), at(k + 1), at(k + 2)])
  for (let k = 1; k < 10; k += 2) faces.push([B, at(k), at(k + 1), at(k + 2)])
  return { vertices, faces: faces.map(f => outward(vertices, f)) }
}

function outward(vertices, face) {
  const [a, b, c] = face.map(i => vertices[i])
  const n = cross(sub(b, a), sub(c, a))
  return dot(n, centroidOf(face.map(i => vertices[i]))) >= 0 ? face : [...face].reverse()
}

const BUILDERS = { 4: tetrahedron, 6: cube, 8: octahedron, 10: trapezohedron, 12: dodecahedron, 20: icosahedron }
const cache = new Map()

// Forma normalizada (raio 1). labels: número de cada face (no d4, de cada vértice), de 1 a sides.
export function diceShape(sides) {
  if (!cache.has(sides)) {
    const build = BUILDERS[sides]
    if (!build) throw new Error('Dado sem forma 3D: d' + sides)
    const raw = build()
    const radius = Math.max(...raw.vertices.map(len))
    const vertices = raw.vertices.map(v => v.map(x => x / radius))
    const faces = raw.faces
    const normals = faces.map(f => {
      const [a, b, c] = f.map(i => vertices[i])
      return norm(cross(sub(b, a), sub(c, a)))
    })
    cache.set(sides, { sides, vertices, faces, normals, perVertex: sides === 4 })
  }
  const shape = cache.get(sides)
  const count = shape.perVertex ? shape.vertices.length : shape.faces.length
  return { ...shape, labels: Array.from({ length: count }, (_, i) => i + 1) }
}

// Rotaciona um vetor por um quatérnio {x, y, z, w}.
export function rotate(q, v) {
  const u = [q.x, q.y, q.z]
  const t = cross(u, v).map(x => 2 * x)
  const ut = cross(u, t)
  return [v[0] + q.w * t[0] + ut[0], v[1] + q.w * t[1] + ut[1], v[2] + q.w * t[2] + ut[2]]
}

// Índice do que ficou para cima (+Y) com o dado girado por q: a face (ou, no d4, o vértice).
export function upIndex(shape, q) {
  const items = shape.perVertex ? shape.vertices : shape.normals
  let best = 0
  let bestY = -Infinity
  items.forEach((v, i) => {
    const y = rotate(q, v)[1]
    if (y > bestY) { bestY = y; best = i }
  })
  return best
}

// Troca os números para que o índice que ficou para cima mostre target.
export function relabel(labels, up, target) {
  const next = [...labels]
  const at = next.indexOf(target)
  if (at < 0) throw new Error('Valor fora do dado: ' + target)
  ;[next[up], next[at]] = [next[at], next[up]]
  return next
}
