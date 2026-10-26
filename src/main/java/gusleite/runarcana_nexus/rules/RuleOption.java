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
        List<RuleLineage> lineages
) {
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
