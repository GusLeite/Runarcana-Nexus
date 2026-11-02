import { describe, expect, it } from 'vitest'
import { clickSound, styled } from './uiSounds.js'

// Controle de mentira com só o que clickSound lê.
const el = ({ classes = [], role, type, sfx } = {}) => ({
  type,
  classList: { contains: c => classes.includes(c) },
  getAttribute: name => (name === 'role' ? role : name === 'data-sfx' ? sfx : null) ?? null,
})

describe('clickSound', () => {
  it('abas viram página', () => expect(clickSound(el({ role: 'tab' }))).toBe('page'))
  it('botões de apagar soam graves', () => {
    expect(clickSound(el({ classes: ['danger-btn'] }))).toBe('danger')
    expect(clickSound(el({ classes: ['link-btn', 'danger'] }))).toBe('danger')
  })
  it('botão do mestre abre o portão', () => expect(clickSound(el({ classes: ['master-btn'] }))).toBe('gate'))
  it('envio e botão principal confirmam', () => {
    expect(clickSound(el({ type: 'submit' }))).toBe('confirm')
    expect(clickSound(el({ classes: ['btn'] }))).toBe('confirm')
  })
  it('marcadores alternam', () => expect(clickSound(el({ type: 'checkbox' }))).toBe('toggle'))
  it('o resto é um toque', () => expect(clickSound(el({ classes: ['icon-btn'] }))).toBe('tap'))
  it('data-sfx manda em tudo', () => {
    expect(clickSound(el({ role: 'tab', sfx: 'none' }))).toBeNull()
    expect(clickSound(el({ classes: ['btn'], sfx: 'coin' }))).toBe('coin')
  })
})

describe('styled', () => {
  const inSheet = { closest: sel => (sel === '.sheet' ? {} : null) }
  it('ficha e mestre usam o estilo do cliente', () => expect(styled(inSheet, 'tap')).toBe('lol-tap'))
  it('fora da ficha, o som comum', () => expect(styled({ closest: () => null }, 'tap')).toBe('tap'))
})
