// Condições da ficha (só leitura para o jogador): um chip por condição, com a regra na dica, e a Exaustão em níveis.
export default function ConditionChips({ ids = [], exhaustion = 0, catalog }) {
  if (!ids.length && !exhaustion) return null
  const byId = Object.fromEntries((catalog?.conditions ?? []).map(c => [c.id, c]))
  return (
    <ul className="cond-chips" aria-label="Condições">
      {ids.map(id => (
        <li key={id} className="cond-chip" title={byId[id]?.text}>{byId[id]?.name ?? id}</li>
      ))}
      {exhaustion > 0 && (
        <li className="cond-chip exh" title={catalog?.exhaustion}>Exaustão {exhaustion}{catalog?.exhaustionMax ? '/' + catalog.exhaustionMax : ''}</li>
      )}
    </ul>
  )
}
