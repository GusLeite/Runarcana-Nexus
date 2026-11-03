package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.LoreKind;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.lore.LoreEntry;
import gusleite.runarcana_nexus.model.lore.LoreFact;
import gusleite.runarcana_nexus.model.lore.LoreSection;
import gusleite.runarcana_nexus.record.LoreEntryRequest;
import gusleite.runarcana_nexus.record.LoreEntryResponse;
import gusleite.runarcana_nexus.repository.LoreEntryRepository;
import gusleite.runarcana_nexus.repository.MapPoiRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// Lore da mesa. O filtro por personagem acontece aqui: o jogador nunca recebe o que não foi liberado para ele.
@Service
public class LoreService {

    private final LoreEntryRepository entries;
    private final MapPoiRepository pois;
    private final RecipientResolver resolver;

    public LoreService(LoreEntryRepository entries, MapPoiRepository pois, RecipientResolver resolver) {
        this.entries = entries;
        this.pois = pois;
        this.resolver = resolver;
    }

    // Vê o verbete quem o recebeu ou quem recebeu algum conhecimento dele.
    public static boolean canSee(Account account, LoreEntry entry) {
        return RecipientResolver.reaches(account, entry.isToAll(), entry.getRecipients())
                || entry.getSections().stream().anyMatch(s -> RecipientResolver.reaches(account, s.isToAll(), s.getRecipients()));
    }

    @Transactional(readOnly = true)
    public List<LoreEntryResponse> list(Account viewer) {
        List<LoreEntry> all = entries.findAll();
        return all.stream()
                .filter(e -> canSee(viewer, e))
                .sorted(Comparator.comparing(e -> e.getName().toLowerCase()))
                .map(e -> toResponse(viewer, e, all))
                .toList();
    }

    @Transactional
    public LoreEntryResponse create(Account master, LoreEntryRequest request) {
        LoreEntry entry = new LoreEntry();
        fill(entry, request);
        entries.saveAndFlush(entry);
        applyLinks(entry, request);
        return toResponse(master, entry, entries.findAll());
    }

    @Transactional
    public LoreEntryResponse update(Account master, Long id, LoreEntryRequest request) {
        LoreEntry entry = find(id);
        fill(entry, request);
        entries.flush();
        applyLinks(entry, request);
        return toResponse(master, entry, entries.findAll());
    }

    // Quem apontava para o verbete continua existindo, só perde o vínculo.
    @Transactional
    public void delete(Long id) {
        LoreEntry entry = find(id);
        entries.findByRegion(entry).forEach(child -> child.setRegion(null));
        pois.findByLoreEntry(entry).forEach(poi -> poi.setLoreEntry(null));
        entries.delete(entry);
    }

    private LoreEntry find(Long id) {
        return entries.findById(id).orElseThrow(() -> ApiException.notFound("Verbete não encontrado."));
    }

    private void fill(LoreEntry entry, LoreEntryRequest r) {
        entry.setKind(r.kind());
        entry.setName(r.name().trim());
        entry.setSubtitle(blankToNull(r.subtitle()));
        entry.setQuote(blankToNull(r.quote()));
        entry.setQuoteAuthor(blankToNull(r.quoteAuthor()));
        entry.setSummary(blankToNull(r.summary()));
        entry.setMapSummary(r.kind() == LoreKind.REGION ? blankToNull(r.mapSummary()) : null);
        // Link http(s) ou imagem enviada (data URL): cada uma na sua coluna, a outra zera.
        String image = ImageRules.clean(blankToNull(r.imageUrl()));
        boolean uploaded = image != null && image.startsWith("data:");
        entry.setImageUrl(uploaded ? null : image);
        entry.setImageData(uploaded ? image : null);
        entry.setMapSlug(r.kind() == LoreKind.REGION ? blankToNull(r.mapSlug()) : null);
        entry.setToAll(r.toAll());
        entry.getRecipients().clear();
        entry.getRecipients().addAll(resolver.resolve(r.recipients()));

        entry.getFacts().clear();
        if (r.facts() != null) r.facts().forEach(f -> entry.getFacts().add(new LoreFact(f.label().trim(), f.value().trim())));

        entry.getSections().clear();
        if (r.sections() != null) {
            for (LoreEntryRequest.Section s : r.sections()) {
                LoreSection section = new LoreSection();
                section.setEntry(entry);
                section.setTitle(s.title().trim());
                section.setBody(s.body() == null ? "" : s.body());
                section.setToAll(s.toAll());
                section.getRecipients().addAll(resolver.resolve(s.recipients()));
                entry.getSections().add(section);
            }
        }
    }

