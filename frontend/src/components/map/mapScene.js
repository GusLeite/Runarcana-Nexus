import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import {
  CAM_FAR_Z, CAM_INTRO_Z, FOV, MAP_SIZE, TERRAIN_HEIGHT, clampPan, clampZoom, TILE_IDS, TILE_MIN_PROGRESS, TILE_SIZE, easeFactor, focusPan, pinVisible, sineInOut,
  tileCenter, tileNearView, tiltFor,
  wheelZoom, worldPerPixel, zoomProgress,
} from './mapMath.js'
import { createDemonGlobe } from './demonGlobe.js'
import { createTemporalDomes } from './temporalDomes.js'
import { createLandmarks } from './landmarks.js'
import { createPartyLayers } from './partyLayers.js'

const TEXTURES = ['terrain_z1', 'depth_z1', 'ocean_z1', 'clouds', 'fog', 'fog-mask'].map(name => `/map/${name}.jpg`)
const TERRAIN_SEGMENTS = 200
const INTRO_SECONDS = 2.2
const FOCUS_SECONDS = 1.5
// De perto, a moldura chega perto da altura da tela em telas de alta densidade.
const DECAL_PIXELS = 2048
// A vista começa um pouco ao sul, para o brasão do Vazio não ficar cortado no pé da tela.
const START_PAN = { x: 0, y: 70 }
const HIGHLIGHT_OPACITY = 0.9

const PLAIN_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// O relevo fica no canal azul do mapa de profundidade.
const TERRAIN_VERTEX = `
  uniform sampler2D depthMap;
  uniform float height;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 raised = position;
    raised.z += texture2D(depthMap, uv).b * height;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(raised, 1.0);
  }
`

const NOISE = `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
`

// Perto da borda da textura, o terreno se funde com o fundo.
const TERRAIN_FRAGMENT = `
  uniform sampler2D colorMap;
  uniform vec3 edgeColor;
  varying vec2 vUv;
  void main() {
    vec3 col = texture2D(colorMap, vUv).rgb;
    vec2 border = smoothstep(vec2(0.0), vec2(0.07), vUv) * smoothstep(vec2(0.0), vec2(0.07), 1.0 - vUv);
    gl_FragColor = vec4(mix(edgeColor, col, border.x * border.y), 1.0);
  }
`

// Bloco detalhado: lê o relevo no trecho do mapa de profundidade que corresponde a ele, para encaixar no terreno.
const TILE_VERTEX = `
  uniform sampler2D depthMap;
  uniform float height;
  uniform vec2 offset;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 raised = position;
    raised.z += texture2D(depthMap, uv / 8.0 + offset).b * height;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(raised, 1.0);
  }
`

// Região acesa e bloco detalhado: imagem transparente sobre o mesmo relevo do terreno.
const HIGHLIGHT_FRAGMENT = `
  uniform sampler2D map;
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    vec4 col = texture2D(map, vUv);
    gl_FragColor = vec4(col.rgb, col.a * opacity);
  }
`

// Região sem imagem de destaque: acende a terra dentro de um círculo, com a borda suave.
const AREA_FRAGMENT = `
  uniform sampler2D oceanMask;
  uniform vec2 center;
  uniform float radius;
  uniform vec3 color;
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    float land = 1.0 - texture2D(oceanMask, vUv).r;
    float inside = 1.0 - smoothstep(radius * 0.7, radius, distance(vUv, center));
    gl_FragColor = vec4(color, land * inside * 0.4 * opacity);
  }
`

// Brilho do mar: ruído que se move devagar, só onde a máscara do oceano é branca.
const SPARKLE_FRAGMENT = `
  uniform sampler2D oceanMask;
  uniform float time;
  uniform float opacity;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    float wide = noise(vUv * 30.0 + time * 0.05);
    // Duas camadas giradas entre si, para o brilho não formar quadradinhos de perto.
    float fine = 2.0 * noise(vUv * 1500.0 + time * 0.2) * noise(mat2(0.8, -0.6, 0.6, 0.8) * vUv * 2300.0 - time * 0.15);
    float glint = clamp((wide * 0.6 + fine - 1.45) * 2.5, 0.0, 1.0);
    gl_FragColor = vec4(vec3(glint * texture2D(oceanMask, vUv).r), opacity);
  }
`

