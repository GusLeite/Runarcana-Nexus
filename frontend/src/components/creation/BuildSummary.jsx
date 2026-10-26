import { ABILITY_TYPES, ATTRIBUTES, SIZE_NAMES, SKILL_NAMES, attributeById, formatModifier, formatPoints } from '../../data/rules.js'
import Num from '../sheet/Num.jsx'
import SpeedToggle from '../sheet/SpeedToggle.jsx'

// "Ficha em construção": o resultado calculado pelo back para as escolhas atuais.
export default function BuildSummary({ preview, catalog, draft }) {
  const name = (list, id) => list?.find(x => x.id === id)?.name
  return (
    <aside className="card build" style={{ '--i': 2 }}>
      <h3 className="card-title">Ficha em construção</h3>
      <div className="build-title">
        <span className="build-name">{draft.characterName.trim() || 'Sem nome'}</span>
        <span className="build-sub">
          {[name(catalog.origins, draft.originId),
            name(catalog.origins.find(o => o.id === draft.originId)?.lineages, draft.lineageId), name(catalog.regions, draft.regionId), name(catalog.classes, draft.classId),
            name(catalog.backgrounds, draft.backgroundId)].filter(Boolean).join(' · ') || 'Escolha origem, região, classe e passado'}
        </span>
      </div>

      {preview && (
        <>
          <div className="build-attrs">
            {ATTRIBUTES.map(a => {
              const l = preview.attributes.find(x => x.attribute === a.id)
              return (
                <div key={a.id} className={'build-attr' + (l.bonus ? ' boosted' : '')}>
                  <span className="ba-abbr">{a.abbr}</span>
                  <span className="ba-total"><Num value={l.total} duration={400} /></span>
                  <span className="ba-mod">{formatModifier(l.modifier)}</span>
                  {l.bonus !== 0 && <span className="ba-bonus">{formatModifier(l.bonus)}</span>}
                </div>
              )
            })}
          </div>

          <div className="build-stats">
            <div><b>{preview.hitDie ? <Num value={preview.maxHp} duration={400} /> : '—'}</b><span>PV{preview.hitDie ? ' (d' + preview.hitDie + ')' : ''}</span></div>
            <div><b>{preview.speeds?.length ? <SpeedToggle speeds={preview.speeds} /> : '—'}</b><span>Deslocamento</span></div>
            <div><b><Num value={preview.gold} duration={400} /></b><span>Ouro</span></div>
          </div>

          <dl className="build-facts">
            <div><dt>Tamanho</dt><dd>{SIZE_NAMES[preview.size] ?? '—'}</dd></div>
            {preview.armorClass && (
              <div><dt>Classe de Armadura</dt><dd>{preview.armorClass.value}
                {preview.armorClass.reduction > 0 && ' · RD ' + preview.armorClass.reduction}
                {' (' + preview.armorClass.options.find(o => o.key === preview.armorClass.selected)?.label + ')'}</dd></div>
            )}
            {preview.traitBudget && (
              <div><dt>Traços</dt><dd>{preview.traits.filter(t => t.kind === 'TRAIT').reduce((s, t) => s + t.times, 0)} escolhidos
                · {formatPoints(preview.traitBudget.pointsSpent)} de {formatPoints(preview.traitBudget.points)} pontos de Origem</dd></div>
            )}
            <div><dt>Pontos de Herança</dt><dd>{preview.heritagePoints
              ? preview.heritagePools.reduce((s, p) => s + p.spent, 0) + ' de ' + preview.heritagePoints + ' gastos'
              : '—'}</dd></div>
            {preview.languages.length > 0 && <div><dt>Idiomas</dt><dd>{preview.languages.join(', ')}</dd></div>}
            <div><dt>Ofícios</dt><dd>{preview.crafts.map(id => catalog.crafts?.find(k => k.id === id)?.name ?? id).join(', ') || '—'}</dd></div>
          </dl>

          <Section title="Resistências" empty="Nenhuma ainda">
            {preview.savingThrows.map(s => <li key={s.attribute} title={s.source}>{attributeById(s.attribute)?.name}<em>{s.source}</em></li>)}
          </Section>
          <Section title="Perícias" empty="Nenhuma ainda">
            {preview.skills.map(s => (
              <li key={s.skill} title={s.source}>{SKILL_NAMES[s.skill] ?? s.skill}
                {s.expertise && <span className="ft-extra" title="Bônus de proficiência em dobro"> especialidade</span>}<em>{s.source}</em></li>
            ))}
          </Section>
          <Section title="Passivas e habilidades" empty="Nenhuma ainda">
            {preview.features.map((f, i) => (
              <li key={i} title={f.description ?? ''}>
                <span className={'ft-type t-' + f.type.toLowerCase()}>{ABILITY_TYPES[f.type]?.name}</span> {f.name}
                {(f.dice || f.uses) && <span className="ft-extra">{[f.uses && f.uses + '×', f.dice].filter(Boolean).join(' · ')}</span>}
                <em>{f.source}</em>
              </li>
            ))}
          </Section>

          {preview.errors.length > 0 ? (
            <div className="build-todo">
              <b>Falta para criar</b>
              <ul>{preview.errors.map(e => <li key={e}>{e}</li>)}</ul>
            </div>
          ) : (
            <div className="build-ready">Tudo pronto. Confira e clique em <b>Criar personagem</b>.</div>
          )}
        </>
      )}
    </aside>
  )
}

function Section({ title, empty, children }) {
  const items = [children].flat().filter(Boolean)
  return (
    <div className="build-section">
      <div className="skill-group-name">{title}</div>
      {items.length ? <ul className="build-list">{children}</ul> : <p className="muted-note">{empty}</p>}
    </div>
  )
}
