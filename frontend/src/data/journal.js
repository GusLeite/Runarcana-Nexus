// Resumo das sessões do diário do grupo: um por dia (data local), mais recente primeiro.
const GOLD = /recebeu (\d+) PO$/

export const dayKey = iso => {
  const d = new Date(iso)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export function sessionSummaries(entries) {
  const days = new Map()
  for (const e of entries) {
    const key = dayKey(e.createdAt)
    if (!days.has(key)) days.set(key, { date: key, loot: [], gold: 0, downed: [], documents: [], levelUps: [], notes: 0, people: new Set() })
    const s = days.get(key)
    if (e.who) s.people.add(e.who)
    if (e.kind === 'NOTE') s.notes++
    else if (e.kind === 'LOOT') s.loot.push(e.title)
    else if (e.kind === 'GOLD') s.gold += Number(GOLD.exec(e.title ?? '')?.[1] ?? 0)
    else if (e.kind === 'DOWNED') s.downed.push(e.who)
    else if (e.kind === 'DOCUMENT') s.documents.push(e.title)
    else if (e.kind === 'LEVEL_UP') s.levelUps.push(e.title)
  }
  // As entradas já vêm da mais nova para a mais antiga; as listas de cada dia ficam em ordem cronológica.
  return [...days.values()].map(s => ({
    ...s,
    loot: s.loot.reverse(),
    downed: [...new Set(s.downed.reverse())],
    documents: s.documents.reverse(),
    levelUps: s.levelUps.reverse(),
    people: [...s.people].filter(p => p !== 'Mestre').sort(),
  }))
}
