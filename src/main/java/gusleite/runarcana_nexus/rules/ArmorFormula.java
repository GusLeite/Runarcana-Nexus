package gusleite.runarcana_nexus.rules;

import gusleite.runarcana_nexus.enums.Attribute;

// Fórmula de CA das concessões ARMOR_CLASS (uma opção de defesa) e AC_BONUS (bônus somado à opção usada).
// - base: valor fixo (ex.: 13 na Proteção Ajustável Leve). dex: soma o mod. de Destreza (padrão sim); dexMax: limite dele.
// - attribute: soma também o mod. desse atributo (Pele de Árvore: Constituição). proficiency: soma o bônus de proficiência.
// - reduction: Redução de Dano (RD) da opção.
// - unarmoredOnly (AC_BONUS): o bônus só vale sem armadura do inventário (Armadura Natural do Auroque).
// - blocksArmor: com essa regra, as armaduras do inventário não servem (Pele de Árvore, Proteção Ajustável).
// - requiresArmor: a opção só existe com proficiência nessa armadura (MEDIUM/HEAVY; modos da Proteção Ajustável).
public record ArmorFormula(
        Integer base,
        Boolean dex,
        Integer dexMax,
        Attribute attribute,
        Boolean proficiency,
        Integer reduction,
        Boolean unarmoredOnly,
        Boolean blocksArmor,
        String requiresArmor
) {
    public boolean dexOrTrue() {
        return dex == null || dex;
    }
}
