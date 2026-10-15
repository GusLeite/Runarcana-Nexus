package com.runarcana.nexus.inventory.dto;

import com.runarcana.nexus.inventory.entity.ItemType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ItemModelRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 1500) String description,
        @NotNull ItemType itemType,
        @DecimalMin(value = "0.0", inclusive = true) BigDecimal weight,
        @Size(max = 255) String imageFileName
) {
}
