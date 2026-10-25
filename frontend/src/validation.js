// Validação do formulário de login da tela de seleção.
// Retorna null quando está tudo certo ou a mensagem de erro a exibir.
export function validateLogin({ user, password }) {
  if (!String(user ?? '').trim() || !password) {
    return 'Informe usuário e senha para entrar.'
  }
  return null
}
