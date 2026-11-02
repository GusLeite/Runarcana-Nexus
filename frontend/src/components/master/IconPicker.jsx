import { useId, useRef, useState } from 'react'
import AbilityIcon from '../sheet/AbilityIcon.jsx'
import { fileToIcon, isIconLink } from '../../utils/iconImage.js'

// Lê o arquivo, reduz para 128x128 e devolve o data URL (ou a mensagem de erro).
async function readIcon(file, onChange, onError, setBusy) {
  setBusy(true)
  try {
    onChange(await fileToIcon(file))
  } catch (err) {
    onError(err.message)
  } finally {
    setBusy(false)
  }
}

// Escolha do ícone no formulário do mestre: enviar arquivo, arrastar e soltar, colar link ou remover.
export default function IconPicker({ ability, value, onChange, onError }) {
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const [linkMode, setLinkMode] = useState(false)
  const [link, setLink] = useState('')
  const input = useRef()
  const id = useId()

  const pick = file => file && readIcon(file, onChange, onError, setBusy)
  const useLink = () => {
    if (!isIconLink(link.trim())) return onError('O link da imagem deve começar com http:// ou https://.')
    onChange(link.trim())
    setLink('')
    setLinkMode(false)
  }

  return (
    <div className="icon-picker">
      <div
        className={'icon-drop' + (over ? ' over' : '')}
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]) }}
        title="Arraste uma imagem aqui"
      >
        <AbilityIcon ability={{ ...ability, icon: value || null }} big />
        {busy && <span className="icon-busy">…</span>}
      </div>
      <div className="icon-actions">
        <input ref={input} id={id} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden
          onChange={e => { pick(e.target.files?.[0]); e.target.value = '' }} />
        <button type="button" className="ghost-btn small" disabled={busy} onClick={() => input.current.click()}>
          {value ? 'Trocar imagem' : 'Enviar imagem'}
        </button>
        <button type="button" className="link-btn" onClick={() => setLinkMode(m => !m)}>{linkMode ? 'Cancelar link' : 'ou colar um link'}</button>
        {value && <button type="button" className="link-btn danger" onClick={() => onChange('')}>Remover</button>}
        {linkMode && (
          <div className="icon-link">
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://…/icone.png" aria-label="Link da imagem do ícone"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); useLink() } }} />
            <button type="button" className="ghost-btn small" onClick={useLink}>Usar</button>
          </div>
        )}
        <span className="icon-hint">PNG, JPG, WebP ou GIF. Vira um quadrado de 128 px (recorte central).</span>
      </div>
    </div>
  )
}

// Ícone clicável na lista do mestre: troca a imagem de uma habilidade já cadastrada (ou remove).
export function IconSwap({ ability, onPick, onError }) {
  const [busy, setBusy] = useState(false)
  const input = useRef()
  return (
    <span className="icon-swap">
      <button type="button" className="icon-swap-btn" disabled={busy} onClick={() => input.current.click()} aria-label={'Trocar ícone de ' + ability.name} title="Trocar ícone">
        <AbilityIcon ability={ability} />
        <span className="icon-swap-hint">{busy ? '…' : 'Trocar'}</span>
      </button>
      {ability.icon && (
        <button type="button" className="icon-swap-x" onClick={() => onPick(null)} aria-label={'Tirar ícone de ' + ability.name} title="Tirar imagem">×</button>
      )}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) readIcon(f, onPick, onError, setBusy) }} />
    </span>
  )
}
