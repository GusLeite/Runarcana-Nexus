import { useEffect } from 'react'
import { setScene } from './engine.js'

// Muda o tom do som de fundo conforme a tela ('hall', 'sheet', 'master', 'creation'); null não mexe.
export default function useScene(name) {
  useEffect(() => {
    if (name) setScene(name)
  }, [name])
}
