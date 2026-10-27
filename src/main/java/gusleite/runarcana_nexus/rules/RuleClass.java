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
        List<RuleLineage> subclasses,
        // Multiclasse (Capítulo 5): pré-requisito de atributos para entrar ou sair da classe e as proficiências que
        // ela dá quando não é a primeira classe.
        Multiclass multiclass
) {
    // attributes: todos os mínimos; anyAttributes: basta um ("Força 13 ou Destreza 13"); anotherAttribute: além dos
    // mínimos, mais um atributo qualquer com esse valor (Arcanista: "Inteligência 13 e outro atributo 13").
    // grants: só as proficiências da tabela Proficiências de Multiclasse.
    public record Multiclass(String prerequisite, java.util.Map<gusleite.runarcana_nexus.enums.Attribute, Integer> attributes,
                             java.util.Map<gusleite.runarcana_nexus.enums.Attribute, Integer> anyAttributes,
                             Integer anotherAttribute, List<Grant> grants) {
        public List<Grant> grantsOrEmpty() {
            return grants == null ? List.of() : grants;
        }
    }

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
