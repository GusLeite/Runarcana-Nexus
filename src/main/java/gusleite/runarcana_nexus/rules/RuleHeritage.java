package gusleite.runarcana_nexus.rules;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.HeritageCategory;

import java.util.List;
import java.util.Map;

// Uma Herança do catálogo (rules/herancas.json). Custa 1 ponto por escolha.
// - origins / regions: de quais origens ou regiões ela é (ORIGIN/REGION) ou exige ("Pré-requisito: Humano ou Construto").
// - classes / minAttributes / initial / excludes: pré-requisitos conferidos automaticamente.
// - prerequisite: o texto do livro (inclui o que não dá para conferir sozinho, ex.: "proficiência com arma de fogo").
// - maxTimes: quantas vezes pode ser escolhida (padrão 1). options: sub-escolha (ex.: tribo do Meio-Vastaya).
public record RuleHeritage(
        String id,
        String name,
        HeritageCategory category,
        List<String> origins,
        List<String> regions,
        // Pré-requisito de linhagem (ids das linhagens da origem, ex.: "aelus").
        List<String> lineages,
        List<String> classes,
        Map<Attribute, Integer> minAttributes,
        Boolean initial,
        List<String> excludes,
        // Pré-requisito de Herança: precisa ter escolhido pelo menos uma destas (ex.: Gás Ionizado → Variante Nebulon).
        List<String> requires,
        String prerequisite,
        Integer maxTimes,
        List<String> options,
        String description,
        // Pré-requisito com caminhos alternativos: basta cumprir um. Quando existe, substitui origins/lineages na conferência.
        List<HeritageCondition> anyOf,
        // Efeitos aplicados na ficha (perícia, especialidade "caso já tenha", salvaguarda, deslocamento, idioma, ofício...),
        // além do texto. Fonte "Herança: <nome>"; as escolhas têm a chave "heritage:<id>:<índice>".
        List<Grant> grants
) {
    public List<Grant> grantsOrEmpty() {
        return grants == null ? List.of() : grants;
    }

    public List<HeritageCondition> anyOfOrEmpty() {
        return anyOf == null ? List.of() : anyOf;
    }

    public int maxTimesOrOne() {
        return maxTimes == null ? 1 : maxTimes;
    }

    public List<String> originsOrEmpty() {
        return origins == null ? List.of() : origins;
    }

    public List<String> regionsOrEmpty() {
        return regions == null ? List.of() : regions;
    }

    public List<String> lineagesOrEmpty() {
        return lineages == null ? List.of() : lineages;
    }

    public List<String> classesOrEmpty() {
        return classes == null ? List.of() : classes;
    }

    public List<String> excludesOrEmpty() {
        return excludes == null ? List.of() : excludes;
    }

    public List<String> requiresOrEmpty() {
        return requires == null ? List.of() : requires;
    }

    public List<String> optionsOrEmpty() {
        return options == null ? List.of() : options;
    }
}
