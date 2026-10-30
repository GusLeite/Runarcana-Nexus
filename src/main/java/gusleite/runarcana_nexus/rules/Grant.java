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
        Boolean expertise,
        // FEATURE com options: usos próprios de cada opção (chave = a opção).
        Map<String, UsesRule> optionUses,
        // Usos e dado pelo NÍVEL do personagem (vale o maior nível <= o atual): Mana do Arcanista {"1": 4, "2": 6, ...},
        // Ataque Furtivo {"1": "1d6", "3": "2d6", ...}. usesByLevel vence usesFormula/maxUses; diceByLevel vence damage.
        Map<String, Integer> usesByLevel,
        Map<String, String> diceByLevel,
        // Valor pelo NÍVEL do personagem (vale o maior nível <= o atual): o amount do AC_BONUS e do ATTRIBUTE ou os pés
        // do SPEED. Ex.: Casca Grossa {"1": 1, "6": 2, "12": 3, ...}; Natação {"1": 30, "6": 35, ...}.
        Map<String, Integer> valueByLevel,
        // FEATURE com options: o texto de cada opção (chave = a opção); a habilidade leva o texto das escolhidas.
        Map<String, String> optionTexts,
        // SPEED: o deslocamento vale esta fração da caminhada final (Vida Marinha: natação = 1; Adaptação de Escalada: 0,5).
        Double walkFraction,
        // Só vale se a opção foi escolhida na habilidade: "Vantagem Tecnológica:Carapaça" (concessões fixas; decidido depois
        // das escolhas).
        String when,
        // RESOURCE_CHOICE: ignora o pré-requisito de classe, subclasse e nível de classe do recurso ("exceto o de Classe": Mestre Tático).
        Boolean anyClass,
        // Concessão fixa que só vale a partir deste nível do personagem (Gás Corrosivo: antimônico no 11º).
        Integer minLevel
) {
    // Sem optionTexts (as concessões montadas no código e nos testes).
    public Grant(GrantType type, Attribute attribute, Integer amount, Integer count, List<String> options, SkillType skill,
                 String value, String label, String name, String description, AbilityType abilityType, Integer spellLevel,
                 String damage, Integer maxUses, UsesFormula usesFormula, Map<String, String> diceByProficiency, Recharge recharge,
                 String castingTime, String range, String duration, String components, Boolean perLevel, Double feet,
                 Boolean fromRegion, List<String> damageBonus, ArmorFormula armor, Integer usesPlus, Boolean expertise,
                 Map<String, UsesRule> optionUses, Map<String, Integer> usesByLevel, Map<String, String> diceByLevel,
                 Map<String, Integer> valueByLevel) {
        this(type, attribute, amount, count, options, skill, value, label, name, description, abilityType, spellLevel, damage,
                maxUses, usesFormula, diceByProficiency, recharge, castingTime, range, duration, components, perLevel, feet,
                fromRegion, damageBonus, armor, usesPlus, expertise, optionUses, usesByLevel, diceByLevel, valueByLevel, null, null, null, null, null);
    }

    @com.fasterxml.jackson.annotation.JsonCreator
    public Grant {
    }

    // A Herança escolhida vira uma habilidade do tipo HERITAGE com o texto completo.
    public static Grant heritage(String name, String description) {
        return feature(AbilityType.HERITAGE, name, description);
    }

    public static Grant feature(AbilityType type, String name, String description) {
        return new Grant(GrantType.FEATURE, null, null, null, null, null, null, null, name, description, type,
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    // Uma magia do Capítulo 10 como habilidade SPELL da ficha (nível, tempo, alcance, duração e componentes).
    public static Grant spell(RuleMagic.Spell s) {
        String components = s.components() == null ? null : s.material() == null ? s.components() : s.components() + " (" + s.material() + ")";
        String text = (s.description() == null ? "" : s.description()) + (s.higherLevels() == null ? "" : "\n\nEm níveis superiores. " + s.higherLevels());
        return new Grant(GrantType.FEATURE, null, null, null, null, null, null, null, s.name(), text, AbilityType.SPELL,
                s.level(), null, null, null, null, null, s.castingTime(), s.range(), s.duration(), components, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null);
    }

    // A mesma concessão com outro nome (habilidade com opção: "Resistente" → "Resistente (Ígneo)").
    public Grant withName(String newName) {
        return new Grant(type, attribute, amount, count, options, skill, value, label, newName, description, abilityType,
                spellLevel, damage, maxUses, usesFormula, diceByProficiency, recharge, castingTime, range, duration,
                components, perLevel, feet, fromRegion, damageBonus, armor, usesPlus, expertise, optionUses, usesByLevel, diceByLevel, valueByLevel, optionTexts, walkFraction, when, anyClass, minLevel);
    }

    // A mesma concessão com outra quantidade de pés (SPEED que cresce a cada escolha do traço: 15, 15, 10…).
    public Grant withFeet(Double newFeet) {
        return new Grant(type, attribute, amount, count, options, skill, value, label, name, description, abilityType,
                spellLevel, damage, maxUses, usesFormula, diceByProficiency, recharge, castingTime, range, duration,
                components, perLevel, newFeet, fromRegion, damageBonus, armor, usesPlus, expertise, optionUses, usesByLevel, diceByLevel, valueByLevel, optionTexts, walkFraction, when, anyClass, minLevel);
    }

    // A mesma concessão com os usos da opção escolhida (optionUses).
    public Grant withUses(UsesRule u) {
        return new Grant(type, u.attribute() != null ? u.attribute() : attribute, amount, count, options,
                skill, value, label, name, description, abilityType, spellLevel, damage, u.maxUses(), u.usesFormula(),
                diceByProficiency, u.recharge() == null ? recharge : u.recharge(), castingTime, range, duration, components,
                perLevel, feet, fromRegion, damageBonus, armor, u.usesPlus(), expertise, optionUses, usesByLevel, diceByLevel, valueByLevel, optionTexts, walkFraction, when, anyClass, minLevel);
    }

    // A mesma concessão com outra tabela de usos e outro texto (Ki com pontos inativados pelos Vel).
    public Grant withUsesByLevel(Map<String, Integer> table, String newDescription) {
        return new Grant(type, attribute, amount, count, options, skill, value, label, name, newDescription, abilityType,
                spellLevel, damage, maxUses, usesFormula, diceByProficiency, recharge, castingTime, range, duration,
                components, perLevel, feet, fromRegion, damageBonus, armor, usesPlus, expertise, optionUses, table, diceByLevel, valueByLevel, optionTexts, walkFraction, when, anyClass, minLevel);
    }

    // A mesma concessão com outro texto e tempo de execução (Herança com parte ativa: "Reação", "Ação bônus").
    public Grant withText(String newDescription, String newCastingTime) {
        return new Grant(type, attribute, amount, count, options, skill, value, label, name, newDescription, abilityType,
                spellLevel, damage, maxUses, usesFormula, diceByProficiency, recharge, newCastingTime, range, duration,
                components, perLevel, feet, fromRegion, damageBonus, armor, usesPlus, expertise, optionUses, usesByLevel, diceByLevel, valueByLevel, optionTexts, walkFraction, when, anyClass, minLevel);
    }

    // FEATURE com options: a habilidade pede uma escolha (ex.: o tipo de dano do Resistente).
    public boolean hasOptions() {
        return options != null && !options.isEmpty();
    }
}
