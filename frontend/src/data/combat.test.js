import { describe, expect, it } from 'vitest'
import { applyHp, gameTime, mod, nextUp, parseAttacks, portraitOf } from './combat.js'

describe('combate', () => {
  it('modificador de atributo', () => {
    expect(mod(10)).toBe(0)
    expect(mod(15)).toBe(2)
    expect(mod(7)).toBe(-2)
  })

  it('dano gasta os temporários antes e cura não passa do máximo', () => {
    expect(applyHp({ currentHp: 10, maxHp: 20, tempHp: 4 }, 'damage', 6)).toEqual({ currentHp: 8, tempHp: 0 })
    expect(applyHp({ currentHp: 3, maxHp: 20, tempHp: 0 }, 'damage', 9)).toEqual({ currentHp: 0, tempHp: 0 })
    expect(applyHp({ currentHp: 18, maxHp: 20, tempHp: 0 }, 'heal', 9)).toEqual({ currentHp: 20, tempHp: 0 })
  })

  it('próximo da ordem pula derrotados e dá a volta', () => {
    const order = [{ id: 1 }, { id: 2, defeated: true }, { id: 3 }]
    expect(nextUp(order, null).id).toBe(1)
    expect(nextUp(order, 1).id).toBe(3)
    expect(nextUp(order, 3).id).toBe(1)
    expect(nextUp([{ id: 1, defeated: true }], null)).toBeNull()
  })

  it('lê bônus de ataque e dano do texto', () => {
    const [bite, claws, note] = parseAttacks('Mordida +4, 2d4+2 perfurante\nGarras (+5) 1d6 + 3\nUiva para chamar a matilha')
    expect(bite).toMatchObject({ hit: 4, damage: '2d4+2' })
    expect(claws).toMatchObject({ hit: 5, damage: '1d6+3' })
    expect(note).toMatchObject({ hit: null, damage: null })
  })

  it('cópias numeradas usam o mesmo retrato', () => {
    expect(portraitOf({ kind: 'ENEMY', name: 'Lobo 1' }).img).toBe(portraitOf({ kind: 'ENEMY', name: 'Lobo 2' }).img)
    expect(portraitOf({ kind: 'ENEMY', name: 'Lobo', image: 'https://x/y.png' }).img).toBe('https://x/y.png')
  })

  it('tempo de jogo pela rodada', () => {
    expect(gameTime(3)).toBe('18 s')
    expect(gameTime(15)).toBe('1,5 min')
  })
})
