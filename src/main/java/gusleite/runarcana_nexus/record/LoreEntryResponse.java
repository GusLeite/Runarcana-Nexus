package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.LoreKind;

import java.util.List;

// recipients só vêm preenchidos para o mestre; o jogador recebe apenas os conhecimentos dele.
public record LoreEntryResponse(
        Long id,
        LoreKind kind,
        String name,
        String subtitle,
        String quote,
        String quoteAuthor,
        String summary,
        String imageUrl,
        String mapSlug,
        Link region,
        List<Link> linked,
        List<Fact> facts,
        List<Section> sections,
        boolean toAll,
        List<String> recipients
) {
    public record Link(Long id, LoreKind kind, String name, String subtitle, String imageUrl) {}

    public record Fact(String label, String value) {}

    public record Section(Long id, String title, String body, boolean toAll, List<String> recipients) {}
}
