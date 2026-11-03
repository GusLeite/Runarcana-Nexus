import { describe, expect, it } from 'vitest'
import { MAP_LANDMARKS } from './landmarkData.js'
import { MAP_SIZE } from './mapMath.js'

describe('marcos 3D', () => {
  it('têm slug único, ficam dentro do mapa e cada modelo tem arquivo e textura', () => {
    const slugs = MAP_LANDMARKS.map(l => l.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const landmark of MAP_LANDMARKS) {
      expect(Math.abs(landmark.x)).toBeLessThanOrEqual(MAP_SIZE / 2)
      expect(Math.abs(landmark.y)).toBeLessThanOrEqual(MAP_SIZE / 2)
      expect(landmark.models.length).toBeGreaterThan(0)
      for (const model of landmark.models) {
        expect(model.obj).toMatch(/\.obj$/)
        expect(model.texture).toMatch(/\.(jpg|png)$/)
        expect(model.scale).toBeGreaterThan(0)
        expect(model.offset).toHaveLength(3)
      }
    }
  })

  it('o Disco Solar, o Vazio e Targon estão no mapa', () => {
    const slugs = MAP_LANDMARKS.map(l => l.slug)
    expect(slugs).toEqual(expect.arrayContaining(['sun-disc', 'the-void', 'mount-targon', 'ixaocan']))
  })
})
