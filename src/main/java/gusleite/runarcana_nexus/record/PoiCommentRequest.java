package gusleite.runarcana_nexus.record;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// shared: a mesa inteira vê; falso: anotação só de quem escreveu.
public record PoiCommentRequest(
        @NotBlank(message = "Escreva o comentário.")
        @Size(max = 1000, message = "O comentário pode ter até 1000 caracteres.")
        String text,
        boolean shared
) {}
