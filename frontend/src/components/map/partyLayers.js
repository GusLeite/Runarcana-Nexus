import * as THREE from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { MAP_SIZE, TERRAIN_HEIGHT, easeFactor } from './mapMath.js'

// Camadas do grupo no mapa: a névoa de guerra por região e a trilha da viagem (linha dourada tracejada sobre o relevo).
const FOG_EASE = 0.035
const GLOW_DECAY = 0.6
const TRAIL_LIFT = 3
const TRAIL_STEP = 6
const TRAIL_WIDTH = 3.5
const DRAW_SECONDS = 1.6
const STOP_RADIUS = 4
const ROUTE_WIDTH = 3

const FOG_VERTEX = `
  uniform sampler2D depthMap;
  uniform float height;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 raised = position;
    raised.z += texture2D(depthMap, uv).b * height + 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(raised, 1.0);
  }
`

// Névoa cinza-azulada que se mexe devagar, no formato da região (máscara) ou num círculo de terra.
// glow: brilho dourado que acende quando a região é revelada e apaga junto com a névoa.
const FOG_FRAGMENT = `
  uniform sampler2D map;
  uniform sampler2D oceanMask;
  uniform float useArea;
  uniform vec2 center;
  uniform float radius;
  uniform float opacity;
  uniform float glow;
  uniform float time;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    float mask;
    if (useArea > 0.5) {
      float land = 1.0 - texture2D(oceanMask, vUv).r;
      mask = land * (1.0 - smoothstep(radius * 0.7, radius, distance(vUv, center)));
    } else {
      mask = texture2D(map, vUv).a;
    }
    float n = noise(vUv * 36.0 + vec2(time * 0.04, time * 0.02)) * 0.6 + noise(vUv * 110.0 - time * 0.06) * 0.4;
    vec3 mist = mix(vec3(0.004, 0.008, 0.012), vec3(0.07, 0.085, 0.105), n);
    mist += vec3(1.0, 0.75, 0.3) * glow * (0.4 + n);
    gl_FragColor = vec4(mist, min(1.0, mask * opacity * (1.0 + 0.1 * n)));
  }
`

// Pontos da trilha a cada TRAIL_STEP unidades, apoiados no relevo (para a linha não atravessar as montanhas).
export function trailPath(points, heightAt, step = TRAIL_STEP) {
  const out = []
  points.forEach((p, i) => {
    if (i === 0) { out.push([p.x, p.y, heightAt(p.x, p.y) + TRAIL_LIFT]); return }
    const a = points[i - 1]
    const steps = Math.max(1, Math.ceil(Math.hypot(p.x - a.x, p.y - a.y) / step))
    for (let s = 1; s <= steps; s++) {
      const x = a.x + (p.x - a.x) * s / steps
      const y = a.y + (p.y - a.y) * s / steps
      out.push([x, y, heightAt(x, y) + TRAIL_LIFT])
    }
  })
  return out
}

