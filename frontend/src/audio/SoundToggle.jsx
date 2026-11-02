import { useSyncExternalStore } from 'react'
import { getPrefs, setPrefs, subscribe } from './engine.js'
import '../styles/sound.css'

// Controle fixo no canto: liga/desliga efeitos e música de fundo e ajusta o volume. Fica guardado no navegador.
export default function SoundToggle() {
  const prefs = useSyncExternalStore(subscribe, getPrefs)
  return (
    <div className="snd" role="group" aria-label="Som">
      <button type="button" className={'snd-btn' + (prefs.sfx ? ' on' : '')} aria-pressed={prefs.sfx} data-sfx="none"
        title={prefs.sfx ? 'Silenciar efeitos' : 'Ativar efeitos'} aria-label="Efeitos sonoros" onClick={() => setPrefs({ sfx: !prefs.sfx })}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />
          {prefs.sfx
            ? <path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            : <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
        </svg>
      </button>
      <button type="button" className={'snd-btn' + (prefs.ambient ? ' on' : '')} aria-pressed={prefs.ambient} data-sfx="none"
        title={prefs.ambient ? 'Silenciar música de fundo' : 'Ativar música de fundo'} aria-label="Música de fundo" onClick={() => setPrefs({ ambient: !prefs.ambient })}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 17.5V6.5l10-2v11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <ellipse cx="6.8" cy="17.5" rx="2.6" ry="2" fill="currentColor" />
          <ellipse cx="16.8" cy="15.5" rx="2.6" ry="2" fill="currentColor" />
          {!prefs.ambient && <path d="M3.5 3.5l17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
        </svg>
      </button>
      <input type="range" className="snd-vol" min="0" max="1" step="0.05" value={prefs.volume} aria-label="Volume"
        onChange={e => setPrefs({ volume: Number(e.target.value) })} />
    </div>
  )
}
