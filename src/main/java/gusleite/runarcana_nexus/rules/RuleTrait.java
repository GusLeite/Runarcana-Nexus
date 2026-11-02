package gusleite.runarcana_nexus.rules;

import java.util.List;

// Traço ou desvantagem da Runinata (rules/tracos.json).
// - tier: MINOR, MAJOR ou SUPERIOR (só traços). points: quantos pontos de Origem a desvantagem dá (só desvantagens).
// - group: agrupamento da desvantagem no assistente (Forma, Fraqueza...).
// - maxTimes: quantas vezes pode ser escolhido (padrão 1). requires: precisa ter escolhido pelo menos um destes traços.
// - detail: pergunta de texto livre feita ao escolher (ex.: "Qual tipo de dano?"); a resposta aparece no nome.
// - background: o traço libera a escolha de um Passado (Antecedente).
// - silent: não vira uma passiva com o texto (quando as concessões já bastam, ex.: Perícia).
// - grants: concessões normais (as mesmas do criacao.json), aplicadas uma vez por escolha.
// - speedSteps: quanto o deslocamento do traço cresce a cada escolha (troca os pés das concessões SPEED).
public record RuleTrait(
        String id,
        String name,
        String tier,
        String group,
        Double points,
        String description,
        Integer maxTimes,
        List<String> requires,
        String detail,
        Boolean background,
        Boolean silent,
        List<Grant> grants,
        // Pés de cada escolha para as concessões SPEED do traço (ex.: [15, 15, 10] = 15 na 1ª, 15 na 2ª, 10 da 3ª em diante).
        List<Double> speedSteps
) {
    public int maxTimesOrOne() {
        return maxTimes == null ? 1 : maxTimes;
    }

    public List<String> requiresOrEmpty() {
        return requires == null ? List.of() : requires;
    }

    public List<Grant> grantsOrEmpty() {
        return grants == null ? List.of() : grants;
    }
}
