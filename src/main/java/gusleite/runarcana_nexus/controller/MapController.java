package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.BandleRollResponse;
import gusleite.runarcana_nexus.record.PoiCommentRequest;
import gusleite.runarcana_nexus.record.PoiRequest;
import gusleite.runarcana_nexus.record.PoiResponse;
import gusleite.runarcana_nexus.record.WaypointRequest;
import gusleite.runarcana_nexus.record.WaypointResponse;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.MapPointService;
import gusleite.runarcana_nexus.services.MapService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Mapa de Runeterra: Bandópolis, pontos de interesse do mestre e waypoints dos jogadores.
@RestController
@RequestMapping("/map")
public class MapController {

    private final MapService map;
    private final MapPointService points;
    private final AuthService auth;

    public MapController(MapService map, MapPointService points, AuthService auth) {
        this.map = map;
        this.points = points;
        this.auth = auth;
    }

    @GetMapping("/bandle")
    public ResponseEntity<BandleRollResponse> bandle(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.authenticate(authorization);
        return ResponseEntity.ok(map.bandle());
    }

    @PostMapping("/bandle/roll")
    public ResponseEntity<BandleRollResponse> rollBandle(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(map.rollBandle());
    }

    @GetMapping("/pois")
    public ResponseEntity<List<PoiResponse>> pois(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(points.listPois(auth.authenticate(authorization)));
    }

    @PostMapping("/pois")
    public ResponseEntity<PoiResponse> createPoi(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                 @Valid @RequestBody PoiRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(points.createPoi(auth.requireMaster(authorization), request));
    }

    @PutMapping("/pois/{id}")
    public ResponseEntity<PoiResponse> updatePoi(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                 @PathVariable Long id, @Valid @RequestBody PoiRequest request) {
        return ResponseEntity.ok(points.updatePoi(auth.requireMaster(authorization), id, request));
    }

    @DeleteMapping("/pois/{id}")
    public ResponseEntity<Void> deletePoi(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                          @PathVariable Long id) {
        auth.requireMaster(authorization);
        points.deletePoi(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/pois/{id}/comments")
    public ResponseEntity<PoiResponse.Comment> addComment(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                          @PathVariable Long id, @Valid @RequestBody PoiCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(points.addComment(auth.authenticate(authorization), id, request));
    }

    @DeleteMapping("/pois/comments/{id}")
    public ResponseEntity<Void> deleteComment(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                              @PathVariable Long id) {
        points.deleteComment(auth.authenticate(authorization), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/waypoints")
    public ResponseEntity<List<WaypointResponse>> waypoints(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(points.listWaypoints(auth.authenticate(authorization)));
    }

    @PostMapping("/waypoints")
    public ResponseEntity<WaypointResponse> createWaypoint(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                           @Valid @RequestBody WaypointRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(points.createWaypoint(auth.authenticate(authorization), request));
    }

    @PutMapping("/waypoints/{id}")
    public ResponseEntity<WaypointResponse> updateWaypoint(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                           @PathVariable Long id, @Valid @RequestBody WaypointRequest request) {
        return ResponseEntity.ok(points.updateWaypoint(auth.authenticate(authorization), id, request));
    }

    @DeleteMapping("/waypoints/{id}")
    public ResponseEntity<Void> deleteWaypoint(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                               @PathVariable Long id) {
        points.deleteWaypoint(auth.authenticate(authorization), id);
        return ResponseEntity.noContent().build();
    }
}
