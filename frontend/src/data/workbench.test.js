import { describe, expect, it } from 'vitest'
import { chances, faceOutcome, materialCost, splitComponents, stationOf, tierOf } from './workbench.js'

describe('bancada', () => {
  it('cada face do d20 segue a regra do back', () => {
    expect(faceOutcome(20, 0, 30, 20)).toBe('masterwork')
    expect(faceOutcome(19, 0, 10, 19)).toBe('masterwork')
    expect(faceOutcome(10, 5, 15, 20)).toBe('success')
    expect(faceOutcome(10, 4, 15, 20)).toBe('failed')
    expect(faceOutcome(6, 4, 15, 20)).toBe('ruined')
    expect(faceOutcome(1, 30, 15, 20)).toBe('ruined')
  })

  it('chances em %', () => {
    // bônus +3, CD 13: sucesso com 10+ (11 faces = 55%), Obra-prima só no 20 (5%).
    expect(chances(3, 13, 20)).toEqual({ masterwork: 5, success: 55, failed: 20, ruined: 25 })
  })

  it('materiais e graus', () => {
    expect(materialCost(25)).toBe(13)
    expect(tierOf({ dcs: [13], values: [15, 25, 50] }, 2)).toEqual({ dc: 13, value: 50, cost: 25 })
    expect(tierOf({ dcs: [], values: [] })).toEqual({ dc: null, value: null, cost: null })
  })

  it('separa os componentes', () => {
    expect(splitComponents('2 ml de Cintila Pura, Frutomel e Conjunto de Ofício')).toEqual(['2 ml de Cintila Pura', 'Frutomel', 'Conjunto de Ofício'])
    expect(splitComponents('Estrutura, hastes finas, contas')).toEqual(['Estrutura', 'hastes finas', 'contas'])
    expect(splitComponents(null)).toEqual([])
  })

  it('estação pelo ofício', () => {
    expect(stationOf('alquimista')).toBe('alchemy')
    expect(stationOf('nao-existe')).toBe('forge')
  })
})
