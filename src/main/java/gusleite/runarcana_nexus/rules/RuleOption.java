package gusleite.runarcana_nexus.rules;

import java.util.List;

// Origem, passado ou região do catálogo. example = conteúdo de exemplo, a substituir pelas regras reais.
// details = textos do cartão (ex.: Idade, Tamanho); languages = idiomas da região (para LANGUAGE_CHOICE com fromRegion).
public record RuleOption(
        String id,
        String name,
        String description,
        Boolean example,
        Double speed,
        Integer startingGold,
        List<Detail> details,
        List<String> languages,
        List<Grant> grants,
        // Linhagens (tribos) da origem; quando há, escolher uma é obrigatório.
        List<RuleLineage> lineages,
        // A origem monta seus traços com o sistema de traços (Runinata) e só tem Passado com o traço que libera.
        Boolean usesTraits,
        // Ganhos do 2º nível em diante (subida de nível), como nas classes. Ex.: o sopro do Meio-Dragão no 2º.
        List<RuleLevel> levels
) {
    public List<RuleLevel> levelsOrEmpty() {
        return levels == null ? List.of() : levels;
    }

    public boolean usesTraitsOrFalse() {
        return Boolean.TRUE.equals(usesTraits);
    }

    public List<RuleLineage> lineagesOrEmpty() {
        return lineages == null ? List.of() : lineages;
    }

    public List<Grant> grantsOrEmpty() {
        return grants == null ? List.of() : grants;
    }

    public List<String> languagesOrEmpty() {
        return languages == null ? List.of() : languages;
    }

    public record Detail(String name, String text) {}
}