// Nuvens que deslizam sobre o mapa, repetindo a textura; somem nas beiradas do plano para não marcar a emenda.
const CLOUDS_FRAGMENT = `
  uniform sampler2D cloudMap;
  uniform float drift;
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    vec2 frame = smoothstep(vec2(0.0), vec2(0.1), vUv) * smoothstep(vec2(0.0), vec2(0.1), 1.0 - vUv);
    vec3 col = texture2D(cloudMap, vUv * 4.0 + vec2(drift, 0.0)).rgb;
    gl_FragColor = vec4(col, opacity * frame.x * frame.y);
  }
`

// Névoa parada sobre as montanhas e o gelo: a máscara diz onde ela aparece.
const FOG_FRAGMENT = `
  uniform sampler2D fogMap;
  uniform sampler2D fogMask;
  varying vec2 vUv;
  void main() {
    vec3 col = texture2D(fogMap, fract(vUv * 6.0)).rgb;
    gl_FragColor = vec4(col, max(texture2D(fogMask, vUv).g - 0.2, 0.0));
  }
`

// Foco de miniatura no alto e no pé da tela, mais forte quanto maior o zoom, e vinheta escura em volta da tela.
const TILT_SHIFT_FRAGMENT = `
  uniform sampler2D tDiffuse;
  uniform float strength;
  varying vec2 vUv;
  void main() {
    float edge = pow(abs(0.5 - vUv.y) * 2.0, 2.0);
    float step = 0.001 * strength * edge;
    vec4 sum = vec4(0.0);
    float total = 0.0;
    for (int i = -4; i <= 4; i++) {
      float weight = 5.0 - abs(float(i));
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + float(i) * step)) * weight;
      total += weight;
    }
    vec2 frame = smoothstep(vec2(0.0), vec2(0.14), vUv) * smoothstep(vec2(0.0), vec2(0.14), 1.0 - vUv);
    float vignette = mix(0.35, 1.0, frame.x * frame.y);
    gl_FragColor = vec4(sum.rgb / total * vignette, 1.0);
  }
`

const loadTextures = () => {
  const loader = new THREE.TextureLoader()
  return Promise.all(TEXTURES.map(url => loader.loadAsync(url))).catch(() => {
    throw Object.assign(new Error('Faltam as texturas do mapa em /map/ (scripts/fetch-map-assets.sh).'), { code: 'textures' })
  })
}

