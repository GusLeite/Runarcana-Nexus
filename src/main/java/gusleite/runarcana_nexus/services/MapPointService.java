package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

// Pontos de interesse do mestre, comentários neles e waypoints dos jogadores.
@Service
public class MapPointService {

    static final int MAX_WAYPOINTS = 3;

    private final MapPoiRepository pois;
    private final PoiCommentRepository comments;
    private final MapWaypointRepository waypoints;
    private final LoreEntryRepository lore;
    private final RecipientResolver resolver;

    public MapPointService(MapPoiRepository pois, PoiCommentRepository comments, MapWaypointRepository waypoints,
                           LoreEntryRepository lore, RecipientResolver resolver) {
        this.pois = pois;
        this.comments = comments;
        this.waypoints = waypoints;
        this.lore = lore;
        this.resolver = resolver;
    }

    @Transactional(readOnly = true)
    public List<PoiResponse> listPois(Account viewer) {
        List<PoiComment> allComments = comments.findAllByOrderByCreatedAtAscIdAsc();
        return pois.findAll().stream()
                .filter(p -> RecipientResolver.reaches(viewer, p.isToAll(), p.getRecipients()))
                .map(p -> toResponse(viewer, p, allComments))
                .toList();
    }

    @Transactional
    public PoiResponse createPoi(Account master, PoiRequest request) {
        MapPoi poi = new MapPoi();
        fill(poi, request);
        return toResponse(master, pois.save(poi), List.of());
    }

    @Transactional
    public PoiResponse updatePoi(Account master, Long id, PoiRequest request) {
        MapPoi poi = findPoi(id);
        fill(poi, request);
        return toResponse(master, poi, comments.findAllByOrderByCreatedAtAscIdAsc());
    }

    @Transactional
    public void deletePoi(Long id) {
        MapPoi poi = findPoi(id);
        comments.deleteByPoi(poi);
        pois.delete(poi);
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
        poi.setToAll(r.toAll());
        poi.getRecipients().clear();
        poi.getRecipients().addAll(resolver.resolve(r.recipients()));
    }

    private PoiResponse toResponse(Account viewer, MapPoi p, List<PoiComment> all) {
        LoreEntry entry = p.getLoreEntry();
        Long entryId = entry != null && LoreService.canSee(viewer, entry) ? entry.getId() : null;
        List<PoiResponse.Comment> visible = all.stream()
                .filter(c -> c.getPoi().getId().equals(p.getId()))
                .filter(c -> c.isShared() || c.getAuthor().getId().equals(viewer.getId()))
                .map(c -> toComment(viewer, c))
                .toList();
        return new PoiResponse(p.getId(), p.getName(), p.getKind(), p.getDescription(), p.getX(), p.getY(), entryId,
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
