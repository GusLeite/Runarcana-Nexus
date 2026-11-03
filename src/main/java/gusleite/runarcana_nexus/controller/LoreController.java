package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.LoreEntryRequest;
import gusleite.runarcana_nexus.record.LoreEntryResponse;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.LoreService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Lore: cada conta recebe só o que conhece; só o mestre escreve.
@RestController
@RequestMapping("/lore")
public class LoreController {

    private final LoreService lore;
    private final AuthService auth;

    public LoreController(LoreService lore, AuthService auth) {
        this.lore = lore;
        this.auth = auth;
    }

    @GetMapping
    public ResponseEntity<List<LoreEntryResponse>> list(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(lore.list(auth.authenticate(authorization)));
    }

    @PostMapping
    public ResponseEntity<LoreEntryResponse> create(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                    @Valid @RequestBody LoreEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lore.create(auth.requireMaster(authorization), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LoreEntryResponse> update(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                    @PathVariable Long id, @Valid @RequestBody LoreEntryRequest request) {
        return ResponseEntity.ok(lore.update(auth.requireMaster(authorization), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                       @PathVariable Long id) {
        auth.requireMaster(authorization);
        lore.delete(id);
        return ResponseEntity.noContent().build();
    }
}
