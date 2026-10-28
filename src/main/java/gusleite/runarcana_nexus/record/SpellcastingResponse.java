package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Attribute;

import java.util.List;
import java.util.Map;

// Conjuração da ficha: cada fonte (classe, subclasse ou Técnica) com o atributo, a CD e o ataque de magia; o maior
// nível de magia que conjura (o maior entre as classes) e o custo em Mana por nível (Capítulo 10).
// Vazio (casters = []) em quem não conjura.
public record SpellcastingResponse(
        List<Caster> casters,
        int maxSpellLevel,
        Map<String, Integer> manaCost
) {
    public record Caster(String source, String className, Attribute attribute, int maxSpellLevel, int saveDc, int attackBonus) {}
}
