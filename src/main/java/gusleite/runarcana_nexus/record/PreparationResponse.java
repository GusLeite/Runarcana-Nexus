package gusleite.runarcana_nexus.record;

import java.util.List;

// Magias preparadas da ficha, por classe que prepara (vazio = nenhuma). limit: quantas no máximo; maxSpellLevel: até
// que nível (nulo quando as opções são os feitiços conhecidos); options: o que dá para preparar; prepared: as chaves
// das que estão preparadas agora.
public record PreparationResponse(List<PreparingClass> classes) {

    public record PreparingClass(String classId, String name, int limit, Integer maxSpellLevel, List<Option> options,
                                 List<String> prepared) {}

    // key: "spell:<id>" (da lista da classe ou dos Mistérios) ou "ability:<id>" (feitiço conhecido da ficha).
    public record Option(String key, String name, int level) {}
}
