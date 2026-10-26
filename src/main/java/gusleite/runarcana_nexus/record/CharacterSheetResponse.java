package gusleite.runarcana_nexus.record;

import java.util.List;

// Ficha completa do personagem logado: dados, perícias, CA (com as armaduras do inventário), inventário e magias/habilidades.
public record CharacterSheetResponse(
        CharacterResponse character,
        ArmorClassResponse armorClass,
        List<InventoryItemResponse> inventory,
        List<AbilityResponse> abilities
) {}
