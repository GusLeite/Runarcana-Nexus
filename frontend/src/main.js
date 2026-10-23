import './style.css'
import { validateLoginForm } from './validation.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="page">
    <div class="login-layout">
      <section class="lore-panel" aria-hidden="true">
        <p class="brand-kicker">Runarcana • Nexus</p>
        <h2 class="lore-title">Portal das Campanhas</h2>
        <p class="lore-copy">
          Entre no painel do seu grupo para consultar fichas, narrativas e progresso da jornada.
        </p>
        <div class="lore-divider"></div>
        <p class="lore-footnote">Interface conceitual do frontend • sem autenticação real nesta etapa.</p>
      </section>

      <section class="login-card" aria-labelledby="login-title">
        <p class="brand-kicker brand-kicker-card">Runarcana • Nexus</p>
        <h1 id="login-title">Acesso do Jogador</h1>
        <p class="subtitle">
          Informe suas credenciais para entrar no núcleo da campanha.
        </p>

        <form id="login-form" novalidate>
          <div class="field">
            <label for="login">E-mail ou usuário</label>
            <input id="login" name="login" type="text" autocomplete="username" required aria-describedby="login-error" />
            <p id="login-error" class="error-text" aria-live="polite"></p>
          </div>

          <div class="field">
            <label for="password">Senha</label>
            <div class="password-field">
              <input id="password" name="password" type="password" autocomplete="current-password" required aria-describedby="password-error" />
              <button id="toggle-password" type="button" class="ghost-button" aria-pressed="false" aria-label="Mostrar senha">
                Mostrar
              </button>
            </div>
            <p id="password-error" class="error-text" aria-live="polite"></p>
          </div>

          <div class="actions">
            <button id="submit-button" class="primary-button" type="submit">
              <span class="button-label">Entrar</span>
            </button>
            <a id="recovery-link" href="#" class="recovery-link">Esqueci minha senha</a>
          </div>
        </form>

        <p id="status-message" class="status-message" role="status" aria-live="polite"></p>
      </section>
    </div>
  </main>
`

const form = document.querySelector('#login-form')
const loginInput = document.querySelector('#login')
const passwordInput = document.querySelector('#password')
const loginError = document.querySelector('#login-error')
const passwordError = document.querySelector('#password-error')
const togglePasswordButton = document.querySelector('#toggle-password')
const submitButton = document.querySelector('#submit-button')
const buttonLabel = document.querySelector('.button-label')
const statusMessage = document.querySelector('#status-message')
const recoveryLink = document.querySelector('#recovery-link')

const updateErrors = (errors) => {
  loginError.textContent = errors.login ?? ''
  passwordError.textContent = errors.password ?? ''

  loginInput.setAttribute('aria-invalid', errors.login ? 'true' : 'false')
  passwordInput.setAttribute('aria-invalid', errors.password ? 'true' : 'false')
}

const setLoading = (isLoading) => {
  submitButton.disabled = isLoading
  buttonLabel.textContent = isLoading ? 'Entrando...' : 'Entrar'
}

togglePasswordButton.addEventListener('click', () => {
  const showingPassword = passwordInput.type === 'text'
  passwordInput.type = showingPassword ? 'password' : 'text'
  togglePasswordButton.setAttribute('aria-pressed', showingPassword ? 'false' : 'true')
  togglePasswordButton.setAttribute('aria-label', showingPassword ? 'Mostrar senha' : 'Ocultar senha')
  togglePasswordButton.textContent = showingPassword ? 'Mostrar' : 'Ocultar'
})

recoveryLink.addEventListener('click', (event) => {
  event.preventDefault()
  statusMessage.textContent =
    'A recuperação de senha depende da implementação do backend.'
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  statusMessage.textContent = ''

  const formValues = {
    login: loginInput.value,
    password: passwordInput.value,
  }

  const validation = validateLoginForm(formValues)
  updateErrors(validation.errors)

  if (!validation.isValid) {
    if (validation.errors.login) {
      loginInput.focus()
      return
    }

    passwordInput.focus()
    return
  }

  setLoading(true)
  window.setTimeout(() => {
    setLoading(false)
    statusMessage.textContent =
      'Login simulado com sucesso no frontend. A autenticação real depende da construção do backend.'
  }, 1000)
})
