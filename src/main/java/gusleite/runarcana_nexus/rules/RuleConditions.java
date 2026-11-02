package gusleite.runarcana_nexus.rules;

import java.util.List;

// Condições do Capítulo 14 (rules/condicoes.json): id, nome e o resumo da regra; a Exaustão é à parte, em níveis
// (0 até exhaustionMax; acima disso a criatura morre).
public record RuleConditions(
        String source,
        Integer exhaustionMax,
        String exhaustion,
        List<Condition> conditions
) {
    public record Condition(String id, String name, String text) {}

    public List<Condition> conditionsOrEmpty() {
        return conditions == null ? List.of() : conditions;
    }
}
