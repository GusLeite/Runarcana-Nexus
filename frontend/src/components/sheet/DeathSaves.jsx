// Testes contra a morte com 0 PV: 3 sucessos (turquesa) e 3 falhas (vermelho). Clicar num círculo marca até ele
// (clicar no último aceso desmarca); "Rolar teste" rola o d20 (10+ sucesso, 1 = duas falhas, 20 = volta com 1 PV).
export default function DeathSaves({ successes, failures, onSet, onRoll, disabled }) {
  const status = successes >= 3 ? 'Estável' : failures >= 3 ? 'Morto' : null
  const toggle = (count, i) => (count === i + 1 ? i : i + 1)
  return (
    <div className={'death' + (status ? ' done' : '')} role="group" aria-label="Testes contra a morte">
      <div className="death-head">
        <span>Testes contra a morte</span>
        {status && <b className={failures >= 3 ? 'dead' : 'stable'}>{status}</b>}
      </div>
      <div className="death-rows">
        <Row label="Sucessos" kind="ok" count={successes} disabled={disabled} onPick={i => onSet(toggle(successes, i), failures)} />
        <Row label="Falhas" kind="fail" count={failures} disabled={disabled} onPick={i => onSet(successes, toggle(failures, i))} />
      </div>
      <button type="button" className="ghost-btn small death-roll" disabled={disabled || !!status} onClick={onRoll}>Rolar teste</button>
    </div>
  )
}

function Row({ label, kind, count, onPick, disabled }) {
  return (
    <div className="death-row">
      <span className="death-label">{label}</span>
      {[0, 1, 2].map(i => (
        <button key={i} type="button" className={'death-pip ' + kind + (i < count ? ' on' : '')} disabled={disabled}
          onClick={() => onPick(i)} aria-label={`${label}: ${i + 1}`} aria-pressed={i < count} />
      ))}
    </div>
  )
}
