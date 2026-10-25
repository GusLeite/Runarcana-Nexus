import { useState } from 'react'
import { validatePasswordChange } from '../validation.js'
import { changePassword } from '../api/auth.js'

// Troca de senha da conta logada. Abre sozinho enquanto a conta usa a senha inicial.
export default function PasswordForm({ character, session, onDone, onCancel, onExpired }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const first = session.mustChangePassword

  const submit = async e => {
    e.preventDefault()
    const error = validatePasswordChange({ username: session.username, current, next, confirm })
    if (error) return setMsg({ type: 'err', text: error })

    setBusy(true)
    setMsg(null)
    try {
      const account = await changePassword(session.token, current, next)
      onDone(account)
    } catch (err) {
      if (err.status === 401) return onExpired()
      setMsg({ type: 'err', text: err.message })
      setBusy(false)
    }
  }

  return (
    <form className={'login' + (character.fx ? ' ' + character.fx : '')} onSubmit={submit} noValidate>
      <h2>{first ? 'Crie sua senha' : 'Alterar senha'}</h2>
      <p>{first ? 'Você ainda usa a senha inicial. Escolha uma só sua.' : character.name + ' · nova senha'}</p>
      <label htmlFor="cur">Senha atual</label>
      <input id="cur" type="password" autoFocus autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} />
      <label htmlFor="new">Nova senha</label>
      <input id="new" type="password" autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} />
      <label htmlFor="conf">Confirme a nova senha</label>
      <input id="conf" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
      {msg && <div className={msg.type} role="status">{msg.text}</div>}
      <button className="btn" type="submit" disabled={busy}>{busy ? 'SALVANDO…' : 'SALVAR SENHA'}</button>
      <button className="back" type="button" onClick={onCancel}>{first ? 'Agora não' : 'Cancelar'}</button>
    </form>
  )
}
