import { useState } from 'react'
import { fileToIcon, isIconLink } from '../../utils/iconImage.js'
import ItemIcon from '../sheet/ItemIcon.jsx'

// Imagem de um item: envia um arquivo (vira um quadrado 192x192 em WebP, leve para ir junto da ficha) ou cola um link.
// value é o link ou a imagem enviada (data URL); vazio = sem imagem (o ícone do tipo continua valendo).
export default function ItemImageField({ value, onChange, kind = 'OBJECT' }) {
  const [error, setError] = useState(null)
  const uploaded = value.startsWith('data:')
  const chooseFile = file => {
    if (!file) return
    setError(null)
    fileToIcon(file, 192).then(onChange).catch(err => setError(err.message))
  }
  return (
    <div className="item-image-field">
      <span className="mlabel">Imagem <small>opcional</small></span>
      <div className="item-image-row">
        <span className="slot mini item-image-preview"><ItemIcon item={{ kind, image: value || null }} /></span>
        <div className="item-image-controls">
          <label className="hp-act item-image-file">
            {value ? 'Trocar imagem' : 'Enviar imagem'}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e => { chooseFile(e.target.files[0]); e.target.value = '' }} />
          </label>
          {value && <button type="button" className="link-btn danger" onClick={() => onChange('')}>Remover imagem</button>}
        </div>
      </div>
      <input aria-label="Link da imagem" value={uploaded ? '' : value} disabled={uploaded} maxLength={1000}
        placeholder={uploaded ? 'Imagem enviada (remova para usar um link)' : 'ou cole um link https://…'}
        onChange={e => { setError(null); onChange(e.target.value) }} />
      {!uploaded && value && !isIconLink(value) && <p className="muted-note" role="alert">O link deve começar com http:// ou https://.</p>}
      {error && <p className="muted-note" role="alert">{error}</p>}
    </div>
  )
}
