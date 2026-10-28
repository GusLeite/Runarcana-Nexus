package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.DamageType;
import gusleite.runarcana_nexus.enums.WeaponCategory;
import gusleite.runarcana_nexus.enums.WeaponProperty;
import gusleite.runarcana_nexus.model.items.Weapon;
import gusleite.runarcana_nexus.record.AttackResponse;
import gusleite.runarcana_nexus.rules.RuleItem;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.ToIntFunction;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Ataques com arma: uma linha por arma do inventário + o ataque desarmado, sem salvar nada (como o ArmorClassCalculator).
// Atributo: acuidade = o maior entre FOR e DES; à distância (munição, arma de fogo, "Distância") = DES; senão FOR.
// Proficiência: pela categoria ("Armas simples" ↔ grupo arma-simples) ou pelo nome ("Espadas curtas" ↔ Espada Curta).
public final class AttackCalculator {

    public static final String UNARMED = "UNARMED";

    // Uma arma já lida do catálogo (ou da linha de Weapon, no item sem catálogo).
    // tags: grupos do catálogo e o nome normalizado, para conferir a proficiência.
    public record WeaponInput(String key, String name, String dice, String versatileDice, DamageType damageType,
                              boolean finesse, boolean ranged, Attribute forced, Set<String> tags,
                              int critRange, int critMultiplier, String range, String mastery, String properties) {}

    // "1d8 r/ 1d6 p" → 1d8, cortante (o primeiro dano da arma). "1d6 cortante" também vale.
    private static final Pattern DAMAGE = Pattern.compile("(\\d+d\\d+)\\s*([a-zç]*)", Pattern.CASE_INSENSITIVE);
    private static final Pattern VERSATILE = Pattern.compile("vers[aá]til\\s*\\((\\d+d\\d+)", Pattern.CASE_INSENSITIVE);
    // "p 19 x3" → 19, 3; "x2" → 20, 2.
    private static final Pattern CRITICAL = Pattern.compile("(?:(\\d{2})\\s*)?x(\\d+)");
    // "arremesso (20/60 pés)", "Munição (distância 30/120 pés)" → "20/60 pés".
    private static final Pattern RANGE = Pattern.compile("\\((?:dist[aâ]ncia\\s*)?(\\d+\\s*/\\s*\\d+)\\s*p[eé]s\\)", Pattern.CASE_INSENSITIVE);
    // Proficiências por categoria → grupo do itens.json.
    private static final Map<String, String> CATEGORY_GROUPS = Map.of(
            "armas simples", "arma-simples", "armas marciais", "arma-marcial", "armas de fogo", "arma-de-fogo",
            "armas bodisatva", "arma-bodisatva", "armas de corrente", "arma-de-corrente", "armas improprias", "arma-impropria");

    private AttackCalculator() {}

    public static List<AttackResponse> calculate(ToIntFunction<Attribute> modifier, int proficiency,
                                                 Collection<String> weaponProficiencies, List<WeaponInput> weapons) {
        Set<String> profTags = new LinkedHashSet<>();
        for (String p : weaponProficiencies) {
            String n = normalize(p);
            profTags.add(CATEGORY_GROUPS.getOrDefault(n, singular(n)));
        }
        List<AttackResponse> out = new ArrayList<>();
        for (WeaponInput w : weapons) {
            Attribute attribute = w.forced() != null ? w.forced()
                    : w.ranged() ? Attribute.DEXTERITY
                    : w.finesse() && modifier.applyAsInt(Attribute.DEXTERITY) > modifier.applyAsInt(Attribute.STRENGTH) ? Attribute.DEXTERITY
                    : Attribute.STRENGTH;
            int mod = modifier.applyAsInt(attribute);
            boolean proficient = w.tags().stream().anyMatch(profTags::contains);
            out.add(new AttackResponse(w.key(), w.name(), attribute, proficient, mod + (proficient ? proficiency : 0),
                    w.dice() == null ? null : withBonus(w.dice(), mod),
                    w.versatileDice() == null ? null : withBonus(w.versatileDice(), mod),
                    w.damageType(), w.critRange(), w.critMultiplier(), w.range(), w.mastery(), w.properties()));
        }
        // Desarmado: 1 + FOR, contundente, sempre proficiente.
        int str = modifier.applyAsInt(Attribute.STRENGTH);
        out.add(new AttackResponse(UNARMED, "Ataque desarmado", Attribute.STRENGTH, true, str + proficiency,
                String.valueOf(Math.max(1, 1 + str)), null, DamageType.B, 20, 2, null, null, null));
        return out;
    }

