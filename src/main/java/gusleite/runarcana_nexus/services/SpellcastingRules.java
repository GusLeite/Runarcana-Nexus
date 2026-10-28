package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.AbilityType;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.CharacterAbility;
import gusleite.runarcana_nexus.model.player.ClassLevel;
import gusleite.runarcana_nexus.record.AbilityResponse;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Conjuração da ficha, lida do texto do livro que já está nas habilidades de Conjuração de cada classe/subclasse
// ("Conjuração", "Conjuração do Espião", "Combatente Conjurador"): "Atributo de conjuração: Inteligência" e a tabela
// do nível máximo de magia. Assim vale também para as fichas antigas, sem migração.
// CD = 8 + proficiência + mod.; ataque de magia = proficiência + mod.
public final class SpellcastingRules {

    // Mana da ficha (uma habilidade só, mesmo na multiclasse).
    public static final String MANA = CreationService.MANA;

    private static final Pattern ATTRIBUTE = Pattern.compile("atributo de conjura[cç][aã]o:\\s*(\\p{L}+)", Pattern.CASE_INSENSITIVE);
    // Acólito: "Nível máximo de magia: 1º no 1º nível, 2º no 3º, ..." → (magia, nível na classe).
    private static final Pattern MAX_BY_LEVEL = Pattern.compile("(\\d)º no (\\d+)º");
    // Tabelas "truques / magias / nível máximo": "3º 3/6/2º" → (nível na classe, magia).
    private static final Pattern TABLE_ROW = Pattern.compile("(\\d+)º\\s+[\\d–-]+/[\\d–-]+/(\\d)º");
    private static final Map<String, Attribute> ATTRIBUTES = Map.of(
            "forca", Attribute.STRENGTH, "destreza", Attribute.DEXTERITY, "constituicao", Attribute.CONSTITUTION,
            "inteligencia", Attribute.INTELLIGENCE, "sabedoria", Attribute.WISDOM, "carisma", Attribute.CHARISMA);

    // Uma fonte de conjuração da ficha. source: a fonte da habilidade de Conjuração ("Classe: Arcanista").
    public record Casting(String source, String className, Attribute attribute, int maxSpellLevel, int saveDc, int attackBonus) {}

    static final String IMPROVED = "Combatente Arcano Aprimorado";
    static final String IMPROVED_ROWS = "(Aprimorado)";

    private SpellcastingRules() {}

    public static List<Casting> castings(Character c, List<CharacterAbility> abilities) {
        List<Casting> out = new ArrayList<>();
        // A tabela do Combatente Conjurador só segue depois de "(Aprimorado)" com a Técnica Combatente Arcano Aprimorado.
        boolean improved = abilities.stream().anyMatch(a -> a.getName().contains(IMPROVED)
                || (a.getSource() != null && a.getSource().contains(IMPROVED)));
        for (CharacterAbility a : abilities) {
            if (a.getType() == AbilityType.SPELL || a.getDescription() == null) continue;
            Matcher m = ATTRIBUTE.matcher(a.getDescription());
            if (!m.find()) continue;
            Attribute attribute = ATTRIBUTES.get(normalize(m.group(1)));
            if (attribute == null) continue;
            ClassLevel klass = classOf(c, a.getSource());
            int classLevel = klass != null ? klass.getLevel() : c.getLevel();
            int mod = c.getModifier(attribute);
            String table = a.getDescription();
            int cut = table.indexOf(IMPROVED_ROWS);
            if (!improved && cut >= 0) table = table.substring(0, cut);
            out.add(new Casting(a.getSource(), klass == null ? null : klass.getClassName(), attribute,
                    maxSpellLevel(table, classLevel), 8 + c.getProficiencyBonus() + mod, c.getProficiencyBonus() + mod));
        }
        return out;
    }

    // A conjuração de uma magia: a da classe de onde ela veio; sem classe reconhecível, a primeira da ficha.
    public static Casting forSpell(Character c, List<Casting> castings, CharacterAbility spell) {
        if (castings.isEmpty()) return null;
        ClassLevel klass = classOf(c, spell.getSource());
        if (klass != null) {
            for (Casting k : castings) if (klass.getClassName().equals(k.className())) return k;
        }
        return castings.getFirst();
    }

    // Maior nível de magia que a ficha conjura: o maior entre as classes (multiclasse).
    public static int maxSpellLevel(List<Casting> castings) {
        return castings.stream().mapToInt(Casting::maxSpellLevel).max().orElse(0);
    }

    // As habilidades da ficha com a CD e o ataque de magia nas magias.
    public static List<AbilityResponse> responses(Character c, List<CharacterAbility> abilities) {
        List<Casting> castings = castings(c, abilities);
        return abilities.stream().map(a -> AbilityResponse.of(a, forSpell(c, castings, a))).toList();
    }

    // Nível máximo de magia pela tabela do texto, no nível da classe (0 = só truques).
    static int maxSpellLevel(String description, int classLevel) {
        int max = 0;
        Matcher a = MAX_BY_LEVEL.matcher(description);
        while (a.find()) if (Integer.parseInt(a.group(2)) <= classLevel) max = Math.max(max, Integer.parseInt(a.group(1)));
        Matcher b = TABLE_ROW.matcher(description);
        while (b.find()) if (Integer.parseInt(b.group(1)) <= classLevel) max = Math.max(max, Integer.parseInt(b.group(2)));
        return max;
    }

    // Classe da fonte: "Classe: Arcanista (3º nível)", "Magias preparadas: Acólito", "Glifo: Runas" (pela subclasse),
    // "Técnica de Combate: Combatente Arcano". Com uma classe só, é ela.
    static ClassLevel classOf(Character c, String source) {
        List<ClassLevel> levels = c.getClassLevels();
        if (source != null) {
            for (ClassLevel l : levels) if (l.getClassName() != null && source.contains(l.getClassName())) return l;
            for (ClassLevel l : levels) if (l.getSubclass() != null && source.contains(l.getSubclass())) return l;
        }
        return levels.size() == 1 ? levels.getFirst() : null;
    }

    private static String normalize(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase();
    }
}
