package gusleite.runarcana_nexus.enums;

// Como calcular os usos de uma habilidade. FIXED usa maxUses; as outras escalam com o bônus de proficiência
// (arredondamento definido em "rounding" no catálogo; mínimo de 1 uso).
public enum UsesFormula {
    FIXED,
    HALF_PROFICIENCY,
    PROFICIENCY,
    // Modificador do atributo da concessão ("attribute"), mínimo 1. Ex.: Urro Triunfante = mod. de Constituição.
    ATTRIBUTE_MODIFIER,
    // Dobro do bônus de proficiência. Ex.: Fúria Símia.
    DOUBLE_PROFICIENCY,
    // Metade do nível do personagem (arredondamento do catálogo), mínimo 1. Ex.: Autossacrifício.
    HALF_LEVEL,
    // Metade do modificador do atributo da concessão, mínimo 1. Ex.: Charme Sobrenatural = metade do mod. de Carisma.
    HALF_ATTRIBUTE_MODIFIER,
    // Nível do personagem + modificador do atributo da concessão, mínimo 1. Ex.: Bênção do Espírito = nível de Acólito + mod. de Sabedoria.
    LEVEL_PLUS_ATTRIBUTE,
    // Bônus de proficiência + modificador do atributo, mínimo 1. Ex.: Receptáculo Etéreo = proficiência + mod. de Sabedoria.
    PROFICIENCY_PLUS_ATTRIBUTE,
    // Soma de dois modificadores: "attribute" + o atributo em "value", mínimo 1. Ex.: Estratégia = mod. de Inteligência + mod. de Carisma.
    TWO_ATTRIBUTES
}
