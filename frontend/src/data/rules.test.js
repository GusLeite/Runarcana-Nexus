import { describe, expect, it } from 'vitest'
import {
  carryCapacity, formatKg, formatModifier, groupSkills, itemStats, modifier, rollD20, totalWeight,
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
