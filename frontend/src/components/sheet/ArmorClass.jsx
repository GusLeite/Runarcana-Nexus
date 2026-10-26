import { useState } from 'react'

// Classe de Armadura no herói da ficha. O valor vem pronto do back (armorClass da ficha); clicar abre as
// opções de defesa (sem armadura, CAs alternativas da origem, armaduras do inventário) para escolher a que está em uso.
export default function ArmorClass({ armorClass, onChoose }) {
  const [open, setOpen] = useState(false)
  if (!armorClass) return null
  const current = armorClass.options.find(o => o.key === armorClass.selected)
  const many = armorClass.options.length > 1

  return (
    <div className={'ac' + (open ? ' open' : '')}>
      <button type="button" className="ac-head" onClick={() => setOpen(o => !o)} disabled={!many} aria-expanded={many ? open : undefined}
        title={many ? 'Clique para escolher a defesa em uso' : undefined}>
        <span className="ac-shield" aria-hidden="true">
          <svg viewBox="0 0 24 28"><path d="M12 1 22 5v8c0 7-4.5 11.5-10 14C6.5 24.5 2 20 2 13V5z" /></svg>
          <b key={armorClass.value}>{armorClass.value}</b>
        </span>
        <span className="ac-text">
          <span className="ac-label">Classe de Armadura{armorClass.reduction > 0 && <em> · RD {armorClass.reduction}</em>}</span>
          <span className="ac-current">{current?.label ?? '—'}</span>
        </span>
        {many && <span className="ac-chevron" aria-hidden="true">▾</span>}
      </button>

      {open && (
        <div className="ac-menu" role="radiogroup" aria-label="Defesa em uso">
          {armorClass.options.map(o => (
            <button key={o.key} type="button" role="radio" aria-checked={o.key === armorClass.selected}
              className={'ac-option' + (o.key === armorClass.selected ? ' on' : '')}
              onClick={() => {
                setOpen(false)
                if (o.key !== armorClass.selected) onChoose(o.key)
              }}>
              <span className="ac-option-label">{o.label}</span>
              <span className="ac-option-value">CA {o.value}{o.reduction > 0 && <small> · RD {o.reduction}</small>}</span>
            </button>
          ))}
          {armorClass.bonuses.length > 0 && <p className="ac-note">Bônus somados: {armorClass.bonuses.join(', ')}.</p>}
          {armorClass.blockedBy && <p className="ac-note">Armaduras do inventário não servem por causa de {armorClass.blockedBy}.</p>}
        </div>
      )}
    </div>
  )
}
