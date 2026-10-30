package gusleite.runarcana_nexus.rules;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.MovementType;

import java.util.List;
import java.util.Map;

// Forma temporária (concessão FORM): o que muda enquanto ela está ativa na ficha.
// - attributes: soma em cada atributo (Íbex: FOR +2, DES +4); halfProficiency: +metade da proficiência (Forma Dracônica).
// - speeds: deslocamento da forma em pés (vale o maior entre ele e o normal); size: tamanho fixo ou "UP" (uma categoria acima).
public record FormRule(
        Map<Attribute, Integer> attributes,
        List<Attribute> halfProficiency,
        Map<MovementType, Double> speeds,
        String size
) {}
