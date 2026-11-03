package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.MapRouteService;
import gusleite.runarcana_nexus.services.MapRouteService.RouteRequest;
import gusleite.runarcana_nexus.services.MapRouteService.RouteView;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Trajetórias que os jogadores desenham no mapa: só o dono edita; o mestre lê as de todos.
@RestController
@RequestMapping("/map/routes")
public class MapRouteController {

    private final MapRouteService routes;
    private final AuthService auth;

    public MapRouteController(MapRouteService routes, AuthService auth) {
        this.routes = routes;
        this.auth = auth;
    }

    @GetMapping
    public ResponseEntity<List<RouteView>> list(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                @RequestParam(required = false) String as) {
        if (as != null && !as.isBlank()) {
            auth.requireMaster(authorization);
            return ResponseEntity.ok(routes.preview(as));
        }
        return ResponseEntity.ok(routes.list(auth.authenticate(authorization)));
    }

    @PostMapping
    public ResponseEntity<RouteView> create(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                            @RequestBody RouteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(routes.create(auth.authenticate(authorization), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RouteView> update(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                            @PathVariable Long id, @RequestBody RouteRequest request) {
        return ResponseEntity.ok(routes.update(auth.authenticate(authorization), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                       @PathVariable Long id) {
        routes.delete(auth.authenticate(authorization), id);
        return ResponseEntity.noContent().build();
    }
}
