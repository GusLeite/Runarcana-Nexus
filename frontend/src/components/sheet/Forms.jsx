import { formEffects } from '../../data/rules.js'

// Formas temporárias (Forma de Sho'Ma, Forma Dracônica): ligar uma muda atributos, deslocamento e tamanho da ficha.
export default function Forms({ sheet, onForm }) {
  const forms = sheet.forms ?? []
  if (!forms.length) return null
  const active = sheet.activeForm
  return (
    <>
      <h3 className="card-title">Formas <small>{active ? 'em ' + active : 'forma normal'}</small></h3>
      <ul className="forms">
        {forms.map(f => {
          const on = f.name === active
          const effects = formEffects(f)
          return (
            <li key={f.name} className={'form-line' + (on ? ' on' : '')}>
              <button type="button" className={'to-chip' + (on ? ' on' : '')} aria-pressed={on}
                title={f.description ?? undefined} onClick={() => onForm(on ? null : f.name)}>
                {f.name}
              </button>
              {effects && <span className="form-effects">{effects}</span>}
            </li>
          )
        })}
      </ul>
    </>
  )
}
