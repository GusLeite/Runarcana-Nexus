package gusleite.runarcana_nexus.rules;

import java.util.List;

// Catálogo de regras de criação: src/main/resources/rules/criacao.json + as Heranças de rules/herancas.json.
// baseSpeed em pés. rounding: "DOWN" ou "UP" (metade do bônus de proficiência e afins).
public record RuleCatalog(
        AttributeMethods attributeMethods,
        Double baseSpeed,
        String rounding,
        List<Craft> crafts,
        List<RuleOption> origins,
        List<RuleClass> classes,
        List<RuleOption> backgrounds,
        List<RuleOption> regions,
        List<RuleHeritage> heritages,
        // Traços da Runinata (rules/tracos.json), usados pelas origens com usesTraits.
        RuleTraits traits
) {
    public List<Craft> craftsOrEmpty() {
        return crafts == null ? List.of() : crafts;
    }

    public List<RuleHeritage> heritagesOrEmpty() {
        return heritages == null ? List.of() : heritages;
    }

    public RuleCatalog withHeritages(List<RuleHeritage> list) {
        return new RuleCatalog(attributeMethods, baseSpeed, rounding, crafts, origins, classes, backgrounds, regions, list, traits);
    }

    public RuleCatalog withTraits(RuleTraits t) {
        return new RuleCatalog(attributeMethods, baseSpeed, rounding, crafts, origins, classes, backgrounds, regions, heritages, t);
    }

    // kind: MAJOR (ofício maior, com níveis) ou MINOR (ofício menor, com disciplinas).
    public record Craft(String id, String name, String kind) {}
}
