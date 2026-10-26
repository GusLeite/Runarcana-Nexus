package gusleite.runarcana_nexus.rules;

import java.util.List;

// Um caminho para cumprir o pré-requisito de uma Herança (RuleHeritage.anyOf). Vale se TODOS os campos preenchidos
// baterem: origem, linhagem, outra Herança escolhida (com uma das opções) e/ou a opção escolhida numa habilidade da ficha.
// Ex.: Cauda Preênsil = linhagem Shimon ou Oovi-Kat, OU Variante Meio-Vastaya (Shimon ou Oovi-Kat).
public record HeritageCondition(
        List<String> origins,
        List<String> lineages,
        String heritage,
        List<String> heritageOptions,
        // Nome da habilidade com escolha (ex.: "Florescência") e as opções que valem (ex.: "Flor Gélida").
        String feature,
        List<String> featureOptions
) {
    public List<String> originsOrEmpty() {
        return origins == null ? List.of() : origins;
    }

    public List<String> lineagesOrEmpty() {
        return lineages == null ? List.of() : lineages;
    }

    public List<String> heritageOptionsOrEmpty() {
        return heritageOptions == null ? List.of() : heritageOptions;
    }

    public List<String> featureOptionsOrEmpty() {
        return featureOptions == null ? List.of() : featureOptions;
    }
}
