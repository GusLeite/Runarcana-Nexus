import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { originArt } from '../../data/originArt.js'
import OriginArt from './OriginArt.jsx'
import OriginStage from './OriginStage.jsx'
import '../../styles/origin.css'

// Etapa Origem: um salão que cobre a tela abaixo da barra do topo, com um painel vertical por origem, como a
// seleção de personagem. O painel sob o mouse se expande; clicar abre o destaque (OriginStage), onde estão os
// detalhes e onde a escolha é confirmada.
export default function OriginStep({ origins, crafts, equipment, originId, lineageId, onPick, onNext }) {
  const [openId, setOpenId] = useState(null)
  const [top, setTop] = useState(0)
  const hall = useRef()

  // O salão começa logo abaixo da barra do topo, seja qual for a altura dela (muda no celular).
  useLayoutEffect(() => {
    const measure = () => setTop(document.querySelector('header.topbar')?.getBoundingClientRect().bottom ?? 0)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  if (!origins?.length) {
    return <p className="muted-note">Nenhuma opção cadastrada ainda nas regras de criação.</p>
  }

  const cardOf = id => hall.current?.querySelector(`[data-origin="${id}"]`)
  const chosen = origins.find(o => o.id === originId)
  const chosenLineage = chosen?.lineages?.find(l => l.id === lineageId)

  // Em portal: um ancestral com container-type prenderia o position:fixed dentro do cartão do assistente.
  return (
    <>
      {createPortal(
      <div className="ohall" ref={hall} style={{ top }}>
        <h4 className="ohall-title">Escolha a origem</h4>
        <div className="origin-row" role="group" aria-label="Origens">
          {origins.map((origin, n) => {
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
                style={{ '--h': art.hue, '--n': n }}
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
        <div className="ohall-bar">
          <span className="ohall-status">
            {chosen
              ? <>Origem: <b>{chosen.name}{chosenLineage ? ' · ' + chosenLineage.name : ''}</b></>
              : 'Passe o mouse sobre uma origem e clique para ver o que ela concede.'}
          </span>
          <button type="button" className="btn next-btn" disabled={!chosen || (chosen.lineages?.length > 0 && !chosenLineage)} onClick={onNext}>PRÓXIMO</button>
        </div>
      </div>,
      document.body,
      )}
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
