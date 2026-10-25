import { useState } from 'react'
import { validateLogin } from '../validation.js'

// Painel de login que aparece depois que o jogador escolhe o personagem.
export default function LoginForm({ character, onBack }) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)

  const submit = e => {
    e.preventDefault()
    const error = validateLogin({ user, password })
    if (error) return setMsg({ type: 'err', text: error })
    setMsg({ type: 'ok', text: 'Entrando como ' + character.name + '…' }) // TODO: conectar à API de autenticação do back-end
  }

  return (
    <form className={'login' + (character.fx ? ' ' + character.fx : '')} onSubmit={submit} noValidate>
      <h2>{character.name}</h2>
      <p>{character.role} · acesse sua campanha</p>
      <label htmlFor="u">Usuário</label>
      <input id="u" autoFocus autoComplete="username" value={user} onChange={e => setUser(e.target.value)} />
      <label htmlFor="pw">Senha</label>
      <input id="pw" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
      {msg && <div className={msg.type} role="status">{msg.text}</div>}
      <button className="btn" type="submit">ENTRAR</button>
      <button className="back" type="button" onClick={onBack}>Trocar de personagem</button>
    </form>
  )
}
