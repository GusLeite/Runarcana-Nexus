package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.ArmorClassResponse;
import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.record.CharacterSheetResponse;
import gusleite.runarcana_nexus.record.CreateCharacterRequest;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.CharacterService;
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

    public CharacterController(CharacterService charService, AuthService authService) {
        this.charService = charService;
        this.authService = authService;
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

    @PostMapping
    public ResponseEntity<CharacterResponse> createCharacter(@Valid @RequestBody CreateCharacterRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(charService.createCharacter(request));
    }
}
