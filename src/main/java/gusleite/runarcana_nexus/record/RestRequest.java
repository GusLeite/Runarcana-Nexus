package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.RestType;
import jakarta.validation.constraints.NotNull;

public record RestRequest(
        @NotNull(message = "Informe o descanso: SHORT ou LONG.")
        RestType type
) {}
