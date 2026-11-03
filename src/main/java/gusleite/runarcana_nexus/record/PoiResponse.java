package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.PoiKind;

import java.time.Instant;
import java.util.List;

// secretNotes só vai para o mestre; as imagens vêm por /map/pois/{id}/images (leves aqui: só a contagem e a imagem em destaque). loreEntryId só vem se quem pede pode ver o verbete. recipients só para o mestre.
public record PoiResponse(
        Long id,
        String name,
        PoiKind kind,
        String description,
        double x,
        double y,
        Long loreEntryId,
        String secretNotes,
        boolean official,
        String officialKey,
        String regionSlug,
        int imageCount,
        Integer spotlight,
        long spotlightRev,
        boolean toAll,
        List<String> recipients,
        List<Comment> comments
) {
    public record Comment(Long id, String author, String text, boolean shared, boolean mine, Instant createdAt) {}
}
