import * as THREE from 'three'
import { buildRaven, drawRavenAtlas } from './ravenModel.js'

// Bandos de corvos em volta de uma região. Cada ave segue o próprio caminho: oscila, sobe, desce e às vezes mergulha.
const VERTEX = `
  attribute float part;
  attribute float span;
  attribute vec4 path;
  attribute vec4 motion;
  uniform float time;
  uniform vec2 radii;
  uniform float flight;
  varying vec2 vUv;
  varying float vPart;
  varying vec3 vPlace;
  varying vec3 vUp;

  // path: raio relativo, altura relativa, ângulo inicial, tamanho. motion: velocidade, ritmo das asas, fase, inclinação.
  vec3 pathAt(float t) {
    float angle = path.z + t * motion.x;
    float sway = 1.0 + 0.05 * sin(angle * 2.0 + motion.z) + 0.035 * sin(t * 0.7 + motion.z * 2.0);
    float height = flight * path.y + 12.0 * sin(t * 0.5 + motion.z) - 30.0 * pow(max(sin(t * 0.11 + motion.z), 0.0), 14.0);
    return vec3(cos(angle) * radii.x * path.x * sway, sin(angle) * radii.y * path.x * sway, height);
  }

  void main() {
    vec3 here = pathAt(time);
    vec3 ahead = pathAt(time + 0.08);
    vec3 forward = normalize(ahead - here + vec3(1e-4, 0.0, 0.0));
    vec3 up = normalize(vec3(0.0, 0.0, 1.0) - forward * forward.z);
    vec3 left = cross(up, forward);
    // Inclina para dentro da curva, balançando um pouco.
    float roll = motion.w + 0.08 * sin(time * 1.3 + motion.z * 5.0);
    vec3 rolledLeft = left * cos(roll) + up * sin(roll);
    vec3 rolledUp = up * cos(roll) - left * sin(roll);

    float beat = time * motion.y + motion.z * 7.0;
    // Alterna batidas fortes e planeio.
    float effort = mix(0.12, 1.0, smoothstep(-0.2, 0.6, sin(time * 0.31 + motion.z * 3.0)));
    vec3 bird = position;
    if (part > 0.5 && part < 1.5) {
      float s = abs(span);
      float side = sign(span);
      float lifting = max(cos(beat), 0.0) * effort;
      float outer = max(s - 0.62, 0.0);
      // Na subida a asa recolhe a mão e varre para trás; na descida, abre inteira.
      bird.y = side * (s - 0.28 * lifting * outer);
      bird.x -= lifting * 0.26 * outer + 0.05 * outer;
      float arm = sin(beat) * 0.46 * effort + 0.06 + 0.08 * (1.0 - effort);
      float hand = sin(beat - 1.1) * 0.72 * effort + 0.04;
      bird.z += min(s, 0.62) * arm + outer * (arm + hand);
    }
    if (part > 1.5 && part < 2.5) {
      // A cauda abre nas curvas e acompanha o corpo.
      bird.y *= 1.0 + abs(motion.w) * 0.8;
      bird.z += (-0.5 - bird.x) * 0.08 * sin(beat * 0.5);
    }
    bird.z -= sin(beat) * 0.045 * effort;
    bird *= path.w;

    vec3 world = here + forward * bird.x + rolledLeft * bird.y + rolledUp * bird.z;
    vec4 view = modelViewMatrix * vec4(world, 1.0);
    vUv = uv;
    vPart = part;
    vPlace = view.xyz;
    vUp = normalize(mat3(modelViewMatrix) * vec3(0.0, 0.0, 1.0));
    gl_Position = projectionMatrix * view;
  }
`

