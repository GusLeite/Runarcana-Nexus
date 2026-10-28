package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.ArmorClassResponse;
import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.record.CharacterSheetResponse;
import gusleite.runarcana_nexus.record.CreateCharacterRequest;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.CharacterService;
import gusleite.runarcana_nexus.services.ConditionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/character")
public class CharacterController {

    private final CharacterService charService;
    private final AuthService authService;

    private final ConditionService conditions;

    public CharacterController(CharacterService charService, AuthService authService, ConditionService conditions) {
        this.charService = charService;
        this.authService = authService;
        this.conditions = conditions;
    }

    @GetMapping
    public ResponseEntity<List<CharacterResponse>> getAllCharacters() {
        return ResponseEntity.ok(charService.getAllCharacters());
    }

    // Ficha do personagem da conta logada (tela pós-login).
    @GetMapping("/me")
    public ResponseEntity<CharacterSheetResponse> getMySheet(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(charService.getSheet(authService.authenticate(authorization)));
    }

    // Defesa em uso na ficha (sem armadura, uma CA alternativa ou uma armadura do inventário).
    @PatchMapping("/me/defense")
    public ResponseEntity<ArmorClassResponse> chooseDefense(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody DefenseRequest request) {
        return ResponseEntity.ok(charService.chooseDefense(authService.authenticate(authorization), request.key()));
    }

    public record DefenseRequest(String key) {}

    // Escudo em uso ("NONE" = sem escudo, ou "ITEM:<id>" de um escudo do inventário).
    @PatchMapping("/me/shield")
    public ResponseEntity<ArmorClassResponse> chooseShield(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody DefenseRequest request) {
        return ResponseEntity.ok(charService.chooseShield(authService.authenticate(authorization), request.key()));
    }

    // Jogador: PV atual (0 até o máximo) e PV temporários (0 ou mais) da própria ficha.
    @PatchMapping("/me/hp")
    public ResponseEntity<CharacterResponse> setHp(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody HpRequest request) {
        return ResponseEntity.ok(charService.setHp(authService.authenticate(authorization), request.currentHp(), request.tempHp()));
    }

    // tempHp nulo = mantém o que já tem.
    public record HpRequest(Integer currentHp, Integer tempHp) {}

    // Jogador: marca os próprios testes contra a morte (0–3 sucessos e falhas).
    @PatchMapping("/me/death-saves")
    public ResponseEntity<CharacterResponse> setMyDeathSaves(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody DeathSavesRequest request) {
        return ResponseEntity.ok(conditions.setDeathSaves(charService.characterOf(authService.authenticate(authorization)),
                request.successes(), request.failures()));
    }

    // Mestre: ajusta os testes contra a morte de qualquer ficha.
    @PatchMapping("/{id}/death-saves")
    public ResponseEntity<CharacterResponse> setDeathSaves(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable long id,
            @RequestBody DeathSavesRequest request) {
        authService.requireMaster(authorization);
        return ResponseEntity.ok(conditions.setDeathSaves(id, request.successes(), request.failures()));
    }

    public record DeathSavesRequest(Integer successes, Integer failures) {}

    // Mestre: condições (ids do rules/condicoes.json; a lista substitui a atual) e Exaustão (0–10). Nulos = mantém.
    @PatchMapping("/{id}/conditions")
    public ResponseEntity<CharacterResponse> setConditions(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable long id,
            @RequestBody ConditionsRequest request) {
        authService.requireMaster(authorization);
        return ResponseEntity.ok(conditions.setConditions(id, request.conditions(), request.exhaustion()));
    }

    public record ConditionsRequest(List<String> conditions, Integer exhaustion) {}

    @PostMapping
    public ResponseEntity<CharacterResponse> createCharacter(@Valid @RequestBody CreateCharacterRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(charService.createCharacter(request));
    }
}
