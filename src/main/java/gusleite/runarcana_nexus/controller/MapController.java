package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.BandleRollResponse;
import gusleite.runarcana_nexus.record.PoiCommentRequest;
import gusleite.runarcana_nexus.record.PoiRequest;
import gusleite.runarcana_nexus.record.PoiResponse;
import gusleite.runarcana_nexus.record.WaypointRequest;
import gusleite.runarcana_nexus.record.WaypointResponse;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.MapPartyService;
import gusleite.runarcana_nexus.services.MapPartyService.MoveRequest;
import gusleite.runarcana_nexus.services.MapPartyService.PartyView;
import gusleite.runarcana_nexus.services.MapPointService;
import gusleite.runarcana_nexus.services.MapService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Mapa de Runeterra: Bandópolis, pontos de interesse do mestre, waypoints dos jogadores e o grupo (marcador, trilha e névoa).
@RestController
@RequestMapping("/map")
public class MapController {

    private final MapService map;
    private final MapPointService points;
    private final MapPartyService party;
    private final AuthService auth;

    public MapController(MapService map, MapPointService points, MapPartyService party, AuthService auth) {
        this.party = party;
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
    public ResponseEntity<List<PoiResponse>> pois(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                  @RequestParam(required = false) String as) {
        if (as != null && !as.isBlank()) {
            auth.requireMaster(authorization);
            return ResponseEntity.ok(points.previewPois(as));
        }
        return ResponseEntity.ok(points.listPois(auth.authenticate(authorization)));
    }

    // Lista leve (id e nome) do que a conta vê: a ficha confere para avisar de local novo.
    @GetMapping("/pois/visible")
    public ResponseEntity<List<MapPointService.VisiblePoi>> visiblePois(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(points.visible(auth.authenticate(authorization)));
    }

    public record AudienceRequest(Boolean toAll, List<String> recipients) {}

    public record OfficialAudienceRequest(String region, boolean toAll) {}

    // Liga ou desliga os lugares oficiais (de uma região ou de todos) para os jogadores.
    @PatchMapping("/pois/official/audience")
    public ResponseEntity<Map<String, Integer>> officialAudience(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                                 @RequestBody OfficialAudienceRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(Map.of("changed", points.setOfficialAudience(request.region(), request.toAll())));
    }

    // Revela ou esconde o ponto sem o formulário inteiro.
    @PatchMapping("/pois/{id}/audience")
    public ResponseEntity<PoiResponse> setAudience(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                   @PathVariable Long id, @RequestBody AudienceRequest request) {
        return ResponseEntity.ok(points.setAudience(auth.requireMaster(authorization), id, request.toAll(), request.recipients()));
    }

    public record ImageRequest(String image) {}

    public record ShowImageRequest(int index) {}

    @GetMapping("/pois/{id}/history")
    public ResponseEntity<MapPointService.History> poiHistory(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                              @PathVariable Long id) {
        return ResponseEntity.ok(points.history(auth.authenticate(authorization), id));
    }

    @GetMapping("/pois/{id}/images")
    public ResponseEntity<List<String>> poiImages(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                  @PathVariable Long id) {
        return ResponseEntity.ok(points.images(auth.authenticate(authorization), id));
    }

    @PostMapping("/pois/{id}/images")
    public ResponseEntity<PoiResponse> addPoiImage(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                   @PathVariable Long id, @RequestBody ImageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(points.addImage(auth.requireMaster(authorization), id, request.image()));
    }

    @DeleteMapping("/pois/{id}/images/{index}")
    public ResponseEntity<PoiResponse> removePoiImage(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                      @PathVariable Long id, @PathVariable int index) {
        return ResponseEntity.ok(points.removeImage(auth.requireMaster(authorization), id, index));
    }

    // MOSTRAR À MESA.
    @PostMapping("/pois/{id}/spotlight")
    public ResponseEntity<PoiResponse> showPoiImage(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                    @PathVariable Long id, @RequestBody ShowImageRequest request) {
        return ResponseEntity.ok(points.showImage(auth.requireMaster(authorization), id, request.index()));
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
    public ResponseEntity<List<WaypointResponse>> waypoints(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                            @RequestParam(required = false) String as) {
        if (as != null && !as.isBlank()) {
            auth.requireMaster(authorization);
            return ResponseEntity.ok(points.previewWaypoints(as));
        }
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

    // ---------- O grupo no mapa (todos leem; só o mestre muda) ----------

    @GetMapping("/party")
    public ResponseEntity<PartyView> party(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.authenticate(authorization);
        return ResponseEntity.ok(party.view());
    }

    @PutMapping("/party")
    public ResponseEntity<PartyView> moveParty(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                               @RequestBody MoveRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(party.move(request));
    }

    @DeleteMapping("/party")
    public ResponseEntity<PartyView> hideParty(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(party.hide());
    }

    @DeleteMapping("/party/trail")
    public ResponseEntity<PartyView> clearTrail(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(party.clearTrail());
    }

    public record FogRequest(Boolean enabled) {}

    public record RevealRequest(Boolean revealed) {}

    @PutMapping("/fog")
    public ResponseEntity<PartyView> setFog(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                            @RequestBody FogRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(party.setFog(request.enabled()));
    }

    @PutMapping("/fog/{slug}")
    public ResponseEntity<PartyView> reveal(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                            @PathVariable String slug, @RequestBody RevealRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(party.reveal(slug, request.revealed()));
    }
}
