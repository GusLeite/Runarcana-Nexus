import { useEffect, useRef, useState } from 'react'
import { ATTRIBUTES, formatModifier, pointBuySpent, rollDie } from '../../data/rules.js'

export const MAX_ROLLS = 3
const ROLL_MS = 1300

const METHODS = [
  { id: 'POINT_BUY', key: 'pointBuy', label: 'Compra de pontos' },
  { id: 'STANDARD_ARRAY', key: 'standardArray', label: 'Arranjo padrão' },
  { id: 'MANUAL', key: 'manual', label: 'Manual / rolagem' },
]

// Posição dos pontos em cada face (grade 3×3).
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }
// Rotação do cubo que deixa a face n virada para o jogador.
const FACE_TURN = { 1: '', 2: 'rotateY(-90deg)', 3: 'rotateX(-90deg)', 4: 'rotateX(90deg)', 5: 'rotateY(90deg)', 6: 'rotateY(180deg)' }
const FACE_PLACE = [
  [1, 'rotateY(0deg)'], [6, 'rotateY(180deg)'], [2, 'rotateY(90deg)'],
  [5, 'rotateY(-90deg)'], [3, 'rotateX(90deg)'], [4, 'rotateX(-90deg)'],
]

// Dado de 6 faces em 3D: o invólucro gira até zerar e o cubo já está virado para o resultado.
function Die3D({ value, rolling, dropped, n = 0 }) {
  return (
    <span className={'die3d' + (rolling ? ' rolling' : '') + (dropped ? ' dropped' : '')} style={{ '--n': n }}>
      <span className="die3d-spin">
        <span className="die3d-cube" style={{ transform: FACE_TURN[value] }}>
          {FACE_PLACE.map(([face, place]) => (
            <span className="die3d-face" key={face} style={{ transform: place + ' translateZ(var(--half))' }}>
              {Array.from({ length: 9 }, (_, i) => <i key={i} className={PIPS[face].includes(i) ? 'pip' : ''} />)}
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Atributos base pelo método escolhido. A coluna da direita mostra base + bônus (da prévia) = total.
// rolls: quantas rolagens do 4d6 o jogador já gastou (fica no assistente, para não zerar ao trocar de etapa).
export default function AttributeStep({ methods, draft, preview, rolls, onRoll, onMethod, onChange }) {
  const enabled = METHODS.filter(m => methods[m.key] != null)
  const values = draft.baseAttributes
  const method = draft.attributeMethod
  const set = (id, v) => onChange({ ...values, [id]: v })
  const line = id => preview?.attributes.find(a => a.attribute === id)

  const pb = methods.pointBuy
  const spent = method === 'POINT_BUY' ? pointBuySpent(pb, values) : 0
  const array = methods.standardArray ?? []

  // Arranjo padrão: arrastar (ou tocar) um valor até o atributo.
  const [held, setHeld] = useState(null) // { value, from } escolhido por toque/clique
  const [over, setOver] = useState(null) // alvo do arrasto
  const pool = [...array]
  Object.values(values).forEach(v => { const i = pool.indexOf(v); if (v != null && i >= 0) pool.splice(i, 1) })

  const place = (id, drag) => {
    if (!drag) return
    const next = { ...values }
    const previous = next[id]
    next[id] = drag.value
    if (drag.from && drag.from !== id) next[drag.from] = previous ?? null
    onChange(next)
    setHeld(null)
    setOver(null)
  }
  const unplace = drag => {
    if (drag?.from) set(drag.from, null)
    setHeld(null)
    setOver(null)
  }
  const readDrag = e => { try { return JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return null } }
  const startDrag = (e, drag) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(drag))
    e.dataTransfer.effectAllowed = 'move'
    setHeld(null)
  }
  const dropOn = id => ({
    onDragOver: e => { e.preventDefault(); setOver(id) },
    onDragLeave: () => setOver(o => (o === id ? null : o)),
    onDrop: e => { e.preventDefault(); place(id, readDrag(e)) },
  })
  const allPlaced = method === 'STANDARD_ARRAY' && pool.length === 0

  // Rolagem 4d6 (descarta o menor) com dado 3D; no máximo MAX_ROLLS por personagem.
  const [rolling, setRolling] = useState(false)
  const [dice, setDice] = useState(null) // { id: [4 dados] } da última rolagem
  const [trayDice, setTrayDice] = useState([1, 2, 3, 4])
  const timer = useRef()
  useEffect(() => () => clearTimeout(timer.current), [])
  const left = MAX_ROLLS - rolls

  const rollAll = () => {
    if (rolling || left <= 0) return
    const thrown = Object.fromEntries(ATTRIBUTES.map(a => [a.id, Array.from({ length: 4 }, () => rollDie(6))]))
    const sum = d => d.reduce((s, x) => s + x, 0) - Math.min(...d)
    const apply = () => {
      setRolling(false)
      setDice(thrown)
      onChange(Object.fromEntries(ATTRIBUTES.map(a => [a.id, sum(thrown[a.id])])))
    }
    onRoll()
    setTrayDice(Array.from({ length: 4 }, () => rollDie(6)))
    if (reducedMotion()) return apply()
    setRolling(true)
    timer.current = setTimeout(apply, ROLL_MS)
  }

  return (
    <>
      <h4 className="step-title">Defina os atributos</h4>
      <div className="seg method-seg" role="radiogroup" aria-label="Método">
        {enabled.map(m => (
          <button key={m.id} type="button" role="radio" aria-checked={method === m.id} className={method === m.id ? 'on' : ''} onClick={() => onMethod(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {method === 'POINT_BUY' && (
        <div className={'budget' + (spent > pb.points ? ' over' : '')}>
          <span>Pontos gastos</span>
          <b>{spent} <small>/ {pb.points}</small></b>
          <div className="budget-bar"><div style={{ width: Math.min(100, (spent / pb.points) * 100) + '%' }} /></div>
        </div>
      )}

      {method === 'STANDARD_ARRAY' && (
        <div className={'stone-pool' + (over === 'pool' ? ' over' : '') + (allPlaced ? ' done' : '')}
          onDragOver={e => { e.preventDefault(); setOver('pool') }} onDragLeave={() => setOver(o => (o === 'pool' ? null : o))}
          onDrop={e => { e.preventDefault(); unplace(readDrag(e)) }}>
          <span className="stone-hint">
            {allPlaced ? 'Todos os valores distribuídos' : held ? 'Agora toque no atributo' : 'Arraste cada valor até um atributo'}
          </span>
          <div className="stones">
            {pool.map((v, i) => (
              <button type="button" key={v + '-' + i} draggable className={'stone' + (held && !held.from && held.value === v ? ' held' : '')}
                style={{ '--n': i }} aria-label={'Valor ' + v}
                onDragStart={e => startDrag(e, { value: v, from: null })}
                onClick={() => setHeld(h => (h && !h.from && h.value === v ? null : { value: v, from: null }))}>
                {v}
              </button>
            ))}
            {pool.length === 0 && <span className="stone-empty">✦</span>}
          </div>
        </div>
      )}

      {method === 'MANUAL' && (
        <div className="roller">
          <div className={'tray' + (rolling ? ' rolling' : '')} aria-hidden="true">
            {trayDice.map((v, i) => <Die3D key={i + '-' + trayDice.join('')} value={v} rolling={rolling} n={i} />)}
          </div>
          <div className="roller-side">
            <button type="button" className="btn roll-btn" disabled={rolling || left <= 0} onClick={rollAll}>
              {rolling ? 'Rolando…' : left <= 0 ? 'Sem rolagens' : 'Rolar 4d6 para todos'}
            </button>
            <span className="roll-pips" aria-label={left + ' rolagens restantes'}>
              {Array.from({ length: MAX_ROLLS }, (_, i) => <i key={i} className={i < left ? 'on' : ''} />)}
              <small>{left} de {MAX_ROLLS} rolagens</small>
            </span>
            <small className="roller-note">Descarta o menor de cada 4 dados. Você também pode digitar os valores.</small>
          </div>
        </div>
      )}

      <div className="attr-rows">
        {ATTRIBUTES.map((a, n) => {
          const v = values[a.id]
          const l = line(a.id)
          const thrown = method === 'MANUAL' && !rolling ? dice?.[a.id] : null
          const lowest = thrown ? thrown.indexOf(Math.min(...thrown)) : -1
          return (
            <div className={'attr-row' + (method === 'STANDARD_ARRAY' && over === a.id ? ' drop-over' : '') + (rolling && method === 'MANUAL' ? ' shake' : '')}
              key={a.id} style={{ '--n': n, '--pct': Math.min(100, ((l?.total ?? v ?? 0) / 20) * 100) + '%' }}
              {...(method === 'STANDARD_ARRAY' ? dropOn(a.id) : {})}>
              <span className="attr-row-name"><b>{a.abbr}</b> {a.name}</span>
              <span className="attr-row-input">
                {method === 'POINT_BUY' && (
                  <span className="stepper-input">
                    <button type="button" aria-label={'Diminuir ' + a.name} disabled={v <= pb.min} onClick={() => set(a.id, v - 1)}>−</button>
                    <b key={v} className="pop">{v}</b>
                    <button type="button" aria-label={'Aumentar ' + a.name} disabled={v >= pb.max} onClick={() => set(a.id, v + 1)}>+</button>
                    <small className="cost">custo {pb.costs[String(v)] ?? '—'}</small>
                  </span>
                )}
                {method === 'STANDARD_ARRAY' && (
                  <button type="button" className={'slot' + (v != null ? ' filled' : '') + (held ? ' ready' : '')}
                    draggable={v != null} aria-label={a.name + (v != null ? ': ' + v : ': vazio')}
                    onDragStart={e => v != null && startDrag(e, { value: v, from: a.id })}
                    onClick={() => (held ? place(a.id, held) : v != null && setHeld({ value: v, from: a.id }))}>
                    {v != null ? <span key={v} className="stone in-slot">{v}</span> : <span className="slot-empty">—</span>}
                  </button>
                )}
                {method === 'MANUAL' && (
                  <span className="manual-cell">
                    <input type="number" aria-label={a.name} min={methods.manual.min} max={methods.manual.max} value={v ?? ''}
                      onChange={e => set(a.id, e.target.value === '' ? null : Number(e.target.value))} />
                    {thrown && (
                      <span className="mini-dice" aria-hidden="true">
                        {thrown.map((d, i) => <em key={i} className={i === lowest ? 'drop' : ''} style={{ '--n': i }}>{d}</em>)}
                      </span>
                    )}
                  </span>
                )}
              </span>
              <span className="attr-row-result">
                {l && l.bonus !== 0 && <span className="bonus-chip">{formatModifier(l.bonus)}</span>}
                <span key={l?.total} className="total pop">{l ? l.total : '—'}</span>
                <span className="mod">{l ? formatModifier(l.modifier) : ''}</span>
              </span>
              <span className="attr-meter" aria-hidden="true" />
            </div>
          )
        })}
      </div>
    </>
  )
}
