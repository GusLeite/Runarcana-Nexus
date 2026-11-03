import * as THREE from 'three'
import { buildRaven } from './ravenModel.js'

// Globo demoníaco sobre uma região, moldado na fronteira dela: cúpula vermelha com veias que correm e pulsam como um coração, e corvos em volta.
const GLOBE_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  varying vec2 vMapUv;
  void main() {
    vLocal = position;
    vMapUv = position.xy / 2048.0 + 0.5;
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-view.xyz);
    gl_Position = projectionMatrix * view;
  }
`

const GLOBE_FRAGMENT = `
  uniform float time;
  uniform float height;
  uniform sampler2D mask;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  varying vec2 vMapUv;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += noise(p) * amp;
      p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.05 + 7.0;
      amp *= 0.5;
    }
    return sum;
  }
  void main() {
    // A fronteira da região é o limite: fora da máscara não existe globo.
    float inside = smoothstep(0.25, 0.6, texture2D(mask, vMapUv).a);
    if (inside < 0.01) discard;
    float lift = clamp(vLocal.z / height, 0.0, 1.0);
    float border = 1.0 - smoothstep(0.0, 0.1, lift);
    float facing = clamp(abs(dot(normalize(vNormal), normalize(vView))), 0.0, 1.0);
    float rim = max(pow(1.0 - facing, 2.4), border * 0.35);
    vec2 p = vLocal.xy / 90.0;
    float warp = fbm(p + time * 0.05);
    // Veias: as linhas finas onde o ruído passa pelo meio da sua faixa.
    float veins = smoothstep(0.06, 0.0, abs(fbm(p + warp * 2.0 - time * 0.03) - 0.48));
    float beat = pow(0.5 + 0.5 * sin(time * 1.7), 6.0) + 0.6 * pow(0.5 + 0.5 * sin(time * 1.7 - 0.7), 10.0);
    vec3 blood = vec3(0.30, 0.01, 0.02);
    vec3 fire = vec3(1.0, 0.16, 0.04);
    vec3 color = mix(blood, fire, clamp(rim + veins * (0.45 + beat * 0.55), 0.0, 1.0));
    float alpha = 0.4 + warp * 0.16 + rim * 0.6 + veins * (0.22 + beat * 0.3) + beat * 0.05;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.95) * inside);
  }
`

const RAVEN_VERTEX = `
  attribute float tone;
  attribute vec4 orbit;
  attribute vec3 flight;
  uniform float time;
  uniform vec3 globe;
  varying vec3 vPlace;
  varying float vTone;
  void main() {
    float phase = orbit.z * 7.0;
    float beat = time * flight.y + phase;
    // Alterna batidas fortes e planeio, como uma ave de verdade.
    float effort = mix(0.22, 1.0, smoothstep(-0.3, 0.5, sin(time * 0.33 + phase)));
    vec3 bird = position;
    float span = abs(bird.y);
    // Asa com articulação: a mão atrasa em relação ao braço.
    float arm = sin(beat) * 0.42 * effort + 0.1;
    float hand = sin(beat - 1.05) * 0.78 * effort + 0.06;
    float inner = min(span, 0.62);
    float outer = max(span - 0.62, 0.0);
    bird.z += inner * arm + outer * (arm + hand);
    bird.x -= outer * (0.1 + 0.1 * sin(beat + 0.6) * effort);
    bird.z -= sin(beat) * 0.05 * effort;
    bird *= orbit.w;

    float angle = orbit.z + time * flight.x;
    float direction = flight.x > 0.0 ? 1.0 : -1.0;
    // Inclina para dentro da curva.
    float roll = direction * flight.z;
    bird = vec3(bird.x, bird.y * cos(roll) - bird.z * sin(roll), bird.y * sin(roll) + bird.z * cos(roll));
    float heading = angle + direction * 1.5708;
    float c = cos(heading);
    float s = sin(heading);
    vec3 turned = vec3(bird.x * c - bird.y * s, bird.x * s + bird.y * c, bird.z);

    float wander = 1.0 + 0.035 * sin(angle * 3.0 + phase);
    vec3 center = vec3(
      cos(angle) * globe.x * orbit.x * wander,
      sin(angle) * globe.z * orbit.x * wander,
      globe.y * orbit.y + sin(time * 0.45 + phase) * 9.0
    );
    vec4 view = modelViewMatrix * vec4(center + turned, 1.0);
    vPlace = view.xyz;
    vTone = tone;
    gl_Position = projectionMatrix * view;
  }
