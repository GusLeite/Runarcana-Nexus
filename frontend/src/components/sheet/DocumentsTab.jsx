import { useEffect, useState } from 'react'
import { documentKindOf, formatDate } from '../../data/rules.js'
import { DocIcon } from './icons.jsx'

// Aba de documentos que o mestre entregou: lista à esquerda, leitura à direita.
// O documento mostrado é marcado como lido (onOpen).
export default function DocumentsTab({ documents, selectedId, onSelect, onOpen }) {
  const [onlyUnread, setOnlyUnread] = useState(false)
  const visible = onlyUnread ? documents.filter(d => !d.read) : documents
  const selected = documents.find(d => d.id === selectedId) ?? visible[0]
  const unread = documents.filter(d => !d.read).length

  // O documento na tela conta como lido, inclusive o primeiro, que abre sozinho.
  useEffect(() => {
    if (selected && !selected.read) onOpen(selected)
  }, [selected, onOpen])

  const open = doc => onSelect(doc.id)

  return (
    <div className="documents">
      <div className="doc-list">
        <div className="card-title inv-title">
          <h3>Documentos <small>{unread > 0 ? unread + (unread === 1 ? ' novo' : ' novos') : documents.length + ' no total'}</small></h3>
          <div className="seg" role="group" aria-label="Filtro de documentos">
            <button type="button" className={onlyUnread ? '' : 'on'} aria-pressed={!onlyUnread} onClick={() => setOnlyUnread(false)}>Todos</button>
            <button type="button" className={onlyUnread ? 'on' : ''} aria-pressed={onlyUnread} disabled={unread === 0} onClick={() => setOnlyUnread(true)}>Não lidos</button>
          </div>
        </div>

        {documents.length === 0 && <p className="muted-note">O mestre ainda não te entregou nenhum documento.</p>}

        <ul className="docs">
          {visible.map(doc => {
            const kind = documentKindOf(doc.kind)
            return (
              <li key={doc.id}>
                <button
                  type="button"
                  className={'doc-row' + (doc.id === selected?.id ? ' on' : '') + (doc.read ? '' : ' unread')}
                  style={{ '--k': kind.color }}
                  onClick={() => open(doc)}
                >
                  <span className="doc-seal"><DocIcon kind={doc.kind} /></span>
                  <span className="doc-info">
                    <span className="doc-name">{doc.title}</span>
                    <span className="doc-meta">{kind.name} · {formatDate(doc.createdAt)}</span>
                  </span>
                  {!doc.read && <span className="new-badge">NOVO</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="doc-view">
        {selected ? <DocumentView doc={selected} /> : (
          <div className="item-detail empty-detail"><p className="muted-note">Escolha um documento para ler.</p></div>
        )}
      </div>
    </div>
  )
}

export function DocumentView({ doc }) {
  const kind = documentKindOf(doc.kind)
  return (
    <article className={'scroll k-' + doc.kind.toLowerCase()} style={{ '--k': kind.color }}>
      <header className="scroll-head">
        <span className="scroll-seal"><DocIcon kind={doc.kind} /></span>
        <div>
          <div className="scroll-kind">{kind.name}</div>
          <h2 className="scroll-title">{doc.title}</h2>
          <div className="scroll-meta">Entregue pelo mestre em {formatDate(doc.createdAt)} · {doc.toAll ? 'para o grupo' : 'só para você'}</div>
        </div>
      </header>
      {doc.imageUrl && (
        <a className="scroll-img" href={doc.imageUrl} target="_blank" rel="noreferrer noopener">
          <img src={doc.imageUrl} alt={'Imagem: ' + doc.title} loading="lazy" referrerPolicy="no-referrer" />
        </a>
      )}
      <div className="scroll-body">
        {doc.body ? <RichText text={doc.body} /> : <p className="muted-note">Sem texto.</p>}
      </div>
    </article>
  )
}

// Formatação mínima e segura (sem HTML): parágrafos, "## título", **negrito** e *itálico*.
export function RichText({ text }) {
  return text.split(/\n{2,}/).map((block, i) => {
    if (block.startsWith('## ')) return <h4 key={i}>{inline(block.slice(3))}</h4>
    return (
      <p key={i}>
        {block.split('\n').map((line, j) => <span key={j}>{j > 0 && <br />}{inline(line)}</span>)}
      </p>
    )
  })
}

function inline(line) {
  return line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}
