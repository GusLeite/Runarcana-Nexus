package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Alignment;
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
        int hitDie
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
                                character.isProficient(type), character.getSkillModifier(type)))
                        .toList(),
                character.getRegion(),
                character.getBackground() == null ? null : character.getBackground().getName(),
                character.getAlignment(),
                character.getInspiration(),
                character.getProficiencyBonus(),
                character.getPassivePerception(),
                character.getPassiveInsight(),
                character.getCharacterClass().getHitHpDice()
        );
    }
}
