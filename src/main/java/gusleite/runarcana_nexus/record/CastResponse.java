package gusleite.runarcana_nexus.record;

import java.util.List;

// Resultado de conjurar: quanto custou (manaCost em Mana; usedUse = gastou um uso próprio da magia) e as habilidades
// da ficha já atualizadas.
public record CastResponse(int level, int manaCost, boolean usedUse, List<AbilityResponse> abilities) {}
