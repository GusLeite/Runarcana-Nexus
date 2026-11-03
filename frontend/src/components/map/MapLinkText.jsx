import { openMapAt, splitMapLinks } from '../../utils/mapLink.js'

// Pedaços de texto, com os links do mapa desta página viram botões "Ver no mapa" (diário, comentários, documentos, lore).
export function mapLinkNodes(text) {
  return splitMapLinks(text).map((part, i) => part.link
    ? <button key={i} type="button" className="map-text-link" title={part.link} onClick={() => openMapAt(part.focus.poiId ?? part.focus.slug)}>📍 Ver no mapa</button>
    : part.text)
}
