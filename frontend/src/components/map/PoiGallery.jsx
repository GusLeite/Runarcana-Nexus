import { useEffect, useState } from 'react'
import { addPoiImage, fetchPoiImages, removePoiImage, showPoiImage } from '../../api/map.js'
import { fileToBanner, isIconLink } from '../../utils/iconImage.js'

export const MAX_POI_IMAGES = 6

// Imagem em tela cheia (a galeria do mestre e o MOSTRAR À MESA dos jogadores). Esc ou clique fora fecha.
export function ImageLightbox({ images, index, title, onIndex, onClose }) {
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      else if (e.key === 'ArrowRight' && index < images.length - 1) onIndex(index + 1)
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [index, images.length, onIndex, onClose])

  return (
    <div className="map-lightbox" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <img src={images[index]} alt={title} onClick={e => e.stopPropagation()} />
      <div className="map-lightbox-bar" onClick={e => e.stopPropagation()}>
        {images.length > 1 && <button type="button" className="map-btn" disabled={index === 0} onClick={() => onIndex(index - 1)} aria-label="Imagem anterior">‹</button>}
        <span>{title}{images.length > 1 ? ` · ${index + 1}/${images.length}` : ''}</span>
        {images.length > 1 && <button type="button" className="map-btn" disabled={index === images.length - 1} onClick={() => onIndex(index + 1)} aria-label="Próxima imagem">›</button>}
        <button type="button" className="map-btn" onClick={onClose} aria-label="Fechar a imagem">×</button>
      </div>
    </div>
  )
}

// Galeria do ponto. Todos que veem o ponto olham; o mestre envia, apaga e mostra à mesa.
export default function PoiGallery({ token, poi, master, onPoi, onNotice }) {
  const [images, setImages] = useState([])
  const [open, setOpen] = useState(null)
  const [link, setLink] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (poi.imageCount === 0) { setImages([]); return undefined }
    let alive = true
    fetchPoiImages(token, poi.id).then(list => { if (alive) setImages(list) }).catch(() => {})
    return () => { alive = false }
  }, [token, poi.id, poi.imageCount])

  const run = async job => {
    setBusy(true)
    setMsg(null)
    try {
      await job()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  const add = image => run(async () => onPoi(await addPoiImage(token, poi.id, image)))
  const chooseFile = file => {
    if (!file) return
    run(async () => onPoi(await addPoiImage(token, poi.id, await fileToBanner(file))))
  }
  const addLink = e => {
    e.preventDefault()
    if (!isIconLink(link.trim())) return setMsg('Cole um link http(s) de imagem.')
    add(link.trim()).then(() => setLink(''))
  }
  const remove = index => run(async () => onPoi(await removePoiImage(token, poi.id, index)))
  const show = index => run(async () => {
    onPoi(await showPoiImage(token, poi.id, index))
    onNotice?.('Imagem aberta na tela dos jogadores que veem este ponto.')
  })

  if (!master && poi.imageCount === 0) return null
  return (
    <section className="map-gallery" aria-label="Imagens do ponto">
      <h3>Imagens</h3>
      {poi.imageCount === 0 && <p className="lore-form-hint">Nenhuma imagem ainda.</p>}
      <ul className="map-gallery-grid">
        {images.map((src, index) => (
          <li key={index}>
            <button type="button" className="map-gallery-thumb" onClick={() => setOpen(index)} aria-label={`Abrir imagem ${index + 1}`}>
              <img src={src} alt="" loading="lazy" />
            </button>
            {master && (
              <span className="map-gallery-actions">
                <button type="button" className="lore-action map-gallery-show" disabled={busy} onClick={() => show(index)}>MOSTRAR À MESA</button>
                <button type="button" className="lore-link danger" disabled={busy} onClick={() => remove(index)}>Apagar</button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {master && poi.imageCount < MAX_POI_IMAGES && (
        <form className="lore-form map-gallery-add" onSubmit={addLink}>
          <label className="lore-action ghost map-gallery-file">
            ENVIAR IMAGEM
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden disabled={busy} onChange={e => { chooseFile(e.target.files[0]); e.target.value = '' }} />
          </label>
          <input aria-label="Link da imagem" placeholder="ou cole um link https://…" value={link} onChange={e => setLink(e.target.value)} />
          <button type="submit" className="lore-action ghost" disabled={busy || !link.trim()}>ADICIONAR LINK</button>
        </form>
      )}
      {msg && <p className="lore-form-error" role="alert">{msg}</p>}
      {open !== null && images[open] && <ImageLightbox images={images} index={open} title={poi.name} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </section>
  )
}
