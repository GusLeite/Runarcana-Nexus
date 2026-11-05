import { describe, expect, it } from 'vitest'
import { simulate } from './diceScene'
import { DICE_SIDES, diceShape, upIndex } from './diceShapes'

// A física de verdade (cannon-es), sem desenhar: depois de trocar os números, a face que ficou para cima
// no último quadro gravado mostra o valor pedido, para todo tipo de dado.
describe('dice3d/diceScene simulate', () => {
  it.each(DICE_SIDES)('d%i cai no valor pedido', sides => {
    for (let round = 0; round < 6; round++) {
      const values = [1 + ((round * 7) % sides), sides, 1]
      const dice = values.map(value => ({ sides, value }))
      const sim = simulate(dice, { x: 8, z: 5 })
      const last = sim.frames[sim.frames.length - 1]
      dice.forEach((d, i) => {
        const q = { x: last[i * 7 + 3], y: last[i * 7 + 4], z: last[i * 7 + 5], w: last[i * 7 + 6] }
        const up = upIndex(diceShape(sides), q)
        expect(sim.labels[i][up]).toBe(d.value)
        // parado em cima do chão e dentro das paredes
        expect(last[i * 7 + 1]).toBeLessThan(2)
        expect(Math.abs(last[i * 7])).toBeLessThanOrEqual(8.5)
        expect(Math.abs(last[i * 7 + 2])).toBeLessThanOrEqual(5.5)
      })
      expect(sim.frames.length).toBeGreaterThan(30)
    }
  })

  it.each([['tela cheia', { x: 8, z: 5 }], ['palco do canto', { x: 3.6, z: 2.3 }]])('%s: para em média em menos de 4 s, no valor pedido', (_, half) => {
    let frames = 0
    for (let i = 0; i < 12; i++) {
      const dice = [{ sides: 20, value: 1 + i }, { sides: 20, value: 20 - i }]
      const sim = simulate(dice, half)
      frames += sim.frames.length
      const last = sim.frames[sim.frames.length - 1]
      dice.forEach((d, j) => {
        const q = { x: last[j * 7 + 3], y: last[j * 7 + 4], z: last[j * 7 + 5], w: last[j * 7 + 6] }
        expect(sim.labels[j][upIndex(diceShape(20), q)]).toBe(d.value)
        expect(Math.abs(last[j * 7])).toBeLessThanOrEqual(half.x + 0.5)
        expect(Math.abs(last[j * 7 + 2])).toBeLessThanOrEqual(half.z + 0.5)
      })
    }
    expect(frames / 12).toBeLessThan(240)
  })

  it('grava batidas para o som', () => {
    const sim = simulate([{ sides: 20, value: 20 }], { x: 8, z: 5 })
    expect(sim.clacks.size).toBeGreaterThan(0)
    sim.clacks.forEach(v => expect(v).toBeGreaterThan(0))
  })
})
