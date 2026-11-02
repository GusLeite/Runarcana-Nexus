package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.DocumentKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

// Documento novo do mestre. recipients vazio ou nulo = vai para todos os jogadores.
public record DocumentRequest(
        @NotBlank(message = "Informe o título do documento.")
        @Size(max = 160, message = "O título pode ter até 160 caracteres.")
        String title,
        @NotNull(message = "Informe o tipo: LETTER, CLUE, MAP, LORE, SECRET ou REWARD.")
        DocumentKind kind,
        @Size(max = 20000, message = "O texto pode ter até 20000 caracteres.")
        String body,
        @Size(max = 1000, message = "O link da imagem pode ter até 1000 caracteres.")
        @Pattern(regexp = "^https?://\\S+$", message = "O link da imagem deve começar com http:// ou https://.")
        String imageUrl,
        List<String> recipients
) {}
