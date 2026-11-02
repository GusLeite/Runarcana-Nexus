import { ALIGNMENT_NAMES } from '../../data/rules.js'

// Nome, jogador, idade, altura e alinhamento (a região tem etapa própria).
export default function DetailsStep({ draft, onChange }) {
  return (
    <>
      <h4 className="step-title">Detalhes do personagem</h4>
      <div className="mform details">
        <label htmlFor="c-name">Nome do personagem</label>
        <input id="c-name" value={draft.characterName} maxLength={80} onChange={e => onChange('characterName', e.target.value)} placeholder="Ex.: Rudo" />

        <label htmlFor="c-player">Jogador</label>
        <input id="c-player" value={draft.playerName} maxLength={80} onChange={e => onChange('playerName', e.target.value)} />

        <div className="mrow">
          <div>
            <label htmlFor="c-age">Idade</label>
            <input id="c-age" type="number" min="1" value={draft.age} onChange={e => onChange('age', e.target.value)} />
          </div>
          <div>
            <label htmlFor="c-height">Altura (m)</label>
            <input id="c-height" inputMode="decimal" value={draft.height} onChange={e => onChange('height', e.target.value)} placeholder="1,75" />
          </div>
          <div>
            <label htmlFor="c-align">Alinhamento</label>
            <select id="c-align" value={draft.alignment ?? ''} onChange={e => onChange('alignment', e.target.value || null)}>
              <option value="">—</option>
              {Object.entries(ALIGNMENT_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
        </div>
      </div>
    </>
  )
}
