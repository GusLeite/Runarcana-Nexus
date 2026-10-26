import { documentKindOf, formatDate, formatModifier, modifier } from '../../data/rules.js'
import AttributeGrid from './AttributeGrid.jsx'
import SkillList from './SkillList.jsx'
import SavingThrows from './SavingThrows.jsx'
import { RollLog } from './DiceRoll.jsx'
import { RichText } from './DocumentsTab.jsx'
import { keysFor } from './AbilitiesTab.jsx'
import AbilityIcon from './AbilityIcon.jsx'
import Num from './Num.jsx'
import { DocIcon, PinIcon } from './icons.jsx'

const MODES = [
  { id: 'dis', label: 'Desvantagem' },
  { id: 'normal', label: 'Normal' },
  { id: 'adv', label: 'Vantagem' },
]

// Aba principal: atributos, estatísticas e perícias no centro; à direita, rolagens e atalhos
// para as outras abas (habilidades, documentos novos e a anotação fixada).
export default function OverviewTab({ sheet, abilities, documents, notes, rolls, mode, onMode, onRoll, onRollDice, onGo }) {
  const initiative = modifier(sheet.dex)
  const conMod = modifier(sheet.con)
  const quick = abilities.filter(a => a.type !== 'PASSIVE').slice(0, 5)
  const keys = keysFor(abilities)
  const recentDocs = documents.slice(0, 3)
  const note = notes.find(n => n.pinned) ?? notes[0]

  return (
    <>
      <div className="sheet-col">
        <section className="card" style={{ '--i': 1 }}>
          <h3 className="card-title">Atributos <small>clique para rolar</small></h3>
          <AttributeGrid sheet={sheet} onRoll={onRoll} />
        </section>
        <section className="card stats" style={{ '--i': 2 }}>
          <Stat label="Proficiência" value={<Num value={sheet.proficiencyBonus} format={formatModifier} />} />
          <Stat label="Iniciativa" value={<Num value={initiative} format={formatModifier} />} onClick={() => onRoll('Iniciativa', initiative)} />
          <Stat label="Percepção passiva" value={<Num value={sheet.passivePerception} />} />
          <Stat label="Intuição passiva" value={<Num value={sheet.passiveInsight} />} />
          <Stat
            label="Dados de vida"
            value={sheet.level + 'd' + sheet.hitDie}
            title={`Clique para rolar 1d${sheet.hitDie} ${formatModifier(conMod)} (CON)`}
            onClick={() => onRollDice('Dado de vida', '1d' + sheet.hitDie + (conMod >= 0 ? '+' : '-') + Math.abs(conMod))}
          />
          <Stat label="Inspiração" value={sheet.inspiration > 0 ? '◆'.repeat(Math.min(sheet.inspiration, 5)) : '—'} lit={sheet.inspiration > 0} />
        </section>
        <section className="card" style={{ '--i': 3 }}>
          <SavingThrows sheet={sheet} onRoll={onRoll} />
        </section>
        <section className="card" style={{ '--i': 4 }}>
          <SkillList skills={sheet.skills} onRoll={onRoll} />
        </section>
      </div>

      <div className="sheet-col">
        <section className="card" style={{ '--i': 2 }}>
          <div className="card-title inv-title">
            <h3>Rolagens <small>R para rolar</small></h3>
          </div>
          <div className="seg mode-seg" role="group" aria-label="Modo das rolagens de d20">
            {MODES.map(m => (
              <button key={m.id} type="button" className={(mode === m.id ? 'on ' : '') + m.id} aria-pressed={mode === m.id} onClick={() => onMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <RollLog rolls={rolls} />
        </section>

        <section className="card" style={{ '--i': 3 }}>
          <div className="card-title inv-title">
            <h3>Habilidades</h3>
            <button type="button" className="link-btn" onClick={() => onGo('abilities')}>Ver todas</button>
          </div>
          {quick.length === 0 ? <p className="muted-note">Sem habilidades ativas ainda.</p> : (
            <div className="hotbar">
              {quick.map((a, n) => (
                <button
                  key={a.id}
                  type="button"
                  className={'hot-slot t-' + a.type.toLowerCase() + (a.maxUses != null && a.usesLeft === 0 ? ' spent' : '')}
                  style={{ '--n': n }}
                  onClick={() => (a.damage ? onRollDice(a.name, a.damage) : onGo('abilities', a.id))}
                  title={a.damage ? `${a.name}: rolar ${a.damage}` : a.name}
                >
                  <AbilityIcon ability={a} hotkey={keys[a.id] ?? (a.type === 'SPELL' ? (a.spellLevel ? String(a.spellLevel) : 'T') : null)} />
                  <span className="hot-name">{a.name}</span>
                  {a.maxUses != null && <span className="hot-uses">{a.usesLeft}/{a.maxUses}</span>}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="card" style={{ '--i': 4 }}>
          <div className="card-title inv-title">
            <h3>Documentos</h3>
            <button type="button" className="link-btn" onClick={() => onGo('documents')}>Abrir</button>
          </div>
          {recentDocs.length === 0 ? <p className="muted-note">Nenhum documento do mestre ainda.</p> : (
            <ul className="docs compact">
              {recentDocs.map((doc, n) => {
                const kind = documentKindOf(doc.kind)
                return (
                  <li key={doc.id}>
                    <button type="button" className={'doc-row' + (doc.read ? '' : ' unread')} style={{ '--k': kind.color, '--n': n }} onClick={() => onGo('documents', doc.id)}>
                      <span className="doc-seal"><DocIcon kind={doc.kind} /></span>
                      <span className="doc-info">
                        <span className="doc-name">{doc.title}</span>
                        <span className="doc-meta">{kind.name} · {formatDate(doc.createdAt)}</span>
                      </span>
                      {!doc.read && <span className="new-badge">NOVO</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card" style={{ '--i': 5 }}>
          <div className="card-title inv-title">
            <h3>{note?.pinned ? 'Anotação fixada' : 'Última anotação'}</h3>
            <button type="button" className="link-btn" onClick={() => onGo('notes', note?.id)}>{note ? 'Editar' : 'Escrever'}</button>
          </div>
          {note ? (
            <button type="button" className="note-peek" onClick={() => onGo('notes', note.id)}>
              <span className="note-peek-title">{note.pinned && <PinIcon />}{note.title}</span>
              <span className="note-peek-body"><RichText text={(note.body ?? '').slice(0, 420) + ((note.body ?? '').length > 420 ? '…' : '')} /></span>
            </button>
          ) : <p className="muted-note">Fixe uma anotação para ela aparecer aqui.</p>}
        </section>
      </div>
    </>
  )
}

function Stat({ label, value, onClick, lit, title }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={'stat' + (onClick ? ' clickable' : '') + (lit ? ' lit' : '')} type={onClick ? 'button' : undefined} onClick={onClick} title={title}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </Tag>
  )
}