export function createPartyLayers({ panGroup, terrainGeometry, depth, ocean, heightAt, fogAreas = {}, renderer }) {
  let destroyed = false
  const fogs = new Map()

  const fogFor = slug => {
    if (fogs.has(slug)) return fogs.get(slug)
    const area = fogAreas[slug]
    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: null },
        oceanMask: { value: ocean },
        useArea: { value: area ? 1 : 0 },
        center: { value: new THREE.Vector2(area ? area.x / MAP_SIZE + 0.5 : 0, area ? area.y / MAP_SIZE + 0.5 : 0) },
        radius: { value: area ? area.radius / MAP_SIZE : 0 },
        depthMap: { value: depth },
        height: { value: TERRAIN_HEIGHT },
        opacity: { value: 0 },
        glow: { value: 0 },
        time: { value: 0 },
      },
      vertexShader: FOG_VERTEX,
      fragmentShader: FOG_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(terrainGeometry, material)
    mesh.renderOrder = 0.6
    mesh.visible = false
    panGroup.add(mesh)
    const fog = { mesh, material, goal: 0, ready: Boolean(area), texture: null }
    fogs.set(slug, fog)
    if (!area) {
      new THREE.TextureLoader().loadAsync(`/map/regions/${slug}.png`).then(texture => {
        if (destroyed) return texture.dispose()
        fog.texture = texture
        fog.ready = true
        material.uniforms.map.value = texture
      }).catch(() => {})
    }
    return fog
  }

  // Trilha: linha larga em pixels (Line2), tracejada e dourada, com um disco em cada parada.
  const lineMaterial = new LineMaterial({
    color: 0xf0c75e, linewidth: TRAIL_WIDTH, dashed: true, dashSize: 10, gapSize: 6, transparent: true, opacity: 0.95,
    depthTest: false, depthWrite: false,
  })
  let line = null
  let drawn = 0
  let drawGoal = 0
  let drawFrom = 0
  let drawElapsed = DRAW_SECONDS
  const stopGeometry = new THREE.CircleGeometry(STOP_RADIUS, 20)
  const stopMaterial = new THREE.MeshBasicMaterial({ color: 0xf0c75e, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false })
  let stops = []

  // Trajetórias dos jogadores: uma linha sólida por rota, na cor do dono, com um disco em cada parada.
  // items: [{ key, color, points, dashed }]; o rascunho em desenho vai como mais um item, tracejado.
  let routeObjects = []
  const clearRoutes = () => {
    for (const r of routeObjects) {
      for (const obj of r.objects) panGroup.remove(obj)
      r.geometry?.dispose()
      r.lineMaterial.dispose()
      r.stopMaterial.dispose()
    }
    routeObjects = []
  }

  const size = new THREE.Vector2()
  const resize = () => {
    renderer.getSize(size)
    lineMaterial.resolution.set(size.x, size.y)
    for (const r of routeObjects) r.lineMaterial.resolution.set(size.x, size.y)
  }
  resize()

  return {
    resize,
    // hidden: regiões encobertas; strength: o quanto cobrem (o mestre vê através).
    setFog(hidden, strength) {
      const set = new Set(hidden)
      for (const slug of set) fogFor(slug)
      for (const [slug, fog] of fogs) {
        const goal = set.has(slug) ? strength : 0
        // Revelou agora: brilho dourado enquanto a névoa se desfaz.
        if (fog.goal > 0 && goal === 0) fog.material.uniforms.glow.value = 1
        fog.goal = goal
      }
    },
    // points: paradas em ordem; a parte nova da linha é desenhada aos poucos.
    setTrail(points, { animate = true } = {}) {
      for (const stop of stops) panGroup.remove(stop)
      stops = points.map(p => {
        const mesh = new THREE.Mesh(stopGeometry, stopMaterial)
        mesh.position.set(p.x, p.y, heightAt(p.x, p.y) + TRAIL_LIFT)
        mesh.renderOrder = 0.8
        panGroup.add(mesh)
        return mesh
      })
      const path = trailPath(points, heightAt)
      if (line) { panGroup.remove(line); line.geometry.dispose(); line = null }
      if (path.length < 2) { drawn = drawGoal = 0; return }
      const geometry = new LineGeometry()
      geometry.setPositions(path.flat())
      line = new Line2(geometry, lineMaterial)
      line.computeLineDistances()
      line.renderOrder = 0.8
      panGroup.add(line)
      const segments = path.length - 1
      drawFrom = animate ? Math.min(drawn, segments) : segments
      drawGoal = segments
      drawElapsed = animate ? 0 : DRAW_SECONDS
      geometry.instanceCount = Math.round(drawFrom)
    },
    setRoutes(items) {
      clearRoutes()
      routeObjects = items.map(item => {
        const lineMat = new LineMaterial({
          color: item.color, linewidth: ROUTE_WIDTH, dashed: Boolean(item.dashed), dashSize: 8, gapSize: 5, transparent: true, opacity: 0.95,
          depthTest: false, depthWrite: false,
        })
        lineMat.resolution.set(size.x, size.y)
        const stopMat = new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false })
        const objects = item.points.map(p => {
          const mesh = new THREE.Mesh(stopGeometry, stopMat)
          mesh.position.set(p.x, p.y, heightAt(p.x, p.y) + TRAIL_LIFT)
          mesh.scale.setScalar(0.75)
          mesh.renderOrder = 0.75
          panGroup.add(mesh)
          return mesh
        })
        let geometry = null
        const path = trailPath(item.points, heightAt)
        if (path.length >= 2) {
          geometry = new LineGeometry()
          geometry.setPositions(path.flat())
          const routeLine = new Line2(geometry, lineMat)
          routeLine.computeLineDistances()
          routeLine.renderOrder = 0.75
          panGroup.add(routeLine)
          objects.push(routeLine)
        }
        return { objects, geometry, lineMaterial: lineMat, stopMaterial: stopMat, dashed: Boolean(item.dashed) }
      })
    },
    update(time, dt) {
      for (const fog of fogs.values()) {
        const u = fog.material.uniforms
        u.opacity.value += (fog.goal - u.opacity.value) * easeFactor(FOG_EASE, dt)
        u.glow.value = Math.max(0, u.glow.value - dt * GLOW_DECAY)
        u.time.value = time
        fog.mesh.visible = fog.ready && (fog.goal > 0 || u.opacity.value > 0.01)
      }
      if (line && drawElapsed < DRAW_SECONDS) {
        drawElapsed += dt
        const t = Math.min(1, drawElapsed / DRAW_SECONDS)
        drawn = drawFrom + (drawGoal - drawFrom) * t
        line.geometry.instanceCount = Math.max(1, Math.round(drawn))
      } else if (line) {
        drawn = drawGoal
        line.geometry.instanceCount = drawGoal
      }
      // A linha "anda": o tracejado desliza na direção da viagem.
      lineMaterial.dashOffset = -time * 8
      for (const r of routeObjects) if (r.dashed) r.lineMaterial.dashOffset = -time * 8
    },
    dispose() {
      destroyed = true
      for (const fog of fogs.values()) {
        fog.material.dispose()
        fog.texture?.dispose()
      }
      clearRoutes()
      if (line) line.geometry.dispose()
      lineMaterial.dispose()
      stopGeometry.dispose()
      stopMaterial.dispose()
    },
  }
}
