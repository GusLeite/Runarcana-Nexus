import { ALIGNMENT_NAMES, ARMOR_NAMES, CLASS_NAMES, REGION_NAMES, SIZE_NAMES, formatFeet } from '../../data/rules.js'
import Num from './Num.jsx'
import SpeedToggle from './SpeedToggle.jsx'
import ArmorClass from './ArmorClass.jsx'
import HitPoints from './HitPoints.jsx'
import DeathSaves from './DeathSaves.jsx'
import ConditionChips from './ConditionChips.jsx'
import Situational from './Situational.jsx'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Coluna da esquerda: splash do personagem (como no perfil do cliente), nível, PV e identidade.
export default function SheetHero({ character, sheet, armorClass, onDefense, onShield, onHp, onDeathSaves, onDeathRoll, conditionCatalog }) {
  const level = sheet?.level ?? 0

  return (
    <aside className="hero card" style={{ '--i': 0 }}>
      <div className="hero-art">
        {character.vid && !reducedMotion()
          ? <video src={character.vid} poster={character.img} autoPlay muted loop playsInline style={{ objectPosition: character.pos }} />
          : <img src={character.img} alt="" style={{ objectPosition: character.pos }} />}
        <div className="hero-shade" />
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />

        {sheet && <LevelRing level={level} />}

        <div className="hero-cap">
          {sheet && <div className="hero-class">{CLASS_NAMES[sheet.characterClass] ?? sheet.characterClass}{sheet.subclass && ' · ' + sheet.subclass}</div>}
          <h1 className="hero-name">{sheet?.characterName ?? character.name}</h1>
          <div className="hero-rule" />
          {sheet?.region && <div className="hero-region">{REGION_NAMES[sheet.region] ?? sheet.region}</div>}
        </div>
      </div>

      {sheet && (
        <>
          <HitPoints currentHp={sheet.currentHp} tempHp={sheet.tempHp ?? 0} maxHp={sheet.maxHp} onChange={onHp} />
          {sheet.currentHp === 0 && onDeathSaves && (
            <DeathSaves successes={sheet.deathSuccesses ?? 0} failures={sheet.deathFailures ?? 0} onSet={onDeathSaves} onRoll={onDeathRoll} />
          )}
          <ConditionChips ids={sheet.conditions} exhaustion={sheet.exhaustion} catalog={conditionCatalog} />
          <Situational sheet={sheet} />

          <ArmorClass armorClass={armorClass} onChoose={onDefense} onShield={onShield} />

          <dl className="facts">
            <Fact label="Jogador" value={sheet.playerName} />
            <Fact label="Origem" value={sheet.origin && (sheet.lineage ? sheet.origin + ' (' + sheet.lineage + ')' : sheet.origin)} />
            <Fact label="Deslocamento" value={sheet.speeds?.length ? <SpeedToggle speeds={sheet.speeds} />
              : sheet.speed != null ? formatFeet(sheet.speed) : null} />
            {sheet.size && <Fact label="Tamanho" value={SIZE_NAMES[sheet.size]} />}
            {sheet.languages?.length > 0 && <Fact label="Idiomas" value={sheet.languages.join(', ')} />}
            {sheet.crafts?.length > 0 && <Fact label="Ofícios" value={sheet.crafts.map(k => k + (sheet.craftExpertise?.includes(k) ? ' (especialidade)' : '')).join(', ')} />}
            {sheet.armorProficiencies?.length > 0 && <Fact label="Armaduras" value={sheet.armorProficiencies.map(a => ARMOR_NAMES[a] ?? a).join(', ')} />}
            {sheet.weaponProficiencies?.length > 0 && <Fact label="Armas" value={sheet.weaponProficiencies.join(', ')} />}
            {sheet.heritages?.length > 0 && <Fact label="Heranças" value={sheet.heritages.join(', ')} />}
            {sheet.heritagePoints > 0 && <Fact label="Pontos de Herança" value={sheet.heritagePoints + ' a gastar'} />}
            <Fact label="Passado" value={sheet.background} />
            <Fact label="Alinhamento" value={ALIGNMENT_NAMES[sheet.alignment]} />
            <Fact label="Idade" value={sheet.age + ' anos'} />
            <Fact label="Altura" value={sheet.height.toLocaleString('pt-BR') + ' m'} />
          </dl>
        </>
      )}
    </aside>
  )
}

function Fact({ label, value }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )
}

// Moldura de nível com a volta preenchida até o nível 20, como a borda de ícone do invocador.
function LevelRing({ level }) {
  const r = 26
  const len = 2 * Math.PI * r
  return (
    <div className="level" title={`Nível ${level} de 20`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="level-track" />
        <circle cx="32" cy="32" r={r} className="level-fill" strokeDasharray={len} strokeDashoffset={len * (1 - level / 20)} />
      </svg>
      <div className="level-num"><small>NÍV</small>{level}</div>
    </div>
  )
}
