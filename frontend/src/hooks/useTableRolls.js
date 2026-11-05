import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchRolls, toEntry } from '../api/rolls.js'
import { useLive } from '../api/live.js'

const POLL_MS = 10000

// Histórico de rolagens da mesa: vem do servidor e se atualiza pelo canal ao vivo (tópico rolls).
// add() põe na hora a rolagem que esta tela acabou de fazer; as sorteadas sem servidor (unregistered) ficam só aqui.
export default function useTableRolls(token, limit = 30) {
  const [server, setServer] = useState([])
  const [local, setLocal] = useState([])
  const live = useLive(token, ['rolls'])

  useEffect(() => {
    if (!token) return undefined
    let alive = true
    const load = () => fetchRolls(token, limit).then(list => { if (alive) setServer(list.map(toEntry)) }).catch(() => {})
    load()
    const off = live.listen(load)
    const t = setInterval(() => { if (!document.hidden && live.due()) load() }, POLL_MS)
    return () => { alive = false; off(); clearInterval(t) }
  }, [token, limit, live])

  const add = useCallback(entry => {
    if (!entry) return
    if (entry.unregistered) setLocal(list => [entry, ...list].slice(0, limit))
    else setServer(list => (list.some(r => r.id === entry.id) ? list : [entry, ...list].slice(0, limit)))
  }, [limit])

  const rolls = useMemo(
    () => [...local, ...server].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, limit),
    [local, server, limit],
  )
  return [rolls, add]
}
