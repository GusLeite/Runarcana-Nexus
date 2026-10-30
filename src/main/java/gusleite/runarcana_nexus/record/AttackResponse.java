package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.DamageType;

import java.util.List;

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
        String properties,
        // Estilos de Luta da ficha que valem para este ataque, cada um com o bônus e o dano já somados
        // (o Combatente usa um por vez; o jogador escolhe qual rolar).
        List<StyleVariant> styles,
        // Efeitos situacionais que valem para este ataque (Arqueiro com arcos, Balestreiro com bestas...).
        List<String> notes
) {
    public AttackResponse withNotes(List<String> newNotes) {
        return new AttackResponse(key, name, attribute, proficient, attackBonus, damage, versatileDamage, damageType, critRange,
                critMultiplier, range, mastery, properties, styles, newNotes);
    }

    // Margem e multiplicador de crítico com as Heranças (Fúria de Warmog, Brutalizador).
    public AttackResponse withCrit(int newRange, int newMultiplier) {
        return new AttackResponse(key, name, attribute, proficient, attackBonus, damage, versatileDamage, damageType, newRange,
                newMultiplier, range, mastery, properties, styles, notes);
    }

    // Dano com os bônus de Heranças e Aprimoramentos (Fúria de Warmog, Briguento...).
    public AttackResponse withDamage(String newDamage, String newVersatile) {
        return new AttackResponse(key, name, attribute, proficient, attackBonus, newDamage, newVersatile, damageType, critRange,
                critMultiplier, range, mastery, properties, styles, notes);
    }

    public record StyleVariant(String name, int attackBonus, String damage, String note) {}
}
