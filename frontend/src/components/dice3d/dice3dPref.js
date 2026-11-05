// Liga/desliga dos dados 3D, lembrado no navegador. Sem WebGL ou com "reduzir movimento", fica sempre desligado.
import { useEffect, useState } from 'react'

const KEY = 'runarcana.dice3d'
const listeners = new Set()
let supported = null

export function dice3dSupported() {
  if (supported == null) {
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let webgl = false
    try {
      const c = document.createElement('canvas')
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      webgl = false
    }
    supported = !reduced && webgl
  }
  return supported
}

export function getDice3d() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setDice3d(on) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // sem armazenamento: vale até recarregar
  }
  listeners.forEach(fn => fn(on))
}

// [ligado (e possível), trocar, possível neste aparelho]
export function useDice3d() {
  const [on, setOn] = useState(getDice3d)
  useEffect(() => {
    listeners.add(setOn)
    return () => listeners.delete(setOn)
  }, [])
  const ok = dice3dSupported()
  return [on && ok, setDice3d, ok]
}
