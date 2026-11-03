import { describe, expect, it } from 'vitest'
import { readParam, withParam } from './useUrlParam.js'

const TABS = ['sheet', 'inventory', 'notes']

describe('readParam', () => {
  it('lê o valor aceito da query', () => {
    expect(readParam('aba', TABS, 'sheet', '?aba=inventory')).toBe('inventory')
  })
  it('cai no padrão quando falta ou não é aceito', () => {
    expect(readParam('aba', TABS, 'sheet', '')).toBe('sheet')
    expect(readParam('aba', TABS, 'sheet', '?aba=hackeado')).toBe('sheet')
  })
})

describe('withParam', () => {
  it('troca o parâmetro e mantém os outros e o hash', () => {
    expect(withParam('aba', 'notes', 'sheet', 'http://x/app?tela=mapa#topo')).toBe('/app?tela=mapa&aba=notes#topo')
  })
  it('tira o parâmetro quando volta ao padrão', () => {
    expect(withParam('aba', 'sheet', 'sheet', 'http://x/?aba=notes')).toBe('/')
    expect(withParam('tela', null, null, 'http://x/?tela=mapa&aba=notes')).toBe('/?aba=notes')
  })
})
