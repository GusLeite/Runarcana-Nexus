package com.runarcana.nexus.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record InventoryEntryRequest(@NotNull Long itemModelId, @NotNull @Min(1) Integer quantity) {
}
