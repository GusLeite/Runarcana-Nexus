package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.journal.JournalEntry;
import gusleite.runarcana_nexus.model.lore.LoreEntry;
import gusleite.runarcana_nexus.model.map.MapPoi;
import gusleite.runarcana_nexus.model.map.MapWaypoint;
import gusleite.runarcana_nexus.model.map.PoiComment;
import gusleite.runarcana_nexus.record.PoiCommentRequest;
import gusleite.runarcana_nexus.record.PoiRequest;
import gusleite.runarcana_nexus.record.PoiResponse;
import gusleite.runarcana_nexus.record.WaypointRequest;
import gusleite.runarcana_nexus.record.WaypointResponse;
import gusleite.runarcana_nexus.repository.LoreEntryRepository;
import gusleite.runarcana_nexus.repository.MapPoiRepository;
import gusleite.runarcana_nexus.repository.MapWaypointRepository;
import gusleite.runarcana_nexus.repository.PoiCommentRepository;
import gusleite.runarcana_nexus.repository.PartyTrailPointRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

// Pontos de interesse do mestre, comentários neles e waypoints dos jogadores.
@Service
public class MapPointService {

    static final int MAX_WAYPOINTS = 3;

    private final MapPoiRepository pois;
    private final PoiCommentRepository comments;
    private final MapWaypointRepository waypoints;
    private final LoreEntryRepository lore;
    private final RecipientResolver resolver;
    private final JournalService journal;
    private final PartyTrailPointRepository trail;

    public MapPointService(MapPoiRepository pois, PoiCommentRepository comments, MapWaypointRepository waypoints,
                           LoreEntryRepository lore, RecipientResolver resolver, JournalService journal, PartyTrailPointRepository trail) {
        this.trail = trail;
        this.journal = journal;
        this.pois = pois;
        this.comments = comments;
        this.waypoints = waypoints;
        this.lore = lore;
        this.resolver = resolver;
    }

    @Transactional(readOnly = true)
    public List<PoiResponse> listPois(Account viewer) {
        return list(viewer, comments.findAllByOrderByCreatedAtAscIdAsc());
    }

    // Prévia do mestre ("Ver como"): o que o jogador vê no mapa, sem as anotações privadas dele.
    @Transactional(readOnly = true)
    public List<PoiResponse> previewPois(String username) {
        return list(previewAs(username), comments.findAllByOrderByCreatedAtAscIdAsc().stream().filter(PoiComment::isShared).toList());
    }

    @Transactional(readOnly = true)
    public List<WaypointResponse> previewWaypoints(String username) {
        return waypoints.findByOwnerOrderById(previewAs(username)).stream().map(MapPointService::toResponse).toList();
    }

    private Account previewAs(String username) {
        return resolver.resolve(List.of(username)).stream().findFirst().orElseThrow(() -> ApiException.badRequest("Escolha um jogador."));
    }

    private List<PoiResponse> list(Account viewer, List<PoiComment> allComments) {
        Map<Long, Integer> counts = new HashMap<>();
        for (Object[] row : pois.countImages()) counts.put((Long) row[0], ((Number) row[1]).intValue());
        return pois.findAll().stream()
                .filter(p -> RecipientResolver.reaches(viewer, p.isToAll(), p.getRecipients()))
                .map(p -> toResponse(viewer, p, allComments, counts.getOrDefault(p.getId(), 0)))
                .toList();
    }

    @Transactional
    public PoiResponse createPoi(Account master, PoiRequest request) {
        MapPoi poi = new MapPoi();
        fill(poi, request);
        announce(poi, Audience.NOBODY);
        return toResponse(master, pois.save(poi), List.of(), 0);
    }

    @Transactional
    public PoiResponse updatePoi(Account master, Long id, PoiRequest request) {
        MapPoi poi = findPoi(id);
        Audience before = Audience.of(poi);
        fill(poi, request);
        announce(poi, before);
        return toResponse(master, poi, comments.findAllByOrderByCreatedAtAscIdAsc(), poi.getImages().size());
    }

