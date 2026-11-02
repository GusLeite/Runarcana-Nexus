import { useCallback, useEffect, useState } from 'react'
import { fetchAccounts, resetPassword } from '../../api/auth.js'

// Aba "Contas" do mestre: gera a senha provisória do jogador (primeiro acesso ou senha esquecida).
// A senha só aparece aqui, logo depois de gerada; no banco fica o hash.
export default function MasterAccounts({ token, onError }) {
  const [accounts, setAccounts] = useState(null)
  const [generated, setGenerated] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => fetchAccounts(token).then(setAccounts).catch(onError), [token, onError])
  useEffect(() => { load() }, [load])

  const generate = async username => {
    setBusy(true)
    try {
      setGenerated(await resetPassword(token, username))
      setConfirming(null)
      await load()
    } catch (err) {
      onError(err)
    }
    setBusy(false)
  }

  if (!accounts) return <section className="card"><div className="hex-spinner" /></section>

  return (
    <section className="card accounts-card" style={{ '--i': 1 }}>
      <h3 className="card-title">Senhas dos jogadores</h3>
      <p className="muted-note">
        Gere uma senha provisória e passe ao jogador por um canal privado. Ela substitui a senha atual, encerra as sessões dele e é trocada no próximo acesso.
      </p>
      {generated && (
        <div className="accounts-generated" role="status">
          <span>Senha provisória de <strong>{generated.username}</strong> (não aparece de novo):</span>
          <output className="temp-password">{generated.temporaryPassword}</output>
        </div>
      )}
      <ul className="accounts-list">
        {accounts.map(a => (
          <li key={a.username}>
            <span className="accounts-name">{a.username}</span>
            <span className="accounts-state">{a.mustChangePassword ? 'Aguardando o primeiro acesso' : 'Senha própria'}</span>
            {confirming === a.username ? (
              <span className="accounts-actions">
                <button className="btn-mini" type="button" disabled={busy} onClick={() => generate(a.username)}>CONFIRMAR</button>
                <button className="btn-mini" type="button" disabled={busy} onClick={() => setConfirming(null)}>CANCELAR</button>
              </span>
            ) : (
              <button className="btn-mini" type="button" disabled={busy} onClick={() => setConfirming(a.username)}>GERAR SENHA</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
