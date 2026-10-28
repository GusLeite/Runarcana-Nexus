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
    // thrown/twoHanded: propriedades Arremesso e Duas mãos (para os Estilos de Luta).
    public record WeaponInput(String key, String name, String dice, String versatileDice, DamageType damageType,
                              boolean finesse, boolean ranged, Attribute forced, Set<String> tags,
                              int critRange, int critMultiplier, String range, String mastery, String properties,
                              boolean thrown, boolean twoHanded) {}

    // Estilos de Luta com efeito no ataque (Combatente e Caçador). Os outros (Defesa, Proteção, Phalanx...) ficam no texto.
    public static final List<String> ATTACK_STYLES = List.of("Arremessar", "Arquearia", "Combate com Arma de Duas Mãos",
            "Combate com Armas Grandes", "Combate Desarmado", "Duelismo");

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
        return calculate(modifier, proficiency, weaponProficiencies, weapons, Set.of(), 1);
    }

    // styles: Estilos de Luta da ficha; level: nível para os aumentos "+1 nos níveis 8 e 16".
    public static List<AttackResponse> calculate(ToIntFunction<Attribute> modifier, int proficiency,
                                                 Collection<String> weaponProficiencies, List<WeaponInput> weapons,
                                                 Set<String> styles, int level) {
        int tier = 1 + (level >= 8 ? 1 : 0) + (level >= 16 ? 1 : 0);
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
            int attack = mod + (proficient ? proficiency : 0);
            out.add(new AttackResponse(w.key(), w.name(), attribute, proficient, attack,
                    w.dice() == null ? null : withBonus(w.dice(), mod),
                    w.versatileDice() == null ? null : withBonus(w.versatileDice(), mod),
                    w.damageType(), w.critRange(), w.critMultiplier(), w.range(), w.mastery(), w.properties(),
                    styleVariants(w, styles, tier, attack, mod, modifier, proficiency, proficient), List.of()));
        }
        // Desarmado: 1 + FOR, contundente, sempre proficiente. Combate Desarmado: 1d4 + FOR e +1 no ataque (+1 no 8º e 16º).
        int str = modifier.applyAsInt(Attribute.STRENGTH);
        List<AttackResponse.StyleVariant> unarmed = styles.contains("Combate Desarmado")
                ? List.of(new AttackResponse.StyleVariant("Combate Desarmado", str + proficiency + tier, withBonus("1d4", str), null))
                : List.of();
        out.add(new AttackResponse(UNARMED, "Ataque desarmado", Attribute.STRENGTH, true, str + proficiency,
                String.valueOf(Math.max(1, 1 + str)), null, DamageType.B, 20, 2, null, null, null, unarmed, List.of()));
        return out;
    }

    // Cada Estilo de Luta que vale para a arma, com o ataque e o dano já ajustados.
    private static List<AttackResponse.StyleVariant> styleVariants(WeaponInput w, Set<String> styles, int tier, int attack, int mod,
                                                                    ToIntFunction<Attribute> modifier, int proficiency, boolean proficient) {
        if (w.dice() == null || styles.isEmpty()) return List.of();
        List<AttackResponse.StyleVariant> out = new ArrayList<>();
        boolean firearm = w.tags().contains("arma-de-fogo");
        boolean heavyGrip = w.twoHanded() || w.versatileDice() != null;
        String bigDice = w.twoHanded() || w.versatileDice() == null ? w.dice() : w.versatileDice();
        if (styles.contains("Arremessar") && w.thrown()) {
            // Usa Força ou Destreza, o maior.
            int best = Math.max(modifier.applyAsInt(Attribute.STRENGTH), modifier.applyAsInt(Attribute.DEXTERITY));
            out.add(new AttackResponse.StyleVariant("Arremessar", best + (proficient ? proficiency : 0) + tier, withBonus(w.dice(), best + tier), "arremessando"));
        }
        if (styles.contains("Arquearia") && w.ranged() && !firearm && !w.thrown()) {
            out.add(new AttackResponse.StyleVariant("Arquearia", attack + proficiency / 2, withBonus(w.dice(), mod), null));
        }
        if (styles.contains("Combate com Arma de Duas Mãos") && heavyGrip && !w.ranged()) {
            int str = modifier.applyAsInt(Attribute.STRENGTH);
            // O dobro do mod. de Força no dano (no lugar do mod. normal) e +1 no ataque e no dano.
            int bonus = (mod == str ? 2 * str : mod + str) + tier;
            out.add(new AttackResponse.StyleVariant("Combate com Arma de Duas Mãos", attack + tier, withBonus(bigDice, bonus), "com as duas mãos"));
        }
        if (styles.contains("Combate com Armas Grandes") && heavyGrip && !w.ranged()) {
            out.add(new AttackResponse.StyleVariant("Combate com Armas Grandes", attack + tier, withBonus(bigDice, mod + tier),
                    "com as duas mãos; rola de novo 1 ou 2 nos dados"));
        }
        if (styles.contains("Duelismo") && !w.ranged() && !w.twoHanded()) {
            out.add(new AttackResponse.StyleVariant("Duelismo", attack + tier, withBonus(w.dice(), mod + 2 * tier), "uma mão, sem outra arma"));
        }
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
                r.mastery(), r.properties(), lower.contains("arremesso"), lower.contains("duas mãos"));
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
                w.getDamageAttribute(), tags, w.getCritical() == null ? 20 : w.getCritical(), 2, null, null, null,
                p.contains(WeaponProperty.THROWN), p.contains(WeaponProperty.TWO_HANDED));
    }

    // A nota "ATTACK:<tipo>" vale para esta arma? (desarmado: só ATTACK e ATTACK:MELEE)
    public static boolean matches(String target, WeaponInput w) {
        if (target.equals("ATTACK")) return true;
        String type = target.substring("ATTACK:".length());
        if (w == null) return type.equals("MELEE");
        String name = normalize(w.name());
        return switch (type) {
            case "MELEE" -> !w.ranged();
            case "RANGED" -> w.ranged() || w.thrown();
            case "BOW" -> name.startsWith("arco");
            case "CROSSBOW" -> name.startsWith("besta");
            case "THROWN" -> w.thrown();
            case "FIREARM" -> w.tags().contains("arma-de-fogo");
            default -> false;
        };
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