`

const RAVEN_FRAGMENT = `
  varying vec3 vPlace;
  varying float vTone;
  void main() {
    if (vTone > 1.5) {
      gl_FragColor = vec4(1.0, 0.16, 0.04, 1.0);
      return;
    }
    vec3 normal = normalize(cross(dFdx(vPlace), dFdy(vPlace)));
    vec3 toEye = normalize(-vPlace);
    if (dot(normal, toEye) < 0.0) normal = -normal;
    vec3 light = normalize(vec3(-0.35, 0.6, 0.72));
    float diffuse = max(dot(normal, light), 0.0);
    // Pena preta com brilho azul-violeta e um reflexo vermelho que vem do globo.
    float sheen = pow(max(dot(normal, normalize(light + toEye)), 0.0), 26.0);
    float glow = pow(1.0 - max(dot(normal, toEye), 0.0), 3.0);
    vec3 base = vTone > 0.5 ? vec3(0.035, 0.032, 0.04) : vec3(0.018, 0.016, 0.028);
    vec3 color = base + base * diffuse * 2.6 + vec3(0.2, 0.18, 0.42) * sheen + vec3(0.2, 0.025, 0.02) * glow;
    gl_FragColor = vec4(color, 1.0);
  }
`

const random = (min, max) => min + Math.random() * (max - min)

const MAP_SIZE = 2048
const FIELD = 512
const BLUR_RADIUS = 22
const BLUR_PASSES = 3
const SEGMENTS = 150

// Média móvel em linhas e colunas: três passadas dão uma borda bem arredondada, sem depender de filtro do navegador.
function blur(values) {
  let from = Float32Array.from(values)
  for (let pass = 0; pass < BLUR_PASSES; pass++) {
    for (const [step, line] of [[1, FIELD], [FIELD, 1]]) {
      const to = new Float32Array(from.length)
      for (let l = 0; l < FIELD; l++) {
        let sum = 0
        const at = i => from[l * line + Math.min(FIELD - 1, Math.max(0, i)) * step]
        for (let i = -BLUR_RADIUS; i <= BLUR_RADIUS; i++) sum += at(i)
        for (let i = 0; i < FIELD; i++) {
          to[l * line + i * step] = sum / (2 * BLUR_RADIUS + 1)
          sum += at(i + BLUR_RADIUS + 1) - at(i - BLUR_RADIUS)
        }
      }
      from = to
    }
  }
  return from
}

// A imagem da região é forte no contorno e quase transparente no miolo. Inundando a partir das bordas da imagem,
// o que a água não alcança é o território inteiro, com o interior preenchido.
function fillRegion(outline) {
  const outside = new Uint8Array(outline.length)
  const stack = []
  const visit = i => {
    if (!outside[i] && !outline[i]) {
      outside[i] = 1
      stack.push(i)
    }
  }
  for (let i = 0; i < FIELD; i++) {
    visit(i)
    visit(FIELD * (FIELD - 1) + i)
    visit(i * FIELD)
    visit(i * FIELD + FIELD - 1)
  }
  while (stack.length) {
    const i = stack.pop()
    const column = i % FIELD
    if (column > 0) visit(i - 1)
    if (column < FIELD - 1) visit(i + 1)
    if (i >= FIELD) visit(i - FIELD)
    if (i < FIELD * (FIELD - 1)) visit(i + FIELD)
  }
  return Float32Array.from(outside, value => (value ? 0 : 1))
}

// Lê a máscara da região: onde ela existe, o quanto cada ponto está para dentro e o retângulo que a contém.
function readRegion(image) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = FIELD
  const g = canvas.getContext('2d', { willReadFrequently: true })
  g.drawImage(image, 0, 0, FIELD, FIELD)
  const pixels = g.getImageData(0, 0, FIELD, FIELD).data
  const outline = new Uint8Array(FIELD * FIELD)
  for (let i = 0; i < outline.length; i++) outline[i] = pixels[4 * i + 3] > 40 ? 1 : 0
  const alpha = fillRegion(outline)
  let left = FIELD, right = 0, top = FIELD, bottom = 0
  const filled = g.createImageData(FIELD, FIELD)
  for (let i = 0; i < alpha.length; i++) {
    filled.data[4 * i + 3] = alpha[i] * 255
    if (!alpha[i]) continue
    const column = i % FIELD
    const row = Math.floor(i / FIELD)
    left = Math.min(left, column)
    right = Math.max(right, column)
    top = Math.min(top, row)
    bottom = Math.max(bottom, row)
  }
  const worldX = column => (column / FIELD - 0.5) * MAP_SIZE
  const worldY = row => (0.5 - row / FIELD) * MAP_SIZE
  g.putImageData(filled, 0, 0)
  return { mask: canvas, depth: blur(alpha), minX: worldX(left), maxX: worldX(right + 1), minY: worldY(bottom + 1), maxY: worldY(top) }
}

// Superfície da cúpula: nasce na fronteira da região e sobe conforme avança para dentro dela.
function buildShell(region, height) {
  const width = region.maxX - region.minX
  const depth = region.maxY - region.minY
  const geometry = new THREE.PlaneGeometry(width, depth, SEGMENTS, SEGMENTS)
  geometry.translate((region.minX + region.maxX) / 2, (region.minY + region.maxY) / 2, 0)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const column = Math.min(FIELD - 1, Math.max(0, Math.floor((position.getX(i) / MAP_SIZE + 0.5) * FIELD)))
    const row = Math.min(FIELD - 1, Math.max(0, Math.floor((0.5 - position.getY(i) / MAP_SIZE) * FIELD)))
    const inside = THREE.MathUtils.smoothstep(region.depth[row * FIELD + column], 0.42, 1)
    position.setZ(i, Math.sqrt(inside) * height)
  }
  geometry.computeVertexNormals()
  return geometry
}

// Devolve o que anima e libera a cena. config: { region, height, flightHeight, ravens, flocks }: a cúpula segue public/map/regions/<region>.png.
export function createDemonGlobe(config, parent) {
  const group = new THREE.Group()
  parent.add(group)
  const time = { value: 0 }
  const disposables = []
  let destroyed = false

  new THREE.TextureLoader().loadAsync('/map/regions/' + config.region + '.png').then(image => {
    if (destroyed) return image.dispose()
    const region = readRegion(image.image)
    image.dispose()
    const mask = new THREE.CanvasTexture(region.mask)
    const shell = buildShell(region, config.height)
    const globeMaterial = new THREE.ShaderMaterial({
      uniforms: { time, mask: { value: mask }, height: { value: config.height } },
      vertexShader: GLOBE_VERTEX,
      fragmentShader: GLOBE_FRAGMENT,
      transparent: true,
      side: THREE.DoubleSide,
      // Sem teste de profundidade: as montanhas da fronteira não podem esconder a borda.
      depthTest: false,
      depthWrite: false,
    })
    const globe = new THREE.Mesh(shell, globeMaterial)
    globe.renderOrder = 1.5
    group.add(globe)

    const ravens = new THREE.InstancedBufferGeometry()
    const model = buildRaven()
    ravens.setAttribute('position', new THREE.Float32BufferAttribute(model.positions, 3))
    ravens.setAttribute('tone', new THREE.Float32BufferAttribute(model.tones, 1))
    ravens.instanceCount = config.ravens
    const orbit = []
    const flight = []
    // Bandos: cada um gira junto, com as aves próximas umas das outras e um ou outro desgarrado.
    const flocks = Array.from({ length: config.flocks }, (_, i) => ({
      angle: (i / config.flocks) * Math.PI * 2 + random(-0.3, 0.3),
      reach: random(0.86, 1.02),
      lift: random(0.75, 1.5),
      speed: random(0.07, 0.11) * (i % 3 === 2 ? -1 : 1),
    }))
    for (let i = 0; i < config.ravens; i++) {
      const flock = flocks[i % config.flocks]
      // Raio relativo à região, altura relativa à da cúpula, ângulo inicial e tamanho.
      orbit.push(flock.reach + random(-0.05, 0.05), Math.max(0.5, flock.lift + random(-0.2, 0.2)), flock.angle + random(-0.2, 0.2), random(5.5, 8.5))
      // Velocidade na órbita, ritmo das asas e inclinação na curva.
      flight.push(flock.speed * random(0.94, 1.06), random(6.5, 9), random(0.2, 0.42))
    }
    ravens.setAttribute('orbit', new THREE.InstancedBufferAttribute(new Float32Array(orbit), 4))
    ravens.setAttribute('flight', new THREE.InstancedBufferAttribute(new Float32Array(flight), 3))
    const ravenMaterial = new THREE.ShaderMaterial({
      uniforms: { time, globe: { value: new THREE.Vector3((region.maxX - region.minX) / 2, config.flightHeight, (region.maxY - region.minY) / 2) } },
      vertexShader: RAVEN_VERTEX,
      fragmentShader: RAVEN_FRAGMENT,
      side: THREE.DoubleSide,
      transparent: true,
    })
    const flockMesh = new THREE.Mesh(ravens, ravenMaterial)
    flockMesh.position.set((region.minX + region.maxX) / 2, (region.minY + region.maxY) / 2, 0)
    flockMesh.frustumCulled = false
    // Por cima das nuvens: os corvos são o que mais chama a atenção de longe.
    flockMesh.renderOrder = 2.5
    group.add(flockMesh)
    disposables.push(mask, shell, globeMaterial, ravens, ravenMaterial)
  }).catch(() => {})

  return {
    update(elapsed) {
      time.value = elapsed
    },
    dispose() {
      destroyed = true
      parent.remove(group)
      disposables.forEach(item => item.dispose())
    },
  }
}
