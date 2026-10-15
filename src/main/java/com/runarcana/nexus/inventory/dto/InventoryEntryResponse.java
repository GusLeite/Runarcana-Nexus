package com.runarcana.nexus.inventory.dto;

import com.runarcana.nexus.inventory.entity.ItemType;
import java.math.BigDecimal;

public record InventoryEntryResponse(
        Long id,
        Long itemModelId,
        String itemName,
        ItemType itemType,
        BigDecimal itemWeight,
        Integer quantity
) {
}