    // Personagem e lugar apontam para a região; a região escolhe quem pertence a ela pelo outro lado do mesmo vínculo.
    private void applyLinks(LoreEntry entry, LoreEntryRequest r) {
        if (entry.getKind() == LoreKind.REGION) {
            entry.setRegion(null);
            Set<Long> wanted = r.linkedIds() == null ? Set.of() : new HashSet<>(r.linkedIds());
            entries.findByRegion(entry).stream().filter(c -> !wanted.contains(c.getId())).forEach(c -> c.setRegion(null));
            for (Long id : wanted) {
                LoreEntry child = entries.findById(id)
                        .orElseThrow(() -> ApiException.badRequest("Verbete vinculado não encontrado."));
                if (child.getKind() == LoreKind.REGION) throw ApiException.badRequest("Só personagens e lugares podem ser vinculados a uma região.");
                child.setRegion(entry);
            }
            return;
        }
        entries.findByRegion(entry).forEach(c -> c.setRegion(null));
        if (r.regionId() == null) {
            entry.setRegion(null);
            return;
        }
        LoreEntry region = entries.findById(r.regionId())
                .orElseThrow(() -> ApiException.badRequest("Região não encontrada."));
        if (region.getKind() != LoreKind.REGION) throw ApiException.badRequest("O vínculo precisa ser com uma região.");
        entry.setRegion(region);
    }

    private LoreEntryResponse toResponse(Account viewer, LoreEntry e, List<LoreEntry> all) {
        LoreEntry region = e.getRegion();
        LoreEntryResponse.Link regionLink = region != null && canSee(viewer, region) ? link(region) : null;
        List<LoreEntryResponse.Link> linked = all.stream()
                .filter(c -> c.getRegion() != null && c.getRegion().getId().equals(e.getId()) && canSee(viewer, c))
                .sorted(Comparator.comparing(c -> c.getName().toLowerCase()))
                .map(LoreService::link)
                .toList();
        List<LoreEntryResponse.Section> sections = e.getSections().stream()
                .filter(s -> RecipientResolver.reaches(viewer, s.isToAll(), s.getRecipients()))
                .map(s -> new LoreEntryResponse.Section(s.getId(), s.getTitle(), s.getBody(), s.isToAll(), RecipientResolver.names(viewer, s.getRecipients())))
                .toList();
        List<LoreEntryResponse.Fact> facts = e.getFacts().stream().map(f -> new LoreEntryResponse.Fact(f.getLabel(), f.getValue())).toList();
        return new LoreEntryResponse(e.getId(), e.getKind(), e.getName(), e.getSubtitle(), e.getQuote(), e.getQuoteAuthor(), e.getSummary(), e.getMapSummary(),
                imageOf(e), e.getMapSlug(), regionLink, linked, facts, sections, e.isToAll(), RecipientResolver.names(viewer, e.getRecipients()));
    }

    private static String imageOf(LoreEntry e) {
        return e.getImageData() != null ? e.getImageData() : e.getImageUrl();
    }

    private static LoreEntryResponse.Link link(LoreEntry e) {
        return new LoreEntryResponse.Link(e.getId(), e.getKind(), e.getName(), e.getSubtitle(), imageOf(e));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
