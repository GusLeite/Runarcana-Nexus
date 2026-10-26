package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Alignment;
import gusleite.runarcana_nexus.enums.Attribute;

import java.util.List;
import java.util.Map;

// Escolhas do assistente de criação. Tudo opcional na prévia; na criação, o que faltar vira erro.
// attributeMethod: POINT_BUY, STANDARD_ARRAY ou MANUAL. choices: chave da escolha (vem na prévia) -> opções escolhidas.
public record CreationRequest(
        String characterName,
        String playerName,
        Integer age,
        Double height,
        Alignment alignment,
        String regionId,
        String originId,
        // Linhagem da origem (obrigatória quando a origem tem linhagens).
        String lineageId,
        String classId,
        // Subclasse da classe (Glifo, Cabala...), obrigatória quando a classe tem subclasses.
        String subclassId,
        String backgroundId,
        String attributeMethod,
        Map<Attribute, Integer> baseAttributes,
        Map<String, List<String>> choices,
        // Heranças compradas com os pontos de Herança. Repetir o id = escolher de novo (quando maxTimes permite).
        List<HeritagePick> heritages,
        // Runinata (origem com usesTraits): modo de traços combinado com o mestre (id de budgets),
        // traços e desvantagens escolhidos. Repetir o id = escolher de novo.
        String traitBudget,
        List<TraitPick> traits,
        List<TraitPick> drawbacks
) {
    // option: a sub-escolha da Herança (ex.: a tribo do Meio-Vastaya), quando ela tem options.
    public record HeritagePick(String id, String option) {}

    // detail: resposta livre que o traço pede (ex.: o tipo de dano da Resistência Natural).
    public record TraitPick(String id, String detail) {}
}