    // Arma do catálogo (itens.json).
    public static WeaponInput fromCatalog(String key, RuleItem r) {
        String props = r.properties() == null ? "" : r.properties();
        String lower = props.toLowerCase();
        Matcher d = DAMAGE.matcher(r.damage() == null ? "" : r.damage());
        String dice = null;
        DamageType type = null;
        if (d.find()) {
            dice = d.group(1).toLowerCase();
            type = damageType(d.group(2));
        }
        Matcher v = VERSATILE.matcher(props);
        Matcher range = RANGE.matcher(props);
        int[] crit = critical(r.critical());
        boolean ranged = lower.contains("munição") || r.groupsOrEmpty().stream().anyMatch(g -> g.endsWith("-distancia") || g.equals("arma-de-fogo"))
                || (r.category() != null && normalize(r.category()).contains("distancia"));
        Set<String> tags = new LinkedHashSet<>(r.groupsOrEmpty());
        tags.add(singular(normalize(r.name())));
        return new WeaponInput(key, r.name(), dice, v.find() ? v.group(1).toLowerCase() : null, type,
                lower.contains("acuidade"), ranged, null, tags, crit[0], crit[1],
                r.range() != null ? r.range() : range.find() ? range.group(1).replace(" ", "") + " pés" : null,
                r.mastery(), r.properties());
    }

    // Arma sem catálogo: só o que a linha de Weapon guarda.
    public static WeaponInput fromWeapon(String key, Weapon w) {
        String dice = w.getHitDice() == null ? null : (w.getHitDiceQuantity() == null ? 1 : w.getHitDiceQuantity()) + "d" + w.getHitDice();
        Set<String> tags = new LinkedHashSet<>();
        tags.add(singular(normalize(w.getName())));
        if (w.getCategory() == WeaponCategory.SIMPLE) tags.add("arma-simples");
        if (w.getCategory() == WeaponCategory.MARTIAL) tags.add("arma-marcial");
        if (w.getCategory() == WeaponCategory.FIREARM) tags.add("arma-de-fogo");
        Set<WeaponProperty> p = w.getProperties();
        boolean ranged = p.contains(WeaponProperty.AMMUNITION) || w.getCategory() == WeaponCategory.FIREARM;
        return new WeaponInput(key, w.getName(), dice, null, w.getDamageType(), p.contains(WeaponProperty.FINESSE), ranged,
                w.getDamageAttribute(), tags, w.getCritical() == null ? 20 : w.getCritical(), 2, null, null, null);
    }

    static int[] critical(String text) {
        Matcher m = CRITICAL.matcher(text == null ? "" : text);
        if (!m.find()) return new int[]{20, 2};
        return new int[]{m.group(1) == null ? 20 : Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2))};
    }

    // Letras do livro (mesmo mapa do StartingEquipmentService): r = cortante, p = perfurante, c = contundente.
    private static DamageType damageType(String word) {
        String w = word.toLowerCase();
        if (w.startsWith("cortante") || w.equals("r")) return DamageType.S;
        if (w.startsWith("p")) return DamageType.P;
        if (w.startsWith("c")) return DamageType.B;
        return null;
    }

    private static String withBonus(String dice, int mod) {
        return mod == 0 ? dice : dice + (mod > 0 ? "+" : "") + mod;
    }

    static String normalize(String s) {
        return Normalizer.normalize(s == null ? "" : s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase().trim();
    }

    // "espadas curtas" → "espada curta" (para casar a proficiência no plural com o nome da arma).
    static String singular(String s) {
        StringBuilder out = new StringBuilder();
        for (String word : s.split("\\s+")) {
            if (!out.isEmpty()) out.append(' ');
            out.append(word.length() > 3 && word.endsWith("s") ? word.substring(0, word.length() - 1) : word);
        }
        return out.toString();
    }
}
