package gusleite.runarcana_nexus.rules;

import java.util.List;
import java.util.Map;

// Fórmulas de Ofício (rules/formulas.json, extraídas da wiki): as Fórmulas Gerais (quase todas de nível 0, de vários
// ofícios; crafts = texto com os ofícios) e as de cada ofício (chave = id do ofício do criacao.json). Nos ofícios menores,
// discipline é a disciplina ("Escriba"). dc é texto ("13", "*", "13, 15, 17").
public record RuleFormulas(
        String source,
        String rule,
        List<Formula> general,
        Map<String, List<Formula>> crafts
) {
    public record Formula(String id, String name, Integer level, String discipline, String prerequisite, String craft,
                          String crafts, String part, String dc, String component, String value, String time, String detail,
                          String description, String natural20) {}

    public List<Formula> generalOrEmpty() {
        return general == null ? List.of() : general;
    }

    public Map<String, List<Formula>> craftsOrEmpty() {
        return crafts == null ? Map.of() : crafts;
    }
}
