package gusleite.runarcana_nexus.rules;

import java.util.List;

// Um item do catálogo do Capítulo 6 (rules/itens.json): armas, armaduras, escudos, equipamento de aventureiro,
// conjuntos de ofício, instrumentos, montarias, veículos e os conjuntos de equipamento.
// - kind: WEAPON, ARMOR, SHIELD, AMMUNITION, GEAR, FOCUS, TOOLS, INSTRUMENT, MOUNT, VEHICLE, TACK ou PACK.
// - groups: listas usadas nas escolhas de equipamento ("arma-simples-corpo-a-corpo", "arma-de-fogo-tier-1",
//   "armadura-leve", "arma-bodisatva", "foco-arcano"...).
// - price: o texto do livro ("2 PO"); priceCp: o mesmo em peças de cobre. weight em kg. quantity: quantas unidades
//   vêm no item (Flechas = 20).
// - Armas: damage, critical, mastery, properties como no livro; armas de fogo também tier, misfire (Erro) e range.
// - Armaduras: armorWeight (LIGHT/MEDIUM/HEAVY), armorClass (base), dexterity (FULL, MAX_2 ou NONE), defenseModifier
//   (Força ou Destreza), damageReduction ("2/5 mágico"), strength (Força mínima), stealthDisadvantage, exception.
//   Escudos: armorClass é o bônus (Broquel e Escudo de Torre têm regra especial no texto).
// - Montarias e veículos: speed e capacity.
// - PACK: contents = itens do catálogo (item) ou, quando o livro cita algo fora das tabelas, só o nome (name).
public record RuleItem(
        String id,
        String name,
        String kind,
        String category,
        List<String> groups,
        String price,
        Integer priceCp,
        Double weight,
        Integer quantity,
        String damage,
        String critical,
        String mastery,
        String properties,
        Integer tier,
        String misfire,
        String range,
        String armorWeight,
        Integer armorClass,
        String armorClassText,
        String dexterity,
        Boolean defenseModifier,
        String damageReduction,
        Integer strength,
        Boolean stealthDisadvantage,
        String exception,
        String speed,
        String capacity,
        String description,
        List<Content> contents
) {
    public List<String> groupsOrEmpty() {
        return groups == null ? List.of() : groups;
    }

    public List<Content> contentsOrEmpty() {
        return contents == null ? List.of() : contents;
    }

    public int quantityOrOne() {
        return quantity == null || quantity < 1 ? 1 : quantity;
    }

    public record Content(String item, String name, Integer quantity) {
        public int quantityOrOne() {
            return quantity == null || quantity < 1 ? 1 : quantity;
        }
    }
}
