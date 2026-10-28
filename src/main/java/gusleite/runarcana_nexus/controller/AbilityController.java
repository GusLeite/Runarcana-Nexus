package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.AbilityIconRequest;
import gusleite.runarcana_nexus.record.AbilityRequest;
import gusleite.runarcana_nexus.record.AbilityResponse;
import gusleite.runarcana_nexus.enums.RestType;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.record.AbilityUsesRequest;
import gusleite.runarcana_nexus.record.CastRequest;
import gusleite.runarcana_nexus.record.CastResponse;
import gusleite.runarcana_nexus.record.PreparationResponse;
import gusleite.runarcana_nexus.record.RestRequest;
import gusleite.runarcana_nexus.services.AbilityService;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.CreationService;
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
    private final CreationService creation;

    public AbilityController(AbilityService service, AuthService auth, CreationService creation) {
        this.service = service;
        this.auth = auth;
        this.creation = creation;
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

    // Mestre: edita uma magia/habilidade (mantém o ícone, se não vier outro, e os usos gastos).
    @PutMapping("/{characterId}/abilities/{abilityId}")
    public ResponseEntity<AbilityResponse> update(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long characterId,
            @PathVariable Long abilityId,
            @Valid @RequestBody AbilityRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(service.update(characterId, abilityId, request));
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

    // Jogador: conjura uma magia no nível escolhido, gastando a Mana (ou um uso próprio da magia).
    @PostMapping("/me/abilities/{abilityId}/cast")
    public ResponseEntity<CastResponse> cast(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long abilityId,
            @RequestBody(required = false) CastRequest request) {
        return ResponseEntity.ok(service.cast(auth.authenticate(authorization), abilityId, request == null ? null : request.level()));
    }

    @PostMapping("/me/rest")
    public ResponseEntity<List<AbilityResponse>> rest(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody RestRequest request) {
        Account account = auth.authenticate(authorization);
        // No descanso longo, troca as magias preparadas antes de recuperar os usos (erro = não descansa).
        if (request.type() == RestType.LONG && request.prepared() != null) creation.prepare(account, request.prepared());
        return ResponseEntity.ok(service.rest(account, request.type()));
    }

    // Jogador: o que dá para preparar (Acólito, Xamã) e o que está preparado. Vazio se a ficha não prepara magias.
    @GetMapping("/me/preparation")
    public ResponseEntity<PreparationResponse> preparation(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(creation.preparation(auth.authenticate(authorization)));
    }
}
