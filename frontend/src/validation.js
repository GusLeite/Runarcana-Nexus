const USERNAME_OR_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLoginForm({ login, password }) {
  const normalizedLogin = String(login ?? '').trim()
  const normalizedPassword = String(password ?? '')
  const errors = {}

  if (!normalizedLogin) {
    errors.login = 'Informe seu e-mail ou usuário.'
  } else if (
    normalizedLogin.includes('@') &&
    !USERNAME_OR_EMAIL_PATTERN.test(normalizedLogin)
  ) {
    errors.login = 'Informe um e-mail válido ou um nome de usuário.'
  }

  if (!normalizedPassword) {
    errors.password = 'Informe sua senha.'
  } else if (normalizedPassword.length < 6) {
    errors.password = 'A senha deve ter ao menos 6 caracteres.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
