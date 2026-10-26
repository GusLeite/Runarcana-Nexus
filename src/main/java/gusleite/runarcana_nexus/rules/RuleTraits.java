package gusleite.runarcana_nexus.rules;

import java.util.List;
import java.util.Map;

// Sistema de traços da Runinata (rules/tracos.json): em vez dos traços fixos de uma origem, o personagem
// recebe Traços Menores e Maiores (quantidade do modo combinado com o mestre) e pode comprar mais com pontos de Origem.
// - budgets: os modos (Controlado, Moderado, Forte) com quantos traços menores e maiores dão.
// - conversion: pontos de Origem ao converter um traço do modo (MINOR, MAJOR); no máximo um de cada tipo.
// - costs: custo em pontos de Origem de cada traço (MINOR, MAJOR, SUPERIOR).
// - drawbacks: desvantagens, que dão pontos de Origem.
public record RuleTraits(
        List<Budget> budgets,
        Map<String, Integer> conversion,
        Map<String, Integer> costs,
        List<RuleTrait> traits,
        List<RuleTrait> drawbacks
) {
    public List<Budget> budgetsOrEmpty() {
        return budgets == null ? List.of() : budgets;
    }

    public List<RuleTrait> traitsOrEmpty() {
        return traits == null ? List.of() : traits;
    }

    public List<RuleTrait> drawbacksOrEmpty() {
        return drawbacks == null ? List.of() : drawbacks;
    }

    public int conversionOf(String tier) {
        return conversion == null ? 0 : conversion.getOrDefault(tier, 0);
    }

    public int costOf(String tier) {
        return costs == null ? 0 : costs.getOrDefault(tier, 0);
    }

    public record Budget(String id, String name, String description, Integer minor, Integer major) {}
}
