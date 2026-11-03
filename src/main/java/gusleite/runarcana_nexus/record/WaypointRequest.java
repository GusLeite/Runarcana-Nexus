package gusleite.runarcana_nexus.record;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WaypointRequest(
        @NotBlank(message = "Dê um nome ao waypoint.")
        @Size(max = 80, message = "O nome pode ter até 80 caracteres.")
        String name,
        @Size(max = 1000, message = "O comentário pode ter até 1000 caracteres.")
        String comment,
        @DecimalMin(value = "-1024", message = "O waypoint está fora do mapa.")
        @DecimalMax(value = "1024", message = "O waypoint está fora do mapa.")
        double x,
        @DecimalMin(value = "-1024", message = "O waypoint está fora do mapa.")
        @DecimalMax(value = "1024", message = "O waypoint está fora do mapa.")
        double y
) {}
