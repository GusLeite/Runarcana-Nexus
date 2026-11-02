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
        List<Grant> grants,
        // Efeitos que dependem da opção escolhida (Propulsão Natural: Natureza ou Sobrevivência). Chave = a opção.
        Map<String, List<Grant>> optionGrants,
        // Parte ativa da Herança: a habilidade dela ganha o tempo ("Reação", "Ação bônus") e os usos por descanso.
        String execution,
        UsesRule uses,
        // Variantes com muitas opções: o texto de cada opção (a habilidade mostra o description + o das escolhidas)
        // e os usos e o tempo próprios de cada uma (Meio-Vastaya: Herança Profunda por descanso pleno...).
        Map<String, String> optionTexts,
        Map<String, UsesRule> optionUses,
        Map<String, String> optionExecution,
        // Cada escolha da Herança tem a sua opção (Forma de Sho'Ma: uma forma nova a cada vez); sem isso, a opção vale para todas.
        Boolean optionPerPick,
        // Efeitos da 2ª escolha da mesma Herança, pela opção (Ressurgido: Alternância, Aura de Medo, Super Camaradinha).
        Map<String, List<Grant>> repeatGrants,
        // Limiar: com count opções escolhidas na habilidade feature, ganha os efeitos da opção da Herança
        // (Progressão Tecnológica: 5 Vantagens Tecnológicas → Construto Vivo ou Mutante).
        Threshold threshold,
        // Opções que só valem da 2ª escolha em diante (Progressão Tecnológica: "Aprimorar Fonte", 1 Vantagem).
        List<String> repeatOptions
) {
    // dominant: nome da escolha que decide a fonte de quem tem mais de uma ("Fonte Dominante"); sem ela, vale a primeira.
    public record Threshold(String feature, int count, Map<String, List<Grant>> grants, String dominant) {}

    // Efeitos das opções escolhidas, depois dos gerais: cada opção uma vez, ou uma vez por escolha nas optionPerPick
    // (a mesma Fonte escolhida duas vezes dá as Vantagens de novo).
    public List<Grant> grantsFor(List<String> chosen) {
        List<Grant> out = new java.util.ArrayList<>(grantsOrEmpty());
        if (optionGrants != null) (optionPerPickOrFalse() ? chosen.stream() : chosen.stream().distinct())
                .forEach(o -> out.addAll(optionGrants.getOrDefault(o, List.of())));
        return out;
    }

    // Texto da habilidade: o geral + o de cada opção escolhida.
    public String textFor(List<String> chosen) {
        if (optionTexts == null || chosen.isEmpty()) return description;
        StringBuilder text = new StringBuilder(description == null ? "" : description);
        chosen.stream().distinct().filter(optionTexts::containsKey)
                .forEach(o -> text.append(text.isEmpty() ? "" : "\n\n").append(o).append("\n").append(optionTexts.get(o)));
        return text.toString();
    }

    public boolean optionPerPickOrFalse() {
        return Boolean.TRUE.equals(optionPerPick);
    }

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

    public List<String> repeatOptionsOrEmpty() {
        return repeatOptions == null ? List.of() : repeatOptions;
    }

    public List<String> optionsOrEmpty() {
        return options == null ? List.of() : options;
    }
}
