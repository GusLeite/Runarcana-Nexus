import { useEffect, useRef, useState } from 'react'
import { play } from '../../audio/engine.js'

// Faixa que corta a tela quando a vez muda: "VEZ DE FULANO" (ou "SUA VEZ!", com som, para quem joga agora).
// Não aparece na primeira leitura (abrir a tela no meio da luta não anuncia nada).
export default function TurnBanner({ encounter }) {
  const [banner, setBanner] = useState(null)
  const last = useRef(undefined)
  const current = encounter?.order.find(c => c.id === encounter.currentId) ?? null
  const key = encounter ? encounter.id + ':' + encounter.round + ':' + (encounter.currentId ?? '') : null

  useEffect(() => {
    if (last.current === undefined) { last.current = key; return }
    if (key === last.current) return
    last.current = key
    if (!current) return
    setBanner({ key, name: current.name, mine: current.mine, foe: current.kind === 'ENEMY', round: encounter.round })
    play(current.mine ? 'yourturn' : 'notice')
  }, [key, current, encounter])

  useEffect(() => {
    if (!banner) return undefined
    const t = setTimeout(() => setBanner(null), 2200)
    return () => clearTimeout(t)
  }, [banner])

  if (!banner) return null
  return (
    <div key={banner.key} className={'cb-banner' + (banner.mine ? ' mine' : banner.foe ? ' foe' : '')} role="status">
      <small>{banner.round}ª rodada</small>
      <b>{banner.mine ? 'SUA VEZ!' : 'VEZ DE ' + banner.name.toUpperCase()}</b>
    </div>
  )
}
