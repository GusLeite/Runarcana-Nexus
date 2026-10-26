package gusleite.runarcana_nexus.rules;

import java.util.List;

// Linhagem (tribo) de uma origem, ex.: Aelus, Alnuk e Auroque do Minotauro. Escolhida junto com a origem;
// as concessões dela entram na ficha com a fonte "Linhagem: ...".
public record RuleLineage(
        String id,
        String name,
        String description,
        List<Grant> grants,
        // Ganhos do 2º nível em diante (subida de nível). Ex.: a Forma Dracônica de cada essência no 8º.
        List<RuleLevel> levels
) {
    public List<Grant> grantsOrEmpty() {
        return grants == null ? List.of() : grants;
    }

    public List<RuleLevel> levelsOrEmpty() {
        return levels == null ? List.of() : levels;
    }
}
