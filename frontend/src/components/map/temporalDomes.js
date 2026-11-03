import * as THREE from 'three'

// Domos de distorção temporal: cúpula 3D, relógio no chão e poeira presa no tempo.
// speed é o ritmo do tempo dentro de cada domo; negativo corre ao contrário, e tudo nele acompanha.
const DOME_VERTEX = `
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    // A superfície respira em ondas que descem do topo.
    vec3 moved = position + normal * sin(position.z * 9.0 - time * 1.4) * 0.012;
    vec4 view = modelViewMatrix * vec4(moved, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-view.xyz);
    gl_Position = projectionMatrix * view;
  }
`

const DOME_FRAGMENT = `
  uniform float time;
  uniform float seed;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);
    float height = clamp(vLocal.z, 0.0, 1.0);
    // Meridianos e paralelos, como o mostrador de um relógio visto de cima.
    float angle = atan(vLocal.y, vLocal.x);
    float meridians = smoothstep(0.93, 1.0, abs(sin(angle * 6.0)));
    float parallels = smoothstep(0.9, 1.0, abs(sin(height * 15.7 - time * 0.5)));
    float lattice = max(meridians, parallels) * (0.25 + 0.75 * height);
    // Faixa de luz que percorre a cúpula, de tempos em tempos.
    float sweep = fract(time * 0.11 + seed);
    float band = smoothstep(0.09, 0.0, abs(height - sweep));
    vec3 deep = vec3(0.24, 0.04, 0.55);
    vec3 bright = vec3(0.62, 0.32, 1.0);
    vec3 color = mix(deep, bright, clamp(rim + band * 0.7, 0.0, 1.0));
    float fade = smoothstep(0.0, 0.05, height);
    float alpha = (0.24 + rim * 0.62 + lattice * 0.3 + band * 0.35) * mix(0.55, 1.0, fade);
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`

const PLAIN_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Relógio no chão: aro, doze marcas girando e uma onda que sai do centro. A escala vai até 1,3x o raio do domo.
const CLOCK_FRAGMENT = `
  uniform float time;
  uniform float seed;
  varying vec2 vUv;
  const float PI = 3.14159265;
  float ring(float r, float at, float width) {
    return smoothstep(width, 0.0, abs(r - at));
  }
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p) * 1.3;
    float angle = atan(p.y, p.x) + time * 0.22;
    float ticks = smoothstep(0.88, 1.0, cos(angle * 12.0)) * smoothstep(0.92, 0.96, r) * smoothstep(1.14, 1.08, r);
    float hand = smoothstep(0.985, 1.0, cos(angle)) * smoothstep(1.0, 0.1, r);
    float wave = ring(r, fract(time * 0.16 + seed) * 1.3, 0.035) * smoothstep(1.3, 0.7, r);
    float glow = smoothstep(1.28, 0.55, r) * 0.34;
    float marks = ring(r, 1.0, 0.012) + ring(r, 1.12, 0.006) * 0.7 + ticks * 0.9 + hand * 0.45 + wave * 0.6;
    vec3 color = mix(vec3(0.26, 0.05, 0.6), vec3(0.72, 0.45, 1.0), clamp(marks, 0.0, 1.0));
    gl_FragColor = vec4(color, clamp(glow + marks, 0.0, 1.0));
  }
`

// A poeira sobe e volta pelo mesmo caminho, como se o tempo não conseguisse seguir em frente.
const MOTES_VERTEX = `
  attribute vec3 seedValues;
  uniform float time;
  uniform float pixels;
  varying float vLight;
  void main() {
    float phase = time * (0.05 + seedValues.z * 0.08) + seedValues.z * 40.0;
    float lift = abs(fract(phase) * 2.0 - 1.0);
    float angle = seedValues.x * 6.2832 + sin(phase * 3.0) * 0.5;
    float radius = seedValues.y * sqrt(max(1.0 - lift * lift, 0.0)) * 0.9;
    vec3 place = vec3(cos(angle) * radius, sin(angle) * radius, lift * 0.92);
    vec4 view = modelViewMatrix * vec4(place, 1.0);
    vLight = 0.45 + 0.55 * sin(phase * 25.0 + seedValues.x * 50.0);
    gl_PointSize = pixels * (0.8 + seedValues.y * 1.6) * (600.0 / -view.z);
    gl_Position = projectionMatrix * view;
  }
`

const MOTES_FRAGMENT = `
  varying float vLight;
  void main() {
    float dot = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vec3(0.9, 0.72, 1.0), dot * (0.35 + vLight * 0.65));
  }
`

const MOTES_PER_DOME = 46

// Mistura normal na cúpula e no relógio: somar luz sobre a areia clara deixaria tudo rosa em vez de roxo.
const blended = (uniforms, vertexShader, fragmentShader, blending = THREE.NormalBlending) => new THREE.ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader,
  transparent: true,
  blending,
  side: THREE.DoubleSide,
  depthWrite: false,
})

// Põe os domos no grupo do mapa, apoiados no relevo, e devolve o que anima e libera a cena.
export function createTemporalDomes(domes, parent, heightAt) {
  // Hemisfério com o polo em +Z, o "para cima" do mapa.
  const shell = new THREE.SphereGeometry(1, 56, 24, 0, Math.PI * 2, 0, Math.PI / 2)
  shell.rotateX(Math.PI / 2)
  const disc = new THREE.PlaneGeometry(2, 2)
  const pixels = Math.min(window.devicePixelRatio || 1, 2)

  const parts = domes.map((dome, index) => {
    const seed = index * 0.37 % 1
    const base = heightAt(dome.x, dome.y)
    const time = { value: 0 }
    const group = new THREE.Group()
    group.position.set(dome.x, dome.y, base)
    group.scale.setScalar(dome.radius)

    const material = blended({ time, seed: { value: seed } }, DOME_VERTEX, DOME_FRAGMENT)
    const body = new THREE.Mesh(shell, material)
    body.renderOrder = 0.8

    const clockMaterial = blended({ time, seed: { value: seed } }, PLAIN_VERTEX, CLOCK_FRAGMENT)
    clockMaterial.depthTest = false
    const clock = new THREE.Mesh(disc, clockMaterial)
    clock.scale.setScalar(1.3)
    clock.position.z = 0.02
    clock.renderOrder = 0.7

    const seeds = new Float32Array(MOTES_PER_DOME * 3)
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random()
    const motesGeometry = new THREE.BufferGeometry()
    // A posição real sai do shader; este atributo só diz ao Three quantos pontos desenhar.
    motesGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MOTES_PER_DOME * 3), 3))
    motesGeometry.setAttribute('seedValues', new THREE.BufferAttribute(seeds, 3))
    const motesMaterial = blended({ time, pixels: { value: pixels } }, MOTES_VERTEX, MOTES_FRAGMENT, THREE.AdditiveBlending)
    motesMaterial.depthTest = false
    const motes = new THREE.Points(motesGeometry, motesMaterial)
    motes.frustumCulled = false
    motes.renderOrder = 0.9

    group.add(clock, body, motes)
    parent.add(group)
    return { group, time, speed: dome.speed, materials: [material, clockMaterial, motesMaterial], motesGeometry }
  })

  return {
    update(elapsed) {
      for (const part of parts) part.time.value = 500 + elapsed * part.speed
    },
    dispose() {
      for (const part of parts) {
        parent.remove(part.group)
        part.materials.forEach(material => material.dispose())
        part.motesGeometry.dispose()
      }
      shell.dispose()
      disc.dispose()
    },
  }
}
