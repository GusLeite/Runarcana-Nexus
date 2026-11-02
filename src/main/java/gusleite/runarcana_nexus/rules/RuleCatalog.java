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
        RuleTraits traits,
        // Recursos de classe do Capítulo 5 (rules/recursos.json): Iras, Sutras, Vel, Técnicas, Invocações...
        List<RuleResource> resources,
        // Capítulo 10 (rules/magias.json): Mana por nível, elementos, Mistérios e magias.
        RuleMagic magic,
        // Natureza Rúnica (Capítulo 5, Runas): concessões que todo personagem recebe na criação, o Pulso Rúnico e a
        // Runa inicial (RESOURCE_CHOICE de RUNA). Fonte "Natureza Rúnica" no assistente.
        List<Grant> runicNature,
        // Capítulo 6 (rules/itens.json): catálogo de itens e riqueza inicial por classe.
        RuleItems equipment
) {
    public List<Grant> runicNatureOrEmpty() {
        return runicNature == null ? List.of() : runicNature;
    }


    public List<RuleResource> resourcesOrEmpty() {
        return resources == null ? List.of() : resources;
    }

    public List<Craft> craftsOrEmpty() {
        return crafts == null ? List.of() : crafts;
    }

    public List<RuleHeritage> heritagesOrEmpty() {
        return heritages == null ? List.of() : heritages;
    }

    public RuleCatalog withHeritages(List<RuleHeritage> list) {
        return new RuleCatalog(attributeMethods, baseSpeed, rounding, crafts, origins, classes, backgrounds, regions, list, traits, resources, magic, runicNature, equipment);
    }

    public RuleCatalog withTraits(RuleTraits t) {
        return new RuleCatalog(attributeMethods, baseSpeed, rounding, crafts, origins, classes, backgrounds, regions, heritages, t, resources, magic, runicNature, equipment);
    }

    public RuleCatalog withResources(List<RuleResource> list) {
        return new RuleCatalog(attributeMethods, baseSpeed, rounding, crafts, origins, classes, backgrounds, regions, heritages, traits, list, magic, runicNature, equipment);
    }

    public RuleCatalog withEquipment(RuleItems e) {
        return new RuleCatalog(attributeMethods, baseSpeed, rounding, crafts, origins, classes, backgrounds, regions, heritages, traits, resources, magic, runicNature, e);
    }

    public RuleCatalog withMagic(RuleMagic m) {
        return new RuleCatalog(attributeMethods, baseSpeed, rounding, crafts, origins, classes, backgrounds, regions, heritages, traits, resources, m, runicNature, equipment);
    }

    // kind: MAJOR (ofício maior, com níveis) ou MINOR (ofício menor, com disciplinas).
    // attribute: atributo base dos testes do ofício (opcional nos catálogos de teste).
    public record Craft(String id, String name, String kind, gusleite.runarcana_nexus.enums.Attribute attribute) {}
}
