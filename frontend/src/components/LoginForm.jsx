import { useRef, useState } from 'react'
import { replay } from '../utils/motion.js'
import { validateLogin } from '../validation.js'
import { login, logout } from '../api/auth.js'

// Painel de login que aparece depois que o jogador escolhe o personagem.
// Por enquanto o usuário é o próprio id do personagem (ex.: "rudo").
export default function LoginForm({ character, onLogin, onBack, backLabel = 'Trocar de personagem' }) {
  const [user, setUser] = useState(character.id)
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const form = useRef()
  // Erro: mostra a mensagem e faz o painel tremer.
  const fail = text => {
    setMsg({ type: 'err', text })
    replay(form.current, 'shake')
  }

  const submit = async e => {
    e.preventDefault()
    const error = validateLogin({ user, password })
    if (error) return fail(error)

    setBusy(true)
    setMsg(null)
    try {
      const res = await login(user, password)
      if (res.account.username !== character.id) {
        logout(res.token).catch(() => {})
        throw new Error('Essa conta não é a de ' + character.name + '.')
      }
      onLogin({ token: res.token, ...res.account })
    } catch (err) {
      fail(err.message)
      setBusy(false)
    }
  }

  return (
    <form ref={form} className={'login' + (character.fx ? ' ' + character.fx : '')} onSubmit={submit} noValidate>
      <h2>{character.name}</h2>
      <p>{character.role} · acesse sua campanha</p>
      <label htmlFor="u">Usuário</label>
      <input id="u" autoComplete="username" value={user} onChange={e => setUser(e.target.value)} />
      <label htmlFor="pw">Senha</label>
      <input id="pw" type="password" autoFocus autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
      {msg && <div className={msg.type} role="status">{msg.text}</div>}
      <button className="btn" type="submit" disabled={busy}>{busy ? 'ENTRANDO…' : 'ENTRAR'}</button>
      <button className="back" type="button" onClick={onBack}>{backLabel}</button>
    </form>
  )
}