const FRAGMENT = `
  uniform sampler2D atlas;
  varying vec2 vUv;
  varying float vPart;
  varying vec3 vPlace;
  varying vec3 vUp;
  void main() {
    if (vPart > 3.5) {
      gl_FragColor = vec4(1.0, 0.2, 0.05, 1.0);
      return;
    }
    vec3 albedo = vec3(0.035, 0.034, 0.05);
    if (vPart > 0.5 && vPart < 2.5) {
      vec4 feathers = texture2D(atlas, vUv);
      if (feathers.a < 0.5) discard;
      albedo = feathers.rgb;
    }
    if (vPart > 2.5) albedo = vec3(0.075, 0.07, 0.075);

    vec3 normal = normalize(cross(dFdx(vPlace), dFdy(vPlace)));
    vec3 toEye = normalize(-vPlace);
    if (dot(normal, toEye) < 0.0) normal = -normal;
    vec3 light = normalize(vUp * 0.85 + toEye * 0.35 + vec3(0.25, 0.1, 0.0));
    float diffuse = max(dot(normal, light), 0.0);
    float sky = 0.5 + 0.5 * dot(normal, vUp);
    float ground = max(-dot(normal, vUp), 0.0);
    float sheen = pow(max(dot(normal, normalize(light + toEye)), 0.0), 30.0);
    float rim = pow(1.0 - max(dot(normal, toEye), 0.0), 3.0);
    // Pena preta com brilho azul-violeta por cima e o vermelho do globo refletido por baixo.
    vec3 color = albedo * (0.45 + 1.05 * diffuse)
      + albedo * vec3(0.45, 0.42, 0.75) * sky * 0.25
      + vec3(0.2, 0.025, 0.018) * ground * 0.6
      + vec3(0.2, 0.19, 0.4) * sheen * 0.35
      + vec3(0.14, 0.025, 0.025) * rim * 0.45;
    gl_FragColor = vec4(color, 1.0);
  }
`

const random = (min, max) => min + Math.random() * (max - min)

// config: { ravens, flocks, flightHeight }. radii: meia largura e meia altura da região, em unidades do mundo.
export function createRavenFlock(config, radii, maxAnisotropy) {
  const model = buildRaven()
  const geometry = new THREE.InstancedBufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(model.positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(model.uvs, 2))
  geometry.setAttribute('part', new THREE.Float32BufferAttribute(model.parts, 1))
  geometry.setAttribute('span', new THREE.Float32BufferAttribute(model.spans, 1))
  geometry.instanceCount = config.ravens

  // Bandos: cada um com o próprio sentido e altura; dentro dele, as aves vão juntas, sem andar em fila.
  const flocks = Array.from({ length: config.flocks }, (_, i) => ({
    angle: (i / config.flocks) * Math.PI * 2 + random(-0.3, 0.3),
    reach: random(0.86, 1.02),
    lift: random(0.8, 1.4),
    speed: random(0.06, 0.1) * (i % 3 === 2 ? -1 : 1),
  }))
  const path = []
  const motion = []
  for (let i = 0; i < config.ravens; i++) {
    const flock = flocks[i % config.flocks]
    path.push(flock.reach + random(-0.05, 0.05), Math.max(0.5, flock.lift + random(-0.18, 0.18)), flock.angle + random(-0.16, 0.16), random(2.2, 3.2))
    const direction = Math.sign(flock.speed)
    motion.push(flock.speed * random(0.95, 1.05), random(6.5, 8.5), random(0, Math.PI * 2), direction * random(0.18, 0.34))
  }
  geometry.setAttribute('path', new THREE.InstancedBufferAttribute(new Float32Array(path), 4))
  geometry.setAttribute('motion', new THREE.InstancedBufferAttribute(new Float32Array(motion), 4))

  const atlas = new THREE.CanvasTexture(drawRavenAtlas())
  atlas.anisotropy = maxAnisotropy
  const time = { value: 0 }
  const material = new THREE.ShaderMaterial({
    uniforms: { time, atlas: { value: atlas }, radii: { value: new THREE.Vector2(...radii) }, flight: { value: config.flightHeight } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    side: THREE.DoubleSide,
    transparent: true,
    alphaToCoverage: true,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  // Por cima das nuvens: os corvos são o que mais chama a atenção de longe.
  mesh.renderOrder = 2.5

  return {
    mesh,
    time,
    dispose() {
      geometry.dispose()
      material.dispose()
      atlas.dispose()
    },
  }
}
