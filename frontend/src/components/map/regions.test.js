import { describe, expect, it } from 'vitest'
import { BANDLE_SPOTS, FOG_AREAS, FOG_REGIONS, MAP_DOMES, MAP_GLOBE, MAP_PINS, bandleSpot, nearestRegion } from './regions.js'
import { trailPath } from './partyLayers.js'

describe('Bandópolis', () => {
  it('tem um lugar para cada face do d10', () => {
    expect(BANDLE_SPOTS).toHaveLength(10)
    for (let roll = 1; roll <= 10; roll++) expect(bandleSpot(roll)).toBe(BANDLE_SPOTS[roll - 1])
  })

  it('cada face leva a uma região diferente do mapa', () => {
    const names = BANDLE_SPOTS.map(spot => spot.region)
    expect(new Set(names).size).toBe(10)
    const regions = MAP_PINS.filter(pin => pin.icon === 'crest').map(pin => pin.name)
    for (const name of names) expect(regions).toContain(name)
  })

  it('não tem lugar antes da primeira rolagem', () => {
    expect(bandleSpot(null)).toBeNull()
  })
})

describe('domos de distorção temporal', () => {
  it('ficam no território de Shurima, ao sul do mapa', () => {
    expect(MAP_DOMES.length).toBeGreaterThan(0)
    for (const dome of MAP_DOMES) {
      expect(dome.x).toBeGreaterThan(-260)
      expect(dome.x).toBeLessThan(290)
      expect(dome.y).toBeGreaterThan(-640)
      expect(dome.y).toBeLessThan(-165)
    }
  })

  it('têm um domo com o tempo correndo ao contrário', () => {
    expect(MAP_DOMES.some(dome => dome.speed < 0)).toBe(true)
  })
})

describe('globo demoníaco', () => {
  const inside = point => Math.hypot(point.x - MAP_GLOBE.x, point.y - MAP_GLOBE.y) < MAP_GLOBE.radius

  it('contém os domos de distorção inteiros', () => {
    for (const dome of MAP_DOMES) {
      expect(Math.hypot(dome.x - MAP_GLOBE.x, dome.y - MAP_GLOBE.y) + dome.radius).toBeLessThan(MAP_GLOBE.radius)
    }
  })

  it('fica sobre o brasão de Shurima', () => {
    expect(inside(MAP_PINS.find(pin => pin.slug === 'shurima'))).toBe(true)
  })

  it('não chega aos brasões vizinhos', () => {
    for (const slug of ['ixtal', 'targon', 'piltover-zaun', 'void']) expect(inside(MAP_PINS.find(pin => pin.slug === slug))).toBe(false)
  })

  it('deixa a câmera passar por cima no zoom máximo', () => {
    expect(MAP_GLOBE.height).toBeLessThan(200)
  })
})

describe('névoa e trilha do grupo', () => {
  it('cobre as 11 regiões, e as sem imagem têm círculo', () => {
    expect(FOG_REGIONS).toHaveLength(11)
    expect(FOG_REGIONS).not.toContain('bandle')
    expect(FOG_AREAS['piltover-zaun']).toBeTruthy()
    expect(FOG_AREAS.void).toBeTruthy()
  })

  it('a parada recebe o nome do brasão mais perto', () => {
    expect(nearestRegion(-420, 60).slug).toBe('demacia')
    expect(nearestRegion(-1000, -1000)).toBeNull()
  })

  it('a trilha segue o relevo em passos curtos', () => {
    const path = trailPath([{ x: 0, y: 0 }, { x: 12, y: 0 }], () => 10, 6)
    expect(path).toEqual([[0, 0, 13], [6, 0, 13], [12, 0, 13]])
    expect(trailPath([{ x: 5, y: 5 }], () => 0)).toHaveLength(1)
  })
})
