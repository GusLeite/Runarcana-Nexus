import { useState } from 'react'
import { mapLinkUrl } from '../../utils/mapLink.js'

// Copia o link do local (ponto ou região) para colar no chat, no diário ou em documentos.
export default function CopyLinkButton({ target, className = 'lore-action ghost' }) {
  const [state, setState] = useState(null) // null | 'ok' | 'manual'
  const url = mapLinkUrl(target)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setState('ok')
      setTimeout(() => setState(null), 2500)
    } catch {
      setState('manual')
    }
  }
  return (
    <>
      <button type="button" className={className} onClick={copy}>{state === 'ok' ? 'LINK COPIADO ✓' : 'COPIAR LINK'}</button>
      {state === 'manual' && <input className="map-link-field" readOnly value={url} aria-label="Link do local" autoFocus onFocus={e => e.target.select()} />}
    </>
  )
}
