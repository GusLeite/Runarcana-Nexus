package gusleite.runarcana_nexus.rules;

import java.util.List;

// Classe do catálogo. grants = o que ganha no 1º nível; levels = o que ganha do 2º em diante (subida de nível).
// id é o nome do CharacterClassType (ex.: ARCANIST).
public record RuleClass(
        String id,
        String name,
        String description,
        Boolean example,
        Integer hitDie,
        Integer startingGold,
        List<Grant> grants,
        List<RuleLevel> levels
) {
    public List<Grant> grantsOrEmpty() {
        return grants == null ? List.of() : grants;
    }

    public List<RuleLevel> levelsOrEmpty() {
        return levels == null ? List.of() : levels;
    }
}
