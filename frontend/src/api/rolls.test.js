import { afterEach, describe, expect, it, vi } from 'vitest'
import { serverRoll, toEntry } from './rolls'

const reply = (status, body) => Promise.resolve({ status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) })

afterEach(() => vi.unstubAllGlobals())

describe('api/rolls', () => {
  it('manda o pedido ao servidor e devolve no formato da ficha', async () => {
    const fetch = vi.fn(() => reply(201, {
      id: 7, who: 'Nyx', username: 'gaudron', mine: true, hidden: false, visibility: 'PRIVATE', kind: 'CHECK',
      label: 'Atletismo', mode: 'adv', mod: 3, d20: 17, other: 4, critRange: 20, total: 20, createdAt: '2026-11-04T10:00:00Z',
    }))
    vi.stubGlobal('fetch', fetch)

    const entry = await serverRoll('t', { label: 'Atletismo', kind: 'CHECK', mod: 3, mode: 'adv', secret: true })

    const [url, opts] = fetch.mock.calls[0]
    expect(url).toBe('/runarcana/rolls')
    expect(JSON.parse(opts.body)).toMatchObject({ label: 'Atletismo', kind: 'CHECK', mod: 3, mode: 'adv', visibility: 'PRIVATE' })
    expect(entry).toMatchObject({ id: 7, kind: 'check', d20: 17, other: 4, total: 20, secret: true, mine: true })
  })

  it('sem servidor, sorteia aqui e marca como não registrada', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))))
    const entry = await serverRoll('t', { label: 'Dano', kind: 'DICE', expr: '2d6+1' })
    expect(entry.unregistered).toBe(true)
    expect(entry.kind).toBe('dice')
    expect(entry.rolls).toHaveLength(2)
    expect(entry.total).toBe(entry.rolls[0] + entry.rolls[1] + 1)
  })

  it('erro do servidor sobe (não sorteia por fora)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => reply(400, { message: 'Expressão de dados inválida (ex.: 2d6+3).' })))
    await expect(serverRoll('t', { label: 'x', kind: 'DICE', expr: '1d1' })).rejects.toMatchObject({ status: 400 })
  })

  it('rolagem secreta de outro vem sem números', () => {
    const entry = toEntry({ id: 3, who: 'Mestre', username: 'mestre', mine: false, hidden: true, visibility: 'PRIVATE', createdAt: 'x' })
    expect(entry).toMatchObject({ hidden: true, who: 'Mestre', secret: true })
    expect(entry.total).toBeUndefined()
  })
})
