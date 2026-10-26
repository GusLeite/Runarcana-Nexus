package gusleite.runarcana_nexus.rules;

import gusleite.runarcana_nexus.enums.AbilityType;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.GrantType;
import gusleite.runarcana_nexus.enums.Recharge;
import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.enums.UsesFormula;

import java.util.List;
import java.util.Map;

// Uma concessão do catálogo de regras. Só os campos do tipo dela são usados (ver GrantType e docs/regras-criacao.md).
public record Grant(
        GrantType type,
        Attribute attribute,
        Integer amount,
        Integer count,
        List<String> options,
        SkillType skill,
        String value,
        String label,
        String name,
        String description,
        AbilityType abilityType,
        Integer spellLevel,
        String damage,
        Integer maxUses,
        UsesFormula usesFormula,
        // Dado que muda com o bônus de proficiência: {"2": "1d4", "4": "1d6", "6": "1d8"} (vale o maior <= bônus).
        Map<String, String> diceByProficiency,
        Recharge recharge,
        String castingTime,
        String range,
        String duration,
        String components,
        Boolean perLevel,
        Double feet,
        Boolean fromRegion,
        // Somados ao dado (damage/diceByProficiency): "PROFICIENCY", "HALF_PROFICIENCY", um atributo ("STRENGTH" = mod. de Força)
        // ou "STRENGTH_OR_DEXTERITY" (o maior dos dois: "Força ou Destreza").
        List<String> damageBonus,
        // Fórmula de CA (ARMOR_CLASS e AC_BONUS).
        ArmorFormula armor,
        // Somado aos usos da fórmula: Plumadagas = 3 + bônus de proficiência (usesFormula PROFICIENCY, usesPlus 3).
        Integer usesPlus,
        // SKILL e SKILL_CHOICE: "proficiência; caso já tenha, especialidade" (perícia já proficiente vira especialidade).
        Boolean expertise
) {
    // A Herança escolhida vira uma habilidade do tipo HERITAGE com o texto completo.
    public static Grant heritage(String name, String description) {
        return feature(AbilityType.HERITAGE, name, description);
    }

    public static Grant feature(AbilityType type, String name, String description) {
        return new Grant(GrantType.FEATURE, null, null, null, null, null, null, null, name, description, type,
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    // A mesma concessão com outro nome (habilidade com opção: "Resistente" → "Resistente (Ígneo)").
    public Grant withName(String newName) {
        return new Grant(type, attribute, amount, count, options, skill, value, label, newName, description, abilityType,
                spellLevel, damage, maxUses, usesFormula, diceByProficiency, recharge, castingTime, range, duration,
                components, perLevel, feet, fromRegion, damageBonus, armor, usesPlus, expertise);
    }

    // A mesma concessão com outra quantidade de pés (SPEED que cresce a cada escolha do traço: 15, 15, 10…).
    public Grant withFeet(Double newFeet) {
        return new Grant(type, attribute, amount, count, options, skill, value, label, name, description, abilityType,
                spellLevel, damage, maxUses, usesFormula, diceByProficiency, recharge, castingTime, range, duration,
                components, perLevel, newFeet, fromRegion, damageBonus, armor, usesPlus, expertise);
    }

    // FEATURE com options: a habilidade pede uma escolha (ex.: o tipo de dano do Resistente).
    public boolean hasOptions() {
        return options != null && !options.isEmpty();
    }
}
