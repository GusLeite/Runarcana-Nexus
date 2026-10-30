package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.ArmorWeight;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.model.player.ArmorRule;
import gusleite.runarcana_nexus.record.ArmorClassResponse;
import gusleite.runarcana_nexus.record.ArmorClassResponse.DefenseOption;

import java.util.ArrayList;
import java.util.Collection;
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

    // Escudo do inventário com bônus fixo de CA (Escudo Leve +1, Pesado e de Torre +2). key = "ITEM:<id do PlayerItems>".
    public record ShieldItem(String key, String name, int bonus) {}

    // Sem escudo em uso (escolha do jogador).
    public static final String NO_SHIELD = "NONE";

    private ArmorClassCalculator() {}

    // armorProficiencies: LIGHT/MEDIUM/HEAVY/SHIELD; opções com requiresArmor só aparecem com a proficiência.
    public static ArmorClassResponse calculate(ToIntFunction<Attribute> modifier, int proficiency, List<ArmorRule> rules,
                                               Collection<String> armorProficiencies, List<ArmorItem> items, String selected) {
        return calculate(modifier, proficiency, rules, armorProficiencies, items, selected, List.of(), null);
    }

    // shields: escudos do inventário; selectedShield: o em uso ("ITEM:<id>"), NO_SHIELD ou null (= o de maior bônus).
    // O escudo em uso soma em todas as opções de defesa.
    public static ArmorClassResponse calculate(ToIntFunction<Attribute> modifier, int proficiency, List<ArmorRule> rules,
                                               Collection<String> armorProficiencies, List<ArmorItem> items, String selected,
                                               List<ShieldItem> shields, String selectedShield) {
        return calculate(modifier, proficiency, rules, armorProficiencies, items, selected, shields, selectedShield, false);
    }

    public static ArmorClassResponse calculate(ToIntFunction<Attribute> modifier, int proficiency, List<ArmorRule> rules,
                                               Collection<String> armorProficiencies, List<ArmorItem> items, String selected,
                                               List<ShieldItem> shields, String selectedShield, boolean mediumExpert) {
        return calculate(modifier, proficiency, rules, armorProficiencies, items, selected, shields, selectedShield, mediumExpert, false);
    }

    // mediumExpert: Aprimoramento Especialista em Armadura Média (sem limite de Destreza na média e +1 de RD nela);
    // heavyExpert: Especialista em Armadura Pesada (+1 de RD na pesada).
    public static ArmorClassResponse calculate(ToIntFunction<Attribute> modifier, int proficiency, List<ArmorRule> rules,
                                               Collection<String> armorProficiencies, List<ArmorItem> items, String selected,
                                               List<ShieldItem> shields, String selectedShield, boolean mediumExpert, boolean heavyExpert) {
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
            if (r.getRequiresArmor() != null && !armorProficiencies.contains(r.getRequiresArmor())) continue;
            int value = (r.getBase() == null ? 10 : r.getBase())
                    + (r.isDex() ? (r.getDexMax() == null ? dex : Math.min(dex, r.getDexMax())) : 0)
                    + (r.getAttribute() == null ? 0 : modifier.applyAsInt(r.getAttribute()))
                    + (r.getSecondAttribute() == null ? 0 : modifier.applyAsInt(r.getSecondAttribute()))
                    + (r.isProficiency() ? proficiency : 0);
            base.add(new DefenseOption("RULE:" + i, r.getName(), "RULE", value, r.getReduction() == null ? 0 : r.getReduction()));
        }
        if (blockedBy == null) {
            for (ArmorItem item : items) {
                int mod = item.modifierAttribute() == null || item.weight() == ArmorWeight.HEAVY ? 0
                        : modifier.applyAsInt(item.modifierAttribute());
                boolean medium = item.weight() == ArmorWeight.MEDIUM;
                if (medium && !mediumExpert) mod = Math.min(mod, 2);
                boolean heavy = item.weight() == ArmorWeight.HEAVY;
                int reduction = (item.reduction() == null ? 0 : item.reduction()) + (medium && mediumExpert ? 1 : 0) + (heavy && heavyExpert ? 1 : 0);
                base.add(new DefenseOption(item.key(), item.name(), "ITEM", item.armorClass() + mod, reduction));
            }
        }

        ShieldItem shield = NO_SHIELD.equals(selectedShield) ? null
                : shields.stream().filter(s -> s.key().equals(selectedShield)).findFirst()
                        .orElseGet(() -> shields.stream().max(Comparator.comparingInt(ShieldItem::bonus)).orElse(null));
        int shieldBonus = shield == null ? 0 : shield.bonus();

        // Bônus: somados a todas as opções (os "só sem armadura" não valem com armadura do inventário).
        List<String> bonuses = new ArrayList<>();
        List<DefenseOption> options = new ArrayList<>();
        for (DefenseOption o : base) {
            int total = o.value() + shieldBonus;
            int reduction = o.reduction();
            for (ArmorRule r : rules) {
                if (!r.isBonus() || (r.isUnarmoredOnly() && o.kind().equals("ITEM"))) continue;
                total += (r.getAmount() == null ? 0 : r.getAmount()) + (r.isProficiency() ? proficiency : 0);
                reduction += bonusReduction(r, proficiency);
            }
            options.add(new DefenseOption(o.key(), o.label(), o.kind(), total, reduction));
        }
        for (ArmorRule r : rules) {
            if (!r.isBonus()) continue;
            int amount = (r.getAmount() == null ? 0 : r.getAmount()) + (r.isProficiency() ? proficiency : 0);
            int reduction = bonusReduction(r, proficiency);
            String text = reduction > 0 && amount == 0 ? "RD +" + reduction : (amount >= 0 ? "+" : "") + amount + (reduction > 0 ? ", RD +" + reduction : "");
            bonuses.add(r.getName() + " " + text + (r.isUnarmoredOnly() ? " (sem armadura)" : ""));
        }

        if (shield != null) {
            bonuses.add(shield.name() + " +" + shield.bonus() + (armorProficiencies.contains("SHIELD") ? "" : " (sem proficiência com escudos)"));
        }
        List<ArmorClassResponse.ShieldOption> shieldOptions = shields.stream()
                .map(s -> new ArmorClassResponse.ShieldOption(s.key(), s.name(), s.bonus())).toList();

        DefenseOption current = options.stream().filter(o -> o.key().equals(selected)).findFirst()
                .orElseGet(() -> options.stream().max(Comparator.comparingInt(DefenseOption::value)).orElseThrow());
        return new ArmorClassResponse(current.value(), current.reduction(), current.key(), options, bonuses, blockedBy,
                shield == null ? null : shield.key(), shieldOptions);
    }

    // RD que um bônus soma a todas as opções (Carapaça: metade do bônus de proficiência).
    private static int bonusReduction(ArmorRule r, int proficiency) {
        return (r.getReduction() == null ? 0 : r.getReduction()) + (Boolean.TRUE.equals(r.getHalfProficiencyReduction()) ? proficiency / 2 : 0);
    }

    // Nome da opção com o atributo escolhido: "Armadura Natural (Constituição)".
    static String withAttribute(String name, Attribute attribute) {
        return attribute == null ? name : name + " (" + ATTRIBUTE_NAMES.get(attribute) + ")";
    }
}
