import { useState } from 'react'
import { validateLoginForm } from './validation.js'

export function App() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [statusMessage, setStatusMessage] = useState('')

  const handleRecoveryClick = (event) => {
    event.preventDefault()
    setStatusMessage('A recuperação de senha depende da implementação do backend.')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setStatusMessage('')

    const validation = validateLoginForm({ login, password })
    setErrors(validation.errors)

    if (!validation.isValid) {
      return
    }

    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setStatusMessage(
        'Login simulado com sucesso no frontend. A autenticação real depende da construção do backend.',
      )
    }, 1000)
  }

  return (
    <main className="page">
      <div className="login-layout">
        <section className="lore-panel" aria-hidden="true">
          <p className="brand-kicker">Runarcana • Nexus</p>
          <h2 className="lore-title">Portal das Campanhas</h2>
          <p className="lore-copy">
            Entre no painel do seu grupo para consultar fichas, narrativas e progresso da jornada.
          </p>
          <div className="lore-divider"></div>
          <p className="lore-footnote">
            Interface conceitual do frontend • sem autenticação real nesta etapa.
          </p>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <p className="brand-kicker brand-kicker-card">Runarcana • Nexus</p>
          <h1 id="login-title">Acesso do Jogador</h1>
          <p className="subtitle">Informe suas credenciais para entrar no núcleo da campanha.</p>

          <form id="login-form" noValidate onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="login">E-mail ou usuário</label>
              <input
                id="login"
                name="login"
                type="text"
                autoComplete="username"
                required
                aria-invalid={errors.login ? 'true' : 'false'}
                aria-describedby="login-error"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
              />
              <p id="login-error" className="error-text" aria-live="polite">
                {errors.login ?? ''}
              </p>
            </div>

            <div className="field">
              <label htmlFor="password">Senha</label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby="password-error"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  id="toggle-password"
                  type="button"
                  className="ghost-button"
                  aria-pressed={showPassword ? 'true' : 'false'}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <p id="password-error" className="error-text" aria-live="polite">
                {errors.password ?? ''}
              </p>
            </div>

            <div className="actions">
              <button id="submit-button" className="primary-button" type="submit" disabled={loading}>
                <span className="button-label">{loading ? 'Entrando...' : 'Entrar'}</span>
              </button>
              <a id="recovery-link" href="#" className="recovery-link" onClick={handleRecoveryClick}>
                Esqueci minha senha
              </a>
            </div>
          </form>

          <p id="status-message" className="status-message" role="status" aria-live="polite">
            {statusMessage}
          </p>
        </section>
      </div>
    </main>
  )
}
