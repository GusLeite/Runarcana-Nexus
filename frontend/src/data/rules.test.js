import { describe, expect, it } from 'vitest'
import {
  carryCapacity, formatKg, formatModifier, groupAbilities, groupSkills, itemStats, modifier, parseDice, rollCheck,
  rollD20, rollDice, totalValue, totalWeight,
} from './rules.js'

describe('modificadores', () => {
  it('segue a tabela do 5e', () => {
    expect(modifier(1)).toBe(-5)
    expect(modifier(9)).toBe(-1)
    expect(modifier(10)).toBe(0)
    expect(modifier(11)).toBe(0)
    expect(modifier(18)).toBe(4)
    expect(modifier(20)).toBe(5)
  })

  it('formata com sinal', () => {
    expect(formatModifier(3)).toBe('+3')
    expect(formatModifier(0)).toBe('+0')
    expect(formatModifier(-1)).toBe('−1')
  })
})

describe('inventário', () => {
  it('soma o peso pela quantidade e ignora itens sem peso', () => {
    const inv = [{ weight: 2, quantity: 1 }, { weight: 0.5, quantity: 3 }, { weight: null, quantity: 4 }]
    expect(totalWeight(inv)).toBe(3.5)
  })

  it('soma o valor pela quantidade e ignora itens sem preço', () => {
    expect(totalValue([{ price: 50, quantity: 3 }, { price: null, quantity: 1 }, { price: 120, quantity: 1 }])).toBe(270)
  })

  it('calcula a carga máxima pela Força', () => {
    expect(carryCapacity(9)).toBe(67.5)
    expect(formatKg(67.5)).toBe('67,5 kg')
  })

  it('descreve arma e armadura', () => {
    expect(itemStats({ damage: '1d6', damageType: 'B', properties: ['VERSATILE', 'LIGHT'] }))
      .toEqual(['Dano 1d6 contundente', 'Versátil · Leve'])
    expect(itemStats({ armorClass: 14, armorWeight: 'MEDIUM' })).toEqual(['CA 14 · Média'])
    expect(itemStats({ name: 'Corda' })).toEqual([])
  })
})

describe('perícias', () => {
  it('agrupa pelo atributo na ordem da ficha', () => {
    const groups = groupSkills([
      { skill: 'PERCEPTION', attribute: 'WISDOM' },
      { skill: 'ATHLETICS', attribute: 'STRENGTH' },
      { skill: 'ARCANA', attribute: 'INTELLIGENCE' },
    ])
    expect(groups.map(g => g.attr.abbr)).toEqual(['FOR', 'INT', 'SAB'])
  })
})

describe('expressões de dados', () => {
  it('entende NdM com bônus', () => {
    expect(parseDice('2d6+4')).toEqual({ count: 2, sides: 6, bonus: 4 })
    expect(parseDice(' 1d8 - 1 ')).toEqual({ count: 1, sides: 8, bonus: -1 })
    expect(parseDice('d6')).toBeNull()
    expect(parseDice('muito')).toBeNull()
  })

  it('rola e soma', () => {
    const r = rollDice('3d6+2', () => 0.5)
    expect(r.rolls).toEqual([4, 4, 4])
    expect(r.total).toBe(14)
  })
})

describe('vantagem e desvantagem', () => {
  const seq = values => () => values.shift()
  it('fica com o maior na vantagem e o menor na desvantagem', () => {
    expect(rollCheck('adv', seq([0.1, 0.9]))).toEqual({ d20: 19, other: 3 })
    expect(rollCheck('dis', seq([0.1, 0.9]))).toEqual({ d20: 3, other: 19 })
    expect(rollCheck('normal', seq([0.5]))).toEqual({ d20: 11, other: null })
  })
})

describe('magias e habilidades', () => {
  it('agrupa habilidades, passivas e magias por círculo', () => {
    const groups = groupAbilities([
      { type: 'SPELL', spellLevel: 1 }, { type: 'PASSIVE' }, { type: 'SPELL', spellLevel: 0 }, { type: 'ABILITY' },
    ])
    expect(groups.map(g => g.title)).toEqual(['Habilidades', 'Passivas', 'Truques', 'Magias de 1º círculo'])
  })
})

describe('d20', () => {
  it('fica entre 1 e 20', () => {
    expect(rollD20(() => 0)).toBe(1)
    expect(rollD20(() => 0.999999)).toBe(20)
    for (let i = 0; i < 200; i++) {
      const r = rollD20()
      expect(r).toBeGreaterThanOrEqual(1)
      expect(r).toBeLessThanOrEqual(20)
    }
  })
})
