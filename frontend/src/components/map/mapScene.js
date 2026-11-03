import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import {
  CAM_FAR_Z, CAM_INTRO_Z, FOV, MAP_SIZE, TERRAIN_HEIGHT, clampPan, clampZoom, easeFactor, sineInOut, tiltFor,
  wheelZoom, worldPerPixel, zoomProgress,
} from './mapMath.js'

const TEXTURES = { terrain: '/map/terrain_z1.jpg', depth: '/map/depth_z1.jpg', ocean: '/map/ocean_z1.jpg' }
const TERRAIN_SEGMENTS = 200
const INTRO_SECONDS = 2.2

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

// A água ondula só onde a máscara do oceano é branca: a imagem é deslocada pelo ruído e ganha faixas de luz.
// Perto da borda da textura, o terreno se funde com o fundo.
const TERRAIN_FRAGMENT = `
  uniform sampler2D colorMap;
  uniform sampler2D oceanMask;
  uniform vec3 edgeColor;
  uniform float time;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    float sea = texture2D(oceanMask, vUv).r;
    vec2 flow = vec2(noise(vUv * 40.0 + time * 0.12), noise(vUv * 40.0 + 7.0 - time * 0.1)) - 0.5;
    vec3 col = texture2D(colorMap, vUv + flow * 0.0025 * sea).rgb;
    float swell = noise(vUv * 90.0 + flow * 2.0 + time * 0.25) - 0.5;
    col += sea * swell * 0.07 * vec3(0.5, 0.8, 1.0);
    vec2 border = smoothstep(vec2(0.0), vec2(0.07), vUv) * smoothstep(vec2(0.0), vec2(0.07), 1.0 - vUv);
    gl_FragColor = vec4(mix(edgeColor, col, border.x * border.y), 1.0);
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
    float fine = noise(vUv * 1500.0 + time * 0.2);
    float glint = clamp((wide * 0.6 + fine - 1.2) * 2.5, 0.0, 1.0);
    gl_FragColor = vec4(vec3(glint * texture2D(oceanMask, vUv).r), opacity);
  }
`

// Nuvens que deslizam sobre o mapa, mais a névoa parada sobre o gelo do norte. O plano é 3x maior que o mapa.
const CLOUDS_FRAGMENT = `
  uniform float time;
  uniform float opacity;
  varying vec2 vUv;
  ${NOISE}
  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      sum += noise(p) * amp;
      p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 11.0;
      amp *= 0.5;
    }
    return sum;
  }
  void main() {
    vec2 map = (vUv - 0.5) * 3.0 + 0.5;
    float clouds = smoothstep(0.48, 0.8, fbm(map * 6.0 + vec2(-time * 0.018, time * 0.004)));
    vec2 inside = smoothstep(vec2(0.0), vec2(0.12), map) * smoothstep(vec2(0.0), vec2(0.12), 1.0 - map);
    float ice = inside.x * inside.y * smoothstep(0.68, 0.84, map.y) * smoothstep(0.3, 0.7, fbm(map * 9.0 + vec2(time * 0.006, 0.0))) * 0.7;
    gl_FragColor = vec4(vec3(0.78, 0.88, 0.94), max(clouds, ice) * opacity);
  }
`

