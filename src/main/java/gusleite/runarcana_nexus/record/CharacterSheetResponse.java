package gusleite.runarcana_nexus.record;

import java.util.List;

// Ficha completa do personagem logado: dados, perícias, inventário e magias/habilidades.
public record CharacterSheetResponse(
        CharacterResponse character,
        List<InventoryItemResponse> inventory,
        List<AbilityResponse> abilities
) {}
