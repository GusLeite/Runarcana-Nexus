import { describe, expect, it } from 'vitest'
import {
  addHeritage, heritageOptions, carryCapacity, choiceOptionName, critDice, deathSaveResult, situationalFor, heritageTimes, removeHeritage, setHeritageOption, formatFeet,
  addTrait, removeTrait, setTraitDetail, traitTimes, formatPoints, formatKg, formatModifier, grantLabel, groupAbilities, groupSkills, itemStats, modifier, parseDice,
  pointBuySpent, roll4d6DropLowest, rollCheck, rollD20, rollDice, totalValue, totalWeight,
  resourceCost, togglePick, levelChoices, keepChoices, dominantChoices, senseLabel, formEffects, rollDie, applyHp,
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

  it('dá uma opção a cada escolha da Herança com optionPerPick', () => {
    let picks = addHeritage([], 'forma-de-shoma', true)
    picks = setHeritageOption(picks, 'forma-de-shoma', 'Íbex', 0)
    picks = addHeritage(picks, 'forma-de-shoma', true)
    expect(heritageOptions(picks, 'forma-de-shoma')).toEqual(['Íbex', null])
    picks = setHeritageOption(picks, 'forma-de-shoma', 'Humana', 1)
    expect(heritageOptions(picks, 'forma-de-shoma')).toEqual(['Íbex', 'Humana'])
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

describe('escolha de recursos de classe', () => {
  it('troca quando só cabe um e não passa do máximo', () => {
    expect(togglePick(['a'], 'b', 1)).toEqual(['b'])
    expect(togglePick(['a', 'b'], 'c', 2)).toEqual(['a', 'b'])
    expect(togglePick(['a', 'b'], 'a', 2)).toEqual(['b'])
    expect(togglePick([], 'a', Infinity)).toEqual(['a'])
  })

  it('Vel sem custo conta 1 ponto', () => {
    expect(resourceCost({ cost: 3 })).toBe(3)
    expect(resourceCost({})).toBe(1)
    expect(resourceCost(undefined)).toBe(1)
  })
})

describe('ganho de recurso de classe', () => {
  it('descreve a escolha de recurso', () => {
    expect(grantLabel({ type: 'RESOURCE_CHOICE', value: 'IRA', count: 1 })).toBe('Ira à escolha')
    expect(grantLabel({ type: 'RESOURCE_CHOICE', value: 'VEL', amount: 1 })).toBe('Vel (opcional, até 1 ◆)')
    expect(grantLabel({ type: 'RESOURCE_CHOICE', value: 'SUTRA', label: 'Sutra Shojin' })).toBe('Sutra Shojin')
  })
})

describe('equipamento inicial', () => {
  const items = [{ id: 'besta-leve', name: 'Besta Leve', category: 'Simples à Distância' }, { id: 'virotes-de-besta', name: 'Virotes de besta (20)' },
    { id: 'machadinha', name: 'Machadinha', category: 'Simples Corpo a Corpo' }]
  it('mostra o nome dos itens da opção', () => {
    expect(choiceOptionName('EQUIPMENT_CHOICE', 'besta-leve+virotes-de-besta', [], items)).toBe('Besta Leve + Virotes de besta (20)')
    expect(choiceOptionName('EQUIPMENT_CHOICE', 'machadinha*2', [], items)).toBe('Machadinha ×2')
    expect(grantLabel({ type: 'EQUIPMENT', value: 'machadinha*2' }, [], items)).toBe('Equipamento: Machadinha ×2')
    expect(grantLabel({ type: 'EQUIPMENT_CHOICE', label: 'Equipamento: conjunto' })).toBe('Equipamento: conjunto')
  })
})

describe('magias na criação', () => {
  it('rótulos das concessões de magia', () => {
    expect(grantLabel({ type: 'SPELL_CHOICE', count: 3, spellLevel: 0 })).toBe('3 truques à escolha')
    expect(grantLabel({ type: 'SPELL_CHOICE', count: 4, spellLevel: 1, label: 'Magias conhecidas' })).toBe('Magias conhecidas')
    expect(grantLabel({ type: 'MYSTERY', value: 'necromancia' })).toBe('Mistério: Necromancia')
    expect(grantLabel({ type: 'SPELL', value: 'maos-magicas' })).toBe('Magia: Maos magicas')
  })
})

describe('subida de nível', () => {
  const choices = [
    { key: 'class:ARCANIST:1' },
    { key: 'level:4:class:ARCANIST:0' },
    { key: 'resource:aumento-atributo-2@level:4:class:ARCANIST:0:1' },
    { key: 'level:14:class:FIGHTER:0' },
  ]

  it('separa as escolhas do nível, com as internas dos recursos', () => {
    expect(levelChoices(choices, 4).map(c => c.key)).toEqual([
      'level:4:class:ARCANIST:0', 'resource:aumento-atributo-2@level:4:class:ARCANIST:0:1'])
    expect(levelChoices(choices, 1)).toEqual([])
  })

  it('põe a escolha interna logo depois da que a criou', () => {
    const shuffled = [choices[2], { key: 'level:4:class:ARCANIST:1' }, choices[1]]
    expect(levelChoices(shuffled, 4).map(c => c.key)).toEqual([
      'level:4:class:ARCANIST:1', 'level:4:class:ARCANIST:0', 'resource:aumento-atributo-2@level:4:class:ARCANIST:0:1'])
  })

  it('mostra a fonte dominante ainda não escolhida, ou a que está sendo escolhida agora', () => {
    const dom = [{ key: 'dominant:Fonte Dominante:0', selected: [] }, { key: 'level:4:class:ARCANIST:0' }]
    expect(dominantChoices(dom, {}).map(c => c.key)).toEqual(['dominant:Fonte Dominante:0'])
    const done = [{ key: 'dominant:Fonte Dominante:0', selected: ['Fonte Estável'] }]
    expect(dominantChoices(done, {})).toEqual([])
    expect(dominantChoices(done, { 'dominant:Fonte Dominante:0': ['Fonte Estável'] })).toHaveLength(1)
  })

  it('tira as escolhas que sumiram da prévia', () => {
    expect(keepChoices({ 'level:4:class:ARCANIST:0': ['x'], 'level:4:class:BRUTE:0': ['y'] }, choices))
      .toEqual({ 'level:4:class:ARCANIST:0': ['x'] })
  })

  it('rola o dado de vida entre 1 e o lado', () => {
    expect(rollDie(8, () => 0)).toBe(1)
    expect(rollDie(8, () => 0.999)).toBe(8)
  })
})

describe('pontos de vida', () => {
  const hp = { currentHp: 20, tempHp: 5, maxHp: 30 }

  it('dano gasta os temporários primeiro e não passa de 0', () => {
    expect(applyHp(hp, 'damage', 3)).toEqual({ currentHp: 20, tempHp: 2 })
    expect(applyHp(hp, 'damage', 8)).toEqual({ currentHp: 17, tempHp: 0 })
    expect(applyHp(hp, 'damage', 99)).toEqual({ currentHp: 0, tempHp: 0 })
  })

  it('cura até o máximo, sem mexer nos temporários', () => {
    expect(applyHp(hp, 'heal', 4)).toEqual({ currentHp: 24, tempHp: 5 })
    expect(applyHp(hp, 'heal', 50)).toEqual({ currentHp: 30, tempHp: 5 })
  })

  it('PV temporários trocam pelo valor novo; valor inválido não muda nada', () => {
    expect(applyHp(hp, 'temp', 8)).toEqual({ currentHp: 20, tempHp: 8 })
    expect(applyHp(hp, 'damage', 'abc')).toEqual({ currentHp: 20, tempHp: 5 })
    expect(applyHp(hp, 'heal', -5)).toEqual({ currentHp: 20, tempHp: 5 })
  })
})

describe('critDice', () => {
  it('multiplica os dados e soma o bônus uma vez', () => {
    expect(critDice('1d8+3', 3)).toBe('3d8+3')
    expect(critDice('2d6-1')).toBe('4d6-1')
    expect(critDice('2', 2)).toBeNull()
  })
})

describe('deathSaveResult', () => {
  it('segue o d20: 20 volta, 1 são duas falhas, 10+ sucesso', () => {
    expect(deathSaveResult(20, 1, 2)).toEqual({ successes: 0, failures: 0, revived: true })
    expect(deathSaveResult(1, 0, 2)).toEqual({ successes: 0, failures: 3, revived: false })
    expect(deathSaveResult(10, 2, 0)).toEqual({ successes: 3, failures: 0, revived: false })
    expect(deathSaveResult(9, 0, 0)).toEqual({ successes: 0, failures: 1, revived: false })
  })
})

describe('situationalFor', () => {
  it('acha as notas do alvo, com as gerais de salvaguarda', () => {
    const sheet = { situational: [
      { target: 'SKILL:STEALTH', note: 'Vantagem no escuro.', source: 'Aprimoramento: Sagaz' },
      { target: 'SAVE', note: 'Vantagem contra magia.', source: 'Herança: Resistência Mágica' },
    ] }
    expect(situationalFor(sheet, 'SKILL:STEALTH')).toEqual(['Sagaz: Vantagem no escuro.'])
    expect(situationalFor(sheet, 'SAVE:WISDOM')).toEqual(['Resistência Mágica: Vantagem contra magia.'])
    expect(situationalFor(sheet, 'AC')).toEqual([])
  })
})

describe('senseLabel', () => {
  it('dá o nome do sentido, onde vale e o alcance', () => {
    expect(senseLabel('DARKVISION', 60)).toBe('Visão no escuro 60 pés')
    expect(senseLabel("DARKVISION|debaixo d'água", 30)).toBe("Visão no escuro (debaixo d'água) 30 pés")
    expect(senseLabel('TELEPATHY', 60)).toBe('Telepatia 60 pés')
  })
})

describe('formEffects', () => {
  it('resume atributos, deslocamentos e tamanho da forma', () => {
    expect(formEffects({ attributes: 'STRENGTH:2,DEXTERITY:4', speeds: 'WALK:50.0', size: 'UP' })).toBe('FOR +2, DES +4 · caminhada 50 pés · tamanho +1')
    expect(formEffects({ attributes: 'CONSTITUTION:P', speeds: 'FLY:60.0' })).toBe('CON +½ prof. · voo 60 pés')
    expect(formEffects({})).toBe('')
  })
})
