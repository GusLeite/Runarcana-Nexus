import { describe, expect, it } from 'vitest'
import { POI_LEVELS, poiLevel } from './poiLevels.js'
import { pinVisible } from './mapMath.js'

describe('quando cada ponto aparece', () => {
  it('pontos do mestre aparecem de perto; oficiais, conforme o tamanho do lugar', () => {
    expect(poiLevel({ official: false, kind: 'CITY' })).toBe('near')
    expect(poiLevel({ official: true, officialKey: 'sun-disc', kind: 'LANDMARK' })).toBe(POI_LEVELS.major)
    expect(poiLevel({ official: true, officialKey: 'zirima', kind: 'CITY' })).toBe(POI_LEVELS.city)
    expect(poiLevel({ official: true, officialKey: 'qualthala', kind: 'LANDMARK' })).toBe(POI_LEVELS.minor)
  })

  it('lugares menores só surgem com a câmera mais perto', () => {
    const far = 900
    const close = 220
    expect(pinVisible(POI_LEVELS.minor, far)).toBe(false)
    expect(pinVisible(POI_LEVELS.minor, close)).toBe(true)
    expect(pinVisible(POI_LEVELS.city, close)).toBe(true)
  })
})
