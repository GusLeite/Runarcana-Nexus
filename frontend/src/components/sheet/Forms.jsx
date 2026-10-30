import { formEffects } from '../../data/rules.js'

// Formas temporárias (uma por vez: Forma de Sho'Ma, Forma Dracônica) e efeitos ativos (vários: Fúria, Iras, Sutras...).
// Ligar muda atributos, CA, resistências, deslocamento, dano e tamanho da ficha; o back devolve tudo recalculado.
export default function Forms({ sheet, onForm, onEffect }) {
  const all = sheet.forms ?? []
  const forms = all.filter(f => f.kind !== 'EFFECT')
  const effects = all.filter(f => f.kind === 'EFFECT')
  const activeEffects = new Set(sheet.activeEffects ?? [])
  if (!all.length) return null
  return (
    <>
      {forms.length > 0 && (
        <>
          <h3 className="card-title">Formas <small>{sheet.activeForm ? 'em ' + sheet.activeForm : 'forma normal'}</small></h3>
          <FormList items={forms} isOn={f => f.name === sheet.activeForm} onToggle={f => onForm(f.name === sheet.activeForm ? null : f.name)} />
        </>
      )}
      {effects.length > 0 && (
        <>
          <h3 className="card-title">Efeitos ativos <small>{activeEffects.size ? activeEffects.size + ' ligado(s)' : 'clique para ligar'}</small></h3>
          <FormList items={effects} isOn={f => activeEffects.has(f.name)} onToggle={f => onEffect(f.name)} />
        </>
      )}
    </>
  )
}

function FormList({ items, isOn, onToggle }) {
  return (
    <ul className="forms">
      {items.map(f => {
        const on = isOn(f)
        const effects = formEffects(f)
        return (
          <li key={f.name} className={'form-line' + (on ? ' on' : '')}>
            <button type="button" className={'to-chip' + (on ? ' on' : '')} aria-pressed={on}
              title={f.description ?? undefined} onClick={() => onToggle(f)}>
              {f.name}
            </button>
            {effects && <span className="form-effects">{effects}</span>}
          </li>
        )
      })}
    </ul>
  )
}
