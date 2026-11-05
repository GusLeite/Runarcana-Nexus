import { describe, expect, it } from 'vitest'
import { DICE_SIDES, diceShape, relabel, rotate, upIndex } from './diceShapes'

const sub = (a, b) => a.map((x, i) => x - b[i])
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)

describe('dice3d/diceShapes', () => {
  it.each([[4, 4, 3], [6, 6, 4], [8, 8, 3], [10, 10, 4], [12, 12, 5], [20, 20, 3]])('d%i tem %i faces de %i vértices', (sides, faces, perFace) => {
    const s = diceShape(sides)
    expect(s.faces).toHaveLength(faces)
    s.faces.forEach(f => expect(f).toHaveLength(perFace))
  })

  it.each(DICE_SIDES)('d%i: faces planas, normais para fora e sólido convexo', sides => {
    const s = diceShape(sides)
    s.faces.forEach((face, i) => {
      const n = s.normals[i]
      const p0 = s.vertices[face[0]]
      // todos os vértices da face no mesmo plano
      face.forEach(v => expect(Math.abs(dot(sub(s.vertices[v], p0), n))).toBeLessThan(1e-6))
      // nenhum vértice do dado do lado de fora da face
      s.vertices.forEach(v => expect(dot(sub(v, p0), n)).toBeLessThan(1e-6))
      expect(dot(p0, n)).toBeGreaterThan(0)
    })
  })

  it('cada face (ou vértice, no d4) tem um número de 1 a N', () => {
    expect(diceShape(20).labels).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
    expect(diceShape(4).perVertex).toBe(true)
    expect(diceShape(4).labels).toEqual([1, 2, 3, 4])
  })

  it('acha a face de cima e troca os números para mostrar o valor pedido', () => {
    const s = diceShape(6)
    const identity = { x: 0, y: 0, z: 0, w: 1 }
    const up = upIndex(s, identity)
    expect(s.normals[up][1]).toBeCloseTo(1)
    const labels = relabel(s.labels, up, 5)
    expect(labels[up]).toBe(5)
    expect([...labels].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('gira vetores pelo quatérnio (90° em Z leva +X a +Y)', () => {
    const q = { x: 0, y: 0, z: Math.sin(Math.PI / 4), w: Math.cos(Math.PI / 4) }
    const v = rotate(q, [1, 0, 0])
    expect(v[0]).toBeCloseTo(0)
    expect(v[1]).toBeCloseTo(1)
  })

  it('recusa dado sem forma e valor fora do dado', () => {
    expect(() => diceShape(7)).toThrow()
    expect(() => relabel([1, 2, 3], 0, 9)).toThrow()
  })
})
