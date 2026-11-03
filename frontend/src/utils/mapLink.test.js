import { describe, expect, it } from 'vitest'
import { mapLinkPath, mapLinkUrl, pointFromSearch, withoutPoint } from './mapLink.js'

const HREF = 'https://mesa.example/?aba=inventario&tela=lore#x'

describe('links de locais do mapa', () => {
  it('monta o link limpo, sem a aba da ficha', () => {
    expect(mapLinkPath(12, HREF)).toBe('/?tela=mapa&ponto=12')
    expect(mapLinkUrl(12, HREF)).toBe('https://mesa.example/?tela=mapa&ponto=12')
  })

  it('ao abrir por cima da ficha, mantém a aba', () => {
    expect(mapLinkPath(12, HREF, true)).toBe('/?aba=inventario&tela=mapa&ponto=12')
  })

  it('lê o ponto do link e ignora o que não é número', () => {
    expect(pointFromSearch('?tela=mapa&ponto=12')).toBe(12)
    expect(pointFromSearch('?tela=mapa')).toBeNull()
    expect(pointFromSearch('?ponto=abc')).toBeNull()
    expect(pointFromSearch('?ponto=-3')).toBeNull()
  })

  it('tira o ponto da URL', () => {
    expect(withoutPoint('https://mesa.example/?tela=mapa&ponto=12&aba=x')).toBe('/?tela=mapa&aba=x')
  })
})
