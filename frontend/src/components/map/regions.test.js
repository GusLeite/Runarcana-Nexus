import { describe, expect, it } from 'vitest'
import { BANDLE_SPOTS, MAP_PINS, bandleSpot } from './regions.js'

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
