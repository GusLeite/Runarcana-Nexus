// Moldura de Piltover e Zaun desenhada por código: a imagem do original tem só 128 px e estoura de perto.
// As medidas seguem a desse original, numa grade de 128 unidades.
const GOLD_LIGHT = '#f0d9a0'
const GOLD = '#c8a24a'
const GOLD_DARK = '#785a28'
const INK = '#0d1621'

const pillPath = () => {
  const path = new Path2D()
  path.arc(64, 38, 21, Math.PI, 0)
  path.lineTo(85, 56)
  path.lineTo(78, 64)
  path.lineTo(85, 72)
  path.lineTo(85, 90)
  path.arc(64, 90, 21, 0, Math.PI)
  path.lineTo(43, 72)
  path.lineTo(50, 64)
  path.lineTo(43, 56)
  path.closePath()
  return path
}

// Ornamento de um lado, que o desenho espelha nos outros três quadrantes.
const ornamentPath = () => {
  const path = new Path2D()
  path.moveTo(85, 41)
  path.quadraticCurveTo(99, 48, 96, 61)
  path.moveTo(85, 47)
  path.quadraticCurveTo(93, 52, 91, 61)
  path.moveTo(96, 61)
  path.lineTo(88, 64)
  return path
}

const diamondPath = () => {
  const path = new Path2D()
  path.moveTo(101, 60)
  path.lineTo(105, 64)
  path.lineTo(101, 68)
  path.lineTo(97, 64)
  path.closePath()
  return path
}

// Devolve um canvas quadrado de size pixels, transparente em volta da moldura.
export function drawTwinFrame(size) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')
  g.scale(size / 128, size / 128)
  g.lineJoin = 'round'

  const gold = g.createLinearGradient(0, 16, 0, 112)
  gold.addColorStop(0, GOLD_LIGHT)
  gold.addColorStop(0.5, GOLD)
  gold.addColorStop(1, GOLD_DARK)

  const pill = pillPath()
  const ornament = ornamentPath()
  const diamond = diamondPath()

  // Sombra em volta de tudo, para a moldura se destacar do terreno.
  g.save()
  g.shadowColor = 'rgba(0, 0, 0, 0.85)'
  g.shadowBlur = size * 0.04
  g.fillStyle = INK
  g.fill(pill)
  g.restore()

  g.save()
  g.clip(pill)
  const shade = g.createLinearGradient(0, 28, 0, 100)
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shade.addColorStop(0.2, 'rgba(0, 0, 0, 0.6)')
  shade.addColorStop(0.8, 'rgba(0, 0, 0, 0.6)')
  shade.addColorStop(1, 'rgba(0, 0, 0, 0)')
  g.fillStyle = shade
  g.fillRect(55, 28, 18, 72)
  g.fillStyle = gold
  g.fillRect(63.2, 34, 1.6, 60)
  g.restore()

  g.strokeStyle = gold
  g.lineWidth = 2.2
  g.stroke(pill)
  g.strokeStyle = 'rgba(240, 217, 160, 0.35)'
  g.lineWidth = 0.4
  g.stroke(pill)

  for (const [x, y] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    g.save()
    g.translate(64, 64)
    g.scale(x, y)
    g.translate(-64, -64)
    g.strokeStyle = gold
    g.lineWidth = 1
    g.stroke(ornament)
    g.restore()
  }
  for (const side of [1, -1]) {
    g.save()
    g.translate(64, 64)
    g.scale(side, 1)
    g.translate(-64, -64)
    g.fillStyle = INK
    g.fill(diamond)
    g.strokeStyle = gold
    g.lineWidth = 1
    g.stroke(diamond)
    g.restore()
  }
  return canvas
}
