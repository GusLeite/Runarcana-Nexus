import { describe, expect, it } from 'vitest'
import { REGION_ART, regionArt, wrapIndex } from './regionArt.js'
import { REGION_NAMES } from './rules.js'

describe('regionArt', () => {
  it('tem arte para todas as regiões', () => {
    expect(Object.keys(REGION_ART).sort()).toEqual(Object.keys(REGION_NAMES).sort())
    for (const art of Object.values(REGION_ART)) expect(art.img).toBeTruthy()
  })

  it('prefere a descrição do livro e aceita região nova sem arte', () => {
    expect(regionArt({ id: 'IONIA', description: 'Do livro' }).tagline).toBe('Do livro')
    expect(regionArt({ id: 'NOVA' })).toEqual({ hue: 42, tagline: '' })
  })

  it('dá a volta nas pontas do carrossel', () => {
    expect(wrapIndex(-1, 14)).toBe(13)
    expect(wrapIndex(14, 14)).toBe(0)
    expect(wrapIndex(5, 14)).toBe(5)
  })
})
