import { describe, expect, it } from 'vitest'
import catalog from '../../../src/main/resources/rules/criacao.json'
import { SUBCLASS_SIGILS, subclassSigil } from './subclassArt.js'

describe('subclassArt', () => {
  it('tem sigilo para toda subclasse do catálogo, e nenhum sobrando', () => {
    const ids = catalog.classes.flatMap(k => (k.subclasses ?? []).map(s => s.id))
    expect(Object.keys(SUBCLASS_SIGILS).sort()).toEqual([...ids].sort())
    for (const paths of Object.values(SUBCLASS_SIGILS)) expect(paths.length).toBeGreaterThan(0)
  })

  it('cai no sigilo da classe quando a subclasse é nova', () => {
    expect(subclassSigil({ id: 'BRUTE' }, { id: 'nova' })).toBeTruthy()
    expect(subclassSigil({ id: 'NOVA' }, { id: 'nova' })).toBeUndefined()
  })
})
