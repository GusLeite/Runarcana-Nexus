import { useState } from 'react'

// Ícone quadrado da habilidade, como na barra do LoL: a imagem do mestre (se houver)
// ou a inicial do nome; a tecla (Q/W/E/R/P) fica no canto. Se a imagem falhar, volta para a inicial.
export default function AbilityIcon({ ability, hotkey, big, className = '' }) {
  const [broken, setBroken] = useState(null)
  const showImage = ability.icon && broken !== ability.icon

  return (
    <span className={'abl-icon t-' + ability.type.toLowerCase() + (big ? ' big' : '') + (showImage ? ' has-img' : '') + (className ? ' ' + className : '')} aria-hidden="true">
      {showImage
        ? <img className="abl-img" src={ability.icon} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(ability.icon)} />
        : <span className="abl-glyph">{(ability.name ?? '?').trim().charAt(0).toUpperCase() || '?'}</span>}
      {hotkey && <span className="abl-key">{hotkey}</span>}
    </span>
  )
}
