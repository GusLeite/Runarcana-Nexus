import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { formatModifier } from '../../data/rules.js'

// Modo "de onde vem": com ele ligado, passar o mouse (ou o foco) por um atributo, pelos PV ou por um ataque
// mostra cada fonte do número. Quem explica chama bind(() => ({ title, total, lines })) e espalha o resultado
// no elemento; com o modo desligado bind devolve {} e nada muda.
const ExplainContext = createContext({ on: false, breakdown: null, unavailable: false, bind: () => ({}) })

export const useExplain = () => useContext(ExplainContext)

const WIDTH = 300

export function ExplainProvider({ on, breakdown, unavailable, children }) {
  const [tip, setTip] = useState(null)

  const bind = useCallback(build => {
    if (!on) return {}
    const show = e => {
      // O foco de um campo dentro do elemento (ex.: a quantidade de PV) não abre a dica.
      if (e.type === 'focus' && e.target !== e.currentTarget) return
      const rect = e.currentTarget.getBoundingClientRect()
      setTip({ rect, content: build() })
    }
    const hide = () => setTip(null)
    return { onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide }
  }, [on])

  const value = useMemo(() => ({ on, breakdown, unavailable, bind }), [on, breakdown, unavailable, bind])

  return (
    <ExplainContext.Provider value={value}>
      {children}
      {on && tip && <Tip rect={tip.rect} content={tip.content} unavailable={unavailable} />}
    </ExplainContext.Provider>
  )
}

// Abaixo do elemento (ou acima, se não couber), sempre dentro da janela.
function Tip({ rect, content, unavailable }) {
  const left = Math.max(8, Math.min(rect.left + rect.width / 2 - WIDTH / 2, window.innerWidth - WIDTH - 8))
  const below = rect.bottom + 8
  const style = window.innerHeight - rect.bottom > 260 || rect.top < 260
    ? { left, top: below, width: WIDTH }
    : { left, bottom: window.innerHeight - rect.top + 8, width: WIDTH }
  return (
    <div className="explain-tip" role="tooltip" style={style}>
      {content ? (
        <>
          <div className="explain-title">{content.title}</div>
          <ul>
            {content.lines.map((l, i) => (
              <li key={i} className={l.amount < 0 ? 'neg' : l.amount === 0 ? 'zero' : undefined}>
                <span>{l.label}</span>
                <b>{i === 0 && !content.signed ? l.amount : formatModifier(l.amount)}</b>
              </li>
            ))}
          </ul>
          <div className="explain-total"><span>Total</span><b>{content.signed ? formatModifier(content.total) : content.total}</b></div>
        </>
      ) : (
        <p className="explain-none">
          {unavailable ? 'Esta ficha não guarda as escolhas da criação, então não dá para detalhar.' : 'Carregando a origem dos pontos…'}
        </p>
      )}
    </div>
  )
}
