import '../../styles/master.css'

// Portal do mestre sobre a tela de seleção: anéis hextech girando atrás do formulário (login ou senha).
export default function MasterGate({ children }) {
  return (
    <div className="gate" role="dialog" aria-modal="true" aria-label="Entrada do mestre">
      <div className="gate-rings" aria-hidden="true">
        <span className="ring-a" />
        <span className="ring-b" />
        <span className="ring-c" />
      </div>
      <div className="gate-form">{children}</div>
    </div>
  )
}
