package gusleite.runarcana_nexus.enums;

// Como calcular os usos de uma habilidade. FIXED usa maxUses; as outras escalam com o bônus de proficiência
// (arredondamento definido em "rounding" no catálogo; mínimo de 1 uso).
public enum UsesFormula {
    FIXED,
    HALF_PROFICIENCY,
    PROFICIENCY,
    // Modificador do atributo da concessão ("attribute"), mínimo 1. Ex.: Urro Triunfante = mod. de Constituição.
    ATTRIBUTE_MODIFIER
}
