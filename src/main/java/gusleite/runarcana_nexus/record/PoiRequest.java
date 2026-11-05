package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.PoiKind;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

// Ponto de interesse. toAll falso e recipients vazio = só o mestre vê, até revelar.
// relatedLoreIds: verbetes relacionados (qualquer tipo); nulo = mantém os atuais.
public record PoiRequest(
        @NotBlank(message = "Informe o nome do ponto.")
        @Size(max = 120, message = "O nome pode ter até 120 caracteres.")
        String name,
        @NotNull(message = "Informe o tipo do ponto.")
        PoiKind kind,
        @Size(max = 4000, message = "A descrição pode ter até 4000 caracteres.")
        String description,
        @DecimalMin(value = "-1024", message = "O ponto está fora do mapa.")
        @DecimalMax(value = "1024", message = "O ponto está fora do mapa.")
        double x,
        @DecimalMin(value = "-1024", message = "O ponto está fora do mapa.")
        @DecimalMax(value = "1024", message = "O ponto está fora do mapa.")
        double y,
        Long loreEntryId,
        @Size(max = 40, message = "São até 40 verbetes relacionados.")
        List<Long> relatedLoreIds,
        @Size(max = 4000, message = "As notas secretas podem ter até 4000 caracteres.")
        String secretNotes,
        boolean toAll,
        List<String> recipients
) {}
