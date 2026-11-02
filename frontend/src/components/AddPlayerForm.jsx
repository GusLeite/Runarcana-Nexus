import { useRef, useState } from 'react'
import { replay } from '../utils/motion.js'
import { createPlayer, login, logout } from '../api/auth.js'

// Novo jogador pela tela de seleção: pede a senha do mestre, cria a conta e já descarta a sessão do mestre.
export default function AddPlayerForm({ onCreated, onBack }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)
  const form = useRef()
  const fail = text => {
    setMsg({ type: 'err', text })
    replay(form.current, 'shake')
  }

  const submit = async e => {
    e.preventDefault()
    const username = name.trim().toLowerCase()
    if (!username) return fail('Informe o nome do jogador.')
    if (!password) return fail('Informe a senha do mestre.')

    setBusy(true)
    setMsg(null)
    let token = null
    try {
      const res = await login('mestre', password)
      token = res.token
      if (!res.account.master) throw new Error('Só o mestre pode adicionar jogadores.')
      setCreated(await createPlayer(token, username))
    } catch (err) {
      fail(err.message)
      setBusy(false)
    } finally {
      if (token) logout(token).catch(() => {})
    }
  }

  // A senha provisória só aparece aqui: o mestre anota antes de fechar.
  if (created) {
    return (
      <div className="login">
        <h2>Jogador criado</h2>
        <p>Passe esta senha para {created.username}; ela é trocada no primeiro acesso e não aparece de novo.</p>
        <output className="temp-password">{created.temporaryPassword}</output>
        <button className="btn" type="button" onClick={() => onCreated(created.username)}>CONCLUIR</button>
      </div>
    )
  }

  return (
    <form ref={form} className="login" onSubmit={submit} noValidate>
      <h2>Novo jogador</h2>
      <p>Só o mestre convida novos aventureiros</p>
      <label htmlFor="np">Nome do jogador</label>
      <input id="np" autoFocus autoComplete="off" maxLength={20} value={name} onChange={e => setName(e.target.value)} />
      <label htmlFor="mp">Senha do mestre</label>
      <input id="mp" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
      {msg && <div className={msg.type} role="status">{msg.text}</div>}
      <button className="btn" type="submit" disabled={busy}>{busy ? 'CRIANDO…' : 'ADICIONAR'}</button>
      <button className="back" type="button" onClick={onBack}>Voltar</button>
    </form>
  )
}
