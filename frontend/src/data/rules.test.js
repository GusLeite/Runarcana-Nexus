import { describe, expect, it } from 'vitest'
import {
  addHeritage, carryCapacity, choiceOptionName, heritageTimes, removeHeritage, setHeritageOption, formatFeet,
  addTrait, removeTrait, setTraitDetail, traitTimes, formatPoints, formatKg, formatModifier, grantLabel, groupAbilities, groupSkills, itemStats, modifier, parseDice,
  pointBuySpent, roll4d6DropLowest, rollCheck, rollD20, rollDice, totalValue, totalWeight,
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
      { type: 'HERITAGE' }, { type: 'SPELL', spellLevel: 1 }, { type: 'PASSIVE' }, { type: 'SPELL', spellLevel: 0 }, { type: 'ABILITY' },
    ])
    expect(groups.map(g => g.title)).toEqual(['Habilidades', 'Passivas', 'Truques', 'Magias de 1º círculo', 'Heranças'])
  })
})

describe('criação de personagem', () => {
  it('descreve cada concessão do catálogo', () => {
    expect(grantLabel({ type: 'ATTRIBUTE', attribute: 'INTELLIGENCE', amount: 2 })).toBe('+2 Inteligência')
    expect(grantLabel({ type: 'ATTRIBUTE', attribute: 'CHARISMA', amount: -1 })).toBe('−1 Carisma')
    expect(grantLabel({ type: 'ATTRIBUTE_CHOICE', amount: 1, count: 2 })).toBe('+1 em 2 atributos à escolha')
    expect(grantLabel({ type: 'SKILL', skill: 'ARCANA' })).toBe('Perícia: Arcanismo')
    expect(grantLabel({ type: 'SKILL_CHOICE', count: 1, label: 'Escolha uma' })).toBe('Escolha uma')
    expect(grantLabel({ type: 'SAVING_THROW', attribute: 'WISDOM' })).toBe('Resistência: Sabedoria')
    expect(grantLabel({ type: 'FEATURE', abilityType: 'SPELL', name: 'Raio' })).toBe('Magia: Raio')
    expect(grantLabel({ type: 'FEATURE', name: 'Visão' })).toBe('Passiva: Visão')
    expect(grantLabel({ type: 'HP_BONUS', amount: 1, perLevel: true })).toBe('+1 PV por nível')
    expect(grantLabel({ type: 'HP_BONUS', usesFormula: 'HALF_PROFICIENCY', perLevel: true })).toBe('+½ do bônus de proficiência em PV por nível')
    expect(grantLabel({ type: 'SPEED', feet: 5 })).toBe('+5 pés de deslocamento')
    expect(grantLabel({ type: 'SPEED', feet: 50, value: 'SWIM' })).toBe('+50 pés de natação')
    expect(grantLabel({ type: 'ARMOR_CLASS', name: 'Pele de Árvore', armor: { base: 10 } })).toBe('CA: Pele de Árvore')
    expect(grantLabel({ type: 'AC_BONUS', name: 'Armadura Natural', amount: 1, armor: { unarmoredOnly: true } })).toBe('CA: Armadura Natural +1 sem armadura')
    expect(grantLabel({ type: 'AC_BONUS', name: 'Escorregadio', usesFormula: 'PROFICIENCY' })).toBe('CA: Escorregadio +bônus de proficiência')
    expect(choiceOptionName('ARMOR_CLASS', 'CONSTITUTION')).toBe('Constituição')
    expect(grantLabel({ type: 'SKILL', skill: 'ARCANA', expertise: true })).toBe('Perícia: Arcanismo (especialidade se já tiver)')
    expect(grantLabel({ type: 'EXPERTISE_CHOICE', count: 1 })).toBe('Especialidade em 1 perícia que já tem')
    expect(choiceOptionName('EXPERTISE_CHOICE', 'STEALTH')).toBe('Furtividade')
    expect(choiceOptionName('EXPERTISE_CHOICE', 'CRAFT:chaveiro', [{ id: 'chaveiro', name: 'Chaveiro' }])).toBe('Ofício: Chaveiro')
    expect(choiceOptionName('EXPERTISE_CHOICE', 'SKILL:STEALTH')).toBe('Perícia: Furtividade')
    expect(choiceOptionName('SAVING_THROW_CHOICE', 'WISDOM')).toBe('Sabedoria')
    expect(grantLabel({ type: 'ARMOR_PROFICIENCY', value: 'LIGHT' })).toBe('Armaduras: Leves')
    expect(grantLabel({ type: 'WEAPON_PROFICIENCY', value: 'Rapieiras' })).toBe('Armas: Rapieiras')
    expect(grantLabel({ type: 'SAVING_THROW_CHOICE', count: 1, options: ['WISDOM', 'CHARISMA'] })).toBe('Resistência à escolha: Sabedoria ou Carisma')
    expect(grantLabel({ type: 'SPEED', feet: -5, value: 'ALL' })).toBe('−5 pés de todos os deslocamentos')
    expect(grantLabel({ type: 'GOLD', amount: 10 })).toBe('+10 de ouro')
    expect(grantLabel({ type: 'SIZE_CHOICE', options: ['SMALL', 'MEDIUM'] })).toBe('Tamanho: Pequeno ou Médio')
    expect(grantLabel({ type: 'CRAFT', value: 'ferraria' }, [{ id: 'ferraria', name: 'Ferraria' }])).toBe('Ofício: Ferraria')
    expect(grantLabel({ type: 'CRAFT_CHOICE', count: 1 })).toBe('1 ofício à escolha')
    expect(grantLabel({ type: 'LANGUAGE_CHOICE', count: 1, fromRegion: true })).toBe('1 idioma da região')
    expect(grantLabel({ type: 'HERITAGE_POINTS', amount: 2, value: 'REGION' })).toBe('+2 pontos de Herança de Região')
    expect(grantLabel({ type: 'HERITAGE_POINTS', amount: 1 })).toBe('+1 ponto de Herança')
  })

  it('escolhe, repete e tira Heranças mantendo a opção', () => {
    let picks = addHeritage([], 'colosso')
    picks = addHeritage(picks, 'meio-vastaya')
    picks = setHeritageOption(picks, 'meio-vastaya', 'Marai')
    picks = addHeritage(picks, 'colosso')
    expect(heritageTimes(picks, 'colosso')).toBe(2)
    expect(addHeritage(picks, 'meio-vastaya').at(-1)).toEqual({ id: 'meio-vastaya', option: 'Marai' })
    picks = removeHeritage(picks, 'colosso')
    expect(picks).toEqual([{ id: 'colosso', option: null }, { id: 'meio-vastaya', option: 'Marai' }])
    expect(removeHeritage(picks, 'nao-tem')).toBe(picks)
  })

  it('escolhe, repete e tira traços com a resposta de cada escolha', () => {
    let picks = addTrait([], 'pericia')
    picks = addTrait(picks, 'resistencia-natural')
    picks = addTrait(picks, 'pericia')
    picks = setTraitDetail(picks, 'pericia', 1, 'Segunda')
    expect(traitTimes(picks, 'pericia')).toBe(2)
    expect(picks).toEqual([{ id: 'pericia', detail: null }, { id: 'resistencia-natural', detail: null }, { id: 'pericia', detail: 'Segunda' }])
    expect(removeTrait(picks, 'pericia')).toEqual([{ id: 'pericia', detail: null }, { id: 'resistencia-natural', detail: null }])
    expect(removeTrait(picks, 'nao-tem')).toBe(picks)
    expect(formatPoints(2.5)).toBe('2,5')
    expect(grantLabel({ type: 'HERITAGE_POINTS', amount: 2, value: 'GENERAL' })).toBe('+2 pontos de Herança Geral')
  })

  it('dá nome às opções de cada tipo de escolha', () => {
    expect(choiceOptionName('SIZE_CHOICE', 'SMALL')).toBe('Pequeno')
    expect(choiceOptionName('CRAFT_CHOICE', 'alq', [{ id: 'alq', name: 'Alquimia' }])).toBe('Alquimia')
    expect(choiceOptionName('LANGUAGE_CHOICE', 'Targoniano')).toBe('Targoniano')
    expect(choiceOptionName('PROFICIENCY_CHOICE', 'SKILL:ARCANA')).toBe('Perícia: Arcanismo')
    expect(choiceOptionName('PROFICIENCY_CHOICE', 'CRAFT:alq', [{ id: 'alq', name: 'Alquimista' }])).toBe('Ofício: Alquimista')
    expect(choiceOptionName('PROFICIENCY_CHOICE', 'MARTIAL_WEAPON')).toBe('Arma marcial')
    expect(grantLabel({ type: 'FEATURE', name: 'Resistente', options: ['Ígneo'] })).toBe('Passiva: Resistente (à escolha)')
    expect(grantLabel({ type: 'PROFICIENCY_CHOICE', count: 1 })).toBe('1 proficiência à escolha')
    expect(formatFeet(30)).toBe('30 pés')
  })

  it('soma o custo da compra de pontos', () => {
    const pb = { costs: { 8: 0, 13: 5, 14: 7, 15: 9 } }
    expect(pointBuySpent(pb, { a: 15, b: 14, c: 13, d: 8, e: null })).toBe(21)
  })

  it('rola 4d6 e descarta o menor', () => {
    const seq = [0, 0.5, 0.99, 0.2] // 1, 4, 6, 2 → descarta o 1
    expect(roll4d6DropLowest(() => seq.shift())).toBe(12)
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
