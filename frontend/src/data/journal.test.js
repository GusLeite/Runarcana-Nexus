import { describe, expect, it } from 'vitest'
import { sessionSummaries } from './journal.js'

const at = (day, hour) => new Date(2026, 10, day, hour).toISOString()

describe('sessionSummaries', () => {
  it('agrupa por dia e soma o que aconteceu', () => {
    const entries = [
      { kind: 'DOWNED', who: 'Nyx', title: 'Nyx caiu a 0 PV', createdAt: at(3, 22) },
      { kind: 'GOLD', who: 'Rudo', title: 'Rudo recebeu 30 PO', createdAt: at(3, 21) },
      { kind: 'LOOT', who: 'Nyx', title: 'Nyx recebeu Adaga', createdAt: at(3, 21) },
      { kind: 'GOLD', who: 'Nyx', title: 'Nyx recebeu 15 PO', createdAt: at(3, 20) },
      { kind: 'DOWNED', who: 'Nyx', title: 'Nyx caiu a 0 PV', createdAt: at(3, 20) },
      { kind: 'NOTE', who: 'Mestre', title: 'Abertura', createdAt: at(3, 19) },
      { kind: 'PLACE', who: 'Mestre', title: 'Novo local revelado: Ruína', createdAt: at(3, 19) },
      { kind: 'LEVEL_UP', who: 'Rudo', title: 'Rudo subiu para o 2º nível', createdAt: at(1, 19) },
    ]
    const [today, before] = sessionSummaries(entries)
    expect(today.date).toBe('2026-11-03')
    expect(today.gold).toBe(45)
    expect(today.loot).toEqual(['Nyx recebeu Adaga'])
    expect(today.downed).toEqual(['Nyx'])
    expect(today.notes).toBe(1)
    expect(today.places).toEqual(['Novo local revelado: Ruína'])
    expect(today.people).toEqual(['Nyx', 'Rudo'])
    expect(before.levelUps).toEqual(['Rudo subiu para o 2º nível'])
  })
})
