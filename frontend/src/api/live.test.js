import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LIVE_FALLBACK_MS, isLiveConnected, liveHandle, resetLive, subscribeLive } from './live'

// EventSource falso: guarda as instâncias para o teste disparar eventos.
class FakeSource {
  static all = []
  constructor(url) {
    this.url = url
    this.handlers = {}
    this.closed = false
    FakeSource.all.push(this)
  }
  addEventListener(name, fn) { this.handlers[name] = fn }
  emit(name, data = '{}') { this.handlers[name]?.({ data }) }
  close() { this.closed = true }
}

const reply = (status, body) => Promise.resolve({ status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) })
const flush = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => {
  vi.useFakeTimers()
  FakeSource.all = []
  vi.stubGlobal('EventSource', FakeSource)
  vi.stubGlobal('fetch', vi.fn(() => reply(200, { ticket: 'tk' })))
})

afterEach(() => {
  resetLive()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('api/live', () => {
  it('pede o ticket com o Bearer e abre o canal sem o token na URL', async () => {
    subscribeLive('segredo', ['map'], () => {})
    await flush()
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toBe('/runarcana/live/ticket')
    expect(opts.method).toBe('POST')
    expect(opts.headers.Authorization).toBe('Bearer segredo')
    expect(FakeSource.all[0].url).toBe('/runarcana/live/stream?ticket=tk')
    expect(FakeSource.all[0].url).not.toContain('segredo')
  })

  it('chama só quem assina o tópico, agrupando avisos seguidos', async () => {
    const map = vi.fn()
    const journal = vi.fn()
    subscribeLive('t', ['map'], map)
    subscribeLive('t', ['journal'], journal)
    await flush()
    const source = FakeSource.all[0]
    source.emit('hello')
    await vi.advanceTimersByTimeAsync(300)
    expect(map).toHaveBeenCalledTimes(1) // ao conectar, todos conferem
    expect(journal).toHaveBeenCalledTimes(1)
    expect(isLiveConnected('t')).toBe(true)

    source.emit('change', '{"topic":"map"}')
    source.emit('change', '{"topic":"map"}')
    await vi.advanceTimersByTimeAsync(300)
    expect(map).toHaveBeenCalledTimes(2)
    expect(journal).toHaveBeenCalledTimes(1)
  })

  it('ao cair, fecha e reconecta com um ticket novo', async () => {
    subscribeLive('t', ['map'], () => {})
    await flush()
    FakeSource.all[0].emit('hello')
    FakeSource.all[0].onerror()
    expect(FakeSource.all[0].closed).toBe(true)
    expect(isLiveConnected('t')).toBe(false)
    await vi.advanceTimersByTimeAsync(1000)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(FakeSource.all).toHaveLength(2)
  })

  it('para de tentar com sessão inválida', async () => {
    fetch.mockImplementation(() => reply(401, { message: 'Sessão inválida.' }))
    subscribeLive('t', ['map'], () => {})
    await vi.advanceTimersByTimeAsync(60000)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(FakeSource.all).toHaveLength(0)
  })

  it('fecha o canal pouco depois do último assinante sair', async () => {
    const off = subscribeLive('t', ['map'], () => {})
    await flush()
    off()
    await vi.advanceTimersByTimeAsync(3000)
    expect(FakeSource.all[0].closed).toBe(true)
  })

  it('due: sem canal sempre; com canal, só uma vez por intervalo de reserva', async () => {
    const live = liveHandle('t', ['map'])
    expect(live.due()).toBe(true)
    subscribeLive('t', ['map'], () => {})
    await flush()
    FakeSource.all[0].emit('hello')
    expect(live.due()).toBe(true)
    expect(live.due()).toBe(false)
    await vi.advanceTimersByTimeAsync(LIVE_FALLBACK_MS)
    expect(live.due()).toBe(true)
  })
})

