import * as THREE from 'three'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { LANDMARK_DIR } from './landmarkData.js'
import { easeFactor } from './mapMath.js'

// Marcos em 3D (Disco Solar, Ixaocan, Monte Targon…): os mesmos modelos do mapa original, sem luz, só com a textura.
// O shader é o do original (cor da textura + brilho); a opacidade é nossa, para eles surgirem e sumirem suavemente.
const VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const FRAGMENT = `
  uniform float brightness;
  uniform float opacity;
  uniform sampler2D map;
  varying vec2 vUv;
  void main() {
    vec4 col = texture2D(map, vUv);
    col.rgb += brightness;
    gl_FragColor = vec4(col.rgb, col.a * opacity);
  }
`
const FADE = 0.12
const SPIN_PER_SECOND = 60

// landmarks: MAP_LANDMARKS; panGroup: o grupo do mapa. Nada é carregado até haver algum marco.
export function createLandmarks(landmarks, panGroup) {
  let destroyed = false
  const objLoader = new OBJLoader()
  const textureLoader = new THREE.TextureLoader()
  const textures = new Map()
  const materials = []
  const geometries = []
  const entries = landmarks.map(landmark => {
    const group = new THREE.Group()
    group.name = landmark.slug
    group.position.set(landmark.x, landmark.y, landmark.z)
    group.visible = false
    panGroup.add(group)
    return { landmark, group, spins: [], opacity: 0, goal: 0, materials: [] }
  })

  const textureOf = file => {
    if (!textures.has(file)) {
      const texture = textureLoader.load(LANDMARK_DIR + file)
      texture.anisotropy = 4
      textures.set(file, texture)
    }
    return textures.get(file)
  }

  const addModel = (entry, model) => {
    const material = new THREE.ShaderMaterial({
      uniforms: { brightness: { value: 0 }, opacity: { value: 0 }, map: { value: textureOf(model.texture) } },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthTest: true,
      depthWrite: true,
    })
    materials.push(material)
    entry.materials.push(material)
    objLoader.loadAsync(LANDMARK_DIR + model.obj).then(object => {
      if (destroyed) return
      const mesh = object.children[0]
      if (!mesh) return
      geometries.push(mesh.geometry)
      mesh.material = material
      mesh.scale.setScalar(model.scale)
      // O modelo é Y para cima; o mapa é Z para cima.
      mesh.rotation.x = Math.PI / 2
      mesh.rotation.y = model.rotY
      mesh.position.set(...model.offset)
      mesh.renderOrder = 0.9
      entry.group.add(mesh)
      for (const [axis, speed] of Object.entries(model.spin ?? {})) entry.spins.push({ rotation: mesh.rotation, axis, speed })
    }).catch(() => {})
  }

  // Feixe de Targon: plano em pé, aditivo, com a textura subindo.
  const addBeam = (entry, beam) => {
    const texture = textureOf(beam.texture)
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, 6)
    const material = new THREE.MeshBasicMaterial({
      color: 0xd0e7f4, blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false, opacity: 0, map: texture,
    })
    materials.push(material)
    const geometry = new THREE.PlaneGeometry(beam.width, beam.height, 1, 1)
    geometries.push(geometry)
    const mesh = new THREE.Mesh(geometry, material)
    // Em coordenadas do mundo (não do grupo): o feixe nasce no cume e sobe até o céu.
    mesh.position.set(beam.x - entry.landmark.x, beam.y - entry.landmark.y, beam.z - entry.landmark.z)
    mesh.rotation.x = Math.PI / 2
    mesh.renderOrder = 0.95
    entry.group.add(mesh)
    entry.beam = { texture, material }
  }

  for (const entry of entries) {
    for (const model of entry.landmark.models) addModel(entry, model)
    if (entry.landmark.beam) addBeam(entry, entry.landmark.beam)
  }

  return {
    // visible: o zoom está perto o bastante para mostrar os marcos.
    setVisible(visible) {
      for (const entry of entries) entry.goal = visible ? 1 : 0
    },
    update(dt) {
      for (const entry of entries) {
        entry.opacity += (entry.goal - entry.opacity) * easeFactor(FADE, dt)
        if (Math.abs(entry.goal - entry.opacity) < 0.005) entry.opacity = entry.goal
        entry.group.visible = entry.opacity > 0
        if (!entry.group.visible) continue
        for (const material of entry.materials) material.uniforms.opacity.value = entry.opacity
        if (entry.beam) {
          entry.beam.material.opacity = entry.opacity
          entry.beam.texture.offset.y -= 0.06 * dt
        }
        for (const spin of entry.spins) spin.rotation[spin.axis] += spin.speed * SPIN_PER_SECOND * dt
      }
    },
    dispose() {
      destroyed = true
      for (const entry of entries) panGroup.remove(entry.group)
      for (const material of materials) material.dispose()
      for (const geometry of geometries) geometry.dispose()
      for (const texture of textures.values()) texture.dispose()
    },
  }
}
