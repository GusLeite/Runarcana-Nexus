package gusleite.runarcana_nexus.rules;

import java.util.List;
import java.util.Map;

// Capítulo 6 (rules/itens.json): o catálogo de itens e a riqueza inicial por classe (id da classe → dados em PO,
// "5d4 x 10"), usada quando o jogador troca o equipamento inicial pelo dinheiro.
public record RuleItems(Map<String, String> startingWealth, List<RuleItem> items) {
    public List<RuleItem> itemsOrEmpty() {
        return items == null ? List.of() : items;
    }
}
