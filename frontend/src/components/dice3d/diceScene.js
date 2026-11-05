// Palco dos dados 3D: canvas transparente por cima da tela, física com cannon-es e desenho com three.
// Carregado sob demanda (import dinâmico em Dice3D.jsx), como o pdf-lib.
//
// O lançamento é simulado inteiro antes de aparecer (passo fixo de 1/60 s, gravando posição e giro de cada dado e
// as batidas para o som). Com o resultado da física em mãos, os números das faces são trocados para que a face
// de cima mostre o valor que o servidor sorteou (diceShapes.relabel); só então o dado é pintado e a gravação
// é reproduzida no ritmo da tela.
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { diceShape, relabel, upIndex } from './diceShapes.js'
import { CELL, drawAtlas, faceLayout } from './diceTexture.js'

const STEP = 1 / 60
const MAX_STEPS = 330 // 5,5 s: o que não parou até aqui fica onde estiver
const RADIUS = { 4: 1.05, 6: 0.78, 8: 0.9, 10: 0.88, 12: 0.92, 20: 0.95 }
const CAMERA_Y = 21
const CAMERA_Z = 5
const FOV = 30

const rand = (a, b) => a + Math.random() * (b - a)

let fontsReady = null
function loadFonts() {
  if (!fontsReady) {
    fontsReady = document.fonts?.load
      ? Promise.race([document.fonts.load(`700 ${CELL}px Cinzel`), new Promise(r => setTimeout(r, 800))]).catch(() => {})
      : Promise.resolve()
  }
  return fontsReady
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

// container: elemento que recebe o canvas (ocupa o tamanho dele). onClack(volume): batida de um dado.
// compact: câmera mais perto (mesa menor), para o palco pequeno do canto ficar com dados de tamanho legível.
export function createDiceStage(container, { onClack, compact = false } = {}) {
  const camY = compact ? CAMERA_Y * 0.5 : CAMERA_Y
  const camZ = compact ? CAMERA_Z * 0.5 : CAMERA_Z
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 100)
  camera.position.set(0, camY, camZ)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.HemisphereLight(0xfff1d6, 0x101828, 1.1))
  const sun = new THREE.DirectionalLight(0xffffff, 2.2)
  sun.position.set(-5, 14, 6)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 40 })
  scene.add(sun)
  const glow = new THREE.PointLight(0xf0c75e, 0, 9, 1.6)
  scene.add(glow)

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.38 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Área visível no chão (y = 0), para as paredes invisíveis da física.
  let half = { x: 8, z: 5 }
  const resize = () => {
    const w = Math.max(1, container.clientWidth)
    const h = Math.max(1, container.clientHeight)
    renderer.setSize(w, h, false)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const dist = Math.hypot(camY, camZ)
    const halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * dist
    half = { x: halfH * camera.aspect * 0.86, z: halfH * 0.8 }
  }
  resize()
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  observer?.observe(container)

  let meshes = []
  let fog = []
  let raf = 0
  let disposed = false
  const owned = [] // geometrias, materiais e texturas para liberar

  const render = () => renderer.render(scene, camera)

  function clear() {
    meshes.forEach(m => scene.remove(m.mesh))
    fog.forEach(s => scene.remove(s))
    meshes = []
    fog = []
    glow.intensity = 0
  }

  // dice: [{ sides, value }]; effects: { crit, fumble, dim: [], fog }. Resolve quando os dados param.
  async function throwDice(dice, effects = {}) {
    await loadFonts()
    if (disposed) return
    clear()
    const sim = simulate(dice, half)
    meshes = dice.map((d, i) => buildDie(d, sim.labels[i], effects, i, owned))
    meshes.forEach(m => scene.add(m.mesh))
    if (effects.fog) fog = buildFog(owned, scene)

    return new Promise(resolve => {
      const start = performance.now()
      let lastStep = -1
      let settledAt = null
      const frame = now => {
        if (disposed) return resolve()
        // O horário do rAF pode vir um pouco antes de start: nunca abaixo do quadro 0.
        const step = Math.max(0, Math.min(sim.frames.length - 1, Math.floor((now - start) / (STEP * 1000))))
        const f = sim.frames[step]
        meshes.forEach((m, i) => {
          m.mesh.position.set(f[i * 7], f[i * 7 + 1], f[i * 7 + 2])
          m.mesh.quaternion.set(f[i * 7 + 3], f[i * 7 + 4], f[i * 7 + 5], f[i * 7 + 6])
        })
        for (let s = lastStep + 1; s <= step; s++) {
          const v = sim.clacks.get(s)
          if (v) onClack?.(v)
        }
        lastStep = step
        if (step === sim.frames.length - 1 && settledAt == null) {
          settledAt = now
          afterLanding(meshes, effects, glow)
          resolve()
        }
        if (settledAt != null) animateEffects(meshes, effects, glow, fog, now - settledAt)
        else if (fog.length) animateEffects(meshes, effects, glow, fog, 0, now - start)
        render()
        raf = requestAnimationFrame(frame)
      }
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(frame)
    })
  }

  function dispose() {
    disposed = true
    cancelAnimationFrame(raf)
    observer?.disconnect()
    clear()
    owned.forEach(o => o.dispose?.())
    floor.geometry.dispose()
    floor.material.dispose()
    renderer.dispose()
    renderer.forceContextLoss?.()
    renderer.domElement.remove()
  }

  return { throwDice, dispose }
}

