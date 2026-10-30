import { afterEach, describe, expect, it, vi } from 'vitest'
import { changePassword, fetchMe, login } from './auth'

const reply = (status, body) => Promise.resolve({
  status,
  ok: status >= 200 && status < 300,
  json: () => Promise.resolve(body),
})

afterEach(() => vi.unstubAllGlobals())

describe('api/auth', () => {
  it('faz login com POST em /runarcana/auth/login', async () => {
    const fetch = vi.fn(() => reply(200, { token: 't', account: { username: 'rudo', mustChangePassword: true } }))
    vi.stubGlobal('fetch', fetch)

    const res = await login('rudo', 'rudo')

    expect(res.account.username).toBe('rudo')
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toBe('/runarcana/auth/login')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ username: 'rudo', password: 'rudo' })
  })

  it('manda o token no header Authorization', async () => {
    const fetch = vi.fn(() => reply(200, { username: 'rudo', mustChangePassword: false }))
    vi.stubGlobal('fetch', fetch)

    await changePassword('abc', 'velha1', 'nova123')

    const [url, opts] = fetch.mock.calls[0]
    expect(url).toBe('/runarcana/auth/password')
    expect(opts.method).toBe('PUT')
    expect(opts.headers.Authorization).toBe('Bearer abc')
  })

  it('usa a mensagem do back-end nos erros', async () => {
    vi.stubGlobal('fetch', vi.fn(() => reply(401, { message: 'Usuário ou senha incorretos.' })))
    await expect(login('rudo', 'x')).rejects.toMatchObject({ status: 401, message: 'Usuário ou senha incorretos.' })
  })

  it('avisa quando o servidor está fora do ar', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    await expect(fetchMe('t')).rejects.toMatchObject({ status: 0 })
  })
})
