import { describe, expect, it } from 'vitest'
import { validateLogin, validatePasswordChange } from './validation'

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

describe('validatePasswordChange', () => {
  const ok = { username: 'rudo', current: 'rudo', next: 'machado-vermelho', confirm: 'machado-vermelho' }

  it('aceita uma troca válida', () => {
    expect(validatePasswordChange(ok)).toBeNull()
  })

  it('exige todos os campos', () => {
    expect(validatePasswordChange({ ...ok, current: '' })).toContain('Preencha')
  })

  it('exige entre 6 e 72 caracteres', () => {
    expect(validatePasswordChange({ ...ok, next: 'abc', confirm: 'abc' })).toContain('entre 6 e 72')
    const longa = 'x'.repeat(73)
    expect(validatePasswordChange({ ...ok, next: longa, confirm: longa })).toContain('entre 6 e 72')
  })

  it('exige confirmação igual', () => {
    expect(validatePasswordChange({ ...ok, confirm: 'outra-coisa' })).toContain('confirmação')
  })

  it('recusa repetir a senha atual ou usar o nome do personagem', () => {
    expect(validatePasswordChange({ ...ok, current: 'segredo1', next: 'segredo1', confirm: 'segredo1' })).toContain('diferente')
    expect(validatePasswordChange({ ...ok, current: 'segredo1', next: 'RUDO  ', confirm: 'RUDO  ' })).toContain('nome do personagem')
  })
})
