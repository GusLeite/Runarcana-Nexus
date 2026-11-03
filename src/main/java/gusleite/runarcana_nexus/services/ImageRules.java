package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.merchant.Merchant;

import java.util.regex.Pattern;

// Imagem aceita pelo back: data URL (PNG, JPEG, WebP, GIF) ou link http(s). Usada por mercadores e pontos do mapa.
final class ImageRules {
    private static final Pattern LINK = Pattern.compile("^https?://\\S+$");
    private static final Pattern HEADER = Pattern.compile("^data:image/(png|jpeg|webp|gif);base64,");

    private ImageRules() {}

    // Nulo se vazia; erro 400 se não serve.
    static String clean(String image) {
        if (image == null || image.isBlank()) return null;
        if (image.length() > Merchant.MAX_IMAGE) throw ApiException.badRequest("A imagem é grande demais.");
        boolean link = image.length() <= 1000 && LINK.matcher(image).matches();
        if (!link && !embedded(image)) throw ApiException.badRequest("A imagem deve ser PNG, JPEG, WebP ou GIF, ou um link http(s).");
        return image;
    }

    private static boolean embedded(String image) {
        var header = HEADER.matcher(image);
        if (!header.find()) return false;
        return image.substring(header.end()).chars()
                .allMatch(ch -> (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '+' || ch == '/' || ch == '=');
    }
}
