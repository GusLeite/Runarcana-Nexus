import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { additionalInfo, buildPrintSheet, classLine, importantInfo, spellRows } from './printSheet.js'

const page = name => new Uint8Array(readFileSync(fileURLToPath(new URL('../../public/ficha-fisica/' + name, import.meta.url))))
const pages = [page('frente.png'), page('verso.png')]

const skill = (id, attr, modifier, proficient = false, expertise = false) => ({ skill: id, attribute: attr, proficient, expertise, modifier })
const SAMPLE = {
  character: {
    playerName: 'Yoku', characterName: 'Loge', level: 5, gold: 37, age: 31, height: 1.82,
    characterClass: 'MERCURIAL', subclass: 'Cabala do Ás Rúnico', maxHp: 38, currentHp: 21, tempHp: 4,
    str: 10, dex: 18, intel: 12, wis: 13, cha: 16, con: 14,
    skills: [skill('ACROBATICS', 'DEXTERITY', 7, true, true), skill('STEALTH', 'DEXTERITY', 7, true), skill('ARCANA', 'INTELLIGENCE', 1),
      skill('TECHNOLOGY', 'INTELLIGENCE', -1)],
    region: 'NOXUS', background: 'Criminoso', alignment: 'CHAOTIC_NEUTRAL', inspiration: 1, proficiencyBonus: 3,
    passivePerception: 14, passiveInsight: 11, hitDie: 8, origin: 'Humano', lineage: 'Noxiano', speed: 30,
    speeds: [{ type: 'WALK', feet: 30 }, { type: 'CLIMB', feet: 15 }], savingThrows: ['DEXTERITY', 'CHARISMA'], size: 'MEDIUM',
    languages: ['Comum', 'Noxiano'], crafts: ['Alquimia'], heritages: ['Sangue Frio'], armorProficiencies: ['LIGHT'],
    weaponProficiencies: ['Adagas', 'Bestas leves'], classLevels: [{ classId: 'mercurial', name: 'Mercurial', level: 5 }],
    deathSuccesses: 1, deathFailures: 2, conditions: ['Envenenado'], exhaustion: 2, initiative: 4,
    situational: [{ target: 'GENERAL', note: 'Vantagem em testes contra veneno', source: 'Sangue Frio' }],
    resistances: ['veneno'], vulnerabilities: [], immunities: [], absorptions: [], conditionImmunities: [],
    savingThrowExpertise: [], typedReductions: { gélido: 2 }, senses: { DARKVISION: 60 }, forms: [], activeEffects: [],
  },
  armorClass: { value: 15, reduction: 0, selected: 'UNARMORED', options: [], bonuses: [], shield: null, shields: [] },
  attacks: [{ name: 'Adaga', attackBonus: 7, damage: '1d4+4', damageType: 'P' }, { name: 'Desarmado', attackBonus: 3, damage: '1', damageType: 'B' }],
  spellcasting: { casters: [{ saveDc: 14, attackBonus: 6 }], maxSpellLevel: 3, manaCost: {} },
  crafts: [{ name: 'Alquimia', level: 1, bonus: 5 }],
  inventory: [{ name: 'Adaga', quantity: 2 }, { name: 'Poção de cura', quantity: 1 }],
  abilities: [
    { name: 'Pontos de Mana', type: 'ABILITY', maxUses: 10, usesLeft: 6 },
    { name: 'Golpe Mercurial', type: 'ABILITY', maxUses: 3, recharge: 'SHORT_REST', description: 'Um golpe rápido −2 que causa dano extra.' },
    { name: 'Esquiva Sombria', type: 'PASSIVE', description: 'Metade do dano de área.' },
    ...Array.from({ length: 23 }, (_, i) => ({ name: 'Magia ' + i, type: 'SPELL', spellLevel: i % 4, description: 'Texto da magia ' + i, prepared: i % 5 ? true : false })),
  ],
}

describe('printSheet', () => {
  it('monta a linha de classe e nível', () => {
    expect(classLine(SAMPLE.character)).toBe('Mercurial 5 · Cabala do Ás Rúnico')
    expect(classLine({ classLevels: [{ name: 'Bruto', level: 3 }, { name: 'Arcanista', level: 2 }] })).toBe('Bruto 3 / Arcanista 2')
  })

  it('resume os efeitos no verso', () => {
    const info = importantInfo(SAMPLE.character)
    expect(info.find(i => i.title === 'Deslocamento').text).toBe('Caminhada 30 pés, Escalada 15 pés')
    expect(info.find(i => i.title === 'Sangue Frio').text).toMatch(/veneno/)
  })

  it('ordena as magias e manda as que sobram para o verso', () => {
    const spells = spellRows(SAMPLE.abilities)
    expect(spells[0].spellLevel).toBe(0)
    const sections = additionalInfo(SAMPLE.character, SAMPLE.abilities, spells.slice(19))
    expect(sections.map(s => s.title)).toEqual(['Habilidades', 'Passivas', 'Magias (continuação)'])
    expect(sections[0].items.map(i => i.title)).toEqual(['Golpe Mercurial'])
  })

  it('gera as duas páginas do modelo', async () => {
    const bytes = await buildPrintSheet({ pages, sheet: SAMPLE })
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(2)
  })
})

// Para conferir as posições: PRINT_SHEET_OUT=saida.pdf npx vitest run printSheet grava a ficha de exemplo com retrato.
if (process.env.PRINT_SHEET_OUT) {
  it('grava o exemplo', async () => {
    const portrait = new Uint8Array(readFileSync(fileURLToPath(new URL('../assets/characters/loge.jpg', import.meta.url))))
    writeFileSync(process.env.PRINT_SHEET_OUT, await buildPrintSheet({ pages, sheet: SAMPLE, portrait, portraitType: 'jpg' }))
  })
}
