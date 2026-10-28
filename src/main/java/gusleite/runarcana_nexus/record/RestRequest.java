package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.RestType;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

// prepared: só no descanso longo, as magias preparadas de cada classe que prepara ({ "ACOLYTE": ["spell:abencoar"] },
// chaves das opções de GET /character/me/preparation). Nulo = mantém as preparadas.
public record RestRequest(
        @NotNull(message = "Informe o descanso: SHORT ou LONG.")
        RestType type,
        Map<String, List<String>> prepared
) {}