    // Revelar (ou esconder) sem mexer no resto do ponto: toAll e/ou jogadores. Os dois vazios = só o mestre.
    @Transactional
    public PoiResponse setAudience(Account master, Long id, Boolean toAll, List<String> recipients) {
        MapPoi poi = findPoi(id);
        Audience before = Audience.of(poi);
        poi.setToAll(Boolean.TRUE.equals(toAll));
        poi.getRecipients().clear();
        poi.getRecipients().addAll(resolver.resolve(recipients));
        announce(poi, before);
        return toResponse(master, poi, comments.findAllByOrderByCreatedAtAscIdAsc(), poi.getImages().size());
    }

    public static final int MAX_IMAGES = 6;

    // Galeria do ponto: quem vê o ponto vê as imagens (o mestre sempre).
    @Transactional(readOnly = true)
    public List<String> images(Account viewer, Long id) {
        MapPoi poi = findPoi(id);
        if (!RecipientResolver.reaches(viewer, poi.isToAll(), poi.getRecipients())) throw ApiException.notFound("Ponto não encontrado.");
        return List.copyOf(poi.getImages());
    }

    @Transactional
    public PoiResponse addImage(Account master, Long id, String image) {
        MapPoi poi = findPoi(id);
        String clean = ImageRules.clean(image);
        if (clean == null) throw ApiException.badRequest("Escolha uma imagem ou cole um link.");
        if (poi.getImages().size() >= MAX_IMAGES) throw ApiException.badRequest("Cada ponto guarda até " + MAX_IMAGES + " imagens. Apague uma para enviar outra.");
        poi.getImages().add(clean);
        return toResponse(master, poi, comments.findAllByOrderByCreatedAtAscIdAsc(), poi.getImages().size());
    }

    @Transactional
    public PoiResponse removeImage(Account master, Long id, int index) {
        MapPoi poi = findPoi(id);
        if (index < 0 || index >= poi.getImages().size()) throw ApiException.notFound("Imagem não encontrada.");
        poi.getImages().remove(index);
        poi.setSpotlight(null);
        return toResponse(master, poi, comments.findAllByOrderByCreatedAtAscIdAsc(), poi.getImages().size());
    }

    // MOSTRAR À MESA: sobe a revisão, e os jogadores que veem o ponto abrem a imagem na tela.
    @Transactional
    public PoiResponse showImage(Account master, Long id, int index) {
        MapPoi poi = findPoi(id);
        if (index < 0 || index >= poi.getImages().size()) throw ApiException.notFound("Imagem não encontrada.");
        poi.setSpotlight(index);
        poi.setSpotlightRev((poi.getSpotlightRev() == null ? 0 : poi.getSpotlightRev()) + 1);
        return toResponse(master, poi, comments.findAllByOrderByCreatedAtAscIdAsc(), poi.getImages().size());
    }

    // Paradas da trilha a até este tanto de unidades do ponto contam como "o grupo esteve aqui".
    public static final int NEAR = 60;

    public record History(List<JournalService.JournalView> entries, List<MapPartyService.TrailPoint> stops) {}

    // O que aconteceu ali: entradas e eventos do diário ligados ao ponto e as paradas da viagem perto dele.
    @Transactional(readOnly = true)
    public History history(Account viewer, Long id) {
        MapPoi poi = findPoi(id);
        if (!RecipientResolver.reaches(viewer, poi.isToAll(), poi.getRecipients())) throw ApiException.notFound("Ponto não encontrado.");
        List<MapPartyService.TrailPoint> stops = trail.findAllByOrderByIdAsc().stream()
                .filter(t -> Math.hypot(t.getX() - poi.getX(), t.getY() - poi.getY()) <= NEAR)
                .map(t -> new MapPartyService.TrailPoint(t.getX(), t.getY(), t.getLabel(), t.getCreatedAt()))
                .toList();
        return new History(journal.about(viewer, poi), stops);
    }

