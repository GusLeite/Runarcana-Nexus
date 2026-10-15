package com.runarcana.nexus.inventory.dto;

import java.util.List;

public record CharacterInventoryResponse(
        Long characterId,
        String characterName,
        List<InventoryEntryResponse> entries
) {
}
