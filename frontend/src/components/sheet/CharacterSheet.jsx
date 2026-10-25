import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchSheet } from '../../api/character.js'
import { formatModifier, modifier, rollD20 } from '../../data/rules.js'
import SheetHero from './SheetHero.jsx'
import AttributeGrid from './AttributeGrid.jsx'
import SkillList from './SkillList.jsx'
import Inventory from './Inventory.jsx'
import DiceRoll, { RollLog } from './DiceRoll.jsx'
import { CoinIcon, ExitIcon, KeyIcon } from './icons.jsx'
import '../../styles/sheet.css'

const MAX_LOG = 8

// Tela pós-login: a ficha do personagem no estilo do cliente do LoL.
// Arte e cores vêm de data/characters.js; os números, de GET /character/me.
export default function CharacterSheet({ character, session, notice, onChangePassword, onLogout, onExpired }) {
  const [state, setState] = useState({ status: 'loading' })
  const [rolls, setRolls] = useState([])
  const [current, setCurrent] = useState(null)
  const [toast, setToast] = useState(notice)
  // Em ref para a busca não repetir a cada render do App (o callback muda de identidade).
  const expired = useRef(onExpired)
  expired.current = onExpired

  const load = useCallback(() => {
    setState({ status: 'loading' })
    fetchSheet(session.token)
      .then(sheet => setState({ status: 'ready', sheet }))
      .catch(err => {
        if (err.status === 401) expired.current()
        else if (err.status === 404) setState({ status: 'empty', message: err.message })
        else setState({ status: 'error', message: err.message })
      })
  }, [session.token])

  useEffect(load, [load])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const roll = useCallback((label, mod = 0) => {
    const d20 = rollD20()
    const entry = { id: Date.now() + Math.random(), label, mod, d20, total: d20 + mod }
    setCurrent(entry)
    setRolls(list => [entry, ...list].slice(0, MAX_LOG))
  }, [])

  const sheet = state.status === 'ready' ? state.sheet.character : null
  const initiative = sheet ? modifier(sheet.dex) : 0

  // Atalho: R rola um d20 puro, Esc fecha a rolagem.
  useEffect(() => {
    const onKey = e => {
      if (e.target.closest?.('input, textarea')) return
      if (e.key === 'Escape') setCurrent(null)
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) roll('d20')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [roll])

  const motes = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    '--x': ((i * 37) % 100) + '%',
    '--d': 9 + ((i * 7) % 9) + 's',
    '--dl': -((i * 13) % 17) + 's',
    '--s': 2 + (i % 3) + 'px',
  })), [])

  return (
    <div className="sheet" style={{ '--h': character.hue }}>
      <div className="sheet-bg" style={{ backgroundImage: `url("${character.img}")` }} aria-hidden="true" />
      <div className="sheet-motes" aria-hidden="true">
        {motes.map((style, i) => <span key={i} style={style} />)}
      </div>

      <header className="topbar">
        <div className="topbar-left">
          <div className="logo">RUNARCANA</div>
          <nav className="tabs" aria-label="Seções">
            <span className="tab on" aria-current="page">FICHA</span>
          </nav>
        </div>
        <button className="play" type="button" onClick={() => roll('d20')} title="Atalho: R">
          <span>ROLAR D20</span>
        </button>
        <div className="topbar-right">
          {sheet && (
            <div className="purse" title="Ouro">
              <CoinIcon />
              <b>{sheet.gold.toLocaleString('pt-BR')}</b>
            </div>
          )}
          <div className="who">
            <span className="who-name">{character.name}</span>
            <span className="who-sub">{session.username}</span>
          </div>
          <button className="icon-btn" type="button" onClick={onChangePassword} title="Alterar senha" aria-label="Alterar senha">
            <KeyIcon />
          </button>
          <button className="icon-btn" type="button" onClick={onLogout} title="Sair" aria-label="Sair">
            <ExitIcon />
          </button>
        </div>
      </header>

      <main className="sheet-body">
        <SheetHero character={character} sheet={sheet} />

        {state.status === 'loading' && (
          <div className="sheet-state" role="status"><div className="hex-spinner" />Abrindo a ficha…</div>
        )}
        {(state.status === 'empty' || state.status === 'error') && (
          <div className="sheet-state card">
            <h3>{state.status === 'empty' ? 'Ficha em branco' : 'Algo deu errado'}</h3>
            <p>{state.message}</p>
            {state.status === 'error' && <button className="ghost-btn" type="button" onClick={load}>Tentar de novo</button>}
          </div>
        )}

        {sheet && (
          <>
            <div className="sheet-col">
              <section className="card" style={{ '--i': 1 }}>
                <h3 className="card-title">Atributos <small>clique para rolar</small></h3>
                <AttributeGrid sheet={sheet} onRoll={roll} />
              </section>
              <section className="card stats" style={{ '--i': 2 }}>
                <Stat label="Proficiência" value={formatModifier(sheet.proficiencyBonus)} />
                <Stat label="Iniciativa" value={formatModifier(initiative)} onClick={() => roll('Iniciativa', initiative)} />
                <Stat label="Percepção passiva" value={sheet.passivePerception} />
                <Stat label="Intuição passiva" value={sheet.passiveInsight} />
                <Stat label="Inspiração" value={sheet.inspiration > 0 ? '◆'.repeat(Math.min(sheet.inspiration, 5)) : '—'} lit={sheet.inspiration > 0} />
              </section>
              <section className="card" style={{ '--i': 3 }}>
                <SkillList skills={sheet.skills} onRoll={roll} />
              </section>
            </div>

            <div className="sheet-col">
              <section className="card" style={{ '--i': 2 }}>
                <Inventory items={state.sheet.inventory} strength={sheet.str} />
              </section>
              <section className="card" style={{ '--i': 4 }}>
                <h3 className="card-title">Rolagens <small>R para rolar</small></h3>
                <RollLog rolls={rolls} />
              </section>
            </div>
          </>
        )}
      </main>

      <DiceRoll roll={current} onClose={() => setCurrent(null)} />
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function Stat({ label, value, onClick, lit }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={'stat' + (onClick ? ' clickable' : '') + (lit ? ' lit' : '')} type={onClick ? 'button' : undefined} onClick={onClick}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </Tag>
  )
}
