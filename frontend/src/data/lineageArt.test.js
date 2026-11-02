import { describe, expect, it } from 'vitest'
import { lineageImage, lineagePos } from './lineageArt.js'

describe('lineageArt', () => {
  it('devolve null para linhagem sem imagem e usa o enquadramento padrão', () => {
    expect(lineageImage('linhagem-que-nao-existe')).toBeNull()
    expect(lineagePos('linhagem-que-nao-existe')).toBe('50% 30%')
  })
})
