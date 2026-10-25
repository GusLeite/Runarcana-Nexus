// Divisória ornamentada entre personagens: linha dourada com losangos; acende quando um vizinho recebe o mouse.
export default function Separator({ hidden, lit }) {
  return (
    <div className={'sep' + (hidden ? ' off' : '') + (lit ? ' lit' : '')}>
      <i className="ln" />
      <i className="dm" style={{ '--p': '20%' }} />
      <i className="dm big" style={{ '--p': '50%' }} />
      <i className="dm" style={{ '--p': '80%' }} />
    </div>
  )
}
