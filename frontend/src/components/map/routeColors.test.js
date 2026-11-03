import { describe, expect, it } from 'vitest'
import { ROUTE_COLORS, cssColor, routeColor } from './routeColors.js'

describe('cores das trajetórias', () => {
  it('é a mesma para o mesmo jogador e vem da paleta', () => {
    expect(routeColor('gaudron')).toBe(routeColor('gaudron'))
    expect(ROUTE_COLORS).toContain(routeColor('rudo'))
    expect(ROUTE_COLORS).toContain(routeColor(undefined))
  })

  it('escreve a cor em CSS', () => {
    expect(cssColor(0x4fd1c5)).toBe('#4fd1c5')
    expect(cssColor(0x0000ff)).toBe('#0000ff')
  })
})
