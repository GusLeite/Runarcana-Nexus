import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchActiveCombat } from '../api/combat.js'
import { useLive } from '../api/live.js'

const POLL_MS = 5000

// O confronto ativo (null = nenhum; undefined = ainda carregando), atualizado pelo canal ao vivo: tópico combat
// (o mestre mexeu no confronto) e table (PV e condições das fichas). Sem canal, confere a cada 5 s com a aba visível.
// Só troca o estado quando a revisão ou as fichas mudam, para a tela não piscar.
export default function useActiveCombat(token, enabled = true) {
  const [encounter, setEncounter] = useState(undefined)
  const sig = useRef(null)
  const live = useLive(token, ['combat', 'table'])

  const put = useCallback(next => {
    const key = next ? JSON.stringify(next) : 'none'
    if (key === sig.current) return
    sig.current = key
    setEncounter(next ?? null)
  }, [])

  const load = useCallback(() => fetchActiveCombat(token).then(put).catch(() => {}), [token, put])

  useEffect(() => {
    if (!enabled) return undefined
    load()
    // Aviso com a aba escondida fica pendente: busca ao voltar a ela (senão o celular no bolso perde o fim da luta).
    let missed = false
    const off = live.listen(() => { if (document.hidden) missed = true; else load() })
    const t = setInterval(() => { if (!document.hidden && live.due()) load() }, POLL_MS)
    const onShow = () => { if (!document.hidden && missed) { missed = false; load() } }
    document.addEventListener('visibilitychange', onShow)
    return () => { off(); clearInterval(t); document.removeEventListener('visibilitychange', onShow) }
  }, [enabled, load, live])

  return [encounter, put, load]
}
