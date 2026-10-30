import { useRef, useState } from 'react'
import { originArt } from '../../data/originArt.js'
import OriginArt from './OriginArt.jsx'
import OriginStage from './OriginStage.jsx'
import '../../styles/origin.css'

const ROW = 5

// Etapa Origem: galeria de painéis que se expandem, como a seleção de personagem. Clicar abre o destaque
// (OriginStage), onde estão os detalhes e onde a escolha é confirmada.
export default function OriginStep({ origins, crafts, equipment, originId, lineageId, onPick }) {
  const [openId, setOpenId] = useState(null)
  const gallery = useRef()

  if (!origins?.length) {
    return <p className="muted-note">Nenhuma opção cadastrada ainda nas regras de criação.</p>
  }

  const cardOf = id => gallery.current?.querySelector(`[data-origin="${id}"]`)
  const chosen = origins.find(o => o.id === originId)
  const chosenLineage = chosen?.lineages?.find(l => l.id === lineageId)
  const rows = []
  for (let i = 0; i < origins.length; i += ROW) rows.push(origins.slice(i, i + ROW))

  return (
    <>
      <h4 className="step-title">Escolha a origem</h4>
      <p className="step-hint">Abra uma origem para ver tudo o que ela concede antes de decidir.</p>
      <div className="origin-gallery" ref={gallery}>
        {rows.map((row, r) => (
          <div className="origin-row" key={r}>
            {row.map((origin, c) => {
              const art = originArt(origin)
              const on = origin.id === originId
              return (
                <button
                  key={origin.id}
                  type="button"
                  data-origin={origin.id}
                  aria-haspopup="dialog"
                  aria-pressed={on}
                  className={'ocard' + (on ? ' on' : '') + (openId === origin.id ? ' out' : '')}
                  style={{ '--h': art.hue, '--n': r * ROW + c }}
                  onClick={() => setOpenId(origin.id)}
                >
                  <OriginArt id={origin.id} art={art} />
                  <span className="ocard-shade" />
                  {on && <span className="ocard-seal">✓ Escolhida</span>}
                  <span className="ocard-cap">
                    <span className="ocard-kicker">
                      {on && chosenLineage ? chosenLineage.name : origin.lineages?.length ? origin.lineages.length + ' linhagens' : 'Sem linhagens'}
                    </span>
                    <span className="ocard-name">{origin.name}</span>
                    <span className="ocard-rule" />
                    <span className="ocard-tag">{art.tagline}</span>
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
      {openId && (
        <OriginStage
          origins={origins}
          startId={openId}
          crafts={crafts}
          equipment={equipment}
          originId={originId}
          lineageId={lineageId}
          cardOf={cardOf}
          onMove={setOpenId}
          onConfirm={onPick}
          onClose={id => {
            setOpenId(null)
            cardOf(id)?.focus()
          }}
        />
      )}
    </>
  )
}
