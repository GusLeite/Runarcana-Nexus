package gusleite.runarcana_nexus.rules;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.MovementType;
import gusleite.runarcana_nexus.enums.UsesFormula;

import java.util.List;
import java.util.Map;

// Forma temporária (concessão FORM) ou efeito ativo (EFFECT): o que muda enquanto está ligado na ficha.
// - attributes: soma em cada atributo (Íbex: FOR +2, DES +4); halfProficiency: +metade da proficiência (Forma Dracônica).
// - speeds: deslocamento em pés (vale o maior entre ele e o normal); speedBonus: soma na caminhada (Movimento Relampejante).
// - size: tamanho fixo ou "UP" (uma categoria acima).
// - ac / acFormula (PROFICIENCY, HALF_PROFICIENCY): bônus de CA; reduction / reductionFormula: RD; initiative /
//   initiativeFormula: bônus na iniciativa (Totem do Basilisco); resistances / immunities: tipos de dano.
public record FormRule(
        Map<Attribute, Integer> attributes,
        List<Attribute> halfProficiency,
        Map<MovementType, Double> speeds,
        String size,
        Double speedBonus,
        Integer ac,
        UsesFormula acFormula,
        List<String> resistances,
        List<String> immunities,
        Integer reduction,
        UsesFormula reductionFormula,
        Integer initiative,
        UsesFormula initiativeFormula
) {}
