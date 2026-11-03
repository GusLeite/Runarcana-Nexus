import { describe, expect, it } from 'vitest'
import { levelUpGains } from './levelGains.js'

const base = {
  level: 4, maxHp: 30, proficiencyBonus: 2, str: 10, dex: 14, con: 12, intel: 16, wis: 10, cha: 8,
  classLevels: [{ classId: 'arcanista', name: 'Arcanista', level: 4 }], subclass: null,
  heritages: ['Sangue Antigo'], crafts: [], languages: ['Comum'],
}

describe('levelUpGains', () => {
  it('lista só o que mudou', () => {
    const before = { character: base, abilities: [{ id: 1, name: 'Bola de Fogo', type: 'SPELL' }] }
    const after = {
      character: {
        ...base, level: 5, maxHp: 37, proficiencyBonus: 3, intel: 18,
        classLevels: [...base.classLevels, { classId: 'combatente', name: 'Combatente Arcano', level: 1 }],
        heritages: ['Sangue Antigo', 'Olhos do Vazio'],
      },
      abilities: [
        { id: 1, name: 'Bola de Fogo', type: 'SPELL' },
        { id: 2, name: 'Relâmpago', type: 'SPELL' },
        { id: 3, name: 'Ataque Extra', type: 'PASSIVE' },
      ],
    }
    const g = levelUpGains(before, after)
    expect(g.fromLevel).toBe(4)
    expect(g.toLevel).toBe(5)
    expect(g.maxHp).toEqual({ from: 30, to: 37 })
    expect(g.proficiency).toEqual({ from: 2, to: 3 })
    expect(g.attributes).toEqual([{ abbr: 'INT', from: 16, to: 18 }])
    expect(g.newClasses).toEqual(['Combatente Arcano'])
    expect(g.spells).toEqual(['Relâmpago'])
    expect(g.abilities).toEqual(['Ataque Extra'])
    expect(g.heritages).toEqual(['Olhos do Vazio'])
    expect(g.languages).toEqual([])
  })

  it('sem mudanças além do nível, os campos ficam vazios', () => {
    const g = levelUpGains({ character: base, abilities: [] }, { character: { ...base, level: 5 }, abilities: [] })
    expect(g.maxHp).toBeNull()
    expect(g.proficiency).toBeNull()
    expect(g.attributes).toEqual([])
    expect(g.subclass).toBeNull()
  })
})
