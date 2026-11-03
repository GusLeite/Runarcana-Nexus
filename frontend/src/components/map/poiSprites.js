import * as THREE from 'three'
import { GLYPH_PATHS } from './poiKinds.jsx'
import { easeFactor, pinVisible } from './mapMath.js'

// Pontos de interesse desenhados no WebGL, cada um uma imagem de frente para a câmera (ícone + nome), do mesmo jeito
// que eram os botões em HTML. Com dezenas de botões na tela, reposicioná-los a cada quadro travava o arraste;
// aqui o custo não depende de quantos pontos há. Tamanho fixo em pixels, por cima de tudo (fora do foco de miniatura).

const KIND_COLORS = { DANGER: '#ff8d7a', QUEST: '#f7dc6a', MYSTERY: '#c79bff', LANDMARK: '#2fd3c0' }
const DEFAULT_COLOR = '#f0c75e'
const TEXT_COLOR = '#e8dfc8'
const FONT = '600 13px Spectral, serif'
const LETTER_SPACING = '1.82px' // 0.14em
// Medidas em pixels de tela, como no CSS dos botões: disco de 34 com anel apagado 5px fora (tracejado no oficial), glifo de 19.
const ICON = 34
const GLYPH = 19
const HOVER_SCALE = 1.2
// A imagem é centrada no ponto do mapa; o ícone fica um pouco acima e o nome abaixo, como no botão.
const HEIGHT = 90
const ICON_Y = 35.5
const NAME_Y = 63
const RING_GAP = 5
const MIN_WIDTH = 60
const FADE = 0.12
const BORN_SECONDS = 1.2

const colorOf = kind => KIND_COLORS[kind] ?? DEFAULT_COLOR
const easeOutBack = t => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2

// Mede o nome e desenha o ponto; hover acende o ícone e pinta o nome com a cor do tipo.
function draw(canvas, poi, hover, ratio) {
  const g = canvas.getContext('2d')
  g.font = FONT
  if ('letterSpacing' in g) g.letterSpacing = LETTER_SPACING
  const width = Math.ceil(Math.max(MIN_WIDTH, g.measureText(poi.name).width + 16))
  canvas.width = width * ratio
  canvas.height = HEIGHT * ratio
  g.setTransform(ratio, 0, 0, ratio, 0, 0)
  g.font = FONT
  if ('letterSpacing' in g) g.letterSpacing = LETTER_SPACING
  const color = colorOf(poi.kind)
  const cx = width / 2
  const s = hover ? HOVER_SCALE : 1

  const r = (ICON / 2) * s
  g.save()
  g.shadowColor = 'rgba(0, 0, 0, 0.7)'
  g.shadowBlur = 14
  g.fillStyle = 'rgba(7, 12, 19, 0.88)'
  g.beginPath()
  g.arc(cx, ICON_Y, r, 0, Math.PI * 2)
  g.fill()
  g.restore()
  // Brilho dourado por dentro da borda (o inset do CSS).
  const glow = g.createRadialGradient(cx, ICON_Y, r * 0.55, cx, ICON_Y, r)
  glow.addColorStop(0, 'rgba(232, 195, 106, 0)')
  glow.addColorStop(1, 'rgba(232, 195, 106, 0.12)')
  g.fillStyle = glow
  g.beginPath()
  g.arc(cx, ICON_Y, r, 0, Math.PI * 2)
  g.fill()
  g.lineWidth = 1
  g.strokeStyle = color
  g.beginPath()
  g.arc(cx, ICON_Y, (ICON / 2 - 0.5) * s, 0, Math.PI * 2)
  g.stroke()
  g.strokeStyle = 'rgba(232, 195, 106, 0.3)'
  if (poi.official) g.setLineDash([3, 3])
  g.beginPath()
  g.arc(cx, ICON_Y, (ICON / 2 + RING_GAP + 0.5) * s, 0, Math.PI * 2)
  g.stroke()
  g.setLineDash([])
  const glyph = GLYPH * s
  g.save()
  g.translate(cx - glyph / 2, ICON_Y - glyph / 2)
  g.scale(glyph / 24, glyph / 24)
  g.fillStyle = color
  g.fill(new Path2D(GLYPH_PATHS[poi.kind] ?? GLYPH_PATHS.LANDMARK))
  g.restore()

  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = hover ? color : TEXT_COLOR
  g.save()
  g.shadowColor = '#000'
  g.shadowBlur = 4
  g.shadowOffsetY = 1
  g.fillText(poi.name, cx, NAME_Y)
  g.shadowBlur = 2
  g.shadowOffsetY = 0
  g.fillText(poi.name, cx, NAME_Y)
  g.restore()
  return width
}

