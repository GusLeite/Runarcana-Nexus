package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Alignment;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.CreatureSize;
import gusleite.runarcana_nexus.enums.CharacterClassType;
import gusleite.runarcana_nexus.enums.Region;
import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.model.player.Character;

import java.util.Arrays;
import java.util.List;

// Ficha achatada para o front: evita o ciclo Character <-> CharacterSkill e as relações lazy.
public record CharacterResponse(
        Long id,
        String playerName,
        String characterName,
        int level,
        int gold,
        int age,
        double height,
        CharacterClassType characterClass,
        int maxHp,
        int currentHp,
        int str,
        int dex,
        int intel,
        int wis,
        int cha,
        int con,
        List<SkillResponse> skills,
        Region region,
        String background,
        Alignment alignment,
        int inspiration,
        int proficiencyBonus,
        int passivePerception,
        int passiveInsight,
        // Dado de vida da classe (6 = d6).
        int hitDie,
        String origin,
        String lineage,
        // Em pés.
        Double speed,
        // Todos os deslocamentos (caminhada primeiro, depois natação, escalada, voo, escavação).
        List<SpeedLine> speeds,
        List<Attribute> savingThrows,
        CreatureSize size,
        List<String> languages,
        List<String> crafts,
        Integer heritagePoints,
        List<String> heritages,
        // Subclasse (Glifo, Cabala...), proficiências com armaduras e armas e ofícios com especialidade.
        String subclass,
        List<String> armorProficiencies,
        List<String> weaponProficiencies,
        List<String> craftExpertise
) {
    public static CharacterResponse of(Character character) {
        return new CharacterResponse(
                character.getId(),
                character.getPlayerName(),
                character.getCharacterName(),
                character.getLevel(),
                character.getGold(),
                character.getAge(),
                character.getHeight(),
                character.getCharacterClass().getClassName(),
                character.getMaxHp(),
                character.getCurrentHp(),
                character.getStr(),
                character.getDex(),
                character.getIntel(),
                character.getWis(),
                character.getCha(),
                character.getCon(),
                // Todas as perícias do sistema, não só as proficientes, para a ficha mostrar cada bônus.
                Arrays.stream(SkillType.values())
                        .map(type -> new SkillResponse(type, type.getBaseAttribute(),
                                character.isProficient(type), character.isExpert(type), character.getSkillModifier(type)))
                        .toList(),
                character.getRegion(),
                character.getBackground() == null ? null : character.getBackground().getName(),
                character.getAlignment(),
                character.getInspiration(),
                character.getProficiencyBonus(),
                character.getPassivePerception(),
                character.getPassiveInsight(),
                character.getCharacterClass().getHitHpDice(),
                character.getOrigin(),
                character.getLineage(),
                character.getSpeed(),
                SpeedLine.of(character),
                // Na ordem da ficha (FOR, DES, CON, INT, SAB, CAR).
                character.getSavingThrows().stream().sorted().toList(),
                character.getSize(),
                List.copyOf(character.getLanguages()),
                List.copyOf(character.getCrafts()),
                character.getHeritagePoints(),
                List.copyOf(character.getHeritages()),
                character.getSubclass(),
                // Na ordem LIGHT, MEDIUM, HEAVY, SHIELD; armas em ordem alfabética.
                character.getArmorProficiencies().stream().sorted(java.util.Comparator.comparingInt(List.of("LIGHT", "MEDIUM", "HEAVY", "SHIELD")::indexOf)).toList(),
                character.getWeaponProficiencies().stream().sorted().toList(),
                List.copyOf(character.getCraftExpertise())
        );
    }
}
