package gusleite.runarcana_nexus.rules;

import java.util.List;

// Classe do catálogo. grants = o que ganha no 1º nível; levels = o que ganha do 2º em diante (subida de nível).
// id é o nome do CharacterClassType (ex.: ARCANIST).
// subclasses: as opções de subclasse (Glifo do Arcanista, Cabala do Mercurial...), escolhidas no 1º nível, cada uma com
// grants (1º nível) e levels; subclassLabel é como o livro chama a subclasse ("Glifo", "Cabala").
public record RuleClass(
        String id,
        String name,
        String description,
        Boolean example,
        Integer hitDie,
        Integer startingGold,
        List<Grant> grants,
        List<RuleLevel> levels,
        String subclassLabel,
        List<RuleLineage> subclasses
) {
    public List<Grant> grantsOrEmpty() {
        return grants == null ? List.of() : grants;
    }

    public List<RuleLevel> levelsOrEmpty() {
        return levels == null ? List.of() : levels;
    }

    public List<RuleLineage> subclassesOrEmpty() {
        return subclasses == null ? List.of() : subclasses;
    }
}
