package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Attribute;

// Um ofício da ficha. level: nível do ofício maior (1 no 1º nível, +1 a cada 4 níveis de personagem; nulo no menor,
// que tem disciplinas). bonus: mod. do atributo base + metade do bônus de proficiência (o bônus inteiro com especialidade).
public record CraftResponse(String name, String kind, Attribute attribute, Integer level, boolean expertise, Integer bonus) {}
