import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import SoundToggle from './audio/SoundToggle.jsx'
import { installUiSounds } from './audio/uiSounds.js'
import './styles/global.css'
// Por último, para as animações de polimento valerem por cima dos outros estilos.
import './styles/motion.css'

installUiSounds()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <SoundToggle />
  </StrictMode>,
)
