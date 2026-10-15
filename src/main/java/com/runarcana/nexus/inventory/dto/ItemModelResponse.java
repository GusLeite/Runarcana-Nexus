package com.runarcana.nexus.inventory.dto;

import com.runarcana.nexus.inventory.entity.ItemType;
import java.math.BigDecimal;
import java.time.Instant;

public record ItemModelResponse(
        Long id,
        String name,
        String description,
        ItemType itemType,
        BigDecimal weight,
        String imageFileName,
        Instant createdAt,
        Instant updatedAt
) {
}
