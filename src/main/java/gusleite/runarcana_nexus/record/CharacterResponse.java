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
        // PV temporários (0 se não houver).
        int tempHp,
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
        List<String> craftExpertise,
        // Níveis em cada classe (multiclasse); vazio nas fichas antigas. canLevelUp: a ficha tem as escolhas guardadas
        // (criada pelo assistente) e ainda não está no 20º nível. pendingLevels: níveis liberados pelo mestre que o
        // jogador ainda não subiu.
        List<ClassLevelResponse> classLevels,
        boolean canLevelUp,
        int pendingLevels,
        // Testes contra a morte (0–3), condições (ids do rules/condicoes.json; o texto vem de GET /conditions) e Exaustão.
        int deathSuccesses,
        int deathFailures,
        List<String> conditions,
        int exhaustion,
        // Bônus do mestre já somado em maxHp.
        int maxHpBonus,
        // Mod. de Destreza + bônus (Atento).
        int initiative,
        // Fórmulas de Ofício conhecidas ("<ofício>:<fórmula>").
        List<String> formulas,
        // Efeitos situacionais ({ target, note, source }); resistências, vulnerabilidades, imunidades e absorções a dano;
        // imunidades a condições, doenças e efeitos.
        List<Situational> situational,
        List<String> resistances,
        List<String> vulnerabilities,
        List<String> immunities,
        List<String> absorptions,
        List<String> conditionImmunities,
        // Salvaguardas com especialidade (proficiência em dobro).
        List<Attribute> savingThrowExpertise,
        // RD contra um tipo de dano (tipo → valor).
        java.util.Map<String, Integer> typedReductions,
        // Sentidos ("DARKVISION", "DARKVISION|debaixo d'água") → pés.
        java.util.Map<String, Integer> senses,
        // Formas temporárias (nome, texto, efeitos) e a ativa (nula = forma normal).
        List<Form> forms,
        String activeForm,
        // Efeitos ativos ligados (vários ao mesmo tempo).
        List<String> activeEffects
) {
    public record Situational(String target, String note, String source) {}

    public record Form(String name, String description, String attributes, String speeds, String size, String kind, Double speedBonus,
                       Integer ac, String resistances, String immunities, String damage, Integer reduction, Integer initiative) {}

    public record ClassLevelResponse(String classId, String name, int level, String subclass) {}

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
                character.getMaxHpTotal(),
                character.getCurrentHp(),
                character.getTempHp() == null ? 0 : character.getTempHp(),
                // Com a forma ativa somada (Forma de Sho'Ma, Forma Dracônica).
                character.getEffective(Attribute.STRENGTH),
                character.getEffective(Attribute.DEXTERITY),
                character.getEffective(Attribute.INTELLIGENCE),
                character.getEffective(Attribute.WISDOM),
                character.getEffective(Attribute.CHARISMA),
                character.getEffective(Attribute.CONSTITUTION),
                // Todas as perícias do sistema, não só as proficientes, para a ficha mostrar cada bônus.
                Arrays.stream(SkillType.values())
                        .map(type -> new SkillResponse(type, character.getSkillAttribute(type),
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
                character.getEffectiveSize(),
                List.copyOf(character.getLanguages()),
                List.copyOf(character.getCrafts()),
                character.getHeritagePoints(),
                List.copyOf(character.getHeritages()),
                character.getSubclass(),
                // Na ordem LIGHT, MEDIUM, HEAVY, SHIELD; armas em ordem alfabética.
                character.getArmorProficiencies().stream().sorted(java.util.Comparator.comparingInt(List.of("LIGHT", "MEDIUM", "HEAVY", "SHIELD")::indexOf)).toList(),
                character.getWeaponProficiencies().stream().sorted().toList(),
                List.copyOf(character.getCraftExpertise()),
                character.getClassLevels().stream()
                        .map(l -> new ClassLevelResponse(l.getClassId(), l.getClassName(), l.getLevel(), l.getSubclass())).toList(),
                character.getBuild() != null && character.getLevel() < 20,
                character.getPendingLevels() == null ? 0 : character.getPendingLevels(),
                character.getDeathSuccesses() == null ? 0 : character.getDeathSuccesses(),
                character.getDeathFailures() == null ? 0 : character.getDeathFailures(),
                // Em ordem alfabética, como no livro.
                character.getConditions().stream().sorted().toList(),
                character.getExhaustion() == null ? 0 : character.getExhaustion(),
                character.getMaxHpBonus() == null ? 0 : character.getMaxHpBonus(),
                character.getModifier(Attribute.DEXTERITY) + (character.getInitiativeBonus() == null ? 0 : character.getInitiativeBonus()) + character.getEffectInitiative(),
                character.getFormulas().stream().sorted().toList(),
                character.getSituational().stream().map(n -> new Situational(n.getTarget(), n.getNote(), n.getSource())).toList(),
                character.getEffectiveResistances(),
                List.copyOf(character.getVulnerabilities()),
                character.getEffectiveImmunities(),
                List.copyOf(character.getAbsorptions()),
                List.copyOf(character.getConditionImmunities()),
                character.getSavingThrowExpertise().stream().sorted().toList(),
                new java.util.TreeMap<>(character.getTypedReductions()),
                new java.util.TreeMap<>(character.getSenses()),
                character.getForms().stream().map(fm -> new Form(fm.getName(), fm.getDescription(), fm.getAttributes(), fm.getSpeeds(), fm.getSize(),
                        fm.isEffect() ? "EFFECT" : "FORM", fm.getSpeedBonus(), fm.getAc(), fm.getResistances(), fm.getImmunities(), fm.getDamage(), fm.getReduction(), fm.getInitiative())).toList(),
                character.getActiveForm(),
                List.copyOf(character.getActiveEffects())
        );
    }
}
