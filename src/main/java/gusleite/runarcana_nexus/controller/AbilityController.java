package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.AbilityIconRequest;
import gusleite.runarcana_nexus.record.AbilityRequest;
import gusleite.runarcana_nexus.record.AbilityResponse;
import gusleite.runarcana_nexus.record.AbilityUsesRequest;
import gusleite.runarcana_nexus.record.RestRequest;
import gusleite.runarcana_nexus.services.AbilityService;
import gusleite.runarcana_nexus.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/character")
public class AbilityController {

    private final AbilityService service;
    private final AuthService auth;

    public AbilityController(AbilityService service, AuthService auth) {
        this.service = service;
        this.auth = auth;
    }

    // Mestre: habilidades de qualquer personagem (para o painel do mestre).
    @GetMapping("/{characterId}/abilities")
    public ResponseEntity<List<AbilityResponse>> list(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long characterId) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(service.listFor(characterId));
    }

    // Mestre: cadastra uma magia/habilidade no personagem.
    @PostMapping("/{characterId}/abilities")
    public ResponseEntity<AbilityResponse> create(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long characterId,
            @Valid @RequestBody AbilityRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(characterId, request));
    }

    // Mestre: troca ou remove (icon nulo) o ícone de uma habilidade já cadastrada.
    @PatchMapping("/{characterId}/abilities/{abilityId}/icon")
    public ResponseEntity<AbilityResponse> setIcon(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long characterId,
            @PathVariable Long abilityId,
            @Valid @RequestBody AbilityIconRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(service.setIcon(characterId, abilityId, request.icon()));
    }

    @DeleteMapping("/{characterId}/abilities/{abilityId}")
    public ResponseEntity<Void> delete(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long characterId,
            @PathVariable Long abilityId) {
        auth.requireMaster(authorization);
        service.delete(characterId, abilityId);
        return ResponseEntity.noContent().build();
    }

    // Jogador: gasta ou recupera usos de uma habilidade do próprio personagem.
    @PatchMapping("/me/abilities/{abilityId}")
    public ResponseEntity<AbilityResponse> setUses(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long abilityId,
            @Valid @RequestBody AbilityUsesRequest request) {
        return ResponseEntity.ok(service.setUses(auth.authenticate(authorization), abilityId, request.usesLeft()));
    }

    @PostMapping("/me/rest")
    public ResponseEntity<List<AbilityResponse>> rest(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody RestRequest request) {
        return ResponseEntity.ok(service.rest(auth.authenticate(authorization), request.type()));
    }
}
