package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.DamageType;

// Um ataque da ficha (arma do inventário ou desarmado), já com as contas: o front só rola.
// - attackBonus: mod. do atributo + proficiência (se proficiente); damage: "1d8+3" (dado + o mesmo mod.).
// - versatileDamage: dano com as duas mãos ("1d10+3"), só nas armas versáteis.
// - critRange: menor resultado natural do d20 que é crítico (19 = 19–20); critMultiplier: quantas vezes rola os dados.
// - key: "ITEM:<id do PlayerItems>" ou "UNARMED".
public record AttackResponse(
        String key,
        String name,
        Attribute attribute,
        boolean proficient,
        int attackBonus,
        String damage,
        String versatileDamage,
        DamageType damageType,
        int critRange,
        int critMultiplier,
        String range,
        String mastery,
        String properties
) {}
