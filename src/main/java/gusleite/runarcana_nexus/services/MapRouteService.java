package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.map.MapRoute;
import gusleite.runarcana_nexus.repository.MapRouteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

// Trajetórias dos jogadores no mapa: cada um desenha as suas (paradas em ordem); o mestre lê as de todos.
@Service
public class MapRouteService {

    public static final int MAX_PER_PLAYER = 5;
    public static final int MIN_POINTS = 2;
    public static final int MAX_POINTS = 60;
    static final double LIMIT = 1024;

    private final MapRouteRepository routes;
    private final RecipientResolver resolver;

    public MapRouteService(MapRouteRepository routes, RecipientResolver resolver) {
        this.routes = routes;
        this.resolver = resolver;
    }

    public record Point(double x, double y) {}

    public record RouteRequest(String name, List<Point> points) {}

    public record RouteView(long id, String owner, String name, List<Point> points) {}

    // Jogador: as suas. Mestre: as de todos.
    @Transactional(readOnly = true)
    public List<RouteView> list(Account viewer) {
        List<MapRoute> all = viewer.isMaster() ? routes.findAllByOrderById() : routes.findByOwnerOrderById(viewer);
        return all.stream().map(MapRouteService::view).toList();
    }

    // Prévia do mestre ("Ver como"): só as do jogador.
    @Transactional(readOnly = true)
    public List<RouteView> preview(String username) {
        Account player = resolver.resolve(List.of(username)).stream().findFirst()
                .orElseThrow(() -> ApiException.badRequest("Escolha um jogador."));
        return routes.findByOwnerOrderById(player).stream().map(MapRouteService::view).toList();
    }

    @Transactional
    public RouteView create(Account owner, RouteRequest request) {
        if (owner.isMaster()) throw ApiException.badRequest("O mestre move o grupo; as trajetórias são dos jogadores.");
        if (routes.countByOwner(owner) >= MAX_PER_PLAYER) throw ApiException.badRequest("Cada jogador tem até " + MAX_PER_PLAYER + " trajetórias. Apague uma para criar outra.");
        MapRoute route = new MapRoute();
        route.setOwner(owner);
        route.setCreatedAt(Instant.now());
        fill(route, request);
        return view(routes.save(route));
    }

    @Transactional
    public RouteView update(Account owner, Long id, RouteRequest request) {
        MapRoute route = findOwn(owner, id);
        fill(route, request);
        return view(route);
    }

    @Transactional
    public void delete(Account owner, Long id) {
        routes.delete(findOwn(owner, id));
    }

    private MapRoute findOwn(Account owner, Long id) {
        return routes.findById(id)
                .filter(r -> r.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> ApiException.notFound("Trajetória não encontrada."));
    }

    private static void fill(MapRoute route, RouteRequest r) {
        String name = r == null || r.name() == null ? "" : r.name().trim();
        if (name.length() > 80) throw ApiException.badRequest("O nome pode ter até 80 caracteres.");
        List<Point> points = r == null || r.points() == null ? List.of() : r.points();
        if (points.size() < MIN_POINTS) throw ApiException.badRequest("Marque pelo menos " + MIN_POINTS + " pontos no mapa.");
        if (points.size() > MAX_POINTS) throw ApiException.badRequest("Uma trajetória tem até " + MAX_POINTS + " pontos.");
        StringBuilder path = new StringBuilder();
        for (Point p : points) {
            if (Math.abs(p.x()) > LIMIT || Math.abs(p.y()) > LIMIT) throw ApiException.badRequest("Há um ponto fora do mapa.");
            if (path.length() > 0) path.append(';');
            path.append(String.format(Locale.ROOT, "%.1f,%.1f", p.x(), p.y()));
        }
        route.setName(name.isEmpty() ? "Trajetória" : name);
        route.setPath(path.toString());
    }

    private static RouteView view(MapRoute r) {
        List<Point> points = Arrays.stream(r.getPath().split(";"))
                .map(s -> s.split(","))
                .map(xy -> new Point(Double.parseDouble(xy[0]), Double.parseDouble(xy[1])))
                .toList();
        return new RouteView(r.getId(), r.getOwner().getUsername(), r.getName(), points);
    }
}
