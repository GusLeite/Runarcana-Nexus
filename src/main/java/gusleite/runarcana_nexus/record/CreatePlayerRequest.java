package gusleite.runarcana_nexus.record;

import jakarta.validation.constraints.NotBlank;

public record CreatePlayerRequest(
    @NotBlank(message = "Informe o nome do jogador.") String username
) {}
