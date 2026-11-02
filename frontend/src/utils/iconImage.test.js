import { describe, expect, it } from 'vitest'
import { coverCrop, isIconLink, validateIconFile } from './iconImage.js'

describe('ícone de habilidade', () => {
  it('aceita só imagens comuns e até 8 MB', () => {
    expect(validateIconFile({ type: 'image/png', size: 1000 })).toBeNull()
    expect(validateIconFile({ type: 'image/svg+xml', size: 1000 })).toBe('Use uma imagem PNG, JPG, WebP ou GIF.')
    expect(validateIconFile({ type: 'image/jpeg', size: 9 * 1024 * 1024 })).toBe('A imagem passa de 8 MB. Escolha uma menor.')
    expect(validateIconFile(null)).toBe('Escolha uma imagem.')
  })

  it('recorta o quadrado do centro', () => {
    expect(coverCrop(400, 200)).toEqual({ sx: 100, sy: 0, side: 200 })
    expect(coverCrop(300, 600)).toEqual({ sx: 0, sy: 150, side: 300 })
  })

  it('aceita link http(s) sem espaços', () => {
    expect(isIconLink('https://exemplo.com/a.png')).toBe(true)
    expect(isIconLink('javascript:alert(1)')).toBe(false)
    expect(isIconLink('https://exemplo.com/a b.png')).toBe(false)
  })
})