// Foco de miniatura no alto e no pé da tela, mais forte quanto maior o zoom, e vinheta escura em volta da tela.
const TILT_SHIFT_FRAGMENT = `
  uniform sampler2D tDiffuse;
  uniform float strength;
  varying vec2 vUv;
  void main() {
    float edge = pow(abs(0.5 - vUv.y) * 2.0, 2.0);
    float step = 0.0015 * strength * edge;
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
  return Promise.all(Object.values(TEXTURES).map(url => loader.loadAsync(url)))
}

// Monta a cena no container e devolve os controles. Rejeita se o navegador não tem WebGL ou faltam as texturas.
export async function createMapScene(container, { reducedMotion = false } = {}) {
  const [terrain, depth, ocean] = await loadTextures()

  // O relevo é lido no vertex shader, onde mipmap não ajuda.
  depth.generateMipmaps = false
  depth.minFilter = THREE.LinearFilter

  const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: import.meta.env.DEV })
  terrain.anisotropy = renderer.capabilities.getMaxAnisotropy()
  renderer.setClearColor(0x05090d)
  container.appendChild(renderer.domElement)

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
      oceanMask: { value: ocean },
      edgeColor: { value: edgeColor },
      time: { value: 0 },
      height: { value: TERRAIN_HEIGHT },
    },
    vertexShader: TERRAIN_VERTEX,
    fragmentShader: TERRAIN_FRAGMENT,
  })
  const terrainMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS), terrainMaterial)
  panGroup.add(terrainMesh)

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
  sparkle.visible = !reducedMotion
  panGroup.add(sparkle)

  const cloudsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, opacity: { value: 0 } },
    vertexShader: PLAIN_VERTEX,
    fragmentShader: CLOUDS_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  })
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(3 * MAP_SIZE, 3 * MAP_SIZE), cloudsMaterial)
  clouds.position.z = 150
  panGroup.add(clouds)

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
  let intro = reducedMotion ? null : { from: CAM_INTRO_Z, elapsed: 0 }
  let aspect = 1
  const pan = { x: 0, y: 0 }
  let goalPan = { x: 0, y: 0 }
  const velocity = { x: 0, y: 0 }

  const resize = () => {
    const width = container.clientWidth || 1
    const height = container.clientHeight || 1
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    aspect = width / height
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(ratio)
    renderer.setSize(width, height)
    composer.setPixelRatio(ratio)
    composer.setSize(width, height)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  resize()

  const movePan = (dx, dy) => {
    const scale = worldPerPixel(z, container.clientHeight || 1)
    goalPan = clampPan({ x: goalPan.x + dx * scale, y: goalPan.y - dy * scale }, goalZ, aspect)
  }

  const setGoalZ = value => {
    intro = null
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
  const onDown = e => {
    canvas.setPointerCapture(e.pointerId)
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
  canvas.addEventListener('wheel', onWheel, { passive: false })

  const update = dt => {
    if (intro) {
      intro.elapsed += dt
      z = intro.from + (goalZ - intro.from) * sineInOut(intro.elapsed / INTRO_SECONDS)
      if (intro.elapsed >= INTRO_SECONDS) intro = null
    } else {
      z += (goalZ - z) * easeFactor(0.1, dt)
    }

    // Inércia: o último movimento do arraste continua depois de soltar. Parar antes de soltar a zera.
    const decay = 0.85 ** (dt * 60)
    velocity.x *= decay
    velocity.y *= decay
    if (pointers.size === 0 && Math.hypot(velocity.x, velocity.y) > 1) movePan(velocity.x * dt * 60, velocity.y * dt * 60)

    goalPan = clampPan(goalPan, goalZ, aspect)
    const follow = pointers.size > 0 ? 1 : easeFactor(0.1, dt)
    pan.x += (goalPan.x - pan.x) * follow
    pan.y += (goalPan.y - pan.y) * follow

    camera.position.z = z
    panGroup.position.set(pan.x, pan.y, 0)
    tiltGroup.rotation.x = tiltFor(z)
    const progress = zoomProgress(z)
    tiltShift.uniforms.strength.value = progress
    // De longe se veem as nuvens; de perto elas abrem e aparece o brilho do mar.
    cloudsMaterial.uniforms.opacity.value = 0.32 * (1 - THREE.MathUtils.smoothstep(progress, 0, 0.6))
    sparkleMaterial.uniforms.opacity.value = 0.03 + 0.3 * progress
  }

  const clock = new THREE.Clock()
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1)
    update(dt)
    // Com movimento reduzido, a água e as nuvens ficam paradas.
    if (!reducedMotion) {
      for (const material of [terrainMaterial, sparkleMaterial, cloudsMaterial]) material.uniforms.time.value = clock.elapsedTime
    }
    composer.render(dt)
  })

  return {
    zoomBy: factor => setGoalZ(goalZ * factor),
    destroy() {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('wheel', onWheel)
      for (const mesh of [seaBed, terrainMesh, sparkle, clouds]) {
        mesh.geometry.dispose()
        mesh.material.dispose()
      }
      for (const texture of [terrain, depth, ocean]) texture.dispose()
      tiltShift.dispose()
      composer.dispose()
      target.dispose()
      renderer.dispose()
      canvas.remove()
    },
  }
}
