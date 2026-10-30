package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Attribute;

import java.util.List;

// Um ofício da ficha. level: nível do ofício maior (1 quando aprendido, +1 a cada 4 níveis de personagem depois disso; nulo
// no menor, que tem disciplinas). learnedAt: nível do personagem em que foi aprendido (1 = criação).
// bonus: mod. do atributo base + metade do bônus de proficiência (o bônus inteiro com especialidade).
// formulas: as conhecidas (marcadas pelo mestre); formulaLimit: quantas a regra dá = mod. de INT (mín. 1) por nível do ofício.
public record CraftResponse(String id, String name, String kind, Attribute attribute, Integer level, int learnedAt, boolean expertise,
                            Integer bonus, List<KnownFormula> formulas, int formulaLimit,
                            // PO por dia a mais na produção e quanto a margem de Obra-Prima diminui (Artífice, Operário...).
                            int income, int masterwork) {
    public record KnownFormula(String key, String name, int level, String dc, String description) {}
}
