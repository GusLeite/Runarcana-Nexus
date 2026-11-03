import * as THREE from 'three'

// Globo demoníaco sobre uma região: cúpula vermelha com veias que correm e pulsam como um coração, e corvos em volta.
const GLOBE_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-view.xyz);
    gl_Position = projectionMatrix * view;
  }
`

const GLOBE_FRAGMENT = `
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
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
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.4);
    vec2 p = vLocal.xy * 3.0;
    float warp = fbm(p + time * 0.05);
    // Veias: as linhas finas onde o ruído passa pelo meio da sua faixa.
    float veins = smoothstep(0.06, 0.0, abs(fbm(p + warp * 2.0 - time * 0.03) - 0.48));
    float beat = pow(0.5 + 0.5 * sin(time * 1.7), 6.0) + 0.6 * pow(0.5 + 0.5 * sin(time * 1.7 - 0.7), 10.0);
    vec3 blood = vec3(0.30, 0.01, 0.02);
    vec3 fire = vec3(1.0, 0.16, 0.04);
    vec3 color = mix(blood, fire, clamp(rim + veins * (0.45 + beat * 0.55), 0.0, 1.0));
    float alpha = 0.26 + warp * 0.14 + rim * 0.7 + veins * (0.22 + beat * 0.3) + beat * 0.05;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.95));
  }
`

const RAVEN_VERTEX = `
  attribute float span;
  attribute vec4 orbit;
  attribute vec2 flight;
  uniform float time;
  uniform vec3 globe;
  varying float vShade;
  void main() {
    float angle = orbit.z + time * flight.x;
    // Corvo apontado para +X, batendo as asas conforme a distância até o corpo.
    float flap = sin(time * flight.y + orbit.z * 9.0);
    vec3 bird = position;
    bird.z += abs(span) * flap * 0.55;
    bird *= orbit.w;
    // Cada um gira no sentido da própria órbita, sempre olhando para onde voa.
    float heading = angle + (flight.x > 0.0 ? 1.5708 : -1.5708);
    float c = cos(heading);
    float s = sin(heading);
    vec3 turned = vec3(bird.x * c - bird.y * s, bird.x * s + bird.y * c, bird.z);
    vec3 center = vec3(cos(angle) * globe.x * orbit.x, sin(angle) * globe.x * orbit.x, globe.y * orbit.y + sin(time * 0.6 + orbit.z * 5.0) * 10.0);
    vShade = 0.5 + 0.5 * flap;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(center + turned, 1.0);
  }
`

const RAVEN_FRAGMENT = `
  varying float vShade;
  void main() {
    gl_FragColor = vec4(mix(vec3(0.02, 0.01, 0.015), vec3(0.11, 0.03, 0.05), vShade), 1.0);
  }
`

// Silhueta: corpo, cabeça, cauda e duas asas. span diz o quanto cada vértice bate.
const RAVEN_SHAPE = [
  [1.15, 0, 0, 0], [0.55, 0.13, 0, 0], [0.55, -0.13, 0, 0],
  [0.55, 0.15, 0, 0], [-0.55, 0, 0, 0], [0.55, -0.15, 0, 0],
  [-0.4, 0, 0, 0], [-1.05, 0.28, 0, 0], [-1.05, -0.28, 0, 0],
  [0.5, 0.1, 0, 0], [-0.2, 0.1, 0, 0], [0.1, 0.72, 0.1, 0.65],
  [0.1, 0.72, 0.1, 0.65], [-0.2, 0.1, 0, 0], [-0.45, 1.55, 0.1, 1],
  [0.5, -0.1, 0, 0], [0.1, -0.72, 0.1, -0.65], [-0.2, -0.1, 0, 0],
  [0.1, -0.72, 0.1, -0.65], [-0.45, -1.55, 0.1, -1], [-0.2, -0.1, 0, 0],
]

const random = (min, max) => min + Math.random() * (max - min)

// Devolve o que anima e libera a cena. config: { x, y, radius, height, ravens }.
export function createDemonGlobe(config, parent) {
  const group = new THREE.Group()
  group.position.set(config.x, config.y, 0)
  parent.add(group)

  const time = { value: 0 }

  // Hemisfério com o polo em +Z, achatado para a câmera caber por cima dele.
  const shell = new THREE.SphereGeometry(1, 96, 40, 0, Math.PI * 2, 0, Math.PI / 2)
  shell.rotateX(Math.PI / 2)
  const globeMaterial = new THREE.ShaderMaterial({
    uniforms: { time },
    vertexShader: GLOBE_VERTEX,
    fragmentShader: GLOBE_FRAGMENT,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const globe = new THREE.Mesh(shell, globeMaterial)
  globe.scale.set(config.radius, config.radius, config.height)
  globe.renderOrder = 1.5
  group.add(globe)

  const ravens = new THREE.InstancedBufferGeometry()
  ravens.setAttribute('position', new THREE.Float32BufferAttribute(RAVEN_SHAPE.flatMap(v => v.slice(0, 3)), 3))
  ravens.setAttribute('span', new THREE.Float32BufferAttribute(RAVEN_SHAPE.map(v => v[3]), 1))
  ravens.instanceCount = config.ravens
  const orbit = []
  const flight = []
  for (let i = 0; i < config.ravens; i++) {
    // Órbita um pouco fora do globo; altura relativa à dele; ângulo inicial; tamanho.
    orbit.push(random(0.96, 1.2), random(0.25, 1.15), random(0, Math.PI * 2), random(8, 15))
    // Quase todos giram no mesmo sentido, como um bando, e alguns vão contra.
    flight.push(random(0.05, 0.13) * (Math.random() < 0.8 ? 1 : -1), random(5, 9))
  }
  ravens.setAttribute('orbit', new THREE.InstancedBufferAttribute(new Float32Array(orbit), 4))
  ravens.setAttribute('flight', new THREE.InstancedBufferAttribute(new Float32Array(flight), 2))
  const ravenMaterial = new THREE.ShaderMaterial({
    uniforms: { time, globe: { value: new THREE.Vector3(config.radius, config.height, 0) } },
    vertexShader: RAVEN_VERTEX,
    fragmentShader: RAVEN_FRAGMENT,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  })
  const flock = new THREE.Mesh(ravens, ravenMaterial)
  flock.frustumCulled = false
  // Por cima das nuvens: os corvos são o que mais chama a atenção de longe.
  flock.renderOrder = 2.5
  group.add(flock)

  return {
    update(elapsed) {
      time.value = elapsed
    },
    dispose() {
      parent.remove(group)
      shell.dispose()
      globeMaterial.dispose()
      ravens.dispose()
      ravenMaterial.dispose()
    },
  }
}
