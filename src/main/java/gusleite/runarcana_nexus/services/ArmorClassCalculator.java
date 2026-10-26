package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.ArmorWeight;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.model.player.ArmorRule;
import gusleite.runarcana_nexus.record.ArmorClassResponse;
import gusleite.runarcana_nexus.record.ArmorClassResponse.DefenseOption;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.ToIntFunction;

// Classe de Armadura: monta as opções de defesa (sem armadura, CAs alternativas da origem e armaduras do inventário),
// soma os bônus e escolhe a opção em uso (a escolhida na ficha ou, sem escolha, a maior). Usado pela ficha e pela prévia.
public final class ArmorClassCalculator {

    public static final String UNARMORED = "UNARMORED";
    static final Map<Attribute, String> ATTRIBUTE_NAMES = Map.of(
            Attribute.STRENGTH, "Força", Attribute.DEXTERITY, "Destreza", Attribute.CONSTITUTION, "Constituição",
            Attribute.INTELLIGENCE, "Inteligência", Attribute.WISDOM, "Sabedoria", Attribute.CHARISMA, "Carisma");

    // Armadura do inventário: key = "ITEM:<id do PlayerItems>".
    public record ArmorItem(String key, String name, int armorClass, Attribute modifierAttribute, ArmorWeight weight, Integer reduction) {}

    private ArmorClassCalculator() {}

    public static ArmorClassResponse calculate(ToIntFunction<Attribute> modifier, int proficiency, List<ArmorRule> rules,
                                               List<ArmorItem> items, String selected) {
        int dex = modifier.applyAsInt(Attribute.DEXTERITY);
        List<DefenseOption> base = new ArrayList<>();
        base.add(new DefenseOption(UNARMORED, "Sem armadura", "UNARMORED", 10 + dex, 0));
        String blockedBy = null;
        int n = 0;
        for (ArmorRule r : rules) {
            // "Proteção Ajustável: Leve" → "Proteção Ajustável" (o nome da regra, não do modo).
            if (r.isBlocksArmor() && blockedBy == null) blockedBy = r.getName().split(":")[0].trim();
            if (r.isBonus()) continue;
            int i = n++;
            int value = (r.getBase() == null ? 10 : r.getBase())
                    + (r.isDex() ? (r.getDexMax() == null ? dex : Math.min(dex, r.getDexMax())) : 0)
                    + (r.getAttribute() == null ? 0 : modifier.applyAsInt(r.getAttribute()))
                    + (r.isProficiency() ? proficiency : 0);
            base.add(new DefenseOption("RULE:" + i, r.getName(), "RULE", value, r.getReduction() == null ? 0 : r.getReduction()));
        }
        if (blockedBy == null) {
            for (ArmorItem item : items) {
                int mod = item.modifierAttribute() == null || item.weight() == ArmorWeight.HEAVY ? 0
                        : modifier.applyAsInt(item.modifierAttribute());
                if (item.weight() == ArmorWeight.MEDIUM) mod = Math.min(mod, 2);
                base.add(new DefenseOption(item.key(), item.name(), "ITEM", item.armorClass() + mod,
                        item.reduction() == null ? 0 : item.reduction()));
            }
        }

        // Bônus: somados a todas as opções (os "só sem armadura" não valem com armadura do inventário).
        List<String> bonuses = new ArrayList<>();
        List<DefenseOption> options = new ArrayList<>();
        for (DefenseOption o : base) {
            int total = o.value();
            for (ArmorRule r : rules) {
                if (!r.isBonus() || (r.isUnarmoredOnly() && o.kind().equals("ITEM"))) continue;
                total += (r.getAmount() == null ? 0 : r.getAmount()) + (r.isProficiency() ? proficiency : 0);
            }
            options.add(new DefenseOption(o.key(), o.label(), o.kind(), total, o.reduction()));
        }
        for (ArmorRule r : rules) {
            if (!r.isBonus()) continue;
            int amount = (r.getAmount() == null ? 0 : r.getAmount()) + (r.isProficiency() ? proficiency : 0);
            bonuses.add(r.getName() + " " + (amount >= 0 ? "+" : "") + amount + (r.isUnarmoredOnly() ? " (sem armadura)" : ""));
        }

        DefenseOption current = options.stream().filter(o -> o.key().equals(selected)).findFirst()
                .orElseGet(() -> options.stream().max(Comparator.comparingInt(DefenseOption::value)).orElseThrow());
        return new ArmorClassResponse(current.value(), current.reduction(), current.key(), options, bonuses, blockedBy);
    }

    // Nome da opção com o atributo escolhido: "Armadura Natural (Constituição)".
    static String withAttribute(String name, Attribute attribute) {
        return attribute == null ? name : name + " (" + ATTRIBUTE_NAMES.get(attribute) + ")";
    }
}
