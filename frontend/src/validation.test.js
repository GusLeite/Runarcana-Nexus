import { describe, expect, it } from 'vitest'
import { validateLogin } from './validation'

describe('validateLogin', () => {
  it('exige usuário e senha', () => {
    expect(validateLogin({ user: '', password: '' })).toContain('Informe usuário e senha')
    expect(validateLogin({ user: 'rudo', password: '' })).not.toBeNull()
    expect(validateLogin({ user: '', password: 'segredo' })).not.toBeNull()
  })

  it('ignora usuário só com espaços', () => {
    expect(validateLogin({ user: '   ', password: 'segredo' })).not.toBeNull()
  })

  it('aceita usuário e senha preenchidos', () => {
    expect(validateLogin({ user: 'rudo', password: 'segredo' })).toBeNull()
  })
})