// Monta a cena no container e devolve os controles. Rejeita se o navegador não tem WebGL ou faltam as texturas.
// pins: elementos HTML presos a um ponto do mundo ({ el, x, y, z, level }); a cena os reposiciona a cada quadro.
// lift: distância do ponto no plano em pé, de frente para a câmera.
// decals: imagens em pé nesse mesmo plano ({ draw, x, y, z, size, level }); draw(pixels) devolve um canvas.
// domes: domos de distorção temporal ({ x, y, radius, speed }).
// globe: globo demoníaco com corvos ({ x, y, radius, height, flightHeight, ravens, flocks }).
// landmarks: marcos em 3D (MAP_LANDMARKS), que aparecem de perto.
// areas: regiões que acendem por um círculo em vez de uma imagem ({ [slug]: { x, y, radius, color } }).
// onMapClick(clientX, clientY): clique no mapa, sem arrastar.
// onPinsChange: chamado quando os pontos visíveis mudam, porque o navegador não avisa que o mouse saiu de um ponto escondido.
export async function createMapScene(container, { reducedMotion = false, pins = [], decals = [], areas = {}, fogAreas = {}, domes = [], globe = null, landmarks = [], onPinsChange, onMapClick } = {}) {
  const textures = await loadTextures()
  const [terrain, depth, ocean, cloudMap, fogMap, fogMask] = textures

  cloudMap.wrapS = cloudMap.wrapT = THREE.RepeatWrapping
  // O fract do shader quebra a continuidade do mipmap e marcaria a emenda.
  fogMap.generateMipmaps = false
  fogMap.minFilter = THREE.LinearFilter

  // O relevo é lido no vertex shader, onde mipmap não ajuda.
  depth.generateMipmaps = false
  depth.minFilter = THREE.LinearFilter

  const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: import.meta.env.DEV })
  terrain.anisotropy = renderer.capabilities.getMaxAnisotropy()
  renderer.setClearColor(0x05090d)
  container.appendChild(renderer.domElement)

  // Altura do terreno, para o que fica no chão acompanhar as montanhas.
  let depthPixels = null
  const heightAt = (x, y) => {
    if (!depthPixels) {
      const reader = document.createElement('canvas')
      reader.width = reader.height = MAP_SIZE
      const g = reader.getContext('2d', { willReadFrequently: true })
      g.drawImage(depth.image, 0, 0, MAP_SIZE, MAP_SIZE)
      depthPixels = g.getImageData(0, 0, MAP_SIZE, MAP_SIZE).data
    }
    const column = Math.min(MAP_SIZE - 1, Math.max(0, Math.round(x + MAP_SIZE / 2)))
    const row = Math.min(MAP_SIZE - 1, Math.max(0, Math.round(MAP_SIZE / 2 - y)))
    return depthPixels[4 * (column + MAP_SIZE * row) + 2] / 255 * TERRAIN_HEIGHT
  }

  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 10000)
  const scene = new THREE.Scene()

  // A inclinação gira em torno do centro da tela e o arraste acontece dentro dela: por isso dois grupos.
  const tiltGroup = new THREE.Group()
  const panGroup = new THREE.Group()
  tiltGroup.add(panGroup)
  scene.add(tiltGroup)

  // Sem conversão de cor, como as texturas: é o mar profundo, para o terreno emendar sem barra.
  const edgeColor = new THREE.Color().setHex(0x161e23, THREE.LinearSRGBColorSpace)
  const seaBed = new THREE.Mesh(
    new THREE.PlaneGeometry(5 * MAP_SIZE, 3 * MAP_SIZE),
    new THREE.MeshBasicMaterial({ color: edgeColor }),
  )
  seaBed.position.z = -50
  panGroup.add(seaBed)

  const terrainMaterial = new THREE.ShaderMaterial({
    uniforms: {
      colorMap: { value: terrain },
      depthMap: { value: depth },
      edgeColor: { value: edgeColor },
      height: { value: TERRAIN_HEIGHT },
    },
    vertexShader: TERRAIN_VERTEX,
    fragmentShader: TERRAIN_FRAGMENT,
  })
  const terrainGeometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
  const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial)
  panGroup.add(terrainMesh)

  // Regiões acesas, criadas na primeira vez em que são pedidas. Sem a imagem, a região só não acende.
  const highlights = new Map()
  let destroyed = false
  const highlightFor = slug => {
    if (highlights.has(slug)) return highlights.get(slug)
    const area = areas[slug]
    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: null },
        depthMap: { value: depth },
        height: { value: TERRAIN_HEIGHT },
        opacity: { value: 0 },
        ...(area && {
          oceanMask: { value: ocean },
          center: { value: new THREE.Vector2(area.x / MAP_SIZE + 0.5, area.y / MAP_SIZE + 0.5) },
          radius: { value: area.radius / MAP_SIZE },
          color: { value: new THREE.Vector3(...area.color) },
        }),
      },
      vertexShader: TERRAIN_VERTEX,
      fragmentShader: area ? AREA_FRAGMENT : HIGHLIGHT_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(terrainGeometry, material)
    mesh.renderOrder = 0.5
    mesh.visible = false
    panGroup.add(mesh)
    const highlight = { mesh, material, goal: 0, texture: null, ready: Boolean(area) }
    highlights.set(slug, highlight)
    if (area) return highlight
    new THREE.TextureLoader().loadAsync(`/map/regions/${slug}.png`).then(texture => {
      if (destroyed) return texture.dispose()
      highlight.texture = texture
      highlight.ready = true
      material.uniforms.map.value = texture
    }).catch(() => {})
    return highlight
  }

  // Névoa de guerra e trilha do grupo (partyLayers.js).
  const party = createPartyLayers({ panGroup, terrainGeometry, depth, ocean, heightAt, fogAreas, renderer })

  // Blocos detalhados por cima da imagem geral, baixados só quando o zoom e a vista pedem.
  const tileGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, 64, 64)
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
  const tiles = TILE_IDS.map(id => {
    const center = tileCenter(id)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: null },
        depthMap: { value: depth },
        height: { value: TERRAIN_HEIGHT },
        offset: { value: new THREE.Vector2((id % 8) / 8, (7 - Math.floor(id / 8)) / 8) },
        opacity: { value: 0 },
      },
      vertexShader: TILE_VERTEX,
      fragmentShader: HIGHLIGHT_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(tileGeometry, material)
    mesh.position.set(center.x, center.y, 0)
    mesh.renderOrder = 0.2
    mesh.visible = false
    panGroup.add(mesh)
    return { id, mesh, material, texture: null, requested: false }
  })
  const updateTiles = (progress, dt) => {
    const wanted = progress >= TILE_MIN_PROGRESS
    const loader = new THREE.TextureLoader()
    for (const tile of tiles) {
      if (wanted && !tile.requested && tileNearView(tile.id, { x: goalPan.x, y: goalPan.y }, goalZ, aspect)) {
        tile.requested = true
        loader.loadAsync(`/map/tiles/${tile.id + 1}.jpg`).then(texture => {
          if (destroyed) return texture.dispose()
          texture.anisotropy = maxAnisotropy
          tile.texture = texture
          tile.material.uniforms.map.value = texture
        }).catch(() => {})
      }
      const opacity = tile.material.uniforms.opacity
      opacity.value += ((wanted && tile.texture ? 1 : 0) - opacity.value) * easeFactor(0.12, dt)
      tile.mesh.visible = tile.texture !== null && opacity.value > 0.01
    }
  }

  const decalMeshes = decals.map(decal => {
    const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, depthWrite: false })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(decal.size, decal.size), material)
    mesh.position.set(decal.x, decal.y, decal.z)
    mesh.renderOrder = 0.6
    mesh.visible = false
    panGroup.add(mesh)
    const texture = new THREE.CanvasTexture(decal.draw(DECAL_PIXELS))
    texture.anisotropy = maxAnisotropy
    material.map = texture
    return { mesh, material, level: decal.level, texture }
  })

  const sparkleMaterial = new THREE.ShaderMaterial({
    uniforms: { oceanMask: { value: ocean }, time: { value: 0 }, opacity: { value: 0.18 } },
    vertexShader: PLAIN_VERTEX,
    fragmentShader: SPARKLE_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const sparkle = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), sparkleMaterial)
  sparkle.position.z = 1
  sparkle.renderOrder = 0.3
  sparkle.visible = !reducedMotion
  panGroup.add(sparkle)

  const temporalDomes = createTemporalDomes(domes, panGroup, heightAt)
  const demonGlobe = globe && createDemonGlobe(globe, panGroup)
  const landmarkModels = landmarks.length > 0 ? createLandmarks(landmarks, panGroup) : null

  const cloudsMaterial = new THREE.ShaderMaterial({
    uniforms: { cloudMap: { value: cloudMap }, drift: { value: 0 }, opacity: { value: 0 } },
    vertexShader: PLAIN_VERTEX,
    fragmentShader: CLOUDS_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  })
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(1.5 * MAP_SIZE, MAP_SIZE), cloudsMaterial)
  clouds.position.z = 150
  clouds.renderOrder = 2
  panGroup.add(clouds)

  const fogMaterial = new THREE.ShaderMaterial({
    uniforms: { fogMap: { value: fogMap }, fogMask: { value: fogMask } },
    vertexShader: PLAIN_VERTEX,
    fragmentShader: FOG_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  })
  const fog = new THREE.Mesh(new THREE.PlaneGeometry(1.5 * MAP_SIZE, MAP_SIZE), fogMaterial)
  fog.position.z = 20
  fog.renderOrder = 1
  panGroup.add(fog)

  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
  const composer = new EffectComposer(renderer, target)
  composer.addPass(new RenderPass(scene, camera))
  const tiltShift = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, strength: { value: 0 } },
    vertexShader: PLAIN_VERTEX,
    fragmentShader: TILT_SHIFT_FRAGMENT,
  })
  composer.addPass(tiltShift)

  // Estado da câmera. "goal" é aonde o usuário pediu para ir; a câmera e o mapa chegam lá aos poucos.
  let z = reducedMotion ? CAM_FAR_Z : CAM_INTRO_Z
  let goalZ = CAM_FAR_Z
  // Voo: câmera e mapa vão juntos até o destino, como na entrada e ao escolher uma região.
  let flight = reducedMotion ? null : { fromZ: CAM_INTRO_Z, fromPan: { ...START_PAN }, seconds: INTRO_SECONDS, elapsed: 0 }
  let aspect = 1
  const pan = { ...START_PAN }
  let goalPan = { ...START_PAN }
  const velocity = { x: 0, y: 0 }

  // Tamanho do palco guardado aqui: ler clientWidth/clientHeight a cada pin, a cada quadro, forçaria um recálculo de layout por leitura.
  // Qualidade adaptativa: se o mapa ficar abaixo de ~30 quadros por segundo por um tempo, a resolução de desenho cai (2 → 1,5 → 1).
  let maxRatio = 2
  let avgFrame = 1 / 60
  let slowFrames = 0
  let viewW = 1
  let viewH = 1
  const resize = () => {
    const width = container.clientWidth || 1
    viewW = width
    const height = container.clientHeight || 1
    viewH = height
    const ratio = Math.min(window.devicePixelRatio || 1, maxRatio)
    aspect = width / height
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(ratio)
    renderer.setSize(width, height)
    composer.setPixelRatio(ratio)
    composer.setSize(width, height)
    party?.resize()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  resize()

  const movePan = (dx, dy) => {
    const scale = worldPerPixel(z, viewH)
    goalPan = clampPan({ x: goalPan.x + dx * scale, y: goalPan.y - dy * scale }, goalZ, aspect)
  }

  const setGoalZ = value => {
    flight = null
    goalZ = clampZoom(value)
  }

  // Ponteiros ativos: um arrasta, dois fazem a pinça.
  const pointers = new Map()
  let pinch = 0
  const pinchDistance = () => {
    const [a, b] = [...pointers.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const canvas = renderer.domElement
  let press = null
  const onDown = e => {
    canvas.setPointerCapture(e.pointerId)
    press = pointers.size === 0 ? { x: e.clientX, y: e.clientY } : null
    if (flight) {
      flight = null
      goalPan = { ...pan }
      goalZ = z
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    velocity.x = velocity.y = 0
    pinch = pointers.size === 2 ? pinchDistance() : 0
    canvas.classList.add('dragging')
  }
  const onMove = e => {
    const last = pointers.get(e.pointerId)
    if (!last) return
    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.size === 1) {
      movePan(dx, dy)
      velocity.x = dx
      velocity.y = dy
    } else if (pointers.size === 2) {
      const distance = pinchDistance()
      if (pinch > 0 && distance > 0) setGoalZ(goalZ * (pinch / distance))
      pinch = distance
    }
  }
  const onUp = e => {
    const clicked = press && e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 6
    press = null
    if (clicked) onMapClick?.(e.clientX, e.clientY)
    pointers.delete(e.pointerId)
    pinch = 0
    if (pointers.size === 0) canvas.classList.remove('dragging')
  }
  const onWheel = e => {
    e.preventDefault()
    setGoalZ(wheelZoom(goalZ, e.deltaY))
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  // No container, para a roda funcionar também com o mouse sobre um brasão.
  container.addEventListener('wheel', onWheel, { passive: false })

  const point = new THREE.Vector3()
  let pinState = null
  const placePins = () => {
    const state = `${pinVisible('far', z)}${pinVisible('near', z)}`
    if (pinState !== null && state !== pinState) onPinsChange?.()
    pinState = state
    tiltGroup.updateMatrixWorld(true)
    camera.updateMatrixWorld()
    for (const pin of pins) {
      const visible = pinVisible(pin.level, z)
      if (pin.on !== visible) { pin.on = visible; pin.el.classList.toggle('on', visible) }
      if (!visible) continue
      // O plano em pé gira ao contrário da inclinação, para continuar de frente para a câmera.
      const lift = pin.lift ?? 0
      const upright = -tiltGroup.rotation.x
      point.set(pin.x, pin.y + lift * Math.cos(upright), pin.z + lift * Math.sin(upright))
      point.applyMatrix4(panGroup.matrixWorld).project(camera)
      const left = (point.x + 1) / 2 * viewW
      const top = (1 - point.y) / 2 * viewH
      pin.el.style.transform = `translate(${left}px, ${top}px) translate(-50%, -50%)`
    }
  }

  const update = dt => {
    if (flight) {
      flight.elapsed += dt
      const t = sineInOut(flight.elapsed / flight.seconds)
      z = flight.fromZ + (goalZ - flight.fromZ) * t
      pan.x = flight.fromPan.x + (goalPan.x - flight.fromPan.x) * t
      pan.y = flight.fromPan.y + (goalPan.y - flight.fromPan.y) * t
      if (flight.elapsed >= flight.seconds) flight = null
    } else {
      z += (goalZ - z) * easeFactor(0.1, dt)
    }

    // Inércia: o último movimento do arraste continua depois de soltar. Parar antes de soltar a zera.
    const decay = 0.85 ** (dt * 60)
    velocity.x *= decay
    velocity.y *= decay
    if (pointers.size === 0 && Math.hypot(velocity.x, velocity.y) > 1) movePan(velocity.x * dt * 60, velocity.y * dt * 60)

    if (!flight) {
      goalPan = clampPan(goalPan, goalZ, aspect)
      const follow = pointers.size > 0 ? 1 : easeFactor(0.1, dt)
      pan.x += (goalPan.x - pan.x) * follow
      pan.y += (goalPan.y - pan.y) * follow
    }

    for (const highlight of highlights.values()) {
      const opacity = highlight.material.uniforms.opacity
      opacity.value += (highlight.goal - opacity.value) * easeFactor(0.12, dt)
      highlight.mesh.visible = highlight.ready && (highlight.goal > 0 || opacity.value > 0.01)
    }

    camera.position.z = z
    panGroup.position.set(pan.x, pan.y, 0)
    tiltGroup.rotation.x = tiltFor(z)
    const progress = zoomProgress(z)
    tiltShift.uniforms.strength.value = progress
    // De longe se veem as nuvens; de perto elas abrem e aparece o brilho do mar.
    cloudsMaterial.uniforms.opacity.value = 0.32 * (1 - THREE.MathUtils.smoothstep(progress, 0, 0.6))
    sparkleMaterial.uniforms.opacity.value = 0.25 * progress
    updateTiles(progress, dt)
    for (const decal of decalMeshes) {
      const goal = decal.texture && pinVisible(decal.level, z) ? 1 : 0
      decal.material.opacity += (goal - decal.material.opacity) * easeFactor(0.12, dt)
      decal.mesh.visible = decal.material.opacity > 0.01
      decal.mesh.rotation.x = -tiltGroup.rotation.x
    }
    party.update(reducedMotion ? 0 : clock.elapsedTime, dt)
    landmarkModels?.setVisible(pinVisible('near', z))
    landmarkModels?.update(dt)
    placePins()
  }

  // Chamado a cada quadro com o tempo real desde o anterior (sem o teto de 0,1 s da animação).
  const watchSpeed = raw => {
    if (raw > 0.25) return // aba que estava escondida: não conta
    avgFrame = avgFrame * 0.95 + raw * 0.05
    slowFrames = avgFrame > 1 / 30 ? slowFrames + 1 : 0
    if (slowFrames > 90 && maxRatio > 1 && (window.devicePixelRatio || 1) > 1) {
      maxRatio = maxRatio > 1.5 ? 1.5 : 1
      slowFrames = 0
      avgFrame = 1 / 60
      resize()
    }
  }

  const clock = new THREE.Clock()
  window.__mapDebug = { renderer, composer, update, scene, tiles, terrain, sparkle, fog, clouds, party, landmarkModels, setZ: v => { goalZ = z = v; flight = null }, tiltShift, target }
  renderer.setAnimationLoop(() => {
    const raw = clock.getDelta()
    watchSpeed(raw)
    const dt = Math.min(raw, 0.1)
    update(dt)
    // Com movimento reduzido, as nuvens e o brilho do mar ficam parados.
    if (!reducedMotion) {
      sparkleMaterial.uniforms.time.value = clock.elapsedTime
      cloudsMaterial.uniforms.drift.value = -0.018 * clock.elapsedTime
      temporalDomes.update(clock.elapsedTime)
      demonGlobe?.update(clock.elapsedTime)
    }
    composer.render(dt)
  })

  return {
    zoomBy: factor => setGoalZ(goalZ * factor),
    // Ponto do mapa sob o ponteiro, no nível do mar. Nulo se o raio não toca o plano.
    screenToWorld(clientX, clientY) {
      const rect = canvas.getBoundingClientRect()
      const ndc = new THREE.Vector2((clientX - rect.left) / rect.width * 2 - 1, 1 - (clientY - rect.top) / rect.height * 2)
      const raycaster = new THREE.Raycaster()
      tiltGroup.updateMatrixWorld(true)
      camera.updateMatrixWorld()
      raycaster.setFromCamera(ndc, camera)
      raycaster.ray.applyMatrix4(panGroup.matrixWorld.clone().invert())
      const hit = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), new THREE.Vector3())
      return hit && { x: Math.round(hit.x), y: Math.round(hit.y) }
    },
    heightAt,
    // Névoa: regiões encobertas e o quanto cobrem (1 = opaca). Trilha: as paradas do grupo, em ordem.
    setFog: (hidden, strength) => party.setFog(hidden, strength),
    setTrail: (points, options) => party.setTrail(points, options),
    setRoutes: items => party.setRoutes(items),
    // Acende uma região (ou nenhuma, com null) e apaga as outras.
    highlight(slug) {
      if (slug) highlightFor(slug)
      for (const [key, highlight] of highlights) highlight.goal = key === slug ? HIGHLIGHT_OPACITY : 0
    },
    // Voa até um ponto do mundo; coveredPx é a largura de tela coberta por um painel à direita.
    focus(x, y, zoom, coveredPx = 0) {
      velocity.x = velocity.y = 0
      goalZ = clampZoom(zoom)
      goalPan = focusPan(x, y, goalZ, aspect, viewH, coveredPx)
      flight = { fromZ: z, fromPan: { ...pan }, seconds: reducedMotion ? 0.01 : FOCUS_SECONDS, elapsed: 0 }
    },
    destroy() {
      destroyed = true
      renderer.setAnimationLoop(null)
      for (const part of [...highlights.values(), ...tiles]) {
        part.material.dispose()
        part.texture?.dispose()
      }
      tileGeometry.dispose()
      temporalDomes.dispose()
      party.dispose()
      demonGlobe?.dispose()
      landmarkModels?.dispose()
      for (const decal of decalMeshes) {
        decal.mesh.geometry.dispose()
        decal.material.dispose()
        decal.texture?.dispose()
      }
      observer.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      container.removeEventListener('wheel', onWheel)
      for (const mesh of [seaBed, terrainMesh, sparkle, clouds, fog]) {
        mesh.geometry.dispose()
        mesh.material.dispose()
      }
      for (const texture of textures) texture.dispose()
      tiltShift.dispose()
      composer.dispose()
      target.dispose()
      renderer.dispose()
      canvas.remove()
    },
  }
}
