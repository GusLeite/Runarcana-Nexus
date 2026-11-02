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
        List<TraitPick> drawbacks,
        // Equipamento inicial: EQUIPMENT (padrão: o da classe e do passado) ou WEALTH (troca tudo pela riqueza inicial
        // da classe, rolada ao criar).
        String startingEquipment,
        // Níveis ganhos depois do 1º, em ordem (o primeiro é o 2º nível do personagem). Montados pelo mestre na subida
        // de nível e guardados no build da ficha.
        List<LevelPick> levels
) {
    // Um nível ganho: em qual classe (multiclasse: outra classe), a subclasse quando é o 1º nível de uma classe nova,
    // o dado de vida rolado (no app ou na mesa), as escolhas daquele nível (chaves "level:N:...") e as Heranças
    // compradas com o ponto do nível (5º, 9º, 13º e 17º).
    public record LevelPick(String classId, String subclassId, Integer hpRoll, Map<String, List<String>> choices,
                            List<HeritagePick> heritages) {}

    public List<LevelPick> levelsOrEmpty() {
        return levels == null ? List.of() : levels;
    }

    // O mesmo pedido com mais um nível.
    public CreationRequest withLevel(LevelPick pick) {
        List<LevelPick> next = new java.util.ArrayList<>(levelsOrEmpty());
        next.add(pick);
        return new CreationRequest(characterName, playerName, age, height, alignment, regionId, originId, lineageId, classId,
                subclassId, backgroundId, attributeMethod, baseAttributes, choices, heritages, traitBudget, traits, drawbacks,
                startingEquipment, List.copyOf(next));
    }

    public boolean startingWealth() {
        return "WEALTH".equals(startingEquipment);
    }

    // option: a sub-escolha da Herança (ex.: a tribo do Meio-Vastaya), quando ela tem options.
    public record HeritagePick(String id, String option) {}

    // detail: resposta livre que o traço pede (ex.: o tipo de dano da Resistência Natural).
    public record TraitPick(String id, String detail) {}
}
