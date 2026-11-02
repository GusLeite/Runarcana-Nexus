package gusleite.runarcana_nexus.rules;

import gusleite.runarcana_nexus.enums.Attribute;

import java.util.List;
import java.util.Map;

// Recurso de classe do Capítulo 5 (rules/recursos.json), escolhido por uma concessão RESOURCE_CHOICE:
// Ira (Bruto), Sutra e Vel (Bodisatva), Técnica de Combate (Combatente), Invocação e Grande Espírito (Xamã)
// e Aspectos Ferais (Forma Selvagem do Metamorfo). Também as Runas e Runessências (kind RUNA), da Natureza Rúnica.
// - kind: IRA, SUTRA, VEL, TECNICA, INVOCACAO, GRANDE_ESPIRITO, ASPECTO_TERRESTRE, ASPECTO_AQUATICO, ASPECTO_ALADO, RUNA.
// - groups: lista a que pertence ("Bodisatva", "Shojin", "Escola Umbral"...); a escolha pode limitar por grupo.
//   Runas: o Pulso ("Rubi"); Runessências também "Runessência" e a árvore ("Aquavitista").
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
        List<Grant> grants,
        // Usos da habilidade do recurso (Runas: metade do bônus de proficiência por descanso longo).
        UsesRule uses,
        // Pode ser escolhido de novo em outra escolha (Aprimoramentos "Mais Inimigos", o aumento de atributo).
        Boolean repeatable,
        // Ganhos pelo NÍVEL NA CLASSE que escolheu o recurso (Técnica Combatente Arcano: magias conhecidas do 3º nível de
        // Combatente em diante). Escolhido depois do nível, o ganho entra junto com a escolha.
        List<RuleLevel> levels,
        // Limiar de Herança que o recurso também alcança (Adaptação Tecnológica: 5 Vantagens → Construto Vivo ou Mutante).
        RuleHeritage.Threshold threshold
) {
    public boolean repeats() {
        return Boolean.TRUE.equals(repeatable);
    }

    public List<String> groupsOrEmpty() {
        return groups == null ? List.of() : groups;
    }

    public List<Grant> grantsOrEmpty() {
        return grants == null ? List.of() : grants;
    }

    public List<RuleLevel> levelsOrEmpty() {
        return levels == null ? List.of() : levels;
    }

    public int costOrOne() {
        return cost == null ? 1 : cost;
    }

    // Tudo que estiver preenchido precisa valer. Listas de classes, subclasses, regiões e heranças: basta uma.
    // attributes: todos os mínimos; anyAttributes: basta um ("Força ou Destreza 13").
    // skills e resources (outros recursos já escolhidos): todos. feature + featureOptions: opção escolhida numa
    // habilidade ("Escola" → "Escola Umbral"). weapons: proficiência com uma dessas armas ("Armas simples",
    // "Armas marciais": "uma arma de haste"); armor: todas essas proficiências de armadura (SHIELD).
    // level: nível do personagem; classLevel: nível mínimo em uma das classes de classes ("Caçador 8"). origins e
    // lineages: basta uma.
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
            List<String> armor,
            Integer classLevel,
            List<String> origins,
            List<String> lineages,
            // Magias que precisa conhecer (ids do magias.json), ex.: Rajada Etérea → rajada-mistica.
            List<String> spells
    ) {}
}
