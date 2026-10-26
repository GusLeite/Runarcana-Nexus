package gusleite.runarcana_nexus.rules;

import gusleite.runarcana_nexus.enums.Attribute;

import java.util.List;
import java.util.Map;

// Recurso de classe do Capítulo 5 (rules/recursos.json), escolhido por uma concessão RESOURCE_CHOICE:
// Ira (Bruto), Sutra e Vel (Bodisatva), Técnica de Combate (Combatente), Invocação e Grande Espírito (Xamã)
// e Aspectos Ferais (Forma Selvagem do Metamorfo).
// - kind: IRA, SUTRA, VEL, TECNICA, INVOCACAO, GRANDE_ESPIRITO, ASPECTO_TERRESTRE, ASPECTO_AQUATICO, ASPECTO_ALADO.
// - groups: lista a que pertence ("Bodisatva", "Shojin", "Escola Umbral"...); a escolha pode limitar por grupo.
// - prerequisite: o texto do livro; requires: a parte que o assistente confere sozinho.
// - cost: pontos de Vel (◆) que o Vel ocupa. ki: pontos de Ki que o Vel inativa (saem do total de Ki).
// - grants: o que ele concede além da habilidade com a descrição.
public record RuleResource(
        String id,
        String kind,
        String name,
        List<String> groups,
        String prerequisite,
        String execution,
        String components,
        Integer cost,
        Integer ki,
        String description,
        Requirements requires,
        List<Grant> grants
) {
    public List<String> groupsOrEmpty() {
        return groups == null ? List.of() : groups;
    }

    public List<Grant> grantsOrEmpty() {
        return grants == null ? List.of() : grants;
    }

    public int costOrOne() {
        return cost == null ? 1 : cost;
    }

    // Tudo que estiver preenchido precisa valer. Listas de classes, subclasses, regiões e heranças: basta uma.
    // attributes: todos os mínimos; anyAttributes: basta um ("Força ou Destreza 13").
    // skills e resources (outros recursos já escolhidos): todos. feature + featureOptions: opção escolhida numa
    // habilidade ("Escola" → "Escola Umbral"). weapons: proficiência com uma dessas armas ("Armas simples",
    // "Armas marciais": "uma arma de haste"); armor: todas essas proficiências de armadura (SHIELD).
    public record Requirements(
            Integer level,
            Map<Attribute, Integer> attributes,
            Map<Attribute, Integer> anyAttributes,
            List<String> classes,
            List<String> subclasses,
            List<String> regions,
            List<String> skills,
            List<String> heritages,
            List<String> resources,
            String feature,
            List<String> featureOptions,
            List<String> weapons,
            List<String> armor
    ) {}
}
