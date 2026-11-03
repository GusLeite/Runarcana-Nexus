import { describe, expect, it } from 'vitest'
import { CAM_FAR_Z, CAM_NEAR_Z, MAX_TILT, clampPan, easeFactor, focusPan, pinVisible, tileCenter, tileNearView, tiltFor, wheelZoom, worldPerPixel, zoomProgress } from './mapMath.js'

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

describe('pinVisible', () => {
  it('esconde os brasões na entrada e de perto', () => {
    expect(pinVisible('far', 2300)).toBe(false)
    expect(pinVisible('far', CAM_FAR_Z)).toBe(true)
    expect(pinVisible('far', 300)).toBe(false)
  })

  it('mostra os pontos próximos só ao aproximar', () => {
    expect(pinVisible('near', CAM_FAR_Z)).toBe(false)
    expect(pinVisible('near', 300)).toBe(true)
  })

  it('nunca mostra o ponto "hidden"', () => {
    expect(pinVisible('hidden', CAM_FAR_Z)).toBe(false)
    expect(pinVisible('hidden', 300)).toBe(false)
  })

  it('mantém o ponto "any" de longe e de perto, menos na entrada', () => {
    expect(pinVisible('any', 2300)).toBe(false)
    expect(pinVisible('any', CAM_FAR_Z)).toBe(true)
    expect(pinVisible('any', 300)).toBe(true)
  })
})

describe('focusPan', () => {
  it('centraliza o ponto escolhido', () => {
    expect(focusPan(100, -50, 300, 16 / 9, 800)).toEqual({ x: -100, y: 50 })
  })

  it('desloca para o lado quando um painel cobre a tela', () => {
    expect(focusPan(100, -50, 300, 16 / 9, 800, 360).x).toBeLessThan(-100)
  })
})

describe('blocos detalhados', () => {
  it('posiciona o bloco na grade 8x8 em volta do centro do mapa', () => {
    expect(tileCenter(0)).toEqual({ x: -896, y: 896 })
    expect(tileCenter(63)).toEqual({ x: 896, y: -896 })
  })

  it('pede só os blocos perto da vista', () => {
    const atTile = id => ({ x: -tileCenter(id).x, y: -tileCenter(id).y })
    expect(tileNearView(17, atTile(17), CAM_NEAR_Z, 16 / 9)).toBe(true)
    expect(tileNearView(53, atTile(17), CAM_NEAR_Z, 16 / 9)).toBe(false)
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
