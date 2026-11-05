import { describe, expect, it } from 'vitest'
import { focusFromSearch, mapLinkPath, mapLinkUrl, splitMapLinks, withoutFocus } from './mapLink.js'

const HREF = 'https://mesa.example/?aba=inventario&tela=lore#x'

describe('links do mapa', () => {
  it('monta o link limpo, sem a aba da ficha', () => {
    expect(mapLinkPath(12, HREF)).toBe('/?tela=mapa&ponto=12')
    expect(mapLinkUrl(12, HREF)).toBe('https://mesa.example/?tela=mapa&ponto=12')
    expect(mapLinkPath('demacia', HREF)).toBe('/?tela=mapa&regiao=demacia')
  })

  it('ao abrir por cima da ficha, mantém a aba e troca o foco antigo', () => {
    expect(mapLinkPath(12, HREF, true)).toBe('/?aba=inventario&tela=mapa&ponto=12')
    expect(mapLinkPath(7, 'https://mesa.example/?tela=mapa&ponto=12', true)).toBe('/?tela=mapa&ponto=7')
  })

  it('lê o foco do link e ignora o que é inválido', () => {
    expect(focusFromSearch('?tela=mapa&ponto=12')).toEqual({ poiId: 12 })
    expect(focusFromSearch('?tela=mapa&regiao=demacia')).toEqual({ slug: 'demacia' })
    expect(focusFromSearch('?tela=mapa')).toBeUndefined()
    expect(focusFromSearch('?ponto=abc')).toBeUndefined()
    expect(focusFromSearch('?ponto=-3')).toBeUndefined()
    expect(focusFromSearch('?regiao=../x')).toBeUndefined()
    expect(focusFromSearch('?tela=mapa&x=-120&y=45')).toEqual({ x: -120, y: 45 })
    expect(focusFromSearch('?tela=mapa&x=5000&y=0')).toBeUndefined()
    expect(focusFromSearch('?tela=mapa&x=10')).toBeUndefined()
    expect(mapLinkPath({ x: 10.4, y: -3 }, 'https://mesa.example/?aba=x', true)).toBe('/?aba=x&tela=mapa&x=10&y=-3')
    expect(withoutFocus('https://mesa.example/?tela=mapa&x=1&y=2')).toBe('/?tela=mapa')
  })

  it('tira o foco da URL', () => {
    expect(withoutFocus('https://mesa.example/?tela=mapa&ponto=12&aba=x')).toBe('/?tela=mapa&aba=x')
  })

  it('acha links do mapa desta página dentro de um texto', () => {
    const origin = 'https://mesa.example'
    const parts = splitMapLinks('Vejam https://mesa.example/?tela=mapa&ponto=5 e https://outro.site/?tela=mapa&ponto=5 ok', origin)
    expect(parts.filter(p => p.link)).toEqual([{ link: 'https://mesa.example/?tela=mapa&ponto=5', focus: { poiId: 5 } }])
    expect(parts.map(p => p.text ?? p.link).join('')).toBe('Vejam https://mesa.example/?tela=mapa&ponto=5 e https://outro.site/?tela=mapa&ponto=5 ok')
  })
})
