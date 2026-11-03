package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.PoiKind;

import java.time.Instant;
import java.util.List;

// loreEntryId só vem se quem pede pode ver o verbete. recipients só para o mestre.
public record PoiResponse(
        Long id,
        String name,
        PoiKind kind,
        String description,
        double x,
        double y,
        Long loreEntryId,
        boolean toAll,
        List<String> recipients,
        List<Comment> comments
) {
    public record Comment(Long id, String author, String text, boolean shared, boolean mine, Instant createdAt) {}
}
