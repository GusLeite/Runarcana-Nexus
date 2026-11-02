import { useCountUp } from '../../hooks/useCountUp.js'

// Número que conta até o valor (ex.: modificadores, PV, ouro). format recebe o número já animado.
export default function Num({ value, format = n => n.toLocaleString('pt-BR'), duration }) {
  const shown = useCountUp(value, duration)
  return <>{format(shown)}</>
}