    // Leve, para a ficha avisar de local novo: só id e nome do que a conta vê.
    public record VisiblePoi(long id, String name) {}

    @Transactional(readOnly = true)
    public List<VisiblePoi> visible(Account viewer) {
        return pois.findAll().stream()
                .filter(p -> RecipientResolver.reaches(viewer, p.isToAll(), p.getRecipients()))
                .map(p -> new VisiblePoi(p.getId(), p.getName()))
                .toList();
    }

    @Transactional
    public void deletePoi(Long id) {
        MapPoi poi = findPoi(id);
        if (poi.getOfficialKey() != null) throw ApiException.badRequest("Lugares do mapa oficial não se apagam: esconda para os jogadores.");
        comments.deleteByPoi(poi);
        journal.unlinkPoi(poi);
        pois.delete(poi);
    }

    // Liga ou desliga, de uma vez, os lugares oficiais (de uma região ou de todas) para a mesa inteira. Sem aviso no diário.
    @Transactional
    public int setOfficialAudience(String region, boolean toAll) {
        int changed = 0;
        for (MapPoi poi : pois.findByOfficialKeyIsNotNull()) {
            if (region != null && !region.isBlank() && !region.equals(poi.getRegionSlug())) continue;
            if (poi.isToAll() != toAll) changed++;
            poi.setToAll(toAll);
        }
        return changed;
    }

    @Transactional
    public PoiResponse.Comment addComment(Account author, Long poiId, PoiCommentRequest request) {
        MapPoi poi = findPoi(poiId);
        if (!RecipientResolver.reaches(author, poi.isToAll(), poi.getRecipients())) throw ApiException.notFound("Ponto não encontrado.");
        PoiComment comment = new PoiComment();
        comment.setPoi(poi);
        comment.setAuthor(author);
        comment.setText(request.text().trim());
        comment.setShared(request.shared());
        comment.setCreatedAt(Instant.now());
        return toComment(author, comments.save(comment));
    }

    // O autor apaga o seu; o mestre modera o que a mesa vê.
    @Transactional
    public void deleteComment(Account account, Long id) {
        PoiComment comment = comments.findById(id).orElseThrow(() -> ApiException.notFound("Comentário não encontrado."));
        boolean mine = comment.getAuthor().getId().equals(account.getId());
        if (!mine && !(account.isMaster() && comment.isShared())) throw ApiException.notFound("Comentário não encontrado.");
        comments.delete(comment);
    }

    // Quem via o ponto antes de uma mudança (para saber se ele foi revelado a mais gente).
    private record Audience(boolean toAll, Set<Long> ids) {
        static final Audience NOBODY = new Audience(false, Set.of());

        static Audience of(MapPoi p) {
            return new Audience(p.isToAll(), p.getRecipients().stream().map(Account::getId).collect(Collectors.toSet()));
        }
    }

    // Diário: revelado a todos mostra o nome; revelado a alguns, só a quem (o nome continua segredo para o resto da mesa).
    private void announce(MapPoi poi, Audience before) {
        if (before.toAll()) return;
        if (poi.isToAll()) {
            journal.record(JournalEntry.Kind.PLACE, JournalService.MASTER_NAME, "Novo local revelado: " + poi.getName(), poi);
            return;
        }
        List<String> added = poi.getRecipients().stream().filter(a -> !before.ids().contains(a.getId())).map(Account::getUsername).sorted().toList();
        if (!added.isEmpty()) journal.record(JournalEntry.Kind.PLACE, JournalService.MASTER_NAME, "Novo local revelado a " + String.join(", ", added), poi);
    }

    private MapPoi findPoi(Long id) {
        return pois.findById(id).orElseThrow(() -> ApiException.notFound("Ponto não encontrado."));
    }

