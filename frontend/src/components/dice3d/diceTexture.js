// Textura de cada dado: um atlas com uma célula por face, obsidiana com filete dourado e o número gravado em ouro
// (Cinzel). faceLayout calcula onde cada face cai na célula (e os UVs da geometria); drawAtlas pinta os números
// já trocados (relabel) e, se for o caso, a rachadura da falha crítica.
import { diceShape } from './diceShapes.js'

export const CELL = 128

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = a => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l] }

// Tamanho do número por dado (fração da célula): faces triangulares têm menos espaço que quadrados e pentágonos.
const FONT = { 4: 0.2, 6: 0.46, 8: 0.36, 10: 0.3, 12: 0.38, 20: 0.34 }
// Nas pipas do d10 o centro visual fica mais perto da ponta larga.
const NUDGE = { 10: 0.12 }

// Para cada face: a célula do atlas e os pontos 2D (em pixels do canvas) de cada vértice, com o "para cima"
// apontando para o 1º vértice da face.
export function faceLayout(sides) {
  const shape = diceShape(sides)
  const cols = Math.ceil(Math.sqrt(shape.faces.length))
  const rows = Math.ceil(shape.faces.length / cols)
  const faces = shape.faces.map((face, i) => {
    const pts = face.map(k => shape.vertices[k])
    const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0])
    const n = shape.normals[i]
    const up = norm(sub(pts[0], c))
    const right = cross(up, n)
    const flat = pts.map(p => { const d = sub(p, c); return [dot(d, right), dot(d, up)] })
    const r = Math.max(...flat.map(([x, y]) => Math.hypot(x, y)))
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = col * CELL + CELL / 2
    const cy = row * CELL + CELL / 2
    const k = (CELL / 2) * 0.94
    return { cx, cy, points: flat.map(([x, y]) => [cx + (x / r) * k, cy - (y / r) * k]) }
  })
  return { width: cols * CELL, height: rows * CELL, faces }
}

const SIX_NINE = new Set([6, 9])

// labels: número por face (ou por vértice, no d4). opts.hidden: "?" no lugar dos números; opts.cracked: face rachada.
export function drawAtlas(ctx, sides, labels, { hidden = false, cracked = null } = {}) {
  const shape = diceShape(sides)
  const layout = faceLayout(sides)
  ctx.canvas.width = layout.width
  ctx.canvas.height = layout.height
  ctx.fillStyle = '#05070c'
  ctx.fillRect(0, 0, layout.width, layout.height)
  layout.faces.forEach((f, i) => {
    // Pinta um pouco além da face, para a borda não vazar o fundo da célula vizinha.
    ctx.save()
    const grad = ctx.createRadialGradient(f.cx, f.cy - CELL * 0.15, 4, f.cx, f.cy, CELL * 0.62)
    grad.addColorStop(0, hidden ? '#2a1d3f' : '#1c2333')
    grad.addColorStop(1, hidden ? '#0d0816' : '#080b12')
    ctx.fillStyle = grad
    ctx.fillRect(f.cx - CELL / 2, f.cy - CELL / 2, CELL, CELL)
    // filete dourado por dentro da borda da face
    ctx.beginPath()
    f.points.forEach(([x, y], j) => {
      const ix = f.cx + (x - f.cx) * 0.9
      const iy = f.cy + (y - f.cy) * 0.9
      if (j === 0) ctx.moveTo(ix, iy)
      else ctx.lineTo(ix, iy)
    })
    ctx.closePath()
    ctx.strokeStyle = hidden ? 'rgba(199,166,255,.55)' : 'rgba(200,162,74,.75)'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.restore()

    if (shape.perVertex) {
      // d4: em cada canto, o número do vértice daquele canto, com o topo apontando para ele.
      shape.faces[i].forEach((vertex, j) => {
        const [px, py] = f.points[j]
        const x = f.cx + (px - f.cx) * 0.56
        const y = f.cy + (py - f.cy) * 0.56
        number(ctx, hidden ? '?' : String(labels[vertex]), x, y, Math.atan2(px - f.cx, -(py - f.cy)), CELL * FONT[sides], false, hidden)
      })
    } else {
      const [px, py] = f.points[0]
      const nudge = NUDGE[sides] ?? 0
      const x = f.cx + (px - f.cx) * nudge
      const y = f.cy + (py - f.cy) * nudge
      const value = labels[i]
      number(ctx, hidden ? '?' : String(value), x, y, 0, CELL * FONT[sides], !hidden && sides >= 8 && SIX_NINE.has(value), hidden)
    }
    if (cracked === i) crack(ctx, f)
  })
  return layout
}

function number(ctx, text, x, y, angle, size, underline, hidden) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.font = `700 ${Math.round(size)}px Cinzel, Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(2, size * 0.08)
  ctx.strokeStyle = 'rgba(0,0,0,.85)'
  ctx.strokeText(text, 0, 0)
  const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2)
  g.addColorStop(0, hidden ? '#e7d6ff' : '#ffe9a8')
  g.addColorStop(1, hidden ? '#9a72e0' : '#c8902f')
  ctx.fillStyle = g
  ctx.shadowColor = hidden ? 'rgba(170,120,255,.7)' : 'rgba(240,199,94,.55)'
  ctx.shadowBlur = size * 0.25
  ctx.fillText(text, 0, 0)
  if (underline) ctx.fillRect(-size * 0.22, size * 0.42, size * 0.44, Math.max(2, size * 0.07))
  ctx.restore()
}

// Rachadura da falha crítica: linhas quebradas saindo do centro, vermelhas com brilho.
function crack(ctx, f) {
  ctx.save()
  ctx.strokeStyle = '#ff4a3a'
  ctx.shadowColor = 'rgba(255,60,40,.9)'
  ctx.shadowBlur = 8
  ctx.lineWidth = 2.2
  let seed = 7
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  for (let b = 0; b < 5; b++) {
    let angle = (b / 5) * Math.PI * 2 + rnd() * 0.6
    let x = f.cx
    let y = f.cy
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let s = 0; s < 4; s++) {
      angle += (rnd() - 0.5) * 0.9
      const step = CELL * (0.08 + rnd() * 0.06)
      x += Math.cos(angle) * step
      y += Math.sin(angle) * step
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
}
