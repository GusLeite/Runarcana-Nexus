// Validações dos formulários de login e de troca de senha.
// Retornam null quando está tudo certo ou a mensagem de erro a exibir.
export function validateLogin({ user, password }) {
  if (!String(user ?? '').trim() || !password) {
    return 'Informe usuário e senha para entrar.'
  }
  return null
}

// Mesmas regras do back-end (ChangePasswordRequest / AuthService), para avisar antes de enviar.
export function validatePasswordChange({ username, current, next, confirm }) {
  if (!current || !next || !confirm) return 'Preencha todos os campos.'
  if (next.length < 6 || next.length > 72) return 'A nova senha precisa ter entre 6 e 72 caracteres.'
  if (next !== confirm) return 'A confirmação não bate com a nova senha.'
  if (next === current) return 'A nova senha precisa ser diferente da atual.'
  if (next.trim().toLowerCase() === String(username ?? '').toLowerCase()) {
    return 'A nova senha não pode ser o nome do personagem.'
  }
  return null
}
