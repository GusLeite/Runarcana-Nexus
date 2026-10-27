package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.rules.RuleItem;
import gusleite.runarcana_nexus.rules.RuleItems;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.random.RandomGenerator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Equipamento inicial (Capítulo 6) sobre o catálogo de itens. As concessões EQUIPMENT e EQUIPMENT_CHOICE descrevem
// o que se ganha com um texto curto:
//   opção = parte ("+" parte)*        "besta-leve+virotes-de-besta"
//   parte = id ["*" quantidade]       "machadinha*2" (duas machadinhas)
//         | "group:" grupo ["<=" PO] ["*" quantidade]
// Uma opção com um grupo (no máximo um) vira uma opção por item do grupo, com as outras partes junto
// ("group:arma-marcial<=50*2" = duas armas marciais iguais de até 50 PO cada; "group:arma-marcial<=50+escudo-leve" =
// uma delas e um escudo leve; "qualquer arma simples" = "group:arma-simples").
public final class EquipmentRules {

    static final String GROUP = "group:";
    private static final Pattern GROUP_PART = Pattern.compile("^group:([a-z0-9-]+)(?:<=(\\d+))?(?:\\*(\\d+))?$");
    private static final Pattern ITEM_PART = Pattern.compile("^([a-z0-9-]+)(?:\\*(\\d+))?$");
    private static final Pattern WEALTH = Pattern.compile("^(\\d+)d(\\d+)(?: x (\\d+))?$");

    private EquipmentRules() {}

    // Item e quantidade de uma parte já resolvida (sem grupo).
    public record Entry(String item, int quantity) {}

    public static Optional<RuleItem> item(RuleItems items, String id) {
        return items == null ? Optional.empty() : items.itemsOrEmpty().stream().filter(i -> i.id().equals(id)).findFirst();
    }

    // As partes de uma opção sem grupo. Parte inválida fica de fora (a validação do catálogo avisa).
    public static List<Entry> parse(String option) {
        List<Entry> out = new ArrayList<>();
        if (option == null) return out;
        for (String part : option.split("\\+")) {
            Matcher m = ITEM_PART.matcher(part.trim());
            if (m.matches()) out.add(new Entry(m.group(1), m.group(2) == null ? 1 : Integer.parseInt(m.group(2))));
        }
        return out;
    }

    // Troca as opções com grupo por uma opção para cada item do grupo (na ordem do catálogo).
    public static List<String> expand(RuleItems items, List<String> options) {
        LinkedHashSet<String> out = new LinkedHashSet<>();
        for (String option : options == null ? List.<String>of() : options) {
            List<String> parts = new ArrayList<>(List.of(option.trim().split("\\s*\\+\\s*")));
            int at = -1;
            for (int i = 0; i < parts.size() && at < 0; i++) if (parts.get(i).startsWith(GROUP)) at = i;
            if (at < 0) {
                out.add(String.join("+", parts));
                continue;
            }
            Matcher m = GROUP_PART.matcher(parts.get(at));
            if (!m.matches()) continue;
            Integer maxCp = m.group(2) == null ? null : Integer.parseInt(m.group(2)) * 100;
            String qty = m.group(3) == null ? "" : "*" + m.group(3);
            for (RuleItem i : items == null ? List.<RuleItem>of() : items.itemsOrEmpty()) {
                if (!i.groupsOrEmpty().contains(m.group(1)) || (maxCp != null && (i.priceCp() == null || i.priceCp() > maxCp))) continue;
                List<String> concrete = new ArrayList<>(parts);
                concrete.set(at, i.id() + qty);
                out.add(String.join("+", concrete));
            }
        }
        return List.copyOf(out);
    }

    // Nome para mostrar: "Besta Leve + Virotes de besta (20)", "Machadinha ×2".
    public static String name(RuleItems items, String option) {
        List<String> names = new ArrayList<>();
        for (Entry e : parse(option)) {
            String n = item(items, e.item()).map(RuleItem::name).orElse(e.item());
            names.add(e.quantity() > 1 ? n + " ×" + e.quantity() : n);
        }
        return String.join(" + ", names);
    }

    // Problemas de uma opção escrita no catálogo (id inexistente, grupo vazio, grupo misturado com itens).
    public static List<String> problems(RuleItems items, String option) {
        List<String> p = new ArrayList<>();
        if (option == null || option.isBlank()) {
            p.add("opção de equipamento vazia");
            return p;
        }
        String[] parts = option.split("\\+");
        int groups = 0;
        for (String raw : parts) {
            String part = raw.trim();
            Matcher g = GROUP_PART.matcher(part);
            if (g.matches()) {
                if (++groups > 1) p.add("\"" + option + "\": no máximo um grupo por opção");
                else if (expand(items, List.of(part)).isEmpty()) p.add("\"" + part + "\": nenhum item no grupo");
                continue;
            }
            Matcher m = ITEM_PART.matcher(part);
            if (!m.matches()) p.add("\"" + part + "\": formato inválido (id, id*quantidade ou group:grupo)");
            else if (item(items, m.group(1)).isEmpty()) p.add("\"" + part + "\": item inexistente");
        }
        return p;
    }

    // Riqueza inicial: "5d4 x 10" ou "5d4" (em PO).
    public static boolean validWealth(String formula) {
        return formula != null && WEALTH.matcher(formula.trim()).matches();
    }

    public static int rollWealth(String formula, RandomGenerator random) {
        Matcher m = WEALTH.matcher(formula.trim());
        if (!m.matches()) return 0;
        int dice = Integer.parseInt(m.group(1)), sides = Integer.parseInt(m.group(2));
        int total = 0;
        for (int i = 0; i < dice; i++) total += 1 + random.nextInt(sides);
        return m.group(3) == null ? total : total * Integer.parseInt(m.group(3));
    }
}
