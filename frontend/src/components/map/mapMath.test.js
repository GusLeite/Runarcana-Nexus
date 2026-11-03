import { describe, expect, it } from 'vitest'
import { CAM_FAR_Z, CAM_NEAR_Z, MAX_TILT, clampPan, easeFactor, tiltFor, wheelZoom, worldPerPixel, zoomProgress } from './mapMath.js'

describe('zoomProgress e tiltFor', () => {
  it('deixa o mapa reto de longe e inclina ao máximo de perto', () => {
    expect(zoomProgress(2300)).toBe(0)
    expect(tiltFor(1200)).toBeCloseTo(0)
    expect(zoomProgress(CAM_NEAR_Z)).toBe(1)
    expect(tiltFor(CAM_NEAR_Z)).toBeCloseTo(-MAX_TILT)
  })

  it('inclina pouco na metade do caminho', () => {
    expect(zoomProgress(700)).toBeCloseTo(0.125)
  })
})

describe('wheelZoom', () => {
  it('aproxima ao rolar para cima e afasta ao rolar para baixo', () => {
    expect(wheelZoom(800, -100)).toBeLessThan(800)
    expect(wheelZoom(800, 100)).toBeGreaterThan(800)
  })

  it('respeita os limites da câmera', () => {
    expect(wheelZoom(CAM_NEAR_Z, -100)).toBe(CAM_NEAR_Z)
    expect(wheelZoom(CAM_FAR_Z, 100)).toBe(CAM_FAR_Z)
  })

  it('limita o passo de um evento muito grande', () => {
    expect(wheelZoom(800, 5000)).toBe(wheelZoom(800, 100))
  })
})

describe('clampPan', () => {
  it('não deixa sair do mapa', () => {
    const pan = clampPan({ x: 99999, y: -99999 }, CAM_NEAR_Z, 16 / 9)
    expect(pan.x).toBeLessThan(1280)
    expect(pan.y).toBeGreaterThan(-768)
  })

  it('libera mais arraste de perto do que de longe', () => {
    const near = clampPan({ x: 99999, y: 0 }, CAM_NEAR_Z, 16 / 9)
    const far = clampPan({ x: 99999, y: 0 }, CAM_FAR_Z, 16 / 9)
    expect(near.x).toBeGreaterThan(far.x)
  })

  it('centraliza quando a vista é maior que o limite', () => {
    expect(clampPan({ x: 500, y: 500 }, 5000, 16 / 9)).toEqual({ x: 0, y: 0 })
  })
})

describe('worldPerPixel', () => {
  it('move menos o mundo por pixel quando a câmera está perto', () => {
    expect(worldPerPixel(CAM_NEAR_Z, 800)).toBeLessThan(worldPerPixel(CAM_FAR_Z, 800))
  })
})

describe('easeFactor', () => {
  it('dá o mesmo resultado em 60 e em 120 quadros por segundo', () => {
    const at120 = 1 - (1 - easeFactor(0.1, 1 / 120)) ** 2
    expect(at120).toBeCloseTo(easeFactor(0.1, 1 / 60))
  })
})