    private void fill(MapPoi poi, PoiRequest r) {
        poi.setName(r.name().trim());
        poi.setKind(r.kind());
        poi.setDescription(r.description() == null || r.description().isBlank() ? null : r.description());
        poi.setX(r.x());
        poi.setY(r.y());
        LoreEntry entry = r.loreEntryId() == null ? null : lore.findById(r.loreEntryId())
                .orElseThrow(() -> ApiException.badRequest("Verbete da lore não encontrado."));
        poi.setLoreEntry(entry);
        poi.setSecretNotes(r.secretNotes() == null || r.secretNotes().isBlank() ? null : r.secretNotes());
        poi.setToAll(r.toAll());
        poi.getRecipients().clear();
        poi.getRecipients().addAll(resolver.resolve(r.recipients()));
    }

    private PoiResponse toResponse(Account viewer, MapPoi p, List<PoiComment> all, int imageCount) {
        LoreEntry entry = p.getLoreEntry();
        Long entryId = entry != null && LoreService.canSee(viewer, entry) ? entry.getId() : null;
        List<PoiResponse.Comment> visible = all.stream()
                .filter(c -> c.getPoi().getId().equals(p.getId()))
                .filter(c -> c.isShared() || c.getAuthor().getId().equals(viewer.getId()))
                .map(c -> toComment(viewer, c))
                .toList();
        return new PoiResponse(p.getId(), p.getName(), p.getKind(), p.getDescription(), p.getX(), p.getY(), entryId,
                viewer.isMaster() ? p.getSecretNotes() : null, p.getOfficialKey() != null, p.getOfficialKey(), p.getRegionSlug(), imageCount, p.getSpotlight(), p.getSpotlightRev() == null ? 0 : p.getSpotlightRev(),
                p.isToAll(), RecipientResolver.names(viewer, p.getRecipients()), visible);
    }

    private static PoiResponse.Comment toComment(Account viewer, PoiComment c) {
        return new PoiResponse.Comment(c.getId(), c.getAuthor().getUsername(), c.getText(), c.isShared(),
                c.getAuthor().getId().equals(viewer.getId()), c.getCreatedAt());
    }

    // Jogador: os seus. Mestre: os de todos, para preparar a sessão.
    @Transactional(readOnly = true)
    public List<WaypointResponse> listWaypoints(Account viewer) {
        List<MapWaypoint> list = viewer.isMaster() ? waypoints.findAll() : waypoints.findByOwnerOrderById(viewer);
        return list.stream().map(MapPointService::toResponse).toList();
    }

    @Transactional
    public WaypointResponse createWaypoint(Account owner, WaypointRequest request) {
        if (owner.isMaster()) throw ApiException.badRequest("O mestre cria pontos de interesse, não waypoints.");
        if (waypoints.countByOwner(owner) >= MAX_WAYPOINTS) throw ApiException.badRequest("Cada jogador tem até " + MAX_WAYPOINTS + " waypoints. Apague um para criar outro.");
        MapWaypoint waypoint = new MapWaypoint();
        waypoint.setOwner(owner);
        fill(waypoint, request);
        return toResponse(waypoints.save(waypoint));
    }

    @Transactional
    public WaypointResponse updateWaypoint(Account owner, Long id, WaypointRequest request) {
        MapWaypoint waypoint = findOwn(owner, id);
        fill(waypoint, request);
        return toResponse(waypoint);
    }

    @Transactional
    public void deleteWaypoint(Account owner, Long id) {
        waypoints.delete(findOwn(owner, id));
    }

    private MapWaypoint findOwn(Account owner, Long id) {
        return waypoints.findById(id)
                .filter(w -> w.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> ApiException.notFound("Waypoint não encontrado."));
    }

    private static void fill(MapWaypoint waypoint, WaypointRequest r) {
        waypoint.setName(r.name().trim());
        waypoint.setComment(r.comment() == null || r.comment().isBlank() ? null : r.comment());
        waypoint.setX(r.x());
        waypoint.setY(r.y());
    }

    private static WaypointResponse toResponse(MapWaypoint w) {
        return new WaypointResponse(w.getId(), w.getOwner().getUsername(), w.getName(), w.getComment(), w.getX(), w.getY());
    }
}
