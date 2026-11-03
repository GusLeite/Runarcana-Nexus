package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.LoreKind;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

// Verbete inteiro de uma vez: facts e sections substituem os atuais. linkedIds: só em região, personagens e lugares dela.
public record LoreEntryRequest(
        @NotNull(message = "Informe o tipo: CHARACTER, PLACE ou REGION.")
        LoreKind kind,
        @NotBlank(message = "Informe o nome.")
        @Size(max = 120, message = "O nome pode ter até 120 caracteres.")
        String name,
        @Size(max = 160, message = "O título pode ter até 160 caracteres.")
        String subtitle,
        @Size(max = 500, message = "A citação pode ter até 500 caracteres.")
        String quote,
        @Size(max = 120, message = "O autor da citação pode ter até 120 caracteres.")
        String quoteAuthor,
        @Size(max = 4000, message = "O resumo pode ter até 4000 caracteres.")
        String summary,
        @Size(max = 1000, message = "O link da imagem pode ter até 1000 caracteres.")
        @Pattern(regexp = "^https?://\\S+$", message = "O link da imagem deve começar com http:// ou https://.")
        String imageUrl,
        @Pattern(regexp = "^[a-z-]{1,40}$", message = "Região do mapa desconhecida.")
        String mapSlug,
        Long regionId,
        List<Long> linkedIds,
        @Size(max = 12, message = "São até 12 informações.")
        List<@Valid Fact> facts,
        @Size(max = 40, message = "São até 40 conhecimentos.")
        List<@Valid Section> sections,
        boolean toAll,
        List<String> recipients
) {
    public record Fact(
            @NotBlank(message = "Toda informação precisa de um nome.")
            @Size(max = 60, message = "O nome da informação pode ter até 60 caracteres.")
            String label,
            @NotBlank(message = "Toda informação precisa de um valor.")
            @Size(max = 120, message = "O valor da informação pode ter até 120 caracteres.")
            String value
    ) {}

    // toAll falso e recipients vazio = só o mestre vê, como rascunho.
    public record Section(
            @NotBlank(message = "Todo conhecimento precisa de um título.")
            @Size(max = 160, message = "O título do conhecimento pode ter até 160 caracteres.")
            String title,
            @Size(max = 20000, message = "O texto do conhecimento pode ter até 20000 caracteres.")
            String body,
            boolean toAll,
            List<String> recipients
    ) {}
}
