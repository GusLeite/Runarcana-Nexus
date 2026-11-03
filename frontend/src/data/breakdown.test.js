import { describe, expect, it } from 'vitest'
import { attackExplanation, attributeExplanation, hpExplanation, styleExplanation } from './breakdown.js'
import { ATTRIBUTES } from './rules.js'

const sheet = { str: 16, dex: 12, proficiencyBonus: 3 }
const sum = lines => lines.reduce((n, l) => n + l.amount, 0)

describe('attackExplanation', () => {
  it('soma o modificador do atributo e a proficiência', () => {
    const e = attackExplanation({ name: 'Espada', attribute: 'STRENGTH', proficient: true, attackBonus: 6 }, sheet)
    expect(e.lines).toEqual([{ label: 'Modificador de Força', amount: 3 }, { label: 'Bônus de proficiência', amount: 3 }])
    expect(e.total).toBe(6)
  })

  it('cobre a diferença quando uma troca de atributo muda a conta', () => {
    const e = attackExplanation({ name: 'Adaga', attribute: 'STRENGTH', proficient: false, attackBonus: 5 }, sheet)
    expect(sum(e.lines)).toBe(5)
    expect(e.lines.at(-1).amount).toBe(2)
  })
})

describe('styleExplanation', () => {
  it('acrescenta o que o estilo soma ao ataque normal', () => {
    const attack = { name: 'Espada', attribute: 'STRENGTH', proficient: true, attackBonus: 6 }
    const e = styleExplanation(attack, { name: 'Duelismo', attackBonus: 7 }, sheet)
    expect(e.lines.at(-1)).toEqual({ label: 'Estilo de Luta: Duelismo', amount: 1 })
    expect(sum(e.lines)).toBe(7)
  })
})

describe('atributos e PV', () => {
  const breakdown = {
    attributes: [{ attribute: 'STRENGTH', total: 16, lines: [{ label: 'Valor base', amount: 14 }, { label: 'Origem: Humano', amount: 2 }] }],
    hp: { total: 20, lines: [{ label: 'Dado de vida', amount: 10 }, { label: 'Constituição', amount: 10 }] },
  }

  it('mostra as fontes quando fecham com o total', () => {
    const e = attributeExplanation(breakdown, ATTRIBUTES[0], 16)
    expect(e.lines).toHaveLength(2)
    expect(hpExplanation(breakdown, 20).lines).toHaveLength(2)
  })

  it('cobre a diferença se a ficha mudou depois da conta', () => {
    const e = attributeExplanation(breakdown, ATTRIBUTES[0], 18)
    expect(e.lines.at(-1)).toEqual({ label: 'Outros ajustes', amount: 2 })
  })

  it('devolve nulo sem a conta do back', () => {
    expect(attributeExplanation(null, ATTRIBUTES[0], 16)).toBeNull()
    expect(hpExplanation(null, 20)).toBeNull()
  })
})
