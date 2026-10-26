package gusleite.runarcana_nexus.rules;

import java.util.List;

// Linhagem (tribo) de uma origem, ex.: Aelus, Alnuk e Auroque do Minotauro. Escolhida junto com a origem;
// as concessões dela entram na ficha com a fonte "Linhagem: ...".
public record RuleLineage(
        String id,
        String name,
        String description,
        List<Grant> grants
) {
    public List<Grant> grantsOrEmpty() {
        return grants == null ? List.of() : grants;
    }
}
