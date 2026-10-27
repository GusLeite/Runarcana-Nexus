package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.rules.RuleMagic;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

// Regras do Capítulo 10 sobre o catálogo de magia: custo de Mana e acesso aos elementos.
public final class MagicRules {

    // Exigência de Herança num caminho de acesso: "heritage:manifestacao-primordial".
    static final String HERITAGE = "heritage:";

    private MagicRules() {}

    // Pontos de Mana para conjurar no nível (0 = truque, sem Mana). null se o nível não existe na tabela.
    public static Integer manaCost(RuleMagic magic, int level) {
        return magic == null || magic.manaCost() == null ? null : magic.manaCost().get(String.valueOf(level));
    }

    // Elementos a que o personagem tem acesso, pelos elementos manifestos e pelas Heranças:
    // primários sempre; os outros quando algum caminho de "access" é cumprido por inteiro.
    // Com optionalRule, os Mistérios Espirituais que ele tem liberam os elementos de optionalAccess
    // (só para quem já tem algum Mistério Elemental).
    public static Set<String> accessibleElements(RuleMagic magic, Set<String> manifested, Set<String> heritages,
                                                 Set<String> mysteries, boolean optionalRule) {
        Set<String> out = new LinkedHashSet<>();
        for (RuleMagic.Element e : magic.elementsOrEmpty()) {
            List<List<String>> paths = e.access();
            if (paths == null || paths.isEmpty() || paths.stream().anyMatch(p -> p.stream().allMatch(t -> meets(t, manifested, heritages)))) {
                out.add(e.id());
            }
        }
        boolean hasElemental = magic.mysteriesOrEmpty().stream()
                .anyMatch(m -> "ELEMENTAL".equals(m.source()) && mysteries.contains(m.id()));
        if (optionalRule && hasElemental) {
            magic.mysteriesOrEmpty().stream()
                    .filter(m -> mysteries.contains(m.id()) && m.optionalAccess() != null)
                    .forEach(m -> out.addAll(m.optionalAccess()));
        }
        return out;
    }

    // Magias que o personagem pode aprender até maxLevel: as dos Mistérios que tem, a lista da classe (classId)
    // e as listas de origem/linhagem (origins: "yordle", "fauhwoon"...). Basta uma das três.
    public static List<RuleMagic.Spell> availableSpells(RuleMagic magic, Set<String> mysteries, String classId,
                                                        Set<String> origins, int maxLevel) {
        return magic.spellsOrEmpty().stream()
                .filter(s -> s.level() != null && s.level() <= maxLevel)
                .filter(s -> s.mysteriesOrEmpty().stream().anyMatch(mysteries::contains)
                        || (classId != null && s.classesOrEmpty().contains(classId))
                        || s.originsOrEmpty().stream().anyMatch(origins::contains))
                .toList();
    }

    private static boolean meets(String token, Set<String> manifested, Set<String> heritages) {
        if (token.startsWith(HERITAGE)) return heritages.contains(token.substring(HERITAGE.length()));
        return manifested.contains(token);
    }
}
