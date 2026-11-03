import * as THREE from 'three'
import { createRavenFlock } from './ravens.js'

// Globo demoníaco: domo redondo e liso, com veias que correm e pulsam como um coração, e corvos em volta.
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
    float facing = clamp(abs(dot(normalize(vNormal), normalize(vView))), 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.4);
    // Brilho na base, onde a cúpula encosta no chão.
    float base = 1.0 - smoothstep(0.0, 0.12, vLocal.z);
    vec2 p = vLocal.xy * 3.2;
    float warp = fbm(p + time * 0.05);
    // Veias: as linhas finas onde o ruído passa pelo meio da sua faixa.
    float veins = smoothstep(0.05, 0.0, abs(fbm(p + warp * 2.0 - time * 0.03) - 0.48));
    float beat = pow(0.5 + 0.5 * sin(time * 1.7), 6.0) + 0.6 * pow(0.5 + 0.5 * sin(time * 1.7 - 0.7), 10.0);
    vec3 blood = vec3(0.32, 0.01, 0.02);
    vec3 fire = vec3(1.0, 0.16, 0.04);
    vec3 color = mix(blood, fire, clamp(rim + base * 0.6 + veins * (0.45 + beat * 0.55), 0.0, 1.0));
    float alpha = 0.3 + warp * 0.14 + rim * 0.62 + base * 0.3 + veins * (0.24 + beat * 0.3) + beat * 0.05;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.95));
  }
`

// Devolve o que anima e libera a cena. config: { x, y, radius, height, flightHeight, ravens, flocks }.
export function createDemonGlobe(config, parent) {
  const group = new THREE.Group()
  group.position.set(config.x, config.y, 0)
  parent.add(group)
  const time = { value: 0 }

  // Hemisfério unitário com o polo em +Z, no tamanho do domo.
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

  // Os corvos contornam o domo, um pouco além da base.
  const flock = createRavenFlock(config, [config.radius * 1.12, config.radius * 1.12], 8)
  group.add(flock.mesh)

  return {
    update(elapsed) {
      time.value = elapsed
      flock.time.value = elapsed
    },
    dispose() {
      parent.remove(group)
      shell.dispose()
      globeMaterial.dispose()
      flock.dispose()
    },
  }
}