// ---------- física ----------

export function simulate(dice, half) {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82 * 3.2, 0) })
  world.allowSleep = true
  world.broadphase = new CANNON.NaiveBroadphase()
  const diceMat = new CANNON.Material('dice')
  const floorMat = new CANNON.Material('floor')
  const wallMat = new CANNON.Material('wall')
  world.addContactMaterial(new CANNON.ContactMaterial(diceMat, floorMat, { friction: 0.12, restitution: 0.42 }))
  world.addContactMaterial(new CANNON.ContactMaterial(diceMat, wallMat, { friction: 0.05, restitution: 0.65 }))
  world.addContactMaterial(new CANNON.ContactMaterial(diceMat, diceMat, { friction: 0.1, restitution: 0.4 }))

  const plane = (mat, pos, axis, angle) => {
    const body = new CANNON.Body({ mass: 0, material: mat, shape: new CANNON.Plane() })
    body.position.set(...pos)
    body.quaternion.setFromAxisAngle(new CANNON.Vec3(...axis), angle)
    world.addBody(body)
  }
  plane(floorMat, [0, 0, 0], [1, 0, 0], -Math.PI / 2)
  plane(wallMat, [-half.x, 0, 0], [0, 1, 0], Math.PI / 2)
  plane(wallMat, [half.x, 0, 0], [0, 1, 0], -Math.PI / 2)
  plane(wallMat, [0, 0, -half.z], [0, 1, 0], 0)
  plane(wallMat, [0, 0, half.z], [0, 1, 0], Math.PI)

  // Os dados entram pelo canto de baixo à esquerda, um pouco espalhados, girando. A força acompanha o tamanho
  // da mesa: no palco pequeno do canto, o arremesso da tela cheia faria os dados quicarem nas paredes por segundos.
  const k = Math.max(0.45, Math.min(1, half.x / 7))
  const bodies = dice.map((d, i) => {
    const shape = diceShape(d.sides)
    const r = RADIUS[d.sides]
    const poly = new CANNON.ConvexPolyhedron({
      vertices: shape.vertices.map(v => new CANNON.Vec3(v[0] * r, v[1] * r, v[2] * r)),
      faces: shape.faces,
    })
    const body = new CANNON.Body({ mass: 1, material: diceMat, shape: poly, sleepSpeedLimit: 0.2, sleepTimeLimit: 0.25,
      linearDamping: 0.08, angularDamping: 0.12 })
    const col = i % 4
    const row = Math.floor(i / 4)
    // Em tela estreita (celular em pé) a fileira não pode passar da parede da direita.
    body.position.set(Math.min(-half.x * 0.78 + col * 1.5, half.x - 1), (3 + row * 1.6 + rand(0, 1)) * k, half.z * 0.55 - row * 1.3 * k)
    body.quaternion.setFromEuler(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2))
    body.velocity.set(rand(9, 14) * k, rand(-2, 1), -rand(1.5, 4.5) * k)
    body.angularVelocity.set(rand(-22, 22), rand(-22, 22), rand(-22, 22))
    world.addBody(body)
    return body
  })

  const clacks = new Map()
  let current = 0
  bodies.forEach(body => body.addEventListener('collide', e => {
    const v = Math.abs(e.contact.getImpactVelocityAlongNormal())
    if (v > 1.2) clacks.set(current, Math.max(clacks.get(current) ?? 0, Math.min(1, v / 14)))
  }))

  const frames = []
  const snap = () => {
    const f = new Float32Array(bodies.length * 7)
    bodies.forEach((b, i) => {
      f.set([b.position.x, b.position.y, b.position.z, b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w], i * 7)
    })
    frames.push(f)
  }
  snap()
  for (current = 1; current <= MAX_STEPS; current++) {
    world.step(STEP)
    snap()
    if (current > 30 && bodies.every(b => b.sleepState === CANNON.Body.SLEEPING)) break
  }

  const labels = dice.map((d, i) => {
    const shape = diceShape(d.sides)
    return relabel(shape.labels, upIndex(shape, bodies[i].quaternion), d.value)
  })
  return { frames, clacks, labels }
}

