import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { App } from './App.jsx'

describe('App', () => {
  it('renderiza a estrutura principal de login', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('Acesso do Jogador')
    expect(html).toContain('E-mail ou usuário')
    expect(html).toContain('Esqueci minha senha')
    expect(html).toContain('Entrar')
  })
})
