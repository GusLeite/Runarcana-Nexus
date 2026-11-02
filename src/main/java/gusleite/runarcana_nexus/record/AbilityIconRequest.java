package gusleite.runarcana_nexus.record;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Troca (ou remove, com icon nulo) o ícone de uma habilidade já cadastrada.
public record AbilityIconRequest(
        @Size(max = MAX_ICON, message = "A imagem do ícone é grande demais (máx. ~200 KB).")
        @Pattern(regexp = ICON_PATTERN, message = ICON_MESSAGE)
        String icon
) {
    // ~200 KB de imagem em base64; o front manda bem menos (128x128).
    public static final int MAX_ICON = 300000;
    // Imagem embutida (PNG, JPEG, WebP ou GIF em base64) ou link http(s).
    public static final String ICON_PATTERN =
            "^(data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+|https?://\\S+)$";
    public static final String ICON_MESSAGE = "O ícone deve ser uma imagem PNG, JPEG, WebP ou GIF, ou um link http(s).";
}
