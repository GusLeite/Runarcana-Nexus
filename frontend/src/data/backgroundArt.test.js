import { describe, expect, it } from 'vitest'
import catalog from '../../../src/main/resources/rules/criacao.json'
import { BACKGROUND_IMAGES, BACKGROUND_SIGILS, backgroundSigil } from './backgroundArt.js'

describe('backgroundArt', () => {
  it('tem símbolo para todo passado do catálogo, e nenhum sobrando', () => {
    const ids = catalog.backgrounds.map(b => b.id)
    expect(Object.keys(BACKGROUND_SIGILS).sort()).toEqual([...ids].sort())
    for (const paths of Object.values(BACKGROUND_SIGILS)) expect(paths.length).toBeGreaterThan(0)
  })

  it('cai no símbolo genérico quando o passado é novo', () => {
    expect(backgroundSigil({ id: 'novo' }).length).toBeGreaterThan(0)
  })

  it('só tem ilustração para passado do catálogo', () => {
    const ids = catalog.backgrounds.map(b => b.id)
    for (const id of Object.keys(BACKGROUND_IMAGES)) expect(ids).toContain(id)
  })
})
