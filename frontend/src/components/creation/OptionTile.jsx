import { attributeById } from '../../data/rules.js'
import { CRAFT_BLURBS, SIZE_FIGURES, gemOf } from '../../data/choiceLore.js'

export function Sigil({ paths, className = "", style }) {
  return (
    <svg className={"ch-sigil " + className} style={style} viewBox="0 0 100 100" aria-hidden="true">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

// O card abre para cima; perto do topo da janela, vira para baixo.
const flip = e => e.currentTarget.classList.toggle('below', (r => r.top < window.innerHeight - r.bottom)(e.currentTarget.getBoundingClientRect()))

const spellLevel = n => (n ? n + 'º nível' : 'Truque')

// Id do ofício de uma opção (escolha de ofício, ou "CRAFT:id" nas proficiências e especialidades), ou null.
function craftIdOf(type, id) {
  if (type === 'CRAFT_CHOICE') return id
  const m = /^CRAFT:(.+)$/.exec(id)
  return m ? m[1] : null
}

function CraftCard({ craft, formulas }) {
  const list = formulas?.crafts?.[craft.id] ?? []
  const known = list.filter(f => f.level > 0)
  return (
    <span className="opt-tip">
      <span className="tip-title">{craft.name}</span>
      <span className="tip-tags">
        <i>Ofício {craft.kind === 'MAJOR' ? 'maior' : 'menor'}</i>
        {craft.attribute && <i>Base: {attributeById(craft.attribute)?.name ?? craft.attribute}</i>}
      </span>
      {CRAFT_BLURBS[craft.id] && <span className="tip-text">{CRAFT_BLURBS[craft.id]}</span>}
      {known.length > 0 && (
        <span className="tip-meta">
          {list.length} fórmulas no ofício, como {known.slice(0, 3).map(f => f.name).join(', ')}…
        </span>
      )}
    </span>
  )
}

function SpellCard({ spell }) {
  return (
    <span className="opt-tip wide" onClick={e => e.stopPropagation()}>
      <span className="tip-title">{spell.name}</span>
      <span className="tip-tags">
        <i>{spellLevel(spell.level)}</i>
        {spell.ritual && <i>Ritual</i>}
        {spell.concentration && <i>Concentração</i>}
      </span>
      <span className="tip-meta">{[spell.castingTime, spell.range, spell.duration].filter(Boolean).join(' · ')}</span>
      <span className="tip-text">{spell.description}</span>
    </span>
  )
}

// Uma opção de escolha como azulejo. Tamanho e gema do Pulso Rúnico têm símbolo próprio; ofícios e magias mostram um card
// com a descrição ao passar o mouse (ou focar).
export default function OptionTile({ type, id, label, on, disabled, onClick, crafts = [], lore = {}, tileCount = 0 }) {
  const gem = gemOf(id)
  const size = type === 'SIZE_CHOICE' ? SIZE_FIGURES[id] : null
  const craft = crafts.find(k => k.id === craftIdOf(type, id))
  const spell = type === 'SPELL_CHOICE' ? lore.spells?.find(s => s.id === id) : null

  if (size) {
    return (
      <button type="button" className={'opt size' + (on ? ' on' : '')} aria-pressed={on} disabled={disabled} onClick={onClick}>
        <span className="size-stage">
          <Sigil paths={size.sigil} className="size-figure" style={{ height: 96 * size.h }} />
        </span>
        <span className="opt-name">{label}</span>
        <span className="opt-sub">{size.title} · {size.hint}</span>
      </button>
    )
  }
  if (gem && type === 'FEATURE') {
    return (
      <button type="button" className={'opt gem' + (on ? ' on' : '')} aria-pressed={on} disabled={disabled} onClick={onClick}
        onMouseEnter={flip} onFocus={flip} style={{ '--gem': gem.color }}>
        <Sigil paths={gem.sigil} className="gem-sigil" />
        <span className="opt-name">{label}</span>
        <span className="opt-sub">{gem.role} · {gem.effect}</span>
        <span className="opt-tip gem-tip">
          <span className="tip-title">{label}: {gem.role}</span>
          <span className="tip-text">{gem.blurb}</span>
        </span>
      </button>
    )
  }
  return (
    <button type="button" className={'opt' + (on ? ' on' : '') + (craft || spell ? ' has-tip' : '') + (tileCount % 2 ? ' right' : '')}
      aria-pressed={on} disabled={disabled} onClick={onClick} onMouseEnter={flip} onFocus={flip}>
      <i className="opt-gem" />
      <span className="opt-name">{label}</span>
      {craft && <CraftCard craft={craft} formulas={lore.formulas} />}
      {spell && <SpellCard spell={spell} />}
    </button>
  )
}