// root: grupo que acompanha o mapa (recebe a matriz do grupo do mapa a cada quadro). Com movimento reduzido, o ponto
// recém-revelado aparece sem brotar.
export function createPoiSprites(root, { reducedMotion = false } = {}) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  let entries = new Map() // id → { poi, sprite, material, texture, canvas, width, opacity, age, screen }
  let hovered = null

  const paint = entry => {
    entry.width = draw(entry.canvas, entry.poi, entry.poi.id === hovered, ratio)
    entry.texture.dispose()
    entry.texture = new THREE.CanvasTexture(entry.canvas)
    entry.texture.generateMipmaps = false
    entry.texture.minFilter = THREE.LinearFilter
    entry.material.map = entry.texture
    entry.material.needsUpdate = true
  }

  const remove = entry => {
    root.remove(entry.sprite)
    entry.material.dispose()
    entry.texture.dispose()
  }

  // A fonte do nome pode chegar depois do primeiro desenho.
  document.fonts?.load(FONT).then(() => {
    for (const entry of entries.values()) paint(entry)
  }).catch(() => {})

  return {
    // pois: [{ id, x, y, z, kind, name, official, level, born }]. Só redesenha o que mudou de nome ou tipo.
    set(pois) {
      const next = new Map()
      for (const poi of pois) {
        let entry = entries.get(poi.id)
        if (entry) {
          const changed = entry.poi.name !== poi.name || entry.poi.kind !== poi.kind || entry.poi.official !== poi.official
          if (poi.born && !entry.poi.born && !reducedMotion) entry.age = 0
          entry.poi = poi
          if (changed) paint(entry)
        } else {
          const canvas = document.createElement('canvas')
          const texture = new THREE.Texture()
          const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false, opacity: 0 })
          const sprite = new THREE.Sprite(material)
          sprite.visible = false
          root.add(sprite)
          entry = { poi, sprite, material, texture, canvas, width: MIN_WIDTH, opacity: 0, age: poi.born && !reducedMotion ? 0 : BORN_SECONDS, screen: null }
          paint(entry)
        }
        entry.sprite.position.set(poi.x, poi.y, poi.z)
        next.set(poi.id, entry)
      }
      for (const [id, entry] of entries) if (!next.has(id)) remove(entry)
      entries = next
      if (hovered != null && !entries.has(hovered)) hovered = null
    },
    // pixel: tamanho no mundo de 1 pixel de tela (sprite sem perspectiva); toScreen(x, y, z) → { left, top } ou null.
    update(z, dt, pixel, toScreen) {
      for (const entry of entries.values()) {
        const goal = pinVisible(entry.poi.born ? 'any' : entry.poi.level, z) ? 1 : 0
        entry.opacity += (goal - entry.opacity) * easeFactor(FADE, dt)
        if (Math.abs(goal - entry.opacity) < 0.005) entry.opacity = goal
        const shown = entry.opacity > 0
        entry.sprite.visible = shown
        entry.screen = shown && entry.opacity > 0.5 ? toScreen(entry.poi.x, entry.poi.y, entry.poi.z) : null
        if (!shown) continue
        entry.material.opacity = entry.opacity
        let grow = 1
        if (entry.age < BORN_SECONDS) {
          entry.age += dt
          grow = Math.max(0, easeOutBack(Math.min(1, entry.age / BORN_SECONDS)))
        }
        entry.sprite.scale.set(entry.width * pixel * grow, HEIGHT * pixel * grow, 1)
      }
    },
    // Ponto sob o ponteiro (o mais perto do ícone), ou null.
    hitTest(left, top) {
      let best = null
      let bestDistance = Infinity
      for (const entry of entries.values()) {
        const s = entry.screen
        if (!s) continue
        const dx = left - s.left
        const iconY = s.top - (HEIGHT / 2 - ICON_Y)
        const onIcon = Math.hypot(dx, top - iconY) <= ICON / 2 + RING_GAP
        const onName = Math.abs(dx) <= entry.width / 2 - 8 && top >= iconY + ICON / 2 && top <= s.top + (NAME_Y - HEIGHT / 2) + 10
        if (!onIcon && !onName) continue
        const distance = Math.hypot(dx, top - iconY)
        if (distance < bestDistance) { best = entry.poi.id; bestDistance = distance }
      }
      return best
    },
    setHover(id) {
      if (id === hovered) return
      const before = entries.get(hovered)
      hovered = id
      if (before) paint(before)
      const now = entries.get(id)
      if (now) paint(now)
    },
    dispose() {
      for (const entry of entries.values()) remove(entry)
      entries.clear()
    },
  }
}
