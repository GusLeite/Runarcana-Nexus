package gusleite.runarcana_nexus.record;

import jakarta.validation.constraints.Size;

// Título vazio vira "Sem título" no service. pinned é Boolean porque o Jackson 3 recusa primitivo ausente.
public record NoteRequest(
        @Size(max = 120, message = "O título pode ter até 120 caracteres.")
        String title,
        @Size(max = 20000, message = "A anotação pode ter até 20000 caracteres.")
        String body,
        Boolean pinned
) {}