// ---------- desenho ----------

function buildDie(d, labels, effects, index, owned) {
  const shape = diceShape(d.sides)
  const r = RADIUS[d.sides]
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const layout = drawAtlas(ctx, d.sides, labels, { hidden: !!effects.fog })
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4

  const positions = []
  const normals = []
  const uvs = []
  shape.faces.forEach((face, i) => {
    const n = shape.normals[i]
    const pts = layout.faces[i].points
    for (let k = 1; k < face.length - 1; k++) {
      ;[0, k, k + 1].forEach(j => {
        const v = shape.vertices[face[j]]
        positions.push(v[0] * r, v[1] * r, v[2] * r)
        normals.push(...n)
        uvs.push(pts[j][0] / layout.width, 1 - pts[j][1] / layout.height)
      })
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 0.35,
    roughness: 0.32,
    emissive: new THREE.Color(0xf0c75e),
    emissiveMap: texture,
    emissiveIntensity: 0.12,
    transparent: !!effects.fog,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  owned.push(geometry, material, texture)
  return { mesh, material, texture, ctx, sides: d.sides, labels, upFace: null, index, shape }
}

function buildFog(owned, scene) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
  g.addColorStop(0, 'rgba(190,150,255,.55)')
  g.addColorStop(1, 'rgba(120,80,200,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  owned.push(texture)
  // Névoa colada no dado: nuvens pequenas girando em volta dele (seguem o dado durante o lançamento).
  return Array.from({ length: 7 }, (_, i) => {
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0.55 })
    owned.push(material)
    const sprite = new THREE.Sprite(material)
    const s = rand(1.8, 2.8)
    sprite.scale.set(s, s, 1)
    sprite.userData = { phase: (i / 7) * Math.PI * 2, radius: rand(0.5, 1.1), lift: rand(0.4, 1.2) }
    scene.add(sprite)
    return sprite
  })
}

// Depois de parar: o crítico acende em ouro, a falha racha a face de cima, o descartado escurece.
function afterLanding(meshes, effects, glow) {
  meshes.forEach(m => {
    if (m.shape.perVertex) return
    const q = m.mesh.quaternion
    m.upFace = upIndex(m.shape, { x: q.x, y: q.y, z: q.z, w: q.w })
  })
  ;(effects.dim ?? []).forEach(i => {
    const m = meshes[i]
    if (!m) return
    m.material.color.setScalar(0.32)
    m.material.emissiveIntensity = 0
  })
  if (effects.fumble != null) {
    const m = meshes[effects.fumble]
    if (m) {
      drawAtlas(m.ctx, m.sides, m.labels, { cracked: m.upFace })
      m.texture.needsUpdate = true
      m.material.emissive.set(0xff3a2a)
      m.material.emissiveIntensity = 0.5
    }
  }
  if (effects.crit != null) {
    const m = meshes[effects.crit]
    if (m) glow.position.set(m.mesh.position.x, 2.5, m.mesh.position.z)
  }
}

function animateEffects(meshes, effects, glow, fog, sinceLanding, sinceStart = sinceLanding) {
  if (effects.crit != null && meshes[effects.crit] && sinceLanding > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(sinceLanding / 160)
    meshes[effects.crit].material.emissiveIntensity = 0.45 + pulse * 0.5
    glow.intensity = 6 + pulse * 10
  }
  const center = meshes[0]?.mesh.position
  if (!center) return
  fog.forEach(s => {
    const t = (sinceStart || sinceLanding) / 1000
    const a = s.userData.phase + t * 0.7
    s.position.set(center.x + Math.cos(a) * s.userData.radius, center.y + s.userData.lift, center.z + Math.sin(a) * s.userData.radius * 0.7)
    s.material.opacity = 0.4 + 0.15 * Math.sin(t * 1.3 + s.userData.phase)
  })
}
