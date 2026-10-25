package gusleite.runarcana_nexus.record;

import java.util.List;

// Ficha completa do personagem logado: dados, perícias e inventário.
public record CharacterSheetResponse(
        CharacterResponse character,
        List<InventoryItemResponse> inventory
) {}
