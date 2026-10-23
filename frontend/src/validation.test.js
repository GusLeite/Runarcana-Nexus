import { describe, expect, it } from 'vitest'
import { validateLoginForm } from './validation'

describe('validateLoginForm', () => {
  it('retorna erro quando os campos obrigatórios não são informados', () => {
    const result = validateLoginForm({ login: '', password: '' })

    expect(result.isValid).toBe(false)
    expect(result.errors.login).toContain('Informe seu e-mail ou usuário')
    expect(result.errors.password).toContain('Informe sua senha')
  })

  it('retorna erro para e-mail inválido', () => {
    const result = validateLoginForm({ login: 'user@', password: '123456' })

    expect(result.isValid).toBe(false)
    expect(result.errors.login).toContain('e-mail válido')
  })

  it('aceita usuário e senha válidos', () => {
    const result = validateLoginForm({ login: 'jogador.runarcana', password: 'segredo123' })

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })
})
