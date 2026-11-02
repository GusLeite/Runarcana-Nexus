import { describe, expect, it } from 'vitest'
import { easeOutCubic } from './useCountUp.js'

describe('easeOutCubic', () => {
  it('vai de 0 a 1 e desacelera no fim', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875)
    // a primeira metade anda mais que a segunda
    expect(easeOutCubic(0.5) - easeOutCubic(0)).toBeGreaterThan(easeOutCubic(1) - easeOutCubic(0.5))
  })
})
