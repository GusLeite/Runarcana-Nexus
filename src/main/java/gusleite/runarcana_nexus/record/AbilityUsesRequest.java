package gusleite.runarcana_nexus.record;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record AbilityUsesRequest(
        @NotNull(message = "Informe quantos usos restam.")
        @PositiveOrZero(message = "Os usos não podem ser negativos.")
        Integer usesLeft
) {}
