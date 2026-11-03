package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.BandleRollResponse;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.MapService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Mapa de Runeterra: todos veem onde Bandópolis está; só o mestre rola o dado.
@RestController
@RequestMapping("/map")
public class MapController {

    private final MapService map;
    private final AuthService auth;

    public MapController(MapService map, AuthService auth) {
        this.map = map;
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
}
