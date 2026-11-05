import * as THREE from 'three'

// Ondas de luz num lugar do mapa: o ping (anéis na cor de quem clicou) e o "Olhem aqui!" do mestre (big: anéis
// maiores, dourados, com um farol no centro). Sprites sem perspectiva, na cena dos pontos de interesse: ficam nítidas,
// por cima de tudo e do mesmo tamanho na tela em qualquer zoom (a escala é px × pixel, como em poiSprites.js).
export function createPulses(root, { reducedMotion = false } = {}) {
  const ringTexture = canvasTexture(ctx => {
    ctx.strokeStyle = '#fff'
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 10
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.arc(64, 64, 52, 0, Math.PI * 2)
    ctx.stroke()
  })
  const dotTexture = canvasTexture(ctx => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,255,255,.75)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  })
  const live = []

  const sprite = (texture, color, x, y, z, data) => {
    const material = new THREE.SpriteMaterial({ map: texture, color, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false })
    const s = new THREE.Sprite(material)
    s.position.set(x, y, z)
    s.renderOrder = 10
    s.visible = false
    s.userData = { t: 0, ...data }
    root.add(s)
    live.push(s)
  }

  return {
    // color: número 0xrrggbb.
    add(x, y, z, color, { big = false } = {}) {
      const rings = reducedMotion ? 1 : big ? 4 : 2
      const life = big ? 1.9 : 1.3
      for (let i = 0; i < rings; i++) {
        sprite(ringTexture, color, x, y, z, { delay: i * (big ? 0.45 : 0.3), life, from: 14, to: big ? 300 : 150, fade: 1.6 })
      }
      if (big) sprite(dotTexture, color, x, y, z, { delay: 0, life: 3.4, from: 70, to: 46, fade: 3 })
    },
    update(dt, pixel) {
      for (let i = live.length - 1; i >= 0; i--) {
        const s = live[i]
        const d = s.userData
        d.t += dt
        const p = (d.t - d.delay) / d.life
        if (p >= 1) {
          root.remove(s)
          s.material.dispose()
          live.splice(i, 1)
          continue
        }
        s.visible = p >= 0
        if (p < 0) continue
        const px = d.from + (d.to - d.from) * (1 - (1 - p) ** 2)
        s.scale.setScalar(px * pixel)
        s.material.opacity = Math.max(0, (1 - p) ** d.fade)
      }
    },
    dispose() {
      live.forEach(s => { root.remove(s); s.material.dispose() })
      live.length = 0
      ringTexture.dispose()
      dotTexture.dispose()
    },
  }
}

function canvasTexture(draw) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  draw(canvas.getContext('2d'))
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
