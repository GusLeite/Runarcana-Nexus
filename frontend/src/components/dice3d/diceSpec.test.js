import { describe, expect, it } from 'vitest'
import { MAX_DICE, diceForRoll } from './diceSpec'

describe('dice3d/diceSpec', () => {
  it('teste de d20: um dado; com vantagem, o descartado escurece', () => {
    expect(diceForRoll({ kind: 'check', d20: 12, other: null })).toEqual({ dice: [{ sides: 20, value: 12 }], effects: {} })
    expect(diceForRoll({ kind: 'check', d20: 15, other: 4 })).toEqual({
      dice: [{ sides: 20, value: 15 }, { sides: 20, value: 4 }], effects: { dim: [1] },
    })
  })

  it('crítico pela margem e falha no 1', () => {
    expect(diceForRoll({ kind: 'check', d20: 19, critRange: 19 }).effects.crit).toBe(0)
    expect(diceForRoll({ kind: 'check', d20: 19 }).effects.crit).toBeUndefined()
    expect(diceForRoll({ kind: 'check', d20: 1 }).effects.fumble).toBe(0)
  })

  it('dano: um dado por resultado', () => {
    expect(diceForRoll({ kind: 'dice', sides: 6, rolls: [3, 5] }).dice).toEqual([{ sides: 6, value: 3 }, { sides: 6, value: 5 }])
  })

  it('sem forma 3D, dados demais ou valor estranho: fica no 2D', () => {
    expect(diceForRoll({ kind: 'dice', sides: 100, rolls: [42] })).toBeNull()
    expect(diceForRoll({ kind: 'dice', sides: 6, rolls: Array(MAX_DICE + 1).fill(1) })).toBeNull()
    expect(diceForRoll({ kind: 'dice', sides: 6, rolls: [7] })).toBeNull()
    expect(diceForRoll(null)).toBeNull()
  })

  it('secreta de outro: d20 na névoa', () => {
    const spec = diceForRoll({ hidden: true, who: 'Mestre' })
    expect(spec.effects.fog).toBe(true)
    expect(spec.dice[0].sides).toBe(20)
  })
})
